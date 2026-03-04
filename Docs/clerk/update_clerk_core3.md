Title: Upgrading to Clerk Core 3 - Upgrade guides | Clerk Docs

URL Source: https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3

Markdown Content:
Upgrading to Clerk Core 3 - Upgrade guides | Clerk Docs
===============

[Skip to main content](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#main)

[Docs](https://clerk.com/docs)

Search documentation Ctrl K Ask AI

[Sign Up](https://dashboard.clerk.com/sign-up)

[Sign Up](https://dashboard.clerk.com/sign-up)

Select your SDK

Next.js

- [Guides](https://clerk.com/docs/nextjs/getting-started/quickstart)
- Reference

- Getting started

- Authentication flows

- User management

- Session management

- Organization management

- Billing management

- Account Portal

- Customizing Clerk

- Securing your app

- AI

- Development
  - [Rendering modes](https://clerk.com/docs/guides/development/rendering-modes)
  - [Verifying OAuth access tokens](https://clerk.com/docs/nextjs/guides/development/verifying-oauth-access-tokens)
  - [Verifying API keys Beta](https://clerk.com/docs/guides/development/verifying-api-keys)
  - [Managing environments](https://clerk.com/docs/guides/development/managing-environments)
  - [Clerk environment variables](https://clerk.com/docs/guides/development/clerk-environment-variables)
  - [Making requests](https://clerk.com/docs/guides/development/making-requests)
  - [Overriding Clerk types/interfaces](https://clerk.com/docs/guides/development/override-clerk-types-interfaces)
  - [Image optimization](https://clerk.com/docs/guides/development/image-optimization)
  - [shadcn/ui CLI](https://clerk.com/docs/guides/development/shadcn-cli)
  - [tRPC](https://clerk.com/docs/guides/development/trpc)
  - Webhooks

  - Integrations

  - Testing with Clerk

  - Troubleshooting

  - Deployment

  - Migrating your data

  - SDK Development

  - Upgrading Clerk
    - [Overview](https://clerk.com/docs/guides/development/upgrading/overview)
    - [Versioning & LTS](https://clerk.com/docs/guides/development/upgrading/versioning)
    - Upgrade guides
      - [Core 3](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3)
      - [Core 2](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-2)
      - [Node to Express](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/node-to-express)
      - [@clerk/nextjs v6](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/nextjs-v6)
      - [API Version 2025-11-10](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/2025-11-10)

- Clerk Dashboard

- How Clerk works

1.  [Guides](https://clerk.com/docs/nextjs/getting-started/quickstart)
2.  [Development](https://clerk.com/docs/guides/development/hybrid-rendering)
3.  [Upgrading Clerk](https://clerk.com/docs/guides/development/upgrading/overview)
4.  [Upgrade guides](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3)

# Upgrading to Clerk Core 3

1.  [Overview](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#overview)
2.  [Preparing to upgrade](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#preparing-to-upgrade)
3.  [Upgrade using the CLI](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#upgrade-using-the-cli)
4.  [Breaking changes](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#breaking-changes)
5.  [Deprecation removals](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#deprecation-removals)
6.  [Deprecations](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#deprecations)
7.  [Version requirements](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#version-requirements)
8.  [Behavior changes](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#behavior-changes)
9.  [SDK-specific changes](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#sdk-specific-changes)

- Copy as markdown Copy as markdown
- [Open in ChatGPT](https://chatgpt.com/?q=Read+https%3A%2F%2Fclerk.com%2Fdocs%2Fguides%2Fdevelopment%2Fupgrading%2Fupgrade-guides%2Fcore-3.md&hints=search)
- [Open in Claude](https://claude.ai/new?q=Read+https%3A%2F%2Fclerk.com%2Fdocs%2Fguides%2Fdevelopment%2Fupgrading%2Fupgrade-guides%2Fcore-3.md)
- [Open in Cursor](https://cursor.com/link/prompt?text=Read+https%3A%2F%2Fclerk.com%2Fdocs%2Fguides%2Fdevelopment%2Fupgrading%2Fupgrade-guides%2Fcore-3.md)
- [Open in T3 Chat](https://t3.chat/new?q=Read+https%3A%2F%2Fclerk.com%2Fdocs%2Fguides%2Fdevelopment%2Fupgrading%2Fupgrade-guides%2Fcore-3.md)
- [Open in Grok](https://x.com/i/grok?text=Read+https%3A%2F%2Fclerk.com%2Fdocs%2Fguides%2Fdevelopment%2Fupgrading%2Fupgrade-guides%2Fcore-3.md)
- [Open in Perplexity](https://www.perplexity.ai/?q=Read+https%3A%2F%2Fclerk.com%2Fdocs%2Fguides%2Fdevelopment%2Fupgrading%2Fupgrade-guides%2Fcore-3.md)
- [Open in Zed](zed://agent?prompt=Read+https%3A%2F%2Fclerk.com%2Fdocs%2Fguides%2Fdevelopment%2Fupgrading%2Fupgrade-guides%2Fcore-3.md)

Use this pre-built prompt to upgrade your project with AI assistance.

Copy prompt Copy prompt

Copy prompt Copy prompt

## [Overview](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#overview)

Core 3 focuses on consistency and cleanup across Clerk's SDKs. Most projects can be upgraded in under 30 minutes using the [upgrade CLI](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#upgrade-using-the-cli).

Here's a summary of what changed:

- **Component consolidation:**`Protect`, `SignedIn`, and `SignedOut` are replaced by a single `Show` component.
- **Package renaming:**
  - `@clerk/clerk-react` becomes `@clerk/react`.
  - `@clerk/clerk-expo` becomes `@clerk/expo`.
  - `createTheme` moves to `@clerk/ui/themes/experimental`.
  - Types consolidate under `@clerk/shared/types`.

- **Appearance updates:**`appearance.layout` is now `appearance.options`, `showOptionalFields` defaults to `false`, and color variables apply at full opacity.
- **Behavior alignment:** Legacy redirect props and billing flags are removed in favor of the newer patterns.
- **Token handling:**`getToken()` now throws `ClerkOfflineError` when offline and uses proactive background refresh for better performance.
- **Platform requirements:**
  - For all packages: Node.js 20.9.0+ is required.
  - For `@clerk/nextjs`: Next.js 15.2.3+ is required.

- **Satellite apps:** Satellite apps no longer perform automatic redirects on first visit.

In addition to the cross-SDK changes listed above, each SDK has its own specific changes. See the [SDK-specific changes](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#sdk-specific-changes) section for details on your framework.

## [Preparing to upgrade](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#preparing-to-upgrade)

Before upgrading, make sure your project meets the following requirements:

- **Node.js 20.9.0 or later** is installed. You can check your version by running `node -v` in your terminal. If you need to update, see the [Node.js download page⁠](https://nodejs.org/).
- **Your Clerk SDKs are on the latest Core 2 version.** Updating to the latest Core 2 release first allows you to resolve deprecation warnings incrementally, which will make the Core 3 upgrade smoother. For example, for Next.js, run `npm install @clerk/nextjs@6`.

## [Upgrade using the CLI](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#upgrade-using-the-cli)

The recommended way to upgrade is to use the `@clerk/upgrade` CLI. This tool will scan your project, detect the breaking changes that affect your codebase, and apply fixes automatically where possible.

To run the CLI, open your terminal, navigate to your project directory, and run the command that matches your package manager:

npm

pnpm

yarn

bun

terminal

`npx @clerk/upgrade`

The CLI will walk you through the changes it detects. For most projects, this will handle the majority of the upgrade automatically.

Note

The upgrade CLI modifies `.ts`, `.tsx`, `.js`, and `.jsx` files. If you're using Astro, you'll need to manually update your `.astro` template files — see the [SDK-specific changes](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#sdk-specific-changes) section below.

The rest of this guide covers each breaking change in detail, which is useful as a reference for changes the CLI can't fully automate or if you'd like to understand what changed and why.

## [Breaking changes](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#breaking-changes)

The following breaking changes apply to all Clerk SDKs.

`Protect`, `SignedIn`, and `SignedOut` replaced by `Show`

The authorization control components `<Protect>`, `<SignedIn>`, and `<SignedOut>` have been removed in favor of a single component: [<Show>](https://clerk.com/docs/nextjs/reference/components/control/show).

### [Signed in / signed out](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#signed-in-signed-out)

```
- import { SignedIn, SignedOut } from '@clerk/nextjs';
+ import { Show } from '@clerk/nextjs';

- <SignedIn>
+ <Show when="signed-in">
      <Dashboard />
- </SignedIn>
+ </Show>

- <SignedOut>
+ <Show when="signed-out">
      <SignInPage />
- </SignedOut>
+ </Show>
```

### [Authorization checks (roles/permissions/features/plans)](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#authorization-checks-roles-permissions-features-plans)

```
- import { Protect } from '@clerk/nextjs';
+ import { Show } from '@clerk/nextjs';

- <Protect role="admin" fallback={<p>Unauthorized</p>}>
+ <Show when={{ role: 'admin' }} fallback={<p>Unauthorized</p>}>
      <AdminPanel />
- </Protect>
+ </Show>

- <Protect permission="org:billing:manage">
+ <Show when={{ permission: 'org:billing:manage' }}>
      <BillingSettings />
- </Protect>
+ </Show>
```

If you were using `condition={(has) => ...}` on `Protect`, pass that callback to `when`:

```
- <Protect condition={(has) => has({ role: 'admin' }) && isAllowed}>
+ <Show when={(has) => has({ role: 'admin' }) && isAllowed}>
      <AdminPanel />
- </Protect>
+ </Show>
```

`appearance.layout` renamed to `appearance.options`

The `appearance.layout` property has been renamed to `appearance.options`. Update all instances in your codebase:

```
<ClerkProvider
    appearance={{
-     layout: {
+     options: {
        socialButtonsPlacement: 'bottom',
        socialButtonsVariant: 'iconButton',
      }
    }}
  >
    {/* ... */}
  </ClerkProvider>
```

`colorRing` and `colorModalBackdrop` now render at full opacity

The `colorRing` and `colorModalBackdrop` CSS variables now render at full opacity when modified via the appearance prop or CSS variables. Previously, provided colors were rendered at 15% opacity.

If you were relying on the Core 2 behavior, you may need to adjust your color values to include the desired opacity:

```
<ClerkProvider
    appearance={{
      variables: {
-       colorRing: '#6366f1',
+       colorRing: 'rgba(99, 102, 241, 0.15)',
      },
    }}
  >
    {/* ... */}
  </ClerkProvider>
```

`useCheckout` and `Clerk.checkout()` return values changed

The return values of the `useCheckout` hook and the `Clerk.checkout()` method have been updated.

### [React hook](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#react-hook)

```
- const { id, plan, status, start, confirm, paymentSource } = useCheckout({
-   planId: 'xxx',
-   planPeriod: 'annual',
- })
+ const { checkout, errors, fetchStatus } = useCheckout({ planId: 'xxx', planPeriod: 'annual' })
+ // Access properties via checkout object
+ checkout.plan
+ checkout.status
+ checkout.start()
+ checkout.confirm()
```

### [Vanilla JS](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#vanilla-js)

```
- const { getState, subscribe, confirm, start, clear, finalize } = Clerk.checkout({
-   planId: 'xxx',
-   planPeriod: 'annual',
- })
- getState().isStarting
- getState().checkout
+ const { checkout, errors, fetchStatus } = Clerk.checkout({ planId: 'xxx', planPeriod: 'annual' })
+ // Access properties via checkout object
+ checkout.plan
+ checkout.status
+ checkout.start()
+ checkout.confirm()
```

Experimental methods prefix standardized to `__experimental_`

All experimental methods now use the `__experimental_` prefix consistently. Update any references:

```
- experimental_someMethod
+ __experimental_someMethod
```

`createTheme` moved to `@clerk/ui/themes/experimental`

The `createTheme` theme utility has been moved to a new export path. Update your imports:

```
- import { __experimental_createTheme } from '@clerk/ui'
+ import { createTheme } from '@clerk/ui/themes/experimental'
```

Note

The `__experimental_` prefix has been removed from the method since they're now in the `/themes/experimental` subpath.

`__unstable_*` methods renamed to `__internal_*`

All `__unstable_*` methods have been renamed to `__internal_*`. These are internal APIs not intended for public use.

### [@clerk/clerk-js](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#clerk-clerk-js)

- `__unstable__environment` → `__internal_environment`
- `__unstable__updateProps` → `__internal_updateProps`
- `__unstable__setEnvironment` → `__internal_setEnvironment`
- `__unstable__onBeforeRequest` → `__internal_onBeforeRequest`
- `__unstable__onAfterResponse` → `__internal_onAfterResponse`
- `__unstable__onBeforeSetActive` → `__internal_onBeforeSetActive`
- `__unstable__onAfterSetActive` → `__internal_onAfterSetActive`

### [@clerk/nextjs](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#clerk-nextjs)

- `__unstable_invokeMiddlewareOnAuthStateChange` → `__internal_invokeMiddlewareOnAuthStateChange`

### [@clerk/chrome-extension](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#clerk-chrome-extension)

- `__unstable__createClerkClient` → `createClerkClient` (exported from `@clerk/chrome-extension/background`)

`getToken()` throws `ClerkOfflineError` when offline

`getToken()` now throws a `ClerkOfflineError` instead of returning `null` when the browser is offline. This makes it explicit that the request failed due to network conditions, not because the user is signed out.

```
+ import { ClerkOfflineError } from '@clerk/react/errors'

- const token = await session.getToken()
- if (token === null) {
-   // Ambiguous: could mean signed out OR offline
- }
+ try {
+   const token = await session.getToken()
+ } catch (error) {
+   if (ClerkOfflineError.is(error)) {
+     showOfflineScreen()
+   } else {
+     throw error
+   }
+ }
```

`ClerkOfflineError` is available from `@clerk/react/errors`, `@clerk/nextjs/errors`, `@clerk/vue/errors`, and other SDK error entry points. The error is thrown after a short retry period (~15 seconds) to handle temporary network issues. `getToken()` still returns `null` when the user is not signed in.

`useAuth().getToken` no longer `undefined` during SSR

`useAuth().getToken` is no longer `undefined` during server-side rendering. It is now a function that throws a `clerk_runtime_not_browser` error when called on the server.

If you were checking `getToken === undefined` to avoid calling it during SSR, update your code:

```
- if (getToken) {
-   const token = await getToken()
- }
+ try {
+   const token = await getToken()
+ } catch (error) {
+   if (isClerkRuntimeError(error) && error.code === 'clerk_runtime_not_browser') {
+     // Handle server-side scenario
+   }
+ }
```

If you only use `getToken` in `useEffect`, event handlers, or with non-suspenseful data fetching libraries, no change is necessary as these only run on the client.

New `needs_client_trust` sign-in status

A new sign-in status of `needs_client_trust` has been added. If your application has passwords and [Client Trust](https://clerk.com/docs/guides/secure/client-trust) enabled, you'll need to handle this new status in your sign-in flow:

```
const { signIn } = useSignIn()
  // ...
- if (signIn.status === 'complete') {
-   /* ... */
- }
+ if (signIn.status === 'needs_client_trust') {
+   /* ... */
+ } else if (signIn.status === 'complete') {
+   /* ... */
+ }
```

This status is returned when passwords and Client Trust are enabled, the `needs_client_trust` update is opted-in, and email/phone identifiers are enabled without email/SMS sign-in verification.

`simple` theme export removed from `@clerk/ui`

The `simple` theme is no longer exported directly from `@clerk/ui`. Use the `appearance` prop to apply it instead:

```
- import { __experimental_simple } from '@clerk/ui';
-
- <ClerkProvider appearance={{ baseTheme: __experimental_simple }}>
+ <ClerkProvider appearance={{ theme: 'simple' }}>
    {/* Your app */}
  </ClerkProvider>
```

`clerkJSUrl`, `clerkJSVersion`, `clerkUIUrl`, and `clerkUIVersion` props removed

The `clerkJSUrl`, `clerkJSVersion`, `clerkUIUrl`, and `clerkUIVersion` props have been removed from `ClerkProvider` and related configuration options. These props were intended for internal use and are no longer part of the public API.

```
<ClerkProvider
-   clerkJSUrl="https://js.example.com/clerk.js"
-   clerkJSVersion="5.0.0"
-   clerkUIUrl="https://ui.example.com/ui.js"
-   clerkUIVersion="1.0.0"
+   __internal_clerkJSUrl="https://js.example.com/clerk.js"
+   __internal_clerkJSVersion="5.0.0"
+   __internal_clerkUIUrl="https://ui.example.com/ui.js"
+   __internal_clerkUIVersion="1.0.0"
  >
```

If you need to pin a specific version of the UI, import `ui` from `@clerk/ui` and pass it to `ClerkProvider`:

```
import { ui } from '@clerk/ui';

<ClerkProvider ui={ui}>
```

`clerkJSVariant` prop removed

The `clerkJSVariant` prop has been removed. Use `prefetchUI={false}` instead to disable prefetching the UI bundle:

```
<ClerkProvider
-   clerkJSVariant="headless"
+   prefetchUI={false}
    publishableKey={...}
  >
```

You can also disable UI prefetching via environment variable:

- Next.js: `NEXT_PUBLIC_CLERK_PREFETCH_UI=false`
- Astro: `PUBLIC_CLERK_PREFETCH_UI=false`
- React Router / TanStack Start: `CLERK_PREFETCH_UI=false`

## [Deprecation removals](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#deprecation-removals)

The following deprecated APIs have been removed from all Clerk SDKs.

`afterSwitchOrganizationUrl` removed from `OrganizationSwitcher`

The `afterSwitchOrganizationUrl` prop has been removed from `OrganizationSwitcher`. Use `afterSelectOrganizationUrl` instead:

```
<OrganizationSwitcher
-   afterSwitchOrganizationUrl="/org-dashboard"
+   afterSelectOrganizationUrl="/org-dashboard"
  />
```

`Client.activeSessions` removed

The `activeSessions` property has been removed from the `Client` object. Use `sessions` instead:

```
- const sessions = client.activeSessions
+ const sessions = client.sessions
```

`hideSlug` prop removed

The `hideSlug` prop has been removed. Organization slugs are now managed through the Clerk Dashboard.

```
<OrganizationProfile
-   hideSlug={true}
  />
```

To hide organization slugs, navigate to the [**Organizations Settings**⁠](https://dashboard.clerk.com/~/organizations) page in the Clerk Dashboard, and ensure that the **Enable organization slugs** option is disabled.

`saml` strategy renamed to `enterprise_sso`

The `saml` authentication strategy has been renamed to `enterprise_sso`. Update any references in your code:

```
- strategy: 'saml'
+ strategy: 'enterprise_sso'
```

`samlAccount` renamed to `enterpriseAccount`

The `samlAccount` property has been renamed to `enterpriseAccount`. Update your code:

```
- user.samlAccounts
+ user.enterpriseAccounts

- verification.samlAccount
+ verification.enterpriseAccount
```

`setActive({ beforeEmit })` changed to `setActive({ navigate })`

The `beforeEmit` callback in `setActive()` has been replaced with `navigate`. The callback signature has also changed:

```
await setActive({
    session: sessionId,
-   beforeEmit: () => {
-     // Called before session is set
-   },
+   navigate: async ({ session, decorateUrl }) => {
+     // Called with the session object
+     // and the decorateUrl function must wrap
+     // all destination url's
+     const url = decorateUrl('/dashboard')
+     if (url.startsWith('http')) {
+       window.location.href = url
+     } else {
+       router.push(url)
+     }
+   },
  })
```

The `navigate` callback receives an object with the `session` property and the `decorateUrl` function. [Learn more about the `navigate` callback](https://clerk.com/docs/reference/javascript/clerk#using-the-navigate-parameter).

`UserButton` sign-out redirect props removed

The `UserButton` component no longer accepts sign-out redirect override props. Configure sign-out redirects using one of these methods:

**Global configuration:**

`<ClerkProvider afterSignOutUrl="/signed-out"></ClerkProvider>`

**Per-button with SignOutButton:**

`<SignOutButton redirectUrl="/goodbye">Sign Out</SignOutButton>`

**Programmatic:**

`clerk.signOut({ redirectUrl: '/signed-out' })`

`UserSettings.saml` renamed to `enterpriseSSO`

The `saml` property on `UserSettings` has been renamed to `enterpriseSSO`. Update your code:

```
- userSettings.saml
+ userSettings.enterpriseSSO
```

Legacy redirect props removed

The legacy redirect props `afterSignInUrl`, `afterSignUpUrl`, and `redirectUrl` have been removed from components. Use the newer redirect options:

```
<SignIn
-   afterSignInUrl="/dashboard"
-   afterSignUpUrl="/onboarding"
+   fallbackRedirectUrl="/dashboard"
+   signUpFallbackRedirectUrl="/onboarding"
  />
```

For forced redirects that ignore the `redirect_url` query parameter:

```
<SignIn
+   forceRedirectUrl="/dashboard"
+   signUpForceRedirectUrl="/onboarding"
  />
```

Unstable billing props removed

The following unstable properties have been removed. If you were relying on these, please reach out to our [support team⁠](https://clerk.com/support).

- `__unstable_manageBillingUrl`
- `__unstable_manageBillingLabel`
- `__unstable_manageBillingMembersLimit`

Deprecated verify methods removed from `@clerk/backend`

The deprecated `verifySecret()`, `verifyAccessToken()`, and `verifyToken()` methods have been removed from `@clerk/backend`. Use `verify()` instead:

```
- await clerkClient.apiKeys.verifySecret(secret)
+ await clerkClient.apiKeys.verify(secret)

- await clerkClient.idpOAuthAccessToken.verifyAccessToken(accessToken)
+ await clerkClient.idpOAuthAccessToken.verify(accessToken)

- await clerkClient.m2m.verifyToken(params)
+ await clerkClient.m2m.verify(params)
```

## [Deprecations](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#deprecations)

`@clerk/types` deprecated in favor of `@clerk/shared/types`

The `@clerk/types` package is deprecated. All type definitions have been consolidated into `@clerk/shared/types`.

Update your imports:

```
- import type { ClerkResource, UserResource } from '@clerk/types'
+ import type { ClerkResource, UserResource } from '@clerk/shared/types'
```

The `@clerk/types` package will continue to re-export types from `@clerk/shared/types` for backward compatibility, but new types will only be added to `@clerk/shared/types`.

## [Version requirements](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#version-requirements)

Upgrade Node.js to v20.9.0 or higher

All Clerk packages now require Node.js 20.9.0 or later. Update your Node.js version and ensure your `package.json` engines field reflects this requirement.

```
{
    "engines": {
-     "node": ">=18.0.0",
+     "node": ">=20.9.0"
    }
  }
```

## [Behavior changes](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#behavior-changes)

`showOptionalFields` now defaults to `false`

The default value of `appearance.layout.showOptionalFields` (now `appearance.options.showOptionalFields`) has changed from `true` to `false`. Optional fields are now hidden by default during sign up.

To restore the Core 2 behavior, explicitly set the option:

```
<ClerkProvider
  appearance={{
    options: {
      showOptionalFields: true,
    },
  }}
>
  {/* ... */}
</ClerkProvider>
```

`ClerkAPIError.kind` value updated

`ClerkAPIError.kind` has been updated to match the class name:

```
- static kind = 'ClerkApiError'
+ static kind = 'ClerkAPIError'
```

Most users should not be affected. If you were checking this string directly (e.g., `error.constructor.kind === 'ClerkApiError'`), update the comparison value.

Satellite apps no longer perform automatic redirects on first visit

In Core 2, satellite applications automatically synced authentication state with the primary domain on every first page load by redirecting users to the primary domain and back. This happened regardless of whether the user had an active session, which caused unnecessary latency for apps where most visitors are anonymous.

In Core 3, this behavior is controlled by the `satelliteAutoSync` option, which defaults to `false`. This means satellite apps no longer perform automatic redirects on first visit and users are not automatically recognized on the satellite domain unless they select "Sign in".

|                              | Core 2                                               | Core 3 (default)                                                                      |
| ---------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------- |
| First visit to satellite     | Redirects to primary domain to sync state, then back | No redirect, page loads immediately                                                   |
| Sign-in flow                 | Same as Core 3                                       | User selects "Sign in" → redirected to primary → signs in → redirected back           |
| Already signed in on primary | Automatically synced on first visit                  | Only synced after user selects "Sign in" (redirect is instant, no user action needed) |
| Sign-out                     | Signs out from all domains                           | Signs out from all domains                                                            |
| Performance                  | Redirect on every first visit                        | No upfront cost                                                                       |

To restore the Core 2 behavior, in the your satellite domain's app, set `satelliteAutoSync` to `true` in your middleware and `<ClerkProvider>` component.

Middleware

<ClerkProvider>

proxy.ts

```
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

  // Set the homepage as a public route
  const isPublicRoute = createRouteMatcher(['/'])

  const options = {
    isSatellite: true,
    signInUrl: 'https://primary.dev/sign-in',
    signUpUrl: 'https://primary.dev/sign-up',
    domain: 'https://satellite.dev',
+   satelliteAutoSync: true,
  }

  export default clerkMiddleware(async (auth, req) => {
    if (isPublicRoute(req)) return // if it's a public route, do nothing
    await auth.protect() // for any other route, require auth
  }, options)

  export const config = {
    matcher: [
      // Skip Next.js internals and all static files, unless found in search params
      '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
      // Always run for API routes
      '/(api|trpc)(.*)',
    ],
  }
```

If you have any questions about satellite domains, or you're having any trouble setting this up, see the [guide on satellite domains](https://clerk.com/docs/guides/dashboard/dns-domains/satellite-domains) or contact support@clerk.com

`getToken()` uses proactive background refresh

`session.getToken()` now implements a stale-while-revalidate pattern that improves performance by returning cached tokens immediately while refreshing them in the background when they're close to expiration.

When a token is within 15 seconds of expiration, `getToken()` returns the valid cached token immediately and triggers a background refresh. Subsequent calls receive the new token once the background refresh completes. Token updates are automatically synchronized across browser tabs using `BroadcastChannel`.

```
// Token is cached and valid but expiring in 10 seconds
// Core 2: Would block and fetch new token
// Core 3: Returns cached token immediately, refreshes in background
const token = await session.getToken()
```

This is a transparent improvement — no code changes are required. Your existing `getToken()` calls benefit automatically.

## [SDK-specific changes](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#sdk-specific-changes)

The following changes only apply to specific SDKs. Select your SDK below for additional upgrade steps.

Next.js

React

React Router

Astro

TanStack React Start

Expo

Nuxt

Express

### [Encryption key required when passing `secretKey` at runtime](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#encryption-key-required-when-passing-secret-key-at-runtime)

When passing `secretKey` as a runtime option to `clerkMiddleware()`, you must now also provide a `CLERK_ENCRYPTION_KEY` environment variable.

Add the encryption key to your environment:

`CLERK_ENCRYPTION_KEY=your-encryption-key`

See the [clerkMiddleware documentation](https://clerk.com/docs/reference/nextjs/clerk-middleware#dynamic-keys).

### [ClerkProvider should be inside `<body>` for Next.js 16 cache components](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#clerk-provider-should-be-inside-body-for-next-js-16-cache-components)

For Next.js 16 cache components support (`cacheComponents: true`), `ClerkProvider` must be positioned inside `<body>` rather than wrapping `<html>`. This prevents "Uncached data was accessed outside of `<Suspense>`" errors.

```
- <ClerkProvider>
-   <html lang="en">
-     <body>{children}</body>
-   </html>
- </ClerkProvider>
+ <html lang="en">
+   <body>
+     <ClerkProvider>
+       {children}
+     </ClerkProvider>
+   </body>
+ </html>
```

If you're using Next.js 16 with `cacheComponents: true`, you may also need to wrap `ClerkProvider` in a `<Suspense>` boundary.

### [Minimum Next.js version increased to 15.2.3](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#minimum-next-js-version-increased-to-15-2-3)

Support for Next.js 13 and 14 has been dropped. `@clerk/nextjs` now requires `next@>=15.2.3`.

```
{
    "dependencies": {
-     "next": "^14.0.0",
+     "next": "^15.2.3"
    }
  }
```

See the [Next.js upgrade guide⁠](https://nextjs.org/docs/app/building-your-application/upgrading) for help migrating your application.

### [`auth.protect()` returns 401 instead of 404 for unauthenticated server actions](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3#auth-protect-returns-401-instead-of-404-for-unauthenticated-server-actions)

`auth.protect()` in `clerkMiddleware()` now returns a `401 Unauthorized` response instead of a `404 Not Found` when an unauthenticated request is made from a server action. If you have client-side error handling that checks for `404` responses from server actions when the user is signed out, update it to handle `401` instead:

```
try {
    await myServerAction();
  } catch (error) {
-   if (error.status === 404) {
+   if (error.status === 401) {
      // Handle unauthenticated user
    }
  }
```

No changes are required if you are not explicitly checking the HTTP status code in your error handling.

## Feedback

What did you think of this content?

It was helpful It was not helpful I have feedback

Last updated on Mar 4, 2026

[Edit on GitHub](https://github.com/clerk/clerk-docs/edit/main/docs/guides/development/upgrading/upgrade-guides/core-3.mdx)

- [](https://clerk.com/)
- Product
  - [Authentication](https://clerk.com/user-authentication)
  - [B2B Authentication](https://clerk.com/organizations)
  - [Billing](https://clerk.com/billing)

- SDKs
  - [React](https://clerk.com/react-authentication)
  - [Next.js](https://clerk.com/nextjs-authentication)
  - [Expo](https://clerk.com/expo-authentication)
  - [View all](https://clerk.com/docs#explore-by-frontend-framework)

- Resources
  - [Documentation](https://clerk.com/docs)
  - [Changelog](https://clerk.com/changelog)
  - [Glossary](https://clerk.com/glossary)
  - [Feature requests](https://feedback.clerk.com/roadmap)
  - [Startups](https://clerk.com/startups)
  - [LLM Leaderboard](https://clerk.com/llm-leaderboard)

- Company
  - [About](https://clerk.com/company)
  - [Careers](https://clerk.com/careers)
  - [Blog](https://clerk.com/blog)
  - [Contact](https://clerk.com/contact)
  - [Brand assets](https://clerk.com/brand-assets)

- Legal
  - [Terms and conditions](https://clerk.com/legal/terms)
  - [Terms of engagement](https://clerk.com/legal/terms-of-engagement)
  - [Privacy policy](https://clerk.com/legal/privacy)
  - [Data processing agreement](https://clerk.com/legal/dpa)
  - [Do not sell/share my info](mailto:privacy@clerk.com)
  - Cookie manager

© 2026 Clerk, Inc.

Support

![Image 1](https://t.co/1/i/adsct?bci=4&dv=UTC%26en-US%26Google%20Inc.%26Linux%20x86_64%26255%26800%26600%268%2624%26800%26600%260%26na&eci=3&event=%7B%7D&event_id=0dddbd31-19b6-4ca5-bc5b-ed11ac34a89f&integration=advertiser&p_id=Twitter&p_user_id=0&pl_id=c32b9b0f-ac06-46d5-adf0-fddbc762e0af&pt=Upgrading%20to%20Clerk%20Core%203%20-%20Upgrade%20guides%20%7C%20Clerk%20Docs&tw_document_href=https%3A%2F%2Fclerk.com%2Fdocs%2Fguides%2Fdevelopment%2Fupgrading%2Fupgrade-guides%2Fcore-3&tw_iframe_status=0&tw_pid_src=1&twpid=tw.1772599517160.483858063691679873&txn_id=o6tnh&type=javascript&version=2.3.39)![Image 2](https://analytics.twitter.com/1/i/adsct?bci=4&dv=UTC%26en-US%26Google%20Inc.%26Linux%20x86_64%26255%26800%26600%268%2624%26800%26600%260%26na&eci=3&event=%7B%7D&event_id=0dddbd31-19b6-4ca5-bc5b-ed11ac34a89f&integration=advertiser&p_id=Twitter&p_user_id=0&pl_id=c32b9b0f-ac06-46d5-adf0-fddbc762e0af&pt=Upgrading%20to%20Clerk%20Core%203%20-%20Upgrade%20guides%20%7C%20Clerk%20Docs&tw_document_href=https%3A%2F%2Fclerk.com%2Fdocs%2Fguides%2Fdevelopment%2Fupgrading%2Fupgrade-guides%2Fcore-3&tw_iframe_status=0&tw_pid_src=1&twpid=tw.1772599517160.483858063691679873&txn_id=o6tnh&type=javascript&version=2.3.39)![Image 3](https://t.co/i/adsct?bci=4&dv=UTC%26en-US%26Google%20Inc.%26Linux%20x86_64%26255%26800%26600%268%2624%26800%26600%260%26na&eci=2&event_id=406c1400-d461-4624-ae77-db3a66ea2a92&events=%5B%5B%22pageview%22%2C%7B%7D%5D%5D&integration=advertiser&p_id=Twitter&p_user_id=0&pl_id=c32b9b0f-ac06-46d5-adf0-fddbc762e0af&pt=Upgrading%20to%20Clerk%20Core%203%20-%20Upgrade%20guides%20%7C%20Clerk%20Docs&tw_document_href=https%3A%2F%2Fclerk.com%2Fdocs%2Fguides%2Fdevelopment%2Fupgrading%2Fupgrade-guides%2Fcore-3&tw_iframe_status=0&tw_order_quantity=0&tw_pid_src=1&tw_sale_amount=0&twpid=tw.1772599517160.483858063691679873&txn_id=o6tnh&type=javascript&version=2.3.39)![Image 4](https://analytics.twitter.com/i/adsct?bci=4&dv=UTC%26en-US%26Google%20Inc.%26Linux%20x86_64%26255%26800%26600%268%2624%26800%26600%260%26na&eci=2&event_id=406c1400-d461-4624-ae77-db3a66ea2a92&events=%5B%5B%22pageview%22%2C%7B%7D%5D%5D&integration=advertiser&p_id=Twitter&p_user_id=0&pl_id=c32b9b0f-ac06-46d5-adf0-fddbc762e0af&pt=Upgrading%20to%20Clerk%20Core%203%20-%20Upgrade%20guides%20%7C%20Clerk%20Docs&tw_document_href=https%3A%2F%2Fclerk.com%2Fdocs%2Fguides%2Fdevelopment%2Fupgrading%2Fupgrade-guides%2Fcore-3&tw_iframe_status=0&tw_order_quantity=0&tw_pid_src=1&tw_sale_amount=0&twpid=tw.1772599517160.483858063691679873&txn_id=o6tnh&type=javascript&version=2.3.39)
