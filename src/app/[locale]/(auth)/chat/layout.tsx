'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';
import {
  createThread,
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
    const id = createThread();
    setThreads(listThreads());
    setSidebarOpen(false);
    window.location.assign(`/chat/${id}`);
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
            'fixed left-0 top-0 z-50 h-screen w-72 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80',
            'transform transition-transform md:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          <div className="flex h-full flex-col">
            {/* Sidebar header */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg border bg-muted" />
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold">Your App</span>
                  <span className="text-xs text-muted-foreground">Chat</span>
                </div>
              </div>

              <button
                type="button"
                className="rounded-md border px-2 py-1 text-sm hover:bg-muted md:hidden"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                ✕
              </button>
            </div>

            {/* New chat button */}
            <div className="px-3 pb-3">
              <button
                type="button"
                onClick={onNewChat}
                className="flex w-full items-center justify-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                <span className="text-base">＋</span>
                New chat
              </button>
            </div>

            {/* Threads list */}
            <div className="flex-1 overflow-y-auto px-2">
              {groups.length === 0
                ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No conversations yet.
                    </div>
                  )
                : (
                    groups.map(g => (
                      <div key={g.label} className="mb-3">
                        <div className="px-2 pb-2 text-xs font-medium text-muted-foreground">
                          {g.label}
                        </div>

                        <nav className="space-y-1">
                          {g.items.map((t) => {
                            const active = activeThreadId === t.id;
                            return (
                              <div key={t.id} className="group flex items-center">
                                <Link
                                  href={`/chat/${t.id}`}
                                  onClick={() => setSidebarOpen(false)}
                                  className={[
                                    'flex-1 truncate rounded-lg px-3 py-2 text-sm',
                                    active ? 'bg-muted' : 'hover:bg-muted/70',
                                  ].join(' ')}
                                >
                                  {t.title}
                                </Link>

                                <button
                                  type="button"
                                  className="ml-1 rounded-md p-2 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                                  aria-label="Delete thread"
                                  onClick={() => onDeleteThread(t.id)}
                                >
                                  ⋯
                                </button>
                              </div>
                            );
                          })}
                        </nav>
                      </div>
                    ))
                  )}
            </div>

            {/* Sidebar footer */}
            <div className="border-t p-3">
              <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted">
                <div className="size-9 rounded-full border bg-muted" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">You</div>
                  <div className="truncate text-xs text-muted-foreground">
                    Settings • Billing • Logout
                  </div>
                </div>
                <span className="text-muted-foreground">⌄</span>
              </div>

              <div className="mt-2 flex gap-2">
                <Link
                  href="/dashboard"
                  className="flex-1 rounded-lg border px-3 py-2 text-center text-xs hover:bg-muted"
                >
                  Dashboard
                </Link>
                <Link
                  href="/settings"
                  className="flex-1 rounded-lg border px-3 py-2 text-center text-xs hover:bg-muted"
                >
                  Settings
                </Link>
              </div>
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex h-screen flex-col md:pl-72">
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
