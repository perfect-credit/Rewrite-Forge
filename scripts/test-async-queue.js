const http = require('http');

// Set environment to not be test so server starts
process.env.NODE_ENV = 'development';
process.env.PORT = '3000';

// Import and start the app using ts-node
require('ts-node/register');
const app = require('../src/app').default;

const BASE_URL = 'http://localhost:3000';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            response: response
          });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function pollJobResult(jobId, maxAttempts = 10) {
  console.log(`\nPolling job result for: ${jobId}`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await makeRequest('GET', `/v1/rewrite/result/${jobId}`);
      
      console.log(`Attempt ${attempt}: Status ${result.status} - Job status: ${result.response.status}`);
      
      if (result.response.status === 'completed') {
        console.log('Job completed successfully!');
        console.log(`Result: ${result.response.result.rewritten}`);
        return result.response;
      } else if (result.response.status === 'failed') {
        console.log('Job failed!');
        console.log(`Error: ${result.response.error}`);
        return result.response;
      }
      
      // Wait 1 second before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`Polling error: ${error.message}`);
      return null;
    }
  }
  
  console.log('Polling timeout - job may still be processing');
  return null;
}

async function runAsyncQueueTests() {
  console.log('Starting Async Queue Tests\n');
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    // Test 1: Submit a job
    console.log('1. Submitting a job...');
    const submitResult = await makeRequest('POST', '/v1/rewrite/submit', {
      text: 'Hello world',
      style: 'pirate',
      llm: 'localmoc'
    });
    
    if (submitResult.status === 202) {
      console.log('Job submitted successfully!');
      console.log(`Job ID: ${submitResult.response.jobId}`);
      
      // Test 2: Poll for result
      const jobResult = await pollJobResult(submitResult.response.jobId);
      
      if (jobResult && jobResult.status === 'completed') {
        console.log('\n Async Queue Test PASSED!');
      } else {
        console.log('\n Async Queue Test had issues');
      }
    } else {
      console.log('Job submission failed');
      console.log(submitResult.response);
    }
    
    // Test 3: Check queue stats
    console.log('\n2. Checking queue statistics...');
    const statsResult = await makeRequest('GET', '/v1/rewrite/queue/stats');
    
    if (statsResult.status === 200) {
      console.log('Queue stats retrieved:');
      console.log(statsResult.response);
    } else {
      console.log('Failed to get queue stats');
    }
    
    // Test 4: Submit multiple jobs
    console.log('\n3. Submitting multiple jobs...');
    const jobIds = [];
    
    for (let i = 1; i <= 3; i++) {
      const multiResult = await makeRequest('POST', '/v1/rewrite/submit', {
        text: `Test message ${i}`,
        style: i % 2 === 0 ? 'formal' : 'pirate',
        llm: 'localmoc'
      });
      
      if (multiResult.status === 202) {
        jobIds.push(multiResult.response.jobId);
        console.log(`Job ${i} submitted: ${multiResult.response.jobId}`);
      }
    }
    
    // Poll all jobs
    console.log('\n4. Polling all jobs...');
    for (const jobId of jobIds) {
      await pollJobResult(jobId, 5);
    }
    
    console.log('\n All Async Queue Tests Completed!');
    
  } catch (error) {
    console.error(' Test failed:', error.message);
  }
  
  process.exit(0);
}

// Run the tests
runAsyncQueueTests().catch(console.error); 