# Using MCP Server with Qwen CLI

## Overview

This guide explains how to use the Advanced MCP Server with Qwen CLI for AI-assisted development.

## Prerequisites

1. Ensure the MCP Server is running (follow setup instructions in README.md)
2. Install Qwen CLI if not already installed
3. Have your project ready that you want Qwen to work on

## Starting the MCP Server

1. Navigate to the MCP Server directory:
   ```bash
   cd fullstack-mcp
   ```

2. Start the server:
   ```bash
   npm run dev
   ```
   
   The server will start on port 8080 by default.

## Configuring Qwen CLI to Use MCP Server

1. Set the MCP server URL in your environment:
   ```bash
   export MCP_SERVER_URL=http://localhost:8080
   ```
   
   On Windows:
   ```cmd
   set MCP_SERVER_URL=http://localhost:8080
   ```

2. Initialize a session with the MCP Server:
   ```bash
   curl -X POST http://localhost:8080/session/init \
     -H "Content-Type: application/json" \
     -d '{"tools": ["readFile", "writeFile", "runCommand", "listFiles"]}'
   ```

   This will return a session ID that Qwen CLI will use for all subsequent requests.

## Using Qwen CLI with MCP Server

Once configured, Qwen CLI can:

1. **Read files** from your project:
   ```bash
   qwen read src/index.ts
   ```

2. **Write files** to your project:
   ```bash
   qwen write src/new-file.ts "console.log('Hello World');"
   ```

3. **Execute commands** in a sandboxed environment:
   ```bash
   qwen run "npm test"
   ```

4. **List files** in directories:
   ```bash
   qwen list src
   ```

## Security Features

The MCP Server implements several security measures to protect your development environment:

1. **Sandboxing**: Commands are executed in isolated Docker containers when enabled
2. **Policy Engine**: Fine-grained access control based on policies
3. **Input Validation**: Protection against injection attacks and directory traversal
4. **Rate Limiting**: Prevention of resource abuse
5. **Audit Logging**: All actions are logged with timestamps and session IDs

## Example Implementation

See the [example implementation](../examples/qwen-cli-example.js) for a reference implementation of how Qwen CLI would interact with the MCP Server.

To run the example:
```bash
cd src/examples
npm install
npm run example
```

## Example Workflow

1. Start the MCP Server:
   ```bash
   npm run dev
   ```

2. Initialize a session:
   ```bash
   SESSION_RESPONSE=$(curl -s -X POST http://localhost:8080/session/init \
     -H "Content-Type: application/json" \
     -d '{"tools": ["readFile", "writeFile", "runCommand"]}')
   
   SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.sessionId')
   echo "Session ID: $SESSION_ID"
   ```

3. Use Qwen CLI with the session:
   ```bash
   qwen --session-id $SESSION_ID "Create a new React component in src/components/Hello.tsx"
   ```

## Troubleshooting

- If commands fail with timeout errors, increase the timeout in the execution request
- If file operations fail with permission errors, check that the paths are within the workspace directory
- If the server won't start, check that port 8080 is available
- If Docker sandboxing is enabled but not working, ensure Docker is installed and running

## Next Steps

1. Integrate with your CI/CD pipeline
2. Add custom tools to extend capabilities
3. Configure policy rules for additional security
4. Set up monitoring and alerting for production use
5. Enable Docker sandboxing for enhanced security:
   ```bash
   export MCP_USE_DOCKER=true
   npm run dev
   ```