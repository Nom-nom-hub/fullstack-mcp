import { Tool, ToolResult, ToolParameter } from './Tool';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export class CodeAnalyzerTool implements Tool {
  name = 'code-analyzer';
  description = 'Analyzes code quality and identifies potential issues';
  
  parameters: ToolParameter[] = [
    {
      name: 'path',
      type: 'string',
      description: 'Path to the file or directory to analyze',
      required: true
    },
    {
      name: 'tool',
      type: 'string',
      description: 'Analysis tool to use (eslint, tsc, etc.)',
      required: false,
      default: 'eslint'
    }
  ];

  async execute(args: { path: string; tool?: string }): Promise<ToolResult> {
    try {
      const tool = args.tool || 'eslint';
      let command = '';
      
      switch (tool) {
      case 'eslint':
        command = `npx eslint ${args.path}`;
        break;
      case 'tsc':
        command = 'npx tsc --noEmit --project tsconfig.json';
        break;
      default:
        return {
          success: false,
          error: `Unsupported analysis tool: ${tool}`
        };
      }
      
      const result = await execPromise(command);
      
      return {
        success: true,
        data: {
          tool,
          path: args.path,
          output: result.stdout,
          errors: result.stderr
        }
      };
    } catch (error: any) {
      // ESLint and other tools return non-zero exit codes for issues found
      // This is expected behavior, not an error
      if (error.stdout || error.stderr) {
        return {
          success: true,
          data: {
            tool: args.tool || 'eslint',
            path: args.path,
            output: error.stdout || '',
            errors: error.stderr || ''
          }
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}