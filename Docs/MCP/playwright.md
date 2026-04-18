Title: @playwright/mcp

URL Source: https://www.npmjs.com/package/@playwright/mcp

Published Time: Sat, 18 Apr 2026 19:03:19 GMT

Markdown Content:

# @playwright/mcp - npm

skip to:[content](https://www.npmjs.com/package/@playwright/mcp#main)[package search](https://www.npmjs.com/package/@playwright/mcp#search)[sign in](https://www.npmjs.com/package/@playwright/mcp#signin)

- [Pro](https://www.npmjs.com/products/pro)
- [Teams](https://www.npmjs.com/products/teams)
- [Pricing](https://www.npmjs.com/products)
- [Documentation](https://docs.npmjs.com/)

npm

[](https://www.npmjs.com/)

Search

[Sign Up](https://www.npmjs.com/signup)[Sign In](https://www.npmjs.com/login)

# @playwright/mcp

![Image 1: TypeScript icon, indicating that this package has built-in type declarations](https://static-production.npmjs.com/4a2a680dfcadf231172b78b1d3beb975.svg)

0.0.70•Public•Published 18 days ago

- [Readme](https://www.npmjs.com/package/@playwright/mcp?activeTab=readme)
- [Code Beta](https://www.npmjs.com/package/@playwright/mcp?activeTab=code)
- [2 Dependencies](https://www.npmjs.com/package/@playwright/mcp?activeTab=dependencies)
- [72 Dependents](https://www.npmjs.com/package/@playwright/mcp?activeTab=dependents)
- [308 Versions](https://www.npmjs.com/package/@playwright/mcp?activeTab=versions)

## Playwright MCP

[](https://www.npmjs.com/package/@playwright/mcp#playwright-mcp)

A Model Context Protocol (MCP) server that provides browser automation capabilities using [Playwright](https://playwright.dev/). This server enables LLMs to interact with web pages through structured accessibility snapshots, bypassing the need for screenshots or visually-tuned models.

### Playwright MCP vs Playwright CLI

[](https://www.npmjs.com/package/@playwright/mcp#playwright-mcp-vs-playwright-cli)

This package provides MCP interface into Playwright. If you are using a **coding agent**, you might benefit from using the [CLI+SKILLS](https://github.com/microsoft/playwright-cli) instead.

- **CLI**: Modern **coding agents** increasingly favor CLI–based workflows exposed as SKILLs over MCP because CLI invocations are more token-efficient: they avoid loading large tool schemas and verbose accessibility trees into the model context, allowing agents to act through concise, purpose-built commands. This makes CLI + SKILLs better suited for high-throughput coding agents that must balance browser automation with large codebases, tests, and reasoning within limited context windows.

**Learn more about [Playwright CLI with SKILLS](https://github.com/microsoft/playwright-cli)**.

- **MCP**: MCP remains relevant for specialized agentic loops that benefit from persistent state, rich introspection, and iterative reasoning over page structure, such as exploratory automation, self-healing tests, or long-running autonomous workflows where maintaining continuous browser context outweighs token cost concerns.

### Key Features

[](https://www.npmjs.com/package/@playwright/mcp#key-features)

- **Fast and lightweight**. Uses Playwright's accessibility tree, not pixel-based input.
- **LLM-friendly**. No vision models needed, operates purely on structured data.
- **Deterministic tool application**. Avoids ambiguity common with screenshot-based approaches.

### Requirements

[](https://www.npmjs.com/package/@playwright/mcp#requirements)

- Node.js 18 or newer
- VS Code, Cursor, Windsurf, Claude Desktop, Goose or any other MCP client

### Getting started

[](https://www.npmjs.com/package/@playwright/mcp#getting-started)

First, install the Playwright MCP server with your client.

**Standard config** works in most of the tools:

undefinedjs
{
"mcpServers": {
"playwright": {
"command": "npx",
"args": [
"@playwright/mcp@latest"
]
}
}
}
undefined

[![Image 2: Install in VS Code](https://camo.githubusercontent.com/7138ed6ca5e3744d99ac823b75d72f8fbe796108ffd932dc9bbf292964fe7bd3/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f56535f436f64652d56535f436f64653f7374796c653d666c61742d737175617265266c6162656c3d496e7374616c6c25323053657276657226636f6c6f723d303039384646)](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522playwright%2522%252C%2522command%2522%253A%2522npx%2522%252C%2522args%2522%253A%255B%2522%2540playwright%252Fmcp%2540latest%2522%255D%257D)[![Image 3: Install in VS Code Insiders](https://camo.githubusercontent.com/2cff36994ff45270ca5cc0484f2a5dab5921a4c016730de86e4c6808a735af89/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f56535f436f64655f496e7369646572732d56535f436f64655f496e7369646572733f7374796c653d666c61742d737175617265266c6162656c3d496e7374616c6c25323053657276657226636f6c6f723d323462666135)](https://insiders.vscode.dev/redirect?url=vscode-insiders%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522playwright%2522%252C%2522command%2522%253A%2522npx%2522%252C%2522args%2522%253A%255B%2522%2540playwright%252Fmcp%2540latest%2522%255D%257D)

Amp
Add via the Amp VS Code extension settings screen or by updating your settings.json file:

undefinedjson
"amp.mcpServers": {
"playwright": {
"command": "npx",
"args": [
"@playwright/mcp@latest"
]
}
}
undefined

**Amp CLI Setup:**

Add via the `amp mcp add`command below

undefinedshell
amp mcp add playwright -- npx @playwright/mcp@latest
undefined

Antigravity
Add via the Antigravity settings or by updating your configuration file:

undefinedjson
{
"mcpServers": {
"playwright": {
"command": "npx",
"args": [
"@playwright/mcp@latest"
]
}
}
}
undefined

Claude Code
Use the Claude Code CLI to add the Playwright MCP server:

undefinedshell
claude mcp add playwright npx @playwright/mcp@latest
undefined

Claude Desktop
Follow the MCP install [guide](https://modelcontextprotocol.io/quickstart/user), use the standard config above.

Cline
Follow the instruction in the section [Configuring MCP Servers](https://docs.cline.bot/mcp/configuring-mcp-servers)

**Example: Local Setup**

Add the following to your [`cline_mcp_settings.json`](https://docs.cline.bot/mcp/configuring-mcp-servers#editing-mcp-settings-files) file:

undefinedjson
{
"mcpServers": {
"playwright": {
"type": "stdio",
"command": "npx",
"timeout": 30,
"args": [
"-y",
"@playwright/mcp@latest"
],
"disabled": false
}
}
}
undefined

Codex
Use the Codex CLI to add the Playwright MCP server:

undefinedshell
codex mcp add playwright npx "@playwright/mcp@latest"
undefined

Alternatively, create or edit the configuration file `~/.codex/config.toml` and add:

undefinedtoml
[mcp_servers.playwright]
command = "npx"
args = ["@playwright/mcp@latest"]
undefined

For more information, see the [Codex MCP documentation](https://github.com/openai/codex/blob/main/codex-rs/config.md#mcp_servers).

Copilot
Use the Copilot CLI to interactively add the Playwright MCP server:

undefinedshell
/mcp add
undefined

Alternatively, create or edit the configuration file `~/.copilot/mcp-config.json` and add:

undefinedjson
{
"mcpServers": {
"playwright": {
"type": "local",
"command": "npx",
"tools": [
"*"
],
"args": [
"@playwright/mcp@latest"
]
}
}
}
undefined

For more information, see the [Copilot CLI documentation](https://docs.github.com/en/copilot/concepts/agents/about-copilot-cli).

Cursor

#### Click the button to install:

[](https://www.npmjs.com/package/@playwright/mcp#click-the-button-to-install)

[![Image 4: Install in Cursor](https://camo.githubusercontent.com/ae8711b98f6b99feccfa4c47b29a82aaee09b04829d6d29e6ed410468a4e8296/68747470733a2f2f637572736f722e636f6d2f646565706c696e6b2f6d63702d696e7374616c6c2d6461726b2e737667)](https://cursor.com/en/install-mcp?name=Playwright&config=eyJjb21tYW5kIjoibnB4IEBwbGF5d3JpZ2h0L21jcEBsYXRlc3QifQ%3D%3D)

#### Or install manually:

[](https://www.npmjs.com/package/@playwright/mcp#or-install-manually)

Go to `Cursor Settings` ->`MCP` ->`Add new MCP Server`. Name to your liking, use `command` type with the command `npx @playwright/mcp@latest`. You can also verify config or add command like arguments via clicking `Edit`.

Factory
Use the Factory CLI to add the Playwright MCP server:

undefinedshell
droid mcp add playwright "npx @playwright/mcp@latest"
undefined

Alternatively, type `/mcp` within Factory droid to open an interactive UI for managing MCP servers.

For more information, see the [Factory MCP documentation](https://docs.factory.ai/cli/configuration/mcp).

Gemini CLI
Follow the MCP install [guide](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md#configure-the-mcp-server-in-settingsjson), use the standard config above.

Goose

#### Click the button to install:

[](https://www.npmjs.com/package/@playwright/mcp#click-the-button-to-install-1)

[![Image 5: Install in Goose](https://camo.githubusercontent.com/5c636ae7ab3104ad703d3719193d8fcbea8ea4d6eefe8502ef543f0f419faca1/68747470733a2f2f626c6f636b2e6769746875622e696f2f676f6f73652f696d672f657874656e73696f6e2d696e7374616c6c2d6461726b2e737667)](https://block.github.io/goose/extension?cmd=npx&arg=%40playwright%2Fmcp%40latest&id=playwright&name=Playwright&description=Interact%20with%20web%20pages%20through%20structured%20accessibility%20snapshots%20using%20Playwright)

#### Or install manually:

[](https://www.npmjs.com/package/@playwright/mcp#or-install-manually-1)

Go to `Advanced settings` ->`Extensions` ->`Add custom extension`. Name to your liking, use type `STDIO`, and set the `command` to `npx @playwright/mcp`. Click "Add Extension".

Kiro
[![Image 6: Add to Kiro](https://camo.githubusercontent.com/753d895bdb8ed9b8ce71bf0cf3c42cc9a08d2a3185dd7a87280bd4686127b8b0/68747470733a2f2f6b69726f2e6465762f696d616765732f6164642d746f2d6b69726f2e737667)](https://kiro.dev/launch/mcp/add?name=playwright&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22%40playwright%2Fmcp%40latest%22%5D%7D)

Follow the MCP Servers [documentation](https://kiro.dev/docs/mcp/). For example in `.kiro/settings/mcp.json`:

undefinedjson
{
"mcpServers": {
"playwright": {
"command": "npx",
"args": [
"@playwright/mcp@latest"
]
}
}
}
undefined

LM Studio

#### Click the button to install:

[](https://www.npmjs.com/package/@playwright/mcp#click-the-button-to-install-2)

[![Image 7: Add MCP Server playwright to LM Studio](https://camo.githubusercontent.com/dcb8d926baace5813a114444830988eccab0ea98f1c7dd176dbf3e6d39fb0080/68747470733a2f2f66696c65732e6c6d73747564696f2e61692f646565706c696e6b2f6d63702d696e7374616c6c2d6c696768742e737667)](https://lmstudio.ai/install-mcp?name=playwright&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyJAcGxheXdyaWdodC9tY3BAbGF0ZXN0Il19)

#### Or install manually:

[](https://www.npmjs.com/package/@playwright/mcp#or-install-manually-2)

Go to `Program` in the right sidebar ->`Install` ->`Edit mcp.json`. Use the standard config above.

opencode
Follow the MCP Servers [documentation](https://opencode.ai/docs/mcp-servers/). For example in `~/.config/opencode/opencode.json`:

undefinedjson
{
"$schema": "https://opencode.ai/config.json",
"mcp": {
"playwright": {
"type": "local",
"command": [
"npx",
"@playwright/mcp@latest"
],
"enabled": true
}
}
}

undefined

Qodo Gen
Open [Qodo Gen](https://docs.qodo.ai/qodo-documentation/qodo-gen) chat panel in VSCode or IntelliJ → Connect more tools → + Add new MCP → Paste the standard config above.

Click `Save`.

VS Code

#### Click the button to install:

[](https://www.npmjs.com/package/@playwright/mcp#click-the-button-to-install-3)

[![Image 8: Install in VS Code](https://camo.githubusercontent.com/7138ed6ca5e3744d99ac823b75d72f8fbe796108ffd932dc9bbf292964fe7bd3/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f56535f436f64652d56535f436f64653f7374796c653d666c61742d737175617265266c6162656c3d496e7374616c6c25323053657276657226636f6c6f723d303039384646)](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522playwright%2522%252C%2522command%2522%253A%2522npx%2522%252C%2522args%2522%253A%255B%2522%2540playwright%252Fmcp%2540latest%2522%255D%257D)[![Image 9: Install in VS Code Insiders](https://camo.githubusercontent.com/2cff36994ff45270ca5cc0484f2a5dab5921a4c016730de86e4c6808a735af89/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f56535f436f64655f496e7369646572732d56535f436f64655f496e7369646572733f7374796c653d666c61742d737175617265266c6162656c3d496e7374616c6c25323053657276657226636f6c6f723d323462666135)](https://insiders.vscode.dev/redirect?url=vscode-insiders%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522playwright%2522%252C%2522command%2522%253A%2522npx%2522%252C%2522args%2522%253A%255B%2522%2540playwright%252Fmcp%2540latest%2522%255D%257D)

#### Or install manually:

[](https://www.npmjs.com/package/@playwright/mcp#or-install-manually-3)

Follow the MCP install [guide](https://code.visualstudio.com/docs/copilot/chat/mcp-servers#_add-an-mcp-server), use the standard config above. You can also install the Playwright MCP server using the VS Code CLI:

undefinedshell

# For VS Code

code --add-mcp '{"name":"playwright","command":"npx","args":["@playwright/mcp@latest"]}'
undefined

After installation, the Playwright MCP server will be available for use with your GitHub Copilot agent in VS Code.

Warp
Go to `Settings` ->`AI` ->`Manage MCP Servers` ->`+ Add` to [add an MCP Server](https://docs.warp.dev/knowledge-and-collaboration/mcp#adding-an-mcp-server). Use the standard config above.

Alternatively, use the slash command `/add-mcp` in the Warp prompt and paste the standard config from above:

undefinedjs
{
"mcpServers": {
"playwright": {
"command": "npx",
"args": [
"@playwright/mcp@latest"
]
}
}
}
undefined

Windsurf
Follow Windsurf MCP [documentation](https://docs.windsurf.com/windsurf/cascade/mcp). Use the standard config above.

### Configuration

[](https://www.npmjs.com/package/@playwright/mcp#configuration)

Playwright MCP server supports following arguments. They can be provided in the JSON configuration above, as a part of the `"args"` list:

| Option                               | Description                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| --allowed-hosts <hosts...>           | comma-separated list of hosts this server is allowed to serve from. Defaults to the host the server is bound to. Pass '\*' to disable the host check. _env_`PLAYWRIGHT_MCP_ALLOWED_HOSTS`                                                                                                                                          |
| --allowed-origins                    | semicolon-separated list of TRUSTED origins to allow the browser to request. Default is to allow all. Important: _does not_ serve as a security boundary and _does not_ affect redirects. _env_`PLAYWRIGHT_MCP_ALLOWED_ORIGINS`                                                                                                    |
| --allow-unrestricted-file-access     | allow access to files outside of the workspace roots. Also allows unrestricted access to file:// URLs. By default access to file system is restricted to workspace root directories (or cwd if no roots are configured) only, and navigation to file:// URLs is blocked. _env_`PLAYWRIGHT_MCP_ALLOW_UNRESTRICTED_FILE_ACCESS`      |
| --blocked-origins                    | semicolon-separated list of origins to block the browser from requesting. Blocklist is evaluated before allowlist. If used without the allowlist, requests not matching the blocklist are still allowed. Important: _does not_ serve as a security boundary and _does not_ affect redirects. _env_`PLAYWRIGHT_MCP_BLOCKED_ORIGINS` |
| --block-service-workers              | block service workers _env_`PLAYWRIGHT_MCP_BLOCK_SERVICE_WORKERS`                                                                                                                                                                                                                                                                  |
| --browser                            | browser or chrome channel to use, possible values: chrome, firefox, webkit, msedge. _env_`PLAYWRIGHT_MCP_BROWSER`                                                                                                                                                                                                                  |
| --caps                               | comma-separated list of additional capabilities to enable, possible values: vision, pdf, devtools. _env_`PLAYWRIGHT_MCP_CAPS`                                                                                                                                                                                                      |
| --cdp-endpoint                       | CDP endpoint to connect to. _env_`PLAYWRIGHT_MCP_CDP_ENDPOINT`                                                                                                                                                                                                                                                                     |
| --cdp-header <headers...>            | CDP headers to send with the connect request, multiple can be specified. _env_`PLAYWRIGHT_MCP_CDP_HEADER`                                                                                                                                                                                                                          |
| --cdp-timeout                        | timeout in milliseconds for connecting to CDP endpoint, defaults to 30000ms _env_`PLAYWRIGHT_MCP_CDP_TIMEOUT`                                                                                                                                                                                                                      |
| --codegen                            | specify the language to use for code generation, possible values: "typescript", "none". Default is "typescript". _env_`PLAYWRIGHT_MCP_CODEGEN`                                                                                                                                                                                     |
| --config                             | path to the configuration file. _env_`PLAYWRIGHT_MCP_CONFIG`                                                                                                                                                                                                                                                                       |
| --console-level                      | level of console messages to return: "error", "warning", "info", "debug". Each level includes the messages of more severe levels. _env_`PLAYWRIGHT_MCP_CONSOLE_LEVEL`                                                                                                                                                              |
| --device                             | device to emulate, for example: "iPhone 15" _env_`PLAYWRIGHT_MCP_DEVICE`                                                                                                                                                                                                                                                           |
| --executable-path                    | path to the browser executable. _env_`PLAYWRIGHT_MCP_EXECUTABLE_PATH`                                                                                                                                                                                                                                                              |
| --extension                          | Connect to a running browser instance (Edge/Chrome only). Requires the "Playwright MCP Bridge" browser extension to be installed. _env_`PLAYWRIGHT_MCP_EXTENSION`                                                                                                                                                                  |
| --endpoint                           | Bound browser endpoint to connect to. _env_`PLAYWRIGHT_MCP_ENDPOINT`                                                                                                                                                                                                                                                               |
| --grant-permissions <permissions...> | List of permissions to grant to the browser context, for example "geolocation", "clipboard-read", "clipboard-write". _env_`PLAYWRIGHT_MCP_GRANT_PERMISSIONS`                                                                                                                                                                       |
| --headless                           | run browser in headless mode, headed by default _env_`PLAYWRIGHT_MCP_HEADLESS`                                                                                                                                                                                                                                                     |
| --host                               | host to bind server to. Default is localhost. Use 0.0.0.0 to bind to all interfaces. _env_`PLAYWRIGHT_MCP_HOST`                                                                                                                                                                                                                    |
| --ignore-https-errors                | ignore https errors _env_`PLAYWRIGHT_MCP_IGNORE_HTTPS_ERRORS`                                                                                                                                                                                                                                                                      |
| --init-page <path...>                | path to TypeScript file to evaluate on Playwright page object _env_`PLAYWRIGHT_MCP_INIT_PAGE`                                                                                                                                                                                                                                      |
| --init-script <path...>              | path to JavaScript file to add as an initialization script. The script will be evaluated in every page before any of the page's scripts. Can be specified multiple times. _env_`PLAYWRIGHT_MCP_INIT_SCRIPT`                                                                                                                        |
| --isolated                           | keep the browser profile in memory, do not save it to disk. _env_`PLAYWRIGHT_MCP_ISOLATED`                                                                                                                                                                                                                                         |
| --image-responses                    | whether to send image responses to the client. Can be "allow" or "omit", Defaults to "allow". _env_`PLAYWRIGHT_MCP_IMAGE_RESPONSES`                                                                                                                                                                                                |
| --no-sandbox                         | disable the sandbox for all process types that are normally sandboxed. _env_`PLAYWRIGHT_MCP_NO_SANDBOX`                                                                                                                                                                                                                            |
| --output-dir                         | path to the directory for output files. _env_`PLAYWRIGHT_MCP_OUTPUT_DIR`                                                                                                                                                                                                                                                           |
| --output-mode                        | whether to save snapshots, console messages, network logs to a file or to the standard output. Can be "file" or "stdout". Default is "stdout". _env_`PLAYWRIGHT_MCP_OUTPUT_MODE`                                                                                                                                                   |
| --port                               | port to listen on for SSE transport. _env_`PLAYWRIGHT_MCP_PORT`                                                                                                                                                                                                                                                                    |
| --proxy-bypass                       | comma-separated domains to bypass proxy, for example ".com,chromium.org,.domain.com" _env_`PLAYWRIGHT_MCP_PROXY_BYPASS`                                                                                                                                                                                                            |
| --proxy-server                       | specify proxy server, for example "[http://myproxy:3128](http://myproxy:3128/)" or "socks5://myproxy:8080" _env_`PLAYWRIGHT_MCP_PROXY_SERVER`                                                                                                                                                                                      |
| --sandbox                            | enable the sandbox for all process types that are normally not sandboxed. _env_`PLAYWRIGHT_MCP_SANDBOX`                                                                                                                                                                                                                            |
| --save-session                       | Whether to save the Playwright MCP session into the output directory. _env_`PLAYWRIGHT_MCP_SAVE_SESSION`                                                                                                                                                                                                                           |
| --secrets                            | path to a file containing secrets in the dotenv format _env_`PLAYWRIGHT_MCP_SECRETS`                                                                                                                                                                                                                                               |
| --shared-browser-context             | reuse the same browser context between all connected HTTP clients. _env_`PLAYWRIGHT_MCP_SHARED_BROWSER_CONTEXT`                                                                                                                                                                                                                    |
| --snapshot-mode                      | when taking snapshots for responses, specifies the mode to use. Can be "full" or "none". Default is "full". _env_`PLAYWRIGHT_MCP_SNAPSHOT_MODE`                                                                                                                                                                                    |
| --storage-state                      | path to the storage state file for isolated sessions. _env_`PLAYWRIGHT_MCP_STORAGE_STATE`                                                                                                                                                                                                                                          |
| --test-id-attribute                  | specify the attribute to use for test ids, defaults to "data-testid" _env_`PLAYWRIGHT_MCP_TEST_ID_ATTRIBUTE`                                                                                                                                                                                                                       |
| --timeout-action                     | specify action timeout in milliseconds, defaults to 5000ms _env_`PLAYWRIGHT_MCP_TIMEOUT_ACTION`                                                                                                                                                                                                                                    |
| --timeout-navigation                 | specify navigation timeout in milliseconds, defaults to 60000ms _env_`PLAYWRIGHT_MCP_TIMEOUT_NAVIGATION`                                                                                                                                                                                                                           |
| --user-agent                         | specify user agent string _env_`PLAYWRIGHT_MCP_USER_AGENT`                                                                                                                                                                                                                                                                         |
| --user-data-dir                      | path to the user data directory. If not specified, a temporary directory will be created. _env_`PLAYWRIGHT_MCP_USER_DATA_DIR`                                                                                                                                                                                                      |
| --viewport-size                      | specify browser viewport size in pixels, for example "1280x720" _env_`PLAYWRIGHT_MCP_VIEWPORT_SIZE`                                                                                                                                                                                                                                |

### User profile

[](https://www.npmjs.com/package/@playwright/mcp#user-profile)

You can run Playwright MCP with persistent profile like a regular browser (default), in isolated contexts for testing sessions, or connect to your existing browser using the browser extension.

**Persistent profile**

All the logged in information will be stored in the persistent profile, you can delete it between sessions if you'd like to clear the offline state. Persistent profile is located at the following locations and you can override it with the `--user-data-dir` argument.

undefinedshell

# Windows

%USERPROFILE%\AppData\Local\ms-playwright\mcp-{channel}-profile

# macOS

- ~/Library/Caches/ms-playwright/mcp-{channel}-profile

# Linux

- ~/.cache/ms-playwright/mcp-{channel}-profile
  undefined

**Isolated**

In the isolated mode, each session is started in the isolated profile. Every time you ask MCP to close the browser, the session is closed and all the storage state for this session is lost. You can provide initial storage state to the browser via the config's `contextOptions` or via the `--storage-state` argument. Learn more about the storage state [here](https://playwright.dev/docs/auth).

undefinedjs
{
"mcpServers": {
"playwright": {
"command": "npx",
"args": [
"@playwright/mcp@latest",
"--isolated",
"--storage-state={path/to/storage.json}"
]
}
}
}
undefined

**Browser Extension**

The Playwright MCP Chrome Extension allows you to connect to existing browser tabs and leverage your logged-in sessions and browser state. See [packages/extension/README.md](https://github.com/microsoft/playwright-mcp/blob/HEAD/packages/extension/README.md) for installation and setup instructions.

### Initial state

[](https://www.npmjs.com/package/@playwright/mcp#initial-state)

There are multiple ways to provide the initial state to the browser context or a page.

For the storage state, you can either:

- Start with a user data directory using the `--user-data-dir` argument. This will persist all browser data between the sessions.
- Start with a storage state file using the `--storage-state` argument. This will load cookies and local storage from the file into an isolated browser context.

For the page state, you can use:

- `--init-page` to point to a TypeScript file that will be evaluated on the Playwright page object. This allows you to run arbitrary code to set up the page.

undefinedts
// init-page.ts
export default async ({ page }) => {
await page.context().grantPermissions(['geolocation']);
await page.context().setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
await page.setViewportSize({ width: 1280, height: 720 });
};
undefined

- `--init-script` to point to a JavaScript file that will be added as an initialization script. The script will be evaluated in every page before any of the page's scripts. This is useful for overriding browser APIs or setting up the environment.

undefinedjs
// init-script.js
window.isPlaywrightMCP = true;
undefined

### Configuration file

[](https://www.npmjs.com/package/@playwright/mcp#configuration-file)

The Playwright MCP server can be configured using a JSON configuration file. You can specify the configuration file using the `--config` command line option:

undefinedshell
npx @playwright/mcp@latest --config path/to/config.json
undefined

Configuration file schema

undefinedts
{
/\*\*

- The browser to use.
  \*/
  browser?: {
  /\*\*
  - The type of browser to use.
    \*/
    browserName?: 'chromium' | 'firefox' | 'webkit';


    /**
     * Keep the browser profile in memory, do not save it to disk.
     */
    isolated?: boolean;

    /**
     * Path to a user data directory for browser profile persistence.
     * Temporary directory is created by default.
     */
    userDataDir?: string;

    /**
     * Launch options passed to
     * @see https://playwright.dev/docs/api/class-browsertype#browser-type-launch-persistent-context
     *
     * This is useful for settings options like `channel`, `headless`, `executablePath`, etc.
     */
    launchOptions?: playwright.LaunchOptions;

    /**
     * Context options for the browser context.
     *
     * This is useful for settings options like `viewport`.
     */
    contextOptions?: playwright.BrowserContextOptions;

    /**
     * Chrome DevTools Protocol endpoint to connect to an existing browser instance in case of Chromium family browsers.
     */
    cdpEndpoint?: string;

    /**
     * CDP headers to send with the connect request.
     */
    cdpHeaders?: Record<string, string>;

    /**
     * Timeout in milliseconds for connecting to CDP endpoint. Defaults to 30000 (30 seconds). Pass 0 to disable timeout.
     */
    cdpTimeout?: number;

    /**
     * Remote endpoint to connect to an existing Playwright server.
     */
    remoteEndpoint?: string;

    /**
     * Paths to TypeScript files to add as initialization scripts for Playwright page.
     */
    initPage?: string[];

    /**
     * Paths to JavaScript files to add as initialization scripts.
     * The scripts will be evaluated in every page before any of the page's scripts.
     */
    initScript?: string[];

},

/\*\*

- Connect to a running browser instance (Edge/Chrome only). If specified, `browser`
- config is ignored.
- Requires the "Playwright MCP Bridge" browser extension to be installed.
  \*/
  extension?: boolean;

server?: {
/\*\*
_ The port to listen on for SSE or MCP transport.
_/
port?: number;

    /**
     * The host to bind the server to. Default is localhost. Use 0.0.0.0 to bind to all interfaces.
     */
    host?: string;

    /**
     * The hosts this server is allowed to serve from. Defaults to the host server is bound to.
     * This is not for CORS, but rather for the DNS rebinding protection.
     */
    allowedHosts?: string[];

},

/\*\*

- List of enabled tool capabilities. Possible values:
- - 'core': Core browser automation features.
- - 'pdf': PDF generation and manipulation.
- - 'vision': Coordinate-based interactions.
- - 'devtools': Developer tools features.
    \*/
    capabilities?: ToolCapability[];

/\*\*

- Whether to save the Playwright session into the output directory.
  \*/
  saveSession?: boolean;

/\*\*

- Reuse the same browser context between all connected HTTP clients.
  \*/
  sharedBrowserContext?: boolean;

/\*\*

- Secrets are used to replace matching plain text in the tool responses to prevent the LLM
- from accidentally getting sensitive data. It is a convenience and not a security feature,
- make sure to always examine information coming in and from the tool on the client.
  \*/
  secrets?: Record<string, string>;

/\*\*

- The directory to save output files.
  \*/
  outputDir?: string;

console?: {
/\*\*
_ The level of console messages to return. Each level includes the messages of more severe levels. Defaults to "info".
_/
level?: 'error' | 'warning' | 'info' | 'debug';
},

network?: {
/\*\*
_ List of origins to allow the browser to request. Default is to allow all. Origins matching both `allowedOrigins` and `blockedOrigins` will be blocked.
_
_ Supported formats:
_ - Full origin: `https://example.com:8080` - matches only that origin
_ - Wildcard port: `http://localhost:_` - matches any port on localhost with http protocol
\*/
allowedOrigins?: string[];

    /**
     * List of origins to block the browser to request. Origins matching both `allowedOrigins` and `blockedOrigins` will be blocked.
     *
     * Supported formats:
     * - Full origin: `https://example.com:8080` - matches only that origin
     * - Wildcard port: `http://localhost:*` - matches any port on localhost with http protocol
     */
    blockedOrigins?: string[];

};

/\*\*

- Specify the attribute to use for test ids, defaults to "data-testid".
  \*/
  testIdAttribute?: string;

timeouts?: {
/\*
_ Configures default action timeout: https://playwright.dev/docs/api/class-page#page-set-default-timeout. Defaults to 5000ms.
_/
action?: number;

    /*
     * Configures default navigation timeout: https://playwright.dev/docs/api/class-page#page-set-default-navigation-timeout. Defaults to 60000ms.
     */
    navigation?: number;

    /**
     * Configures default expect timeout: https://playwright.dev/docs/test-timeouts#expect-timeout. Defaults to 5000ms.
     */
    expect?: number;

};

/\*\*

- Whether to send image responses to the client. Can be "allow", "omit", or "auto". Defaults to "auto", which sends images if the client can display them.
  \*/
  imageResponses?: 'allow' | 'omit';

snapshot?: {
/\*\*
_ When taking snapshots for responses, specifies the mode to use.
_/
mode?: 'full' | 'none';
};

/\*\*

- allowUnrestrictedFileAccess acts as a guardrail to prevent the LLM from accidentally
- wandering outside its intended workspace. It is a convenience defense to catch unintended
- file access, not a secure boundary; a deliberate attempt to reach other directories can be
- easily worked around, so always rely on client-level permissions for true security.
  \*/
  allowUnrestrictedFileAccess?: boolean;

/\*\*

- Specify the language to use for code generation.
  \*/
  codegen?: 'typescript' | 'none';
  }
  undefined

### Standalone MCP server

[](https://www.npmjs.com/package/@playwright/mcp#standalone-mcp-server)

When running headed browser on system w/o display or from worker processes of the IDEs, run the MCP server from environment with the DISPLAY and pass the `--port` flag to enable HTTP transport.

undefinedshell
npx @playwright/mcp@latest --port 8931
undefined

And then in MCP client config, set the `url` to the HTTP endpoint:

undefinedjs
{
"mcpServers": {
"playwright": {
"url": "http://localhost:8931/mcp"
}
}
}
undefined

## Security

[](https://www.npmjs.com/package/@playwright/mcp#security)

Playwright MCP is **not** a security boundary. See [MCP Security Best Practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices) for guidance on securing your deployment.

**Docker**
**NOTE:** The Docker implementation only supports headless chromium at the moment.

undefinedjs
{
"mcpServers": {
"playwright": {
"command": "docker",
"args": ["run", "-i", "--rm", "--init", "--pull=always", "mcr.microsoft.com/playwright/mcp"]
}
}
}
undefined

Or If you prefer to run the container as a long-lived service instead of letting the MCP client spawn it, use:

```
docker run -d -i --rm --init --pull=always \
  --entrypoint node \
  --name playwright \
  -p 8931:8931 \
  mcr.microsoft.com/playwright/mcp \
  cli.js --headless --browser chromium --no-sandbox --port 8931 --host 0.0.0.0
```

The server will listen on host port **8931** and can be reached by any MCP client.

You can build the Docker image yourself.

```
docker build -t mcr.microsoft.com/playwright/mcp .
```

**Programmatic usage**

undefinedjs
import http from 'http';

import { createConnection } from '@playwright/mcp';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

http.createServer(async (req, res) => {
// ...

// Creates a headless Playwright MCP server with SSE transport
const connection = await createConnection({ browser: { launchOptions: { headless: true } } });
const transport = new SSEServerTransport('/messages', res);
await connection.connect(transport);

// ...
});
undefined

### Tools

[](https://www.npmjs.com/package/@playwright/mcp#tools)

**Core automation**

- **browser_click**
  - Title: Click
  - Description: Perform click on a web page
  - Parameters:
    - `element` (string, optional): Human-readable element description used to obtain permission to interact with the element
    - `ref` (string): Exact target element reference from the page snapshot
    - `selector` (string, optional): CSS or role selector for the target element, when "ref" is not available
    - `doubleClick` (boolean, optional): Whether to perform a double click instead of a single click
    - `button` (string, optional): Button to click, defaults to left
    - `modifiers` (array, optional): Modifier keys to press

  - Read-only: **false**

- **browser_close**
  - Title: Close browser
  - Description: Close the page
  - Parameters: None
  - Read-only: **false**

- **browser_console_messages**
  - Title: Get console messages
  - Description: Returns all console messages
  - Parameters:
    - `level` (string): Level of the console messages to return. Each level includes the messages of more severe levels. Defaults to "info".
    - `all` (boolean, optional): Return all console messages since the beginning of the session, not just since the last navigation. Defaults to false.
    - `filename` (string, optional): Filename to save the console messages to. If not provided, messages are returned as text.

  - Read-only: **true**

- **browser_drag**
  - Title: Drag mouse
  - Description: Perform drag and drop between two elements
  - Parameters:
    - `startElement` (string): Human-readable source element description used to obtain the permission to interact with the element
    - `startRef` (string): Exact source element reference from the page snapshot
    - `startSelector` (string, optional): CSS or role selector for the source element, when ref is not available
    - `endElement` (string): Human-readable target element description used to obtain the permission to interact with the element
    - `endRef` (string): Exact target element reference from the page snapshot
    - `endSelector` (string, optional): CSS or role selector for the target element, when ref is not available

  - Read-only: **false**

- **browser_evaluate**
  - Title: Evaluate JavaScript
  - Description: Evaluate JavaScript expression on page or element
  - Parameters:
    - `function` (string): () => { /_ code */ } or (element) => { /* code _/ } when element is provided
    - `element` (string, optional): Human-readable element description used to obtain permission to interact with the element
    - `ref` (string, optional): Exact target element reference from the page snapshot
    - `selector` (string, optional): CSS or role selector for the target element, when "ref" is not available.
    - `filename` (string, optional): Filename to save the result to. If not provided, result is returned as text.

  - Read-only: **false**

- **browser_file_upload**
  - Title: Upload files
  - Description: Upload one or multiple files
  - Parameters:
    - `paths` (array, optional): The absolute paths to the files to upload. Can be single file or multiple files. If omitted, file chooser is cancelled.

  - Read-only: **false**

- **browser_fill_form**
  - Title: Fill form
  - Description: Fill multiple form fields
  - Parameters:
    - `fields` (array): Fields to fill in

  - Read-only: **false**

- **browser_handle_dialog**
  - Title: Handle a dialog
  - Description: Handle a dialog
  - Parameters:
    - `accept` (boolean): Whether to accept the dialog.
    - `promptText` (string, optional): The text of the prompt in case of a prompt dialog.

  - Read-only: **false**

- **browser_hover**
  - Title: Hover mouse
  - Description: Hover over element on page
  - Parameters:
    - `element` (string, optional): Human-readable element description used to obtain permission to interact with the element
    - `ref` (string): Exact target element reference from the page snapshot
    - `selector` (string, optional): CSS or role selector for the target element, when "ref" is not available

  - Read-only: **false**

- **browser_navigate**
  - Title: Navigate to a URL
  - Description: Navigate to a URL
  - Parameters:
    - `url` (string): The URL to navigate to

  - Read-only: **false**

- **browser_navigate_back**
  - Title: Go back
  - Description: Go back to the previous page in the history
  - Parameters: None
  - Read-only: **false**

- **browser_network_requests**
  - Title: List network requests
  - Description: Returns all network requests since loading the page
  - Parameters:
    - `static` (boolean): Whether to include successful static resources like images, fonts, scripts, etc. Defaults to false.
    - `requestBody` (boolean): Whether to include request body. Defaults to false.
    - `requestHeaders` (boolean): Whether to include request headers. Defaults to false.
    - `filter` (string, optional): Only return requests whose URL matches this regexp (e.g. "/api/.\*user").
    - `filename` (string, optional): Filename to save the network requests to. If not provided, requests are returned as text.

  - Read-only: **true**

- **browser_press_key**
  - Title: Press a key
  - Description: Press a key on the keyboard
  - Parameters:
    - `key` (string): Name of the key to press or a character to generate, such as `ArrowLeft` or `a`

  - Read-only: **false**

- **browser_resize**
  - Title: Resize browser window
  - Description: Resize the browser window
  - Parameters:
    - `width` (number): Width of the browser window
    - `height` (number): Height of the browser window

  - Read-only: **false**

- **browser_run_code**
  - Title: Run Playwright code
  - Description: Run Playwright code snippet
  - Parameters:
    - `code` (string, optional): A JavaScript function containing Playwright code to execute. It will be invoked with a single argument, page, which you can use for any page interaction. For example: `async (page) => { await page.getByRole('button', { name: 'Submit' }).click(); return await page.title(); }`
    - `filename` (string, optional): Load code from the specified file. If both code and filename are provided, code will be ignored.

  - Read-only: **false**

- **browser_select_option**
  - Title: Select option
  - Description: Select an option in a dropdown
  - Parameters:
    - `element` (string, optional): Human-readable element description used to obtain permission to interact with the element
    - `ref` (string): Exact target element reference from the page snapshot
    - `selector` (string, optional): CSS or role selector for the target element, when "ref" is not available
    - `values` (array): Array of values to select in the dropdown. This can be a single value or multiple values.

  - Read-only: **false**

- **browser_snapshot**
  - Title: Page snapshot
  - Description: Capture accessibility snapshot of the current page, this is better than screenshot
  - Parameters:
    - `filename` (string, optional): Save snapshot to markdown file instead of returning it in the response.
    - `selector` (string, optional): Element selector of the root element to capture a partial snapshot instead of the whole page
    - `depth` (number, optional): Limit the depth of the snapshot tree

  - Read-only: **true**

- **browser_take_screenshot**
  - Title: Take a screenshot
  - Description: Take a screenshot of the current page. You can't perform actions based on the screenshot, use browser_snapshot for actions.
  - Parameters:
    - `type` (string): Image format for the screenshot. Default is png.
    - `filename` (string, optional): File name to save the screenshot to. Defaults to `page-{timestamp}.{png|jpeg}` if not specified. Prefer relative file names to stay within the output directory.
    - `element` (string, optional): Human-readable element description used to obtain permission to screenshot the element. If not provided, the screenshot will be taken of viewport. If element is provided, ref must be provided too.
    - `ref` (string, optional): Exact target element reference from the page snapshot. If not provided, the screenshot will be taken of viewport. If ref is provided, element must be provided too.
    - `selector` (string, optional): CSS or role selector for the target element, when "ref" is not available.
    - `fullPage` (boolean, optional): When true, takes a screenshot of the full scrollable page, instead of the currently visible viewport. Cannot be used with element screenshots.

  - Read-only: **true**

- **browser_type**
  - Title: Type text
  - Description: Type text into editable element
  - Parameters:
    - `element` (string, optional): Human-readable element description used to obtain permission to interact with the element
    - `ref` (string): Exact target element reference from the page snapshot
    - `selector` (string, optional): CSS or role selector for the target element, when "ref" is not available
    - `text` (string): Text to type into the element
    - `submit` (boolean, optional): Whether to submit entered text (press Enter after)
    - `slowly` (boolean, optional): Whether to type one character at a time. Useful for triggering key handlers in the page. By default entire text is filled in at once.

  - Read-only: **false**

- **browser_wait_for**
  - Title: Wait for
  - Description: Wait for text to appear or disappear or a specified time to pass
  - Parameters:
    - `time` (number, optional): The time to wait in seconds
    - `text` (string, optional): The text to wait for
    - `textGone` (string, optional): The text to wait for to disappear

  - Read-only: **false**

**Tab management**

- **browser_tabs**
  - Title: Manage tabs
  - Description: List, create, close, or select a browser tab.
  - Parameters:
    - `action` (string): Operation to perform
    - `index` (number, optional): Tab index, used for close/select. If omitted for close, current tab is closed.

  - Read-only: **false**

**Browser installation**

**Configuration (opt-in via --caps=config)**

- **browser_get_config**
  - Title: Get config
  - Description: Get the final resolved config after merging CLI options, environment variables and config file.
  - Parameters: None
  - Read-only: **true**

**Network (opt-in via --caps=network)**

- **browser_network_state_set**
  - Title: Set network state
  - Description: Sets the browser network state to online or offline. When offline, all network requests will fail.
  - Parameters:
    - `state` (string): Set to "offline" to simulate offline mode, "online" to restore network connectivity

  - Read-only: **false**

- **browser_route**
  - Title: Mock network requests
  - Description: Set up a route to mock network requests matching a URL pattern
  - Parameters:
    - `pattern` (string): URL pattern to match (e.g., "**/api/users", "**/\*.{png,jpg}")
    - `status` (number, optional): HTTP status code to return (default: 200)
    - `body` (string, optional): Response body (text or JSON string)
    - `contentType` (string, optional): Content-Type header (e.g., "application/json", "text/html")
    - `headers` (array, optional): Headers to add in "Name: Value" format
    - `removeHeaders` (string, optional): Comma-separated list of header names to remove from request

  - Read-only: **false**

- **browser_route_list**
  - Title: List network routes
  - Description: List all active network routes
  - Parameters: None
  - Read-only: **true**

- **browser_unroute**
  - Title: Remove network routes
  - Description: Remove network routes matching a pattern (or all routes if no pattern specified)
  - Parameters:
    - `pattern` (string, optional): URL pattern to unroute (omit to remove all routes)

  - Read-only: **false**

**Storage (opt-in via --caps=storage)**

- **browser_cookie_clear**
  - Title: Clear cookies
  - Description: Clear all cookies
  - Parameters: None
  - Read-only: **false**

- **browser_cookie_delete**
  - Title: Delete cookie
  - Description: Delete a specific cookie
  - Parameters:
    - `name` (string): Cookie name to delete

  - Read-only: **false**

- **browser_cookie_get**
  - Title: Get cookie
  - Description: Get a specific cookie by name
  - Parameters:
    - `name` (string): Cookie name to get

  - Read-only: **true**

- **browser_cookie_list**
  - Title: List cookies
  - Description: List all cookies (optionally filtered by domain/path)
  - Parameters:
    - `domain` (string, optional): Filter cookies by domain
    - `path` (string, optional): Filter cookies by path

  - Read-only: **true**

- **browser_cookie_set**
  - Title: Set cookie
  - Description: Set a cookie with optional flags (domain, path, expires, httpOnly, secure, sameSite)
  - Parameters:
    - `name` (string): Cookie name
    - `value` (string): Cookie value
    - `domain` (string, optional): Cookie domain
    - `path` (string, optional): Cookie path
    - `expires` (number, optional): Cookie expiration as Unix timestamp
    - `httpOnly` (boolean, optional): Whether the cookie is HTTP only
    - `secure` (boolean, optional): Whether the cookie is secure
    - `sameSite` (string, optional): Cookie SameSite attribute

  - Read-only: **false**

- **browser_localstorage_clear**
  - Title: Clear localStorage
  - Description: Clear all localStorage
  - Parameters: None
  - Read-only: **false**

- **browser_localstorage_delete**
  - Title: Delete localStorage item
  - Description: Delete a localStorage item
  - Parameters:
    - `key` (string): Key to delete

  - Read-only: **false**

- **browser_localstorage_get**
  - Title: Get localStorage item
  - Description: Get a localStorage item by key
  - Parameters:
    - `key` (string): Key to get

  - Read-only: **true**

- **browser_localstorage_list**
  - Title: List localStorage
  - Description: List all localStorage key-value pairs
  - Parameters: None
  - Read-only: **true**

- **browser_localstorage_set**
  - Title: Set localStorage item
  - Description: Set a localStorage item
  - Parameters:
    - `key` (string): Key to set
    - `value` (string): Value to set

  - Read-only: **false**

- **browser_sessionstorage_clear**
  - Title: Clear sessionStorage
  - Description: Clear all sessionStorage
  - Parameters: None
  - Read-only: **false**

- **browser_sessionstorage_delete**
  - Title: Delete sessionStorage item
  - Description: Delete a sessionStorage item
  - Parameters:
    - `key` (string): Key to delete

  - Read-only: **false**

- **browser_sessionstorage_get**
  - Title: Get sessionStorage item
  - Description: Get a sessionStorage item by key
  - Parameters:
    - `key` (string): Key to get

  - Read-only: **true**

- **browser_sessionstorage_list**
  - Title: List sessionStorage
  - Description: List all sessionStorage key-value pairs
  - Parameters: None
  - Read-only: **true**

- **browser_sessionstorage_set**
  - Title: Set sessionStorage item
  - Description: Set a sessionStorage item
  - Parameters:
    - `key` (string): Key to set
    - `value` (string): Value to set

  - Read-only: **false**

- **browser_set_storage_state**
  - Title: Restore storage state
  - Description: Restore storage state (cookies, local storage) from a file. This clears existing cookies and local storage before restoring.
  - Parameters:
    - `filename` (string): Path to the storage state file to restore from

  - Read-only: **false**

- **browser_storage_state**
  - Title: Save storage state
  - Description: Save storage state (cookies, local storage) to a file for later reuse
  - Parameters:
    - `filename` (string, optional): File name to save the storage state to. Defaults to `storage-state-{timestamp}.json` if not specified.

  - Read-only: **true**

**DevTools (opt-in via --caps=devtools)**

- **browser_resume**
  - Title: Resume paused script execution
  - Description: Resume script execution after it was paused. When called with step set to true, execution will pause again before the next action.
  - Parameters:
    - `step` (boolean, optional): When true, execution will pause again before the next action, allowing step-by-step debugging.
    - `location` (string, optional): Pause execution at a specific :, e.g. "example.spec.ts:42".

  - Read-only: **false**

- **browser_start_tracing**
  - Title: Start tracing
  - Description: Start trace recording
  - Parameters: None
  - Read-only: **true**

- **browser_start_video**
  - Title: Start video
  - Description: Start video recording
  - Parameters:
    - `filename` (string, optional): Filename to save the video.
    - `size` (object, optional): Video size

  - Read-only: **true**

- **browser_stop_tracing**
  - Title: Stop tracing
  - Description: Stop trace recording
  - Parameters: None
  - Read-only: **true**

- **browser_stop_video**
  - Title: Stop video
  - Description: Stop video recording
  - Parameters: None
  - Read-only: **true**

- **browser_video_chapter**
  - Title: Video chapter
  - Description: Add a chapter marker to the video recording. Shows a full-screen chapter card with blurred backdrop.
  - Parameters:
    - `title` (string): Chapter title
    - `description` (string, optional): Chapter description
    - `duration` (number, optional): Duration in milliseconds to show the chapter card

  - Read-only: **true**

**Coordinate-based (opt-in via --caps=vision)**

- **browser_mouse_click_xy**
  - Title: Click
  - Description: Click mouse button at a given position
  - Parameters:
    - `x` (number): X coordinate
    - `y` (number): Y coordinate
    - `button` (string, optional): Button to click, defaults to left
    - `clickCount` (number, optional): Number of clicks, defaults to 1
    - `delay` (number, optional): Time to wait between mouse down and mouse up in milliseconds, defaults to 0

  - Read-only: **false**

- **browser_mouse_down**
  - Title: Press mouse down
  - Description: Press mouse down
  - Parameters:
    - `button` (string, optional): Button to press, defaults to left

  - Read-only: **false**

- **browser_mouse_drag_xy**
  - Title: Drag mouse
  - Description: Drag left mouse button to a given position
  - Parameters:
    - `startX` (number): Start X coordinate
    - `startY` (number): Start Y coordinate
    - `endX` (number): End X coordinate
    - `endY` (number): End Y coordinate

  - Read-only: **false**

- **browser_mouse_move_xy**
  - Title: Move mouse
  - Description: Move mouse to a given position
  - Parameters:
    - `x` (number): X coordinate
    - `y` (number): Y coordinate

  - Read-only: **false**

- **browser_mouse_up**
  - Title: Press mouse up
  - Description: Press mouse up
  - Parameters:
    - `button` (string, optional): Button to press, defaults to left

  - Read-only: **false**

- **browser_mouse_wheel**
  - Title: Scroll mouse wheel
  - Description: Scroll mouse wheel
  - Parameters:
    - `deltaX` (number): X delta
    - `deltaY` (number): Y delta

  - Read-only: **false**

**PDF generation (opt-in via --caps=pdf)**

- **browser_pdf_save**
  - Title: Save as PDF
  - Description: Save page as PDF
  - Parameters:
    - `filename` (string, optional): File name to save the pdf to. Defaults to `page-{timestamp}.pdf` if not specified. Prefer relative file names to stay within the output directory.

  - Read-only: **true**

**Test assertions (opt-in via --caps=testing)**

- **browser_generate_locator**
  - Title: Create locator for element
  - Description: Generate locator for the given element to use in tests
  - Parameters:
    - `element` (string, optional): Human-readable element description used to obtain permission to interact with the element
    - `ref` (string): Exact target element reference from the page snapshot
    - `selector` (string, optional): CSS or role selector for the target element, when "ref" is not available

  - Read-only: **true**

- **browser_verify_element_visible**
  - Title: Verify element visible
  - Description: Verify element is visible on the page
  - Parameters:
    - `role` (string): ROLE of the element. Can be found in the snapshot like this: `- {ROLE} "Accessible Name":`
    - `accessibleName` (string): ACCESSIBLE_NAME of the element. Can be found in the snapshot like this: `- role "{ACCESSIBLE_NAME}"`

  - Read-only: **false**

- **browser_verify_list_visible**
  - Title: Verify list visible
  - Description: Verify list is visible on the page
  - Parameters:
    - `element` (string): Human-readable list description
    - `ref` (string): Exact target element reference that points to the list
    - `selector` (string, optional): CSS or role selector for the target list, when "ref" is not available.
    - `items` (array): Items to verify

  - Read-only: **false**

- **browser_verify_text_visible**
  - Title: Verify text visible
  - Description: Verify text is visible on the page. Prefer browser_verify_element_visible if possible.
  - Parameters:
    - `text` (string): TEXT to verify. Can be found in the snapshot like this: `- role "Accessible Name": {TEXT}` or like this: `- text: {TEXT}`

  - Read-only: **false**

- **browser_verify_value**
  - Title: Verify value
  - Description: Verify element value
  - Parameters:
    - `type` (string): Type of the element
    - `element` (string): Human-readable element description
    - `ref` (string): Exact target element reference from the page snapshot
    - `selector` (string, optional): CSS or role selector for the target element, when "ref" is not available
    - `value` (string): Value to verify. For checkbox, use "true" or "false".

  - Read-only: **false**

## Readme

### Keywords

none

# Provenance

[Share feedback](https://github.com/npm/feedback)

## Package Sidebar

### Install

`npm i @playwright/mcp`

### Repository

[github.com/microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp)

### Homepage

[playwright.dev](https://playwright.dev/)

### Weekly Downloads

2,501,874

### Version

0.0.70

### License

Apache-2.0

### Last publish

11 hours ago

### Collaborators

- [![Image 10: pavelfeldman](https://www.npmjs.com/npm-avatar/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdmF0YXJVUkwiOiJodHRwczovL3MuZ3JhdmF0YXIuY29tL2F2YXRhci9kYjM2M2Y3ZmI3ZWU4NTI0NzMyMDg2NTFiMDM0YzRkMD9zaXplPTEwMCZkZWZhdWx0PXJldHJvIn0.pO7sXvqMhBA5LDJAbygF-6p_i_zg1wWHEZkZZu2hwds)](https://www.npmjs.com/~pavelfeldman) pavelfeldman
- [![Image 11: yurys](https://www.npmjs.com/npm-avatar/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdmF0YXJVUkwiOiJodHRwczovL3MuZ3JhdmF0YXIuY29tL2F2YXRhci80Nzk3ODc0Yzk1MGRiNjk3NWNlMDk4NjNjZTgyNjM5Yj9zaXplPTEwMCZkZWZhdWx0PXJldHJvIn0.p4uUDTqhwL1IUw32j7uD6JJBqCc9sT6ZN6QbpLJa9bk)](https://www.npmjs.com/~yurys) yurys
- [![Image 12: dgozman-ms](https://www.npmjs.com/npm-avatar/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdmF0YXJVUkwiOiJodHRwczovL3MuZ3JhdmF0YXIuY29tL2F2YXRhci83Mzk5MTliYTQ0YzJiNTM4NDM3YTdhN2ZhNTVmZWExNT9zaXplPTEwMCZkZWZhdWx0PXJldHJvIn0.QQxdvJ2dEkcaXlNPpVwG3wDb_X5trH_A9Q9e6U6jFBs)](https://www.npmjs.com/~dgozman-ms) dgozman-ms
- [![Image 13: playwright-bot](https://www.npmjs.com/npm-avatar/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdmF0YXJVUkwiOiJodHRwczovL3MuZ3JhdmF0YXIuY29tL2F2YXRhci9lMDZlZTA0Njc2YTM3OTlhYjU2NGVjMDkxODI3MWU0Nz9zaXplPTEwMCZkZWZhdWx0PXJldHJvIn0.AQhnREXMKT_GMZAGsmlFphKKdNKm6IA4u8N_u20MuSA)](https://www.npmjs.com/~playwright-bot) playwright-bot

[**Analyze security** with Socket](https://socket.dev/npm/package/%40playwright%2Fmcp)[**Check bundle size**](https://bundlephobia.com/package/%40playwright%2Fmcp)[**View package health**](https://snyk.io/advisor/npm-package/%40playwright%2Fmcp)[**Explore dependencies**](https://npmgraph.js.org/?q=%40playwright%2Fmcp)

[**Report** malware](https://www.npmjs.com/support?inquire=security&security-inquire=malware&package=%40playwright%2Fmcp&version=0.0.70)

## Footer

[](https://github.com/npm)

[](https://github.com/)

### Support

- [Help](https://docs.npmjs.com/)
- [Advisories](https://github.com/advisories)
- [Status](http://status.npmjs.org/)
- [Contact npm](https://www.npmjs.com/support)

### Company

- [About](https://www.npmjs.com/about)
- [Blog](https://github.blog/tag/npm/)
- [Press](https://www.npmjs.com/press)

### Terms & Policies

- [Policies](https://www.npmjs.com/policies/)
- [Terms of Use](https://www.npmjs.com/policies/terms)
- [Code of Conduct](https://www.npmjs.com/policies/conduct)
- [Privacy](https://www.npmjs.com/policies/privacy)
