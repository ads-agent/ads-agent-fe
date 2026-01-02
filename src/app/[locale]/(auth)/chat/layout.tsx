'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';

type ChatThreadItem = {
  id: string;
  title: string;
  href: string;
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 先用“占位对话列表”（未来换成真实数据即可）
  const threads: ChatThreadItem[] = useMemo(() => {
    return [
      { id: 't1', title: 'Getting started', href: '/chat' },
      { id: 't2', title: 'Pricing questions', href: '/chat' },
      { id: 't3', title: 'Ideas for my SaaS', href: '/chat' },
      { id: 't4', title: 'Drafting marketing copy', href: '/chat' },
    ];
  }, []);

  const isActive = (href: string) => {
    // 这里简单按 pathname 是否包含 /chat 来处理 active，
    // 将来你做 /chat/[threadId] 时可以更精确匹配。
    if (!pathname) {
      return false;
    }
    return href === '/chat' ? pathname.includes('/chat') : pathname === href;
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
              <Link
                href="/chat"
                className="flex items-center justify-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="text-base">＋</span>
                New chat
              </Link>
            </div>

            {/* Threads list */}
            <div className="flex-1 overflow-y-auto px-2">
              <div className="px-2 pb-2 text-xs font-medium text-muted-foreground">
                Recent
              </div>

              <nav className="space-y-1">
                {threads.map((t) => {
                  const active = isActive(t.href);
                  return (
                    <Link
                      key={t.id}
                      href={t.href}
                      onClick={() => setSidebarOpen(false)}
                      className={[
                        'group flex items-center justify-between rounded-lg px-3 py-2 text-sm',
                        active ? 'bg-muted' : 'hover:bg-muted/70',
                      ].join(' ')}
                    >
                      <span className="truncate">{t.title}</span>
                      <span className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                        ⋯
                      </span>
                    </Link>
                  );
                })}
              </nav>
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

        {/* Main column (with left padding on desktop to make room for sidebar) */}
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
                ChatGPT-style workspace
              </span>
            </div>

            {/* Right side actions (placeholders) */}
            <div className="flex items-center gap-2">
              <button type="button" className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
                Share
              </button>
              <button type="button" className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
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
