Title: Troubleshoot | Husky

URL Source: https://typicode.github.io/husky/troubleshoot.html

Markdown Content:
Command not found [​](https://typicode.github.io/husky/troubleshoot.html#command-not-found)

---

See [How To](https://typicode.github.io/husky/how-to.html) for solutions.

## Hooks not running [​](https://typicode.github.io/husky/troubleshoot.html#hooks-not-running)

1.  Verify the file name is correct. For example, `precommit` or `pre-commit.sh` are invalid names. Refer to the Git hooks [documentation](https://git-scm.com/docs/githooks) for valid names.
2.  Run `git config core.hooksPath` and ensure it points to `.husky/_` (or your custom hooks directory).
3.  Confirm your Git version is above `2.9`.

## `.git/hooks/` Not Working After Uninstall [​](https://typicode.github.io/husky/troubleshoot.html#git-hooks-not-working-after-uninstall)

If hooks in `.git/hooks/` don't work post-uninstalling `husky`, execute `git config --unset core.hooksPath`.

## Yarn on Windows [​](https://typicode.github.io/husky/troubleshoot.html#yarn-on-windows)

Git hooks might fail with Yarn on Windows using Git Bash (`stdin is not a tty`). For Windows users, implement this workaround:

1.  Create `.husky/common.sh`:

shell

```
command_exists () {
  command -v "$1" >/dev/null 2>&1
}

# Workaround for Windows 10, Git Bash, and Yarn
if command_exists winpty && test -t 1; then
  exec < /dev/tty
fi
```

1.  Source it where Yarn commands are run:

shell

```
# .husky/pre-commit
. .husky/common.sh

yarn ...
```
