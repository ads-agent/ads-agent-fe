import { useAssistantState } from '@assistant-ui/react';
import { useClerk, useUser } from '@clerk/nextjs';
import { clsx } from 'clsx';
import { CheckIcon, Coins, LogOut, Settings as SettingsIcon, User } from 'lucide-react';
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
    { id: 'general', label: t('settings_tab_general'), icon: SettingsIcon },
    { id: 'account', label: t('settings_tab_account'), icon: User },
    { id: 'usage', label: t('settings_tab_usage'), icon: Coins },
  ];

  return (
    <div className="flex size-full bg-background">
      <aside className="flex w-64 flex-col gap-1 border-r bg-muted/30 p-4 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2.5 px-3 py-6 mb-2">
          <div className="size-8 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
             <SettingsIcon className="size-4.5 text-primary" />
          </div>
          <span className="font-bold tracking-tight text-foreground/90 text-lg">Settings</span>
        </div>
        <div className="space-y-1">
          {tabs.map(tab => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                activeTab === tab.id 
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-zinc-800',
              )}
            >
              <tab.icon className={clsx("size-4 transition-colors", activeTab === tab.id ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
              {tab.label}
            </button>
          ))}
        </div>
      </aside>
      
      <main className="flex-1 overflow-y-auto bg-background dark:bg-zinc-950">
        <div className="max-w-3xl mx-auto p-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
               {tabs.find(t => t.id === activeTab)?.label}
            </h2>
          </div>

          {activeTab === 'general' && (
            <div className="space-y-12">
              <section>
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-5 opacity-70">通用</h3>
                <div className="space-y-6">
                  <div className="flex flex-col gap-4">
                    <span className="text-sm font-semibold text-foreground/90">{t('settings_language')}</span>
                    <div className="flex flex-wrap gap-2.5">
                      {appConfig.locales.map((l: any) => (
                        <button
                          key={l.id}
                          className={clsx(
                            "px-5 py-2 rounded-xl text-sm font-medium transition-all border",
                            locale === l.id 
                              ? "bg-primary/10 border-primary/30 text-primary" 
                              : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground dark:bg-zinc-900 dark:hover:bg-zinc-800"
                          )}
                          onClick={() => handleLocaleChange(l.id)}
                        >
                          {l.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-5 opacity-70">外观</h3>
                <div className="grid grid-cols-3 gap-4 max-w-md">
                  {[
                    { id: 'light', label: '浅色', color: 'bg-zinc-50 border-zinc-200' },
                    { id: 'dark', label: '深色', color: 'bg-zinc-900 border-zinc-800' },
                    { id: 'system', label: '跟随系统', color: 'bg-gradient-to-br from-zinc-50 via-zinc-400 to-zinc-900 border-zinc-200' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className="flex flex-col items-center gap-3 group transition-all outline-none"
                    >
                      <div className={clsx(
                        "w-full aspect-[4/3] rounded-xl border-2 transition-all p-2 flex items-center justify-center relative overflow-hidden",
                        theme === t.id ? "border-primary ring-4 ring-primary/10 shadow-sm" : "border-muted dark:border-zinc-800 group-hover:border-zinc-300 dark:group-hover:border-zinc-600",
                        t.color
                      )}>
                         {t.id !== 'system' && (
                           <div className={clsx(
                             "w-full h-full rounded-lg flex flex-col gap-1.5 p-2 shadow-inner",
                             t.id === 'light' ? "bg-white" : "bg-zinc-950"
                           )}>
                              <div className={clsx("w-3/4 h-1.5 rounded-full", t.id === 'light' ? "bg-zinc-100" : "bg-zinc-800")} />
                              <div className={clsx("w-1/2 h-1.5 rounded-full", t.id === 'light' ? "bg-zinc-100" : "bg-zinc-800")} />
                              <div className="mt-auto flex justify-end">
                                 <div className={clsx("size-3 rounded-full", t.id === 'light' ? "bg-zinc-200" : "bg-zinc-700")} />
                              </div>
                           </div>
                         )}
                         {theme === t.id && (
                           <div className="absolute inset-0 bg-primary/5 flex items-center justify-center">
                              <div className="bg-primary text-primary-foreground rounded-full p-1 shadow-lg">
                                <CheckIcon className="size-3 stroke-[3px]" />
                              </div>
                           </div>
                         )}
                      </div>
                      <span className={clsx("text-xs font-semibold transition-colors", theme === t.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}>
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="flex items-center gap-5 py-4 px-6 rounded-[2rem] border bg-muted/30 dark:bg-zinc-900/40 dark:border-zinc-800/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                   <User className="size-32" />
                </div>
                <Avatar className="size-14 shadow-md border-2 border-background ring-1 ring-black/5">
                  <AvatarImage src={user?.imageUrl} />
                  <AvatarFallback className="text-lg font-bold bg-primary/5 text-primary">{user?.firstName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 relative z-10">
                  <div className="text-xl font-bold tracking-tight text-foreground truncate">{user?.fullName}</div>
                  <div className="text-sm text-muted-foreground font-medium truncate mt-0.5">{user?.primaryEmailAddress?.emailAddress}</div>
                  <div className="mt-3 flex gap-2.5">
                     <Button size="sm" variant="secondary" onClick={() => openUserProfile()} className="h-9 rounded-xl text-xs font-bold px-4 bg-background dark:bg-zinc-800 hover:bg-muted dark:hover:bg-zinc-700 border shadow-sm transition-all active:scale-95">
                      {t('settings_manage_account')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => signOut()} className="h-9 rounded-xl text-xs font-bold px-4 text-destructive hover:bg-destructive/10 transition-all active:scale-95">
                      <LogOut className="mr-2 size-3.5" />
                      {t('settings_logout')}
                    </Button>
                  </div>
                </div>
              </div>

              <section>
                 <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-5 opacity-70">资产</h3>
                 <div className="flex flex-col gap-4">
                    <div className="p-5 rounded-[2rem] border bg-background shadow-sm dark:bg-zinc-900/20 dark:border-zinc-800/50 flex items-center justify-between group hover:border-primary/20 transition-colors">
                      <div className="flex items-center gap-4">
                         <div className="size-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center text-yellow-600 dark:text-yellow-500 shadow-inner border border-yellow-400/20 transition-transform group-hover:scale-110">
                            <Coins className="size-6" />
                         </div>
                         <div className="flex flex-col">
                            <div className="flex items-baseline gap-1.5">
                               <span className="text-2xl font-black tracking-tight text-foreground">{tokenBalance ?? '...'}</span>
                               <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tokens</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium">Available for current billing cycle</span>
                         </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-9 rounded-xl text-xs font-bold px-5 border-muted-foreground/20 hover:bg-muted dark:hover:bg-zinc-800 transition-all active:scale-95" 
                        onClick={() => setActiveTab('usage')}
                      >
                        查看详情
                      </Button>
                    </div>
                    
                    <div className="p-8 rounded-[2rem] border border-dashed border-muted-foreground/30 bg-muted/10 dark:bg-zinc-900/10 transition-colors hover:bg-muted/20 dark:hover:bg-zinc-900/20">
                       <TokenPurchase variant="inline" />
                    </div>
                 </div>
              </section>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="space-y-6">
              <div className="rounded-[2rem] border bg-background shadow-sm overflow-hidden dark:bg-zinc-950 dark:border-zinc-800/50">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50 border-none dark:bg-zinc-900/50">
                      <TableHead className="font-bold py-4 px-4 text-foreground/70 uppercase text-[10px] tracking-widest">{t('settings_usage_table_title')}</TableHead>
                      <TableHead className="font-bold py-4 px-4 text-foreground/70 uppercase text-[10px] tracking-widest">{t('settings_usage_table_date')}</TableHead>
                      <TableHead className="text-right font-bold py-4 px-4 text-foreground/70 uppercase text-[10px] tracking-widest">{t('settings_usage_table_usage')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingUsage ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-64 text-center text-muted-foreground font-medium">
                          <div className="flex flex-col items-center gap-3">
                             <div className="size-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                             <span>Loading usage history...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : usageHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-64 text-center text-muted-foreground font-medium">
                          No usage data found.
                        </TableCell>
                      </TableRow>
                    ) : usageHistory.map((item) => {
                      const thread = Object.values(threadItems).find((t: any) => t.id === item.threadId) as any;
                      const displayTitle = thread?.title || item.title || 'Chat Session';

                      return (
                        <TableRow key={item.threadId} className="hover:bg-muted/30 dark:hover:bg-zinc-900/30 transition-colors border-muted dark:border-zinc-900">
                          <TableCell className="max-w-[280px] truncate font-semibold py-4 px-4 text-foreground/90" title={displayTitle}>
                            {displayTitle}
                          </TableCell>
                          <TableCell className="text-muted-foreground font-medium py-4 px-4 text-xs">{new Date(item.lastUsedAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right py-4 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/5 text-primary text-xs font-bold border border-primary/10">
                              -{item.totalTokens.toLocaleString()}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
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
