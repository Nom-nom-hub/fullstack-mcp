import { SessionController } from '../controllers/SessionController';
import { Request, Response } from 'express';

// Mock Request and Response objects
const mockRequest = (): Request => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
  } as Request;
};

const mockResponse = (): Response => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;
  
  return res;
};

describe('SessionController', () => {
  let sessionController: SessionController;

  beforeEach(() => {
    sessionController = new SessionController();
  });

  describe('initSession', () => {
    it('should create a new session with capabilities', () => {
      const req = mockRequest();
      const res = mockResponse();
      
      req.body = {
        tools: ['readFile', 'writeFile']
      };
      
      sessionController.initSession(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.sessionId).toBeDefined();
      expect(response.capabilities).toEqual(['readFile', 'writeFile']);
    });

    it('should create a new session without capabilities', () => {
      const req = mockRequest();
      const res = mockResponse();
      
      req.body = {};
      
      sessionController.initSession(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.sessionId).toBeDefined();
      expect(response.capabilities).toEqual([]);
    });
  });

  describe('listCapabilities', () => {
    it('should return a list of capabilities', () => {
      const req = mockRequest();
      const res = mockResponse();
      
      sessionController.listCapabilities(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.tools).toBeDefined();
      expect(Array.isArray(response.tools)).toBe(true);
    });
  });

  describe('getSession', () => {
    it('should return session info for valid session ID', () => {
      // First create a session
      const req1 = mockRequest();
      const res1 = mockResponse();
      
      req1.body = {
        tools: ['readFile', 'writeFile']
      };
      
      sessionController.initSession(req1, res1);
      const sessionResponse = (res1.json as jest.Mock).mock.calls[0][0];
      
      // Then get the session
      const req2 = mockRequest();
      const res2 = mockResponse();
      
      req2.params = {
        sessionId: sessionResponse.sessionId
      };
      
      sessionController.getSession(req2, res2);
      
      expect(res2.status).toHaveBeenCalledWith(200);
      expect(res2.json).toHaveBeenCalled();
    });

    it('should return 404 for invalid session ID', () => {
      const req = mockRequest();
      const res = mockResponse();
      
      req.params = {
        sessionId: 'invalid-session-id'
      };
      
      sessionController.getSession(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalled();
    });
  });
});