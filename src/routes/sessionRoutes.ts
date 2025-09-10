import { Router } from 'express';
import { SessionController } from '../controllers/SessionController';

const router = Router();
const sessionController = new SessionController();

/**
 * Initialize a new session
 * @route POST /session/init
 * @group Session - Session management operations
 * @param {Capabilities.model} capabilities.body.required - Capabilities object
 * @returns {SessionInfo.model} 200 - Session information
 * @returns {Error} 500 - Server error
 */
router.post('/init', (req, res) => sessionController.initSession(req, res));

/**
 * List all capabilities
 * @route GET /session/capabilities
 * @group Session - Session management operations
 * @returns {Capabilities.model} 200 - Capabilities list
 * @returns {Error} 500 - Server error
 */
router.get('/capabilities', (req, res) => sessionController.listCapabilities(req, res));

/**
 * Get session info by ID
 * @route GET /session/{sessionId}
 * @group Session - Session management operations
 * @param {string} sessionId.path.required - Session ID
 * @returns {SessionInfo.model} 200 - Session information
 * @returns {Error} 404 - Session not found
 * @returns {Error} 500 - Server error
 */
router.get('/:sessionId', (req, res) => sessionController.getSession(req, res));

export default router;