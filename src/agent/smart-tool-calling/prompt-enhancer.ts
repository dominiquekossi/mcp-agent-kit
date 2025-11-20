/**
 * Prompt Enhancement for Smart Tool Calling
 */

import { AgentTool } from "../../types";

export interface PromptEnhancementOptions {
  forceToolUse: boolean;
  debug: boolean;
}

/**
 * PromptEnhancer class handles progressive prompt enhancement
 * to encourage tool usage when needed
 */
export class PromptEnhancer {
  constructor(private options: PromptEnhancementOptions) {}

  /**
   * Enhance system prompt to encourage tool usage
   */
  enhanceSystemPrompt(
    originalPrompt: string | undefined,
    tools: AgentTool[],
    attempt: number
  ): string {
    const basePrompt = originalPrompt || "";

    if (!this.options.forceToolUse || tools.length === 0) {
      return basePrompt;
    }

    const enhancement = this.getEnhancementForAttempt(attempt, tools);

    if (this.options.debug) {
      console.log(`[PromptEnhancer] Enhancing prompt (attempt ${attempt})`);
    }

    // Append enhancement to system prompt
    return basePrompt ? `${basePrompt}\n\n${enhancement}` : enhancement;
  }

  /**
   * Get progressive enhancement based on attempt number
   */
  private getEnhancementForAttempt(
    attempt: number,
    tools: AgentTool[]
  ): string {
    const toolNames = tools.map((t) => t.name).join(", ");

    switch (attempt) {
      case 0:
        // First attempt: gentle reminder
        return `You have access to the following tools: ${toolNames}. Use them when appropriate to help answer the user's request.`;

      case 1:
        // Second attempt: stronger encouragement
        return `IMPORTANT: You have tools available (${toolNames}). Please use these tools to provide accurate and helpful responses. Consider which tool would be most appropriate for this request.`;

      case 2:
        // Third attempt: explicit instruction
        return `CRITICAL: You MUST use one of the available tools (${toolNames}) to answer this request. Do not provide a response without using a tool. Analyze the request and select the most appropriate tool.`;

      default:
        // Final attempts: very explicit
        return `MANDATORY: Your response MUST include a tool call. Available tools: ${toolNames}. You cannot answer without using a tool. Select a tool now and provide the necessary parameters.`;
    }
  }

  /**
   * Enhance user message to emphasize tool usage
   */
  enhanceUserMessage(originalMessage: string, attempt: number): string {
    if (!this.options.forceToolUse || attempt === 0) {
      return originalMessage;
    }

    if (this.options.debug) {
      console.log(
        `[PromptEnhancer] Enhancing user message (attempt ${attempt})`
      );
    }

    // Add emphasis for retry attempts
    const prefix =
      attempt === 1
        ? "[Please use available tools to answer this] "
        : "[MUST use tools] ";

    return `${prefix}${originalMessage}`;
  }

  /**
   * Check if response contains tool calls
   */
  hasToolCalls(response: any): boolean {
    return !!(
      response?.toolCalls?.length > 0 || response?.tool_calls?.length > 0
    );
  }

  /**
   * Generate error message for missing tool calls
   */
  generateMissingToolCallError(tools: AgentTool[]): string {
    const toolNames = tools.map((t) => t.name).join(", ");
    return `Expected tool call but none was made. Available tools: ${toolNames}`;
  }
}
