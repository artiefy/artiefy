Title: How To | Husky

URL Source: https://typicode.github.io/husky/how-to.html

Published Time: Sat, 07 Feb 2026 10:37:12 GMT

Markdown Content:
How To | Husky
===============

[Skip to content](https://typicode.github.io/husky/how-to.html#VPContent)

[Husky](https://typicode.github.io/husky/)

Main Navigation [Sponsor](https://github.com/sponsors/typicode)

English

[简体中文](https://typicode.github.io/husky/zh/how-to.html)

[Русский](https://typicode.github.io/husky/ru/how-to.html)

[Español](https://typicode.github.io/husky/es/how-to.html)

[](https://github.com/typicode/husky)[](https://x.com/typicode)

English

[简体中文](https://typicode.github.io/husky/zh/how-to.html)

[Русский](https://typicode.github.io/husky/ru/how-to.html)

[Español](https://typicode.github.io/husky/es/how-to.html)

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

# How To [​](https://typicode.github.io/husky/how-to.html#how-to)

## Adding a New Hook [​](https://typicode.github.io/husky/how-to.html#adding-a-new-hook)

Adding a hook is as simple as creating a file. This can be accomplished using your favorite editor, a script or a basic echo command. For example, on Linux/macOS:

shell`echo "npm test" > .husky/pre-commit`

## Startup files [​](https://typicode.github.io/husky/how-to.html#startup-files)

Husky allows you to execute local commands before running hooks. It reads commands from these files:

- `$XDG_CONFIG_HOME/husky/init.sh`
- `~/.config/husky/init.sh`
- `~/.huskyrc` (deprecated)

On Windows: `C:\Users\yourusername\.config\husky\init.sh`

## Skipping Git Hooks [​](https://typicode.github.io/husky/how-to.html#skipping-git-hooks)

### For a Single Command [​](https://typicode.github.io/husky/how-to.html#for-a-single-command)

Most Git commands include a `-n/--no-verify` option to skip hooks:

sh`git commit -m "..." -n # Skips Git hooks`

For commands without this flag, disable hooks temporarily with HUSKY=0:

shell

```
HUSKY=0 git ... # Temporarily disables all Git hooks
git ... # Hooks will run again
```

### For multiple commands [​](https://typicode.github.io/husky/how-to.html#for-multiple-commands)

To disable hooks for an extended period (e.g., during rebase/merge):

shell

```
export HUSKY=0 # Disables all Git hooks
git ...
git ...
unset HUSKY # Re-enables hooks
```

### For a GUI or Globally [​](https://typicode.github.io/husky/how-to.html#for-a-gui-or-globally)

To disable Git hooks in a GUI client or globally, modify the husky config:

sh

```
# ~/.config/husky/init.sh
export HUSKY=0 # Husky won't install and won't run hooks on your machine
```

## CI server and Docker [​](https://typicode.github.io/husky/how-to.html#ci-server-and-docker)

To avoid installing Git Hooks on CI servers or in Docker, use `HUSKY=0`. For instance, in GitHub Actions:

yml

```
# https://docs.github.com/en/actions/learn-github-actions/variables
env:
  HUSKY: 0
```

If installing only `dependencies` (not `devDependencies`), the `"prepare": "husky"` script may fail because Husky won't be installed.

You have multiple solutions.

Modify the `prepare` script to never fail:

json

```
// package.json
"prepare": "husky || true"
```

You'll still get a `command not found` error message in your output which may be confusing. To make it silent, create `.husky/install.mjs`:

js

```
// Skip Husky install in production and CI
if (process.env.NODE_ENV === 'production' || process.env.CI === 'true') {
  process.exit(0)
}
const husky = (await import('husky')).default
console.log(husky())
```

Then, use it in `prepare`:

json`"prepare": "node .husky/install.mjs"`

## Testing Hooks Without Committing [​](https://typicode.github.io/husky/how-to.html#testing-hooks-without-committing)

To test a hook, add `exit 1` to the hook script to abort the Git command:

shell

```
# .husky/pre-commit

# Your WIP script
# ...

exit 1
```

shell

```
git commit -m "testing pre-commit code"
# A commit will not be created
```

## Project Not in Git Root Directory [​](https://typicode.github.io/husky/how-to.html#project-not-in-git-root-directory)

Husky doesn't install in parent directories (`../`) for security reasons. However, you can change the directory in the `prepare` script.

Consider this project structure:

```
.
├── .git/
├── backend/  # No package.json
└── frontend/ # Package.json with husky
```

Set your prepare script like this:

json`"prepare": "cd .. && husky frontend/.husky"`

In your hook script, change the directory back to the relevant subdirectory:

shell

```
# frontend/.husky/pre-commit
cd frontend
npm test
```

## Non-shell hooks [​](https://typicode.github.io/husky/how-to.html#non-shell-hooks)

In order to run scripts that require the use of a scripting language, use the following pattern for each applicable hook:

(Example using hook `pre-commit` and NodeJS)

1.  Create an entrypoint for the hook:shell`.husky/pre-commit`
2.  In the file add the following shell`node .husky/pre-commit.js`
3.  in `.husky/pre-commit.js`javascript

```
// Your NodeJS code
// ...
```

## Bash [​](https://typicode.github.io/husky/how-to.html#bash)

Hook scripts need to be POSIX compliant to ensure best compatibility as not everyone has `bash` (e.g. Windows users).

That being said, if your team doesn't use Windows, you can use Bash this way:

shell

```
# .husky/pre-commit

bash << EOF
# Put your bash script inside
# ...
EOF
```

## Node Version Managers and GUIs [​](https://typicode.github.io/husky/how-to.html#node-version-managers-and-guis)

If you're using Git hooks in GUIs with Node installed via a version manager (like `nvm`, `n`, `fnm`, `asdf`, `volta`, etc...), you might face a `command not found` error due to `PATH` environment variable issues.

### Understanding `PATH` and Version Managers [​](https://typicode.github.io/husky/how-to.html#understanding-path-and-version-managers)

`PATH` is an environment variable containing a list of directories. Your shell searches these directories for commands. If it doesn't find a command, you get a `command not found` message.

Run `echo $PATH` in a shell to view its contents.

Version managers work by:

1.  Adding initialization code to your shell startup file (`.zshrc`, `.bashrc`, etc.), which runs each time you open a terminal.
2.  Downloading Node versions to a directory in your home folder.

For example, if you have two Node versions:

shell

```
~/version-manager/Node-X/node
~/version-manager/Node-Y/node
```

Opening a terminal initializes the version manager, which picks a version (say `Node-Y`) and prepends its path to `PATH`:

shell

```
echo $PATH
# Output
~/version-manager/Node-Y/:...
```

Now, node refers to `Node-Y`. Switching to `Node-X` changes `PATH` accordingly:

shell

```
echo $PATH
# Output
~/version-manager/Node-X/:...
```

The issue arises because GUIs, launched outside a terminal, don't initialize the version manager, leaving `PATH` without the Node install path. Thus, Git hooks from GUIs often fail.

### Solution [​](https://typicode.github.io/husky/how-to.html#solution)

Husky sources `~/.config/husky/init.sh` before each Git hook. Copy your version manager initialization code here to ensure it runs in GUIs.

Example with `nvm`:

shell

```
# ~/.config/husky/init.sh
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
```

Alternatively, if your shell startup file is fast and lightweight, source it directly:

shell

```
# ~/.config/husky/init.sh
. ~/.zshrc
```

## Manual setup [​](https://typicode.github.io/husky/how-to.html#manual-setup)

Git needs to be configured and husky needs to setup files in `.husky/`.

Run the `husky` command once in your repo. Ideally, include it in the `prepare` script in `package.json` for automatic execution after each install (recommended).

npm pnpm yarn bun

json

```
{
  "scripts": {
    "prepare": "husky"
  }
}
```

json

```
{
  "scripts": {
    "prepare": "husky"
  }
}
```

json

```
{
  "scripts": {
    // Yarn doesn't support prepare script
    "postinstall": "husky",
    // Include this if publishing to npmjs.com
    "prepack": "pinst --disable",
    "postpack": "pinst --enable"
  }
}
```

json

```
{
  "scripts": {
    "prepare": "husky"
  }
}
```

Run `prepare` once:

npm pnpm yarn bun

sh`npm run prepare`

sh`pnpm run prepare`

sh

```
# Yarn doesn't support `prepare`
yarn run postinstall
```

sh`bun run prepare`

Create a `pre-commit` file in the `.husky/` directory:

npm pnpm yarn bun

shell

```
# .husky/pre-commit
npm test
```

shell

```
# .husky/pre-commit
pnpm test
```

shell

```
# .husky/pre-commit
yarn test
```

sh

```
# .husky/pre-commit
bun test
```

Pager

[Previous page Get Started](https://typicode.github.io/husky/get-started.html)

[Next page Troubleshoot](https://typicode.github.io/husky/troubleshoot.html)
