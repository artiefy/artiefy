> ## Documentation Index
>
> Fetch the complete documentation index at: https://docs.ollama.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

Ollama is available on macOS, Windows, and Linux.

<a href="https://ollama.com/download" target="_blank" className="inline-block px-6 py-2 bg-black rounded-full dark:bg-neutral-700 text-white font-normal border-none">
  Download Ollama
</a>

## Get Started

Run `ollama` in your terminal to open the interactive menu:

```sh theme={"system"}
ollama
```

Navigate with `↑/↓`, press `enter` to launch, `→` to change model, and `esc` to quit.

The menu provides quick access to:

- **Run a model** - Start an interactive chat
- **Launch tools** - Claude Code, Codex, OpenClaw, and more
- **Additional integrations** - Available under "More..."

## Assistants

Launch [OpenClaw](/integrations/openclaw), a personal AI with 100+ skills:

```sh theme={"system"}
ollama launch openclaw
```

## Coding

Launch [Claude Code](/integrations/claude-code) and other coding tools with Ollama models:

```sh theme={"system"}
ollama launch claude
```

```sh theme={"system"}
ollama launch codex
```

```sh theme={"system"}
ollama launch opencode
```

See [integrations](/integrations) for all supported tools.

## API

Use the [API](/api) to integrate Ollama into your applications:

```sh theme={"system"}
curl http://localhost:11434/api/chat -d '{
  "model": "gemma3",
  "messages": [{ "role": "user", "content": "Hello!" }]
}'
```

See the [API documentation](/api) for Python, JavaScript, and other integrations.
