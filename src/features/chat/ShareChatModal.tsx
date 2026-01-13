'use client';

import { useThreadRuntime } from '@assistant-ui/react';
import { CheckIcon, CopyIcon, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import SparkMD5 from 'spark-md5';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type ShareChatModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const ShareChatModal = ({
  isOpen,
  onClose,
}: ShareChatModalProps) => {
  const t = useTranslations('Chat');
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const threadRuntime = useThreadRuntime();

  const handleCreateShareLink = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const threadState = threadRuntime.getState();
      const threadTitle = threadState.metadata?.title || '';
      const threadId = threadState.threadId;
      const messages = threadState.messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        metadata: m.metadata,
        attachments: m.attachments,
      }));

      // Calculate MD5
      const content = threadTitle + JSON.stringify(messages);
      const md5 = SparkMD5.hash(content);

      const response = await fetch('/api/share/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thread_id: threadId,
          thread_title: threadTitle,
          messages,
          md5,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('share_chat_create_link_error'));
      }

      setShareUrl(`${window.location.origin}${data.url}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [threadRuntime, t]);

  useEffect(() => {
    if (isOpen && !shareUrl && !loading && !error) {
      handleCreateShareLink();
    } else if (!isOpen) {
      setShareUrl(null);
      setError(null);
      setLoading(false);
      setCopied(false);
    }
  }, [isOpen, shareUrl, loading, error, handleCreateShareLink]);

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('share_chat_title')}</DialogTitle>
          <DialogDescription>
            {t('share_chat_description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 py-4">
          {loading && (
            <div className="flex w-full items-center justify-center py-4">
              <Loader2 className="animate-spin" />
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}

          {!loading && !error && shareUrl && (
            <div className="flex items-center gap-2">
              <Input value={shareUrl} readOnly />
              <Button size="icon" onClick={handleCopy}>
                {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            {t('close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
