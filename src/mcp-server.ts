#!/usr/bin/env node

/**
 * MCP Server implementation using stdio and JSON-RPC protocol
 * Compatible with Model Context Protocol specification
 */

import { ToolRegistry } from './tools/ToolRegistry';
import { PolicyEngine } from './services/PolicyEngine';

interface MCPJsonRpcRequest {
  jsonrpc: '2.0';
  id: number | string | null;
  method: string;
  params?: any;
}

interface MCPJsonRpcResponse {
  jsonrpc: '2.0';
  id: number | string | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface MCPServerCapabilities {
  tools?: {
    listChanged?: boolean;
  };
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

class MCPServer {
  private toolRegistry: ToolRegistry;
  private policyEngine: PolicyEngine;

  constructor() {
    // Initialize services
    this.toolRegistry = new ToolRegistry();
    this.policyEngine = new PolicyEngine();

    // Add default policy for development
    this.policyEngine.addPolicy(PolicyEngine.createDefaultPolicy());
  }

  private getServerCapabilities(): MCPServerCapabilities {
    return {
      tools: {
        listChanged: true
      }
    };
  }

  private async handleInitialize(params: any): Promise<any> {
    return {
      protocolVersion: '2024-11-05',
      capabilities: this.getServerCapabilities(),
      serverInfo: {
        name: 'fullstack-mcp',
        version: '1.0.0'
      }
    };
  }

  private async handleToolsList(): Promise<MCPTool[]> {
    const tools = this.toolRegistry.getAllTools();
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: {
        type: 'object',
        properties: tool.parameters.reduce((acc, param) => {
          acc[param.name] = {
            type: param.type,
            description: param.description,
            default: param.default
          };
          return acc;
        }, {} as Record<string, any>),
        required: tool.parameters.filter(p => p.required).map(p => p.name)
      }
    }));
  }

  private async handleToolsCall(params: { name: string; arguments?: any }): Promise<any> {
    const { name, arguments: args = {} } = params;

    try {
      // Check policy (simplified for MCP context)
      const tool = this.toolRegistry.getTool(name);
      if (!tool) {
        throw new Error(`Tool not found: ${name}`);
      }

      const result = await this.toolRegistry.executeTool(name, args);

      if (!result.success) {
        throw new Error(result.error || 'Tool execution failed');
      }

      return result.data;
    } catch (error: any) {
      throw new Error(`Tool execution failed: ${error.message}`);
    }
  }

  private async handleMessage(request: MCPJsonRpcRequest): Promise<MCPJsonRpcResponse> {
    try {
      switch (request.method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: await this.handleInitialize(request.params)
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            tools: await this.handleToolsList()
          }
        };

      case 'tools/call':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: await this.handleToolsCall(request.params)
        };

      default:
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`
          }
        };
      }
    } catch (error: any) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32000,
          message: error.message || 'Internal server error'
        }
      };
    }
  }

  public async start(): Promise<void> {
    // Handle stdio communication
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', async (data) => {
      try {
        // Parse incoming JSON-RPC message
        const request: MCPJsonRpcRequest = JSON.parse(data.toString().trim());

        // Handle the request
        const response = await this.handleMessage(request);

        // Send response back via stdout
        process.stdout.write(JSON.stringify(response) + '\n');
      } catch (error) {
        // Send error response for malformed requests
        const errorResponse: MCPJsonRpcResponse = {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: 'Parse error',
            data: error instanceof Error ? error.message : String(error)
          }
        };
        process.stdout.write(JSON.stringify(errorResponse) + '\n');
      }
    });

    // Handle shutdown gracefully
    process.on('SIGINT', () => {
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      process.exit(0);
    });
  }
}

// Start the MCP server
if (require.main === module) {
  const server = new MCPServer();
  server.start().catch((error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}

export { MCPServer };