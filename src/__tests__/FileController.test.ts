import { FileController } from '../controllers/FileController';
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

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

describe('FileController', () => {
  let fileController: FileController;
  const testWorkspace = './test-workspace';

  beforeEach(() => {
    fileController = new FileController(testWorkspace);
  });

  afterEach(() => {
    // Clean up test workspace
    if (fs.existsSync(testWorkspace)) {
      fs.rmSync(testWorkspace, { recursive: true });
    }
  });

  describe('writeFile', () => {
    it('should write file content successfully', () => {
      const req = mockRequest();
      const res = mockResponse();
      
      req.body = {
        path: 'test.txt',
        content: 'Hello, World!'
      };
      
      fileController.writeFile(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'File written successfully' });
    });

    it('should return 400 for missing file path', () => {
      const req = mockRequest();
      const res = mockResponse();
      
      req.body = {
        content: 'Hello, World!'
      };
      
      fileController.writeFile(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'File path is required' });
    });

    it('should return 400 for missing file content', () => {
      const req = mockRequest();
      const res = mockResponse();
      
      req.body = {
        path: 'test.txt'
      };
      
      fileController.writeFile(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'File content is required' });
    });

    it('should return 400 for invalid file path (directory traversal)', () => {
      const req = mockRequest();
      const res = mockResponse();
      
      req.body = {
        path: '../test.txt',
        content: 'Hello, World!'
      };
      
      fileController.writeFile(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid file path' });
    });
  });

  describe('getFile', () => {
    it('should read file content successfully', () => {
      // First write a file
      const writeReq = mockRequest();
      const writeRes = mockResponse();
      
      writeReq.body = {
        path: 'test.txt',
        content: 'Hello, World!'
      };
      
      fileController.writeFile(writeReq, writeRes);
      
      // Then read the file
      const req = mockRequest();
      const res = mockResponse();
      
      req.params = {
        path: 'test.txt'
      };
      
      fileController.getFile(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.path).toBe('test.txt');
      expect(response.content).toBe('Hello, World!');
    });

    it('should return 404 for non-existent file', () => {
      const req = mockRequest();
      const res = mockResponse();
      
      req.params = {
        path: 'non-existent.txt'
      };
      
      fileController.getFile(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'File not found' });
    });

    it('should return 400 for missing file path', () => {
      const req = mockRequest();
      const res = mockResponse();
      
      req.params = {};
      
      fileController.getFile(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'File path is required' });
    });

    it('should return 400 for invalid file path (directory traversal)', () => {
      const req = mockRequest();
      const res = mockResponse();
      
      req.params = {
        path: '../test.txt'
      };
      
      fileController.getFile(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid file path' });
    });

    it('should return 400 when trying to read a directory', () => {
      // Create a directory
      const dirPath = path.join(testWorkspace, 'testdir');
      fs.mkdirSync(dirPath, { recursive: true });
      
      const req = mockRequest();
      const res = mockResponse();
      
      req.params = {
        path: 'testdir'
      };
      
      fileController.getFile(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Path is a directory, not a file' });
    });
  });

  describe('listFiles', () => {
    it('should list files in directory', () => {
      // First write a file
      const writeReq = mockRequest();
      const writeRes = mockResponse();
      
      writeReq.body = {
        path: 'test.txt',
        content: 'Hello, World!'
      };
      
      fileController.writeFile(writeReq, writeRes);
      
      // Then list files
      const req = mockRequest();
      const res = mockResponse();
      
      req.params = {
        path: ''
      };
      
      fileController.listFiles(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.files).toContain('test.txt');
    });

    it('should return 400 for invalid directory path (directory traversal)', () => {
      const req = mockRequest();
      const res = mockResponse();
      
      req.params = {
        path: '../testdir'
      };
      
      fileController.listFiles(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid directory path' });
    });

    it('should return 400 when trying to list files in a file path', () => {
      // First write a file
      const writeReq = mockRequest();
      const writeRes = mockResponse();
      
      writeReq.body = {
        path: 'test.txt',
        content: 'Hello, World!'
      };
      
      fileController.writeFile(writeReq, writeRes);
      
      // Then try to list files in that file
      const req = mockRequest();
      const res = mockResponse();
      
      req.params = {
        path: 'test.txt'
      };
      
      fileController.listFiles(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Path is a file, not a directory' });
    });
  });
});