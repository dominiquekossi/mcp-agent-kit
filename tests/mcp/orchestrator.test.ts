/**
 * Integration tests for the MCP orchestrator.
 *
 * These run against a real MCP server over stdio (tests/fixtures), so they
 * exercise the actual protocol rather than a mock of it.
 */

import { join } from "path";
import { connectMCP, MCPOrchestrator, matchesPattern } from "../../src/mcp/client/connectMCP";
import { createAgent } from "../../src/agent/createAgent";

const FIXTURE = join(__dirname, "..", "fixtures", "mcp-test-server.mjs");

const testServer = () => ({
  command: process.execPath, // the node binary running the tests
  args: [FIXTURE],
});

describe("matchesPattern", () => {
  it("matches exact names and globs", () => {
    expect(matchesPattern("github__create_issue", "github__create_issue")).toBe(true);
    expect(matchesPattern("github__create_issue", "github__*")).toBe(true);
    expect(matchesPattern("github__create_issue", "*")).toBe(true);
    expect(matchesPattern("files__read", "github__*")).toBe(false);
    expect(matchesPattern("read_file", "*_file")).toBe(true);
  });

  it("does not treat dots as wildcards", () => {
    expect(matchesPattern("axb", "a.b")).toBe(false);
    expect(matchesPattern("a.b", "a.b")).toBe(true);
  });
});

