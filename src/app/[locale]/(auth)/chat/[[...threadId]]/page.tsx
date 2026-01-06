'use client';

import React from 'react';

import { Thread } from '@/components/assistant-ui/thread';

export default function ChatThreadPage() {
  return (
    <div className="flex size-full justify-center overflow-hidden">
      <div className="flex size-full max-w-7xl flex-col">
        <Thread />
      </div>
    </div>
  );
}
