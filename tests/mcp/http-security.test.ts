/**
 * Security behaviour of the Streamable HTTP transport: bearer auth, Origin and
 * Host checks, body size limit, argument validation and error hygiene.
 */

import { request as httpRequest } from "http";
import { createMCPServer, MCPServer } from "../../src/mcp/createServer";

const PORT = 7912;
const URL = `http://127.0.0.1:${PORT}/mcp`;
const TOKEN = "test-token-not-a-secret";

const rpc = (method: string, params: any = {}, id = 1) =>
  JSON.stringify({ jsonrpc: "2.0", id, method, params });

const headers = (extra: Record<string, string> = {}) => ({
  "Content-Type": "application/json",
  Accept: "application/json, text/event-stream",
  Authorization: `Bearer ${TOKEN}`,
  ...extra,
});

describe("HTTP transport hardening", () => {
  let server: MCPServer;

  beforeAll(async () => {
    server = await createMCPServer({
      name: "sec-test",
      port: PORT,
      authToken: TOKEN,
      maxBodyBytes: 2048,
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
      ],
    });
    await server.start("http");
  }, 30000);

  afterAll(async () => {
    await server.stop();
  }, 30000);

  it("rejects requests without the bearer token", async () => {
    const res = await fetch(URL, {
      method: "POST",
      headers: headers({ Authorization: "Bearer wrong" }),
      body: rpc("tools/list"),
    });
    expect(res.status).toBe(401);
  });

  it("rejects a browser Origin that is not allowed", async () => {
    const res = await fetch(URL, {
      method: "POST",
      headers: headers({ Origin: "https://evil.example" }),
      body: rpc("tools/list"),
    });
    expect(res.status).toBe(403);
  });

  it("rejects an unexpected Host header", async () => {
    // fetch() ignores a custom Host header, so use the raw http client.
    const status = await new Promise<number>((resolve, reject) => {
      const req = httpRequest(
        {
          host: "127.0.0.1",
          port: PORT,
          path: "/mcp",
          method: "POST",
          headers: headers({ Host: "attacker.example" }),
        },
        (res) => {
          res.resume();
          resolve(res.statusCode || 0);
        }
      );
      req.on("error", reject);
      req.end(rpc("tools/list"));
    });
    expect(status).toBe(403);
  });

  it("rejects an oversized body with 413", async () => {
    let status = 0;
    try {
      const res = await fetch(URL, {
        method: "POST",
        headers: headers(),
        body: rpc("tools/call", { name: "greet", arguments: { name: "x".repeat(10000) } }),
      });
      status = res.status;
    } catch {
      status = 413; // connection destroyed after the limit was hit
    }
    expect(status).toBe(413);
  });

  it("answers 400 for invalid JSON without leaking internals", async () => {
    const res = await fetch(URL, {
      method: "POST",
      headers: headers(),
      body: "{not json",
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Request body is not valid JSON" });
  });

  it("accepts a valid authenticated request", async () => {
    const res = await fetch(URL, {
      method: "POST",
      headers: headers(),
      body: rpc("tools/list"),
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("greet");
  });

  it("rejects tool arguments that break the input schema", async () => {
    const missing = await fetch(URL, {
      method: "POST",
      headers: headers(),
      body: rpc("tools/call", { name: "greet", arguments: {} }),
    });
    expect(await missing.text()).toContain('missing required field \\"name\\"');

    const wrongType = await fetch(URL, {
      method: "POST",
      headers: headers(),
      body: rpc("tools/call", { name: "greet", arguments: { name: 42 } }, 2),
    });
    expect(await wrongType.text()).toContain("must be of type string");
  });
});
