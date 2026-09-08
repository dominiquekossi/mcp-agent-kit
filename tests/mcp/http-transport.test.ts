/**
 * End-to-end test over Streamable HTTP: our own MCP server, consumed by our
 * own orchestrator.
 *
 * This is the case the removed WebSocket transport claimed to cover — it
 * accepted connections and answered nothing, while getStatus() reported the
 * server as healthy.
 */

import { createMCPServer, MCPServer } from "../../src/mcp/createServer";
import { connectMCP, MCPOrchestrator } from "../../src/mcp/client/connectMCP";

const PORT = 7911;
const URL = `http://localhost:${PORT}/mcp`;

describe("MCP over Streamable HTTP", () => {
  let server: MCPServer;
  let mcp: MCPOrchestrator | undefined;

  beforeAll(async () => {
    server = await createMCPServer({
      name: "http-test-server",
      port: PORT,
      logLevel: "error",
      tools: [
        {
          name: "greet",
          description: "Greet someone",
          inputSchema: {
            type: "object",
            properties: { name: { type: "string" } },
            required: ["name"],
          },
          handler: async ({ name }: any) => `Hello, ${name}!`,
        },
        {
          name: "stats",
          description: "Return a structured payload",
          inputSchema: { type: "object", properties: {} },
          handler: async () => ({ users: 1250, active: 890 }),
        },
      ],
    });

    await server.start("http");
  }, 30000);

  afterAll(async () => {
    await mcp?.close();
    await server.stop();
  }, 30000);

  it("reports the served URL in its status", () => {
    expect(server.getStatus()).toMatchObject({
      running: true,
      transport: "http",
      tools: 2,
      url: URL,
    });
  });

  it("answers a real MCP client over HTTP", async () => {
    mcp = await connectMCP({
      servers: { remote: { url: URL } },
      logLevel: "error",
    });

    expect(mcp.listServers()[0]).toMatchObject({
      name: "remote",
      state: "connected",
      transport: "http",
      toolsAvailable: 2,
    });

    expect(mcp.getTools().map((t) => t.name).sort()).toEqual([
      "remote__greet",
      "remote__stats",
    ]);
  }, 30000);

  it("executes tools across the HTTP transport", async () => {
    mcp =
      mcp ||
      (await connectMCP({ servers: { remote: { url: URL } }, logLevel: "error" }));

    await expect(mcp.callTool("remote__greet", { name: "Dominique" })).resolves.toBe(
      "Hello, Dominique!"
    );

    await expect(mcp.callTool("remote__stats", {})).resolves.toEqual({
      users: 1250,
      active: 890,
    });
  }, 30000);

  it("rejects the removed websocket transport with a clear message", async () => {
    const other = await createMCPServer({
      name: "ws-attempt",
      port: PORT + 1,
      logLevel: "error",
    });

    await expect(other.start("websocket" as any)).rejects.toThrow(
      /removed in v1\.2\.0/
    );
  }, 30000);
});
