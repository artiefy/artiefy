Title: Get started | Husky

URL Source: https://typicode.github.io/husky/get-started.html

Published Time: Sat, 07 Feb 2026 10:37:12 GMT

Markdown Content:
Get started | Husky
===============

[Skip to content](https://typicode.github.io/husky/get-started.html#VPContent)

[Husky](https://typicode.github.io/husky/)

Main Navigation [Sponsor](https://github.com/sponsors/typicode)

English

[简体中文](https://typicode.github.io/husky/zh/get-started.html)

[Русский](https://typicode.github.io/husky/ru/get-started.html)

[Español](https://typicode.github.io/husky/es/get-started.html)

[](https://github.com/typicode/husky)[](https://x.com/typicode)

English

[简体中文](https://typicode.github.io/husky/zh/get-started.html)

[Русский](https://typicode.github.io/husky/ru/get-started.html)

[Español](https://typicode.github.io/husky/es/get-started.html)

Appearance

[](https://github.com/typicode/husky)[](https://x.com/typicode)

Menu

Return to top

Sidebar Navigation

[Introduction](https://typicode.github.io/husky/)

[Get Started](https://typicode.github.io/husky/get-started.html)

[How To](https://typicode.github.io/husky/how-to.html)

[Troubleshoot](https://typicode.github.io/husky/troubleshoot.html)

[Migrate from v4](https://typicode.github.io/husky/migrate-from-v4.html)

On this page

# Get started [​](https://typicode.github.io/husky/get-started.html#get-started)

## Install [​](https://typicode.github.io/husky/get-started.html#install)

npm pnpm yarn bun

shell`npm install --save-dev husky`

shell`pnpm add --save-dev husky`

shell

```
yarn add --dev husky
# Add pinst ONLY if your package is not private
yarn add --dev pinst
```

shell`bun add --dev husky`

## `husky init` (recommended) [​](https://typicode.github.io/husky/get-started.html#husky-init-recommended)

The `init` command simplifies setting up husky in a project. It creates a `pre-commit` script in `.husky/` and updates the `prepare` script in `package.json`. Modifications can be made later to suit your workflow.

npm pnpm yarn bun

shell`npx husky init`

shell`pnpm exec husky init`

shell

```
# Due to specific caveats and differences with other package managers,
# refer to the How To section.
```

shell`bunx husky init`

## Try it [​](https://typicode.github.io/husky/get-started.html#try-it)

Congratulations! You've successfully set up your first Git hook with just one command 🎉. Let's test it:

shell

```
git commit -m "Keep calm and commit"
# test script will run every time you commit
```

## A few words... [​](https://typicode.github.io/husky/get-started.html#a-few-words)

### Scripting [​](https://typicode.github.io/husky/get-started.html#scripting)

While most of the time, you'll just run a few `npm run` or `npx` commands in your hooks, you can also script them using POSIX shell for custom workflows.

For example, here's how you can lint your staged files on each commit with only two lines of shell code and no external dependency:

shell

```
# .husky/pre-commit
prettier $(git diff --cached --name-only --diff-filter=ACMR | sed 's| |\\ |g') --write --ignore-unknown
git update-index --again
```

_This is a basic but working example, check [lint-staged](https://github.com/lint-staged/lint-staged) if you need more._

### Disabling hooks [​](https://typicode.github.io/husky/get-started.html#disabling-hooks)

Husky doesn't force Git hooks. It can be globally disabled (`HUSKY=0`) or be opt-in if wanted. See the [How To](https://typicode.github.io/husky/how-to.html) section for manual setup and more information.

Pager

[Previous page Introduction](https://typicode.github.io/husky/)

[Next page How To](https://typicode.github.io/husky/how-to.html)
