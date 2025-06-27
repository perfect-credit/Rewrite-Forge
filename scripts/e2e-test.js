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
    name: 'Basic Rewrite Test',
    method: 'POST',
    path: '/v1/rewrite',
    body: {
      text: 'Hello world',
      style: 'pirate',
      llm: 'localmoc'
    },
    expectedStatus: 200,
    assertions: (response) => {
      return response.original === 'Hello world' && 
             response.rewritten === '[*pirate*] Hello world' &&
             response.style === 'pirate' &&
             response.llm === 'localmoc';
    }
  },
  {
    name: 'Health Check Test',
    method: 'GET',
    path: '/v1/health',
    expectedStatus: 200,
    assertions: (response) => {
      return response.status === 'ok';
    }
  },
  {
    name: 'Default Style Test',
    method: 'POST',
    path: '/v1/rewrite',
    body: {
      text: 'Hello world',
      llm: 'localmoc'
    },
    expectedStatus: 200,
    assertions: (response) => {
      return response.style === 'formal' &&
             response.rewritten === '[*formal*] Hello world';
    }
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

async function runE2ETests() {
  console.log('Starting RewriteForge E2E Tests\n');
  
  // Wait a moment for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      const result = await makeRequest(test);
      
      if (result.status === test.expectedStatus && test.assertions(result.response)) {
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

  console.log('E2E Test Results:');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n All E2E tests passed! Your RewriteForge service is working correctly.');
    process.exit(0);
  } else {
    console.log('\n Some E2E tests failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run the E2E tests
runE2ETests().catch(console.error); 