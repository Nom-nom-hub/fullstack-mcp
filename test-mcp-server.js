#!/usr/bin/env node

/**
 * Test script to verify MCP server functionality via stdio
 */

const { spawn } = require('child_process');
const path = require('path');

// Start the MCP server as a child process
const serverProcess = spawn('npx', ['ts-node', 'src/mcp-server.ts'], {
  cwd: process.cwd(),
  stdio: ['pipe', 'pipe', 'inherit']
});

// Test messages
const testInitialize = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  }
};

const testToolsList = {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/list',
  params: {}
};

console.log('Testing MCP Server...\n');

// Send initialize request
serverProcess.stdin.write(JSON.stringify(testInitialize) + '\n');

// Handle responses
let buffer = '';
serverProcess.stdout.on('data', (data) => {
  buffer += data.toString();

  // Process complete JSON responses (separated by newlines)
  const lines = buffer.split('\n');
  buffer = lines.pop(); // Keep incomplete line in buffer

  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log('Response:', JSON.stringify(response, null, 2));

        // After initialize response, send tools/list
        if (response.id === 1 && !response.error) {
          console.log('\nSending tools/list request...');
          serverProcess.stdin.write(JSON.stringify(testToolsList) + '\n');
        }

        // After tools list, close the connection
        if (response.id === 2) {
          console.log('\n✓ MCP Server test completed successfully!');
          serverProcess.kill('SIGTERM');
        }
      } catch (error) {
        console.error('Failed to parse response:', line, error);
      }
    }
  }
});

serverProcess.on('exit', (code) => {
  console.log(`\nServer process exited with code ${code}`);
});

serverProcess.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('Test timeout - killing server process');
  serverProcess.kill('SIGTERM');
}, 10000);