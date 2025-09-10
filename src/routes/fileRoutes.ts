import { Router } from 'express';
import { FileController } from '../controllers/FileController';
import { RequestValidationMiddleware } from '../middleware/validationMiddleware';

const router = Router();
const fileController = new FileController();
const validationMiddleware = new RequestValidationMiddleware();

// Validation middleware for writeFile endpoint
const validateWriteFile = [
  validationMiddleware.validateRequiredFields(['path', 'content']),
  validationMiddleware.validateFieldTypes({ path: 'string', content: 'string' })
];

/**
 * Get file content by path
 * @route GET /files/{path}
 * @group Files - File management operations
 * @param {string} path.path.required - File path
 * @returns {FileContent.model} 200 - File content
 * @returns {Error} 404 - File not found
 * @returns {Error} 500 - Server error
 */
router.get('/:path', (req, res) => fileController.getFile(req, res));

/**\n * Write file content\n * @route POST /files\n * @group Files - File management operations\n * @param {FileContent.model} fileContent.body.required - File content object\n * @returns {object} 200 - Success message\n * @returns {Error} 500 - Server error\n */
router.post('/', validateWriteFile, (req, res) => fileController.writeFile(req, res));

/**
 * List files in a directory
 * @route GET /files/list/{path}
 * @group Files - File management operations
 * @param {string} path.path - Directory path
 * @returns {object} 200 - File list
 * @returns {Error} 404 - Directory not found
 * @returns {Error} 500 - Server error
 */
router.get('/list/:path', (req, res) => fileController.listFiles(req, res));

// Default list files route (root directory)
router.get('/list', (req, res) => fileController.listFiles(req, res));

export default router;