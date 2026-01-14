## [1.9.1] (2026-01-13)


### Features

* **chat-ui**: update welcome suggestions prompts and behavior for better user onboarding
* **chat-ui**: hide welcome badge in the chat interface to streamline the welcome view
* **chat**: implement model selection and ensure selected model is passed to the backend completions API
* **i18n**: expand localization support to `UserMenu`, `SettingsModal`, and other key UI components
* **chat-ui**: refactor `SettingsModal` for better structural organization and UX
* **chat-ui**: comprehensive refactor of the chat interface, improving sidebar and thread list layout
* **api**: ensure chat sharing endpoints are publicly accessible for shared thread viewing

### Bug Fixes

* **chat-ui**: fix thread list highlighting by correcting Tailwind `data-active` selectors to `data-[active]`

## [1.9.0] (2026-01-12)


### Features

* **chat**: implement public chat sharing with UUID-based deep linking and persistent database storage
* **chat**: create a specialized, read-only shared thread view with manual `ReactMarkdown` rendering to avoid runtime dependencies
* **chat**: add `ShareChatModal` for generating public links with automatic thread state extraction and field filtering
* **chat**: implement absolute URL generation for share links by combining origin with API-returned paths
* **chat-ui**: optimize shared markdown rendering with custom `CodeHeader`, code block detection, and "text" language fallback
* **chat-ui**: add a prominent "Start a new Chat" call-to-action on shared pages to drive user engagement
* **i18n**: implement full English and Chinese localization for all share-related UI components and modals

## [1.8.9] (2026-01-11)


### Features

* **billing**: implement token usage tracking and server-side balance reduction in the chat API
* **billing**: add `token_usage` schema and migration for persistent consumption logging
* **billing**: create usage history API with thread-based aggregation and activity grouping
* **chat-ui**: update settings modal to display real usage data with thread titles from runtime
* **chat-ui**: enforce non-negative balance display across all UI components (`UserMenu`, `SettingsModal`, `TokenBalance`)
* **chat-ui**: remove model information from usage history for a cleaner interface
* **chat-ui**: redesign prompt suggestions with a 2x2 responsive grid and improved card layout (title/content separation, line clamping, and chevron icons)
* **chat-ui**: expand initial prompt suggestions to 4 specialized diagnostic questions with full English and Chinese localization

## [1.8.8] (2026-01-11)


### Features

* **i18n**: replace French locale with Chinese (`zh`) support across the application
* **i18n**: implement full multi-locale support for the `/chat` interface, including sidebar, header, tooltips, and thread list
* **i18n**: localize `UserMenu`, `SettingsModal`, and `TokenPurchase` components
* **i18n**: integrate Clerk `zhCN` localization for the `UserProfile` modal

## [1.8.7] (2026-01-11)


### Features

* **chat-ui**: implement persistent dark mode support with per-user `localStorage` synchronization
* **chat-ui**: add `ThemeProvider` for global shadcn/ui dark mode support
* **chat-ui**: add `UserThemeSync` component to persist theme preferences across sessions for authenticated users

## [1.8.6] (2026-01-10)


### Features

* **chat**: fix `AssistantCloud` initialization by guarding `ChatLayout` with `isLoaded` auth state and adding a loading spinner
* **auth**: update post-login and post-signup redirects to default to `/chat` instead of `/dashboard`
* **billing**: redirect to `/chat` instead of `/dashboard` after successful or cancelled Stripe payments

## [1.8.5] (2026-01-09)


### Features

* **chat-ui**: implement custom `UserMenu` and `SettingsModal` to replace Clerk's default user button
* **chat-ui**: add unified settings modal with General (theme/language), Account (profile/billing), and Usage (history) tabs
* **chat-ui**: redesign sidebar footer with unified Avatar/Token-Balance pill and Blog navigation
* **chat-ui**: optimize sidebar navigation by replacing Dashboard/Settings with a Search placeholder
* **chat-ui**: improve overlay UX by resolving pointer-event conflicts between dropdown menus and dialogs
* **chat-ui**: remove redundant "..." action from the chat header
* **billing**: integrate `TokenPurchase` into the settings modal with deep linking from usage history

## [1.8.4] (2026-01-09)


### Features

* **auth**: protect `/chat` route and improve locale extraction in middleware

## [1.8.3] (2026-01-07)


### Features

* **billing**: integrate Stripe for one-off token purchases
* **billing**: add `user` table to schema for tracking token balances
* **billing**: implement `TokenPurchase` and `TokenBalance` components
* **billing**: add Stripe webhook handler for `checkout.session.completed`
* **api**: add endpoints for Stripe checkout and user token retrieval

## [1.8.2] (2026-01-06)


### Features

