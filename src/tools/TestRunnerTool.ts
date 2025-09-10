import { Tool, ToolResult, ToolParameter } from './Tool';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export class TestRunnerTool implements Tool {
  name = 'test-runner';
  description = 'Runs tests and reports results';
  
  parameters: ToolParameter[] = [
    {
      name: 'pattern',
      type: 'string',
      description: 'Test file pattern to run',
      required: false,
      default: 'src/**/*.test.ts'
    },
    {
      name: 'watch',
      type: 'boolean',
      description: 'Run tests in watch mode',
      required: false,
      default: false
    }
  ];

  async execute(args: { pattern?: string; watch?: boolean }): Promise<ToolResult> {
    try {
      const pattern = args.pattern || 'src/**/*.test.ts';
      const watch = args.watch || false;
      
      let command = `npx jest ${pattern}`;
      
      if (watch) {
        command += ' --watch';
      }
      
      // Run tests with a timeout
      const result = await Promise.race([
        execPromise(command),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test execution timeout')), 60000)
        )
      ]);
      
      return {
        success: true,
        data: {
          pattern,
          watch,
          output: (result as any).stdout,
          errors: (result as any).stderr
        }
      };
    } catch (error: any) {
      // Jest returns non-zero exit codes for test failures
      // This is expected behavior, not an error
      if (error.stdout || error.stderr) {
        return {
          success: true,
          data: {
            pattern: args.pattern || 'src/**/*.test.ts',
            watch: args.watch || false,
            output: error.stdout || '',
            errors: error.stderr || '',
            exitCode: error.code || 1
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