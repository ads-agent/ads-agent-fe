'use client';

import { AssistantRuntimeProvider, useAssistantRuntime, useAssistantState } from '@assistant-ui/react';
import { AssistantChatTransport, useChatRuntime } from '@assistant-ui/react-ai-sdk';
import { useAuth, UserButton } from '@clerk/nextjs';
import { AssistantCloud } from 'assistant-cloud';
import {
  LayoutDashboard,
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
import { Env } from '@/libs/Env';

const _MessageMetadataSchema = z.object({
  thread_id: z.string().optional(),
  run_id: z.string().optional(),
});

function getActiveThreadId(pathname: string | null) {
  if (!pathname) {
    return null;
  }
  const m = pathname.match(/\/chat\/([^/]+)/);
  return m?.[1] ?? null;
}

/* eslint-disable no-console */
function ThreadSync() {
  const runtime = useAssistantRuntime();
  const pathname = usePathname();
  // 订阅 thread list 的整体状态
  const threadsState = useAssistantState(({ threads }) => threads);
  const { mainThreadId, threadItems, isLoading } = threadsState;

  const startedLoadingRef = useRef(false);
  const finishedLoadingRef = useRef(false);
  const isPopState = useRef(false);

  useEffect(() => {
    const handler = () => {
      isPopState.current = true;
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  // 1. URL -> Runtime (on navigation/load)
  useEffect(() => {
    let threadListFirstTimeLoaded = false;
    if (isLoading) {
      if (!startedLoadingRef.current) {
        // 2. first time False -> True
        console.log('[zhengc][order] 2. first time False -> True');
        startedLoadingRef.current = true;
      } else {
        // 3. 7. not first time
        console.log('[zhengc][order] 3. 7. not first time');
      }
    } else {
      if (!startedLoadingRef.current) {
        // 1. has not flipped to true before
        console.log('[zhengc][order] 1. has not flipped to true before');
      } else {
        // 4. has been true before
        console.log('[zhengc][order] 4. has been true before');
        if (!finishedLoadingRef.current) {
          // 5. first time False -> True -> False
          console.log('[zhengc][order] 5. first time False -> True -> False');
          finishedLoadingRef.current = true;
          threadListFirstTimeLoaded = true;
        } else {
          // 6. 8. not first time
          console.log('[zhengc][order] 6. 8. not first time');
        }
      }
    }
    if (threadListFirstTimeLoaded
    // Not first time loaded, but navigation event
      || (!threadListFirstTimeLoaded && finishedLoadingRef.current && isPopState.current)) {
      console.log('[zhengc][order] switching thread');
      if (isPopState.current) {
        isPopState.current = false;
      }

      const urlThreadId = getActiveThreadId(pathname);
      if (urlThreadId) {
        const entry = Object.entries(threadItems).find(([, item]) => item.id === urlThreadId);
        if (!entry) {
          // 这里可以按需加：remoteId 找不到时 404 / 回退到 /chat
          console.log('[zhengc][order] no thread found');
          return;
        }
        // 切换到目标线程
        runtime.switchToThread(urlThreadId);
      } else {
        if (!mainThreadId.startsWith('__LOCALID_')) {
          const entry = Object.entries(threadItems).find(([, item]) => item.id.startsWith('__LOCALID_'));
          if (!entry) {
            // shouldn't reach
            console.log('[zhengc][order] no EMPTY thread found');
            return;
          }
          // 切换到目标线程
          runtime.switchToThread(entry[1].id);
        }
      }
    }
  }, [isPopState, pathname, mainThreadId, threadItems, isLoading, runtime]);

  return null;
}
/* eslint-enable no-console */

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

  const { getToken } = useAuth();

  const cloud = useMemo(() => {
    if (useCustom) {
      return undefined;
    }
    return new AssistantCloud({
      baseUrl: Env.NEXT_PUBLIC_ASSISTANT_BASE_URL!,
      // anonymous: true,
      authToken: async () => {
        // 模板名要和 Clerk 中创建的一致
        return await getToken({ template: 'assistant-ui-cloud' });
      },
    });
  }, [useCustom, getToken]);

  // Runtime Configuration
  const runtime = useChatRuntime({
    cloud,
    transport:
      new AssistantChatTransport({
        api: '/api/chat',
        fetch: async (_input, init) => {
          let body;
          try {
            body = JSON.parse(init?.body as string);
          } catch {
            body = {};
          }

          const urlThreadId = getActiveThreadId(window.location.pathname);
          if (urlThreadId) {
            body.threadId = urlThreadId;
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
    onFinish: (_message) => {
      try {
        // Example of processing message metadata
        // if (message?.message?.metadata) {
        //   const metadata = message?.message?.metadata as z.infer<typeof _MessageMetadataSchema>;
        // }
      } catch (e) {
        console.error('[chat] onFinish failed', e);
      }
    },
    onError: (e) => {
      console.error('[chat] runtime error', e);
    },
  });

  const onNewChat = () => {
    setSidebarOpen(false);
    window.location.assign('/chat');
  };

  return (
    <TooltipProvider delayDuration={150}>
      <AssistantRuntimeProvider runtime={runtime}>
        <ThreadSync />
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
                <ThreadList isCollapsed={isCollapsed} />
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
