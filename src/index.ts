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
const apiVersion = process.env.API_VERSION || 'v1';

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

// API versioning middleware
app.use(`/api/${apiVersion}`, (req, res, next) => {
  // Add version information to response headers
  res.setHeader('X-API-Version', apiVersion);
  next();
});

// Versioned routes
app.use(`/api/${apiVersion}/session`, sessionRoutes);
app.use(`/api/${apiVersion}/files`, fileRoutes);
app.use(`/api/${apiVersion}/execute`, executionRoutes);
app.use(`/api/${apiVersion}/policy`, policyRoutes);
app.use(`/api/${apiVersion}/tools`, toolsRoutes);

// Legacy routes (maintain backward compatibility)
app.use('/session', sessionRoutes);
app.use('/files', fileRoutes);
app.use('/execute', executionRoutes);
app.use('/policy', policyRoutes);
app.use('/tools', toolsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    version: apiVersion,
    timestamp: new Date().toISOString()
  });
});

// API version info endpoint
app.get('/version', (req, res) => {
  res.status(200).json({ 
    version: apiVersion,
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`MCP Server running on port ${port}`);
  console.log(`API available at http://localhost:${port}/api/${apiVersion}`);
});

export default app;
export { policyEngine, toolRegistry };