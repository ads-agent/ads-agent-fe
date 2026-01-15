import '@/styles/global.css';

import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider, useMessages } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';

import { ThemeProvider } from '@/components/ThemeProvider';
// import { DemoBadge } from '@/components/DemoBadge';
import { AllLocales } from '@/utils/AppConfig';

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: 'AdBuddy - Turning Diagnosis Into Direction',
    template: '%s | AdBuddy',
  },
  icons: [
    {
      rel: 'apple-touch-icon',
      url: '/assets/images/adbuddy_logo_small.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      url: '/assets/images/adbuddy_logo_small.png',
    },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AdBuddy',
  },
};

export function generateStaticParams() {
  return AllLocales.map(locale => ({ locale }));
}

export default function RootLayout(props: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  unstable_setRequestLocale(props.params.locale);

  // Using internationalization in Client Components
  const messages = useMessages();

  // The `suppressHydrationWarning` in <html> is used to prevent hydration errors caused by `next-themes`.
  // Solution provided by the package itself: https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app

  // The `suppressHydrationWarning` attribute in <body> is used to prevent hydration errors caused by Sentry Overlay,
  // which dynamically adds a `style` attribute to the body tag.
  return (
    <html lang={props.params.locale} suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <NextIntlClientProvider
            locale={props.params.locale}
            messages={messages}
          >
            {props.children}

            {/* Commented out for production site
          <DemoBadge />
          */}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
