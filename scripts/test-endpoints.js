const http = require('http');

// Set environment to not be test so server starts
process.env.NODE_ENV = 'development';
process.env.PORT = '3000';

// Import and start the app using ts-node
require('ts-node/register');
const app = require('../src/app').default;

const BASE_URL = 'http://localhost:3000';

// Test configuration
const tests = [
  {
    name: 'Health Check',
    method: 'GET',
    path: '/health',
    expectedStatus: 200,
    expectedResponse: { status: 'ok' }
  },
  {
    name: 'Local Mock - Formal Style',
    method: 'POST',
    path: '/v1/rewrite',
    body: { text: 'Hello world', style: 'formal', llm: 'localmoc' },
    expectedStatus: 200
  },
  {
    name: 'Local Mock - Pirate Style',
    method: 'POST',
    path: '/v1/rewrite',
    body: { text: 'Hello world', style: 'pirate', llm: 'localmoc' },
    expectedStatus: 200
  },
  {
    name: 'Local Mock - Haiku Style',
    method: 'POST',
    path: '/v1/rewrite',
    body: { text: 'Hello world', style: 'haiku', llm: 'localmoc' },
    expectedStatus: 200
  },
  {
    name: 'Default Style (should be formal)',
    method: 'POST',
    path: '/v1/rewrite',
    body: { text: 'Hello world', llm: 'localmoc' },
    expectedStatus: 200
  },
  {
    name: 'Invalid Style (should fail)',
    method: 'POST',
    path: '/v1/rewrite',
    body: { text: 'Hello world', style: 'invalid', llm: 'localmoc' },
    expectedStatus: 400
  },
  {
    name: 'Missing Text (should fail)',
    method: 'POST',
    path: '/v1/rewrite',
    body: { style: 'formal', llm: 'localmoc' },
    expectedStatus: 400
  },
  {
    name: 'Large Text (should fail)',
    method: 'POST',
    path: '/v1/rewrite',
    body: { text: 'A'.repeat(5001), style: 'formal', llm: 'localmoc' },
    expectedStatus: 400
  }
];

function makeRequest(test) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: test.path,
      method: test.method,
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
            response: response,
            test: test
          });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    if (test.body) {
      req.write(JSON.stringify(test.body));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('Starting RewriteForge Service Tests\n');
  
  // Wait a moment for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      const result = await makeRequest(test);
      
      if (result.status === test.expectedStatus) {
        console.log(`PASS - Status: ${result.status}`);
        if (result.response.rewritten) {
          console.log(`   Response: ${result.response.rewritten}`);
        }
        passed++;
      } else {
        console.log(`FAIL - Expected: ${test.expectedStatus}, Got: ${result.status}`);
        console.log(`   Response:`, result.response);
        failed++;
      }
    } catch (error) {
      console.log(`ERROR - ${error.message}`);
      failed++;
    }
    console.log(''); // Empty line for readability
  }

  console.log('Test Results:');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n All tests passed! Your RewriteForge service is working correctly.');
  } else {
    console.log('\n Some tests failed. Please check the errors above.');
  }

  // Exit the process
  process.exit(failed === 0 ? 0 : 1);
}

// Run the tests
runTests().catch(console.error); 