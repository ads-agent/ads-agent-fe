'use client';

// ✅ 这个组件拿得到 thread runtime：在“消息完成/变化”后更可靠地保存 repo
import { AssistantRuntimeProvider, useThreadRuntime } from '@assistant-ui/react';
import { AssistantChatTransport, useChatRuntime } from '@assistant-ui/react-ai-sdk';
import type { UIMessage } from 'ai';
import { useParams, usePathname } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { z } from 'zod';

import { Thread } from '@/components/assistant-ui/thread';
import { saveThreadRepo, ThreadPersistence } from '@/features/chat/thread-persistence';
import { deriveTitleFromUserText, ensureThread, listThreads, upsertThread } from '@/features/chat/thread-store';

const _MessageMetadataSchema = z.object({
  thread_id: z.string().optional(),
  run_id: z.string().optional(),
});

function getFirstUserText(messages: UIMessage[]) {
  for (const m of messages) {
    if (m.role !== 'user') {
      continue;
    }
    for (const p of m.parts ?? []) {
      if (p.type === 'text' && typeof (p as any).text === 'string') {
        const t = (p as any).text.trim();
        if (t) {
          return t;
        }
      }
    }
  }
  return null;
}

export default function ChatThreadPage() {
  const params = useParams<{ locale: string; threadId?: string | string[] }>();
  const pathname = usePathname();
  // Next.js optional catch-all params: /chat -> undefined, /chat/id -> ['id']
  const initialId = Array.isArray(params.threadId) ? params.threadId[0] : undefined;

  const [activeThreadId, setActiveThreadId] = useState<string | undefined>(initialId);
  const threadIdRef = useRef<string | undefined>(initialId);

  // Sync ref with state for use in the stable fetch closure
  useEffect(() => {
    threadIdRef.current = activeThreadId;
    if (activeThreadId) {
      ensureThread(activeThreadId);
    }
  }, [activeThreadId]);

  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: '/api/chat',
      fetch: async (_input, init) => {
        let body;
        try {
          body = JSON.parse(init?.body as string);
        } catch {
          body = {};
        }

        if (threadIdRef.current) {
          body.threadId = threadIdRef.current;
        }

        // Use absolute URL to avoid locale-prefix 404s
        const url = new URL('/api/chat', window.location.origin).toString();

        const res = await fetch(url, {
          ...init,
          headers: {
            ...init?.headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          credentials: 'include',
        });

        if (!res.ok) {
          console.error(`[chat] API error: ${res.status} ${res.statusText}`);
          if (res.status === 404) {
            throw new Error(`Not Found: ${url}`);
          }
        }

        return res;
      },
    }),

    messageMetadataSchema: _MessageMetadataSchema,

    // ✅ 每次 assistant 完成：立刻把 thread repo 落盘 + 更新 sidebar title/updatedAt
    onFinish: (message) => {
      try {
        let isNewThread = false;
        if (message?.message?.metadata) {
          const metadata = message?.message?.metadata as z.infer<typeof _MessageMetadataSchema>;
          const threadIdFromMetadata = metadata?.thread_id;
          if (threadIdFromMetadata) {
            threadIdRef.current = threadIdFromMetadata;
            setActiveThreadId(threadIdFromMetadata);

            // Update URL without page reload/remount
            const newPath = pathname.endsWith('/chat')
              ? `${pathname}/${threadIdFromMetadata}`
              : pathname.replace(/\/chat\/[^/]+/, `/chat/${threadIdFromMetadata}`);
            window.history.replaceState({}, '', newPath);

            isNewThread = (listThreads().findIndex(t => t.id === threadIdFromMetadata) <= 0);
          }
        }

        const currentId = threadIdRef.current;
        if (!currentId) {
          return;
        }

        // thread export 只能在 Provider 内拿到 thread runtime；
        // 所以这里我们只更新时间与标题，repo 落盘放到下面“RepoSaver”组件里
        const titleText = getFirstUserText(message ? message.messages : []);
        upsertThread({
          id: currentId,
          title: titleText ? deriveTitleFromUserText(titleText) : undefined,
          updatedAt: Date.now(),
        });

        if (isNewThread) {
          // Trigger storage event for current window (it normally only fires in other tabs)
          window.dispatchEvent(new StorageEvent('storage', { key: 'chat_threads_v1' }));
        }
      } catch (e) {
        console.error('[chat] onFinish failed', e);
      }
    },

    onError: (e) => {
      const currentId = threadIdRef.current;
      console.error('[chat] runtime error', e);

      if (currentId) {
        upsertThread({ id: currentId, updatedAt: Date.now() });
      }
    },
  });

  return (
    <div className="flex size-full justify-center overflow-hidden">
      <div className="flex size-full max-w-7xl flex-col">
        <AssistantRuntimeProvider runtime={runtime}>
          {activeThreadId && (
            <>
              <ThreadPersistence threadId={activeThreadId} />
              <RepoSaver threadId={activeThreadId} />
            </>
          )}
          <Thread />
        </AssistantRuntimeProvider>
      </div>
    </div>
  );
}

function RepoSaver({ threadId }: { threadId: string }) {
  const thread = useThreadRuntime();

  useEffect(() => {
    const unsub = thread.subscribe(() => {
      // 只要 state 变化就更新 updatedAt（轻量）
      upsertThread({ id: threadId, updatedAt: Date.now() });
    });

    return () => unsub();
  }, [thread, threadId]);

  useEffect(() => {
    // 监听“run 结束”最稳：subscribe 后看 isRunning 变化
    let lastRunning = thread.getState().isRunning;

    const unsub = thread.subscribe(() => {
      const s = thread.getState();
      if (lastRunning && !s.isRunning) {
        // ✅ 一轮流结束：立刻保存 repo（比 debounce 稳）
        try {
          saveThreadRepo(threadId, thread.export());
        } catch (e) {
          console.error('[chat] export failed (run-end)', { threadId, e });
        }
      }
      lastRunning = s.isRunning;
    });

    return () => unsub();
  }, [thread, threadId]);

  return null;
}
