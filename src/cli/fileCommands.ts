import { MCPClient } from './MCPClient';

/**
 * Read a file from the workspace
 * @param client - MCP Client instance
 * @param filePath - Path to the file
 * @returns File content
 */
export async function readFile(client: MCPClient, filePath: string): Promise<string> {
  const response = await client.get(`/files/${filePath}`);
  if (response.content) {
    return response.content;
  } else {
    throw new Error(`Failed to read file: ${response.error || 'Unknown error'}`);
  }
}

/**
 * Write content to a file in the workspace
 * @param client - MCP Client instance
 * @param filePath - Path to the file
 * @param content - Content to write
 */
export async function writeFile(client: MCPClient, filePath: string, content: string): Promise<void> {
  const response = await client.post('/files', { path: filePath, content });
  if (!response.success) {
    throw new Error(`Failed to write file: ${response.error || 'Unknown error'}`);
  }
}

/**
 * List files in a directory
 * @param client - MCP Client instance
 * @param dirPath - Path to the directory
 * @returns Array of file names
 */
export async function listFiles(client: MCPClient, dirPath: string): Promise<string[]> {
  // Handle root directory case
  const path = dirPath ? `/files/list/${dirPath}` : '/files/list';
  const response = await client.get(path);
  if (response.files) {
    return response.files;
  } else {
    throw new Error(`Failed to list files: ${response.error || 'Unknown error'}`);
  }
}