import { Policy, PolicyRule, PolicyEvaluationContext, PolicyCondition } from '../models/Policy';
import { RateLimiter } from './RateLimiter';

export class PolicyEngine {
  private policies: Map<string, Policy> = new Map();
  private rateLimiter: RateLimiter = new RateLimiter();

  /**
   * Add a policy to the engine
   * @param policy - Policy to add
   */
  addPolicy(policy: Policy): void {
    this.policies.set(policy.id, policy);
  }

  /**
   * Remove a policy from the engine
   * @param policyId - ID of policy to remove
   */
  removePolicy(policyId: string): void {
    this.policies.delete(policyId);
  }

  /**
   * Get a policy by ID
   * @param policyId - ID of policy to retrieve
   * @returns Policy or undefined if not found
   */
  getPolicy(policyId: string): Policy | undefined {
    return this.policies.get(policyId);
  }

  /**
   * Evaluate if an action is allowed based on policies
   * @param context - Context for policy evaluation
   * @returns True if allowed, false otherwise
   */
  isActionAllowed(context: PolicyEvaluationContext): boolean {
    // Check rate limiting first
    if (!this.isRateLimited(context)) {
      return false;
    }

    // If no policies exist, allow by default (for development)
    if (this.policies.size === 0) {
      return true;
    }

    // Check all policies
    for (const policy of this.policies.values()) {
      for (const rule of policy.rules) {
        if (this.evaluateRule(rule, context)) {
          return rule.action === 'allow';
        }
      }
    }

    // Default deny if no rules match
    return false;
  }

  /**
   * Check if the request is rate limited
   * @param context - Context for evaluation
   * @returns True if not rate limited, false if rate limited
   */
  private isRateLimited(context: PolicyEvaluationContext): boolean {
    // Check if there's a specific rate limit rule for this context
    for (const policy of this.policies.values()) {
      for (const rule of policy.rules) {
        if (rule.type === 'rateLimit' && this.evaluateRule(rule, context)) {
          // Extract rate limit parameters from rule
          const limit = rule.conditions?.find(c => c.type === 'rateLimit' && c.operator === 'limit')?.value as number || 100;
          const windowMs = rule.conditions?.find(c => c.type === 'rateLimit' && c.operator === 'window')?.value as number || 60000;
          
          return this.rateLimiter.isAllowed(context, limit, windowMs);
        }
      }
    }
    
    // Use default rate limiting if no specific rule found
    return this.rateLimiter.isAllowed(context);
  }

  /**
   * Evaluate a single rule against the context
   * @param rule - Rule to evaluate
   * @param context - Context for evaluation
   * @returns True if rule matches, false otherwise
   */
  private evaluateRule(rule: PolicyRule, context: PolicyEvaluationContext): boolean {
    // Check rule type matches action
    if (rule.type === 'fileAccess' && context.action !== 'fileAccess') {
      return false;
    }
    
    if (rule.type === 'commandExecution' && context.action !== 'commandExecution') {
      return false;
    }
    
    if (rule.type === 'networkAccess' && context.action !== 'networkAccess') {
      return false;
    }
    
    if (rule.type === 'rateLimit' && context.action !== 'rateLimit') {
      return false;
    }

    // Check resource pattern matching
    if (!this.matchesResourcePattern(rule.resource, context.resource)) {
      return false;
    }

    // Check conditions if they exist
    if (rule.conditions && rule.conditions.length > 0) {
      for (const condition of rule.conditions) {
        if (!this.evaluateCondition(condition, context)) {
          return false;
        }
      }
    }

    // If we get here, the rule matches
    return true;
  }

  /**
   * Check if a resource matches a pattern
   * @param pattern - Pattern to match against
   * @param resource - Resource to check
   * @returns True if matches, false otherwise
   */
  private matchesResourcePattern(pattern: string, resource: string): boolean {
    // Simple pattern matching - could be enhanced with glob patterns
    if (pattern === '*') {
      return true;
    }
    
    if (pattern === resource) {
      return true;
    }
    
    // Check prefix matching
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return resource.startsWith(prefix);
    }
    
    return false;
  }

  /**
   * Evaluate a condition against the context
   * @param condition - Condition to evaluate
   * @param context - Context for evaluation
   * @returns True if condition matches, false otherwise
   */
  private evaluateCondition(condition: PolicyCondition, context: PolicyEvaluationContext): boolean {
    switch (condition.type) {
    case 'ipAddress':
      return this.evaluateStringCondition(condition, context.ipAddress);
    case 'sessionId':
      return this.evaluateStringCondition(condition, context.sessionId);
    case 'timeRange':
      // Time range checking would be implemented here
      return true;
    case 'rateLimit':
      // Rate limit parameters are handled separately
      return true;
    default:
      return false;
    }
  }

  /**
   * Evaluate a string-based condition
   * @param condition - Condition to evaluate
   * @param value - Value to compare against
   * @returns True if condition matches, false otherwise
   */
  private evaluateStringCondition(condition: PolicyCondition, value: string): boolean {
    switch (condition.operator) {
    case 'equals':
      return value === (condition.value as string);
    case 'notEquals':
      return value !== (condition.value as string);
    case 'contains':
      return value.includes(condition.value as string);
    case 'startsWith':
      return value.startsWith(condition.value as string);
    case 'endsWith':
      return value.endsWith(condition.value as string);
    case 'greaterThan':
      return value > (condition.value as string);
    case 'lessThan':
      return value < (condition.value as string);
    default:
      return false;
    }
  }

  /**
   * Create a default policy for development
   * @returns Default policy
   */
  static createDefaultPolicy(): Policy {
    return {
      id: 'default-policy',
      name: 'Default Development Policy',
      description: 'Default policy for development environments',
      rules: [
        {
          id: 'allow-all-file-access',
          type: 'fileAccess',
          action: 'allow',
          resource: '*'
        },
        {
          id: 'allow-all-command-execution',
          type: 'commandExecution',
          action: 'allow',
          resource: '*'
        },
        {
          id: 'default-rate-limit',
          type: 'rateLimit',
          action: 'allow',
          resource: '*',
          conditions: [
            {
              type: 'rateLimit',
              operator: 'limit',
              value: 100
            },
            {
              type: 'rateLimit',
              operator: 'window',
              value: 60000
            }
          ]
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}