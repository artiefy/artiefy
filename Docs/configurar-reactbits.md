Installation
Using components is very straightforward, anyone can do it.

Pick The Method
You can keep it simple and copy code directly from the documentation, or you can use CLI commands to install components into your project.

Click the cards below to change your preferred method.

Manual
CLI
Steps
Use a one-time command to pull any component directly into your project.

React Bits supports two CLI installation methods: shadcn and jsrepo. Pick whichever you prefer – they both fetch the same component source.

Installation
Below are example commands for the SplitText component. Replace placeholders to fit your stack.

shadcn

npx shadcn@latest add https://reactbits.dev/r/<Component>-<LANG>-<STYLE>
<LANGUAGE> + <STYLE> combinations:

JS-CSS - JavaScript + Plain CSS
JS-TW - JavaScript + Tailwind
TS-CSS - TypeScript + Plain CSS
TS-TW - TypeScript + Tailwind
jsrepo

npx jsrepo@latest add https://reactbits.dev/r/<Component>-<LANG>-<STYLE>
<VARIANT> options:

default - JavaScript + Plain CSS
tailwind - JavaScript + Tailwind
ts/default - TypeScript + Plain CSS
ts/tailwind - TypeScript + Tailwind
Tip: You can run these with other package managers (pnpm, yarn, bun) - just swap the prefix (e.g. pnpm dlx or yarn instead of npx).

That's all!
From here on, it's all about how you integrate the component into your project. The code is yours to play around with - modify styling, functionalities, anything goes!

Mcp
Model Context Protocol (MCP) is an open standard that enables AI assistants to securely connect to external data sources and tools.

React Bits encourages the use of the shadcn MCP server to browse, search, and install components using natural language.

Quick Start
Registries are configured in your project's components.json file, where you should first add the @react-bits registry:

{
"registries": {
"@react-bits": "https://reactbits.dev/r/{name}.json"
}
}
Then, from the options below, select your client & set up the shadcn MCP server.

Claude Code Logo
Claude Code
Cursor Logo
Cursor
VS Code Logo
VS Code
Run this in your project:

npx shadcn@latest mcp init --client claude
Restart Claude Code and try prompts like:

Show me all the available backgrounds from the React Bits registry
Add the Dither background from React Bits to the page, make it purple
Add a new section which fades in on scroll using FadeContent from React Bits
Tip: Use /mcp in Claude Code to debug the MCP server.

Learn more
To learn more about using the shadcn MCP server, including manual setup for different clients, please visit the official documentation:

ui.shadcn.com/docs/mcp

MCP Server
Copy Page

Previous
Next
Use the shadcn MCP server to browse, search, and install components from registries.

The shadcn MCP Server allows AI assistants to interact with items from registries. You can browse available components, search for specific ones, and install them directly into your project using natural language.

For example, you can ask an AI assistant to "Build a landing page using components from the acme registry" or "Find me a login form from the shadcn registry".

Registries are configured in your project's components.json file.

components.json
Copy
{
"registries": {
"@acme": "https://acme.com/r/{name}.json"
}
}
Quick Start
Select your MCP client and follow the instructions to configure the shadcn MCP server. If you'd like to do it manually, see the Configuration section.

Claude Code
Cursor
VS Code
Codex
Run the following command in your project:

pnpm
npm
yarn
bun
pnpm dlx shadcn@latest mcp init --client claude
Copy
Restart Claude Code and try the following prompts:

Show me all available components in the shadcn registry
Add the button, dialog and card components to my project
Create a contact form using components from the shadcn registry
Note: You can use /mcp command in Claude Code to debug the MCP server.

What is MCP?
Model Context Protocol (MCP) is an open protocol that enables AI assistants to securely connect to external data sources and tools. With the shadcn MCP server, your AI assistant gains direct access to:

Browse Components - List all available components, blocks, and templates from any configured registry
Search Across Registries - Find specific components by name or functionality across multiple sources
Install with Natural Language - Add components using simple conversational prompts like "add a login form"
Support for Multiple Registries - Access public registries, private company libraries, and third-party sources
How It Works
The MCP server acts as a bridge between your AI assistant, component registries and the shadcn CLI.

Registry Connection - MCP connects to configured registries (shadcn/ui, private registries, third-party sources)
Natural Language - You describe what you need in plain English
AI Processing - The assistant translates your request into registry commands
Component Delivery - Resources are fetched and installed in your project
Supported Registries
The shadcn MCP server works out of the box with any shadcn-compatible registry.

