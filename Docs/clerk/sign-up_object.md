# SignUp object

The `SignUp` object holds the state of the current sign-up and provides helper methods to navigate and complete the sign-up process.

## Properties

| Name                                                                                                                                                                                                                          | Type                                                                                                                                                                                                                           | Description                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id                                                                                                                                                                                                                            | string                                                                                                                                                                                                                         | undefined                                                                                                                                                                                                                                                                                                                                                               | The unique identifier of the current sign-up.                                                                                                                                                              |
| complete: The user has been created and the custom flowA custom flow refers to a user interface built entirely from scratch using the Clerk API. Learn more about custom flows. can proceed to setActive() to create session. | missing_requirements: A requirement is unverified or missing from the User & authentication settings. For example, in the Clerk Dashboard, the Password setting is required but a password wasn't provided in the custom flow. |                                                                                                                                                                                                                                                                                                                                                                         |
| requiredFields                                                                                                                                                                                                                | string[]                                                                                                                                                                                                                       | An array of all the required fields that need to be supplied and verified in order for this sign-up to be marked as complete and converted into a user.                                                                                                                                                                                                                 |
| optionalFields                                                                                                                                                                                                                | string[]                                                                                                                                                                                                                       | An array of all the fields that can be supplied to the sign-up, but their absence does not prevent the sign-up from being marked as complete.                                                                                                                                                                                                                           |
| missingFields                                                                                                                                                                                                                 | string[]                                                                                                                                                                                                                       | An array of all the fields whose values are not supplied yet but they are mandatory in order for a sign-up to be marked as complete.                                                                                                                                                                                                                                    |
| unverifiedFields                                                                                                                                                                                                              | string[]                                                                                                                                                                                                                       | An array of all the fields whose values have been supplied, but they need additional verification in order for them to be accepted. Examples of such fields are emailAddress and phoneNumber.                                                                                                                                                                           |
| verifications                                                                                                                                                                                                                 | SignUpVerifications                                                                                                                                                                                                            | An object that contains information about all the verifications that are in-flight.                                                                                                                                                                                                                                                                                     |
| username                                                                                                                                                                                                                      | string                                                                                                                                                                                                                         | null                                                                                                                                                                                                                                                                                                                                                                    | The username supplied to the current sign-up. Only supported if username is enabled in the instance settings.                                                                                              |
| emailAddress                                                                                                                                                                                                                  | string                                                                                                                                                                                                                         | null                                                                                                                                                                                                                                                                                                                                                                    | The email address supplied to the current sign-up. Only supported if email address is enabled in the instance settings.                                                                                    |
| phoneNumber                                                                                                                                                                                                                   | string                                                                                                                                                                                                                         | null                                                                                                                                                                                                                                                                                                                                                                    | The user's phone number in E.164 format. Only supported if phone number is enabled in the instance settings.                                                                                               |
| web3Wallet                                                                                                                                                                                                                    | string                                                                                                                                                                                                                         | null                                                                                                                                                                                                                                                                                                                                                                    | The Web3 wallet address, made up of 0x + 40 hexadecimal characters or a base58 encoded ed25519 public key (for Solana wallets). Only supported if Web3 authentication is enabled in the instance settings. |
| hasPassword                                                                                                                                                                                                                   | boolean                                                                                                                                                                                                                        | The value of this attribute is true if a password was supplied to the current sign-up. Only supported if Password is enabled in the instance settings.                                                                                                                                                                                                                  |
| firstName                                                                                                                                                                                                                     | string                                                                                                                                                                                                                         | null                                                                                                                                                                                                                                                                                                                                                                    | The first name supplied to the current sign-up. Only supported if First and last name is enabled in the instance settings.                                                                                 |
| lastName                                                                                                                                                                                                                      | string                                                                                                                                                                                                                         | null                                                                                                                                                                                                                                                                                                                                                                    | The last name supplied to the current sign-up. Only supported if First and last name is enabled in the instance settings.                                                                                  |
| unsafeMetadata                                                                                                                                                                                                                | SignUpUnsafeMetadata                                                                                                                                                                                                           | Metadata that can be read and set from the frontend. Once the sign-up is complete, the value of this field will be automatically copied to the newly created user's unsafe metadata. One common use case for this attribute is to use it to implement custom fields that can be collected during sign-up and will automatically be attached to the created User object. |
| createdSessionId                                                                                                                                                                                                              | string                                                                                                                                                                                                                         | null                                                                                                                                                                                                                                                                                                                                                                    | The identifier of the newly-created session. This attribute is populated only when the sign-up is complete.                                                                                                |
| createdUserId                                                                                                                                                                                                                 | string                                                                                                                                                                                                                         | null                                                                                                                                                                                                                                                                                                                                                                    | The identifier of the newly-created user. This attribute is populated only when the sign-up is complete.                                                                                                   |
| abandonAt                                                                                                                                                                                                                     | number                                                                                                                                                                                                                         | null                                                                                                                                                                                                                                                                                                                                                                    | The epoch numerical time when the sign-up was abandoned by the user.                                                                                                                                       |