describe("MCP orchestrator", () => {
  const open: MCPOrchestrator[] = [];

  const track = (mcp: MCPOrchestrator) => {
    open.push(mcp);
    return mcp;
  };

  afterEach(async () => {
    await Promise.all(open.map((mcp) => mcp.close()));
    open.length = 0;
  });

  it("connects to a real MCP server and namespaces its tools", async () => {
    const mcp = track(await connectMCP({ servers: { test: testServer() }, logLevel: "error" }));

    const names = mcp.getTools().map((t) => t.name).sort();

    expect(names).toEqual([
      "test__add",
      "test__echo",
      "test__explode",
      "test__secret",
    ]);

    const status = mcp.listServers();
    expect(status[0]).toMatchObject({
      name: "test",
      state: "connected",
      transport: "stdio",
      tools: 4,
      toolsAvailable: 4,
    });
  }, 30000);

  it("calls a tool and returns its value", async () => {
    const mcp = track(await connectMCP({ servers: { test: testServer() }, logLevel: "error" }));

    const echoed = await mcp.callTool("test__echo", { message: "hello mcp" });
    expect(echoed).toBe("hello mcp");

    // JSON text content comes back parsed, not as an escaped string.
    const sum = await mcp.callTool("test__add", { a: 2, b: 40 });
    expect(sum).toEqual({ sum: 42 });
  }, 30000);

  it("runs a tool through the AgentTool handler", async () => {
    const mcp = track(await connectMCP({ servers: { test: testServer() }, logLevel: "error" }));

    const addTool = mcp.getTools().find((t) => t.name === "test__add")!;

    expect(addTool.description).toBe("Add two numbers");
    expect(addTool.parameters.required).toEqual(["a", "b"]);
    await expect(addTool.handler({ a: 1, b: 1 })).resolves.toEqual({ sum: 2 });
  }, 30000);

  it("surfaces tool failures as errors", async () => {
    const mcp = track(await connectMCP({ servers: { test: testServer() }, logLevel: "error" }));

    await expect(mcp.callTool("test__explode", {})).rejects.toThrow();

    const stats = mcp.getStats();
    expect(stats.failedCalls).toBe(1);
  }, 30000);

  it("filters tools per server", async () => {
    const mcp = track(
      await connectMCP({
        servers: { test: { ...testServer(), denyTools: ["secret", "explode"] } },
        logLevel: "error",
      })
    );

    const names = mcp.getTools().map((t) => t.name).sort();
    expect(names).toEqual(["test__add", "test__echo"]);

    // The server still offers four; we expose two.
    expect(mcp.listServers()[0]).toMatchObject({ tools: 2, toolsAvailable: 4 });
  }, 30000);

  it("filters tools globally with a namespaced glob", async () => {
    const mcp = track(
      await connectMCP({
        servers: { test: testServer() },
        allowTools: ["test__ec*", "test__add"],
        logLevel: "error",
      })
    );

    expect(mcp.getTools().map((t) => t.name).sort()).toEqual([
      "test__add",
      "test__echo",
    ]);
  }, 30000);

  it("aggregates tools from several servers", async () => {
    const mcp = track(
      await connectMCP({
        servers: {
          alpha: { ...testServer(), allowTools: ["echo"] },
          beta: { ...testServer(), allowTools: ["add"] },
        },
        logLevel: "error",
      })
    );

    expect(mcp.getTools().map((t) => t.name).sort()).toEqual([
      "alpha__echo",
      "beta__add",
    ]);
    expect(mcp.getServerTools("alpha").map((t) => t.name)).toEqual(["alpha__echo"]);
    expect(mcp.getStats().connected).toBe(2);
  }, 30000);

  it("keeps working when one server is down", async () => {
    const mcp = track(
      await connectMCP({
        servers: {
          good: testServer(),
          broken: { command: process.execPath, args: ["/does/not/exist.mjs"] },
        },
        connectTimeout: 8000,
        logLevel: "error",
      })
    );

    const states = Object.fromEntries(
      mcp.listServers().map((s) => [s.name, s.state])
    );

    expect(states.good).toBe("connected");
    expect(states.broken).toBe("failed");

    // The healthy server's tools are still usable.
    await expect(mcp.callTool("good__echo", { message: "still here" })).resolves.toBe(
      "still here"
    );
  }, 40000);

  it("fails the whole connect in strict mode", async () => {
    await expect(
      connectMCP({
        servers: { broken: { command: process.execPath, args: ["/does/not/exist.mjs"] } },
        strict: true,
        connectTimeout: 8000,
        logLevel: "error",
      })
    ).rejects.toThrow(/broken/);
  }, 40000);

  it("skips disabled servers", async () => {
    const mcp = track(
      await connectMCP({
        servers: { test: { ...testServer(), enabled: false } },
        logLevel: "error",
      })
    );

    expect(mcp.getTools()).toHaveLength(0);
    expect(mcp.listServers()[0].state).toBe("disabled");
  }, 30000);

  it("rejects a call to an unknown server or a bare tool name", async () => {
    const mcp = track(await connectMCP({ servers: { test: testServer() }, logLevel: "error" }));

    await expect(mcp.callTool("nope__thing", {})).rejects.toThrow(/Unknown MCP server/);
    await expect(mcp.callTool("bare", {})).rejects.toThrow(/not namespaced/);
  }, 30000);

  it("records call duration and outcome", async () => {
    const mcp = track(await connectMCP({ servers: { test: testServer() }, logLevel: "error" }));

    await mcp.callTool("test__echo", { message: "x" });

    const [record] = mcp.getCallLog();
    expect(record).toMatchObject({ server: "test", tool: "echo", ok: true });
    expect(record.durationMs).toBeGreaterThanOrEqual(0);
  }, 30000);

  it("plugs into an agent through use()", async () => {
    const mcp = track(await connectMCP({ servers: { test: testServer() }, logLevel: "error" }));

    const agent = createAgent({ provider: "openai", apiKey: "test-key" });
    agent.use(mcp);

    expect(agent.listTools().map((t) => t.name).sort()).toEqual([
      "test__add",
      "test__echo",
      "test__explode",
      "test__secret",
    ]);

    // The agent can run an MCP tool through its own execution path.
    await expect(agent.executeTool("test__add", { a: 20, b: 22 })).resolves.toEqual({
      sum: 42,
    });

    agent.cleanup();
  }, 30000);

  it("closes cleanly and reports closed state", async () => {
    const mcp = await connectMCP({ servers: { test: testServer() }, logLevel: "error" });

    await mcp.close();

    expect(mcp.listServers()[0].state).toBe("closed");
    expect(mcp.getTools()).toHaveLength(0);
    // Closing twice must not throw.
    await expect(mcp.close()).resolves.toBeUndefined();
  }, 30000);
});
