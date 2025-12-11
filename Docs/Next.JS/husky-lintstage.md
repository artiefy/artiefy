🚫💩 lint-staged
npm version

Run tasks like formatters and linters against staged git files and don't let 💩 slip into your code base!

npm install --save-dev lint-staged # requires further setup
$ git commit

✔ Backed up original state in git stash (5bda95f)
❯ Running tasks for staged files...
❯ packages/frontend/.lintstagedrc.json — 1 file
↓ _.js — no files [SKIPPED]
❯ _.{json,md} — 1 file
⠹ prettier --write
↓ packages/backend/.lintstagedrc.json — 2 files
❯ _.js — 2 files
⠼ eslint --fix
↓ _.{json,md} — no files [SKIPPED]
◼ Applying modifications from tasks...
◼ Cleaning up temporary files...
See asciinema video
Table of Contents
Why
Installation and setup
Changelog
Command line flags
Configuration
Filtering files
What commands are supported?
Running multiple commands in a sequence
Using JS configuration files
Reformatting the code
Examples
Frequently Asked Questions
Why
Code quality tasks like formatters and linters make more sense when run before committing your code. By doing so you can ensure no errors go into the repository and enforce code style. But running a task on a whole project can be slow, and opinionated tasks such as linting can sometimes produce irrelevant results. Ultimately you only want to check files that will be committed.

This project contains a script that will run arbitrary shell tasks with a list of staged files as an argument, filtered by a specified glob pattern.

Related blog posts and talks
Introductory Medium post - Andrey Okonetchnikov, 2016
Running Jest Tests Before Each Git Commit - Ben McCormick, 2017
AgentConf presentation - Andrey Okonetchnikov, 2018
SurviveJS interview - Juho Vepsäläinen and Andrey Okonetchnikov, 2018
Prettier your CSharp with dotnet-format and lint-staged
If you've written one, please submit a PR with the link to it!

Installation and setup
To install lint-staged in the recommended way, you need to:

Install lint-staged itself:
npm install --save-dev lint-staged
Set up the pre-commit git hook to run lint-staged
Husky is a popular choice for configuring git hooks
Read more about git hooks here
Install some tools like ESLint or Prettier
Configure lint-staged to run code checkers and other tasks:
for example: { "\*.js": "eslint" } to run ESLint for all staged JS files
See Configuration for more info
Don't forget to commit changes to package.json and .husky to share this setup with your team!

Now change a few files, git add or git add --patch some of them to your commit, and try to git commit them.

See examples and configuration for more information.

Caution

Lint-staged runs git operations affecting the files in your repository. By default lint-staged creates a git stash as a backup of the original state before running any configured tasks to help prevent data loss.

Changelog
See Releases.

Migration
For breaking changes, see MIGRATION.md.

Command line flags
❯ npx lint-staged --help
Usage: lint-staged [options]

Options:
-V, --version output the version number
--allow-empty allow empty commits when tasks revert all staged changes (default: false)
-p, --concurrent <number|boolean> the number of tasks to run concurrently, or false for serial (default: true)
-c, --config [path] path to configuration file, or - to read from stdin
--cwd [path] run all tasks in specific directory, instead of the current
-d, --debug print additional debug information (default: false)
--diff [string] override the default "--staged" flag of "git diff" to get list of files. Implies
"--no-stash".
--diff-filter [string] override the default "--diff-filter=ACMR" flag of "git diff" to get list of files
--continue-on-error run all tasks to completion even if one fails (default: false)
--fail-on-changes fail with exit code 1 when tasks modify tracked files (default: false)
--max-arg-length [number] maximum length of the command-line argument string (default: 0)
--no-revert do not revert to original state in case of errors.
--no-stash disable the backup stash. Implies "--no-revert".
--no-hide-partially-staged disable hiding unstaged changes from partially staged files
--hide-unstaged hide all unstaged changes, instead of just partially staged (default: false)
-q, --quiet disable lint-staged’s own console output (default: false)
-r, --relative pass relative filepaths to tasks (default: false)
-v, --verbose show task output even when tasks succeed; by default only failed output is shown
(default: false)
-h, --help display help for command

Any lost modifications can be restored from a git stash:

> git stash list --format="%h %s"
> h0a0s0h0 On main: lint-staged automatic backup
> git apply --index h0a0s0h0
> --allow-empty
> By default, when tasks undo all staged changes, lint-staged will exit with an error and abort the commit. Use this flag to allow creating empty git commits.

--concurrent [number|boolean]
Controls the concurrency of tasks being run by lint-staged. NOTE: This does NOT affect the concurrency of subtasks (they will always be run sequentially). Possible values are:

