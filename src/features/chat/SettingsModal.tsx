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
        <div className="mb-2 flex items-center gap-2.5 px-3 py-6">
          <div className="flex size-8 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
            <SettingsIcon className="size-4.5 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground/90">{t('settings_title')}</span>
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
              <tab.icon className={clsx('size-4 transition-colors', activeTab === tab.id ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
              {tab.label}
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-background dark:bg-zinc-950">
        <div className="mx-auto max-w-3xl p-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
          </div>

          {activeTab === 'general' && (
            <div className="space-y-12">
              <section>
                <h3 className="mb-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">{t('settings_tab_general')}</h3>
                <div className="space-y-6">
                  <div className="flex flex-col gap-4">
                    <span className="text-sm font-semibold text-foreground/90">{t('settings_language')}</span>
                    <div className="flex flex-wrap gap-2.5">
                      {appConfig.locales.map((l: any) => (
                        <button
                          type="button"
                          key={l.id}
                          className={clsx(
                            'rounded-xl border px-5 py-2 text-sm font-medium transition-all',
                            locale === l.id
                              ? 'border-primary/30 bg-primary/10 text-primary'
                              : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground dark:bg-zinc-900 dark:hover:bg-zinc-800',
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
                <h3 className="mb-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">{t('settings_appearance')}</h3>
                <div className="grid max-w-md grid-cols-3 gap-4">
                  {[
                    { id: 'light', label: t('settings_theme_light'), color: 'bg-zinc-50 border-zinc-200' },
                    { id: 'dark', label: t('settings_theme_dark'), color: 'bg-zinc-900 border-zinc-800' },
                    { id: 'system', label: t('settings_theme_system'), color: 'bg-gradient-to-br from-zinc-50 via-zinc-400 to-zinc-900 border-zinc-200' },
                  ].map(themeItem => (
                    <button
                      type="button"
                      key={themeItem.id}
                      onClick={() => setTheme(themeItem.id)}
                      className="group flex flex-col items-center gap-3 outline-none transition-all"
                    >
                      <div className={clsx(
                        'relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl border-2 p-2 transition-all',
                        theme === themeItem.id ? 'border-primary shadow-sm ring-4 ring-primary/10' : 'border-muted group-hover:border-zinc-300 dark:border-zinc-800 dark:group-hover:border-zinc-600',
                        themeItem.color,
                      )}
                      >
                        {themeItem.id !== 'system' && (
                          <div className={clsx(
                            'flex size-full flex-col gap-1.5 rounded-lg p-2 shadow-inner',
                            themeItem.id === 'light' ? 'bg-white' : 'bg-zinc-950',
                          )}
                          >
                            <div className={clsx('h-1.5 w-3/4 rounded-full', themeItem.id === 'light' ? 'bg-zinc-100' : 'bg-zinc-800')} />
                            <div className={clsx('h-1.5 w-1/2 rounded-full', themeItem.id === 'light' ? 'bg-zinc-100' : 'bg-zinc-800')} />
                            <div className="mt-auto flex justify-end">
                              <div className={clsx('size-3 rounded-full', themeItem.id === 'light' ? 'bg-zinc-200' : 'bg-zinc-700')} />
                            </div>
                          </div>
                        )}
                        {theme === themeItem.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                            <div className="rounded-full bg-primary p-1 text-primary-foreground shadow-lg">
                              <CheckIcon className="size-3 stroke-[3px]" />
                            </div>
                          </div>
                        )}
                      </div>
                      <span className={clsx('text-xs font-semibold transition-colors', theme === themeItem.id ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')}>
                        {themeItem.label}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="relative flex items-center gap-5 overflow-hidden rounded-[2rem] border bg-muted/30 px-6 py-4 dark:border-zinc-800/50 dark:bg-zinc-900/40">
                <div className="pointer-events-none absolute right-0 top-0 p-8 opacity-[0.03]">
                  <User className="size-32" />
                </div>
                <Avatar className="size-14 border-2 border-background shadow-md ring-1 ring-black/5">
                  <AvatarImage src={user?.imageUrl} />
                  <AvatarFallback className="bg-primary/5 text-lg font-bold text-primary">{user?.firstName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="relative z-10 min-w-0 flex-1">
                  <div className="truncate text-xl font-bold tracking-tight text-foreground">{user?.fullName}</div>
                  <div className="mt-0.5 truncate text-sm font-medium text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</div>
                  <div className="mt-3 flex gap-2.5">
                    <Button size="sm" variant="secondary" onClick={() => openUserProfile()} className="h-9 rounded-xl border bg-background px-4 text-xs font-bold shadow-sm transition-all hover:bg-muted active:scale-95 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                      {t('settings_manage_account')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => signOut()} className="h-9 rounded-xl px-4 text-xs font-bold text-destructive transition-all hover:bg-destructive/10 active:scale-95">
                      <LogOut className="mr-2 size-3.5" />
                      {t('settings_logout')}
                    </Button>
                  </div>
                </div>
              </div>

              <section>
                <h3 className="mb-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">{t('settings_assets')}</h3>
                <div className="flex flex-col gap-4">
                  <div className="group flex items-center justify-between rounded-[2rem] border bg-background p-5 shadow-sm transition-colors hover:border-primary/20 dark:border-zinc-800/50 dark:bg-zinc-900/20">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/10 text-yellow-600 shadow-inner transition-transform group-hover:scale-110 dark:text-yellow-500">
                        <Coins className="size-6" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-black tracking-tight text-foreground">{tokenBalance ?? '...'}</span>
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('settings_usage_table_usage')}</span>
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground">{t('settings_tokens_available_description')}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 rounded-xl border-muted-foreground/20 px-5 text-xs font-bold transition-all hover:bg-muted active:scale-95 dark:hover:bg-zinc-800"
                      onClick={() => setActiveTab('usage')}
                    >
                      {t('settings_view_details')}
                    </Button>
                  </div>

                  <div className="rounded-[2rem] border border-dashed border-muted-foreground/30 bg-muted/10 p-8 transition-colors hover:bg-muted/20 dark:bg-zinc-900/10 dark:hover:bg-zinc-900/20">
                    <TokenPurchase variant="inline" />
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="space-y-6">
              <div className="overflow-hidden rounded-[2rem] border bg-background shadow-sm dark:border-zinc-800/50 dark:bg-zinc-950">
                <Table>
                  <TableHeader>
                    <TableRow className="border-none bg-muted/50 hover:bg-muted/50 dark:bg-zinc-900/50">
                      <TableHead className="p-4 text-[10px] font-bold uppercase tracking-widest text-foreground/70">{t('settings_usage_table_title')}</TableHead>
                      <TableHead className="p-4 text-[10px] font-bold uppercase tracking-widest text-foreground/70">{t('settings_usage_table_date')}</TableHead>
                      <TableHead className="p-4 text-right text-[10px] font-bold uppercase tracking-widest text-foreground/70">{t('settings_usage_table_usage')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingUsage
                      ? (
                          <TableRow>
                            <TableCell colSpan={3} className="h-64 text-center font-medium text-muted-foreground">
                              <div className="flex flex-col items-center gap-3">
                                <div className="size-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                                <span>{t('settings_usage_loading')}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      : usageHistory.length === 0
                        ? (
                            <TableRow>
                              <TableCell colSpan={3} className="h-64 text-center font-medium text-muted-foreground">
                                {t('settings_usage_no_data')}
                              </TableCell>
                            </TableRow>
                          )
                        : usageHistory.map((item) => {
                          const thread = Object.values(threadItems).find((t: any) => t.id === item.threadId) as any;
                          const displayTitle = thread?.title || item.title || t('settings_usage_fallback_title');

                          return (
                            <TableRow key={item.threadId} className="border-muted transition-colors hover:bg-muted/30 dark:border-zinc-900 dark:hover:bg-zinc-900/30">
                              <TableCell className="max-w-[280px] truncate p-4 font-semibold text-foreground/90" title={displayTitle}>
                                {displayTitle}
                              </TableCell>
                              <TableCell className="p-4 text-xs font-medium text-muted-foreground">{new Date(item.lastUsedAt).toLocaleDateString()}</TableCell>
                              <TableCell className="p-4 text-right">
                                <span className="inline-flex items-center rounded-full border border-primary/10 bg-primary/5 px-2 py-0.5 text-xs font-bold text-primary">
                                  -
                                  {item.totalTokens.toLocaleString()}
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
