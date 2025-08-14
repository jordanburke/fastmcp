# Custom HTTP Routes Implementation - Closes #160

This commit successfully implements **custom HTTP route support** for FastMCP TypeScript, achieving feature parity with the Python implementation in #160.

## Key Features Delivered

**Complete Route Support**

- All HTTP methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
- Path parameters with pattern matching (`/users/:id`, `/users/:userId/posts/:postId`)
- Wildcard routes for static files (`/static/*`)
- Query string parsing with array support (`?tags=a&tags=b`)
- JSON and text body parsing with 10MB size limits

**Authentication Integration**

- Routes inherit existing authentication system
- **Public routes** option (`{ public: true }`) to bypass auth
- Perfect for static assets, health checks, and webhook endpoints

**Enhanced Request/Response Objects**

```typescript
// Rich request object with helper methods
server.addRoute("POST", "/api/users/:id", async (req, res) => {
  const userId = req.params.id; // Path parameters
  const filters = req.query.filter; // Query parameters
  const body = await req.json(); // JSON parsing
  const auth = req.auth; // Authentication context

  res.status(201).json({ created: body }); // Chainable response
});
```

**Real-World Use Cases Enabled**

- Admin dashboards with HTML interfaces
- Webhook endpoints for GitHub/Slack integrations
- File upload/download endpoints
- REST APIs complementing MCP functionality
- Static file serving for assets and documentation

## Implementation Highlights

**Zero Dependencies** - Uses only Node.js built-ins for maximum compatibility

**Backward Compatible** - All existing MCP functionality unchanged, including existing OAuth discovery endpoints

**Route Priority** - Custom routes processed _before_ built-in endpoints (health, OAuth), allowing overrides

**Comprehensive Testing** - 15 new test cases covering all scenarios:

- HTTP methods, path/query parameters, authentication
- Public routes, wildcards, concurrent requests, error handling
- Integration with existing MCP tools and endpoints

**Complete Documentation** - Updated README with examples and API reference

## Technical Implementation

The implementation extends the existing `#handleUnhandledRequest` method as suggested, with:

- **Route matching engine** with parameter extraction and wildcard support
- **Enhanced request object** with helper methods for body parsing
- **Chainable response object** with status codes and content-type handling
- **Public route system** that bypasses authentication when needed
- **Error boundary** for graceful handling of route handler exceptions

## Usage Example

```typescript
import { FastMCP } from "@jordanburke/fastmcp";

const server = new FastMCP({ name: "MyServer", version: "1.0.0" });

// REST API endpoint
server.addRoute("GET", "/api/users/:id", async (req, res) => {
  res.json({ userId: req.params.id, query: req.query });
});

// Admin interface
server.addRoute("GET", "/admin", async (req, res) => {
  res.send("<html><body><h1>Admin Panel</h1></body></html>");
});

// Public webhook (no auth required)
server.addRoute(
  "POST",
  "/webhook/github",
  async (req, res) => {
    const payload = await req.json();
    res.json({ received: true });
  },
  { public: true },
);
```