false: Run all tasks serially
true (default) : Infinite concurrency. Runs as many tasks in parallel as possible.
{number}: Run the specified number of tasks in parallel, where 1 is equivalent to false.
--config [path]
Manually specify a path to a config file or npm package name. Note: when used, lint-staged won't perform the config file search and will print an error if the specified file cannot be found. If '-' is provided as the filename then the config will be read from stdin, allowing piping in the config like cat my-config.json | npx lint-staged --config -.

--cwd [path]
By default tasks run in the current working directory. Use the --cwd some/directory to override this. The path can be absolute or relative to the current working directory.

--debug
Run in debug mode. When set, it does the following:

log additional information about staged files, commands being executed, location of binaries, etc.
uses verbose renderer for listr2; this causes serial, uncoloured output to the terminal, instead of the default (beautified, dynamic) output. (the verbose renderer can also be activated by setting the TERM=dumb or NODE_ENV=test environment variables)
--diff
By default tasks are filtered against all files staged in git, generated from git diff --staged. This option allows you to override the --staged flag with arbitrary revisions. For example to get a list of changed files between two branches, use --diff="branch1...branch2". You can also read more from about git diff and gitrevisions. This option also implies --no-stash.

--diff-filter [string]
By default only files that are added, copied, modified, or renamed are included. Use this flag to override the default ACMR value with something else: added (A), copied (C), deleted (D), modified (M), renamed (R), type changed (T), unmerged (U), unknown (X), or pairing broken (B). See also the git diff docs for --diff-filter.

--continue-on-error
By default lint-staged will "exit early" when any of the configured tasks fails, to make sure the runtime is short. With this flag, lint-staged will instead run all tasks to completion and only fail at the end, allowing all task output to be seen.

--fail-on-changes
By default changes made by tasks are automatically staged and added to the commit. This flag disables the behavior and makes lint-staged exit with code 1, failing the commit instead. Using this flag also implies the --no-revert flag which means any changes made my tasks will be left in the working tree after failing, so that they can be manually staged and the commit tried again.

--max-arg-length [number]
long commands (a lot of files) are automatically split into multiple chunks when it detects the current shell cannot handle them. Use this flag to override the maximum length of the generated command string.

--no-stash
By default a backup stash will be created before running the tasks, and all task modifications will be reverted in case of an error. This option will disable creating the stash, and instead leave all modifications in the index when aborting the commit.

--no-hide-partially-staged
By default, unstaged changes from partially staged files will be hidden and applied back after running tasks. This option will disable this behavior, causing those changes to also be committed.

--hide-unstaged
Use this option to hide all unstaged changes to tracked files before running tasks. The changes will be applied back after running the tasks. Note that the combination of flags --hide-unstaged --no-hide-partially-staged isn't meaningful and behaves the same as just --hide-unstaged.

--quiet
Suppress all CLI output, except from tasks.

--relative
Pass filepaths relative to process.cwd() (where lint-staged runs) to tasks. Default is false.

--no-revert
By default all task modifications will be reverted in case of an error. This option will disable the behavior, and apply task modifications to the index before aborting the commit.

--verbose
Show task output even when tasks succeed. By default only failed output is shown.

Configuration
Lint-staged can be configured in many ways:

lint-staged object in your package.json, or package.yaml
.lintstagedrc file in JSON or YML format, or you can be explicit with the file extension:
.lintstagedrc.json
.lintstagedrc.yaml
.lintstagedrc.yml
.lintstagedrc.mjs or lint-staged.config.mjs file in ESM format
the default export value should be a configuration: export default { ... }
.lintstagedrc.cjs or lint-staged.config.cjs file in CommonJS format
the exports value should be a configuration: module.exports = { ... }
lint-staged.config.js or .lintstagedrc.js in either ESM or CommonJS format, depending on whether your project's package.json contains the "type": "module" option or not.
Pass a configuration file using the --config or -c flag
Configuration should be an object where each value is a command to run and its key is a glob pattern to use for this command. This package uses micromatch for glob patterns. JavaScript files can also export advanced configuration as a function. See Using JS configuration files for more info.

You can also place multiple configuration files in different directories inside a project. For a given staged file, the closest configuration file will always be used. See "How to use lint-staged in a multi-package monorepo?" for more info and an example.

package.json example:
{
"lint-staged": {
"_": "your-cmd"
}
}
.lintstagedrc example
{
"_": "your-cmd"
}
This config will execute your-cmd with the list of currently staged files passed as arguments.

So, considering you did git add file1.ext file2.ext, lint-staged will run the following command:

