import { MCPClient } from './MCPClient';

/**
 * Execute a command in the sandboxed environment
 * @param client - MCP Client instance
 * @param command - Command to execute
 * @param args - Command arguments
 * @param options - Execution options
 * @returns Execution result
 */
export async function runCommand(
  client: MCPClient,
  command: string,
  args: string[] = [],
  options: any = {}
): Promise<any> {
  const response = await client.post('/execute', { command, args, options });
  if (response.executionId) {
    return response;
  } else {
    throw new Error(`Failed to execute command: ${response.error || 'Unknown error'}`);
  }
}