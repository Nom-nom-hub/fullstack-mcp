import { ExecutionController } from '../controllers/ExecutionController';
import { Request, Response } from 'express';

// Mock Request and Response objects
const mockRequest = (): Request => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    ip: '127.0.0.1'
  } as Request;
};

const mockResponse = (): Response => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;
  
  return res;
};

describe('ExecutionController', () => {
  let executionController: ExecutionController;

  beforeEach(() => {
    executionController = new ExecutionController();
  });

  describe('runCommand', () => {
    it('should execute a simple command successfully', async () => {
      const req = mockRequest();
      const res = mockResponse();
      
      req.body = {
        command: 'echo',
        args: ['Hello, World!']
      };
      
      await executionController.runCommand(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.executionId).toBeDefined();
      expect(response.exitCode).toBe(0);
      expect(response.logs).toBeDefined();
      expect(Array.isArray(response.logs)).toBe(true);
    }, 10000); // 10 second timeout

    it('should handle command errors gracefully', async () => {
      const req = mockRequest();
      const res = mockResponse();
      
      req.body = {
        command: 'nonexistentcommandthatshouldfail',
        args: []
      };
      
      await executionController.runCommand(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.executionId).toBeDefined();
      expect(response.exitCode).not.toBe(0);
      expect(response.logs).toBeDefined();
      expect(Array.isArray(response.logs)).toBe(true);
    }, 10000); // 10 second timeout

    it('should return 400 for missing command', async () => {
      const req = mockRequest();
      const res = mockResponse();
      
      req.body = {
        args: ['Hello, World!']
      };
      
      await executionController.runCommand(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Command is required' });
    });

    it('should return 400 for invalid command (injection attempt)', async () => {
      const req = mockRequest();
      const res = mockResponse();
      
      req.body = {
        command: 'echo; rm -rf /',
        args: []
      };
      
      await executionController.runCommand(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid command or arguments' });
    });

    it('should return 400 for invalid arguments (injection attempt)', async () => {
      const req = mockRequest();
      const res = mockResponse();
      
      req.body = {
        command: 'echo',
        args: ['; rm -rf /']
      };
      
      await executionController.runCommand(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid command or arguments' });
    });
  });

  describe('getExecution', () => {
    it('should return execution result for valid execution ID', async () => {
      // First run a command
      const req1 = mockRequest();
      const res1 = mockResponse();
      
      req1.body = {
        command: 'echo',
        args: ['Hello, World!']
      };
      
      await executionController.runCommand(req1, res1);
      const executionResponse = (res1.json as jest.Mock).mock.calls[0][0];
      
      // Then get the execution result
      const req2 = mockRequest();
      const res2 = mockResponse();
      
      req2.params = {
        executionId: executionResponse.executionId
      };
      
      executionController.getExecution(req2, res2);
      
      expect(res2.status).toHaveBeenCalledWith(200);
      expect(res2.json).toHaveBeenCalled();
      
      const response = (res2.json as jest.Mock).mock.calls[0][0];
      expect(response.executionId).toBe(executionResponse.executionId);
    });

    it('should return 404 for invalid execution ID', () => {
      const req = mockRequest();
      const res = mockResponse();
      
      req.params = {
        executionId: 'invalid-execution-id'
      };
      
      executionController.getExecution(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Execution not found' });
    });
  });

  describe('cancelExecution', () => {
    it('should cancel a valid execution', async () => {
      // First run a command
      const req1 = mockRequest();
      const res1 = mockResponse();
      
      req1.body = {
        command: 'echo',
        args: ['Hello, World!']
      };
      
      await executionController.runCommand(req1, res1);
      const executionResponse = (res1.json as jest.Mock).mock.calls[0][0];
      
      // Then cancel the execution
      const req2 = mockRequest();
      const res2 = mockResponse();
      
      req2.params = {
        executionId: executionResponse.executionId
      };
      
      executionController.cancelExecution(req2, res2);
      
      expect(res2.status).toHaveBeenCalledWith(200);
      expect(res2.json).toHaveBeenCalledWith({ success: true, message: 'Execution cancelled' });
    });

    it('should return 404 for invalid execution ID', () => {
      const req = mockRequest();
      const res = mockResponse();
      
      req.params = {
        executionId: 'invalid-execution-id'
      };
      
      executionController.cancelExecution(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Execution not found' });
    });
  });
});