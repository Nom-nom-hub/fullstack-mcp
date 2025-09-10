export interface SessionInfo {
  sessionId: string;
  capabilities: string[];
}

export interface Capabilities {
  tools: string[];
}

export interface FileContent {
  path: string;
  content: string;
}

export interface ExecutionResult {
  executionId: string;
  exitCode: number;
  logs: string[];
}

export * from './Policy';