your-cmd file1.ext file2.ext

TypeScript
Lint-staged provides TypeScript types for the configuration and main Node.js API. You can use the JSDoc syntax in your JS configuration files:

/\*\*

- @filename: lint-staged.config.js
- @type {import('lint-staged').Configuration}
  _/
  export default {
  '_': 'prettier --write',
  }
  It's also possible to use the .ts file extension for the configuration if your Node.js version supports it. The --experimental-strip-types flag was introduced in Node.js v22.6.0 and unflagged in v23.6.0, enabling Node.js to execute TypeScript files without additional configuration.

export NODE_OPTIONS="--experimental-strip-types"

npx lint-staged --config lint-staged.config.ts
Task concurrency
By default lint-staged will run configured tasks concurrently. This means that for every glob, all the commands will be started at the same time. With the following config, both eslint and prettier will run at the same time:

{
"_.ts": "eslint",
"_.md": "prettier --list-different"
}
This is typically not a problem since the globs do not overlap, and the commands do not make changes to the files, but only report possible errors (aborting the git commit). If you want to run multiple commands for the same set of files, you can use the array syntax to make sure commands are run in order. In the following example, prettier will run for both globs, and in addition eslint will run for \*.ts files after it. Both sets of commands (for each glob) are still started at the same time (but do not overlap).

{
"_.ts": ["prettier --list-different", "eslint"],
"_.md": "prettier --list-different"
}
Pay extra attention when the configured globs overlap, and tasks make edits to files. For example, in this configuration prettier and eslint might try to make changes to the same \*.ts file at the same time, causing a race condition:

{
"_": "prettier --write",
"_.ts": "eslint --fix"
}
You can solve it using the negation pattern and the array syntax:

{
"!(_.ts)": "prettier --write",
"_.ts": ["eslint --fix", "prettier --write"]
}
Another example in which tasks make edits to files and globs match multiple files but don't overlap:

{
"_.css": ["stylelint --fix", "prettier --write"],
"_.{js,jsx}": ["eslint --fix", "prettier --write"],
"!(_.css|_.js|\*.jsx)": ["prettier --write"]
}
Or, if necessary, you can limit the concurrency using --concurrent <number> or disable it entirely with --concurrent false.

Filtering files
Task commands work on a subset of all staged files, defined by a glob pattern. lint-staged uses micromatch for matching files with the following rules:

If the glob pattern contains no slashes (/), micromatch's matchBase option will be enabled, so globs match a file's basename regardless of directory:
"*.js" will match all JS files, like /test.js and /foo/bar/test.js
"!(*test).js" will match all JS files, except those ending in test.js, so foo.js but not foo.test.js
"!(_.css|_.js)" will match all files except CSS and JS files
If the glob pattern does contain a slash (/), it will match for paths as well:
"./_.js" will match all JS files in the git repo root, so /test.js but not /foo/bar/test.js
"foo/\*\*/_.js" will match all JS files inside the /foo directory, so /foo/bar/test.js but not /test.js
When matching, lint-staged will do the following

Resolve the git root automatically, no configuration needed.
Pick the staged files which are present inside the project directory.
Filter them using the specified glob patterns.
Pass absolute paths to the tasks as arguments.
NOTE: lint-staged will pass absolute paths to the tasks to avoid any confusion in case they're executed in a different working directory (i.e. when your .git directory isn't the same as your package.json directory).

Also see How to use lint-staged in a multi-package monorepo?

Ignoring files
The concept of lint-staged is to run configured linter tasks (or other tasks) on files that are staged in git. lint-staged will always pass a list of all staged files to the task, and ignoring any files should be configured in the task itself.

Consider a project that uses prettier to keep code format consistent across all files. The project also stores minified 3rd-party vendor libraries in the vendor/ directory. To keep prettier from throwing errors on these files, the vendor directory should be added to prettier's ignore configuration, the .prettierignore file. Running npx prettier . will ignore the entire vendor directory, throwing no errors. When lint-staged is added to the project and configured to run prettier, all modified and staged files in the vendor directory will be ignored by prettier, even though it receives them as input.

In advanced scenarios, where it is impossible to configure the linter task itself to ignore files, but some staged files should still be ignored by lint-staged, it is possible to filter filepaths before passing them to tasks by using the function syntax. See Example: Ignore files from match.

What commands are supported?
Supported are any executables installed locally or globally via npm as well as any executable from your $PATH.

Using globally installed scripts is discouraged, since lint-staged may not work for someone who doesn't have it installed.

lint-staged uses nano-spawn to locate locally installed scripts. So in your .lintstagedrc you can write:

