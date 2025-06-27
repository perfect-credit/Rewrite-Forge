const request = require('supertest');

// Set environment to not be test so server starts
process.env.NODE_ENV = 'development';
process.env.PORT = '3000';

// Import the app using ts-node
require('ts-node/register');
const app = require('../src/app').default;

// Test configuration
const tests = [
  {
    name: 'Health Check',
    method: 'GET',
    path: '/v1/health',
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

async function runTests() {
  console.log('🚀 Starting RewriteForge Service Tests (Supertest)\n');
  
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      
      let req = request(app)[test.method.toLowerCase()](test.path);
      
      if (test.body) {
        req = req.send(test.body);
      }
      
      const response = await req;
      
      if (response.status === test.expectedStatus) {
        console.log(`PASS - Status: ${response.status}`);
        if (response.body.rewritten) {
          console.log(`Response: ${response.body.rewritten}`);
        }
        passed++;
      } else {
        console.log(`FAIL - Expected: ${test.expectedStatus}, Got: ${response.status}`);
        console.log(`   Response:`, response.body);
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