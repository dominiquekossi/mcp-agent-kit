/**
 * Prompt Enhancer
 * Enhances prompts to encourage tool usage
 */

/**
 * Enhances a prompt to encourage the model to use available tools
 */
export class PromptEnhancer {
  /**
   * Enhance the prompt based on the attempt number
   * @param message Original message
   * @param attempt Current attempt number (1-indexed)
   * @returns Enhanced message
   */
  enhance(message: string, attempt: number): string {
    if (attempt === 1) {
      // First attempt - gentle reminder
      return `${message}\n\nNote: You have tools available. Please use them if they can help answer this question.`;
    } else if (attempt === 2) {
      // Second attempt - stronger emphasis
      return `${message}\n\nIMPORTANT: You MUST use the available tools to answer this question. Do not provide a generic answer without calling the appropriate tool.`;
    } else {
      // Third+ attempt - very explicit
      return `${message}\n\nCRITICAL: This is attempt ${attempt}. You are REQUIRED to use one of the available tools. Your response will be rejected if you do not call a tool. Please call the most appropriate tool now.`;
    }
  }

  /**
   * Add context about available tools to the prompt
   * @param message Original message
   * @param toolNames Names of available tools
   * @returns Enhanced message with tool context
   */
  addToolContext(message: string, toolNames: string[]): string {
    if (toolNames.length === 0) {
      return message;
    }

    const toolList = toolNames.map((name) => `- ${name}`).join("\n");
    return `${message}\n\nAvailable tools:\n${toolList}\n\nPlease use one of these tools to answer the question.`;
  }

  /**
   * Create a system message that emphasizes tool usage
   * @param attempt Current attempt number
   * @returns System message
   */
  createSystemMessage(attempt: number): string {
    if (attempt === 1) {
      return "You are a helpful assistant. When tools are available, prefer using them over providing generic answers.";
    } else if (attempt === 2) {
      return "You are a helpful assistant. You MUST use the available tools when they can help answer questions. Do not provide answers without using tools.";
    } else {
      return "You are a helpful assistant. It is MANDATORY to use the available tools. Your response will be rejected if you do not call a tool. Always call the most appropriate tool.";
    }
  }

  /**
   * Check if a message already has tool usage instructions
   * @param message Message to check
   * @returns True if message already has instructions
   */
  hasToolInstructions(message: string): boolean {
    const keywords = [
      "use the tool",
      "call the tool",
      "available tools",
      "must use",
      "required to use",
    ];

    const lowerMessage = message.toLowerCase();
    return keywords.some((keyword) => lowerMessage.includes(keyword));
  }

  /**
   * Remove previous enhancement instructions from a message
   * @param message Message to clean
   * @returns Cleaned message
   */
  removeEnhancements(message: string): string {
    // Remove common enhancement patterns
    const patterns = [
      /\n\nNote: You have tools available.*$/s,
      /\n\nIMPORTANT: You MUST use.*$/s,
      /\n\nCRITICAL: This is attempt.*$/s,
      /\n\nAvailable tools:.*$/s,
    ];

    let cleaned = message;
    for (const pattern of patterns) {
      cleaned = cleaned.replace(pattern, "");
    }

    return cleaned.trim();
  }
}

/**
 * Default prompt enhancer instance
 */
export const promptEnhancer = new PromptEnhancer();