{
"\*.js": "eslint --fix"
}
This will result in lint-staged running eslint --fix file-1.js file-2.js, when you have staged files file-1.js, file-2.js and README.md.

Pass arguments to your commands separated by space as you would do in the shell. See examples below.

Running multiple commands in a sequence
You can run multiple commands in a sequence on every glob. To do so, pass an array of commands instead of a single one. This is useful for running autoformatting tools like eslint --fix or stylefmt but can be used for any arbitrary sequences.

For example:

{
"_.js": ["eslint", "prettier --write"]
}
going to execute eslint and if it exits with 0 code, it will execute prettier --write on all staged _.js files.

This will result in lint-staged running eslint file-1.js file-2.js, when you have staged files file-1.js, file-2.js and README.md, and if it passes, prettier --write file-1.js file-2.js.

Using JS configuration files
Writing the configuration file in JavaScript is the most powerful way to configure lint-staged (lint-staged.config.js, similar, or passed via --config). From the configuration file, you can export either a single function or an object.

If the exports value is a function, it will receive an array of all staged filenames. You can then build your own matchers for the files and return a command string or an array of command strings. These strings are considered complete and should include the filename arguments, if wanted.

If the exports value is an object, its keys should be glob matches (like in the normal non-js config format). The values can either be like in the normal config or individual functions like described above. Instead of receiving all matched files, the functions in the exported object will only receive the staged files matching the corresponding glob key.

To summarize, by default lint-staged automatically adds the list of matched staged files to your command, but when building the command using JS functions it is expected to do this manually. For example:

export default {
'\*.js': (stagedFiles) => [`eslint .`, `prettier --write ${stagedFiles.join(' ')}`],
}
This will result in lint-staged first running eslint . (matching all files), and if it passes, prettier --write file-1.js file-2.js, when you have staged files file-1.js, file-2.js and README.md.

JavaScript Functions
You can also configure lint-staged to run a JavaScript/Node.js script directly, passing the list of staged files as an argument:

export default {
'\*.js': {
title: 'Log staged JS files to console',
task: async (files) => {
console.log('Staged JS files:', files)
},
},
}
Example: Export a function to build your own matchers
Click to expand
Example: Wrap filenames in single quotes and run once per file
Click to expand
Example: Run tsc on changes to TypeScript files, but do not pass any filename arguments
Click to expand
Example: Run ESLint on entire repo if more than 10 staged files
Click to expand
Example: Use your own globs
Click to expand
Example: Ignore files from match
Click to expand
Example: Use relative paths for commands
Click to expand
Reformatting the code
Tools like Prettier, ESLint/TSLint, or stylelint can reformat your code according to an appropriate config by running prettier --write/eslint --fix/tslint --fix/stylelint --fix. Lint-staged will automatically add any modifications to the commit as long as there are no errors.

{
"\*.js": "prettier --write"
}
Prior to version 10, tasks had to manually include git add as the final step. This behavior has been integrated into lint-staged itself in order to prevent race conditions with multiple tasks editing the same files. If lint-staged detects git add in task configurations, it will show a warning in the console. Please remove git add from your configuration after upgrading.

Examples
All examples assume you've already set up lint-staged in the package.json file and husky in its own config file.

{
"name": "My project",
"version": "0.1.0",
"scripts": {
"my-custom-script": "linter --arg1 --arg2"
},
"lint-staged": {}
}
In .husky/pre-commit

# .husky/pre-commit

npx lint-staged
Note: we don't pass a path as an argument for the runners. This is important since lint-staged will do this for you.

ESLint with default parameters for _.js and _.jsx running as a pre-commit hook
Click to expand
{
"_.{js,jsx}": "eslint"
}
Automatically fix code style with --fix and add to commit
Click to expand
{
"_.js": "eslint --fix"
}
This will run eslint --fix and automatically add changes to the commit.

Reuse npm script
Click to expand
If you wish to reuse a npm script defined in your package.json:

{
"\*.js": "npm run my-custom-script --"
}
The following is equivalent:

{
"\*.js": "linter --arg1 --arg2"
}
Use environment variables with task commands
Click to expand
Task commands do not support the shell convention of expanding environment variables. To enable the convention yourself, use a tool like cross-env.

For example, here is jest running on all .js files with the NODE_ENV variable being set to "test":

