import express from 'express';
import cors from 'cors';
import { json } from 'express';
import sessionRoutes from './routes/sessionRoutes';
import fileRoutes from './routes/fileRoutes';
import executionRoutes from './routes/executionRoutes';
import policyRoutes from './routes/policyRoutes';
import toolsRoutes from './routes/toolsRoutes';
import { AuditMiddleware } from './middleware/auditMiddleware';
import { rateLimitMiddleware } from './middleware/rateLimitMiddleware';
import { PolicyEngine } from './services/PolicyEngine';
import { ToolRegistry } from './tools/ToolRegistry';

const app = express();
const port = process.env.PORT || 8080;

// Initialize policy engine
const policyEngine = new PolicyEngine();
// Add default policy for development
policyEngine.addPolicy(PolicyEngine.createDefaultPolicy());

// Initialize tool registry
const toolRegistry = new ToolRegistry();

app.use(json());
app.use(cors());

// Rate limiting middleware (apply early to catch all requests)
app.use(rateLimitMiddleware);

// Audit logging middleware
app.use(AuditMiddleware.auditLog);

// Routes
app.use('/session', sessionRoutes);
app.use('/files', fileRoutes);
app.use('/execute', executionRoutes);
app.use('/policy', policyRoutes);
app.use('/tools', toolsRoutes);

app.listen(port, () => {
  console.log(`MCP Server running on port ${port}`);
});

export default app;
export { policyEngine, toolRegistry };