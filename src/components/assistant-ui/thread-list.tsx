import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/Helpers";
import {
  AssistantIf,
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useThreadListItem,
} from "@assistant-ui/react";
import { ArchiveIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";
import { useRouter } from "next/navigation";

interface ThreadListProps {
  isCollapsed?: boolean;
}

export const ThreadList: FC<ThreadListProps> = ({ isCollapsed }) => {
  return (
    <ThreadListPrimitive.Root
      className={cn(
        "aui-root aui-thread-list-root flex flex-col gap-1",
        isCollapsed && "items-center",
      )}
    >
      <ThreadListNew isCollapsed={isCollapsed} />
      {!isCollapsed && (
        <>
          <AssistantIf condition={({ threads }) => threads.isLoading}>
            <ThreadListSkeleton />
          </AssistantIf>
          <AssistantIf condition={({ threads }) => !threads.isLoading}>
            <ThreadListPrimitive.Items components={{ ThreadListItem }} />
          </AssistantIf>
        </>
      )}
    </ThreadListPrimitive.Root>
  );
};

const ThreadListNew: FC<{ isCollapsed?: boolean }> = ({ isCollapsed }) => {
  const t = useTranslations("Chat");
  const router = useRouter();
  const handleNewThreadClick = () => {
    // ThreadListItemPrimitive.New 会负责“切线程”，我们只负责改 URL
    router.push(`/chat`);
  };

  return (
    <ThreadListPrimitive.New asChild>
      <Button
        variant="outline"
        className={cn(
          "aui-thread-list-new h-9 hover:bg-muted data-active:bg-muted",
          isCollapsed
            ? "w-9 justify-center px-0"
            : "w-full justify-start gap-2 rounded-lg px-3 text-sm",
        )}
        onClick={handleNewThreadClick}
      >
        <PlusIcon className="size-4" />
        {!isCollapsed && t("new_thread")}
      </Button>
    </ThreadListPrimitive.New>
  );
};

const ThreadListSkeleton: FC = () => {
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          role="status"
          aria-label="Loading threads"
          className="aui-thread-list-skeleton-wrapper flex h-9 items-center px-3"
        >
          <Skeleton className="aui-thread-list-skeleton h-4 w-full" />
        </div>
      ))}
    </div>
  );
};

const ThreadListItem: FC = () => {
  const t = useTranslations("Chat");
  const router = useRouter();
  // hook 里能拿到当前这个 item 的 threadId
  const threadId = useThreadListItem((m) => m.threadId);
  const handleThreadItemClick = () => {
    // ThreadListItemPrimitive.Trigger 会负责“切线程”，我们只负责改 URL
    router.push(`/chat/${threadId}`);
  };

  return (
    <ThreadListItemPrimitive.Root className="aui-thread-list-item group flex h-9 items-center rounded-lg transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none data-active:bg-muted">
      <ThreadListItemPrimitive.Trigger
        className="aui-thread-list-item-trigger flex h-full flex-1 items-center truncate px-3 text-start text-sm"
        onClick={handleThreadItemClick}
      >
        <ThreadListItemPrimitive.Title fallback={t("new_chat_fallback")} />
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemArchive />
    </ThreadListItemPrimitive.Root>
  );
};

const ThreadListItemArchive: FC = () => {
  const t = useTranslations("Chat");
  return (
    <ThreadListItemPrimitive.Archive asChild>
      <TooltipIconButton
        variant="ghost"
        tooltip={t("archive_thread")}
        className="aui-thread-list-item-archive mr-2 size-7 p-0 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <ArchiveIcon className="size-4" />
      </TooltipIconButton>
    </ThreadListItemPrimitive.Archive>
  );
};
