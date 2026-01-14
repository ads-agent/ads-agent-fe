'use client';

import { AssistantIf, AssistantRuntimeProvider, useAssistantRuntime, useAssistantState } from '@assistant-ui/react';
import { AssistantChatTransport, useChatRuntime } from '@assistant-ui/react-ai-sdk';
import { useAuth } from '@clerk/nextjs';
import { AssistantCloud } from 'assistant-cloud';
import {
  ChevronRight,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
} from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';

import { ThreadList } from '@/components/assistant-ui/thread-list';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShareChatModal } from '@/features/chat/ShareChatModal';
import { UserMenu } from '@/features/chat/UserMenu';
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

function ChatHeader({
  setSidebarOpen,
}: {
  setSidebarOpen: (open: boolean) => void;
}) {
  const t = useTranslations('Chat');
  const [shareModalOpen, setShareModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-background px-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="rounded-md border p-1.5 hover:bg-muted md:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label={t('sidebar_open')}
        >
          <PanelLeftOpen size={18} />
        </button>

        <div className="flex items-center gap-1.5 cursor-pointer rounded-lg px-2 py-1 hover:bg-muted transition-colors group">
          <span className="text-sm font-bold tracking-tight text-foreground/80 group-hover:text-foreground transition-colors">
            Manus 1.6 Lite
          </span>
          <svg className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <AssistantIf condition={({ thread }) => !thread.isEmpty}>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm font-medium hover:bg-muted transition-all shadow-sm active:scale-95"
            onClick={() => setShareModalOpen(true)}
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span className="hidden sm:inline">{t('share')}</span>
          </button>
        </AssistantIf>
      </div>

      <ShareChatModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </header>
  );
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

function ChatLayoutContent({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Chat');
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

  const { getToken, isLoaded, isSignedIn } = useAuth();

  const cloud = useMemo(() => {
    if (useCustom || !isLoaded || !isSignedIn) {
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
  }, [useCustom, getToken, isLoaded, isSignedIn]);

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
              'fixed left-0 top-0 z-50 h-screen border-r bg-secondary/40 backdrop-blur-md transition-all duration-300',
              isCollapsed ? 'md:w-16' : 'md:w-72',
              sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0',
            ].join(' ')}
          >
            <div className="flex h-full flex-col">
              {/* Sidebar header */}
              <div
                className="flex h-16 items-center justify-between px-4"
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
                            width={26}
                            height={26}
                            className="size-6.5 object-contain"
                          />
                          <span className="tracking-tight text-foreground/90 font-bold">
                            AdBuddy
                            <span className="text-blue-500">.ai</span>
                          </span>
                        </div>
                        <button
                          type="button"
                          className="rounded-md p-1.5 hover:bg-muted text-muted-foreground transition-colors"
                          onClick={() => setIsCollapsed(true)}
                          aria-label={t('sidebar_collapse')}
                        >
                          <PanelLeftClose size={18} />
                        </button>
                      </>
                    )
                  : (
                      <div className="flex w-full justify-center">
                        <button
                          type="button"
                          className="flex size-10 items-center justify-center rounded-md hover:bg-muted transition-colors"
                          onClick={() => {
                            if (window.innerWidth < 768) {
                              setSidebarOpen(false);
                            } else {
                              setIsCollapsed(false);
                            }
                          }}
                          aria-label={t('sidebar_expand')}
                        >
                          {isHeaderHovered
                            ? <PanelLeftOpen size={18} />
                            : (
                                <Image
                                  src="/assets/images/adbuddy_logo_small.png"
                                  alt="AdBuddy Logo"
                                  width={26}
                                  height={26}
                                  className="size-6.5 object-contain"
                                />
                              )}
                        </button>
                      </div>
                    )}
              </div>

              {/* Navigation buttons */}
              <div className="space-y-1 px-3 pb-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className={[
                        'flex items-center gap-2.5 rounded-xl py-2 text-sm font-medium hover:bg-muted/60 w-full transition-colors text-muted-foreground/80 hover:text-foreground',
                        isCollapsed ? 'justify-center px-0' : 'px-4',
                      ].join(' ')}
                    >
                      <Search size={18} />
                      {!isCollapsed && <span>{t('search')}</span>}
                    </button>
                  </TooltipTrigger>
                  {isCollapsed && <TooltipContent side="right">{t('search')}</TooltipContent>}
                </Tooltip>
              </div>

              {/* Threads list */}
              <div className="flex-1 overflow-y-auto px-2 pb-4">
                <ThreadList isCollapsed={isCollapsed} />
              </div>

              {/* Sidebar footer */}
              <div className="p-3 space-y-3">
                <UserMenu isCollapsed={isCollapsed} />
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
            <ChatHeader setSidebarOpen={setSidebarOpen} />

            {/* Content */}
            <main className="flex-1 overflow-hidden">{children}</main>
          </div>
        </div>
      </AssistantRuntimeProvider>
    </TooltipProvider>
  );
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useAuth();
  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="size-10 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <ChatLayoutContent>{children}</ChatLayoutContent>;
}
