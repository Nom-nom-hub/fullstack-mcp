#!/usr/bin/env node

/**
 * Setup script for MCP server configuration
 */

const fs = require('fs');
const path = require('path');

function setupMCPConfig() {
  console.log('Setting up MCP Server configuration...');
  
  // Create .qwen directory if it doesn't exist
  const qwenDir = path.join(process.cwd(), '.qwen');
  if (!fs.existsSync(qwenDir)) {
    fs.mkdirSync(qwenDir);
    console.log('✓ Created .qwen directory');
  }
  
  // Create settings.json file
  const settingsFile = path.join(qwenDir, 'settings.json');
  const settings = {
    mcpServers: {
      'local-fullstack-mcp': {
        name: 'Local Fullstack MCP Server',
        transport: 'http',
        url: 'http://localhost:8080',
        default: true,
        description: 'Local development instance of the Fullstack MCP Server'
      }
    },
    defaultMcpServer: 'local-fullstack-mcp'
  };
  
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
  console.log('✓ Created .qwen/settings.json configuration file');
  
  // Create README.md file
  const readmeContent = `# Qwen MCP Server Configuration

This directory contains the configuration for the Model Context Protocol (MCP) server used by Qwen Code.

## Configuration

The \`settings.json\` file defines the MCP servers that Qwen Code can connect to:

\`\`\`json
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
\`\`\`

## Starting the MCP Server

To start the MCP server, run:

\`\`\`bash
npm run dev
\`\`\`

The server will be available at \`http://localhost:8080\`.

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
`;

  fs.writeFileSync(path.join(qwenDir, 'README.md'), readmeContent);
  console.log('✓ Created .qwen/README.md documentation file');
  
  console.log('\n🎉 MCP Server configuration setup complete!');
  console.log('\nTo start using the MCP server with Qwen Code:');
  console.log('1. Start the server: npm run dev');
  console.log('2. Use Qwen Code to connect to the server automatically');
  console.log('3. Enjoy secure, sandboxed development with custom tools!');
}

// Run the setup
setupMCPConfig();
