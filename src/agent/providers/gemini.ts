/**
 * Google Gemini Provider
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { AgentConfig, AgentMessage, AgentResponse } from "../../types";
import { logger } from "../../core/logger";

export class GeminiProvider {
  private client: GoogleGenerativeAI;
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
    this.client = new GoogleGenerativeAI(config.apiKey || "");
  }

  async chat(messages: AgentMessage[]): Promise<AgentResponse> {
    try {
      const model = this.config.model || "gemini-2.0-flash-exp";

      logger.debug(`Gemini: Calling ${model}`);

      // Get the generative model
      const genModel = this.client.getGenerativeModel({
        model,
        generationConfig: {
          temperature: this.config.temperature ?? 0.7,
          maxOutputTokens: this.config.maxTokens,
        },
      });

      // Convert messages to Gemini format
      const { systemInstruction, history, currentMessage } =
        this.convertMessages(messages);

      // Start chat with history
      const chat = genModel.startChat({
        history,
        ...(systemInstruction && ({ systemInstruction } as any)),
      });

      // Send message
      const result = await chat.sendMessage(currentMessage);
      const response = result.response;
      const text = response.text();

      // Handle function calls if tools are configured
      let toolCalls: any[] | undefined;
      const functionCalls = (response as any).functionCalls?.();

      if (functionCalls && functionCalls.length > 0) {
        toolCalls = functionCalls.map((fc: any) => ({
          name: fc.name,
          arguments: fc.args,
        }));
      }

      // Get usage metadata
      const usageMetadata = (result.response as any).usageMetadata;

      return {
        content: text,
        toolCalls,
        usage: {
          promptTokens: usageMetadata?.promptTokenCount || 0,
          completionTokens: usageMetadata?.candidatesTokenCount || 0,
          totalTokens: usageMetadata?.totalTokenCount || 0,
        },
      };
    } catch (error: any) {
      logger.error("Gemini error:", error.message);
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  private convertMessages(messages: AgentMessage[]): {
    systemInstruction?: string;
    history: any[];
    currentMessage: string;
  } {
    // Extract system message
    const systemMessage = messages.find((m) => m.role === "system");
    const systemInstruction = systemMessage?.content || this.config.system;

    // Filter out system messages
    const chatMessages = messages.filter((m) => m.role !== "system");

    // Last message is the current one
    const currentMessage = chatMessages[chatMessages.length - 1]?.content || "";

    // Convert previous messages to history
    const history = chatMessages.slice(0, -1).map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    return {
      systemInstruction,
      history,
      currentMessage,
    };
  }
}
