/**
 * Basic Test of mcp-agent-kit following official documentation
 * Tests if the package works as described in the docs
 */

import { createAgent, createChatbot } from "mcp-agent-kit";
import dotenv from "dotenv";

dotenv.config();

async function testBasicAgent() {
  console.log("\n" + "=".repeat(60));
  console.log("TEST 1: Basic Agent (following docs exactly)");
  console.log("=".repeat(60));

  try {
    const agent = createAgent({
      provider: "gemini",
      model: "gemini-2.5-flash",
      apiKey: process.env.GEMINI_API_KEY,
    });

    console.log("✅ Agent created successfully");

    const response = await agent.chat("Hello! Just say hi back.");
    console.log("\n📤 Sent: Hello! Just say hi back.");
    console.log("📥 Response type:", typeof response);
    console.log("📥 Response:", response);

    // Check if response has .content property
    if (
      typeof response === "object" &&
      response !== null &&
      "content" in response
    ) {
      console.log("✅ Response has .content property");
      console.log("📝 Content:", (response as any).content);
    } else if (typeof response === "string") {
      console.log("✅ Response is a string directly");
    }
  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
    console.error("Full error:", error);
  }
}

async function testAgentWithTools() {
  console.log("\n" + "=".repeat(60));
  console.log("TEST 2: Agent with Tools (following docs)");
  console.log("=".repeat(60));

  try {
    const agent = createAgent({
      provider: "gemini",
      model: "gemini-2.5-flash",
      apiKey: process.env.GEMINI_API_KEY,
      tools: [
        {
          name: "calculate",
          description: "Perform calculations",
          parameters: {
            type: "object",
            properties: {
              operation: { type: "string", enum: ["add", "subtract"] },
              a: { type: "number" },
              b: { type: "number" },
            },
            required: ["operation", "a", "b"],
          },
          handler: async ({ operation, a, b }) => {
            console.log(`🔧 Tool called: calculate(${operation}, ${a}, ${b})`);
            return operation === "add" ? a + b : a - b;
          },
        },
      ],
    });

    console.log("✅ Agent with tools created successfully");

    const response = await agent.chat("What is 15 + 27?");
    console.log("\n📤 Sent: What is 15 + 27?");
    console.log("📥 Response:", response);
  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
    console.error("Full error:", error);
  }
}

async function testChatbot() {
  console.log("\n" + "=".repeat(60));
  console.log("TEST 3: Chatbot with Memory (following docs)");
  console.log("=".repeat(60));

  try {
    const bot = createChatbot({
      agent: createAgent({
        provider: "gemini",
        model: "gemini-2.5-flash",
        apiKey: process.env.GEMINI_API_KEY,
      }),
      system: "You are a helpful assistant",
      maxHistory: 10,
    });

    console.log("✅ Chatbot created successfully");

    const response1 = await bot.chat("Hi, my name is John");
    console.log("\n📤 Sent: Hi, my name is John");
    console.log("📥 Response:", response1);

    const response2 = await bot.chat("What is my name?");
    console.log("\n📤 Sent: What is my name?");
    console.log("📥 Response:", response2);

    // Test statistics
    const stats = bot.getStats();
    console.log("\n📊 Chatbot Stats:", stats);
  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
    console.error("Full error:", error);
  }
}

async function testUnsupportedProvider() {
  console.log("\n" + "=".repeat(60));
  console.log("TEST 4: Unsupported Provider (Groq)");
  console.log("=".repeat(60));

  try {
    const agent = createAgent({
      provider: "groq" as any,
      model: "llama-3.3-70b-versatile",
      apiKey: process.env.GROQ_API_KEY,
    });

    console.log("✅ Agent created (unexpected)");
    await agent.chat("Hello");
  } catch (error: any) {
    console.log("❌ Expected error:", error.message);
    console.log("✅ Confirmed: Groq is NOT supported by mcp-agent-kit");
  }
}

async function runAllTests() {
  console.log(
    "\n╔════════════════════════════════════════════════════════════╗"
  );
  console.log("║     mcp-agent-kit Package Verification Tests              ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  await testBasicAgent();
  await testAgentWithTools();
  await testChatbot();
  await testUnsupportedProvider();

  console.log("\n" + "=".repeat(60));
  console.log("✅ All tests completed!");
  console.log("=".repeat(60) + "\n");
}

runAllTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
