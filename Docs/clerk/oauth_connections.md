# Build a custom flow for authenticating with OAuth connections

> This guide is for users who want to build a custom flow. To use a _prebuilt_ UI, use the [Account Portal pages](https://clerk.com/docs/guides/account-portal/overview.md) or [`prebuilt components`](https://clerk.com/docs/nextjs/reference/components/overview.md).

> This guide uses the Core 2 `useSignIn()` and `useSignUp()` hooks, which are available in Core 3 SDKs by adding the `/legacy` subpath to the import path. If you're using a Core 2 SDK, remove the `/legacy` subpath.

## Before you start

You must configure your application instance through the Clerk Dashboard for the social connection(s) that you want to use. Visit [the appropriate guide for your platform](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/overview.md) to learn how to configure your instance.

## Create the sign-up and sign-in flow

First, in your `.env` file, set the `CLERK_SIGN_IN_URL` environment variable to tell Clerk where the sign-in page is being hosted. Otherwise, your app may default to using the [Account Portal sign-in page](https://clerk.com/docs/guides/account-portal/overview.md#sign-in) instead. This guide uses the `/sign-in` route.

```env {{ filename: '.env' }}
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
```

The following example **will both sign up _and_ sign in users**, eliminating the need for a separate sign-up page. However, if you want to have separate sign-up and sign-in pages, the sign-up and sign-in flows are equivalent, meaning that all you have to do is swap out the `SignIn` object for the `SignUp` object using the [`useSignUp()`](https://clerk.com/docs/nextjs/reference/hooks/use-sign-up.md) hook.

The following example:

1. Accesses the [`SignIn`](https://clerk.com/docs/reference/javascript/sign-in.md) object using the [`useSignIn()`](https://clerk.com/docs/nextjs/reference/hooks/use-sign-in.md) hook.
2. Starts the authentication process by calling [`SignIn.authenticateWithRedirect(params)`](https://clerk.com/docs/reference/javascript/sign-in.md#authenticate-with-redirect). This method requires a `redirectUrl` param, which is the URL that the browser will be redirected to once the user authenticates with the identity provider.
3. Creates a route at the URL that the `redirectUrl` param points to. The following example names this route `/sso-callback`. This route should either render the prebuilt [`<AuthenticateWithRedirectCallback/>`](https://clerk.com/docs/nextjs/reference/components/control/authenticate-with-redirect-callback.md) component or call the [`Clerk.handleRedirectCallback()`](https://clerk.com/docs/reference/javascript/clerk.md#handle-redirect-callback) method if you're not using the prebuilt component.

The following example shows two files:

1. The sign-in page where the user can start the authentication flow.
2. The SSO callback page where the flow is completed.

**Sign in page**

```tsx {{ filename: 'app/sign-in/[[...sign-in]]/page.tsx' }}
'use client';

import * as React from 'react';
import { OAuthStrategy } from '@clerk/shared/types';
import { useSignIn } from '@clerk/nextjs/legacy';

export default function Page() {
  const { signIn } = useSignIn();

  if (!signIn) return null;

  const signInWith = (strategy: OAuthStrategy) => {
    return signIn
      .authenticateWithRedirect({
        strategy,
        redirectUrl: '/sign-in/sso-callback',
        redirectUrlComplete: '/sign-in/tasks', // Learn more about session tasks at https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
      })
      .then((res) => {
        console.log(res);
      })
      .catch((err: any) => {
        // See https://clerk.com/docs/guides/development/custom-flows/error-handling
        // for more info on error handling
        console.log(err.errors);
        console.error(err, null, 2);
      });
  };

  // Render a button for each supported OAuth provider
  // you want to add to your app. This example uses only Google.
  return (
    <div>
      <button onClick={() => signInWith('oauth_google')}>
        Sign in with Google
      </button>
    </div>
  );
}
```

**SSO callback page**

```tsx {{ filename: 'app/sign-in/sso-callback/page.tsx' }}
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function Page() {
  // Handle the redirect flow by calling the Clerk.handleRedirectCallback() method
  // or rendering the prebuilt <AuthenticateWithRedirectCallback/> component.
  return (
    <>
      <AuthenticateWithRedirectCallback />

      {/* Required for sign-up flows
      Clerk's bot sign-up protection is enabled by default */}
      <div id="clerk-captcha" />
    </>
  );
}
```

## Handle missing requirements

Depending on your instance settings, users might need to provide extra information before their sign-up can be completed, such as when a username or accepting legal terms is required. In these cases, the `SignUp` object returns a status of `"missing_requirements"` along with a `missingFields` array. You can create a "Continue" page to collect these missing fields and complete the sign-up flow. Handling the missing requirements will depend on your instance settings. For example, if your instance settings require a phone number, you will need to [handle verifying the phone number](https://clerk.com/docs/guides/development/custom-flows/authentication/email-sms-otp.md#sign-up-flow).

> [!QUIZ]
> Why does the "Continue" page use the `useSignUp()` hook? What if a user is using this flow to sign in?
>
> ---
>
> With OAuth flows, it's common for users to try to _sign in_ with an OAuth provider, but they don't have a Clerk account for your app yet. Clerk automatically transfers the flow from the `SignIn` object to the `SignUp` object, which returns the `"missing_requirements"` status and `missingFields` array needed to handle the missing requirements flow. This is why for the OAuth flow, the "Continue" page uses the [`useSignUp()`](https://clerk.com/docs/nextjs/reference/hooks/use-sign-up.md) hook and treats the missing requirements flow as a sign-up flow.

**Continue page**

```tsx {{ filename: 'app/sign-in/continue/page.tsx' }}
'use client';

import { useState } from 'react';
import { useSignUp } from '@clerk/nextjs/legacy';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  // Use `useSignUp()` hook to access the `SignUp` object
  // `missing_requirements` and `missingFields` are only available on the `SignUp` object
  const { isLoaded, signUp, setActive } = useSignUp();
  const [formData, setFormData] = useState<Record<string, string>>({});

  if (!isLoaded) return <div>Loading…</div>;

  // Protect the page from users who are not in the sign-up flow
  // such as users who visited this route directly
  if (!signUp.id) router.push('/sign-in');

  const status = signUp?.status;
  const missingFields = signUp?.missingFields ?? [];

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Update the `SignUp` object with the missing fields
      // The logic that goes here will depend on your instance settings
      // E.g. if your app requires a phone number, you will need to collect and verify it here
      const res = await signUp?.update(formData);
      if (res?.status === 'complete') {
        await setActive({
          session: res.createdSessionId,
          navigate: async ({ session, decorateUrl }) => {
            if (session?.currentTask) {
              // Handle pending session tasks
              // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
              console.log(session?.currentTask);
              return;
            }

            const url = decorateUrl('/');
            if (url.startsWith('http')) {
              window.location.href = url;
            } else {
              router.push(url);
            }
          },
        });
      }
    } catch (err) {
      // See https://clerk.com/docs/guides/development/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  };

  if (status === 'missing_requirements') {
    // For simplicity, all missing fields in this example are text inputs.
    // In a real app, you might want to handle them differently:
    // - legal_accepted: checkbox
    // - username: text with validation
    // - phone_number: phone input, etc.
    return (
      <div>
        <h1>Continue sign-up</h1>
        <form onSubmit={handleSubmit}>
          {missingFields.map((field) => (
            <div key={field}>
              <label>
                {field}:
                <input
                  type="text"
                  value={formData[field] || ''}
                  onChange={(e) => handleChange(field, e.target.value)}
                />
              </label>
            </div>
          ))}

          {/* Required for sign-up flows
          Clerk's bot sign-up protection is enabled by default */}
          <div id="clerk-captcha" />

          <button type="submit">Submit</button>
        </form>
      </div>
    );
  }

  // Handle other statuses if needed
  return (
    <>
      {/* Required for sign-up flows
      Clerk's bot sign-up protection is enabled by default */}
      <div id="clerk-captcha" />
    </>
  );
}
```

**SSO callback page**

```tsx {{ filename: 'app/sign-in/sso-callback/page.tsx' }}
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function Page() {
  // Set the `continueSignUpUrl` to the route of your "Continue" page
  // Once a user authenticates with the OAuth provider, they will be redirected to that route
  return (
    <>
      <AuthenticateWithRedirectCallback continueSignUpUrl="/sign-in/continue" />

      {/* Required for sign-up flows
      Clerk's bot sign-up protection is enabled by default */}
      <div id="clerk-captcha" />
    </>
  );
}
```
