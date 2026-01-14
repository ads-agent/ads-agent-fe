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
      {/*
      <ThreadListNew isCollapsed={isCollapsed} />
      */}
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
    router.push(`/chat`);
  };

  return (
    <ThreadListPrimitive.New asChild>
      <Button
        variant="outline"
        className={cn(
          "aui-thread-list-new h-11 bg-card hover:bg-card border-none shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all active:scale-[0.98] mb-6 font-bold text-foreground/90",
          isCollapsed
            ? "w-11 justify-center px-0 rounded-xl"
            : "w-full justify-start gap-3 rounded-xl px-4 text-[13px]",
        )}
        onClick={handleNewThreadClick}
      >
        <PlusIcon className="size-4.5 stroke-[2.5px]" />
        {!isCollapsed && t("new_thread")}
      </Button>
    </ThreadListPrimitive.New>
  );
};
// keep for future use
void ThreadListNew;

const ThreadListSkeleton: FC = () => {
  return (
    <div className="flex flex-col gap-1.5">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          role="status"
          aria-label="Loading threads"
          className="aui-thread-list-skeleton-wrapper flex h-10 items-center px-3"
        >
          <Skeleton className="aui-thread-list-skeleton h-3.5 w-full rounded-md opacity-40" />
        </div>
      ))}
    </div>
  );
};

const ThreadListItem: FC = () => {
  const t = useTranslations("Chat");
  const router = useRouter();
  const threadRemoteId = useThreadListItem((m) => m.remoteId);
  const handleThreadItemClick = () => {
    router.push(`/chat/${threadRemoteId}`);
  };

  return (
    <ThreadListItemPrimitive.Root className="aui-thread-list-item group flex h-10 items-center rounded-xl transition-all hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none data-[active]:bg-muted/80 data-[active]:text-foreground">
      <ThreadListItemPrimitive.Trigger
        className="aui-thread-list-item-trigger flex h-full flex-1 items-center truncate px-4 text-start text-[13px] font-medium text-muted-foreground/70 transition-colors group-hover:text-foreground/80 group-data-[active]:text-foreground"
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