## Methods

### `attemptEmailAddressVerification()`

Attempts to verify an email address by validating the OTP provided by the user against the code sent during the prepare verification step. This is a convenience method that wraps [`SignUp.attemptVerification()`](https://clerk.com/docs/reference/javascript/sign-up.md#attempt-verification) with the `'email_code'` strategy.

By default, this method is equivalent to calling `SignUp.attemptVerification({ strategy: 'email_code', code })`. The verification attempt will fail if the code is invalid or has expired.

```typescript
function attemptEmailAddressVerification(
  params: AttemptEmailAddressVerificationParams
): Promise<SignUpResource>;
```

#### `AttemptEmailAddressVerificationParams`

| Name | Type   | Description                                                                                                                                                                                                                                            |
| ---- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| code | string | The OTPA one-time password (OTP) is a code that is used to authenticate a user. The OTP is typically sent to a user's email address or phone number and must be entered within a certain time period to be valid. that was sent to the user via email. |

### `attemptPhoneNumberVerification()`

Attempts to verify a phone number by validating the OTP provided by the user against the OTP sent during the prepare verification step. This is a convenience method that wraps [`SignUp.attemptVerification()`](#attempt-verification) with the `'phone_code'` strategy.

By default, this method is equivalent to calling `SignUp.attemptVerification({ strategy: 'phone_code', code })`. The verification attempt will fail if the OTP is invalid or has expired.

```typescript
function attemptPhoneNumberVerification(
  params: AttemptPhoneNumberVerificationParams
): Promise<SignUpResource>;
```

#### `AttemptPhoneNumberVerificationParams`

| Name | Type   | Description                                 |
| ---- | ------ | ------------------------------------------- |
| code | string | The code that was sent to the user via SMS. |

### `attemptVerification()`

Attempts to complete a pending verification process for the specified verification strategy. This method must be called after initiating verification via [`SignUp.prepareVerification()`](#prepare-verification). The verification attempt will validate the provided verification parameters (code, signature, etc.) against the pending verification request.

Depending on the strategy, the method parameters could differ.

```typescript
function attemptVerification(
  params: AttemptVerificationParams
): Promise<SignUp>;
```

#### `AttemptVerificationParams`

| Name                                                         | Type                                                           | Description                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 'phone_code': Validates an SMS with a unique token to input. | 'email_code': Validates an email with a unique token to input. |                                                                                                                                                                                                                                                                                                           |
| code                                                         | string                                                         | Required if strategy is set to 'phone_code' or 'email_code'. The OTPA one-time password (OTP) is a code that is used to authenticate a user. The OTP is typically sent to a user's email address or phone number and must be entered within a certain time period to be valid. that was sent to the user. |
| signature                                                    | string                                                         | Required if strategy is set to 'web3_base_signature', 'web3_metamask_signature', 'web3_coinbase_wallet_signature', 'web3_okx_wallet_signature', or 'web3_solana_signature'. The signature that was sent to the user via the Web3 verification strategy.                                                   |

### `attemptWeb3WalletVerification()`

Attempts to verify a Web3 wallet address by validating the cryptographic signature generated by the wallet against the nonce provided during the prepare verification step. This is a convenience method that wraps [`SignUp.attemptVerification()`](#attempt-verification) with Web3 wallet strategies.

By default, this method is equivalent to calling `SignUp.attemptVerification({ strategy: 'web3_metamask_signature', signature })`. The verification attempt will fail if the signature is invalid or the nonce has expired.

```typescript
function attemptWeb3WalletVerification(
  params: AttemptWeb3WalletVerificationParams
): Promise<SignUp>;
```

#### `AttemptWeb3WalletVerificationParams`

| Name      | Type   | Description                                                            |
| --------- | ------ | ---------------------------------------------------------------------- |
| signature | string | The signature that was generated after prepareVerification was called. |

### `authenticateWithBase()`

Initiates an authentication flow using Base, allowing users to authenticate via their Web3 wallet address. This method prompts the user to connect their Base account and sign a message to verify ownership of the wallet address.

```typescript
function authenticateWithBase(
  params?: SignUpAuthenticateWithWeb3Params
): Promise<SignUpResource>;
```

### `authenticateWithCoinbaseWallet()`

Initiates an authentication flow using the Coinbase Wallet browser extension, allowing users to authenticate via their Web3 wallet address. This method prompts the user to connect their Coinbase Wallet and sign a message to verify ownership of the wallet address.

```typescript
function authenticateWithCoinbaseWallet(
  params?: SignUpAuthenticateWithWeb3Params
): Promise<SignUpResource>;
```

#### Example

```js
const signUp = await clerk.signUp.authenticateWithCoinbaseWallet();
```

### `authenticateWithMetamask()`

Initiates an authentication flow using the MetaMask browser extension, allowing users to authenticate via their Ethereum wallet address. This method prompts the user to connect their MetaMask wallet and sign a message to verify ownership of the wallet address.

```typescript
function authenticateWithMetamask(
  params?: SignUpAuthenticateWithWeb3Params
): Promise<SignUpResource>;
```

#### Example

```js
const signUp = await clerk.signUp.authenticateWithMetamask();
```

### `authenticateWithOKXWallet()`

Initiates an authentication flow using the OKX Wallet browser extension, allowing users to authenticate via their Web3 wallet address. This method prompts the user to connect their OKX Wallet and sign a message to verify ownership of the wallet address.

```typescript
function authenticateWithOKXWallet(
  params?: SignUpAuthenticateWithWeb3Params
): Promise<SignUpResource>;
```

#### `SignUpAuthenticateWithWeb3Params`

| Name           | Type                 | Description                                                                                                                                                                                                                                                                                                                                                                         |
| -------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| unsafeMetadata | SignUpUnsafeMetadata | Metadata that can be read and set from the frontend and the backend. Once the sign-up is complete, the value of this field will be automatically copied to the created user's unsafe metadata (User.unsafeMetadata). One common use case is to collect custom information about the user during the sign-up process and store it in this property. Read more about unsafe metadata. |

#### Example

```js
const signUp = await clerk.signUp.authenticateWithOKXWallet();
```

### `authenticateWithSolana()`

Initiates an authentication flow using the user's Solana wallet provider, allowing users to authenticate via their Solana wallet address. This method prompts the user to connect their Solana wallet and sign a message to verify ownership of the wallet address. The `walletName` parameter specifies which Solana wallet provider to use for the authentication process, which is required to initiate the connection and signature request.

```typescript
function authenticateWithSolana(
  params: SignUpAuthenticateWithSolanaParams
): Promise<SignUpResource>;
```

#### `SignUpAuthenticateWithSolanaParams`

| Name            | Type                 | Description                                                                                        |
| --------------- | -------------------- | -------------------------------------------------------------------------------------------------- |
| walletName      | string               | The name of the wallet provider to use for generating the signature.                               |
| legalAccepted?  | boolean              | A boolean indicating whether the user has agreed to the legal compliance documents.                |
| unsafeMetadata? | SignUpUnsafeMetadata | Optional metadata to attach to the sign-in attempt. See SignUpUnsafeMetadata for more information. |

#### Example

```js
const signUp = await clerk.signUp.authenticateWithSolana({
  walletName: 'Phantom',
});
```

### `authenticateWithRedirect()`

Signs up a user via a Single Sign On (SSO) connection, such as OAuth or SAML, where an external account is used for verifying the user's identity.

```typescript
function authenticateWithRedirect(
  params: AuthenticateWithRedirectParams
): Promise<void>;
```

#### `AuthenticateWithRedirectParams`

| Name                                                                                                                                     | Type                                                                                                                                         | Description                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 'oauth\_<provider>': The user will be authenticated with their social connection account. See a list of supported values for <provider>. | 'enterprise_sso': The user will be authenticated either through SAML or OIDC depending on the configuration of their enterprise SSO account. |                                                                                                                                                                                                                                                                                                                                                                         |
| redirectUrl                                                                                                                              | string                                                                                                                                       | The full URL or path that the OAuth provider should redirect to after successful authorization on their part. Typically, this will be a simple /sso-callback route that either calls Clerk.handleRedirectCallback or mounts the <AuthenticateWithRedirectCallback /> component. See the custom flow for implementation details.                                         |
| redirectUrlComplete                                                                                                                      | string                                                                                                                                       | The full URL or path to navigate to after the OAuth or SAML flow completes.                                                                                                                                                                                                                                                                                             |
| continueSignUp?                                                                                                                          | boolean                                                                                                                                      | undefined                                                                                                                                                                                                                                                                                                                                                               | Whether to continue (i.e. PATCH) an existing SignUp (if present) or create a new SignUp. |
| continueSignIn?                                                                                                                          | boolean                                                                                                                                      | undefined                                                                                                                                                                                                                                                                                                                                                               | Whether to continue (i.e. PATCH) an existing SignIn (if present) or create a new SignIn. |
| identifier?                                                                                                                              | string                                                                                                                                       | undefined                                                                                                                                                                                                                                                                                                                                                               | The ID used to target an enterprise connection during sign-up.                           |
| emailAddress?                                                                                                                            | string                                                                                                                                       | undefined                                                                                                                                                                                                                                                                                                                                                               | The email address used to target an enterprise connection during sign-up.                |
| legalAccepted?                                                                                                                           | boolean                                                                                                                                      | A boolean indicating whether the user has agreed to the legal compliance documents.                                                                                                                                                                                                                                                                                     |
| unsafeMetadata                                                                                                                           | SignUpUnsafeMetadata                                                                                                                         | Metadata that can be read and set from the frontend. Once the sign-up is complete, the value of this field will be automatically copied to the newly created user's unsafe metadata. One common use case for this attribute is to use it to implement custom fields that can be collected during sign-up and will automatically be attached to the created User object. |
| oidcPrompt?                                                                                                                              | string                                                                                                                                       | The value to pass to the OIDC prompt parameter in the generated OAuth redirect URL.                                                                                                                                                                                                                                                                                     |
| enterpriseConnectionId?                                                                                                                  | string                                                                                                                                       | Optional if the strategy is set to enterprise_sso. The identifier of the enterprise connection to target during sign-up. This is required if there are multiple enterprise connections configured in the instance.                                                                                                                                                      |

#### Example

For OAuth connections, see the [custom flow for OAuth connections](https://clerk.com/docs/guides/development/custom-flows/authentication/oauth-connections.md).
For enterprise connections, see the [custom flow for enterprise connections](https://clerk.com/docs/guides/development/custom-flows/authentication/enterprise-connections.md).

### `authenticateWithPopup()`

Opens a popup window to allow a user to sign up via a Single Sign On (SSO) connection, such as OAuth or SAML, where an external account is used for verifying the user's identity.

```typescript
function authenticateWithPopup(
  params: AuthenticateWithPopupParams
): Promise<void>;
```

#### `AuthenticateWithPopupParams`

| Name                                                                                                                                     | Type                                                                                                                                         | Description                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| redirectUrl                                                                                                                              | string                                                                                                                                       | The full URL or path that the OAuth provider should redirect to after successful authorization on their part. Typically, this will be a simple /sso-callback route that either calls Clerk.handleRedirectCallback or mounts the <AuthenticateWithRedirectCallback /> component. See the custom flow for implementation details.                                         |
| redirectUrlComplete                                                                                                                      | string                                                                                                                                       | The full URL or path to navigate to after the OAuth or SAML flow completes.                                                                                                                                                                                                                                                                                             |
| 'oauth\_<provider>': The user will be authenticated with their social connection account. See a list of supported values for <provider>. | 'enterprise_sso': The user will be authenticated either through SAML or OIDC depending on the configuration of their enterprise SSO account. |                                                                                                                                                                                                                                                                                                                                                                         |
| popup                                                                                                                                    | Window                                                                                                                                       | A reference to a popup window opened via window\.open().                                                                                                                                                                                                                                                                                                                |
| continueSignUp?                                                                                                                          | boolean                                                                                                                                      | undefined                                                                                                                                                                                                                                                                                                                                                               | Whether to continue (i.e. PATCH) an existing SignUp (if present) or create a new SignUp. |
| continueSignIn?                                                                                                                          | boolean                                                                                                                                      | undefined                                                                                                                                                                                                                                                                                                                                                               | Whether to continue (i.e. PATCH) an existing SignIn (if present) or create a new SignIn. |
| emailAddress?                                                                                                                            | string                                                                                                                                       | undefined                                                                                                                                                                                                                                                                                                                                                               | Email address to use for targeting an enterprise connection at sign-up.                  |
| identifier?                                                                                                                              | string                                                                                                                                       | undefined                                                                                                                                                                                                                                                                                                                                                               | Identifier to use for targeting an enterprise connection at sign-up.                     |
| legalAccepted?                                                                                                                           | boolean                                                                                                                                      | A boolean indicating whether the user has agreed to the legal compliance documents.                                                                                                                                                                                                                                                                                     |
| unsafeMetadata?                                                                                                                          | SignUpUnsafeMetadata                                                                                                                         | Metadata that can be read and set from the frontend. Once the sign-up is complete, the value of this field will be automatically copied to the newly created user's unsafe metadata. One common use case for this attribute is to use it to implement custom fields that can be collected during sign-up and will automatically be attached to the created User object. |
| oidcPrompt?                                                                                                                              | string                                                                                                                                       | The value to pass to the OIDC prompt parameter in the generated OAuth redirect URL.                                                                                                                                                                                                                                                                                     |
| enterpriseConnectionId?                                                                                                                  | string                                                                                                                                       | Optional if the strategy is set to enterprise_sso. The identifier of the enterprise connection to target during sign-up. This is required if there are multiple enterprise connections configured in the instance.                                                                                                                                                      |

#### Example

```js
await clerk.signUp.authenticateWithPopup({
  popup: window.open('https://example.com', '_blank'),
  strategy: 'oauth_google',
  redirectUrl: '/sso-callback',
  redirectUrlComplete: '/home',
});
```

### `authenticateWithWeb3()`

Initiates a Web3 authentication flow by verifying the user's ownership of a blockchain wallet address through cryptographic signature verification. This method enables decentralized authentication without requiring traditional credentials.

> When the `strategy` is `web3_solana_signature`, the `walletName` parameter must be specified to indicate which Solana wallet provider to use for the authentication process.

```typescript
function authenticateWithWeb3(
  params: AuthenticateWithWeb3Params
): Promise<SignUpResource>;
```

#### `AuthenticateWithWeb3Params`

| Name              | Type                                               | Description                                                                                                                                                                                                                                                                                                                                                             |
| ----------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| identifier        | string                                             | The user's Web3 ID                                                                                                                                                                                                                                                                                                                                                      |
| generateSignature | (opts: GenerateSignatureParams) => Promise<string> | The method of how to generate the signature for the Web3 sign-in. See GenerateSignatureParams for more information.                                                                                                                                                                                                                                                     |
| strategy?         | Web3Strategy                                       | The Web3 verification strategy.                                                                                                                                                                                                                                                                                                                                         |
| legalAccepted?    | boolean                                            | A boolean indicating whether the user has agreed to the legal compliance documents.                                                                                                                                                                                                                                                                                     |
| unsafeMetadata    | SignUpUnsafeMetadata                               | Metadata that can be read and set from the frontend. Once the sign-up is complete, the value of this field will be automatically copied to the newly created user's unsafe metadata. One common use case for this attribute is to use it to implement custom fields that can be collected during sign-up and will automatically be attached to the created User object. |
| walletName?       | string                                             | The name of the wallet provider to use for generating the signature. This parameter is required when using web3_solana_signature as the strategy.                                                                                                                                                                                                                       |

#### `GenerateSignatureParams`

| Name           | Type         | Description                                                                                                                        |
| -------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| identifier     | string       | The user's Web3 wallet address.                                                                                                    |
| nonce          | string       | The cryptographic nonce used in the sign-in.                                                                                       |
| provider       | Web3Provider | The Web3 provider to generate the signature with. See Web3Provider for more information.                                           |
| legalAccepted? | boolean      | A boolean indicating whether the user has agreed to the legal compliance documents.                                                |
| walletName?    | string       | The name of the wallet provider to use for generating the signature. This parameter is required when using solana as the provider. |

#### Example

```js
const signUp = await clerk.signUp.authenticateWithWeb3({
  identifier: '0x1234567890123456789012345678901234567890',
});
```

### `create()`

Returns a new `SignUp` object based on the `params` you pass to it, stores the sign-up lifecycle state in the `status` property, and deactivates any existing sign-up process the client may already have in progress. Use this method to initiate a new sign-up process.

What you must pass to `params` depends on which [sign-up options](https://clerk.com/docs/guides/configure/auth-strategies/sign-up-sign-in-options.md) you have enabled in your Clerk application instance.

Optionally, you can complete the sign-up process in one step if you supply the required fields to `create()`. Otherwise, Clerk's sign-up process provides great flexibility and allows users to easily create multi-step sign-up flows.

> Once the sign-up process is complete, pass the `createdSessionId` to the [`setActive()`](https://clerk.com/docs/reference/javascript/clerk.md#set-active) method on the `Clerk` object. This will set the newly created session as the active session.

```typescript
function create(params: SignUpCreateParams): Promise<SignUpResource>;
```

#### `SignUpCreateParams`

| Name                                                                                                                                     | Type                                                                                                                                         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 'oauth\_<provider>': The user will be authenticated with their social connection account. See a list of supported values for <provider>. | 'enterprise_sso': The user will be authenticated either through SAML or OIDC depending on the configuration of their enterprise SSO account. |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| firstName                                                                                                                                | string                                                                                                                                       | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | The user's first name. Only supported if First and last name is enabled.                                                                                                    |
| lastName                                                                                                                                 | string                                                                                                                                       | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | The user's last name. Only supported if First and last name is enabled.                                                                                                     |
| password                                                                                                                                 | string                                                                                                                                       | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | The user's password. Only supported if Password is enabled.                                                                                                                 |
| emailAddress                                                                                                                             | string                                                                                                                                       | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | The user's email address. Only supported if Email address is enabled. Keep in mind that the email address requires an extra verification process.                           |
| phoneNumber                                                                                                                              | string                                                                                                                                       | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | The user's phone number in E.164 format. Only supported if phone number is enabled. Keep in mind that the phone number requires an extra verification process.              |
| web3Wallet                                                                                                                               | string                                                                                                                                       | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Required if Web3 authentication is enabled. The Web3 wallet address, made up of 0x + 40 hexadecimal characters or a base58 encoded ed25519 public key (for Solana wallets). |
| username                                                                                                                                 | string                                                                                                                                       | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | The user's username. Only supported if username is enabled in the instance settings.                                                                                        |
| unsafeMetadata                                                                                                                           | SignUpUnsafeMetadata                                                                                                                         | Metadata that can be read and set from the frontend. Once the sign-up is complete, the value of this field will be automatically copied to the newly created user's unsafe metadata. One common use case for this attribute is to use it to implement custom fields that can be collected during sign-up and will automatically be attached to the created User object.                                                                                                                                                                                                                         |
| redirectUrl                                                                                                                              | string                                                                                                                                       | If strategy is set to 'oauth\_<provider>' or 'enterprise_sso', this specifies full URL or path that the OAuth provider should redirect to after successful authorization on their part. Typically, this will be a simple /sso-callback route that either calls Clerk.handleRedirectCallback() or mounts the <AuthenticateWithRedirectCallback /> component. See the custom flow for implementation details. If strategy is set to 'email_link', this specifies The full URL that the user will be redirected to when they visit the email link. See the custom flow for implementation details. |
| actionCompleteRedirectUrl                                                                                                                | string                                                                                                                                       | Optional if strategy is set to 'oauth\_<provider>' or 'enterprise_sso'. The full URL or path that the user will be redirected to after successful authorization from the OAuth provider and Clerk sign-in.                                                                                                                                                                                                                                                                                                                                                                                      |
| ticket                                                                                                                                   | string                                                                                                                                       | Required if strategy is set to 'ticket'. The ticket or token generated from the Backend API.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| transfer                                                                                                                                 | boolean                                                                                                                                      | When set to true, the SignUp will attempt to retrieve information from the active SignIn instance and use it to complete the sign-up process. This is useful when you want to seamlessly transition a user from a sign-in attempt to a sign-up attempt.                                                                                                                                                                                                                                                                                                                                         |
| legalAccepted                                                                                                                            | boolean                                                                                                                                      | A boolean indicating whether the user has agreed to the legal compliance documents.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| oidcPrompt                                                                                                                               | string                                                                                                                                       | Optional if strategy is set to 'oauth\_<provider>' or 'enterprise_sso'. The value to pass to the OIDC prompt parameter in the generated OAuth redirect URL.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| oidcLoginHint                                                                                                                            | string                                                                                                                                       | Optional if strategy is set to 'oauth\_<provider>' or 'enterprise_sso'. The value to pass to the OIDC login_hint parameter in the generated OAuth redirect URL.                                                                                                                                                                                                                                                                                                                                                                                                                                 |

### `createEmailLinkFlow()`

```typescript
function createEmailLinkFlow(): {
  startEmailLinkFlow: (params: StartEmailLinkFlowParams) => Promise<SignUp>;
  cancelEmailLinkFlow: () => void;
};
```

Sets up a sign-up with email link flow. Calling `createEmailLinkFlow()` will return two functions.

The first function is async and starts the email link flow, preparing an email link verification. It sends the email link email and starts polling for verification results. The signature is `startEmailLinkFlow({ redirectUrl: string }) => Promise<SignUpResource>`.

The second function can be used to stop polling at any time, allowing for full control of the flow and cleanup. The signature is `cancelEmailLinkFlow() => void`.

```typescript
function createEmailLinkFlow(): {
  startEmailLinkFlow: (
    params: StartEmailLinkFlowParams
  ) => Promise<SignUpResource>;
  cancelEmailLinkFlow: () => void;
};
```

#### `createEmailLinkFlow()` returns

`createEmailLinkFlow` returns an object with two functions:

| Name               | Type                                                  | Description                                                                                                          |
| ------------------ | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| startEmailLinkFlow | (params: StartEmailLinkFlowParams) => Promise<SignUp> | Function to start the email link flow. It prepares an email link verification and polls for the verification result. |

#### `StartEmailLinkFlowParams`

| Name        | Type   | Description                                                                      |
| ----------- | ------ | -------------------------------------------------------------------------------- |
| redirectUrl | string | The full URL that the user will be redirected to when they visit the email link. |

### `prepareEmailAddressVerification()`

Initiates an email verification process by sending a OTP to the email address associated with the current sign-up attempt. This is a convenience method that wraps [`SignUp.prepareVerification()`](#prepare-verification) with the `'email_code'` strategy.

By default, this method is equivalent to calling `SignUp.prepareVerification({ strategy: 'email_code' })`. It can be customized via the `PrepareEmailAddressVerificationParams` to use alternative verification strategies like email links.

```typescript
function prepareEmailAddressVerification(
  params?: PrepareEmailAddressVerificationParams
): Promise<SignUpResource>;
```

#### `PrepareEmailAddressVerificationParams`

| Name                                                                                                                                                                                                                                                        | Type                                                             | Description                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 'email_code': Send an email with an OTPA one-time password (OTP) is a code that is used to authenticate a user. The OTP is typically sent to a user's email address or phone number and must be entered within a certain time period to be valid. to input. | 'email_link': Send an email with a link which validates sign-up. |                                                                                                                                                                               |
| redirectUrl                                                                                                                                                                                                                                                 | string                                                           | Required if strategy is set to 'email_link'. The full URL that the user will be redirected to when they visit the email link. See the custom flow for implementation details. |

### `preparePhoneNumberVerification()`

Initiates a phone number verification process by sending an OTP via SMS to the phone number associated with the current sign-up attempt. This is a convenience method that wraps [`SignUp.prepareVerification()`](#prepare-verification) with the `'phone_code'` strategy.

By default, this method is equivalent to calling `SignUp.prepareVerification({ strategy: 'phone_code' })`. The verification process will fail if the phone number is invalid, unreachable, or has already been verified. The sent verification code has a limited validity period and can only be used once.

```typescript
function preparePhoneNumberVerification(
  params?: PreparePhoneNumberVerificationParams
): Promise<SignUpResource>;
```

#### `PreparePhoneNumberVerificationParams`

| Name                                                                                                                                                                                                                                                      | Type                                                                                                                                                                                                                                                                | Description |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 'phone_code': Send an SMS with an OTPA one-time password (OTP) is a code that is used to authenticate a user. The OTP is typically sent to a user's email address or phone number and must be entered within a certain time period to be valid. to input. |                                                                                                                                                                                                                                                                     |             |
| 'sms': Send an SMS with an OTPA one-time password (OTP) is a code that is used to authenticate a user. The OTP is typically sent to a user's email address or phone number and must be entered within a certain time period to be valid. to input.        | 'whatsapp': Send a WhatsApp message with an OTPA one-time password (OTP) is a code that is used to authenticate a user. The OTP is typically sent to a user's email address or phone number and must be entered within a certain time period to be valid. to input. |             |

### `prepareVerification()`

Initiates the verification process for a field that requires validation during sign-up. This method prepares the necessary verification flow based on the specified strategy, such as sending verification codes, generating OAuth URLs, or preparing Web3 wallet signatures.

```typescript
function prepareVerification(
  params: PrepareVerificationParams
): Promise<SignUpResource>;
```

#### `PrepareVerificationParams`

| Name                                                                                                                                                                                                                                                      | Type                                                                                                                                                                                                                                                        | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 'phone_code': User will receive an OTPA one-time password (OTP) is a code that is used to authenticate a user. The OTP is typically sent to a user's email address or phone number and must be entered within a certain time period to be valid. via SMS. | 'email_code': Send an email with an OTPA one-time password (OTP) is a code that is used to authenticate a user. The OTP is typically sent to a user's email address or phone number and must be entered within a certain time period to be valid. to input. |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| redirectUrl                                                                                                                                                                                                                                               | string                                                                                                                                                                                                                                                      | If strategy is set to 'oauth\_<provider>' or 'enterprise_sso', this specifies the full URL or path that the OAuth provider should redirect to after successful authorization. Typically, this will be a simple /sso-callback route that either calls Clerk.handleRedirectCallback() or mounts the <AuthenticateWithRedirectCallback /> component. See the custom flow for implementation details. If strategy is set to 'email_link', this specifies The full URL that the user will be redirected to when they visit the email link. See the custom flow for implementation details. |
| actionCompleteRedirectUrl?                                                                                                                                                                                                                                | string                                                                                                                                                                                                                                                      | The full URL or path that the user will be redirected to after successful authorization from the OAuth provider and Clerk sign-in.                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| oidcPrompt?                                                                                                                                                                                                                                               | string                                                                                                                                                                                                                                                      | Optional if strategy is set to 'oauth\_<provider>' or 'enterprise_sso'. The value to pass to the OIDC prompt parameter in the generated OAuth redirect URL.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| oidcLoginHint?                                                                                                                                                                                                                                            | string                                                                                                                                                                                                                                                      | Optional if strategy is set to 'oauth\_<provider>' or 'enterprise_sso'. The value to pass to the OIDC login_hint parameter in the generated OAuth redirect URL.                                                                                                                                                                                                                                                                                                                                                                                                                       |

### `prepareWeb3WalletVerification()`

Initiates a verification process for a Web3 wallet by sending the wallet address to the server and retrieving a nonce that must be cryptographically signed by the wallet. This is a convenience method that wraps [`SignUp.prepareVerification()`](#prepare-verification) with Web3 wallet strategies.

By default, this method is equivalent to calling `SignUp.prepareVerification({ strategy: 'web3_metamask_signature' })`. The verification process will fail if the wallet address is invalid or has already been verified. The returned nonce has a limited validity period and can only be used once.

```typescript
function prepareWeb3WalletVerification(
  params?: PrepareWeb3WalletVerificationParams
): Promise<SignUpResource>;
```

#### `PrepareWeb3WalletVerificationParams`

| Name                                                                                               | Type                                                                                                                   | Description |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------- |
| 'web3_base_signature': User will need to sign a message and generate a signature using Base popup. | 'web3_metamask_signature': User will need to sign a message and generate a signature using MetaMask browser extension. |             |

### `update()`

Updates the current `SignUp`.

```typescript
function update(params: SignUpUpdateParams): Promise<SignUpResource>;
```

#### `SignUpUpdateParams`

`SignUpUpdateParams` is a mirror of [`SignUpCreateParams`](#sign-up-create-params) with the same fields and types, depending on the configuration of the instance.

### `upsert()`

Conditionally creates or updates the current sign-up. If a sign-up with an ID exists, it will update that sign-up. Otherwise, it will create a new sign-up.

```typescript
function upsert(
  params: SignUpCreateParams | SignUpUpdateParams
): Promise<SignUpResource>;
```

#### Example

```js
const signUp = await clerk.signUp.upsert({
  emailAddress: 'user@example.com',
  password: 'secure-password',
});
```
