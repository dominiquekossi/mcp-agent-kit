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
      const model = this.config.model || "gemini-2.0-flash";

      logger.debug(`Gemini: Calling ${model}`);

      const systemMessage = messages.find((m) => m.role === "system");
      const systemInstruction = systemMessage?.content || this.config.system;

      const genModel = this.client.getGenerativeModel({
        model,
        generationConfig: {
          temperature: this.config.temperature ?? 0.7,
          maxOutputTokens: this.config.maxTokens,
        },
        // Tools have to be declared on the model, otherwise Gemini never emits
        // a functionCall no matter what the prompt asks for.
        ...(this.config.tools?.length
          ? {
              tools: [
                {
                  functionDeclarations: this.config.tools.map((tool) => ({
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.parameters,
                  })),
                },
              ],
            }
          : {}),
        ...(systemInstruction ? ({ systemInstruction } as any) : {}),
      } as any);

      const result = await genModel.generateContent({
        contents: this.convertMessages(
          messages.filter((m) => m.role !== "system")
        ),
      } as any);

      const response = result.response;
      const text = response.text();

      // Handle function calls
      let toolCalls: any[] | undefined;
      const functionCalls =
        typeof (response as any).functionCalls === "function"
          ? (response as any).functionCalls()
          : undefined;

      if (functionCalls && functionCalls.length > 0) {
        toolCalls = functionCalls.map((fc: any, index: number) => ({
          // Gemini does not issue call ids; synthesize a stable one so the
          // agent loop can pair each result with its call.
          id: `gemini-${Date.now()}-${index}`,
          name: fc.name,
          arguments: fc.args,
        }));
      }

      const usageMetadata = (response as any).usageMetadata;

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

  /**
   * Convert the neutral message format into Gemini `contents`, mapping tool
   * calls to functionCall parts and tool results to functionResponse parts.
   */
  private convertMessages(messages: AgentMessage[]): any[] {
    const contents: any[] = [];

    for (const msg of messages) {
      if (msg.role === "tool") {
        contents.push({
          role: "user",
          parts: [
            {
              functionResponse: {
                name: msg.name || "tool",
                response: this.parseResult(msg.content),
              },
            },
          ],
        });
        continue;
      }

      if (msg.role === "assistant" && msg.toolCalls?.length) {
        const parts: any[] = [];

        if (msg.content) {
          parts.push({ text: msg.content });
        }

        for (const call of msg.toolCalls) {
          parts.push({
            functionCall: { name: call.name, args: call.arguments ?? {} },
          });
        }

        contents.push({ role: "model", parts });
        continue;
      }

      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }

    return contents;
  }

  /** Gemini expects a JSON object as the function response payload. */
  private parseResult(content: string): any {
    try {
      const parsed = JSON.parse(content);
      return typeof parsed === "object" && parsed !== null
        ? parsed
        : { result: parsed };
    } catch {
      return { result: content };
    }
  }
}
