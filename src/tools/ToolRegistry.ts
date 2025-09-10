import { Tool } from './Tool';
import { CodeAnalyzerTool } from './CodeAnalyzerTool';
import { TestRunnerTool } from './TestRunnerTool';
import { DocumentationGeneratorTool } from './DocumentationGeneratorTool';

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  /**
   * Register a tool
   * @param tool Tool to register
   */
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Get a tool by name
   * @param name Tool name
   * @returns Tool or undefined if not found
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   * @returns Array of all tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Execute a tool
   * @param name Tool name
   * @param args Tool arguments
   * @returns Tool result
   */
  async executeTool(name: string, args: any): Promise<any> {
    const tool = this.tools.get(name);
    
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    
    return await tool.execute(args);
  }

  /**
   * Register default tools
   */
  private registerDefaultTools(): void {
    this.registerTool(new CodeAnalyzerTool());
    this.registerTool(new TestRunnerTool());
    this.registerTool(new DocumentationGeneratorTool());
  }
}