'use client';

import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { AssistantChatTransport, useChatRuntime } from '@assistant-ui/react-ai-sdk';
import React from 'react';

import { Thread } from '@/components/assistant-ui/thread';

export default function ChatPage() {
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: '/api/chat',
    }),
  });

  return (
    <div className="flex size-full justify-center overflow-hidden">
      <div className="flex size-full max-w-3xl flex-col">
        <AssistantRuntimeProvider runtime={runtime}>
          <Thread />
        </AssistantRuntimeProvider>
      </div>
    </div>
  );
}
