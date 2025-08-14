# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

FastMCP is a TypeScript framework for building MCP (Model Context Protocol) servers that can handle client sessions. It provides a simplified, opinionated framework built on top of the official MCP SDK, eliminating boilerplate code and providing intuitive APIs for common tasks.

## Common Development Commands

### Building and Development

```bash
# Build the project (TypeScript to JavaScript using tsup)
pnpm build

# Run lint, format, and type checks
pnpm lint

# Format code and fix linting issues
pnpm format

# Run tests
pnpm test
```

### CLI Commands (via bin/fastmcp.ts)

```bash
# Test server with MCP CLI (interactive terminal)
npx fastmcp dev <server-file>
npx fastmcp dev --watch <server-file>  # Watch mode

# Inspect server with MCP Inspector (web UI)
npx fastmcp inspect <server-file>

# Validate server structure and TypeScript
npx fastmcp validate <server-file>
npx fastmcp validate --strict <server-file>  # Strict type checking
```

### Testing Examples

```bash
# Test the addition example server
pnpm build
npx fastmcp dev src/examples/addition.ts
npx fastmcp inspect src/examples/addition.ts

# Run with HTTP streaming transport (instead of stdio)
node dist/examples/addition.js --http-stream
```

## Architecture

### Core Structure

- **FastMCP.ts**: Main framework class with server creation, tool/resource/prompt management
- **bin/fastmcp.ts**: CLI for development, testing, and validation
- **examples/**: Example servers demonstrating features

### Key Design Patterns

#### Server Creation and Configuration

```typescript
const server = new FastMCP({
  name: "Server Name",
  version: "1.0.0",
  // Optional configurations:
  authenticate: (request) => {
    /* auth logic */
  },
  oauth: {
    /* OAuth settings */
  },
  ping: { enabled: true, intervalMs: 5000 },
  roots: { enabled: true },
  health: { enabled: true, path: "/health" },
  instructions: "Server usage instructions",
});
```

#### Tool Definition with Schema Validation

FastMCP supports multiple schema validation libraries via Standard Schema spec:

```typescript
// Zod
server.addTool({
  name: "tool-name",
  description: "Tool description",
  parameters: z.object({ param: z.string() }),
  execute: async (args) => {
    /* implementation */
  },
});

// ArkType
server.addTool({
  parameters: type({ param: "string" }),
  // ... rest of config
});

// Valibot (requires @valibot/to-json-schema peer dependency)
server.addTool({
  parameters: v.object({ param: v.string() }),
  // ... rest of config
});
```

#### Transport Types

- **stdio**: For CLI testing and desktop app integration
- **httpStream**: For HTTP-based connections with streaming support
- **sse**: Server-sent events (legacy, use httpStream instead)

#### Content Types Support

- Text content (string return or content array)
- Image content via `imageContent()` helper
- Audio content via `audioContent()` helper
- Resource embedding via `server.embedded()` method
- Streaming content via `streamContent()` in tool context

### Authentication & Authorization

- Session-based authentication via `authenticate` function
- Tool-level authorization via `canAccess` function
- OAuth 2.0 support with discovery endpoints
- Header passthrough for API keys

### Error Handling

- Use `UserError` class for user-facing errors
- Built-in timeout support with `timeoutMs` on tools
- Progress reporting via `reportProgress()` in tool context

## Project Structure

```
src/
├── FastMCP.ts           # Main framework implementation
├── bin/
│   └── fastmcp.ts      # CLI tool for dev/test/validation
└── examples/
    ├── addition.ts      # Comprehensive example with all features
    └── oauth-server.ts  # OAuth authentication example
```

## Build System

- **TypeScript**: Node 22 target with strict settings
- **tsup**: Build tool for ESM output with source maps and DTS generation
- **Vitest**: Test runner with experimental EventSource support
- **ESLint + Prettier**: Code formatting and linting

## Testing Strategy

### Unit Tests

- **FastMCP.test.ts**: Core framework functionality
- **FastMCP.oauth.test.ts**: OAuth-specific features

### Development Testing

- Use `fastmcp dev` for interactive testing in terminal
- Use `fastmcp inspect` for web-based testing with MCP Inspector
- Examples demonstrate real-world usage patterns

### Integration Testing

- Tests run with `--experimental-eventsource` flag for EventSource support
- Vitest configured with fork pools for proper isolation

## Key Dependencies

### Runtime

- `@modelcontextprotocol/sdk`: Official MCP SDK foundation
- `zod`/`xsschema`: Schema validation and JSON schema generation
- `undici`: HTTP client for improved performance
- `fuse.js`: Fuzzy search capabilities
- `yargs`: CLI argument parsing

### Development

- `@wong2/mcp-cli`: CLI testing tool
- `@modelcontextprotocol/inspector`: Web-based server inspection
- `tsx`: TypeScript execution for development
- `semantic-release`: Automated releases to npm and JSR

## Publishing

The project publishes to both npm and JSR (JavaScript Registry) via semantic-release with automated GitHub workflows.
