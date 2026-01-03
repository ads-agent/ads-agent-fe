// src/app/[locale]/(auth)/chat/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { createThread } from '@/features/chat/thread-store';

export default function ChatIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const id = createThread();
    router.replace(`/chat/${id}`);
  }, [router]);

  return null;
}
