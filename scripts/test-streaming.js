const EventSource = require('eventsource');
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Test configurations
const testCases = [
  {
    name: 'Mock Streaming - Word Granularity',
    endpoint: '/v1/rewrite/stream/mock',
    data: {
      text: 'Hello world, this is a test of the streaming functionality.',
      style: 'pirate',
      granularity: 'word',
      delay: 100,
      includeMetadata: true
    }
  },
  {
    name: 'Mock Streaming - Character Granularity',
    endpoint: '/v1/rewrite/stream/mock',
    data: {
      text: 'Quick test with character streaming.',
      style: 'formal',
      granularity: 'character',
      delay: 50,
      includeMetadata: true
    }
  },
  {
    name: 'Mock Streaming - Sentence Granularity',
    endpoint: '/v1/rewrite/stream/mock',
    data: {
      text: 'This is the first sentence. This is the second sentence. And this is the third sentence.',
      style: 'haiku',
      granularity: 'sentence',
      delay: 200,
      includeMetadata: true
    }
  },
  {
    name: 'OpenAI Streaming (if API key available)',
    endpoint: '/v1/rewrite/stream',
    data: {
      text: 'Testing OpenAI streaming with word granularity.',
      llm: 'openai',
      style: 'formal',
      granularity: 'word',
      delay: 50,
      includeMetadata: true
    }
  },
  {
    name: 'Anthropic Streaming (if API key available)',
    endpoint: '/v1/rewrite/stream',
    data: {
      text: 'Testing Anthropic streaming with character granularity.',
      llm: 'anthropic',
      style: 'pirate',
      granularity: 'character',
      delay: 30,
      includeMetadata: true
    }
  }
];

async function testStreaming(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log('='.repeat(60));
  
  try {
    // Make POST request to start streaming
    const response = await fetch(`${BASE_URL}${testCase.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(testCase.data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP Error: ${response.status} - ${errorText}`);
      return;
    }

    console.log(`✅ Stream started successfully`);
    console.log(`📊 Request data:`, JSON.stringify(testCase.data, null, 2));
    console.log('\n📡 Receiving stream data...\n');

    let receivedChunks = [];
    let startTime = Date.now();

    // Process the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            receivedChunks.push(data);
            
            // Display based on event type
            switch (data.type) {
              case 'metadata':
                console.log(`📋 Metadata: ${JSON.stringify(data.data, null, 2)}`);
                break;
              
              case 'progress':
                const progress = data.data.progress;
                const bar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));
                console.log(`📈 Progress: [${bar}] ${progress}%`);
                break;
              
              case 'content':
                process.stdout.write(data.data.chunk + ' ');
                break;
              
              case 'complete':
                console.log(`\n\n✅ Stream completed!`);
                console.log(`📊 Final result: ${data.data.rewritten}`);
                console.log(`📈 Total chunks: ${data.data.totalChunks}`);
                break;
              
              case 'error':
                console.log(`\n❌ Stream error: ${data.data.message}`);
                break;
            }
          } catch (parseError) {
            console.log(`⚠️  Parse error: ${parseError.message}`);
          }
        }
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`\n⏱️  Stream duration: ${duration}ms`);
    console.log(`📦 Total events received: ${receivedChunks.length}`);

  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Streaming Tests');
  console.log('='.repeat(60));
  
  for (const testCase of testCases) {
    await testStreaming(testCase);
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 All streaming tests completed!');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testStreaming, runAllTests }; 