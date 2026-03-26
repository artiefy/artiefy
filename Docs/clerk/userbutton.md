# <UserButton /> component

The `<UserButton />` component renders the familiar user button UI popularized by Google. When selected, it opens a dropdown menu with options to manage account settings and sign out. The "Manage account" option launches the [`<UserProfile />`](https://clerk.com/docs/nextjs/reference/components/user/user-profile.md) component, providing access to profile and security settings.

For users that have [multi-session](https://clerk.com/docs/guides/secure/session-options.md#multi-session-applications) enabled, the `<UserButton />` also allows users to sign into multiple accounts at once and instantly switch between them without the need for a full page reload. Learn more [here](https://clerk.com/docs/guides/secure/session-options.md#multi-session-applications).

## Example

The following example includes a basic implementation of the `<UserButton />` component mounted in a header. When the user is signed in, they will see their avatar and be able to open the popup menu. You can use this as a starting point for your own implementation.

**App Router**

```tsx {{ filename: 'layout.tsx', mark: [8] }}
import { ClerkProvider, Show, SignInButton, UserButton } from '@clerk/nextjs';

function Header() {
  return (
    <header
      style={{ display: 'flex', justifyContent: 'space-between', padding: 20 }}
    >
      <h1>My App</h1>
      <Show when="signed-in">
        <UserButton />
      </Show>
      <Show when="signed-out">
        <SignInButton />
      </Show>
    </header>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <ClerkProvider>
        <Header />
        {children}
      </ClerkProvider>
    </html>
  );
}
```

**Pages Router**

```tsx {{ filename: 'pages/_app.tsx', mark: [9] }}
import { ClerkProvider, Show, SignInButton, UserButton } from '@clerk/nextjs';
import type { AppProps } from 'next/app';

function Header() {
  return (
    <header
      style={{ display: 'flex', justifyContent: 'space-between', padding: 20 }}
    >
      <h1>My App</h1>
      <Show when="signed-in">
        <UserButton />
      </Show>
      <Show when="signed-out">
        <SignInButton />
      </Show>
    </header>
  );
}

function MyApp({ pageProps, Component }: AppProps) {
  return (
    <ClerkProvider {...pageProps}>
      <Header />
      <Component {...pageProps} />
    </ClerkProvider>
  );
}

export default MyApp;
```

## Properties

The `<UserButton />` component accepts the following properties, all of which are **optional**:

| Name                                           | Type       | Description                                                                                                                                                                            |
| ---------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| afterMultiSessionSingleSignOutUrl (deprecated) | string     | Deprecated. Move afterMultiSessionSingleSignOutUrl to <ClerkProvider />. The full URL or path to navigate to after signing out from a currently active account in a multi-session app. |
| afterSignOutUrl (deprecated)                   | string     | Deprecated. Move afterSignOutUrl to <ClerkProvider />. The full URL or path to navigate to after a successful sign-out.                                                                |
| afterSwitchSessionUrl                          | string     | The full URL or path to navigate to after a successful account change in a multi-session app.                                                                                          |
| appearance                                     | Appearance | undefined                                                                                                                                                                              | Optional object to style your components. Will only affect Clerk components and not Account Portal pages.                                                                                                                                      |
| defaultOpen                                    | boolean    | Controls whether the <UserButton /> should open by default during the first render.                                                                                                    |
| showName                                       | boolean    | Controls if the user name is displayed next to the user image button.                                                                                                                  |
| signInUrl                                      | string     | The full URL or path to navigate to when the Add another account button is clicked. It's recommended to use the environment variable instead.                                          |
| userProfileMode                                | 'modal'    | 'navigation'                                                                                                                                                                           | Controls whether selecting the Manage your account button will cause the <UserProfile /> component to open as a modal, or if the browser will navigate to the userProfileUrl where <UserProfile /> is mounted as a page. Defaults to: 'modal'. |
| userProfileProps                               | object     | Specify options for the underlying <UserProfile /> component. For example: {additionalOAuthScopes: {google: ['foo', 'bar'], github: ['qux']}}.                                         |
| userProfileUrl                                 | string     | The full URL or path leading to the user management interface.                                                                                                                         |
| fallback?                                      | ReactNode  | An optional element to be rendered while the component is mounting.                                                                                                                    |

## Customization

To learn about how to customize Clerk components, see the [`customization documentation`](https://clerk.com/docs/nextjs/guides/customizing-clerk/appearance-prop/overview.md).

You can also [`add custom actions and links to the <UserButton /> menu`](https://clerk.com/docs/nextjs/guides/customizing-clerk/adding-items/user-button.md).
