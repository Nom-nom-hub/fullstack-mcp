import { Router } from 'express';
import { ExecutionController } from '../controllers/ExecutionController';

const router = Router();
const executionController = new ExecutionController();

/**
 * Run a command
 * @route POST /execute
 * @group Execution - Command execution operations
 * @param {object} command.body.required - Command details
 * @returns {ExecutionResult.model} 200 - Execution result
 * @returns {Error} 500 - Server error
 */
router.post('/', (req, res) => executionController.runCommand(req, res));

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