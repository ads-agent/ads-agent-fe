'use client';

import { ArrowRightIcon, CheckIcon, CopyIcon } from 'lucide-react';
import Link from 'next/link';
import { type FC, isValidElement, memo, useState } from 'react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { TooltipIconButton } from '@/components/assistant-ui/tooltip-icon-button';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/Helpers';

/* eslint-disable tailwindcss/no-custom-classname */

// Types
type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | any[];
  createdAt?: string | Date;
};

type ShareThreadProps = {
  messages: Message[];
  title?: string;
  createTime?: string | Date;
};

// --- Helpers from markdown-text.tsx ---

const useCopyToClipboard = ({
  copiedDuration = 3000,
}: {
  copiedDuration?: number;
} = {}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const copyToClipboard = (value: string) => {
    if (!value) {
      return;
    }

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), copiedDuration);
    });
  };

  return { isCopied, copyToClipboard };
};

type CodeHeaderProps = {
  language: string;
  code: string;
};

const CodeHeader: FC<CodeHeaderProps> = ({ language, code }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  const onCopy = () => {
    if (!code || isCopied) {
      return;
    }
    copyToClipboard(code);
  };

  return (
    <div className="aui-code-header-root mt-4 flex items-center justify-between gap-4 rounded-t-lg bg-muted-foreground/15 px-4 py-2 text-sm font-semibold text-foreground dark:bg-muted-foreground/20">
      <span className="aui-code-header-language lowercase [&>span]:text-xs">
        {language}
      </span>
      <TooltipIconButton tooltip="Copy" onClick={onCopy}>
        {!isCopied && <CopyIcon />}
        {isCopied && <CheckIcon />}
      </TooltipIconButton>
    </div>
  );
};

const markdownComponents: Components = {
  h1: ({ className, children, ...props }) => (
    <h1
      className={cn(
        'aui-md-h1 mb-8 scroll-m-20 font-extrabold text-4xl tracking-tight last:mb-0',
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ className, children, ...props }) => (
    <h2
      className={cn(
        'aui-md-h2 mt-8 mb-4 scroll-m-20 font-semibold text-3xl tracking-tight first:mt-0 last:mb-0',
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ className, children, ...props }) => (
    <h3
      className={cn(
        'aui-md-h3 mt-6 mb-4 scroll-m-20 font-semibold text-2xl tracking-tight first:mt-0 last:mb-0',
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ className, children, ...props }) => (
    <h4
      className={cn(
        'aui-md-h4 mt-6 mb-4 scroll-m-20 font-semibold text-xl tracking-tight first:mt-0 last:mb-0',
        className,
      )}
      {...props}
    >
      {children}
    </h4>
  ),
  h5: ({ className, children, ...props }) => (
    <h5
      className={cn(
        'aui-md-h5 my-4 font-semibold text-lg first:mt-0 last:mb-0',
        className,
      )}
      {...props}
    >
      {children}
    </h5>
  ),
  h6: ({ className, children, ...props }) => (
    <h6
      className={cn(
        'aui-md-h6 my-4 font-semibold first:mt-0 last:mb-0',
        className,
      )}
      {...props}
    >
      {children}
    </h6>
  ),
  p: ({ className, children, ...props }) => (
    <p
      className={cn(
        'aui-md-p mt-5 mb-5 leading-7 first:mt-0 last:mb-0',
        className,
      )}
      {...props}
    >
      {children}
    </p>
  ),
  a: ({ className, children, ...props }) => (
    <a
      className={cn(
        'aui-md-a font-medium text-primary underline underline-offset-4',
        className,
      )}
      {...props}
    >
      {children}
    </a>
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn('aui-md-blockquote border-l-2 pl-6 italic', className)}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn('aui-md-ul my-5 ml-6 list-disc [&>li]:mt-2', className)}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn('aui-md-ol my-5 ml-6 list-decimal [&>li]:mt-2', className)}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn('aui-md-hr my-5 border-b', className)} {...props} />
  ),
  table: ({ className, ...props }) => (
    <table
      className={cn(
        'aui-md-table my-5 w-full border-separate border-spacing-0 overflow-y-auto',
        className,
      )}
      {...props}
    />
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        'aui-md-th bg-muted px-4 py-2 text-left font-bold first:rounded-tl-lg last:rounded-tr-lg [[align=center]]:text-center [[align=right]]:text-right',
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn(
        'aui-md-td border-b border-l px-4 py-2 text-left last:border-r [[align=center]]:text-center [[align=right]]:text-right',
        className,
      )}
      {...props}
    />
  ),
  tr: ({ className, ...props }) => (
    <tr
      className={cn(
        'aui-md-tr m-0 border-b p-0 first:border-t [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg',
        className,
      )}
      {...props}
    />
  ),
  sup: ({ className, ...props }) => (
    <sup
      className={cn('aui-md-sup [&>a]:text-xs [&>a]:no-underline', className)}
      {...props}
    />
  ),
  pre: ({ className, children, ...props }) => {
    // Attempt to extract the code element's props to find the language
    const childElement = isValidElement(children) ? (children as React.ReactElement) : null;

    if (childElement) {
      const childProps = childElement.props;
      const codeClassName = childProps.className || '';
      const match = /language-(\w+)/.exec(codeClassName);
      const language = match?.[1] ?? 'text';

      return (
        <div className="aui-code-block-wrapper mb-5 last:mb-0">
          <CodeHeader language={language} code={String(childProps.children).replace(/\n$/, '')} />
          <pre
            className={cn(
              'aui-md-pre overflow-x-auto rounded-t-none! rounded-b-lg bg-black p-4 text-white mt-0',
              className,
            )}
            {...props}
          >
            {children}
          </pre>
        </div>
      );
    }

    return (
      <pre
        className={cn(
          'aui-md-pre overflow-x-auto rounded-lg bg-black p-4 text-white',
          className,
        )}
        {...props}
      >
        {children}
      </pre>
    );
  },
  code: ({ className, children, ...props }) => {
    // ReactMarkdown passes an `inline` prop (boolean) to the code component.
    // If inline is true, it's inline code (`code`).
    // If inline is false (or undefined in some contexts, but usually false for blocks), it's a code block.
    // However, our `pre` component handles the block wrapper.
    // The `code` component inside `pre` is just for the content.
    // We only want to apply the "inline-code" style if it IS inline.

    const isInline = (props as any).node?.properties?.className ? false : (props as any).inline;

    return (
      <code
        className={cn(
          isInline
          && 'aui-md-inline-code rounded border bg-muted font-semibold',
          className,
        )}
        {...props}
      >
        {children}
      </code>
    );
  },
};

