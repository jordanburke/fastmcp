import { LATEST_PROTOCOL_VERSION } from "@modelcontextprotocol/sdk/types.js";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { EdgeFastMCP } from "./index.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonResponse = any;

describe("EdgeFastMCP", () => {
  it("should handle initialize request", async () => {
    const server = new EdgeFastMCP({
      name: "TestServer",
      version: "1.0.0",
    });

    const response = await server.fetch(
      new Request("http://localhost/mcp", {
        body: JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          method: "initialize",
          params: {
            capabilities: {},
            clientInfo: { name: "test-client", version: "1.0.0" },
            protocolVersion: LATEST_PROTOCOL_VERSION,
          },
        }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    const body: JsonResponse = await response.json();
    expect(body.jsonrpc).toBe("2.0");
    expect(body.id).toBe(1);
    expect(body.result.serverInfo.name).toBe("TestServer");
    expect(body.result.serverInfo.version).toBe("1.0.0");
  });

  it("should list tools", async () => {
    const server = new EdgeFastMCP({
      name: "TestServer",
      version: "1.0.0",
    });

    server.addTool({
      description: "Greet someone",
      execute: async ({ name }) => `Hello, ${name}!`,
      name: "greet",
      parameters: z.object({ name: z.string() }),
    });

    const response = await server.fetch(
      new Request("http://localhost/mcp", {
        body: JSON.stringify({
          id: 2,
          jsonrpc: "2.0",
          method: "tools/list",
        }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    const body: JsonResponse = await response.json();
    expect(body.result.tools).toHaveLength(1);
    expect(body.result.tools[0].name).toBe("greet");
    expect(body.result.tools[0].description).toBe("Greet someone");
  });

  it("should call a tool", async () => {
    const server = new EdgeFastMCP({
      name: "TestServer",
      version: "1.0.0",
    });

    server.addTool({
      description: "Greet someone",
      execute: async ({ name }) => `Hello, ${name}!`,
      name: "greet",
      parameters: z.object({ name: z.string() }),
    });

    const response = await server.fetch(
      new Request("http://localhost/mcp", {
        body: JSON.stringify({
          id: 3,
          jsonrpc: "2.0",
          method: "tools/call",
          params: {
            arguments: { name: "World" },
            name: "greet",
          },
        }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    const body: JsonResponse = await response.json();
    expect(body.result.content).toEqual([
      { text: "Hello, World!", type: "text" },
    ]);
  });

  it("should list resources", async () => {
    const server = new EdgeFastMCP({
      name: "TestServer",
      version: "1.0.0",
    });

    server.addResource({
      description: "A test resource",
      load: async () => "Test content",
      mimeType: "text/plain",
      name: "Test Resource",
      uri: "test://resource",
    });

    const response = await server.fetch(
      new Request("http://localhost/mcp", {
        body: JSON.stringify({
          id: 4,
          jsonrpc: "2.0",
          method: "resources/list",
        }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    const body: JsonResponse = await response.json();
    expect(body.result.resources).toHaveLength(1);
    expect(body.result.resources[0].uri).toBe("test://resource");
  });

  it("should read a resource", async () => {
    const server = new EdgeFastMCP({
      name: "TestServer",
      version: "1.0.0",
    });

    server.addResource({
      load: async () => "Test content",
      name: "Test Resource",
      uri: "test://resource",
    });

    const response = await server.fetch(
      new Request("http://localhost/mcp", {
        body: JSON.stringify({
          id: 5,
          jsonrpc: "2.0",
          method: "resources/read",
          params: { uri: "test://resource" },
        }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    const body: JsonResponse = await response.json();
    expect(body.result.contents[0].text).toBe("Test content");
  });

  it("should list prompts", async () => {
    const server = new EdgeFastMCP({
      name: "TestServer",
      version: "1.0.0",
    });

    server.addPrompt({
      arguments: [
        { description: "First argument", name: "arg1", required: true },
      ],
      description: "A test prompt",
      load: async (args) => `Prompt with ${args.arg1}`,
      name: "test_prompt",
    });

    const response = await server.fetch(
      new Request("http://localhost/mcp", {
        body: JSON.stringify({
          id: 6,
          jsonrpc: "2.0",
          method: "prompts/list",
        }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    const body: JsonResponse = await response.json();
    expect(body.result.prompts).toHaveLength(1);
    expect(body.result.prompts[0].name).toBe("test_prompt");
  });

  it("should get a prompt", async () => {
    const server = new EdgeFastMCP({
      name: "TestServer",
      version: "1.0.0",
    });

    server.addPrompt({
      description: "A test prompt",
      load: async (args) => `Prompt with ${args.value ?? "default"}`,
      name: "test_prompt",
    });

    const response = await server.fetch(
      new Request("http://localhost/mcp", {
        body: JSON.stringify({
          id: 7,
          jsonrpc: "2.0",
          method: "prompts/get",
          params: { arguments: { value: "test" }, name: "test_prompt" },
        }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    const body: JsonResponse = await response.json();
    expect(body.result.messages[0].content.text).toBe("Prompt with test");
  });

  it("should handle health check", async () => {
    const server = new EdgeFastMCP({
      name: "TestServer",
      version: "1.0.0",
    });

    const response = await server.fetch(new Request("http://localhost/health"));

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("Ok");
  });

  it("should handle ping", async () => {
    const server = new EdgeFastMCP({
      name: "TestServer",
      version: "1.0.0",
    });

    const response = await server.fetch(
      new Request("http://localhost/mcp", {
        body: JSON.stringify({
          id: 8,
          jsonrpc: "2.0",
          method: "ping",
        }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    const body: JsonResponse = await response.json();
    expect(body.result).toEqual({});
  });

  it("should return error for invalid JSON", async () => {
    const server = new EdgeFastMCP({
      name: "TestServer",
      version: "1.0.0",
    });

    const response = await server.fetch(
      new Request("http://localhost/mcp", {
        body: "not json",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    const body: JsonResponse = await response.json();
    expect(body.error.code).toBe(-32700);
  });

  it("should return 406 for wrong Accept header", async () => {
    const server = new EdgeFastMCP({
      name: "TestServer",
      version: "1.0.0",
    });

    const response = await server.fetch(
      new Request("http://localhost/mcp", {
        body: JSON.stringify({}),
        headers: {
          Accept: "text/html",
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(406);
  });

  it("should allow custom MCP path", async () => {
    const server = new EdgeFastMCP({
      mcpPath: "/api/mcp",
      name: "TestServer",
      version: "1.0.0",
    });

    const response = await server.fetch(
      new Request("http://localhost/api/mcp", {
        body: JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          method: "ping",
        }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
  });

  it("should support custom routes via getApp()", async () => {
    const server = new EdgeFastMCP({
      name: "TestServer",
      version: "1.0.0",
    });

    // Add custom routes using Hono's native API
    const app = server.getApp();
    app.get("/api/status", (c) => c.json({ status: "ok" }));
    app.get("/api/users/:id", (c) => {
      const id = c.req.param("id");
      return c.json({ userId: id });
    });
    app.post("/api/echo", async (c) => {
      const body = await c.req.json();
      return c.json({ received: body });
    });

    // Test GET /api/status
    const statusResponse = await server.fetch(
      new Request("http://localhost/api/status", {
        headers: { Accept: "application/json" },
        method: "GET",
      }),
    );
    expect(statusResponse.status).toBe(200);
    const statusBody = (await statusResponse.json()) as { status: string };
    expect(statusBody).toEqual({ status: "ok" });

    // Test GET /api/users/:id with path parameter
    const userResponse = await server.fetch(
      new Request("http://localhost/api/users/123", {
        headers: { Accept: "application/json" },
        method: "GET",
      }),
    );
    expect(userResponse.status).toBe(200);
    const userBody = (await userResponse.json()) as { userId: string };
    expect(userBody).toEqual({ userId: "123" });

    // Test POST /api/echo with JSON body
    const echoResponse = await server.fetch(
      new Request("http://localhost/api/echo", {
        body: JSON.stringify({ message: "hello" }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );
    expect(echoResponse.status).toBe(200);
    const echoBody = (await echoResponse.json()) as {
      received: { message: string };
    };
    expect(echoBody).toEqual({ received: { message: "hello" } });
  });

  it("should allow custom routes alongside MCP endpoints", async () => {
    const server = new EdgeFastMCP({
      name: "TestServer",
      version: "1.0.0",
    });

    server.addTool({
      description: "Test tool",
      execute: async () => "Tool result",
      name: "test",
      parameters: z.object({}),
    });

    // Add a custom route
    const app = server.getApp();
    app.get("/", (c) => c.html("<h1>Welcome</h1>"));

    // Test custom route
    const htmlResponse = await server.fetch(
      new Request("http://localhost/", {
        method: "GET",
      }),
    );
    expect(htmlResponse.status).toBe(200);
    const html = await htmlResponse.text();
    expect(html).toContain("<h1>Welcome</h1>");

    // Test MCP endpoint still works
    const mcpResponse = await server.fetch(
      new Request("http://localhost/mcp", {
        body: JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          method: "tools/list",
        }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );
    expect(mcpResponse.status).toBe(200);
    const mcpBody = (await mcpResponse.json()) as {
      result: { tools: Array<{ name: string }> };
    };
    expect(mcpBody.result.tools).toHaveLength(1);
    expect(mcpBody.result.tools[0].name).toBe("test");
  });
});