{
"_.js": ["cross-env NODE_ENV=test jest --bail --findRelatedTests"]
}
Automatically fix code style with prettier for any format Prettier supports
Click to expand
{
"_": "prettier --ignore-unknown --write"
}
Automatically fix code style with prettier for JavaScript, TypeScript, Markdown, HTML, or CSS
Click to expand
{
"_.{js,jsx,ts,tsx,md,html,css}": "prettier --write"
}
Stylelint for CSS with defaults and for SCSS with SCSS syntax
Click to expand
{
"_.css": "stylelint",
"_.scss": "stylelint --syntax=scss"
}
Run PostCSS sorting and Stylelint to check
Click to expand
{
"_.scss": ["postcss --config path/to/your/config --replace", "stylelint"]
}
Minify the images
Click to expand
{
"\*.{png,jpeg,jpg,gif,svg}": "imagemin-lint-staged"
}
More about imagemin-lint-staged
imagemin-lint-staged is a CLI tool designed for lint-staged usage with sensible defaults.

See more on this blog post for benefits of this approach.

Typecheck your staged files with flow
Click to expand
{
"\*.{js,jsx}": "flow focus-check"
}
Integrate with Next.js
Click to expand
// .lintstagedrc.js
// See https://nextjs.org/docs/basic-features/eslint#lint-staged for details

const path = require('path')

const buildEslintCommand = (filenames) =>
`next lint --fix --file ${filenames.map((f) => path.relative(process.cwd(), f)).join(' --file ')}`

module.exports = {
'\*.{js,jsx,ts,tsx}': [buildEslintCommand],
}
Frequently Asked Questions
The output of commit hook looks weird (no colors, duplicate lines, verbose output on Windows, …)
Click to expand
Git 2.36.0 introduced a change to hooks where they were no longer run in the original TTY. This was fixed in 2.37.0:

https://raw.githubusercontent.com/git/git/master/Documentation/RelNotes/2.37.0.txt

In Git 2.36 we revamped the way how hooks are invoked. One change that is end-user visible is that the output of a hook is no longer directly connected to the standard output of "git" that spawns the hook, which was noticed post release. This is getting corrected. (merge a082345372 ab/hooks-regression-fix later to maint).
If updating Git doesn't help, you can try to manually redirect the output in your Git hook; for example:

# .husky/pre-commit

if sh -c ": >/dev/tty" >/dev/null 2>/dev/null; then exec >/dev/tty 2>&1; fi

npx lint-staged
Source: typicode/husky#968 (comment)

Can I use lint-staged via node?
Click to expand
Yes!

import lintStaged from 'lint-staged'

try {
const success = await lintStaged()
console.log(success ? 'Linting was successful!' : 'Linting failed!')
} catch (e) {
// Failed to load configuration
console.error(e)
}
Parameters to lintStaged are equivalent to their CLI counterparts:

const success = await lintStaged({
allowEmpty: false,
concurrent: true,
configPath: './path/to/configuration/file',
cwd: process.cwd(),
debug: false,
maxArgLength: null,
quiet: false,
relative: false,
stash: true,
verbose: false,
})
You can also pass config directly with config option:

const success = await lintStaged({
allowEmpty: false,
concurrent: true,
config: { '\*.js': 'eslint --fix' },
cwd: process.cwd(),
debug: false,
maxArgLength: null,
quiet: false,
relative: false,
stash: true,
verbose: false,
})
The maxArgLength option configures chunking of tasks into multiple parts that are run one after the other. This is to avoid issues on Windows platforms where the maximum length of the command line argument string is limited to 8192 characters. Lint-staged might generate a very long argument string when there are many staged files. This option is set automatically from the cli, but not via the Node.js API by default.

Using with JetBrains IDEs (WebStorm, PyCharm, IntelliJ IDEA, RubyMine, etc.)
Click to expand
How to use lint-staged in a multi-package monorepo?
Click to expand
Install lint-staged on the monorepo root level, and add separate configuration files in each package. When running, lint-staged will always use the configuration closest to a staged file, so having separate configuration files makes sure tasks do not "leak" into other packages.

For example, in a monorepo with packages/frontend/.lintstagedrc.json and packages/backend/.lintstagedrc.json, a staged file inside packages/frontend/ will only match that configuration, and not the one in packages/backend/.

Note: lint-staged discovers the closest configuration to each staged file, even if that configuration doesn't include any matching globs. Given these example configurations:

// ./.lintstagedrc.json
{ "_.md": "prettier --write" }
// ./packages/frontend/.lintstagedrc.json
{ "_.js": "eslint --fix" }
When committing ./packages/frontend/README.md, it will not run prettier, because the configuration in the frontend/ directory is closer to the file and doesn't include it. You should treat all lint-staged configuration files as isolated and separated from each other. You can always use JS files to "extend" configurations, for example:

import baseConfig from '../.lintstagedrc.js'

