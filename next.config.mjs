import { fileURLToPath } from 'node:url';

import withPWAInit from '@ducanh2912/next-pwa';
import withBundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';
import createJiti from 'jiti';
import withNextIntl from 'next-intl/plugin';

const jiti = createJiti(fileURLToPath(import.meta.url));

jiti('./src/libs/Env');

const withNextIntlConfig = withNextIntl('./src/libs/i18n.ts');

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  // 开发 PWA 时启用以下两项
  // disable: false, // 强制启用，
  // reloadOnOnline: false, // 开发时建议关掉这个，否则联网状态变化会自动刷新很难受
});

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
export default withSentryConfig(
  withPWA(
    bundleAnalyzer(
      withNextIntlConfig({
        eslint: {
          dirs: ['.'],
        },
        poweredByHeader: false,
        reactStrictMode: true,
        images: {
          remotePatterns: [
            {
              protocol: 'https',
              hostname: 'storage.assistant-ui.com',
            },
            {
              protocol: 'https',
              hostname: 'img.clerk.com',
            },
          ],
        },
        experimental: {
          serverComponentsExternalPackages: ['@electric-sql/pglite'],
        },
      }),
    ),
  ),
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options
    // FIXME: Add your Sentry organization and project names
    org: 'nextjs-boilerplate-org',
    project: 'nextjs-boilerplate',

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: '/monitoring',

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Disable Sentry telemetry
    telemetry: false,
  },
);