* **database**: migrate to Neon Serverless driver and `drizzle-orm/neon-serverless` adapter for production
* **chat**: implement bi-directional synchronization between URL and assistant thread state (deep linking)
* **chat**: add collapsed display mode to `ThreadList` component for improved sidebar UX
* **chat**: optimize thread switching logic with robust loading state handling and loop prevention
* **chat**: improve new thread workflow by maintaining `/chat` URL for empty threads until first message

## [1.8.1] (2026-01-05)


### Features

* **chat**: use Clerk for Assistant Cloud authentication
* **chat**: integrate Assistant Cloud for thread persistence and management
* **chat**: refactor thread list UI to use `ThreadList` component for both custom and cloud backends
* **chat**: add environment variables `NEXT_PUBLIC_ASSISTANT_BASE_URL` and `NEXT_PUBLIC_USE_CUSTOM_SERVER_FOR_THREAD_PERSISTENCE`
* **chat**: refactor chat routing to use optional catch-all `[[...threadId]]` for better new thread handling
* **chat**: implement server-side thread ID generation and metadata-driven URL updates without page reload
* **api**: refactor chat route to support streaming metadata (thread ID, run ID) from custom backend

## [1.8.0] (2026-01-04)


### Features

* **chat**: integrate custom chat backend via `/v1/chat/completions`
* **chat**: support switching between OpenAI and custom backend using `USE_CUSTOM_CHAT_API` and `CHAT_API_BASE_URL` environment variables
* **chat-ui**: implement collapsible sidebar with logo and improved navigation
* **chat-ui**: integrate Clerk `UserButton` in sidebar footer and reorganize dashboard/settings links
* **chat-ui**: increase chat window maximum width for better readability on large screens
* **chat-ui**: refine logo usage with `adbuddy_logo_small.png` and hover-to-expand behavior in collapsed sidebar
* **chat-ui**: hide thread list in collapsed sidebar state for cleaner UI
* **branding**: comment out promotional `DemoBadge` and `DemoBanner` for production readiness

## [1.7.7](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.7.6...v1.7.7) (2025-12-12)


### Bug Fixes

