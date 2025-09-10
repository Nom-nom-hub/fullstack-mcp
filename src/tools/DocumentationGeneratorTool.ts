import { Tool, ToolResult, ToolParameter } from './Tool';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = promisify(exec);

export class DocumentationGeneratorTool implements Tool {
  name = 'doc-generator';
  description = 'Generates documentation from code comments';
  
  parameters: ToolParameter[] = [
    {
      name: 'input',
      type: 'string',
      description: 'Input directory or file pattern',
      required: false,
      default: 'src/**/*.ts'
    },
    {
      name: 'output',
      type: 'string',
      description: 'Output directory for documentation',
      required: false,
      default: 'docs'
    },
    {
      name: 'format',
      type: 'string',
      description: 'Documentation format (html, markdown, json)',
      required: false,
      default: 'html'
    }
  ];

  async execute(args: { input?: string; output?: string; format?: string }): Promise<ToolResult> {
    try {
      const input = args.input || 'src/**/*.ts';
      const output = args.output || 'docs';
      const format = args.format || 'html';
      
      // Ensure output directory exists
      if (!fs.existsSync(output)) {
        fs.mkdirSync(output, { recursive: true });
      }
      
      // For this example, we'll use a simple approach to generate documentation
      // In a real implementation, you might use TypeDoc or a similar tool
      const command = `npx typedoc --entryPoints ${input} --out ${output} --theme default`;
      
      const result = await execPromise(command);
      
      return {
        success: true,
        data: {
          input,
          output,
          format,
          message: `Documentation generated successfully in ${output} directory`
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}