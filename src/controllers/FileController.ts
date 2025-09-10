import { Request, Response } from 'express';
import { FileContent } from '../models';
import fs from 'fs';
import path from 'path';
import { PolicyEvaluationContext } from '../models/Policy';
import { PolicyEngine } from '../services/PolicyEngine';
import { ValidationError, NotFoundError, ForbiddenError, InternalError } from '../utils/AppError';

export class FileController {
  private workspacePath: string;
  private policyEngine: PolicyEngine;

  constructor(workspacePath: string = './workspace') {
    this.workspacePath = path.resolve(workspacePath);
    // Ensure workspace directory exists
    if (!fs.existsSync(this.workspacePath)) {
      fs.mkdirSync(this.workspacePath, { recursive: true });
    }
    
    // Initialize policy engine
    this.policyEngine = new PolicyEngine();
    // Add default policy for development
    this.policyEngine.addPolicy(PolicyEngine.createDefaultPolicy());
  }

  /**
   * Get file content by path
   * @param req Request with file path
   * @param res Response with file content
   */
  public getFile(req: Request, res: Response): void {
    try {
      const filePath = req.params.path;
      
      // Validate file path
      if (!filePath) {
        throw new ValidationError('File path is required');
      }
      
      // Sanitize file path to prevent directory traversal
      if (!this.isValidPath(filePath)) {
        throw new ValidationError('Invalid file path');
      }
      
      const fullPath = path.resolve(path.join(this.workspacePath, filePath));
      
      // Create policy evaluation context
      const context: PolicyEvaluationContext = {
        sessionId: req.headers['x-session-id'] as string || 'unknown',
        ipAddress: req.ip || 'unknown',
        resource: filePath,
        action: 'fileAccess',
        timestamp: new Date()
      };
      
      // Check policy
      if (!this.policyEngine.isActionAllowed(context)) {
        throw new ForbiddenError('Access denied by policy');
      }
      
      // Security check: ensure file is within workspace
      if (!fullPath.startsWith(this.workspacePath)) {
        throw new ForbiddenError('Access denied');
      }
      
      if (!fs.existsSync(fullPath)) {
        throw new NotFoundError('File not found');
      }
      
      // Check if it's a directory
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        throw new ValidationError('Path is a directory, not a file');
      }
      
      const content = fs.readFileSync(fullPath, 'utf8');
      const fileContent: FileContent = {
        path: filePath,
        content
      };
      
      res.status(200).json(fileContent);
    } catch (error: any) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else if (error instanceof ForbiddenError) {
        res.status(403).json({ error: error.message });
      } else {
        console.error('Unexpected error in getFile:', error);
        res.status(500).json({ error: 'Failed to read file' });
      }
    }
  }

  /**
   * Write file content
   * @param req Request with file content
   * @param res Response with status
   */
  public writeFile(req: Request, res: Response): void {
    try {
      const fileContent: FileContent = req.body;
      
      // Validate input
      if (!fileContent.path) {
        throw new ValidationError('File path is required');
      }
      
      if (fileContent.content === undefined) {
        throw new ValidationError('File content is required');
      }
      
      // Sanitize file path to prevent directory traversal
      if (!this.isValidPath(fileContent.path)) {
        throw new ValidationError('Invalid file path');
      }
      
      // Create policy evaluation context
      const context: PolicyEvaluationContext = {
        sessionId: req.headers['x-session-id'] as string || 'unknown',
        ipAddress: req.ip || 'unknown',
        resource: fileContent.path,
        action: 'fileAccess',
        timestamp: new Date()
      };
      
      // Check policy
      if (!this.policyEngine.isActionAllowed(context)) {
        throw new ForbiddenError('Access denied by policy');
      }
      
      const fullPath = path.resolve(path.join(this.workspacePath, fileContent.path));
      
      // Security check: ensure file is within workspace
      if (!fullPath.startsWith(this.workspacePath)) {
        throw new ForbiddenError('Access denied');
      }
      
      // Ensure directory exists
      const dirPath = path.dirname(fullPath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, fileContent.content, 'utf8');
      
      res.status(200).json({ success: true, message: 'File written successfully' });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else if (error instanceof ForbiddenError) {
        res.status(403).json({ error: error.message });
      } else {
        console.error('Unexpected error in writeFile:', error);
        res.status(500).json({ error: 'Failed to write file' });
      }
    }
  }

  /**
   * List files in a directory
   * @param req Request with directory path
   * @param res Response with file list
   */
  public listFiles(req: Request, res: Response): void {
    try {
      // Handle root directory case
      const dirPath = req.params.path || '';
      
      // Validate directory path
      if (dirPath && !this.isValidPath(dirPath)) {
        throw new ValidationError('Invalid directory path');
      }
      
      // Create policy evaluation context
      const context: PolicyEvaluationContext = {
        sessionId: req.headers['x-session-id'] as string || 'unknown',
        ipAddress: req.ip || 'unknown',
        resource: dirPath,
        action: 'fileAccess',
        timestamp: new Date()
      };
      
      // Check policy
      if (!this.policyEngine.isActionAllowed(context)) {
        throw new ForbiddenError('Access denied by policy');
      }
      
      const fullPath = dirPath ? 
        path.resolve(path.join(this.workspacePath, dirPath)) : 
        this.workspacePath;
      
      // Security check: ensure path is within workspace
      if (!fullPath.startsWith(this.workspacePath)) {
        throw new ForbiddenError('Access denied');
      }
      
      if (!fs.existsSync(fullPath)) {
        throw new NotFoundError('Directory not found');
      }
      
      // Check if it's a file
      const stats = fs.statSync(fullPath);
      if (stats.isFile()) {
        throw new ValidationError('Path is a file, not a directory');
      }
      
      const files = fs.readdirSync(fullPath);
      res.status(200).json({ path: dirPath, files });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else if (error instanceof ForbiddenError) {
        res.status(403).json({ error: error.message });
      } else {
        console.error('Unexpected error in listFiles:', error);
        res.status(500).json({ error: 'Failed to list files' });
      }
    }
  }

  /**
   * Validate file path to prevent directory traversal attacks
   * @param filePath File path to validate
   * @returns True if valid, false otherwise
   */
  private isValidPath(filePath: string): boolean {
    // Check for directory traversal attempts
    if (filePath.includes('../') || filePath.includes('..\\')) {
      return false;
    }
    
    // Check for absolute paths
    if (path.isAbsolute(filePath)) {
      return false;
    }
    
    // Check for null bytes
    if (filePath.includes('\0')) {
      return false;
    }
    
    return true;
  }
}