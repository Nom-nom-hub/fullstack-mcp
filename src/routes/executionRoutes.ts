import { Router } from 'express';
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

/**\n * Run a command\n * @route POST /execute\n * @group Execution - Command execution operations\n * @param {object} command.body.required - Command details\n * @returns {ExecutionResult.model} 200 - Execution result\n * @returns {Error} 500 - Server error\n */
router.post('/', validateRunCommand, (req, res) => executionController.runCommand(req, res));

/**
 * Cancel an execution
 * @route DELETE /execute/{executionId}
 * @group Execution - Command execution operations
 * @param {string} executionId.path.required - Execution ID
 * @returns {object} 200 - Success message
 * @returns {Error} 404 - Execution not found
 * @returns {Error} 500 - Server error
 */
router.delete('/:executionId', (req, res) => executionController.cancelExecution(req, res));

/**
 * Get execution result by ID
 * @route GET /execute/{executionId}
 * @group Execution - Command execution operations
 * @param {string} executionId.path.required - Execution ID
 * @returns {ExecutionResult.model} 200 - Execution result
 * @returns {Error} 404 - Execution not found
 * @returns {Error} 500 - Server error
 */
router.get('/:executionId', (req, res) => executionController.getExecution(req, res));

export default router;