export default {
...baseConfig,
'\*.js': 'eslint --fix',
}
To support backwards-compatibility, monorepo features require multiple lint-staged configuration files present in the git repo. If you still want to run lint-staged in only one of the packages in a monorepo, you can use the --cwd option (for example, lint-staged --cwd packages/frontend).

Can I lint files outside of the current project folder?
Click to expand
tl;dr: Yes, but the pattern should start with ../.

By default, lint-staged executes tasks only on the files present inside the project folder(where lint-staged is installed and run from). So this question is relevant only when the project folder is a child folder inside the git repo. In certain project setups, it might be desirable to bypass this restriction. See #425, #487 for more context.

lint-staged provides an escape hatch for the same(>= v7.3.0). For patterns that start with ../, all the staged files are allowed to match against the pattern. Note that patterns like _.js, \*\*/_.js will still only match the project files and not any of the files in parent or sibling directories.

Example repo: sudo-suhas/lint-staged-django-react-demo.

Can I run lint-staged in CI, or when there are no staged files?
Click to expand
Lint-staged will by default run against files staged in git, and should be run during the git pre-commit hook, for example. It's also possible to override this default behaviour and run against files in a specific diff, for example all changed files between two different branches. If you want to run lint-staged in the CI, maybe you can set it up to compare the branch in a Pull Request/Merge Request to the target branch.

Try out the git diff command until you are satisfied with the result, for example:

git diff --diff-filter=ACMR --name-only main...my-branch
This will print a list of added, changed, modified, and renamed files between main and my-branch.

You can then run lint-staged against the same files with:

npx lint-staged --diff="main...my-branch"
Note that --diff="main..my-branch" will have files that changed on main and are not yet caught up on my-branch be detected as changed files.

To see just that changes on the current branch, as compared to main you may wish to use:

npx lint-staged --diff="$(git merge-base main HEAD)"
Can I use lint-staged with ng lint
Click to expand
You should not use ng lint through lint-staged, because it's designed to lint an entire project. Instead, you can add ng lint to your git pre-commit hook the same way as you would run lint-staged.

See issue !951 for more details and possible workarounds.

How can I ignore files from .eslintignore?
Click to expand
ESLint throws out warning File ignored because of a matching ignore pattern. Use "--no-ignore" to override warnings that breaks the linting process ( if you used --max-warnings=0 which is recommended ).

ESLint < 7
Click to expand
Based on the discussion from this issue, it was decided that using the outlined scriptis the best route to fix this.

So you can setup a .lintstagedrc.js config file to do this:

import { CLIEngine } from 'eslint'

export default {
'\*.js': (files) => {
const cli = new CLIEngine({})
return 'eslint --max-warnings=0 ' + files.filter((file) => !cli.isPathIgnored(file)).join(' ')
},
}
ESLint >= 7
Click to expand
In versions of ESLint > 7, isPathIgnored is an async function and now returns a promise. The code below can be used to reinstate the above functionality.

Since 10.5.3, any errors due to a bad ESLint config will come through to the console.

import { ESLint } from 'eslint'

const removeIgnoredFiles = async (files) => {
const eslint = new ESLint()
const isIgnored = await Promise.all(
files.map((file) => {
return eslint.isPathIgnored(file)
})
)
const filteredFiles = files.filter((\_, i) => !isIgnored[i])
return filteredFiles.join(' ')
}

export default {
'\*_/_.{ts,tsx,js,jsx}': async (files) => {
const filesToLint = await removeIgnoredFiles(files)
return [`eslint --max-warnings=0 ${filesToLint}`]
},
}
ESLint >= 8.51.0 && Flat ESLint config
Click to expand
ESLint v8.51.0 introduced --no-warn-ignored CLI flag. It suppresses the warning File ignored because of a matching ignore pattern. Use "--no-ignore" to override warning, so manually ignoring files via eslint.isPathIgnored is no longer necessary.

{
"\*.js": "eslint --max-warnings=0 --no-warn-ignored"
}
NOTE: --no-warn-ignored flag is only available when Flat ESLint config is used.

How can I resolve TypeScript (tsc) ignoring tsconfig.json when lint-staged runs via Husky hooks?
Click to expand
When running lint-staged via Husky hooks, TypeScript may ignore tsconfig.json, leading to errors like:

TS17004: Cannot use JSX unless the '--jsx' flag is provided. TS1056: Accessors are only available when targeting ECMAScript 5 and higher.

See issue #825 for more details.

