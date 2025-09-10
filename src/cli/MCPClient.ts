import http from 'http';
import https from 'https';

export class MCPClient {
  private serverUrl: string;
  private sessionId: string | null;

  constructor(serverUrl: string = 'http://localhost:8080') {
    this.serverUrl = serverUrl;
    this.sessionId = null;
  }

  /**
   * Initialize a session with the MCP Server
   * @param capabilities - Array of capabilities to request
   * @returns Session ID
   */
  async initSession(capabilities: string[] = ['readFile', 'writeFile', 'runCommand', 'listFiles']): Promise<string> {
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
              resolve(this.sessionId as string);
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
   * Set the session ID
   * @param sessionId - Session ID
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  /**
   * Get the session ID
   * @returns Session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Make a GET request to the MCP Server
   * @param path - Request path
   * @returns Response data
   */
  async get(path: string): Promise<any> {
    if (!this.sessionId) {
      throw new Error('No active session. Call initSession first.');
    }
    
    const url = `${this.serverUrl}${path}`;
    
    return new Promise((resolve, reject) => {
      http.get(url, (res) => {
        let responseBody = '';
        
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(responseBody);
            resolve(response);
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
   * Make a POST request to the MCP Server
   * @param path - Request path
   * @param data - Request data
   * @returns Response data
   */
  async post(path: string, data: any): Promise<any> {
    if (!this.sessionId) {
      throw new Error('No active session. Call initSession first.');
    }
    
    const url = `${this.serverUrl}${path}`;
    const jsonData = JSON.stringify(data);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': jsonData.length
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
            resolve(response);
          } catch (error) {
            reject(error);
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.write(jsonData);
      req.end();
    });
  }

  /**
   * List available tools
   * @returns List of tools
   */
  async listTools(): Promise<any> {
    return this.get('/tools');
  }

  /**
   * Get tool information
   * @param toolName - Name of the tool
   * @returns Tool information
   */
  async getTool(toolName: string): Promise<any> {
    return this.get(`/tools/${toolName}`);
  }

  /**
   * Execute a tool
   * @param toolName - Name of the tool
   * @param args - Tool arguments
   * @returns Tool result
   */
  async executeTool(toolName: string, args: any): Promise<any> {
    return this.post(`/tools/${toolName}/execute`, args);
  }
}