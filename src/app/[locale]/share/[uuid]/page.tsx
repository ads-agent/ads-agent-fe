'use client';

import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';

import { ShareThread } from './ShareThread';

export default function SharedChatPage() {
  const params = useParams();
  const uuid = params.uuid as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uuid) {
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/share/chat/${uuid}`);
        if (!res.ok) {
          throw new Error('Failed to load chat');
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [uuid]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="size-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
        <div className="text-muted-foreground">
          {error || 'Thread not found'}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full justify-center overflow-hidden bg-background">
        <div className="flex size-full max-w-7xl flex-col">
          <ShareThread
            messages={data.messages}
            title={data.thread_title}
            createTime={data.created_at}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
