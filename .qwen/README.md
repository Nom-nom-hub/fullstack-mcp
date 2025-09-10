# Qwen MCP Server Configuration

This directory contains the configuration for the Model Context Protocol (MCP) server used by Qwen Code.

## Configuration

The `settings.json` file defines the MCP servers that Qwen Code can connect to:

```json
{
  "mcpServers": {
    "local-fullstack-mcp": {
      "name": "Local Fullstack MCP Server",
      "transport": "http",
      "url": "http://localhost:8080",
      "default": true,
      "description": "Local development instance of the Fullstack MCP Server"
    }
  },
  "defaultMcpServer": "local-fullstack-mcp"
}
```

## Starting the MCP Server

To start the MCP server, run:

```bash
npm run dev
```

The server will be available at `http://localhost:8080`.

## Using with Qwen Code

Once the server is running, Qwen Code will automatically connect to it using the configuration in this file. You can then use Qwen Code to:

- Read and write files securely
- Execute commands in a sandboxed environment
- Run custom tools for code analysis, testing, and documentation generation
- Benefit from policy enforcement and rate limiting for security

## Security Features

The MCP server includes several security features:

1. **Policy Engine**: Controls what operations can be performed
2. **Rate Limiting**: Prevents resource exhaustion
3. **Docker Sandboxing**: Isolates command execution (when Docker is available)
4. **Audit Logging**: Records all operations for accountability
