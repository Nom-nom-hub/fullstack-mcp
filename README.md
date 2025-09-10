# Advanced MCP Server

An implementation of the Model Context Protocol (MCP) server that provides AI coding agents with a secure, flexible, and extensible environment for executing coding tasks.

## Features

- Session Management
- Resource Management
- Sandboxed Tool Execution
- Policy Engine
- Multi-Agent Collaboration
- Extensible Tooling
- Rate Limiting
- Custom Tools (Code Analysis, Testing, Documentation)

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (optional, for enhanced sandboxing)
- Docker Compose (optional)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

To start the development server:
```bash
npm run dev
```

To start with Docker:
```bash
docker-compose up
```

### Building

To build the TypeScript code:
```bash
npm run build
```

### Testing

To run tests:
```bash
npm test
```

To run tests with coverage:
```bash
npm run test:coverage
```

## API Documentation

Detailed API documentation is available in the following formats:

- [OpenAPI Specification](src/docs/openapi.yaml)
- [gRPC Protocol Definition](src/docs/mcp.proto)
- [API Documentation](src/docs/api.md)
- [Qwen CLI Integration Guide](src/docs/qwen-cli.md)

## Using with Qwen Code

The MCP Server is designed to work seamlessly with Qwen Code. After starting the server:

1. Start the server:
   ```bash
   npm run dev
   ```

2. Configure Qwen Code to use the MCP server by creating a `.qwen/settings.json` file:
   ```json
   {
     "mcpServers": {
       "local-fullstack-mcp": {
         "name": "Local Fullstack MCP Server",
         "transport": "http",
         "url": "http://localhost:8080",
         "default": true
       }
     }
   }
   ```

3. Initialize a session:
   ```bash
   curl -X POST http://localhost:8080/session/init \
     -H "Content-Type: application/json" \
     -d '{"tools": ["readFile", "writeFile", "runCommand", "listFiles"]}'
   ```

4. Use the session ID with Qwen Code commands to perform operations in a secure, sandboxed environment.

See the [Qwen CLI Integration Guide](src/docs/qwen-cli.md) for detailed instructions.

## Architecture

The MCP server follows a modular architecture with the following components:

- **MCP Gateway** - Accepts connections (gRPC + WebSocket for streaming)
- **Session Manager** - Handles authentication, session lifecycle, and capability negotiation
- **Resource Manager** - File system abstraction with policy enforcement
- **Execution Manager** - Runs commands/tools inside sandboxed runtimes (Docker)
- **Policy Engine** - Enforces access rules and maintains audit logs
- **Audit Log** - Immutable logging system for accountability
- **Sandbox Runtime** - Docker containers with controlled resources
- **Workspace Storage** - Persistent project storage (bind-mounted or virtual FS)

## Security

- Sandboxed execution using Docker containers
- Resource policy enforcement
- Audit logging for all actions
- Capability negotiation
- Rate limiting
- Policy-based access control

## License

MIT