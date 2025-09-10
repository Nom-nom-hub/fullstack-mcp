#!/usr/bin/env node

/**
 * Test script to verify MCP server functionality
 */

const http = require('http');

async function testMCPConnection() {
  console.log('Testing MCP Server connection...');
  
  // Test 1: Check if server is running
  try {
    const serverResponse = await makeRequest('http://localhost:8080');
    console.log('✓ MCP Server is running');
  } catch (error) {
    console.error('✗ MCP Server is not running. Please start it with: npm run dev');
    return;
  }
  
  // Test 2: Initialize a session
  try {
    const sessionResponse = await makePostRequest('http://localhost:8080/session/init', {
      tools: ['readFile', 'writeFile', 'runCommand', 'listFiles']
    });
    const sessionId = sessionResponse.sessionId;
    console.log('✓ Session initialized successfully');
    console.log(`  Session ID: ${sessionId}`);
    
    // Test 3: List capabilities
    const capabilitiesResponse = await makeRequest('http://localhost:8080/session/capabilities');
    console.log('✓ Capabilities retrieved successfully');
    console.log(`  Available tools: ${capabilitiesResponse.tools.join(', ')}`);
    
    // Test 4: List files
    const filesResponse = await makeRequest(`http://localhost:8080/files/list`);
    console.log('✓ File listing successful');
    
    // Test 5: List tools
    const toolsResponse = await makeRequest(`http://localhost:8080/tools`);
    console.log('✓ Tools listing successful');
    
    console.log('\n🎉 All tests passed! The MCP server is ready to use with Qwen Code.');
  } catch (error) {
    console.error('✗ Error during testing:', error.message);
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function makePostRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(url, options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve(responseData);
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.write(postData);
    req.end();
  });
}

// Run the test
testMCPConnection();
