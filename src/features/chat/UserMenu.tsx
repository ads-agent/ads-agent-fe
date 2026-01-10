import { useUser } from '@clerk/nextjs';
import { BookOpen, ChevronRight, Coins, HelpCircle, LogOut, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import type { SettingsTab } from './SettingsModal';
import { SettingsModal } from './SettingsModal';

type UserMenuProps = {
  isCollapsed: boolean;
};

// Extracted Dropdown Content for reuse and cleaner code
const UserDropdownContent = ({
  user,
  tokenBalance,
  openSettings,
}: {
  user: any;
  tokenBalance: number | null;
  openSettings: (tab: SettingsTab) => void;
}) => {
  return (
    <DropdownMenuContent align="start" className="w-72 p-2" side="top">
      <div className="mb-3 overflow-hidden rounded-xl border bg-muted/30">
        {/* User Info Section */}
        <div
          role="button"
          tabIndex={0}
          className="flex cursor-pointer items-center gap-3 p-4 transition-colors hover:bg-muted/50"
          onClick={() => openSettings('account')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              openSettings('account');
            }
          }}
        >
          <Avatar className="size-10">
            <AvatarImage src={user.imageUrl} />
            <AvatarFallback>{user.firstName?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col space-y-0.5">
            <p className="truncate text-sm font-medium leading-none">{user.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>

        {/* Token Balance Section */}
        <div
          role="button"
          tabIndex={0}
          className="flex cursor-pointer items-center justify-between border-t bg-muted/20 px-4 py-3.5 transition-colors hover:bg-muted/50"
          onClick={() => openSettings('usage')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              openSettings('usage');
            }
          }}
        >
          <div className="flex items-center gap-2">
            <Coins className="size-4 text-yellow-500" />
            <span className="text-sm font-medium">Token Balance</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{tokenBalance ?? '...'}</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      <DropdownMenuSeparator />

      <DropdownMenuItem onClick={() => openSettings('general')} className="py-3 text-base">
        <Settings className="mr-3 size-5" />
        <span>Settings</span>
      </DropdownMenuItem>
      <DropdownMenuItem asChild className="py-3 text-base">
        <a href="/help" target="_blank" rel="noopener noreferrer">
          <HelpCircle className="mr-3 size-5" />
          <span>Help</span>
        </a>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => openSettings('account')} className="py-3 text-base text-red-600 focus:bg-red-50 focus:text-red-600">
        <LogOut className="mr-3 size-5" />
        <span>Log out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
};

export const UserMenu = ({ isCollapsed }: UserMenuProps) => {
  const { user } = useUser();
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('general');

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await fetch('/api/user/tokens');
        const data = await response.json();
        setTokenBalance(data.tokenBalance);
      } catch (error) {
        console.error('Failed to fetch token balance', error);
      }
    };
    if (user) {
      fetchBalance();
    }
  }, [user]);

  const openSettings = (tab: SettingsTab) => {
    // Close the menu first
    setIsMenuOpen(false);
    // Use a small delay to allow the menu to close and cleanup focus/pointer locks
    setTimeout(() => {
      setSettingsTab(tab);
      setIsSettingsOpen(true);
    }, 100);
  };

  if (!user) {
    return null;
  }

  // Collapsed View: Just the Avatar Trigger
  if (isCollapsed) {
    return (
      <>
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-lg hover:bg-muted/50 focus:outline-none"
            >
              <Avatar className="size-8">
                <AvatarImage src={user.imageUrl} />
                <AvatarFallback>{user.firstName?.[0]}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <UserDropdownContent
            user={user}
            tokenBalance={tokenBalance}
            openSettings={openSettings}
          />
        </DropdownMenu>

        <SettingsModal
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          defaultTab={settingsTab}
        />
      </>
    );
  }

  // Expanded View: Avatar + Token Balance | Blog Button
  return (
    <>
      <div className="flex w-full items-center justify-between gap-2 px-1">
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full bg-muted/50 p-1 pr-3 transition-colors hover:bg-muted focus:outline-none"
            >
              <Avatar className="size-8">
                <AvatarImage src={user.imageUrl} />
                <AvatarFallback>{user.firstName?.[0]}</AvatarFallback>
              </Avatar>

              {tokenBalance !== null && (
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Coins className="size-4 text-yellow-500" />
                  <span>{tokenBalance}</span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <UserDropdownContent
            user={user}
            tokenBalance={tokenBalance}
            openSettings={openSettings}
          />
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href="/blog" // Update with actual blog URL if known, assuming /blog for now
              className="flex items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Blog"
            >
              <BookOpen className="size-4" />
            </a>
          </TooltipTrigger>
          <TooltipContent>Blog</TooltipContent>
        </Tooltip>
      </div>

      <SettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        defaultTab={settingsTab}
      />
    </>
  );
};
