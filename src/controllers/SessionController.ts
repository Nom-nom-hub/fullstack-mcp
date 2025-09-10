import { Request, Response } from 'express';
import { SessionInfo, Capabilities } from '../models';

export class SessionController {
  private sessions: Map<string, SessionInfo> = new Map();

  /**
   * Initialize a new session
   * @param req Request with capabilities
   * @param res Response with session info
   */
  public initSession(req: Request, res: Response): void {
    try {
      const capabilities: string[] = req.body.tools || [];
      const sessionId = this.generateSessionId();
      
      const sessionInfo: SessionInfo = {
        sessionId,
        capabilities
      };

      this.sessions.set(sessionId, sessionInfo);
      
      res.status(200).json(sessionInfo);
    } catch (error) {
      res.status(500).json({ error: 'Failed to initialize session' });
    }
  }

  /**
   * List all capabilities
   * @param req Request
   * @param res Response with capabilities
   */
  public listCapabilities(req: Request, res: Response): void {
    try {
      // For now, return a static list of capabilities
      // In a real implementation, this would be dynamic
      const capabilities: Capabilities = {
        tools: [
          'readFile',
          'writeFile',
          'runCommand',
          'listFiles'
        ]
      };
      
      res.status(200).json(capabilities);
    } catch (error) {
      res.status(500).json({ error: 'Failed to list capabilities' });
    }
  }

  /**
   * Get session info by ID
   * @param req Request with session ID
   * @param res Response with session info
   */
  public getSession(req: Request, res: Response): void {
    try {
      const sessionId = req.params.sessionId;
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }
      
      res.status(200).json(session);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get session' });
    }
  }

  /**
   * Generate a unique session ID
   * @returns Unique session ID
   */
  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}