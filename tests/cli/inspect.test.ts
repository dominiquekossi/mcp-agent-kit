/**
 * Tests for the `inspect` command: argument parsing, schema validation, and
 * the end-to-end run against a real MCP server.
 */

import { join } from "path";
import { parseInspectArgs, runInspect } from "../../src/cli/inspect";
import { describeParameters, validateTools } from "../../src/cli/validate";

const GOOD_SERVER = join(__dirname, "..", "fixtures", "mcp-test-server.mjs");
const BAD_SERVER = join(__dirname, "..", "fixtures", "mcp-invalid-server.mjs");

describe("validateTools", () => {
  it("accepts a well-formed tool", () => {
    const issues = validateTools([
      {
        name: "read_file",
        description: "Read a file from disk",
        inputSchema: {
          type: "object",
          properties: { path: { type: "string", description: "File path" } },
          required: ["path"],
        },
      },
    ]);

    expect(issues).toEqual([]);
  });

  it("rejects names LLM providers will not accept", () => {
    const issues = validateTools([
      {
        name: "bad tool name!",
        description: "Has spaces and punctuation",
        inputSchema: { type: "object", properties: {} },
      },
    ]);

    expect(issues).toContainEqual(
      expect.objectContaining({ level: "error", tool: "bad tool name!" })
    );
  });

  it("catches a required key with no matching property", () => {
    const issues = validateTools([
      {
        name: "add",
        description: "Add two numbers",
        inputSchema: {
          type: "object",
          properties: { a: { type: "number", description: "x" } },
          required: ["a", "precision"],
        },
      },
    ]);

    const errors = issues.filter((i) => i.level === "error");
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("precision");
  });

  it("flags a missing or non-object schema", () => {
    const missing = validateTools([{ name: "a", description: "no schema" }]);
    expect(missing).toContainEqual(
      expect.objectContaining({ level: "error", message: "no inputSchema" })
    );

    const wrongType = validateTools([
      { name: "b", description: "wrong type", inputSchema: { type: "array" } },
    ]);
    expect(wrongType.some((i) => i.message.includes('must be "object"'))).toBe(true);
  });

  it("flags duplicate tool names", () => {
    const issues = validateTools([
      { name: "dup", description: "first one", inputSchema: { type: "object", properties: {} } },
      { name: "dup", description: "second one", inputSchema: { type: "object", properties: {} } },
    ]);

    expect(issues.some((i) => i.message.includes("declared 2 times"))).toBe(true);
  });

  it("warns about missing descriptions without erroring", () => {
    const issues = validateTools([
      {
        name: "thing",
        inputSchema: { type: "object", properties: { x: { type: "string" } } },
      },
    ]);

    expect(issues.every((i) => i.level === "warning")).toBe(true);
    expect(issues.length).toBeGreaterThan(0);
  });
});

describe("describeParameters", () => {
  it("marks optional parameters", () => {
    expect(
      describeParameters({
        type: "object",
        properties: { path: { type: "string" }, depth: { type: "number" } },
        required: ["path"],
      })
    ).toBe("{ path: string, depth?: number }");
  });

  it("handles an empty schema", () => {
    expect(describeParameters({ type: "object", properties: {} })).toBe("{}");
    expect(describeParameters(undefined)).toBe("{}");
  });
});

describe("parseInspectArgs", () => {
  it("reads a stdio target with its own arguments", () => {
    const { spec, label } = parseInspectArgs([
      "npx",
      "-y",
      "@modelcontextprotocol/server-filesystem",
      "./",
    ]);

    expect(spec).toMatchObject({
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "./"],
    });
    expect(label).toBe("npx -y @modelcontextprotocol/server-filesystem ./");
  });

  it("reads an http target with headers", () => {
    const { spec } = parseInspectArgs([
      "-H",
      "Authorization: Bearer abc123",
      "https://mcp.example.com/mcp",
    ]);

    expect(spec).toMatchObject({
      url: "https://mcp.example.com/mcp",
      headers: { Authorization: "Bearer abc123" },
    });
  });

  it("reads flags before the target only", () => {
    const { options, spec } = parseInspectArgs([
      "--json",
      "--timeout",
      "5000",
      "node",
      "server.mjs",
      "--json",
    ]);

    expect(options.json).toBe(true);
    expect(options.timeout).toBe(5000);
    // The trailing --json belongs to the server's command line, not to us.
    expect((spec as any).args).toEqual(["server.mjs", "--json"]);
  });

  it("parses --call and --args", () => {
    const { options } = parseInspectArgs([
      "--call",
      "read_file",
      "--args",
      '{"path":"README.md"}',
      "node",
      "server.mjs",
    ]);

    expect(options.call).toBe("read_file");
    expect(options.args).toEqual({ path: "README.md" });
  });

  it("rejects an unknown flag, malformed --args and a missing target", () => {
    expect(() => parseInspectArgs(["--nope", "node"])).toThrow(/Unknown option/);
    expect(() => parseInspectArgs(["--args", "{oops", "node"])).toThrow(/not valid JSON/);
    expect(() => parseInspectArgs([])).toThrow(/No target/);
  });
});

describe("runInspect", () => {
  let out: string[];
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    out = [];
    logSpy = jest.spyOn(console, "log").mockImplementation((...args) => {
      out.push(args.join(" "));
    });
    errorSpy = jest.spyOn(console, "error").mockImplementation((...args) => {
      out.push(args.join(" "));
    });
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("exits 0 for a server whose schemas are valid", async () => {
    const code = await runInspect(["node", GOOD_SERVER]);

    expect(code).toBe(0);
    expect(out.join("\n")).toContain("4 tool(s)");
  }, 30000);

  it("exits 1 when a schema has errors", async () => {
    const code = await runInspect(["node", BAD_SERVER]);

    expect(code).toBe(1);

    const report = out.join("\n");
    expect(report).toContain("required lists");
    expect(report).toContain("name must match");
  }, 30000);

  it("exits 2 when the server cannot be reached", async () => {
    const code = await runInspect([
      "--timeout",
      "5000",
      "node",
      join(__dirname, "does-not-exist.mjs"),
    ]);

    expect(code).toBe(2);
    expect(out.join("\n")).toContain("could not connect");
  }, 30000);

  it("emits machine-readable JSON with --json", async () => {
    const code = await runInspect(["--json", "node", GOOD_SERVER]);

    expect(code).toBe(0);

    const payload = JSON.parse(out.join("\n"));
    expect(payload).toMatchObject({
      transport: "stdio",
      connected: true,
      summary: { tools: 4, errors: 0 },
    });
    expect(payload.tools.map((t: any) => t.name)).toContain("add");
    expect(typeof payload.timings.connectMs).toBe("number");
  }, 30000);

  it("calls a tool with --call and reports the result", async () => {
    const code = await runInspect([
      "--json",
      "--call",
      "add",
      "--args",
      '{"a":20,"b":22}',
      "node",
      GOOD_SERVER,
    ]);

    expect(code).toBe(0);

    const payload = JSON.parse(out.join("\n"));
    expect(payload.call).toMatchObject({ tool: "add", ok: true });
    expect(payload.call.value).toEqual({ sum: 42 });
  }, 30000);

  it("reports a failing --call without failing the inspection", async () => {
    const code = await runInspect([
      "--json",
      "--call",
      "explode",
      "node",
      GOOD_SERVER,
    ]);

    expect(code).toBe(0);

    const payload = JSON.parse(out.join("\n"));
    expect(payload.call).toMatchObject({ tool: "explode", ok: false });
    expect(payload.call.error).toBeTruthy();
  }, 30000);
});
