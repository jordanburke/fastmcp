#!/usr/bin/env node

/**
 * Example FastMCP server demonstrating custom HTTP routes alongside MCP endpoints.
 *
 * This example shows how to:
 * - Add REST API endpoints
 * - Handle file uploads
 * - Serve admin interfaces
 * - Create webhooks
 * - Integrate custom routes with MCP tools
 *
 * Run with:
 *   npx fastmcp dev src/examples/custom-routes.ts
 *   npx fastmcp inspect src/examples/custom-routes.ts
 *
 * Or directly:
 *   node dist/examples/custom-routes.js --transport=http-stream --port=8080
 */

import { z } from "zod";

import { FastMCP } from "../FastMCP.js";

// Example in-memory data store
interface User {
  email: string;
  id: string;
  name: string;
}

const users = new Map<string, User>([
  ["1", { email: "alice@example.com", id: "1", name: "Alice" }],
  ["2", { email: "bob@example.com", id: "2", name: "Bob" }],
]);

let requestCount = 0;

// Create the FastMCP server
const server = new FastMCP({
  name: "custom-routes-example",
  version: "1.0.0",
});

// Add custom routes for a REST API
server.addRoute("GET", "/api/users", async (_req, res) => {
  const userList = Array.from(users.values());
  res.json({
    count: userList.length,
    users: userList,
  });
});

server.addRoute("GET", "/api/users/:id", async (req, res) => {
  const user = users.get(req.params.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

server.addRoute("POST", "/api/users", async (req, res) => {
  const body = (await req.json()) as { email: string; name: string };

  if (!body.name || !body.email) {
    res.status(400).json({ error: "Name and email are required" });
    return;
  }

  const id = String(users.size + 1);
  const newUser: User = {
    email: body.email,
    id,
    name: body.name,
  };

  users.set(id, newUser);
  res.status(201).json(newUser);
});

server.addRoute("PUT", "/api/users/:id", async (req, res) => {
  const user = users.get(req.params.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const body = (await req.json()) as Partial<User>;
  const updatedUser = { ...user, ...body, id: user.id };
  users.set(user.id, updatedUser);
  res.json(updatedUser);
});

server.addRoute("DELETE", "/api/users/:id", async (req, res) => {
  if (!users.has(req.params.id)) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  users.delete(req.params.id);
  res.status(204).end();
});

// Add a simple admin dashboard
server.addRoute("GET", "/admin", async (_req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Admin Dashboard</title>
      <style>
        body { font-family: sans-serif; margin: 40px; }
        h1 { color: #333; }
        .stats { background: #f0f0f0; padding: 20px; border-radius: 8px; }
        .stat { margin: 10px 0; }
      </style>
    </head>
    <body>
      <h1>Admin Dashboard</h1>
      <div class="stats">
        <div class="stat">Total Users: ${users.size}</div>
        <div class="stat">Request Count: ${requestCount}</div>
        <div class="stat">Server Time: ${new Date().toISOString()}</div>
      </div>
      <h2>Users</h2>
      <ul>
        ${Array.from(users.values())
          .map((u) => `<li>${u.name} (${u.email})</li>`)
          .join("")}
      </ul>
    </body>
    </html>
  `;
  res.send(html);
});

// Add a webhook endpoint
server.addRoute("POST", "/webhook/github", async (req, res) => {
  const payload = await req.json();
  const event = req.headers["x-github-event"];

  console.log(`GitHub webhook received: ${event}`, payload);

  // Process webhook (e.g., trigger MCP tools)
  res.json({ event, received: true });
});

// Add a file upload endpoint
server.addRoute("POST", "/upload", async (req, res) => {
  try {
    const body = await req.text();
    const size = Buffer.byteLength(body);

    res.json({
      message: "File received",
      size: `${size} bytes`,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Upload failed",
    });
  }
});

// Add middleware-like request counting
server.addRoute("GET", "/stats", async (_req, res) => {
  requestCount++;
  res.json({
    requests: requestCount,
    timestamp: Date.now(),
    uptime: process.uptime(),
  });
});

// Add MCP tools that can interact with the custom routes
server.addTool({
  description: "List all users from the REST API",
  execute: async () => {
    const userList = Array.from(users.values());
    return {
      content: [
        {
          text: `Found ${userList.length} users:\n${userList
            .map((u) => `- ${u.name} (${u.email})`)
            .join("\n")}`,
          type: "text",
        },
      ],
    };
  },
  name: "list_users",
  parameters: z.object({}),
});

server.addTool({
  description: "Create a new user via the REST API",
  execute: async ({ email, name }) => {
    const id = String(users.size + 1);
    const newUser: User = { email, id, name };
    users.set(id, newUser);

    return {
      content: [
        {
          text: `User created successfully:\nID: ${id}\nName: ${name}\nEmail: ${email}`,
          type: "text",
        },
      ],
    };
  },
  name: "create_user",
  parameters: z.object({
    email: z.string().email(),
    name: z.string(),
  }),
});

server.addTool({
  description: "Get server statistics",
  execute: async () => {
    return {
      content: [
        {
          text: `Server Statistics:
- Total Users: ${users.size}
- Request Count: ${requestCount}
- Uptime: ${Math.floor(process.uptime())} seconds
- Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
          type: "text",
        },
      ],
    };
  },
  name: "get_stats",
  parameters: z.object({}),
});

// Add a resource that exposes the user list
server.addResource({
  description: "Current user database",
  load: async () => ({
    text: JSON.stringify(Array.from(users.values()), null, 2),
  }),
  mimeType: "application/json",
  name: "user-database",
  uri: "resource://users",
});

// Start the server
const PORT = process.env.FASTMCP_PORT
  ? parseInt(process.env.FASTMCP_PORT)
  : 8080;

server
  .start({
    httpStream: { port: PORT },
    transportType: "httpStream",
  })
  .then(() => {
    console.log(`
🚀 Custom Routes Example Server Started!

MCP Endpoint: http://localhost:${PORT}/mcp
Health Check: http://localhost:${PORT}/health

Custom Routes:
- REST API:     http://localhost:${PORT}/api/users
- Admin Panel:  http://localhost:${PORT}/admin
- Statistics:   http://localhost:${PORT}/stats
- File Upload:  http://localhost:${PORT}/upload
- GitHub Hook:  http://localhost:${PORT}/webhook/github

Try these commands:
- List users:     curl http://localhost:${PORT}/api/users
- Get user:       curl http://localhost:${PORT}/api/users/1
- Create user:    curl -X POST http://localhost:${PORT}/api/users -H "Content-Type: application/json" -d '{"name":"Charlie","email":"charlie@example.com"}'
- Admin panel:    open http://localhost:${PORT}/admin
- Upload file:    curl -X POST http://localhost:${PORT}/upload -d "Hello World"

MCP Tools available:
- list_users
- create_user
- get_stats

Test with MCP Inspector:
npx fastmcp inspect src/examples/custom-routes.ts
  `);
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
