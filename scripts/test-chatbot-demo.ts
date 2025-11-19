/**
 * Chatbot Demo Script
 * Demonstrates chatbot functionality with automated queries
 */

import { libraryChatbot } from "../src/chatbot/library-chatbot";
import dotenv from "dotenv";

dotenv.config();

async function runChatbotDemo() {
  console.log(
    "\n╔════════════════════════════════════════════════════════════╗"
  );
  console.log("║          Library Chatbot Demo                             ║");
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n"
  );

  const queries = [
    "Olá! Quais livros você tem disponíveis?",
    "Você tem algum livro do George Orwell?",
    "Me fale mais sobre o livro 1984",
    "Cadastre um novo livro chamado 'O Hobbit' do autor com ID 2",
    "Liste todos os livros novamente para ver se o novo livro foi adicionado",
    "Quais autores estão cadastrados?",
  ];

  for (const query of queries) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`👤 You: ${query}`);
    console.log(`${"=".repeat(60)}`);

    try {
      const response = await libraryChatbot.chat(query);
      console.log(`\n🤖 Bot: ${response}\n`);
    } catch (error: any) {
      console.error(`\n❌ Error: ${error.message}\n`);
    }

    // Wait a bit between queries
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Show chatbot statistics
  console.log("\n" + "=".repeat(60));
  console.log("📊 Chatbot Statistics:");
  console.log("=".repeat(60));
  const stats = libraryChatbot.getStats();
  console.log(`Total messages: ${stats.messageCount}`);
  console.log(`User messages: ${stats.userMessages}`);
  console.log(`Assistant messages: ${stats.assistantMessages}`);
  console.log(`Oldest message: ${stats.oldestMessage}`);
  console.log(`Newest message: ${stats.newestMessage}`);

  console.log("\n✅ Demo completed successfully!\n");
}

// Run the demo
runChatbotDemo().catch((error) => {
  console.error("Demo failed:", error);
  process.exit(1);
});
