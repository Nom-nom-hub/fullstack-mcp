export interface Policy {
  id: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyRule {
  id: string;
  type: 'fileAccess' | 'commandExecution' | 'networkAccess' | 'rateLimit';
  action: 'allow' | 'deny';
  resource: string; // File path pattern, command name, etc.
  conditions?: PolicyCondition[];
}

export interface PolicyCondition {
  type: 'ipAddress' | 'sessionId' | 'timeRange' | 'rateLimit';
  operator: 'equals' | 'notEquals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'limit' | 'window';
  value: string | number;
}

export interface PolicyEvaluationContext {
  sessionId: string;
  ipAddress: string;
  resource: string;
  action: string;
  timestamp: Date;
}