import { Request, Response } from 'express';
import { ExecutionResult } from '../models';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { PolicyEvaluationContext } from '../models/Policy';
import { PolicyEngine } from '../services/PolicyEngine';
import { ValidationError, ForbiddenError } from '../utils/AppError';
import { Logger } from '../utils/Logger';

const execPromise = promisify(exec);

export class ExecutionController {
  private executions: Map<string, any> = new Map();
  private policyEngine: PolicyEngine;
  private logger: Logger;

  constructor() {
    // Initialize policy engine
    this.policyEngine = new PolicyEngine();
    // Add default policy for development
    this.policyEngine.addPolicy(PolicyEngine.createDefaultPolicy());
    
    // Initialize logger
    this.logger = new Logger('./logs/execution-controller.log', 'DEBUG', 'ExecutionController');
  }

  /**
   * Run a command in a sandboxed environment
   * @param req Request with command details
   * @param res Response with execution result
   */
  public async runCommand(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    this.logger.info('runCommand request received', { command: req.body.command, args: req.body.args }, requestId);
    
    try {
      const { command, args = [], options = {} } = req.body;
      
      // Validate input
      if (!command) {
        this.logger.warn('runCommand validation failed: Command is required', { command, args }, requestId);
        throw new ValidationError('Command is required');
      }
      
      // Sanitize command and args to prevent injection
      if (!this.isValidCommand(command, args)) {
        this.logger.warn('runCommand validation failed: Invalid command or arguments', { command, args }, requestId);
        throw new ValidationError('Invalid command or arguments');
      }
      
      // Create policy evaluation context
      const context: PolicyEvaluationContext = {
        sessionId: req.headers['x-session-id'] as string || 'unknown',
        ipAddress: req.ip || 'unknown',
        resource: command,
        action: 'commandExecution',
        timestamp: new Date()
      };
      
      // Check policy
      if (!this.policyEngine.isActionAllowed(context)) {
        this.logger.warn('runCommand policy check failed: Access denied by policy', { command, args, context }, requestId);
        throw new ForbiddenError('Access denied by policy');
      }
      
      const executionId = this.generateExecutionId();
      
      // Use Docker for sandboxing if available and enabled, otherwise fallback to direct execution
      const useDocker = process.env.MCP_USE_DOCKER === 'true';
      
      this.logger.info('runCommand starting execution', { executionId, command, args, useDocker }, requestId);
      
      if (useDocker) {
        await this.runCommandInDocker(executionId, command, args, options, res);
      } else {
        await this.runCommandDirectly(executionId, command, args, options, res);
      }
      
      this.logger.info('runCommand execution completed', { executionId, command, args }, requestId);
    } catch (error: any) {
      if (error instanceof ValidationError) {
        this.logger.warn('runCommand validation error', { error: error.message }, requestId);
        res.status(400).json({ error: error.message });
      } else if (error instanceof ForbiddenError) {
        this.logger.warn('runCommand forbidden error', { error: error.message }, requestId);
        res.status(403).json({ error: error.message });
      } else {
        this.logger.error('runCommand unexpected error', { error: error.message, stack: error.stack }, requestId);
        res.status(500).json({ error: 'Failed to execute command' });
      }
    }
  }

  /**
   * Run a command directly (without Docker sandboxing)
   * @param executionId Execution ID
   * @param command Command to execute
   * @param args Command arguments
   * @param options Execution options
   * @param res Response object
   */
  private async runCommandDirectly(
    executionId: string,
    command: string,
    args: string[],
    options: any,
    res: Response
  ): Promise<void> {
    const cmd = `${command} ${args.join(' ')}`;
    
    console.log(`Executing command: ${cmd}`);
    
    // Execute the command with a timeout
    const timeout = options.timeout || 30000; // 30 seconds default
    const startTime = Date.now();
    
    try {
      // Execute command with timeout
      const result = await Promise.race([
        execPromise(cmd, { timeout }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Command timeout')), timeout)
        )
      ]);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      const executionResult: ExecutionResult = {
        executionId,
        exitCode: 0,
        logs: [
          `Command: ${cmd}`,
          `Execution time: ${executionTime}ms`,
          `Result: ${JSON.stringify(result)}`
        ]
      };
      
      this.executions.set(executionId, executionResult);
      res.status(200).json(executionResult);
    } catch (error: any) {
      const executionResult: ExecutionResult = {
        executionId,
        exitCode: error.code || 1,
        logs: [
          `Command: ${cmd}`,
          `Error: ${error.message}`,
          `Stack: ${error.stack}`
        ]
      };
      
      this.executions.set(executionId, executionResult);
      res.status(200).json(executionResult);
    }
  }

