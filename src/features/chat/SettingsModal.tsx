import { useAssistantState } from '@assistant-ui/react';
import { useClerk, useUser } from '@clerk/nextjs';
import { clsx } from 'clsx';
import { Coins, LogOut, Settings as SettingsIcon, User } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
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

// Separating content to handle state
const SettingsContent = ({ defaultTab, user, signOut, openUserProfile, theme, setTheme, locale, handleLocaleChange, tokenBalance, appConfig }: any) => {
  const t = useTranslations('Chat');
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [usageHistory, setUsageHistory] = useState<any[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(false);

  const threadItems = useAssistantState(({ threads }) => threads.threadItems);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (activeTab === 'usage') {
      const fetchUsage = async () => {
        setLoadingUsage(true);
        try {
          const response = await fetch('/api/user/usage');
          const data = await response.json();
          setUsageHistory(data);
        } catch (error) {
          console.error('Failed to fetch usage history', error);
        } finally {
          setLoadingUsage(false);
        }
      };
      fetchUsage();
    }
  }, [activeTab]);

  const tabs = [
    { id: 'account', label: t('settings_tab_account'), icon: User },
    { id: 'general', label: t('settings_tab_general'), icon: SettingsIcon },
    { id: 'usage', label: t('settings_tab_usage'), icon: Coins },
  ];

  return (
    <div className="flex size-full">
      <aside className="flex w-60 flex-col gap-1 border-r bg-secondary/30 p-4">
        <div className="flex items-center gap-2 px-2 py-4 mb-2">
          <div className="size-6 bg-primary rounded-md flex items-center justify-center">
             <SettingsIcon className="size-4 text-white" />
          </div>
          <span className="font-bold tracking-tight text-foreground/90">Settings</span>
        </div>
        {tabs.map(tab => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
              activeTab === tab.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold tracking-tight mb-1">
             {tabs.find(t => t.id === activeTab)?.label}
          </h2>
        </div>

        {activeTab === 'general' && (
          <div className="space-y-10">
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">通用</h3>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <span className="text-sm font-medium">{t('settings_language')}</span>
                  <div className="flex flex-wrap gap-2">
                    {appConfig.locales.map((l: any) => (
                      <Button
                        key={l.id}
                        variant={locale === l.id ? 'default' : 'secondary'}
                        size="sm"
                        className="rounded-lg px-4"
                        onClick={() => handleLocaleChange(l.id)}
                      >
                        {l.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">外观</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'light', label: '浅色', color: 'bg-white border-white' },
                  { id: 'dark', label: '深色', color: 'bg-zinc-900 border-zinc-900' },
                  { id: 'system', label: '跟随系统', color: 'bg-gradient-to-r from-white to-zinc-900 border-zinc-200' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={clsx(
                      "flex flex-col items-center gap-2 group transition-all",
                      theme === t.id ? "scale-[1.02]" : "opacity-80 hover:opacity-100"
                    )}
                  >
                    <div className={clsx(
                      "w-full aspect-[4/3] rounded-xl border-2 transition-all p-2",
                      theme === t.id ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-transparent group-hover:border-zinc-300",
                      t.color
                    )}>
                       <div className="w-full h-full bg-black/5 rounded-md flex flex-col gap-1 p-1">
                          <div className="w-1/2 h-1 bg-black/10 rounded" />
                          <div className="w-2/3 h-1 bg-black/10 rounded" />
                       </div>
                    </div>
                    <span className={clsx("text-xs font-medium", theme === t.id ? "text-primary" : "text-muted-foreground")}>
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-8">
            <div className="flex items-center gap-6 p-6 rounded-2xl border bg-secondary/10">
              <Avatar className="size-20 shadow-sm border-2 border-background">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback className="text-xl">{user?.firstName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-2xl font-bold tracking-tight">{user?.fullName}</div>
                <div className="text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</div>
                <div className="mt-4 flex gap-2">
                   <Button size="sm" variant="secondary" onClick={() => openUserProfile()} className="rounded-lg">
                    {t('settings_manage_account')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => signOut()} className="rounded-lg text-destructive hover:bg-destructive/10">
                    <LogOut className="mr-2 size-4" />
                    {t('settings_logout')}
                  </Button>
                </div>
              </div>
            </div>

            <section>
               <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">资产</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 rounded-2xl border bg-card shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground mb-2">{t('settings_token_balance')}</div>
                    <div className="flex items-baseline gap-2">
                       <span className="text-3xl font-bold tracking-tight">{tokenBalance ?? '...'}</span>
                       <span className="text-sm font-medium text-muted-foreground">Tokens</span>
                    </div>
                    <div className="mt-4">
                       <Button size="sm" className="w-full rounded-lg" onClick={() => setActiveTab('usage')}>查看详情</Button>
                    </div>
                  </div>
                  <div className="p-6 rounded-2xl border border-dashed flex flex-col items-center justify-center gap-2 text-center">
                     <p className="text-sm text-muted-foreground">需要更多 Token？</p>
                     <TokenPurchase />
                  </div>
               </div>
            </section>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="space-y-6">
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/20 hover:bg-secondary/20 border-none">
                    <TableHead className="font-bold py-4">{t('settings_usage_table_title')}</TableHead>
                    <TableHead className="font-bold py-4">{t('settings_usage_table_date')}</TableHead>
                    <TableHead className="text-right font-bold py-4">{t('settings_usage_table_usage')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingUsage ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-40 text-center text-muted-foreground">
                        Loading usage history...
                      </TableCell>
                    </TableRow>
                  ) : usageHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-40 text-center text-muted-foreground">
                        No usage data found.
                      </TableCell>
                    </TableRow>
                  ) : usageHistory.map((item) => {
                    const thread = Object.values(threadItems).find((t: any) => t.id === item.threadId) as any;
                    const displayTitle = thread?.title || item.title || 'Chat Session';

                    return (
                      <TableRow key={item.threadId} className="hover:bg-secondary/10 transition-colors border-zinc-100">
                        <TableCell className="max-w-[300px] truncate font-medium py-4" title={displayTitle}>
                          {displayTitle}
                        </TableCell>
                        <TableCell className="text-muted-foreground py-4">{new Date(item.lastUsedAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right font-bold py-4 text-primary">
                          -{item.totalTokens}
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
        const balance = data.tokenBalance;
        setTokenBalance(balance < 0 ? 0 : balance);
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
