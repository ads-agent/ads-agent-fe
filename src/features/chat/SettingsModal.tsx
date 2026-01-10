import { useClerk, useUser } from '@clerk/nextjs';
import { clsx } from 'clsx';
import { Coins, LogOut, Settings as SettingsIcon, User } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/simple-switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TokenPurchase } from '@/features/billing/TokenPurchase';
import { usePathname, useRouter } from '@/libs/i18nNavigation';
import { AppConfig } from '@/utils/AppConfig';

export type SettingsTab = 'general' | 'account' | 'usage';

type SettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: SettingsTab;
};

// Mock Data for Usage Table
const MOCK_USAGE_DATA = [
  { id: 1, title: 'Chat Session - Project Alpha', date: '2025-01-08', tokens: 150 },
  { id: 2, title: 'Code Analysis - Login Bug', date: '2025-01-08', tokens: 320 },
  { id: 3, title: 'Image Generation - Logo', date: '2025-01-07', tokens: 50 },
  { id: 4, title: 'Translation - FR to EN', date: '2025-01-06', tokens: 80 },
  { id: 5, title: 'Chat Session - General', date: '2025-01-05', tokens: 120 },
];

// Separating content to handle state
const SettingsContent = ({ defaultTab, user, signOut, openUserProfile, theme, setTheme, locale, handleLocaleChange, tokenBalance, appConfig }: any) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Sync if prop changes (e.g. re-opening with different intent)
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'account', label: 'Account', icon: User },
    { id: 'usage', label: 'Usage', icon: Coins },
  ];

  return (
    <div className="flex size-full">
      <aside className="flex w-64 flex-col gap-1 border-r bg-muted/10 p-2">
        <div className="p-4 text-lg font-semibold">Settings</div>
        {tabs.map(tab => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted',
              activeTab === tab.id ? 'bg-muted text-primary' : 'text-muted-foreground',
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">General</h3>
              <p className="text-sm text-muted-foreground">Manage your interface preferences.</p>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Dark Mode</span>
                <span className="text-xs text-muted-foreground">Switch between light and dark themes.</span>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={c => setTheme(c ? 'dark' : 'light')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Language</span>
                <span className="text-xs text-muted-foreground">Select your preferred language.</span>
              </div>
              <div className="flex gap-2">
                {appConfig.locales.map((l: any) => (
                  <Button
                    key={l.id}
                    variant={locale === l.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleLocaleChange(l.id)}
                  >
                    {l.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Account</h3>
              <p className="text-sm text-muted-foreground">Manage your account settings.</p>
            </div>
            <Separator />
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback>{user?.firstName?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-lg font-medium">{user?.fullName}</div>
                <div className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => openUserProfile()}>
                Manage Account
              </Button>
              <Button variant="destructive" onClick={() => signOut()}>
                <LogOut className="mr-2 size-4" />
                Log Out
              </Button>
            </div>
            <Separator />
            <div>
              <h4 className="mb-2 text-sm font-medium">Token Balance</h4>
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <Coins className="size-5 text-yellow-500" />
                <span className="text-xl font-bold">{tokenBalance ?? '...'}</span>
                <span className="text-sm text-muted-foreground">credits available</span>
              </div>
            </div>
            <Separator />
            <TokenPurchase />
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Usage</h3>
              <p className="text-sm text-muted-foreground">View your token usage history.</p>
            </div>
            <Separator />
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
              <div className="flex items-center gap-2">
                <Coins className="size-6 text-yellow-500" />
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Current Balance</div>
                  <div className="text-2xl font-bold">
                    {tokenBalance ?? '...'}
                    {' '}
                    Tokens
                  </div>
                </div>
              </div>
              <Button onClick={() => setActiveTab('account')}>Buy Tokens</Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Usage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_USAGE_DATA.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell className="text-right text-red-500">
                        -
                        {item.tokens}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export const SettingsModal = ({ open, onOpenChange, defaultTab = 'general' }: SettingsModalProps) => {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);

  useEffect(() => {
    // Reuse the fetch logic
    const fetchBalance = async () => {
      try {
        const response = await fetch('/api/user/tokens');
        const data = await response.json();
        setTokenBalance(data.tokenBalance);
      } catch (error) {
        console.error('Failed to fetch token balance', error);
      }
    };
    if (open) {
      fetchBalance();
    }
  }, [open]);

  const handleLocaleChange = (newLocale: string) => {
    router.push(pathname, { locale: newLocale });
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[600px] max-w-4xl flex-col overflow-hidden p-0">
        <SettingsContent
          defaultTab={defaultTab}
          user={user}
          signOut={signOut}
          openUserProfile={openUserProfile}
          theme={theme}
          setTheme={setTheme}
          locale={locale}
          handleLocaleChange={handleLocaleChange}
          tokenBalance={tokenBalance}
          appConfig={AppConfig}
        />
      </DialogContent>
    </Dialog>
  );
};
