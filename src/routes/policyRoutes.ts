import { Router } from 'express';
import { PolicyController } from '../controllers/PolicyController';
import { policyEngine } from '../index';

const router = Router();
const policyController = new PolicyController(policyEngine);

/**
 * Get all policies
 * @route GET /policy
 * @group Policy - Policy management operations
 * @returns {object} 200 - Policy list
 * @returns {Error} 500 - Server error
 */
router.get('/', (req, res) => policyController.getPolicies(req, res));

/**
 * Get a policy by ID
 * @route GET /policy/{policyId}
 * @group Policy - Policy management operations
 * @param {string} policyId.path.required - Policy ID
 * @returns {Policy.model} 200 - Policy
 * @returns {Error} 404 - Policy not found
 * @returns {Error} 500 - Server error
 */
router.get('/:policyId', (req, res) => policyController.getPolicy(req, res));

/**
 * Create a new policy
 * @route POST /policy
 * @group Policy - Policy management operations
 * @param {Policy.model} policy.body.required - Policy object
 * @returns {Policy.model} 201 - Created policy
 * @returns {Error} 500 - Server error
 */
router.post('/', (req, res) => policyController.createPolicy(req, res));

/**
 * Update a policy
 * @route PUT /policy/{policyId}
 * @group Policy - Policy management operations
 * @param {string} policyId.path.required - Policy ID
 * @param {Policy.model} policy.body.required - Policy object
 * @returns {Policy.model} 200 - Updated policy
 * @returns {Error} 404 - Policy not found
 * @returns {Error} 500 - Server error
 */
router.put('/:policyId', (req, res) => policyController.updatePolicy(req, res));

/**
 * Delete a policy
 * @route DELETE /policy/{policyId}
 * @group Policy - Policy management operations
 * @param {string} policyId.path.required - Policy ID
 * @returns {object} 200 - Success message
 * @returns {Error} 404 - Policy not found
 * @returns {Error} 500 - Server error
 */
router.delete('/:policyId', (req, res) => policyController.deletePolicy(req, res));

export default router;