* update checkly.config.ts ([61424bf](https://github.com/ixartz/SaaS-Boilerplate/commit/61424bfa71764c08d349b7555c5f8696b070ffb5))

## [1.7.6](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.7.5...v1.7.6) (2025-05-01)


### Bug Fixes

* update clerk to the latest version and update middlware to use await with auth ([2287192](https://github.com/ixartz/SaaS-Boilerplate/commit/2287192ddcf5b27a1f43ac2b7a992e065b990627))

## [1.7.5](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.7.4...v1.7.5) (2025-05-01)


### Bug Fixes

* clerk integration ([a9981cd](https://github.com/ixartz/SaaS-Boilerplate/commit/a9981cddcb4a0e2365066938533cd13225ce10a9))

## [1.7.4](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.7.3...v1.7.4) (2024-12-20)


### Bug Fixes

* remove custom framework configuration for i18n-ally vscode ([63f87fe](https://github.com/ixartz/SaaS-Boilerplate/commit/63f87feb3c0cb186c500ef9bed9cb50d7309224d))
* use new vitest vscode setting for preventing automatic opening of the test results ([2a2b945](https://github.com/ixartz/SaaS-Boilerplate/commit/2a2b945050f8d19883d6f2a8a6ec5ccf8b1f4173))

## [1.7.3](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.7.2...v1.7.3) (2024-11-07)


### Bug Fixes

* chnage dashboard index message button in french translation ([2f1dca8](https://github.com/ixartz/SaaS-Boilerplate/commit/2f1dca84cb05af52a959dd9630769ed661d8c69b))
* remove update deps github workflow, add separator in dashboard header ([fcf0fb4](https://github.com/ixartz/SaaS-Boilerplate/commit/fcf0fb48304ce45f6ceefa7d7eae11692655c749))

## [1.7.2](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.7.1...v1.7.2) (2024-10-17)


### Bug Fixes

* hide text in logo used in dashboard and add spacing for sign in button used in navbar ([a0eeda1](https://github.com/ixartz/SaaS-Boilerplate/commit/a0eeda12251551fd6a8e50222f46f3d47f0daad7))
* in dashboard, make the logo smaller, display without text ([f780727](https://github.com/ixartz/SaaS-Boilerplate/commit/f780727659fa58bbe6e4250dd63b2819369b7308))
* remove hydration error and unify with pro version 1.6.1 ([ea2d02b](https://github.com/ixartz/SaaS-Boilerplate/commit/ea2d02bd52de34c6cd2390d160ffe7f14319d5c3))

## [1.7.1](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.7.0...v1.7.1) (2024-10-04)


### Bug Fixes

* update logicalId in checkly configuration ([6e7a479](https://github.com/ixartz/SaaS-Boilerplate/commit/6e7a4795bff0b92d3681fadc36256aa957eb2613))

# [1.7.0](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.6.1...v1.7.0) (2024-10-04)


### Features

* update de Next.js Boilerplate v3.58.1 ([16aea65](https://github.com/ixartz/SaaS-Boilerplate/commit/16aea651ef93ed627e3bf310412cfd3651aeb3e4))

## [1.6.1](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.6.0...v1.6.1) (2024-08-31)


### Bug Fixes

* add demo banner at the top of the landing page ([09bf8c8](https://github.com/ixartz/SaaS-Boilerplate/commit/09bf8c8aba06eba1405fb0c20aeec23dfb732bb7))
* issue to build Next.js with Node.js 22.7, use 22.6 instead ([4acaef9](https://github.com/ixartz/SaaS-Boilerplate/commit/4acaef95edec3cd72a35405969ece9d55a2bb641))

# [1.6.0](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.5.0...v1.6.0) (2024-07-26)


### Features

* update to Next.js Boilerpalte v3.54 ([ae80843](https://github.com/ixartz/SaaS-Boilerplate/commit/ae808433e50d6889559fff382d4b9c595d34e04f))

# [1.5.0](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.4.0...v1.5.0) (2024-06-05)


### Features

* update to Drizzle Kit 0.22, Storybook 8, migrate to vitest ([c2f19cd](https://github.com/ixartz/SaaS-Boilerplate/commit/c2f19cd8e9dc983e0ad799da2474610b57b88f50))

# [1.4.0](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.3.0...v1.4.0) (2024-05-17)


### Features

* vscode jest open test result view on test fails and add unauthenticatedUrl in clerk middleware ([3cfcb6b](https://github.com/ixartz/SaaS-Boilerplate/commit/3cfcb6b00d91dabcb00cbf8eb2d8be6533ff672e))

# [1.3.0](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.2.1...v1.3.0) (2024-05-16)


### Features

* add custom framework for i18n-ally and replace deprecated Jest VSCode configuration ([a9889dc](https://github.com/ixartz/SaaS-Boilerplate/commit/a9889dc129aeeba8801f4f47e54d46e9515e6a29))
* create dashboard header component ([f3dc1da](https://github.com/ixartz/SaaS-Boilerplate/commit/f3dc1da451ab8dce90d111fe4bbc8d4bc99e4b01))
* don't redirect to organization-selection if the user is already on this page ([87da997](https://github.com/ixartz/SaaS-Boilerplate/commit/87da997b853fd9dcb7992107d2cb206817258910))
* make the landing page responsive and works on mobile ([27e908a](https://github.com/ixartz/SaaS-Boilerplate/commit/27e908a735ea13845a6cc42acc12e6cae3232b9b))
* make user dashboard responsive ([f88c9dd](https://github.com/ixartz/SaaS-Boilerplate/commit/f88c9dd5ac51339d37d1d010e5b16c7776c73b8d))
* migreate Env.mjs file to Env.ts ([2e6ff12](https://github.com/ixartz/SaaS-Boilerplate/commit/2e6ff124dcc10a3c12cac672cbb82ec4000dc60c))
* remove next-sitemap and use the native Next.js sitemap/robots.txt ([75c9751](https://github.com/ixartz/SaaS-Boilerplate/commit/75c9751d607b8a6a269d08667f7d9900797ff38a))
* upgrade to Clerk v5 and use Clerk's Core 2 ([a92cef0](https://github.com/ixartz/SaaS-Boilerplate/commit/a92cef026b5c85a703f707aabf42d28a16f07054))
* use Node.js version 20 and 22 in GitHub Actions ([226b5e9](https://github.com/ixartz/SaaS-Boilerplate/commit/226b5e970f46bfcd384ca60cd63ebb15516eca21))

## [1.2.1](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.2.0...v1.2.1) (2024-03-30)


### Bug Fixes

* redirect user to the landing page after signing out ([6e9f383](https://github.com/ixartz/SaaS-Boilerplate/commit/6e9f3839daaab56dd3cf3e57287ea0f3862b8588))

# [1.2.0](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.1.0...v1.2.0) (2024-03-29)


### Features

* add link to the GitHub repository ([ed42176](https://github.com/ixartz/SaaS-Boilerplate/commit/ed42176bdc2776cacc2c939bac45914a1ede8e51))

# [1.1.0](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.0.0...v1.1.0) (2024-03-29)


### Features

* launching SaaS boilerplate for helping developers to build SaaS quickly ([7f24661](https://github.com/ixartz/SaaS-Boilerplate/commit/7f246618791e3a731347dffc694a52fa90b1152a))

# 1.0.0 (2024-03-29)


### Features

* initial commit ([d58e1d9](https://github.com/ixartz/SaaS-Boilerplate/commit/d58e1d97e11baa0a756bd038332eb84daf5a8327))
