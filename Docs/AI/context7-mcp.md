# Context7 MCP - Referencia Detallada

## Objetivo

Usar Context7 como fuente principal de documentacion oficial y actualizada de
librerias/APIs en tareas de desarrollo.

## Instalacion en Claude Code

1. Instalar MCP Server:

```bash
claude mcp add --scope user \
  --header "CONTEXT7_API_KEY: YOUR_API_KEY" \
  --transport http context7 \
  https://mcp.context7.com/mcp
```

2. Instalar Plugin Marketplace:

```txt
/plugin marketplace add upstash/context7
/plugin install context7-plugin@context7-marketplace
```

## Regla recomendada para agentes

En `CLAUDE.md` o en instrucciones del agente:

```txt
Always use Context7 MCP when I need library/API documentation, code
generation, setup or configuration steps without me having to explicitly ask.
```

## Uso rapido

Con ID (preferido):

```txt
/context7:docs /vercel/next.js server actions typescript
/context7:docs /drizzle-team/drizzle-orm postgres neon pooling
/context7:docs /clerk/clerk-js authentication patterns
```

Sin ID (auto-resolucion):

```txt
/context7:docs react hooks documentation
/context7:docs drizzle relationships
```

Con version:

```txt
/context7:docs /vercel/next.js 16 server actions with typescript
/context7:docs /drizzle-team/drizzle-orm 0.45 neon postgres pooling
show me clerk v6 authentication patterns
Configure Tailwind CSS 4.2 utilities
```

## IDs recomendados para este proyecto

- `/vercel/next.js`
- `/drizzle-team/drizzle-orm`
- `/clerk/clerk-js`
- `/tailwindlabs/tailwindcss`
- `/facebook/react`
- `/microsoft/typescript`
- `/openai/openai-node`
- `/aws-sdk/aws-sdk-js`

## Indice de librerias

https://context7.com/docs/llms.txt
