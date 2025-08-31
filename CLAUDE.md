# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build & Development

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run linting (includes prettier, eslint, tsc, and jsr dry-run)
pnpm lint

# Format code
pnpm format

# Run tests
pnpm test

# Run a single test file
pnpm test src/FastMCP.test.ts

# Development server with mcp-cli
npx fastmcp dev src/examples/addition.ts

# Inspect server with MCP Inspector
npx fastmcp inspect src/examples/addition.ts
```

## Architecture Overview

FastMCP is a TypeScript framework for building Model Context Protocol (MCP) servers with enhanced features beyond the official SDK.

### Core Components

**FastMCP Class** (`src/FastMCP.ts`)

- Main server class that extends MCP SDK capabilities
- Manages server lifecycle, sessions, and transport configurations
- Supports multiple transport types: stdio, httpStream (with SSE compatibility)
- Built-in authentication, OAuth support, custom HTTP routes, and stateless mode

**Session Management**

- `FastMCPSession<T>` class handles individual client connections
- Each client gets its own server instance for 1:1 communication
- Sessions track client capabilities, roots, and logging levels
- Supports typed events and sampling requests

**Transport Layer**

- Uses `mcp-proxy` for HTTP streaming and SSE support
- Configurable ping mechanism for connection health
- CORS enabled by default
- Health check endpoints (`/health`, `/ready`)

### Key Features Implementation

**Tools System**

- Tools are executable functions with Standard Schema validation
- Support for Zod, ArkType, Valibot schemas via Standard Schema spec
- Built-in support for streaming output, progress reporting, and logging
- Tools can return text, images, audio, or embedded resources
- Optional `canAccess` function for authorization control

**Resources & Templates**

- Resources expose data (files, logs, etc.) via unique URIs
- Resource templates support dynamic URIs with arguments
- `embedded()` method simplifies resource inclusion in tool responses
- Auto-completion support for template arguments

**Custom HTTP Routes**

- Add REST API endpoints alongside MCP endpoints
- Support for all HTTP methods, path parameters, query strings
- Public routes option to bypass authentication
- Useful for webhooks, admin interfaces, OAuth endpoints

**Authentication & OAuth**

- Session-based authentication with custom `authenticate` function
- Built-in OAuth discovery endpoints (RFC 8414, RFC 9470)
- Per-tool authorization via `canAccess` function
- Headers can be passed through context for API key management

### Testing Infrastructure

- Uses Vitest with experimental EventSource support
- Test files: `FastMCP.test.ts`, `FastMCP.routes.test.ts`, `FastMCP.oauth.test.ts`, `FastMCP.session-context.test.ts`
- Integration tests use `get-port-please` for dynamic port allocation
- Tests cover core functionality, custom routes, OAuth, and session contexts

### Build Configuration

- **TypeScript**: Strict mode with Node 22 target
- **Bundler**: tsup for ESM output with source maps
- **Linting**: ESLint with TypeScript, Perfectionist (alphabetical sorting), and Prettier
- **Package**: Published as `@jordanburke/fastmcp` to npm and JSR
- **CI/CD**: GitHub Actions with semantic-release for automated publishing

### Error Handling

- `UserError` class for user-facing errors
- `McpError` for protocol-level errors
- Comprehensive error codes from MCP SDK
- Errors in tools should throw `UserError` for proper client display

### Content Helpers

- `imageContent()`: Create image content from URL, path, or buffer
- `audioContent()`: Create audio content from URL, path, or buffer
- Automatic MIME type detection via `file-type` package
- Support for base64 encoding of binary data

### CLI Tool (`src/bin/fastmcp.ts`)

FastMCP includes a CLI for development and debugging:

- `dev` command: Run server with mcp-cli
- `inspect` command: Launch MCP Inspector
- Support for watch mode, verbose logging, and transport configuration
