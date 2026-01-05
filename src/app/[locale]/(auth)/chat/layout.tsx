'use client';

import { UserButton } from '@clerk/nextjs';
import {
  LayoutDashboard,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  deleteThread,
  listThreads,
  type Thread as ThreadT,
} from '@/features/chat/thread-store';

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function groupThreads(threads: ThreadT[]) {
  const now = Date.now();
  const today = startOfDay(now);
  const yesterday = today - 86400000;
  const weekAgo = today - 7 * 86400000;

  const gToday: ThreadT[] = [];
  const gYesterday: ThreadT[] = [];
  const gWeek: ThreadT[] = [];
  const gOlder: ThreadT[] = [];

  for (const t of threads) {
    if (t.updatedAt >= today) {
      gToday.push(t);
    } else if (t.updatedAt >= yesterday) {
      gYesterday.push(t);
    } else if (t.updatedAt >= weekAgo) {
      gWeek.push(t);
    } else {
      gOlder.push(t);
    }
  }

  const groups: { label: string; items: ThreadT[] }[] = [];
  if (gToday.length) {
    groups.push({ label: 'Today', items: gToday });
  }
  if (gYesterday.length) {
    groups.push({ label: 'Yesterday', items: gYesterday });
  }
  if (gWeek.length) {
    groups.push({ label: 'Previous 7 Days', items: gWeek });
  }
  if (gOlder.length) {
    groups.push({ label: 'Older', items: gOlder });
  }

  return groups;
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

  const activeThreadId = getActiveThreadId(pathname);

  const [threads, setThreads] = useState<ThreadT[]>([]);

  useEffect(() => {
    setThreads(listThreads());
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'chat_threads_v1') {
        setThreads(listThreads());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const groups = useMemo(() => groupThreads(threads), [threads]);

  const activeThread = useMemo(() => {
    if (!activeThreadId) {
      return null;
    }
    return threads.find(t => t.id === activeThreadId) ?? null;
  }, [threads, activeThreadId]);

  const onNewChat = () => {
    setSidebarOpen(false);
    window.location.assign('/chat');
  };

  const onDeleteThread = (id: string) => {
    deleteThread(id);
    setThreads(listThreads());
    if (activeThreadId === id) {
      window.location.assign('/chat');
    }
  };

  return (
    <TooltipProvider delayDuration={150}>
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
              {!isCollapsed && (groups.length === 0
                ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No conversations yet.
                    </div>
                  )
                : (
                    groups.map(g => (
                      <div key={g.label} className="mb-3">
                        {!isCollapsed && (
                          <div className="px-2 pb-2 text-xs font-medium text-muted-foreground">
                            {g.label}
                          </div>
                        )}

                        <nav className="space-y-1">
                          {g.items.map((t) => {
                            const active = activeThreadId === t.id;
                            return (
                              <Tooltip key={t.id}>
                                <TooltipTrigger asChild>
                                  <div className="group flex items-center">
                                    <Link
                                      href={`/chat/${t.id}`}
                                      onClick={() => setSidebarOpen(false)}
                                      className={[
                                        'flex flex-1 items-center gap-2 truncate rounded-lg py-2 text-sm',
                                        active ? 'bg-muted' : 'hover:bg-muted/70',
                                        isCollapsed ? 'justify-center px-0' : 'px-3',
                                      ].join(' ')}
                                    >
                                      {isCollapsed ? <MessageSquare size={18} /> : t.title}
                                    </Link>

                                    {!isCollapsed && (
                                      <button
                                        type="button"
                                        className="ml-1 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                                        aria-label="Delete thread"
                                        onClick={() => onDeleteThread(t.id)}
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                {isCollapsed && <TooltipContent side="right">{t.title}</TooltipContent>}
                              </Tooltip>
                            );
                          })}
                        </nav>
                      </div>
                    ))
                  ))}
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
              <span className="truncate text-xs text-muted-foreground">
                {activeThread?.title ?? 'New chat'}
              </span>
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
    </TooltipProvider>
  );
}