Root Cause
lint-staged automatically passes matched staged files as arguments to commands.
Certain input files can cause TypeScript to ignore tsconfig.json. For more details, see this TypeScript issue: Allow tsconfig.json when input files are specified.
Workaround: Use a function signature for the tsc command
As suggested by @antoinerousseau in #825 (comment), using a function prevents lint-staged from appending file arguments:

Before:

// package.json

"lint-staged": {
"\*.{ts,tsx}":[
"tsc --noEmit",
"prettier --write"
]
}
After:

// lint-staged.config.js
module.exports = {
'\*.{ts,tsx}': [() => 'tsc --noEmit', 'prettier --write'],
}

Get started
Install

npm

pnpm

yarn

bun
shell
npm install --save-dev husky
husky init (recommended)
The init command simplifies setting up husky in a project. It creates a pre-commit script in .husky/ and updates the prepare script in package.json. Modifications can be made later to suit your workflow.

npm

pnpm

yarn

bun
shell
npx husky init
Try it
Congratulations! You've successfully set up your first Git hook with just one command 🎉. Let's test it:

shell
git commit -m "Keep calm and commit"

# test script will run every time you commit

A few words...
Scripting
While most of the time, you'll just run a few npm run or npx commands in your hooks, you can also script them using POSIX shell for custom workflows.

For example, here's how you can lint your staged files on each commit with only two lines of shell code and no external dependency:

shell

# .husky/pre-commit

prettier $(git diff --cached --name-only --diff-filter=ACMR | sed 's| |\\ |g') --write --ignore-unknown
git update-index --again
This is a basic but working example, check lint-staged if you need more.

Disabling hooks
Husky doesn't force Git hooks. It can be globally disabled (HUSKY=0) or be opt-in if wanted. See the How To section for manual setup and more information.

How To
Adding a New Hook
Adding a hook is as simple as creating a file. This can be accomplished using your favorite editor, a script or a basic echo command. For example, on Linux/macOS:

shell
echo "npm test" > .husky/pre-commit
Startup files
Husky allows you to execute local commands before running hooks. It reads commands from these files:

$XDG_CONFIG_HOME/husky/init.sh
~/.config/husky/init.sh
~/.huskyrc (deprecated)
On Windows: C:\Users\yourusername\.config\husky\init.sh

Skipping Git Hooks
For a Single Command
Most Git commands include a -n/--no-verify option to skip hooks:

sh
git commit -m "..." -n # Skips Git hooks
For commands without this flag, disable hooks temporarily with HUSKY=0:

shell
HUSKY=0 git ... # Temporarily disables all Git hooks
git ... # Hooks will run again
For multiple commands
To disable hooks for an extended period (e.g., during rebase/merge):

shell
export HUSKY=0 # Disables all Git hooks
git ...
git ...
unset HUSKY # Re-enables hooks
For a GUI or Globally
To disable Git hooks in a GUI client or globally, modify the husky config:

sh

# ~/.config/husky/init.sh

export HUSKY=0 # Husky won't install and won't run hooks on your machine
CI server and Docker
To avoid installing Git Hooks on CI servers or in Docker, use HUSKY=0. For instance, in GitHub Actions:

yml

# https://docs.github.com/en/actions/learn-github-actions/variables

env:
HUSKY: 0
If installing only dependencies (not devDependencies), the "prepare": "husky" script may fail because Husky won't be installed.

You have multiple solutions.

Modify the prepare script to never fail:

json
// package.json
"prepare": "husky || true"
You'll still get a command not found error message in your output which may be confusing. To make it silent, create .husky/install.mjs:

js
// Skip Husky install in production and CI
if (process.env.NODE_ENV === 'production' || process.env.CI === 'true') {
process.exit(0)
}
const husky = (await import('husky')).default
console.log(husky())
Then, use it in prepare:

json
"prepare": "node .husky/install.mjs"
Testing Hooks Without Committing
To test a hook, add exit 1 to the hook script to abort the Git command:

shell

# .husky/pre-commit

# Your WIP script

# ...

exit 1
shell
git commit -m "testing pre-commit code"

# A commit will not be created

Project Not in Git Root Directory
Husky doesn't install in parent directories (../) for security reasons. However, you can change the directory in the prepare script.

Consider this project structure:

.
├── .git/
├── backend/ # No package.json
└── frontend/ # Package.json with husky
Set your prepare script like this:

json
"prepare": "cd .. && husky frontend/.husky"
In your hook script, change the directory back to the relevant subdirectory:

shell

# frontend/.husky/pre-commit

cd frontend
npm test
Non-shell hooks
In order to run scripts that require the use of a scripting language, use the following pattern for each applicable hook:

(Example using hook pre-commit and NodeJS)

