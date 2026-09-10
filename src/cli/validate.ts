/**
 * Validation rules for MCP tool definitions.
 *
 * These are the problems that actually break a server in front of a real
 * client: names an LLM provider rejects, schemas that contradict themselves,
 * and missing descriptions that leave the model guessing which tool to call.
 */

export type IssueLevel = 'error' | 'warning';

export interface ValidationIssue {
  level: IssueLevel;
  tool: string;
  message: string;
}

/**
 * Both OpenAI and Anthropic restrict function names to this shape. A server
 * that publishes anything else works with some clients and fails with others,
 * which is painful to debug from the client side.
 */
const VALID_TOOL_NAME = /^[a-zA-Z0-9_-]{1,64}$/;

/** A description shorter than this tells the model nothing useful. */
const MIN_DESCRIPTION_LENGTH = 10;

export function validateTools(tools: any[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Map<string, number>();

  for (const tool of tools) {
    const name = typeof tool?.name === 'string' ? tool.name : '<unnamed>';

    // --- name ---------------------------------------------------------
    if (!tool?.name) {
      issues.push({
        level: 'error',
        tool: name,
        message: 'tool has no name',
      });
    } else if (!VALID_TOOL_NAME.test(tool.name)) {
      issues.push({
        level: 'error',
        tool: name,
        message:
          'name must match [a-zA-Z0-9_-]{1,64} — OpenAI and Anthropic reject anything else',
      });
    }

    seen.set(name, (seen.get(name) || 0) + 1);

    // --- description --------------------------------------------------
    if (!tool?.description) {
      issues.push({
        level: 'warning',
        tool: name,
        message: 'no description — models pick tools by description',
      });
    } else if (tool.description.length < MIN_DESCRIPTION_LENGTH) {
      issues.push({
        level: 'warning',
        tool: name,
        message: `description is only ${tool.description.length} characters`,
      });
    }

    // --- schema -------------------------------------------------------
    const schema = tool?.inputSchema;

    if (!schema) {
      issues.push({
        level: 'error',
        tool: name,
        message: 'no inputSchema',
      });
      continue;
    }

    if (schema.type !== 'object') {
      issues.push({
        level: 'error',
        tool: name,
        message: `inputSchema.type is "${schema.type}", must be "object"`,
      });
    }

    const properties = schema.properties || {};
    const propertyNames = Object.keys(properties);

    // A required key with no matching property is the single most common
    // schema bug: the server asks for an argument it never declared.
    for (const required of schema.required || []) {
      if (!propertyNames.includes(required)) {
        issues.push({
          level: 'error',
          tool: name,
          message: `required lists "${required}" but properties has no such key`,
        });
      }
    }

    for (const [propertyName, definition] of Object.entries<any>(properties)) {
      if (!definition?.type && !definition?.oneOf && !definition?.anyOf && !definition?.$ref) {
        issues.push({
          level: 'warning',
          tool: name,
          message: `property "${propertyName}" has no type`,
        });
      }

      if (!definition?.description) {
        issues.push({
          level: 'warning',
          tool: name,
          message: `property "${propertyName}" has no description`,
        });
      }
    }
  }

  // --- duplicates -------------------------------------------------------
  for (const [name, count] of seen.entries()) {
    if (count > 1) {
      issues.push({
        level: 'error',
        tool: name,
        message: `declared ${count} times — tool names must be unique`,
      });
    }
  }

  return issues;
}

/** One-line summary of a tool's parameters, e.g. `{ path: string, depth?: number }`. */
export function describeParameters(schema: any): string {
  if (!schema?.properties) {
    return '{}';
  }

  const required: string[] = schema.required || [];
  const parts = Object.entries<any>(schema.properties).map(([name, def]) => {
    const optional = required.includes(name) ? '' : '?';
    const type = def?.type || (def?.oneOf || def?.anyOf ? 'union' : 'any');
    return `${name}${optional}: ${type}`;
  });

  if (parts.length === 0) {
    return '{}';
  }

  return `{ ${parts.join(', ')} }`;
}