// Simplified Markdown component that accepts content directly
const SimpleMarkdown: FC<{ content: string }> = memo(({ content }) => {
  return (
    <div className="aui-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

// Helper to extract text from content
const getMessageText = (content: string | any[]) => {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content.map(c => c.text || '').join('');
  }
  return '';
};

export const ShareThread: FC<ShareThreadProps> = ({ messages, title, createTime }) => {
  return (
    <div
      className="aui-root aui-thread-root @container flex h-full flex-col bg-background"
      style={{
        ['--thread-max-width' as string]: '44rem',
      }}
    >
      {/* Header with Title and Date */}
      <div className="flex flex-col items-center border-b px-4 py-6">
        {title && <h1 className="text-2xl font-bold">{title}</h1>}
        {createTime && (
          <p className="text-sm text-muted-foreground">
            {new Date(createTime).toLocaleString()}
          </p>
        )}
      </div>

      <div
        className="aui-thread-viewport relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll scroll-smooth px-4 pt-4"
      >
        <div className="flex flex-col gap-4 pb-20">
          {messages.map(msg => (
            <div key={msg.id} className={cn('flex w-full', msg.role === 'user' ? 'justify-end' : 'justify-center')}>
              {msg.role === 'assistant' && (
                <div
                  className="aui-assistant-message-root max-w-(--thread-max-width) relative mx-auto w-full py-3"
                  data-role="assistant"
                >
                  <div className="aui-assistant-message-content wrap-break-word px-2 leading-relaxed text-foreground">
                    <SimpleMarkdown content={getMessageText(msg.content)} />
                  </div>
                </div>
              )}

              {msg.role === 'user' && (
                <div
                  className="aui-user-message-root max-w-(--thread-max-width) mx-auto grid w-full auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-2 px-2 py-3 [&:where(>*)]:col-start-2"
                  data-role="user"
                >
                  <div className="aui-user-message-content-wrapper relative col-start-2 min-w-0">
                    <div className="aui-user-message-content wrap-break-word rounded-2xl bg-muted px-4 py-2.5 text-foreground">
                      <p className="whitespace-pre-wrap">{getMessageText(msg.content)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="aui-thread-viewport-footer max-w-(--thread-max-width) sticky bottom-0 mx-auto mt-auto flex w-full flex-col items-center gap-4 overflow-visible rounded-t-3xl bg-background pb-4 md:pb-6">
          <Button asChild size="lg" className="rounded-full px-8">
            <Link href="/chat">
              Start a new Chat
              <ArrowRightIcon className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

/* eslint-enable tailwindcss/no-custom-classname */
