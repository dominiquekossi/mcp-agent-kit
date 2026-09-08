/**
 * Tests for the agent tool-execution loop.
 *
 * These cover the gap that let the "tools are automatically called" promise
 * ship broken: chat() returned the raw tool calls and never ran a handler.
 */

import { createAgent, Agent } from "../../src/agent/createAgent";
import { AgentResponse, AgentTool } from "../../src/types";

/** Queue of provider replies, so a test can script a multi-turn exchange. */
function mockProvider(agent: Agent, replies: Partial<AgentResponse>[]) {
  const calls: any[][] = [];
  let index = 0;

  (agent as any).provider = {
    chat: async (messages: any[]) => {
      calls.push(messages.map((m) => ({ ...m })));
      const reply = replies[Math.min(index, replies.length - 1)];
      index++;
      return {
        content: "",
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        ...reply,
      };
    },
  };

  return {
    get turns() {
      return index;
    },
    get calls() {
      return calls;
    },
  };
}

describe("Agent tool loop", () => {
  const agents: Agent[] = [];

  const track = (agent: Agent) => {
    agents.push(agent);
    return agent;
  };

  afterEach(() => {
    agents.forEach((a) => a.cleanup());
    agents.length = 0;
  });

  const weatherTool = (): { tool: AgentTool; calls: any[] } => {
    const calls: any[] = [];
    const tool: AgentTool = {
      name: "get_weather",
      description: "Get weather",
      parameters: {
        type: "object",
        properties: { location: { type: "string" } },
        required: ["location"],
      },
      handler: async (params: any) => {
        calls.push(params);
        return { location: params.location, temp: 22 };
      },
    };
    return { tool, calls };
  };

  it("executes the requested tool and returns the model's final answer", async () => {
    const { tool, calls } = weatherTool();
    const agent = track(
      createAgent({ provider: "openai", apiKey: "test-key", tools: [tool] })
    );

    const provider = mockProvider(agent, [
      {
        content: "",
        toolCalls: [
          { id: "call_1", name: "get_weather", arguments: { location: "NYC" } },
        ],
      },
      { content: "It is 22 degrees in NYC." },
    ]);

    const response = await agent.chat("What's the weather in NYC?");

    expect(calls).toEqual([{ location: "NYC" }]);
    expect(response.content).toBe("It is 22 degrees in NYC.");
    expect(response.toolResults).toHaveLength(1);
    expect(response.toolResults![0]).toMatchObject({
      name: "get_weather",
      isError: false,
      result: { location: "NYC", temp: 22 },
    });
    expect(response.iterations).toBe(2);
    expect(provider.turns).toBe(2);
  });

  it("sends the tool result back to the model", async () => {
    const { tool } = weatherTool();
    const agent = track(
      createAgent({ provider: "openai", apiKey: "test-key", tools: [tool] })
    );

    const provider = mockProvider(agent, [
      {
        toolCalls: [
          { id: "call_1", name: "get_weather", arguments: { location: "NYC" } },
        ],
      },
      { content: "done" },
    ]);

    await agent.chat("weather?");

    const secondTurn = provider.calls[1];
    const toolMessage = secondTurn.find((m: any) => m.role === "tool");

    expect(toolMessage).toBeDefined();
    expect(toolMessage.toolCallId).toBe("call_1");
    expect(JSON.parse(toolMessage.content)).toEqual({
      location: "NYC",
      temp: 22,
    });

    const assistantMessage = secondTurn.find(
      (m: any) => m.role === "assistant" && m.toolCalls
    );
    expect(assistantMessage.toolCalls[0].id).toBe("call_1");
  });

  it("runs tools requested in the same turn together", async () => {
    const order: string[] = [];
    const makeTool = (name: string, delay: number): AgentTool => ({
      name,
      description: name,
      parameters: { type: "object", properties: {} },
      handler: async () => {
        await new Promise((r) => setTimeout(r, delay));
        order.push(name);
        return name;
      },
    });

    const agent = track(
      createAgent({
        provider: "openai",
        apiKey: "test-key",
        tools: [makeTool("slow", 60), makeTool("fast", 5)],
      })
    );

    mockProvider(agent, [
      {
        toolCalls: [
          { id: "a", name: "slow", arguments: {} },
          { id: "b", name: "fast", arguments: {} },
        ],
      },
      { content: "both done" },
    ]);

    const response = await agent.chat("run both");

    // Parallel execution: the fast tool finishes first even though it was
    // requested second.
    expect(order).toEqual(["fast", "slow"]);
    // Results stay in call order regardless of completion order.
    expect(response.toolResults!.map((r) => r.name)).toEqual(["slow", "fast"]);
  });

  it("feeds a failing tool back as an error instead of throwing", async () => {
    const failing: AgentTool = {
      name: "broken",
      description: "always fails",
      parameters: { type: "object", properties: {} },
      handler: async () => {
        throw new Error("upstream is down");
      },
    };

    const agent = track(
      createAgent({ provider: "openai", apiKey: "test-key", tools: [failing] })
    );

    mockProvider(agent, [
      { toolCalls: [{ id: "call_1", name: "broken", arguments: {} }] },
      { content: "I could not reach the service." },
    ]);

    const response = await agent.chat("try it");

    expect(response.content).toBe("I could not reach the service.");
    expect(response.toolResults![0].isError).toBe(true);
    expect(String(response.toolResults![0].result)).toContain("upstream is down");
  });

  it("stops at maxIterations when the model keeps calling tools", async () => {
    const { tool } = weatherTool();
    const agent = track(
      createAgent({
        provider: "openai",
        apiKey: "test-key",
        tools: [tool],
        toolConfig: { maxIterations: 3 },
      })
    );

    // Always asks for another tool call - would loop forever without the cap.
    const provider = mockProvider(agent, [
      {
        toolCalls: [
          { id: "x", name: "get_weather", arguments: { location: "NYC" } },
        ],
      },
    ]);

    const response = await agent.chat("weather?");

    expect(response.iterations).toBe(3);
    expect(provider.turns).toBe(3);
  });

  it("returns raw tool calls when autoExecuteTools is off", async () => {
    const { tool, calls } = weatherTool();
    const agent = track(
      createAgent({
        provider: "openai",
        apiKey: "test-key",
        tools: [tool],
        toolConfig: { autoExecuteTools: false },
      })
    );

    mockProvider(agent, [
      {
        toolCalls: [
          { id: "call_1", name: "get_weather", arguments: { location: "NYC" } },
        ],
      },
    ]);

    const response = await agent.chat("weather?");

    expect(calls).toHaveLength(0);
    expect(response.toolCalls).toHaveLength(1);
    expect(response.toolResults).toBeUndefined();
  });

  it("does not loop when the model asks for a tool that does not exist", async () => {
    const { tool } = weatherTool();
    const agent = track(
      createAgent({ provider: "openai", apiKey: "test-key", tools: [tool] })
    );

    const provider = mockProvider(agent, [
      { content: "", toolCalls: [{ id: "z", name: "no_such_tool", arguments: {} }] },
    ]);

    const response = await agent.chat("hi");

    expect(provider.turns).toBe(1);
    expect(response.iterations).toBe(1);
  });

  it("accumulates token usage across every round-trip", async () => {
    const { tool } = weatherTool();
    const agent = track(
      createAgent({ provider: "openai", apiKey: "test-key", tools: [tool] })
    );

    mockProvider(agent, [
      {
        toolCalls: [
          { id: "call_1", name: "get_weather", arguments: { location: "NYC" } },
        ],
      },
      { content: "done" },
    ]);

    const response = await agent.chat("weather?");

    // Two provider calls at 15 tokens each.
    expect(response.usage!.totalTokens).toBe(30);
  });

  it("works unchanged when the agent has no tools", async () => {
    const agent = track(createAgent({ provider: "openai", apiKey: "test-key" }));

    const provider = mockProvider(agent, [{ content: "plain answer" }]);

    const response = await agent.chat("hello");

    expect(response.content).toBe("plain answer");
    expect(provider.turns).toBe(1);
    expect(response.iterations).toBe(1);
  });

  it("uses tools registered after construction", async () => {
    const { tool, calls } = weatherTool();
    const agent = track(createAgent({ provider: "openai", apiKey: "test-key" }));

    agent.registerTools([tool]);

    mockProvider(agent, [
      {
        toolCalls: [
          { id: "call_1", name: "get_weather", arguments: { location: "Rio" } },
        ],
      },
      { content: "ok" },
    ]);

    const response = await agent.chat("weather?");

    expect(agent.listTools().map((t) => t.name)).toEqual(["get_weather"]);
    expect(calls).toEqual([{ location: "Rio" }]);
    expect(response.content).toBe("ok");
  });
});
