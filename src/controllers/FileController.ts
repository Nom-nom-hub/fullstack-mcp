import { Request, Response } from 'express';
import { FileContent } from '../models';
import fs from 'fs';
import path from 'path';
import { PolicyEvaluationContext } from '../models/Policy';
import { PolicyEngine } from '../services/PolicyEngine';
import { ValidationError, NotFoundError, ForbiddenError, InternalError } from '../utils/AppError';
import { Logger } from '../utils/Logger';

export class FileController {
  private workspacePath: string;
  private policyEngine: PolicyEngine;
  private logger: Logger;

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
    
    // Initialize logger
    this.logger = new Logger('./logs/file-controller.log', 'DEBUG', 'FileController');
  }

  /**
   * Get file content by path
   * @param req Request with file path
   * @param res Response with file content
   */
  public getFile(req: Request, res: Response): void {
    const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    this.logger.info('getFile request received', { filePath: req.params.path }, requestId);
    
    try {
      const filePath = req.params.path;
      
      // Validate file path
      if (!filePath) {
        this.logger.warn('getFile validation failed: File path is required', { filePath }, requestId);
        throw new ValidationError('File path is required');
      }
      
      // Sanitize file path to prevent directory traversal
      if (!this.isValidPath(filePath)) {
        this.logger.warn('getFile validation failed: Invalid file path', { filePath }, requestId);
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
        this.logger.warn('getFile policy check failed: Access denied by policy', { filePath, context }, requestId);
        throw new ForbiddenError('Access denied by policy');
      }
      
      // Security check: ensure file is within workspace
      if (!fullPath.startsWith(this.workspacePath)) {
        this.logger.warn('getFile security check failed: Access denied', { filePath, fullPath, workspacePath: this.workspacePath }, requestId);
        throw new ForbiddenError('Access denied');
      }
      
      if (!fs.existsSync(fullPath)) {
        this.logger.warn('getFile not found: File not found', { filePath, fullPath }, requestId);
        throw new NotFoundError('File not found');
      }
      
      // Check if it's a directory
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        this.logger.warn('getFile validation failed: Path is a directory, not a file', { filePath, fullPath }, requestId);
        throw new ValidationError('Path is a directory, not a file');
      }
      
      const content = fs.readFileSync(fullPath, 'utf8');
      const fileContent: FileContent = {
        path: filePath,
        content
      };
      
      this.logger.info('getFile successful', { filePath, fullPath }, requestId);
      res.status(200).json(fileContent);
    } catch (error: any) {
      if (error instanceof ValidationError) {
        this.logger.warn('getFile validation error', { error: error.message }, requestId);
        res.status(400).json({ error: error.message });
      } else if (error instanceof NotFoundError) {
        this.logger.warn('getFile not found error', { error: error.message }, requestId);
        res.status(404).json({ error: error.message });
      } else if (error instanceof ForbiddenError) {
        this.logger.warn('getFile forbidden error', { error: error.message }, requestId);
        res.status(403).json({ error: error.message });
      } else {
        this.logger.error('getFile unexpected error', { error: error.message, stack: error.stack }, requestId);
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
    const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    this.logger.info('writeFile request received', { fileContent: req.body }, requestId);
    
    try {
      const fileContent: FileContent = req.body;
      
      // Validate input
      if (!fileContent.path) {
        this.logger.warn('writeFile validation failed: File path is required', { fileContent }, requestId);
        throw new ValidationError('File path is required');
      }
      
      if (fileContent.content === undefined) {
        this.logger.warn('writeFile validation failed: File content is required', { fileContent }, requestId);
        throw new ValidationError('File content is required');
      }
      
      // Sanitize file path to prevent directory traversal
      if (!this.isValidPath(fileContent.path)) {
        this.logger.warn('writeFile validation failed: Invalid file path', { fileContent }, requestId);
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
        this.logger.warn('writeFile policy check failed: Access denied by policy', { fileContent, context }, requestId);
        throw new ForbiddenError('Access denied by policy');
      }
      
      const fullPath = path.resolve(path.join(this.workspacePath, fileContent.path));
      
      // Security check: ensure file is within workspace
      if (!fullPath.startsWith(this.workspacePath)) {
        this.logger.warn('writeFile security check failed: Access denied', { fileContent, fullPath, workspacePath: this.workspacePath }, requestId);
        throw new ForbiddenError('Access denied');
      }
      
      // Ensure directory exists
      const dirPath = path.dirname(fullPath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, fileContent.content, 'utf8');
      
      this.logger.info('writeFile successful', { fileContent, fullPath }, requestId);
      res.status(200).json({ success: true, message: 'File written successfully' });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        this.logger.warn('writeFile validation error', { error: error.message }, requestId);
        res.status(400).json({ error: error.message });
      } else if (error instanceof ForbiddenError) {
        this.logger.warn('writeFile forbidden error', { error: error.message }, requestId);
        res.status(403).json({ error: error.message });
      } else {
        this.logger.error('writeFile unexpected error', { error: error.message, stack: error.stack }, requestId);
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
    const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    this.logger.info('listFiles request received', { dirPath: req.params.path }, requestId);
    
    try {
      // Handle root directory case
      const dirPath = req.params.path || '';
      
      // Validate directory path
      if (dirPath && !this.isValidPath(dirPath)) {
        this.logger.warn('listFiles validation failed: Invalid directory path', { dirPath }, requestId);
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
        this.logger.warn('listFiles policy check failed: Access denied by policy', { dirPath, context }, requestId);
        throw new ForbiddenError('Access denied by policy');
      }
      
      const fullPath = dirPath ? 
        path.resolve(path.join(this.workspacePath, dirPath)) : 
        this.workspacePath;
      
      // Security check: ensure path is within workspace
      if (!fullPath.startsWith(this.workspacePath)) {
        this.logger.warn('listFiles security check failed: Access denied', { dirPath, fullPath, workspacePath: this.workspacePath }, requestId);
        throw new ForbiddenError('Access denied');
      }
      
      if (!fs.existsSync(fullPath)) {
        this.logger.warn('listFiles not found: Directory not found', { dirPath, fullPath }, requestId);
        throw new NotFoundError('Directory not found');
      }
      
      // Check if it's a file
      const stats = fs.statSync(fullPath);
      if (stats.isFile()) {
        this.logger.warn('listFiles validation failed: Path is a file, not a directory', { dirPath, fullPath }, requestId);
        throw new ValidationError('Path is a file, not a directory');
      }
      
      const files = fs.readdirSync(fullPath);
      this.logger.info('listFiles successful', { dirPath, fullPath, fileCount: files.length }, requestId);
      res.status(200).json({ path: dirPath, files });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        this.logger.warn('listFiles validation error', { error: error.message }, requestId);
        res.status(400).json({ error: error.message });
      } else if (error instanceof NotFoundError) {
        this.logger.warn('listFiles not found error', { error: error.message }, requestId);
        res.status(404).json({ error: error.message });
      } else if (error instanceof ForbiddenError) {
        this.logger.warn('listFiles forbidden error', { error: error.message }, requestId);
        res.status(403).json({ error: error.message });
      } else {
        this.logger.error('listFiles unexpected error', { error: error.message, stack: error.stack }, requestId);
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