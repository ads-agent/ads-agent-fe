'use client';

import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { AssistantChatTransport, useChatRuntime } from '@assistant-ui/react-ai-sdk';
import { UserButton } from '@clerk/nextjs';
import type { UIMessage } from 'ai';
import { AssistantCloud } from 'assistant-cloud';
import {
  LayoutDashboard,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';

import { ThreadList } from '@/components/assistant-ui/thread-list';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  deriveTitleFromUserText,
  listThreads,
  upsertThread,
} from '@/features/chat/thread-store';
import { Env } from '@/libs/Env';

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

function getActiveThreadId(pathname: string | null) {
  if (!pathname) {
    return null;
  }
  const m = pathname.match(/\/chat\/([^/]+)/);
  return m?.[1] ?? null;
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

  // Determine mode
  const useCustom = Env.NEXT_PUBLIC_USE_CUSTOM_SERVER_FOR_THREAD_PERSISTENCE === 'true';

  // State
  const [activeThreadId, setActiveThreadId] = useState<string | null>(getActiveThreadId(pathname));
  const threadIdRef = useRef<string | null>(activeThreadId);

  // Sync activeThreadId from pathname
  useEffect(() => {
    const id = getActiveThreadId(pathname);
    setActiveThreadId(id);
  }, [pathname]);

  // Sync Ref
  useEffect(() => {
    threadIdRef.current = activeThreadId;
  }, [activeThreadId]);

  const cloud = useMemo(() => {
    if (useCustom) {
      return undefined;
    }
    return new AssistantCloud({
      baseUrl: Env.NEXT_PUBLIC_ASSISTANT_BASE_URL!,
      anonymous: true,
    });
  }, [useCustom]);

  // Runtime Configuration
  const runtime = useChatRuntime({
    cloud,
    transport: useCustom
      ? new AssistantChatTransport({
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
      })
      : undefined,
    messageMetadataSchema: _MessageMetadataSchema,
    onFinish: (message) => {
      // Logic for updating URL and local thread sync if in Custom Mode
      try {
        let isNewThread = false;
        if (message?.message?.metadata) {
          const metadata = message?.message?.metadata as z.infer<typeof _MessageMetadataSchema>;
          const threadIdFromMetadata = metadata?.thread_id;
          if (threadIdFromMetadata && threadIdFromMetadata !== activeThreadId) {
            threadIdRef.current = threadIdFromMetadata;
            setActiveThreadId(threadIdFromMetadata);

            // Update URL without page reload/remount
            const newPath = pathname.endsWith('/chat')
              ? `${pathname}/${threadIdFromMetadata}`
              : pathname.replace(/\/chat\/[^/]+/, `/chat/${threadIdFromMetadata}`);
            window.history.replaceState({}, '', newPath);

            if (useCustom) {
              isNewThread = (listThreads().findIndex(t => t.id === threadIdFromMetadata) <= 0);
            }
          }
        }

        const currentId = threadIdRef.current;
        if (!currentId) {
          return;
        }

        // Only update local thread store if using Custom persistence (Placeholder logic)
        if (useCustom) {
          const titleText = getFirstUserText(message ? message.messages : []);
          upsertThread({
            id: currentId,
            title: titleText ? deriveTitleFromUserText(titleText) : undefined,
            updatedAt: Date.now(),
          });

          if (isNewThread) {
            window.dispatchEvent(new StorageEvent('storage', { key: 'chat_threads_v1' }));
          }
        }
      } catch (e) {
        console.error('[chat] onFinish failed', e);
      }
    },
    onError: (e) => {
      console.error('[chat] runtime error', e);
      if (useCustom && threadIdRef.current) {
        upsertThread({ id: threadIdRef.current, updatedAt: Date.now() });
      }
    },
  });

  const onNewChat = () => {
    setSidebarOpen(false);
    window.location.assign('/chat');
  };

  return (
    <TooltipProvider delayDuration={150}>
      <AssistantRuntimeProvider runtime={runtime}>
        <div className="h-screen w-full bg-background text-foreground">
          {/* Mobile overlay */}
          <div
            className={[
              'fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden',
              sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
            ].join(' ')}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Sidebar */}
          <aside
            className={[
              'fixed left-0 top-0 z-50 h-screen border-r bg-background/95 backdrop-blur transition-all duration-300 supports-[backdrop-filter]:bg-background/80',
              isCollapsed ? 'md:w-16' : 'md:w-72',
              sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0',
            ].join(' ')}
          >
            <div className="flex h-full flex-col">
              {/* Sidebar header */}
              <div
                className="flex h-14 items-center justify-between p-3"
                onMouseEnter={() => setIsHeaderHovered(true)}
                onMouseLeave={() => setIsHeaderHovered(false)}
              >
                {!isCollapsed
                  ? (
                      <>
                        <div className="flex items-center gap-2 text-xl font-bold">
                          <Image
                            src="/assets/images/adbuddy_logo_small.png"
                            alt="AdBuddy Logo"
                            width={32}
                            height={32}
                            className="size-8 object-contain"
                          />
                          <span>AdBuddy.ai</span>
                        </div>
                        <button
                          type="button"
                          className="rounded-md p-1.5 hover:bg-muted"
                          onClick={() => setIsCollapsed(true)}
                          aria-label="Collapse sidebar"
                        >
                          <PanelLeftClose size={20} />
                        </button>
                      </>
                    )
                  : (
                      <div className="flex w-full justify-center">
                        <button
                          type="button"
                          className="flex size-10 items-center justify-center rounded-md hover:bg-muted"
                          onClick={() => {
                            if (window.innerWidth < 768) {
                              setSidebarOpen(false);
                            } else {
                              setIsCollapsed(false);
                            }
                          }}
                          aria-label="Expand sidebar"
                        >
                          {isHeaderHovered
                            ? <PanelLeftOpen size={20} />
                            : (
                                <Image
                                  src="/assets/images/adbuddy_logo_small.png"
                                  alt="AdBuddy Logo"
                                  width={32}
                                  height={32}
                                  className="size-8 object-contain"
                                />
                              )}
                        </button>
                      </div>
                    )}
              </div>

              {/* Navigation buttons */}
              <div className="space-y-1 px-3 pb-3">
                {/* Note: ThreadList typically includes a 'New Chat' button, but we keep our own if we want custom styling or if ThreadList's is hidden */}
                {/* Only showing explicit New Chat if Custom Mode because ThreadList usually handles it in Cloud mode, or we can rely on ThreadList's own UI */}
                {useCustom && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={onNewChat}
                        className={[
                          'flex w-full items-center gap-2 rounded-lg border bg-background py-2 text-sm font-medium hover:bg-muted',
                          isCollapsed ? 'justify-center px-0' : 'px-3',
                        ].join(' ')}
                      >
                        <Plus size={18} />
                        {!isCollapsed && <span>New chat</span>}
                      </button>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">New chat</TooltipContent>}
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/dashboard"
                      className={[
                        'flex items-center gap-2 rounded-lg py-2 text-sm hover:bg-muted',
                        isCollapsed ? 'justify-center px-0' : 'px-3',
                      ].join(' ')}
                    >
                      <LayoutDashboard size={18} />
                      {!isCollapsed && <span>Dashboard</span>}
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && <TooltipContent side="right">Dashboard</TooltipContent>}
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/settings"
                      className={[
                        'flex items-center gap-2 rounded-lg py-2 text-sm hover:bg-muted',
                        isCollapsed ? 'justify-center px-0' : 'px-3',
                      ].join(' ')}
                    >
                      <Settings size={18} />
                      {!isCollapsed && <span>Settings</span>}
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && <TooltipContent side="right">Settings</TooltipContent>}
                </Tooltip>
              </div>

              {/* Threads list */}
              <div className="flex-1 overflow-y-auto px-2">
                {!isCollapsed
                  ? (
                      <ThreadList />
                    )
                  : (
                      // When collapsed, we can't easily show ThreadList unless we style it to be icons only.
                      // For now, let's hide it or show a placeholder.
                      // ThreadList component doesn't natively support "collapsed" icon-only mode easily without CSS overrides.
                      // We'll hide it to keep UI clean as per previous design.
                      <div className="flex justify-center p-2">
                        <MessageSquare className="text-muted-foreground" size={20} />
                      </div>
                    )}
              </div>

              {/* Sidebar footer */}
              <div className="border-t p-3">
                <div className={[
                  'flex items-center gap-3 rounded-lg p-1',
                  isCollapsed ? 'justify-center' : '',
                ].join(' ')}
                >
                  <UserButton
                    userProfileMode="navigation"
                    userProfileUrl="/dashboard/user-profile"
                    appearance={{
                      elements: {
                        rootBox: 'flex items-center justify-center',
                        userButtonAvatarBox: 'size-9',
                      },
                    }}
                  />
                  {!isCollapsed && (
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">Account</div>
                      <div className="truncate text-xs text-muted-foreground">
                        Manage your profile
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Main column */}
          <div
            className={[
              'flex h-screen flex-col transition-all duration-300',
              isCollapsed ? 'md:pl-16' : 'md:pl-72',
            ].join(' ')}
          >
            {/* Top bar */}
            <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <button
                type="button"
                className="rounded-md border px-2 py-1 text-sm hover:bg-muted md:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                ☰
              </button>

              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="text-sm font-semibold">Chat</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  Share
                </button>
                <button
                  type="button"
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  ⋯
                </button>
              </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-hidden">{children}</main>
          </div>
        </div>
      </AssistantRuntimeProvider>
    </TooltipProvider>
  );
}