Create an entrypoint for the hook:
shell
.husky/pre-commit
In the file add the following
shell
node .husky/pre-commit.js
in .husky/pre-commit.js
javascript
// Your NodeJS code
// ...
Bash
Hook scripts need to be POSIX compliant to ensure best compatibility as not everyone has bash (e.g. Windows users).

That being said, if your team doesn't use Windows, you can use Bash this way:

shell

# .husky/pre-commit

bash << EOF

# Put your bash script inside

# ...

EOF
Node Version Managers and GUIs
If you're using Git hooks in GUIs with Node installed via a version manager (like nvm, n, fnm, asdf, volta, etc...), you might face a command not found error due to PATH environment variable issues.

Understanding PATH and Version Managers
PATH is an environment variable containing a list of directories. Your shell searches these directories for commands. If it doesn't find a command, you get a command not found message.

Run echo $PATH in a shell to view its contents.

Version managers work by:

Adding initialization code to your shell startup file (.zshrc, .bashrc, etc.), which runs each time you open a terminal.
Downloading Node versions to a directory in your home folder.
For example, if you have two Node versions:

shell
~/version-manager/Node-X/node
~/version-manager/Node-Y/node
Opening a terminal initializes the version manager, which picks a version (say Node-Y) and prepends its path to PATH:

shell
echo $PATH

# Output

~/version-manager/Node-Y/:...
Now, node refers to Node-Y. Switching to Node-X changes PATH accordingly:

shell
echo $PATH

# Output

~/version-manager/Node-X/:...
The issue arises because GUIs, launched outside a terminal, don't initialize the version manager, leaving PATH without the Node install path. Thus, Git hooks from GUIs often fail.

Solution
Husky sources ~/.config/husky/init.sh before each Git hook. Copy your version manager initialization code here to ensure it runs in GUIs.

Example with nvm:

shell

# ~/.config/husky/init.sh

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
Alternatively, if your shell startup file is fast and lightweight, source it directly:

shell

# ~/.config/husky/init.sh

. ~/.zshrc
Manual setup
Git needs to be configured and husky needs to setup files in .husky/.

Run the husky command once in your repo. Ideally, include it in the prepare script in package.json for automatic execution after each install (recommended).

npm

pnpm

yarn

bun
json
{
"scripts": {
"prepare": "husky"
}
}
Run prepare once:

npm

pnpm

yarn

bun
sh
npm run prepare
Create a pre-commit file in the .husky/ directory:

npm

pnpm

yarn

bun
shell

# .husky/pre-commit

npm test

Troubleshoot
Command not found
See How To for solutions.

Hooks not running
Verify the file name is correct. For example, precommit or pre-commit.sh are invalid names. Refer to the Git hooks documentation for valid names.
Run git config core.hooksPath and ensure it points to .husky/\_ (or your custom hooks directory).
Confirm your Git version is above 2.9.
.git/hooks/ Not Working After Uninstall
If hooks in .git/hooks/ don't work post-uninstalling husky, execute git config --unset core.hooksPath.

Yarn on Windows
Git hooks might fail with Yarn on Windows using Git Bash (stdin is not a tty). For Windows users, implement this workaround:

Create .husky/common.sh:
shell
command_exists () {
command -v "$1" >/dev/null 2>&1
}

# Workaround for Windows 10, Git Bash, and Yarn

if command_exists winpty && test -t 1; then
exec < /dev/tty
fi
Source it where Yarn commands are run:
shell

# .husky/pre-commit

. .husky/common.sh

yarn ...

Migrate from v4
If you were calling package.json scripts using npm or yarn, you can simply copy your commands from your config file to the corresponding hook:

Husky v4

json
// package.json
{
"hooks": {
"pre-commit": "npm test && npm run foo"
}
}
Husky v9

shell

# .husky/pre-commit

# Note that you can now have commands on multiple lines

npm test // [!code hl]
npm run foo // [!code hl]
If you were calling locally installed binaries, you need to run them via your package manager now:

.huskyrc.json (v4)

.husky/pre-commit (v9)
js
{
"hooks": {
"pre-commit": "jest"
}
}
HUSKY_GIT_PARAMS environment variable is replaced now by native params $1, $2, etc.

.huskyrc.json (v4)

.husky/commit-msg (v9)
js
{
"hooks": {
"commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
}
}
Other environment variables changes:

HUSKY_SKIP_HOOKS is replaced by HUSKY.
HUSKY_SKIP_INSTALL is replaced by HUSKY.
HUSKY_GIT_PARAMS is removed. Instead Git parameters should be used directly in scripts (e.g. $1).
