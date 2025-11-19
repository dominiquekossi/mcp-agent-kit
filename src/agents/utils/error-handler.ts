/**
 * Error handler utility for AI agents
 * Provides safe execution wrapper for agent calls
 */

/**
 * Safely executes an agent function with error handling
 * @param fn - The async function to execute
 * @param fallback - The fallback value to return if an error occurs
 * @returns The result of the function or the fallback value
 */
export async function safeAgentCall<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("Agent error:", error);
    return fallback;
  }
}