shadcn/ui Registry - The default registry with all shadcn/ui components
Third-Party Registries - Any registry following the shadcn registry specification
Private Registries - Your company's internal component libraries
Namespaced Registries - Multiple registries configured with @namespace syntax
Configuration
You can use any MCP client to interact with the shadcn MCP server. Here are the instructions for the most popular ones.

Claude Code
To use the shadcn MCP server with Claude Code, add the following configuration to your project's .mcp.json file:

.mcp.json
Copy
{
"mcpServers": {
"shadcn": {
"command": "npx",
"args": ["shadcn@latest", "mcp"]
}
}
}
After adding the configuration, restart Claude Code and run /mcp to see the shadcn MCP server in the list. If you see Connected, you're good to go.

See the Claude Code MCP documentation for more details.

Cursor
To configure MCP in Cursor, add the shadcn server to your project's .cursor/mcp.json configuration file:

.cursor/mcp.json
Copy
{
"mcpServers": {
"shadcn": {
"command": "npx",
"args": ["shadcn@latest", "mcp"]
}
}
}
After adding the configuration, enable the shadcn MCP server in Cursor Settings.

Once enabled, you should see a green dot next to the shadcn server in the MCP server list and a list of available tools.

See the Cursor MCP documentation for more details.

VS Code
To configure MCP in VS Code with GitHub Copilot, add the shadcn server to your project's .vscode/mcp.json configuration file:

.vscode/mcp.json
Copy
{
"servers": {
"shadcn": {
"command": "npx",
"args": ["shadcn@latest", "mcp"]
}
}
}
After adding the configuration, open .vscode/mcp.json and click Start next to the shadcn server.

See the VS Code MCP documentation for more details.

Codex
Note: The shadcn CLI cannot automatically update ~/.codex/config.toml. You'll need to add the configuration manually.

To configure MCP in Codex, add the shadcn server to ~/.codex/config.toml:

~/.codex/config.toml
Copy
[mcp_servers.shadcn]
command = "npx"
args = ["shadcn@latest", "mcp"]
After adding the configuration, restart Codex to load the MCP server.

Configuring Registries
The MCP server supports multiple registries through your project's components.json configuration. This allows you to access components from various sources including private registries and third-party providers.

Configure additional registries in your components.json:

components.json
Copy
{
"registries": {
"@acme": "https://registry.acme.com/{name}.json",
"@internal": {
"url": "https://internal.company.com/{name}.json",
"headers": {
"Authorization": "Bearer ${REGISTRY_TOKEN}"
}
}
}
}
Note: No configuration is needed to access the standard shadcn/ui registry.

Authentication
For private registries requiring authentication, set environment variables in your .env.local:

.env.local
Copy
REGISTRY_TOKEN=your_token_here
API_KEY=your_api_key_here
For more details on registry authentication, see the Authentication documentation.

Example Prompts
Once the MCP server is configured, you can use natural language to interact with registries. Try one of the following prompts:

Browse & Search
Show me all available components in the shadcn registry
Find me a login form from the shadcn registry
Install Items
Add the button component to my project
Create a login form using shadcn components
Install the Cursor rules from the acme registry
Work with Namespaces
Show me components from acme registry
Install @internal/auth-form
Build me a landing page using hero, features and testimonials sections from the acme registry
Troubleshooting
MCP Not Responding
If the MCP server isn't responding to prompts:

Check Configuration - Verify the MCP server is properly configured and enabled in your MCP client
Restart MCP Client - Restart your MCP client after configuration changes
Verify Installation - Ensure shadcn is installed in your project
Check Network - Confirm you can access the configured registries
Registry Access Issues
If components aren't loading from registries:

Check components.json - Verify registry URLs are correct
Test Authentication - Ensure environment variables are set for private registries
Verify Registry - Confirm the registry is online and accessible
Check Namespace - Ensure namespace syntax is correct (@namespace/component)
Installation Failures
If components fail to install:

Check Project Setup - Ensure you have a valid components.json file
Verify Paths - Confirm the target directories exist
Check Permissions - Ensure write permissions for component directories
Review Dependencies - Check that required dependencies are installed
No Tools or Prompts
If you see the No tools or prompts message, try the following:

Clear the npx cache - Run npx clear-npx-cache
Re-enable the MCP server - Try to re-enable the MCP server in your MCP client
Check Logs - In Cursor, you can see the logs under View -> Output and select MCP: project-\* in the dropdown.

efectos de react bits

Index

Threads

Backgrounds

Tilted Card

Components

True Focus

Text Animations

Variable Proximity

Text Animations

Waves

Backgrounds