  /**
   * Run a command in a Docker container (with sandboxing)
   * @param executionId Execution ID
   * @param command Command to execute
   * @param args Command arguments
   * @param options Execution options
   * @param res Response object
   */
  private async runCommandInDocker(
    executionId: string,
    command: string,
    args: string[],
    options: any,
    res: Response
  ): Promise<void> {
    // For Docker sandboxing, we would:
    // 1. Create a container from a predefined image
    // 2. Mount the workspace directory
    // 3. Execute the command in the container
    // 4. Capture the output
    // 5. Clean up the container
    
    const cmd = `${command} ${args.join(' ')}`;
    const dockerImage = process.env.MCP_DOCKER_IMAGE || 'node:18-alpine';
    const workspacePath = process.env.MCP_WORKSPACE_PATH || './workspace';
    
    // Build Docker command with enhanced security
    const dockerCmd = 'docker run --rm ' +
      `-v ${workspacePath}:/workspace ` +
      '-w /workspace ' +
      '--network none ' +
      '--read-only ' +
      '--tmpfs /tmp ' +
      '--user 1000:1000 ' +
      '--memory 128m ' +  // Limit memory to 128MB
      '--cpus 0.5 ' +     // Limit CPU to 0.5 cores
      `${dockerImage} ${cmd}`;
    
    console.log(`Executing command in Docker: ${dockerCmd}`);
    
    // Execute the command with a timeout
    const timeout = options.timeout || 30000; // 30 seconds default
    const startTime = Date.now();
    
    try {
      // Execute command with timeout
      const result = await Promise.race([
        execPromise(dockerCmd, { timeout }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Command timeout')), timeout)
        )
      ]);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      const executionResult: ExecutionResult = {
        executionId,
        exitCode: 0,
        logs: [
          `Command: ${cmd}`,
          `Docker Image: ${dockerImage}`,
          `Execution time: ${executionTime}ms`,
          `STDOUT: ${(result as any).stdout || ''}`,
          `STDERR: ${(result as any).stderr || ''}`
        ]
      };
      
      this.executions.set(executionId, executionResult);
      res.status(200).json(executionResult);
    } catch (error: any) {
      const executionResult: ExecutionResult = {
        executionId,
        exitCode: error.code || 1,
        logs: [
          `Command: ${cmd}`,
          `Docker Image: ${dockerImage}`,
          `Error: ${error.message}`,
          `STDOUT: ${error.stdout || ''}`,
          `STDERR: ${error.stderr || ''}`,
          `Stack: ${error.stack || ''}`
        ]
      };
      
      this.executions.set(executionId, executionResult);
      res.status(200).json(executionResult);
    }
  }

  /**
   * Cancel an execution
   * @param req Request with execution ID
   * @param res Response with status
   */
  public cancelExecution(req: Request, res: Response): void {
    try {
      const { executionId } = req.params;
      
      // Create policy evaluation context
      const context: PolicyEvaluationContext = {
        sessionId: req.headers['x-session-id'] as string || 'unknown',
        ipAddress: req.ip || 'unknown',
        resource: executionId,
        action: 'commandExecution',
        timestamp: new Date()
      };
      
      // Check policy
      if (!this.policyEngine.isActionAllowed(context)) {
        res.status(403).json({ error: 'Access denied by policy' });
        return;
      }
      
      // TODO: Implement actual cancellation
      // For now, just remove from executions map
      if (this.executions.has(executionId)) {
        this.executions.delete(executionId);
        res.status(200).json({ success: true, message: 'Execution cancelled' });
      } else {
        res.status(404).json({ error: 'Execution not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to cancel execution' });
    }
  }

  /**
   * Get execution result by ID
   * @param req Request with execution ID
   * @param res Response with execution result
   */
  public getExecution(req: Request, res: Response): void {
    try {
      const { executionId } = req.params;
      
      // Create policy evaluation context
      const context: PolicyEvaluationContext = {
        sessionId: req.headers['x-session-id'] as string || 'unknown',
        ipAddress: req.ip || 'unknown',
        resource: executionId,
        action: 'commandExecution',
        timestamp: new Date()
      };
      
      // Check policy
      if (!this.policyEngine.isActionAllowed(context)) {
        res.status(403).json({ error: 'Access denied by policy' });
        return;
      }
      
      const execution = this.executions.get(executionId);
      
      if (!execution) {
        res.status(404).json({ error: 'Execution not found' });
        return;
      }
      
      res.status(200).json(execution);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get execution' });
    }
  }

  /**
   * Generate a unique execution ID
   * @returns Unique execution ID
   */
  private generateExecutionId(): string {
    return 'exec-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Validate command and arguments to prevent injection attacks
   * @param command Command to validate
   * @param args Arguments to validate
   * @returns True if valid, false otherwise
   */
  private isValidCommand(command: string, args: string[]): boolean {
    // Basic validation - command should not contain dangerous characters
    const dangerousPatterns = [
      /;/g,           // Command chaining
      /\|\|/g,        // OR operator
      /&&/g,          // AND operator
      /\$/g,          // Variable substitution
      /`/g,           // Command substitution
      />/g,           // Output redirection
      /</g,           // Input redirection
      /\(/g,          // Subshell
      /\{/g           // Command grouping
    ];
    
    // Check command
    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        return false;
      }
    }
    
    // Check arguments
    for (const arg of args) {
      for (const pattern of dangerousPatterns) {
        if (pattern.test(arg)) {
          return false;
        }
      }
    }
    
    return true;
  }
}