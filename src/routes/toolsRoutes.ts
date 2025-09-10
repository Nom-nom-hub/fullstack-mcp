import { Router } from 'express';
import { ToolsController } from '../controllers/ToolsController';
import { ToolRegistry } from '../tools/ToolRegistry';

const router = Router();
const toolRegistry = new ToolRegistry();
const toolsController = new ToolsController(toolRegistry);

/**
 * List all available tools
 * @route GET /tools
 * @group Tools - Custom tool operations
 * @returns {object} 200 - List of tools
 * @returns {Error} 500 - Server error
 */
router.get('/', (req, res) => toolsController.listTools(req, res));

/**
 * Get tool information
 * @route GET /tools/{toolName}
 * @group Tools - Custom tool operations
 * @param {string} toolName.path.required - Tool name
 * @returns {object} 200 - Tool information
 * @returns {Error} 404 - Tool not found
 * @returns {Error} 500 - Server error
 */
router.get('/:toolName', (req, res) => toolsController.getTool(req, res));

/**
 * Execute a tool
 * @route POST /tools/{toolName}/execute
 * @group Tools - Custom tool operations
 * @param {string} toolName.path.required - Tool name
 * @param {object} args.body - Tool arguments
 * @returns {object} 200 - Tool result
 * @returns {Error} 404 - Tool not found
 * @returns {Error} 500 - Server error
 */
router.post('/:toolName/execute', (req, res) => toolsController.executeTool(req, res));

export default router;