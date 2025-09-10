#!/usr/bin/env node

import { Command } from 'commander';
import { MCPClient } from './MCPClient';
import { readFile, writeFile, listFiles } from './fileCommands';
import { runCommand } from './executionCommands';

const program = new Command();

program
  .name('qwen-mcp')
  .description('CLI to interact with the MCP Server')
  .version('1.0.0')
  .option('-s, --session-id <id>', 'Session ID')
  .option('-u, --url <url>', 'MCP Server URL', 'http://localhost:8080');

program
  .command('init')
  .description('Initialize a session with the MCP Server')
  .option('-c, --capabilities <capabilities>', 'Comma-separated list of capabilities', 'readFile,writeFile,runCommand,listFiles')
  .action(async (options) => {
    try {
      const client = new MCPClient(program.opts().url);
      const capabilities = options.capabilities.split(',');
      const sessionId = await client.initSession(capabilities);
      console.log(`Session initialized with ID: ${sessionId}`);
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  });

program
  .command('read')
  .description('Read a file from the workspace')
  .argument('<path>', 'Path to the file')
  .action(async (filePath) => {
    try {
      const client = new MCPClient(program.opts().url);
      client.setSessionId(program.opts().sessionId);
      const content = await readFile(client, filePath);
      console.log(content);
    } catch (error) {
      console.error('Failed to read file:', error);
    }
  });

program
  .command('write')
  .description('Write content to a file in the workspace')
  .argument('<path>', 'Path to the file')
  .argument('<content>', 'Content to write')
  .action(async (filePath, content) => {
    try {
      const client = new MCPClient(program.opts().url);
      client.setSessionId(program.opts().sessionId);
      await writeFile(client, filePath, content);
      console.log(`Successfully wrote to ${filePath}`);
    } catch (error) {
      console.error('Failed to write file:', error);
    }
  });

program
  .command('list')
  .description('List files in a directory')
  .argument('[path]', 'Path to the directory', '')
  .action(async (dirPath) => {
    try {
      const client = new MCPClient(program.opts().url);
      client.setSessionId(program.opts().sessionId);
      const files = await listFiles(client, dirPath);
      console.log(files);
    } catch (error) {
      console.error('Failed to list files:', error);
    }
  });

program
  .command('run')
  .description('Execute a command in the sandboxed environment')
  .argument('<command>', 'Command to execute')
  .option('-t, --timeout <timeout>', 'Command timeout in milliseconds', '30000')
  .action(async (command, options) => {
    try {
      const client = new MCPClient(program.opts().url);
      client.setSessionId(program.opts().sessionId);
      
      // Parse command and arguments
      const parts = command.split(' ');
      const cmd = parts[0];
      const args = parts.slice(1);
      
      const result = await runCommand(client, cmd, args, { timeout: parseInt(options.timeout) });
      console.log(result);
    } catch (error) {
      console.error('Failed to execute command:', error);
    }
  });

program
  .command('tools')
  .description('List available tools')
  .action(async () => {
    try {
      const client = new MCPClient(program.opts().url);
      client.setSessionId(program.opts().sessionId);
      const tools = await client.listTools();
      console.log(JSON.stringify(tools, null, 2));
    } catch (error) {
      console.error('Failed to list tools:', error);
    }
  });

program
  .command('tool')
  .description('Get information about a specific tool')
  .argument('<name>', 'Tool name')
  .action(async (toolName) => {
    try {
      const client = new MCPClient(program.opts().url);
      client.setSessionId(program.opts().sessionId);
      const tool = await client.getTool(toolName);
      console.log(JSON.stringify(tool, null, 2));
    } catch (error) {
      console.error('Failed to get tool information:', error);
    }
  });

program
  .command('execute')
  .description('Execute a custom tool')
  .argument('<name>', 'Tool name')
  .argument('[args...]', 'Tool arguments as key=value pairs')
  .action(async (toolName, args) => {
    try {
      const client = new MCPClient(program.opts().url);
      client.setSessionId(program.opts().sessionId);
      
      // Parse arguments
      const toolArgs: any = {};
      for (const arg of args) {
        const [key, value] = arg.split('=');
        toolArgs[key] = value;
      }
      
      const result = await client.executeTool(toolName, toolArgs);
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Failed to execute tool:', error);
    }
  });

program.parse();