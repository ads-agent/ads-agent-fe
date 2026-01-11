'use client';

import { enUS, frFR } from '@clerk/localizations';
import { ClerkProvider } from '@clerk/nextjs';

import { UserThemeSync } from '@/components/UserThemeSync';
import { AppConfig } from '@/utils/AppConfig';

export default function AuthLayout(props: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  let clerkLocale = enUS;
  let signInUrl = '/sign-in';
  let signUpUrl = '/sign-up';
  let _dashboardUrl = '/dashboard';
  let chatUrl = '/chat';
  let afterSignOutUrl = '/';

  if (props.params.locale === 'fr') {
    clerkLocale = frFR;
  }

  if (props.params.locale !== AppConfig.defaultLocale) {
    signInUrl = `/${props.params.locale}${signInUrl}`;
    signUpUrl = `/${props.params.locale}${signUpUrl}`;
    _dashboardUrl = `/${props.params.locale}${_dashboardUrl}`;
    chatUrl = `/${props.params.locale}${chatUrl}`;
    afterSignOutUrl = `/${props.params.locale}${afterSignOutUrl}`;
  }

  return (
    <ClerkProvider
      // PRO: Dark mode support for Clerk
      localization={clerkLocale}
      signInUrl={signInUrl}
      signUpUrl={signUpUrl}
      signInFallbackRedirectUrl={chatUrl}
      signUpFallbackRedirectUrl={chatUrl}
      afterSignOutUrl={afterSignOutUrl}
    >
      <UserThemeSync />
      {props.children}
    </ClerkProvider>
  );
}
