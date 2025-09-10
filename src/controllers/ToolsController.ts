import { Request, Response } from 'express';
import { ToolRegistry } from '../tools/ToolRegistry';
import { policyEngine } from '../index';
import { PolicyEvaluationContext } from '../models/Policy';

export class ToolsController {
  private toolRegistry: ToolRegistry;

  constructor(toolRegistry: ToolRegistry) {
    this.toolRegistry = toolRegistry;
  }

  /**
   * List all available tools
   * @param req Request
   * @param res Response
   */
  public listTools(req: Request, res: Response): void {
    try {
      // Create policy evaluation context
      const context: PolicyEvaluationContext = {
        sessionId: req.headers['x-session-id'] as string || 'unknown',
        ipAddress: req.ip || 'unknown',
        resource: 'tools',
        action: 'fileAccess',
        timestamp: new Date()
      };
      
      // Check policy
      if (!policyEngine.isActionAllowed(context)) {
        res.status(403).json({ error: 'Access denied by policy' });
        return;
      }
      
      const tools = this.toolRegistry.getAllTools().map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }));
      
      res.status(200).json({ tools });
    } catch (error) {
      res.status(500).json({ error: 'Failed to list tools' });
    }
  }

  /**
   * Get tool information
   * @param req Request with tool name
   * @param res Response with tool information
   */
  public getTool(req: Request, res: Response): void {
    try {
      const toolName = req.params.toolName;
      
      // Create policy evaluation context
      const context: PolicyEvaluationContext = {
        sessionId: req.headers['x-session-id'] as string || 'unknown',
        ipAddress: req.ip || 'unknown',
        resource: `tools/${toolName}`,
        action: 'fileAccess',
        timestamp: new Date()
      };
      
      // Check policy
      if (!policyEngine.isActionAllowed(context)) {
        res.status(403).json({ error: 'Access denied by policy' });
        return;
      }
      
      const tool = this.toolRegistry.getTool(toolName);
      
      if (!tool) {
        res.status(404).json({ error: 'Tool not found' });
        return;
      }
      
      res.status(200).json({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get tool' });
    }
  }

  /**
   * Execute a tool
   * @param req Request with tool name and arguments
   * @param res Response with tool result
   */
  public executeTool(req: Request, res: Response): void {
    try {
      const toolName = req.params.toolName;
      const args = req.body;
      
      // Create policy evaluation context
      const context: PolicyEvaluationContext = {
        sessionId: req.headers['x-session-id'] as string || 'unknown',
        ipAddress: req.ip || 'unknown',
        resource: `tools/${toolName}`,
        action: 'commandExecution',
        timestamp: new Date()
      };
      
      // Check policy
      if (!policyEngine.isActionAllowed(context)) {
        res.status(403).json({ error: 'Access denied by policy' });
        return;
      }
      
      // Check if tool exists
      const tool = this.toolRegistry.getTool(toolName);
      if (!tool) {
        res.status(404).json({ error: 'Tool not found' });
        return;
      }
      
      // Execute the tool
      this.toolRegistry.executeTool(toolName, args)
        .then(result => {
          res.status(200).json(result);
        })
        .catch(error => {
          res.status(500).json({ 
            error: 'Failed to execute tool',
            message: error.message
          });
        });
    } catch (error) {
      res.status(500).json({ error: 'Failed to execute tool' });
    }
  }
}