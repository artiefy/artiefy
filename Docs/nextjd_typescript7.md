Title: Configuration: TypeScript

URL Source: https://nextjs.org/docs/app/api-reference/config/typescript

Markdown Content:
Last updated

July 23, 2026

Next.js comes with built-in TypeScript, automatically installing the necessary packages and configuring the proper settings when you create a new project with `create-next-app`.

To add TypeScript to an existing project, rename a file to `.ts` / `.tsx`. Run `next dev` and `next build` to automatically install the necessary dependencies and add a `tsconfig.json` file with the recommended config options.

> **Good to know**: If you already have a `jsconfig.json` file, copy the `paths` compiler option from the old `jsconfig.json` into the new `tsconfig.json` file, and delete the old `jsconfig.json` file.

## Using TypeScript 7[](https://nextjs.org/docs/app/api-reference/config/typescript#using-typescript-7)

[TypeScript 7](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) does not currently provide the JavaScript compiler API that Next.js uses for type checking by default. To use TypeScript 7 during `next build`, install it in your project:

Then, opt in to running the project-local `tsc` CLI instead of the JavaScript API with [`experimental.useTypeScriptCli`](https://nextjs.org/docs/app/api-reference/config/next-config-js/useTypeScriptCli):

Next.js does not enable this option automatically. If you install TypeScript 7 without enabling `experimental.useTypeScriptCli`, `next build` exits with instructions to enable the option or install a TypeScript version supported by the default checker.

> **Good to know**:
>
> - CLI type checking prints the native `tsc` diagnostics. It does not apply Next.js-specific code frames or rewrite errors for routes, pages, layouts, or route handlers.
> - The CLI checks the complete project selected by your `tsconfig` file. This includes test files and `.next/dev/types` when they are included by that configuration. [`next build --debug-build-paths`](https://nextjs.org/docs/app/api-reference/cli/next#next-build-options) does not narrow the files that are type checked and produces a warning when used with this option.
> - [`typescript.tsconfigPath`](https://nextjs.org/docs/app/api-reference/config/typescript#custom-tsconfig-path) continues to select the configuration passed to `tsc`. [`typescript.ignoreBuildErrors`](https://nextjs.org/docs/app/api-reference/config/typescript#disabling-typescript-errors-in-production) skips the type-checking step, including the CLI checker.
> - `experimental.useTypeScriptCli` is experimental and its behavior may change.

## IDE Plugin[](https://nextjs.org/docs/app/api-reference/config/typescript#ide-plugin)

Next.js includes a custom TypeScript plugin and type checker, which VSCode and other code editors can use for advanced type-checking and auto-completion.

You can enable the plugin in VS Code by:

1.  Opening the command palette (`Ctrl/⌘` + `Shift` + `P`)
2.  Searching for "TypeScript: Select TypeScript Version"
3.  Selecting "Use Workspace Version"

![Image 1: TypeScript Command Palette](https://nextjs.org/_next/image?url=https%3A%2F%2Fh8DxKfmAPhn8O0p3.public.blob.vercel-storage.com%2Fdocs%2Flight%2Ftypescript-command-palette.png&w=3840&q=75)![Image 2: TypeScript Command Palette](https://nextjs.org/_next/image?url=https%3A%2F%2Fh8DxKfmAPhn8O0p3.public.blob.vercel-storage.com%2Fdocs%2Fdark%2Ftypescript-command-palette.png&w=3840&q=75)
Now, when editing files, the custom plugin will be enabled. By default, the custom type checker is used when running `next build`. When [`experimental.useTypeScriptCli`](https://nextjs.org/docs/app/api-reference/config/typescript#using-typescript-7) is enabled, the project-local `tsc` CLI is used instead.

The TypeScript plugin can help with:

- Warning if invalid values for [segment config options](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config) are passed.
- Showing available options and in-context documentation.
- Ensuring the `'use client'` directive is used correctly.
- Ensuring client hooks (like `useState`) are only used in Client Components.

> **🎥 Watch:** Learn about the built-in TypeScript plugin → [YouTube (3 minutes)](https://www.youtube.com/watch?v=pqMqn9fKEf8)

## End-to-End Type Safety[](https://nextjs.org/docs/app/api-reference/config/typescript#end-to-end-type-safety)

The Next.js App Router has **enhanced type safety**. This includes:

1.  **No serialization of data between fetching function and page**: You can `fetch` directly in components, layouts, and pages on the server. This data _does not_ need to be serialized (converted to a string) to be passed to the client side for consumption in React. Instead, since `app` uses Server Components by default, we can use values like `Date`, `Map`, `Set`, and more without any extra steps. Previously, you needed to manually type the boundary between server and client with Next.js-specific types.
2.  **Streamlined data flow between components**: With the removal of `_app` in favor of root layouts, it is now easier to visualize the data flow between components and pages. Previously, data flowing between individual `pages` and `_app` were difficult to type and could introduce confusing bugs. With [colocated data fetching](https://nextjs.org/docs/app/getting-started/fetching-data) in the App Router, this is no longer an issue.

[Data Fetching in Next.js](https://nextjs.org/docs/app/getting-started/fetching-data) now provides as close to end-to-end type safety as possible without being prescriptive about your database or content provider selection.

We're able to type the response data as you would expect with normal TypeScript. For example:

For _complete_ end-to-end type safety, this also requires your database or content provider to support TypeScript. This could be through using an [ORM](https://en.wikipedia.org/wiki/Object%E2%80%93relational_mapping) or type-safe query builder.

## Route-Aware Type Helpers[](https://nextjs.org/docs/app/api-reference/config/typescript#route-aware-type-helpers)

Next.js generates global helpers for App Router route types. These are available without imports and are generated during `next dev`, `next build`, or via [`next typegen`](https://nextjs.org/docs/app/api-reference/cli/next#next-typegen-options):

- [`PageProps`](https://nextjs.org/docs/app/api-reference/file-conventions/page#page-props-helper)
- [`LayoutProps`](https://nextjs.org/docs/app/api-reference/file-conventions/layout#layout-props-helper)
- [`RouteContext`](https://nextjs.org/docs/app/api-reference/file-conventions/route#route-context-helper)

## `next-env.d.ts`[](https://nextjs.org/docs/app/api-reference/config/typescript#next-envdts)

Next.js generates a `next-env.d.ts` file in your project root. This file references Next.js type definitions, allowing TypeScript to recognize non-code imports (images, stylesheets, etc.) and Next.js-specific types.

Running `next dev`, `next build`, or [`next typegen`](https://nextjs.org/docs/app/api-reference/cli/next#next-typegen-options) regenerates this file.

> **Good to know**:
>
> - `next-env.d.ts` is managed by Next.js. Its contents are an implementation detail and may change over time. Add it to `.gitignore`. If your project already tracks the file, remove it from Git. Do not edit this file manually.
> - The file must be in your `tsconfig.json``include` array (`create-next-app` does this automatically).

## Examples[](https://nextjs.org/docs/app/api-reference/config/typescript#examples)

### Type Checking Next.js Configuration Files[](https://nextjs.org/docs/app/api-reference/config/typescript#type-checking-nextjs-configuration-files)

You can use TypeScript and import types in your Next.js configuration by using `next.config.ts`.

Module resolution in `next.config.ts` is currently limited to CommonJS. However, ECMAScript Modules (ESM) syntax is available when [using Node.js native TypeScript resolver](https://nextjs.org/docs/app/api-reference/config/typescript#using-nodejs-native-typescript-resolver-for-nextconfigts) for Node.js v22.10.0 and higher.

When using the `next.config.js` file, you can add some type checking in your IDE using JSDoc as below:

### Using Node.js Native TypeScript Resolver for `next.config.ts`[](https://nextjs.org/docs/app/api-reference/config/typescript#using-nodejs-native-typescript-resolver-for-nextconfigts)

> **Note**: Available on Node.js v22.10.0+ and only when the feature is enabled. Next.js does not enable it.

Next.js detects the [Node.js native TypeScript resolver](https://nodejs.org/api/typescript.html) via [`process.features.typescript`](https://nodejs.org/api/process.html#processfeaturestypescript), added in **v22.10.0**. When present, `next.config.ts` can use native ESM, including top‑level `await` and dynamic `import()`. This mechanism inherits the capabilities and limitations of Node's resolver.

In Node.js versions **v22.18.0+**, `process.features.typescript` is enabled by default. For versions between **v22.10.0** and **22.17.x**, opt in with `NODE_OPTIONS=--experimental-transform-types`:

#### For CommonJS Projects (Default)[](https://nextjs.org/docs/app/api-reference/config/typescript#for-commonjs-projects-default)

Although `next.config.ts` supports native ESM syntax in CommonJS projects, Node.js will still assume `next.config.ts` is a CommonJS file by default, resulting in Node.js reparsing the file as ESM when module syntax is detected. Therefore, we recommend using the `next.config.mts` file for CommonJS projects to explicitly indicate it's an ESM module:

#### For ESM Projects[](https://nextjs.org/docs/app/api-reference/config/typescript#for-esm-projects)

When `"type"` is set to `"module"` in `package.json`, your project uses ESM. Learn more about this setting [in the Node.js docs](https://nodejs.org/api/packages.html#type). In this case, you can write `next.config.ts` directly with ESM syntax.

> **Good to know**: When using `"type": "module"` in your `package.json`, all `.js` and `.ts` files in your project are treated as ESM modules by default. You may need to rename files with CommonJS syntax to `.cjs` or `.cts` extensions if needed.

### Statically Typed Links[](https://nextjs.org/docs/app/api-reference/config/typescript#statically-typed-links)

Next.js can statically type links to prevent typos and other errors when using `next/link`, improving type safety when navigating between pages.

Works in both the Pages and App Router for the `href` prop in `next/link`. In the App Router, it also types `next/navigation` methods like `push`, `replace`, and `prefetch`. It does not type `next/router` methods in Pages Router.

Literal `href` strings are validated, while non-literal `href`s may require a cast with `as Route`.

To opt-into this feature, `typedRoutes` needs to be enabled and the project needs to be using TypeScript.

Next.js will generate a link definition in `.next/types` that contains information about all existing routes in your application, which TypeScript can then use to provide feedback in your editor about invalid links.

> **Good to know**: If you set up your project without `create-next-app`, ensure the generated Next.js types are included by adding `.next/types/**/*.ts` to the `include` array in your `tsconfig.json`:

Currently, support includes any string literal, including dynamic segments. For non-literal strings, you need to manually cast with `as Route`. The example below shows both `next/link` and `next/navigation` usage:

The same applies for redirecting routes defined by proxy:

To accept `href` in a custom component wrapping `next/link`, use a generic:

You can also type a simple data structure and iterate to render links:

Then, map over the items to render `Link`s:

> **How does it work?**
>
> When running `next dev` or `next build`, Next.js generates a hidden `.d.ts` file inside `.next` that contains information about all existing routes in your application (all valid routes as the `href` type of `Link`). This `.d.ts` file is included in `tsconfig.json` and the TypeScript compiler will check that `.d.ts` and provide feedback in your editor about invalid links.

### Type IntelliSense for Environment Variables[](https://nextjs.org/docs/app/api-reference/config/typescript#type-intellisense-for-environment-variables)

During development, Next.js generates a `.d.ts` file in `.next/types` that contains information about the loaded environment variables for your editor's IntelliSense. If the same environment variable key is defined in multiple files, it is deduplicated according to the [Environment Variable Load Order](https://nextjs.org/docs/app/guides/environment-variables#environment-variable-load-order).

To opt-into this feature, `experimental.typedEnv` needs to be enabled and the project needs to be using TypeScript.

> **Good to know**: Types are generated based on the environment variables loaded at development runtime, which excludes variables from `.env.production*` files by default. To include production-specific variables, run `next dev` with `NODE_ENV=production`.

### With Async Server Components[](https://nextjs.org/docs/app/api-reference/config/typescript#with-async-server-components)

To use an `async` Server Component with TypeScript, ensure you are using TypeScript `5.1.3` or higher and `@types/react``18.2.8` or higher.

If you are using an older version of TypeScript, you may see a `'Promise<Element>' is not a valid JSX element` type error. Updating to the latest version of TypeScript and `@types/react` should resolve this issue.

### Incremental type checking[](https://nextjs.org/docs/app/api-reference/config/typescript#incremental-type-checking)

Since `v10.2.1` Next.js supports [incremental type checking](https://www.typescriptlang.org/tsconfig#incremental) when enabled in your `tsconfig.json`, this can help speed up type checking in larger applications.

### Custom `tsconfig` path[](https://nextjs.org/docs/app/api-reference/config/typescript#custom-tsconfig-path)

In some cases, you might want to use a different TypeScript configuration for builds or tooling. To do that, set `typescript.tsconfigPath` in `next.config.ts` to point Next.js to another `tsconfig` file.

For example, switch to a different config for production builds:

Why you might use a separate `tsconfig` for builds
You might need to relax checks in scenarios like monorepos, where the build also validates shared dependencies that don't match your project's standards, or when loosening checks in CI to continue delivering while migrating locally to stricter TypeScript settings (and still wanting your IDE to highlight misuse).

For example, if your project uses `useUnknownInCatchVariables` but some monorepo dependencies still assume `any`:

This keeps your editor strict via `tsconfig.json` while allowing the production build to use relaxed settings.

> **Good to know**:
>
> - IDEs typically read `tsconfig.json` for diagnostics and IntelliSense, so you can still see IDE warnings while production builds use the alternate config. Mirror critical options if you want parity in the editor.
> - In development, only `tsconfig.json` is watched for changes. If you edit a different file name via `typescript.tsconfigPath`, restart the dev server to apply changes.
> - The configured file is used in `next dev`, `next build`, and `next typegen`.

### Disabling TypeScript errors in production[](https://nextjs.org/docs/app/api-reference/config/typescript#disabling-typescript-errors-in-production)

Next.js fails your **production build** (`next build`) when TypeScript errors are present in your project.

If you'd like Next.js to dangerously produce production code even when your application has errors, you can disable the built-in type checking step.

If disabled, be sure you are running type checks as part of your build or deploy process, otherwise this can be very dangerous.

Open `next.config.ts` and enable the `ignoreBuildErrors` option in the [`typescript`](https://nextjs.org/docs/app/api-reference/config/next-config-js/typescript) config:

> **Good to know**: You can run `tsc --noEmit` to check for TypeScript errors yourself before building. This is useful for CI/CD pipelines where you'd like to check for TypeScript errors before deploying.

### Custom type declarations[](https://nextjs.org/docs/app/api-reference/config/typescript#custom-type-declarations)

When you need to declare custom types, you might be tempted to modify `next-env.d.ts`. However, this file is automatically generated, so any changes you make will be overwritten. Instead, you should create a new file, let's call it `new-types.d.ts`, and reference it in your `tsconfig.json`:

## Version Changes[](https://nextjs.org/docs/app/api-reference/config/typescript#version-changes)

| Version   | Changes                                                                                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v15.0.0` | [`next.config.ts`](https://nextjs.org/docs/app/api-reference/config/typescript#type-checking-nextjs-configuration-files) support added for TypeScript projects. |
| `v13.2.0` | Statically typed links are available in beta.                                                                                                                   |
| `v12.0.0` | [SWC](https://nextjs.org/docs/architecture/nextjs-compiler) is now used by default to compile TypeScript and TSX for faster builds.                             |
| `v10.2.1` | [Incremental type checking](https://www.typescriptlang.org/tsconfig#incremental) support added when enabled in your `tsconfig.json`.                            |
