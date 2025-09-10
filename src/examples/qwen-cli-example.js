#!/usr/bin/env node

/**
 * Example script demonstrating how Qwen CLI would interact with the MCP Server
 * This is a simplified example for educational purposes
 */

const https = require('https');
const http = require('http');

class QwenMCPClient {
  constructor(serverUrl = 'http://localhost:8080') {
    this.serverUrl = serverUrl;
    this.sessionId = null;
  }

  /**
   * Initialize a session with the MCP Server
   * @param {string[]} capabilities - Array of capabilities to request
   * @returns {Promise<string>} Session ID
   */
  async initSession(capabilities = ['readFile', 'writeFile', 'runCommand', 'listFiles']) {
    const url = `${this.serverUrl}/session/init`;
    const data = JSON.stringify({ tools: capabilities });
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    return new Promise((resolve, reject) => {
      const req = http.request(url, options, (res) => {
        let responseBody = '';
        
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(responseBody);
            if (response.sessionId) {
              this.sessionId = response.sessionId;
              console.log(`Session initialized with ID: ${this.sessionId}`);
              resolve(this.sessionId);
            } else {
              reject(new Error('Failed to initialize session'));
            }
          } catch (error) {
            reject(error);
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.write(data);
      req.end();
    });
  }

  /**
   * Read a file from the workspace
   * @param {string} filePath - Path to the file
   * @returns {Promise<string>} File content
   */
  async readFile(filePath) {
    if (!this.sessionId) {
      throw new Error('No active session. Call initSession first.');
    }
    
    const url = `${this.serverUrl}/files/${filePath}`;
    
    return new Promise((resolve, reject) => {
      http.get(url, (res) => {
        let responseBody = '';
        
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(responseBody);
            if (response.content) {
              resolve(response.content);
            } else {
              reject(new Error(`Failed to read file: ${response.error || 'Unknown error'}`));
            }
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Write content to a file in the workspace
   * @param {string} filePath - Path to the file
   * @param {string} content - Content to write
   * @returns {Promise<boolean>} Success status
   */
  async writeFile(filePath, content) {
    if (!this.sessionId) {
      throw new Error('No active session. Call initSession first.');
    }
    
    const url = `${this.serverUrl}/files`;
    const data = JSON.stringify({ path: filePath, content });
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    return new Promise((resolve, reject) => {
      const req = http.request(url, options, (res) => {
        let responseBody = '';
        
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(responseBody);
            if (response.success) {
              console.log(`Successfully wrote to ${filePath}`);
              resolve(true);
            } else {
              reject(new Error(`Failed to write file: ${response.error || 'Unknown error'}`));
            }
          } catch (error) {
            reject(error);
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.write(data);
      req.end();
    });
  }

  /**
   * List files in a directory
   * @param {string} dirPath - Path to the directory
   * @returns {Promise<string[]>} Array of file names
   */
  async listFiles(dirPath = '') {
    if (!this.sessionId) {
      throw new Error('No active session. Call initSession first.');
    }
    
    // Handle root directory case
    const url = dirPath ? 
      `${this.serverUrl}/files/list/${dirPath}` : 
      `${this.serverUrl}/files/list`;
    
    return new Promise((resolve, reject) => {
      http.get(url, (res) => {
        let responseBody = '';
        
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(responseBody);
            if (response.files) {
              resolve(response.files);
            } else {
              reject(new Error(`Failed to list files: ${response.error || 'Unknown error'}`));
            }
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Execute a command in the sandboxed environment
   * @param {string} command - Command to execute
   * @param {string[]} args - Command arguments
   * @param {object} options - Execution options
   * @returns {Promise<object>} Execution result
   */
  async runCommand(command, args = [], options = {}) {
    if (!this.sessionId) {
      throw new Error('No active session. Call initSession first.');
    }
    
    const url = `${this.serverUrl}/execute`;
    const data = JSON.stringify({ command, args, options });
    
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    return new Promise((resolve, reject) => {
      const req = http.request(url, requestOptions, (res) => {
        let responseBody = '';
        
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(responseBody);
            if (response.executionId) {
              console.log(`Command executed with ID: ${response.executionId}`);
              resolve(response);
            } else {
              reject(new Error(`Failed to execute command: ${response.error || 'Unknown error'}`));
            }
          } catch (error) {
            reject(error);
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.write(data);
      req.end();
    });
  }
}

// Example usage
async function example() {
  const client = new QwenMCPClient();
  
  try {
    // Initialize session
    await client.initSession();
    
    // Write a file
    await client.writeFile('example.txt', 'Hello from Qwen MCP Client!');
    
    // Read the file back
    const content = await client.readFile('example.txt');
    console.log('File content:', content);
    
    // List files in root directory
    const files = await client.listFiles('');
    console.log('Files in workspace:', files);
    
    // Run a simple command
    const result = await client.runCommand('echo', ['Hello World']);
    console.log('Command result:', result);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run example if this script is executed directly
if (require.main === module) {
  example();
}

module.exports = QwenMCPClient;