import { Router, Request, Response } from 'express';
import { ExecutionController } from '../controllers/ExecutionController';
import { RequestValidationMiddleware } from '../middleware/validationMiddleware';

const router = Router();
const executionController = new ExecutionController();
const validationMiddleware = new RequestValidationMiddleware();

// Validation middleware for runCommand endpoint
const validateRunCommand = [
  validationMiddleware.validateRequiredFields(['command']),
  validationMiddleware.validateFieldTypes({ command: 'string', args: 'object' })
];

/**
 * Run a command
 * @route POST /execute
 * @group Execution - Command execution operations
 * @param {object} command.body.required - Command details
 * @returns {ExecutionResult.model} 200 - Execution result
 * @returns {Error} 500 - Server error
 */
router.post('/', validateRunCommand, (req: Request, res: Response) => executionController.runCommand(req, res));

/**
 * Cancel an execution
 * @route DELETE /execute/{executionId}
 * @group Execution - Command execution operations
 * @param {string} executionId.path.required - Execution ID
 * @returns {object} 200 - Success message
 * @returns {Error} 404 - Execution not found
 * @returns {Error} 500 - Server error
 */
router.delete('/:executionId', (req: Request, res: Response) => executionController.cancelExecution(req, res));

/**
 * Get execution result by ID
 * @route GET /execute/{executionId}
 * @group Execution - Command execution operations
 * @param {string} executionId.path.required - Execution ID
 * @returns {ExecutionResult.model} 200 - Execution result
 * @returns {Error} 404 - Execution not found
 * @returns {Error} 500 - Server error
 */
router.get('/:executionId', (req: Request, res: Response) => executionController.getExecution(req, res));

export default router;