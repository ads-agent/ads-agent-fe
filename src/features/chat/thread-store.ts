// src/features/chat/thread-store.ts
export type Thread = {
  id: string;
  title?: string;
  createdAt?: number;
  updatedAt: number;
};

const KEY = 'chat_threads_v1';

function safeParse<T>(s: string | null): T | null {
  if (!s) {
    return null;
  }
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export function listThreads(): Thread[] {
  if (typeof window === 'undefined') {
    return [];
  }
  const data = safeParse<Thread[]>(localStorage.getItem(KEY));
  return Array.isArray(data) ? data : [];
}

export function saveThreads(threads: Thread[]) {
  localStorage.setItem(KEY, JSON.stringify(threads));
}

export function upsertThread(partial: Pick<Thread, 'id'> & Partial<Omit<Thread, 'id'>>) {
  const now = Date.now();
  const threads = listThreads();
  const idx = threads.findIndex(t => t.id === partial.id);

  if (idx >= 0) {
    const next = {
      ...threads[idx],
      ...partial,
      updatedAt: partial.updatedAt ?? now,
    };
    threads[idx] = next;
  } else {
    const next: Thread = {
      id: partial.id,
      title: partial.title ?? 'New chat',
      createdAt: partial.createdAt ?? now,
      updatedAt: partial.updatedAt ?? now,
    };
    threads.unshift(next);
  }

  // 最新在前
  threads.sort((a, b) => b.updatedAt - a.updatedAt);
  saveThreads(threads);
  return threads;
}

export function deleteThread(id: string) {
  const threads = listThreads().filter(t => t.id !== id);
  saveThreads(threads);
  return threads;
}

export function ensureThread(id: string) {
  const threads = listThreads();
  const found = threads.find(t => t.id === id);
  if (found) {
    return found;
  }
  upsertThread({ id, title: 'New chat' });
  return listThreads().find(t => t.id === id)!;
}

export function createThread() {
  const id = crypto.randomUUID();
  upsertThread({ id, title: 'New chat' });
  return id;
}

// 用首条用户消息生成标题（ChatGPT 类似）
export function deriveTitleFromUserText(text: string) {
  const t = text.trim().replace(/\s+/g, ' ');
  if (!t) {
    return 'New chat';
  }
  return t.length > 48 ? `${t.slice(0, 48)}…` : t;
}
