'use client';

// ✅ 这个组件拿得到 thread runtime：在“消息完成/变化”后更可靠地保存 repo
import { AssistantRuntimeProvider, useThreadRuntime } from '@assistant-ui/react';
import { AssistantChatTransport, useChatRuntime } from '@assistant-ui/react-ai-sdk';
import type { UIMessage } from 'ai';
import { useParams } from 'next/navigation';
import React, { useEffect } from 'react';

import { Thread } from '@/components/assistant-ui/thread';
import { saveThreadRepo, ThreadPersistence } from '@/features/chat/thread-persistence';
import { deriveTitleFromUserText, ensureThread, upsertThread } from '@/features/chat/thread-store';

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
  const params = useParams<{ threadId: string }>();
  const threadId = String(params.threadId);

  useEffect(() => {
    ensureThread(threadId);
  }, [threadId]);

  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: '/api/chat',
      fetch: (input, init) => fetch(input, { ...init, credentials: 'include' }),
    }),

    // ✅ 每次 assistant 完成：立刻把 thread repo 落盘 + 更新 sidebar title/updatedAt
    onFinish: (message) => {
      try {
        // thread export 只能在 Provider 内拿到 thread runtime；
        // 所以这里我们只更新时间与标题，repo 落盘放到下面“RepoSaver”组件里
        const titleText = getFirstUserText(message ? message.messages : []);
        upsertThread({
          id: threadId,
          title: titleText ? deriveTitleFromUserText(titleText) : undefined,
          updatedAt: Date.now(),
        });
      } catch (e) {
        console.error('[chat] onFinish failed', e);
      }
    },

    onError: (e) => {
      console.error('[chat] runtime error', e);
      upsertThread({ id: threadId, updatedAt: Date.now() });
    },
  });

  return (
    <div className="flex size-full justify-center overflow-hidden">
      <div className="flex size-full max-w-7xl flex-col">
        <AssistantRuntimeProvider runtime={runtime}>
          <ThreadPersistence threadId={threadId} />
          <RepoSaver threadId={threadId} />
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
