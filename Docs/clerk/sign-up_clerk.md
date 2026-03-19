# <SignUpButton>

The `<SignUpButton>` component is a button that, by default, links to your app's sign-up page. Your sign-up page will be hosted by Clerk using the [Account Portal](https://clerk.com/docs/guides/account-portal/overview.md) unless you have set up a [`dedicated sign-up page`](https://clerk.com/docs/guides/development/custom-sign-in-or-up-page.md).

## Usage

### Basic usage

> This component is for Expo web projects. For native iOS and Android apps, use the [`native components`](https://clerk.com/docs/reference/expo/native-components/overview.md) from `@clerk/expo/native` instead.

```jsx {{ filename: '/app/sign-up.web.tsx' }}
import { SignUpButton } from '@clerk/expo/web';

export default function SignUpPage() {
  return <SignUpButton />;
}
```

### Custom usage

You can create a custom button by wrapping your own button, or button text, in the `<SignUpButton>` component.

> This component is for Expo web projects. For native iOS and Android apps, use the [`native components`](https://clerk.com/docs/reference/expo/native-components/overview.md) from `@clerk/expo/native` instead.

```jsx {{ filename: '/app/index.tsx' }}
import { SignUpButton } from '@clerk/expo/web';

export default function Home() {
  return (
    <SignUpButton>
      <button>Custom sign up button</button>
    </SignUpButton>
  );
}
```

## Properties

| Name                                                            | Type                          | Description                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| forceRedirectUrl?                                               | string                        | If provided, this URL will always be redirected to after the user signs up. It's recommended to use the environment variable instead.                                                                                                                                                                                                                                               |
| fallbackRedirectUrl?                                            | string                        | The fallback URL to redirect to after the user signs up, if there's no redirect_url in the path already. Defaults to /. It's recommended to use the environment variable instead.                                                                                                                                                                                                   |
| "redirect": Redirect to the OAuth provider on the current page. | "popup": Open a popup window. | Defaults to "auto".                                                                                                                                                                                                                                                                                                                                                                 |
| signInForceRedirectUrl?                                         | string                        | If provided, this URL will always be redirected to after the user signs in. It's recommended to use the environment variable instead.                                                                                                                                                                                                                                               |
| signInFallbackRedirectUrl?                                      | string                        | The fallback URL to redirect to after the user signs in, if there's no redirect_url in the path already. Defaults to /. It's recommended to use the environment variable instead.                                                                                                                                                                                                   |
| mode?                                                           | 'redirect'                    | 'modal'                                                                                                                                                                                                                                                                                                                                                                             | Determines what happens when a user clicks on the <SignUpButton>. Setting this to 'redirect' will redirect the user to the sign-up route. Setting this to 'modal' will open a modal on the current route. Defaults to 'redirect' |
| children?                                                       | React.ReactNode               | Children you want to wrap the <SignUpButton> in.                                                                                                                                                                                                                                                                                                                                    |
| initialValues                                                   | SignUpInitialValues           | The values used to prefill the sign-up fields with.                                                                                                                                                                                                                                                                                                                                 |
| unsafeMetadata                                                  | SignUpUnsafeMetadata          | Metadata that can be read and set from the frontend and the backend. Once the sign-up is complete, the value of this field will be automatically copied to the created user's unsafe metadata (User.unsafeMetadata). One common use case is to collect custom information about the user during the sign-up process and store it in this property. Read more about unsafe metadata. |
