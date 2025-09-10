# MCP Server API Documentation

## Overview

The MCP (Model Context Protocol) Server provides a secure, flexible, and extensible environment for AI coding agents to execute coding tasks. It allows multiple AI coders to connect, negotiate capabilities, run commands, access resources, and collaborate in a sandboxed, controlled environment.

## Base URL

All URLs referenced in the documentation have the following base:

```
http://localhost:8080
```

## Authentication

All requests require a session ID to be passed in the `x-session-id` header.

## Security

The MCP Server implements several security measures:

1. **Sandboxing**: Commands are executed in isolated Docker containers when enabled
2. **Policy Engine**: Fine-grained access control based on policies
3. **Input Validation**: Protection against injection attacks and directory traversal
4. **Rate Limiting**: Prevention of resource abuse

## Session Management

### Initialize a Session

Creates a new session with the specified capabilities.

```
POST /session/init
```

**Request Body:**
```json
{
  "tools": ["readFile", "writeFile", "runCommand"]
}
```

**Response:**
```json
{
  "sessionId": "abc123",
  "capabilities": ["readFile", "writeFile", "runCommand"]
}
```

### List Capabilities

Returns a list of all available capabilities.

```
GET /session/capabilities
```

**Response:**
```json
{
  "tools": ["readFile", "writeFile", "runCommand", "listFiles"]
}
```

### Get Session Info

Returns information about a specific session.

```
GET /session/{sessionId}
```

**Response:**
```json
{
  "sessionId": "abc123",
  "capabilities": ["readFile", "writeFile", "runCommand"]
}
```

## File Management

### Get File Content

Returns the content of a file at the specified path.

```
GET /files/{path}
```

**Security Considerations:**
- Path validation prevents directory traversal attacks
- Files must be within the workspace directory
- Policy engine enforces access control

**Response:**
```json
{
  "path": "src/index.ts",
  "content": "console.log('Hello World');"
}
```

**Error Responses:**
- 400: Invalid file path
- 403: Access denied by policy
- 404: File not found
- 400: Path is a directory, not a file

### Write File Content

Writes content to a file at the specified path.

```
POST /files
```

**Security Considerations:**
- Path validation prevents directory traversal attacks
- Files must be within the workspace directory
- Policy engine enforces access control
- Directories are automatically created if they don't exist

**Request Body:**
```json
{
  "path": "src/index.ts",
  "content": "console.log('Hello World');"
}
```

**Response:**
```json
{
  "success": true,
  "message": "File written successfully"
}
```

**Error Responses:**
- 400: Missing file path or content
- 400: Invalid file path
- 403: Access denied by policy

### List Files

Returns a list of files in the specified directory.

```
GET /files/list/{path}
```

**Security Considerations:**
- Path validation prevents directory traversal attacks
- Directories must be within the workspace directory
- Policy engine enforces access control

**Response:**
```json
{
  "path": "src",
  "files": ["index.ts", "app.ts"]
}
```

**Error Responses:**
- 400: Invalid directory path
- 403: Access denied by policy
- 404: Directory not found
- 400: Path is a file, not a directory

## Command Execution

### Run a Command

Executes a command in a sandboxed environment.

```
POST /execute
```

**Security Considerations:**
- Command validation prevents injection attacks
- Commands are executed in isolated Docker containers when enabled
- Policy engine enforces access control
- Timeouts prevent resource exhaustion

**Request Body:**
```json
{
  "command": "npm",
  "args": ["test"],
  "options": {
    "timeout": 30000
  }
}
```

**Response:**
```json
{
  "executionId": "exec-123",
  "exitCode": 0,
  "logs": [
    "Command: npm test",
    "Docker Image: node:18-alpine",
    "Execution time: 1250ms",
    "STDOUT: Test results...",
    "STDERR: "
  ]
}
```

**Error Responses:**
- 400: Missing command
- 400: Invalid command or arguments
- 403: Access denied by policy

### Get Execution Result

Returns the result of a specific execution.

```
GET /execute/{executionId}
```

**Response:**
```json
{
  "executionId": "exec-123",
  "exitCode": 0,
  "logs": [
    "Command: npm test",
    "Docker Image: node:18-alpine",
    "Execution time: 1250ms",
    "STDOUT: Test results...",
    "STDERR: "
  ]
}
```

**Error Responses:**
- 404: Execution not found
- 403: Access denied by policy

### Cancel Execution

Cancels a specific execution.

```
DELETE /execute/{executionId}
```

**Response:**
```json
{
  "success": true,
  "message": "Execution cancelled"
}
```

**Error Responses:**
- 404: Execution not found

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message"
}
```

Common HTTP status codes:
- 200: Success
- 400: Bad request
- 403: Forbidden
- 404: Not found
- 500: Internal server error