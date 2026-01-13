import {
  ComposerAddAttachment,
  ComposerAttachments,
  UserMessageAttachments,
} from "@/components/assistant-ui/attachment";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { ToolFallback } from "@/components/assistant-ui/tool-fallback";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/Helpers";
import {
  ActionBarPrimitive,
  AssistantIf,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  PencilIcon,
  RefreshCwIcon,
  SquareIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";

export const Thread: FC = () => {
  return (
    <ThreadPrimitive.Root
      className="aui-root aui-thread-root @container flex h-full flex-col bg-background"
      style={{
        ["--thread-max-width" as string]: "48rem",
      }}
    >
      <ThreadPrimitive.Viewport
        turnAnchor="top"
        className="aui-thread-viewport relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll scroll-smooth px-4 pt-8"
      >
        <AssistantIf condition={({ thread }) => thread.isEmpty}>
          <div className="flex flex-1 flex-col items-center justify-center">
            <ThreadWelcome />
            <ThreadSuggestions />
          </div>
        </AssistantIf>

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            EditComposer,
            AssistantMessage,
          }}
        />

        <ThreadPrimitive.ViewportFooter className="aui-thread-viewport-footer sticky bottom-0 mt-auto flex w-full flex-col items-center bg-background pb-4 md:pb-8">
          <div className="flex w-full max-w-(--thread-max-width) flex-col gap-4 overflow-visible">
            <ThreadScrollToBottom />
            <Composer />
          </div>
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

const ThreadScrollToBottom: FC = () => {
  const t = useTranslations("Chat");
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip={t("tooltip_scroll_bottom")}
        variant="outline"
        className="aui-thread-scroll-to-bottom absolute -top-14 z-10 self-center rounded-full size-10 p-2 shadow-sm disabled:invisible bg-card dark:bg-card dark:hover:bg-accent"
      >
        <ArrowDownIcon className="size-5" />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC = () => {
  const t = useTranslations("Chat");
  return (
    <div className="aui-thread-welcome-root mx-auto flex w-full max-w-(--thread-max-width) flex-col items-center justify-center py-12">
      <div className="flex flex-col items-center gap-8 text-center">
        {/* 
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary/80 px-4 py-1.5 text-[13px] font-medium text-muted-foreground/80 shadow-sm border border-border/50 backdrop-blur-sm">
          <span>{t("welcome_badge_left") === "Chat.welcome_badge_left" ? "免费计划" : t("welcome_badge_left")}</span>
          <div className="h-3 w-px bg-border/60 mx-1" />
          <span className="text-primary cursor-pointer hover:underline font-semibold">{t("welcome_badge_right") === "Chat.welcome_badge_right" ? "开始免费试用" : t("welcome_badge_right")}</span>
        </div>
        */}
        
        <div className="aui-thread-welcome-message flex flex-col items-center justify-center px-4">
          <h1 className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-3 animate-in font-bold text-5xl tracking-tight duration-700 text-foreground/90">
            {t("welcome_title")}
          </h1>
          <p className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-3 animate-in text-muted-foreground/70 text-xl mt-6 delay-200 duration-700 max-w-[540px] leading-relaxed">
            {t("welcome_message")}
          </p>
        </div>
      </div>
    </div>
  );
};

const ThreadSuggestions: FC = () => {
  const t = useTranslations("Chat");
  const suggestions = [
    {
      title: t("suggestion_1_title"),
      icon: "📊",
    },
    {
      title: t("suggestion_2_title"),
      icon: "🌐",
    },
    {
      title: t("suggestion_3_title"),
      icon: "📱",
    },
    {
      title: t("suggestion_4_title"),
      icon: "🎨",
    },
  ];

  return (
    <div className="aui-thread-welcome-suggestions mt-12 flex flex-wrap items-center justify-center gap-4 px-4 max-w-5xl mx-auto">
      {suggestions.map((suggestion, index) => (
        <div
          key={suggestion.title}
          className="aui-thread-welcome-suggestion-display fade-in slide-in-from-bottom-2 animate-in fill-mode-both duration-500"
          style={{ animationDelay: `${400 + index * 100}ms` }}
        >
          <ThreadPrimitive.Suggestion prompt={suggestion.title} send asChild>
            <Button
              variant="outline"
              className="aui-thread-welcome-suggestion h-20 w-80 flex items-center justify-start gap-3 rounded-2xl border-border/40 bg-card/50 px-5 text-sm font-medium transition-all hover:bg-accent hover:shadow-md hover:-translate-y-0.5 group text-left whitespace-normal"
              aria-label={suggestion.title}
            >
              <span className="text-lg shrink-0 transition-transform group-hover:scale-110">{suggestion.icon}</span>
              <span className="aui-thread-welcome-suggestion-title text-foreground/80 group-hover:text-foreground transition-colors line-clamp-2 leading-snug">
                {suggestion.title}
              </span>
            </Button>
          </ThreadPrimitive.Suggestion>
        </div>
      ))}
    </div>
  );
};

const Composer: FC = () => {
  const t = useTranslations("Chat");
  return (
    <ComposerPrimitive.Root className="aui-composer-root relative flex w-full flex-col px-4">
      <div className="mt-8 flex w-full flex-col rounded-3xl border bg-card p-4 shadow-sm transition-all focus-within:shadow-md focus-within:ring-1 focus-within:ring-primary/10">
        <ComposerPrimitive.AttachmentDropzone className="aui-composer-attachment-dropzone flex w-full flex-col outline-none data-[dragging=true]:bg-accent/50">
          <ComposerPrimitive.Input
            placeholder={t("composer_placeholder")}
            className="aui-composer-input max-h-40 min-h-[44px] w-full resize-none bg-transparent px-2 py-1 text-base outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
            rows={1}
            autoFocus
            aria-label="Message input"
          />
          
          <ComposerAttachments />
          
          <div className="flex items-center justify-between mt-3 pt-2">
             <div className="flex items-center gap-1">
                <ComposerAddAttachment />
                <TooltipIconButton tooltip={t("tooltip_tools")} variant="ghost" className="rounded-full size-9 text-muted-foreground/60">
                   <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                </TooltipIconButton>
             </div>
              
              <div className="flex items-center gap-2">
                <div className="hidden sm:block">
                   <TooltipIconButton tooltip={t("tooltip_voice_input")} variant="ghost" className="rounded-full size-9 text-muted-foreground/60">
                      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                   </TooltipIconButton>
                </div>
                <ComposerAction />
              </div>
          </div>
        </ComposerPrimitive.AttachmentDropzone>
      </div>
    </ComposerPrimitive.Root>
  );
};

const ComposerAction: FC = () => {
  const t = useTranslations("Chat");
  return (
    <div className="aui-composer-action-wrapper flex items-center justify-center">
      <AssistantIf condition={({ thread }) => !thread.isRunning}>
        <ComposerPrimitive.Send asChild>
          <TooltipIconButton
            tooltip={t("tooltip_send_message")}
            side="top"
            type="submit"
            variant="default"
            size="icon"
            className="aui-composer-send size-10 rounded-full shadow-sm bg-primary hover:bg-primary/90 transition-all active:scale-95 disabled:bg-muted"
            aria-label={t("tooltip_send_message")}
          >
            <ArrowUpIcon className="aui-composer-send-icon size-5" />
          </TooltipIconButton>
        </ComposerPrimitive.Send>
      </AssistantIf>

      <AssistantIf condition={({ thread }) => thread.isRunning}>
        <ComposerPrimitive.Cancel asChild>
          <Button
            type="button"
            variant="default"
            size="icon"
            className="aui-composer-cancel size-10 rounded-full shadow-sm bg-primary hover:bg-primary/90 transition-all active:scale-95"
            aria-label={t("tooltip_stop_generating")}
          >
            <SquareIcon className="aui-composer-cancel-icon size-4 fill-current" />
          </Button>
        </ComposerPrimitive.Cancel>
      </AssistantIf>
    </div>
  );
};

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="aui-message-error-root mt-2 rounded-md border border-destructive bg-destructive/10 p-3 text-destructive text-sm dark:bg-destructive/5 dark:text-red-200">
        <ErrorPrimitive.Message className="aui-message-error-message line-clamp-2" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="aui-assistant-message-root fade-in slide-in-from-bottom-2 relative mx-auto w-full max-w-(--thread-max-width) animate-in py-6 duration-300"
      data-role="assistant"
    >
      <div className="aui-assistant-message-content wrap-break-word px-4 text-foreground leading-relaxed">
        <MessagePrimitive.Parts
          components={{
            Text: MarkdownText,
            tools: { Fallback: ToolFallback },
          }}
        />
        <MessageError />
      </div>

      <div className="aui-assistant-message-footer mt-4 ml-4 flex items-center gap-2">
        <BranchPicker />
        <AssistantActionBar />
      </div>
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  const t = useTranslations("Chat");
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="aui-assistant-action-bar-root flex gap-1 text-muted-foreground data-floating:absolute data-floating:rounded-full data-floating:border data-floating:bg-card data-floating:p-1 data-floating:shadow-sm"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip={t("tooltip_copy")} className="rounded-full size-8">
          <AssistantIf condition={({ message }) => message.isCopied}>
            <CheckIcon className="size-4" />
          </AssistantIf>
          <AssistantIf condition={({ message }) => !message.isCopied}>
            <CopyIcon className="size-4" />
          </AssistantIf>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.ExportMarkdown asChild>
        <TooltipIconButton tooltip={t("tooltip_export_markdown")} className="rounded-full size-8">
          <DownloadIcon className="size-4" />
        </TooltipIconButton>
      </ActionBarPrimitive.ExportMarkdown>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip={t("tooltip_refresh")} className="rounded-full size-8">
          <RefreshCwIcon className="size-4" />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="aui-user-message-root fade-in slide-in-from-bottom-2 mx-auto flex w-full max-w-(--thread-max-width) animate-in flex-col items-end gap-2 px-4 py-4 duration-300"
      data-role="user"
    >
      <UserMessageAttachments />

      <div className="aui-user-message-content-wrapper relative max-w-[85%]">
        <div className="aui-user-message-content wrap-break-word rounded-3xl bg-secondary px-5 py-3 text-foreground shadow-sm">
          <MessagePrimitive.Parts />
        </div>
        <div className="aui-user-action-bar-wrapper absolute top-1/2 -left-12 -translate-y-1/2">
          <UserActionBar />
        </div>
      </div>

      <BranchPicker className="aui-user-branch-picker mr-2 justify-end" />
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  const t = useTranslations("Chat");
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-user-action-bar-root flex flex-col items-center"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip={t("tooltip_edit")} className="aui-user-action-edit rounded-full size-8 text-muted-foreground hover:text-foreground">
          <PencilIcon className="size-4" />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  const t = useTranslations("Chat");
  return (
    <MessagePrimitive.Root className="aui-edit-composer-wrapper mx-auto flex w-full max-w-(--thread-max-width) flex-col px-2 py-3">
      <ComposerPrimitive.Root className="aui-edit-composer-root ml-auto flex w-full max-w-[85%] flex-col rounded-2xl bg-muted">
        <ComposerPrimitive.Input
          className="aui-edit-composer-input min-h-14 w-full resize-none bg-transparent p-4 text-foreground text-sm outline-none"
          autoFocus
        />
        <div className="aui-edit-composer-footer mx-3 mb-3 flex items-center gap-2 self-end">
          <ComposerPrimitive.Cancel asChild>
            <Button variant="ghost" size="sm">
              {t("composer_cancel")}
            </Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button size="sm">{t("composer_update")}</Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </MessagePrimitive.Root>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  const t = useTranslations("Chat");
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "aui-branch-picker-root mr-2 -ml-2 inline-flex items-center text-muted-foreground text-xs",
        className,
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip={t("tooltip_previous")}>
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="aui-branch-picker-state font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip={t("tooltip_next")}>
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};
