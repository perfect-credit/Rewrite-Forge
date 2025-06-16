#!/bin/bash

echo "🐳 Building RewriteForge Docker Container"
echo "=========================================="

# Clean up any existing containers
echo "Cleaning up existing containers..."
docker-compose down
docker system prune -f

# Build the production image
echo "Building production image..."
docker build -t rewriteforge:latest .

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Build successful!"
    
    # Test the build locally
    echo "Testing the container..."
    docker run --rm -d --name rewriteforge-test -p 3000:3000 rewriteforge:latest
    
    # Wait for container to start
    echo "Waiting for container to start..."
    sleep 10
    
    # Test health endpoint
    echo "🏥 Testing health endpoint..."
    curl -f http://localhost:3000/health
    
    if [ $? -eq 0 ]; then
        echo "Container is running and healthy!"
        echo "Service available at: http://localhost:3000"
        echo "Metrics available at: http://localhost:3000/metrics/overview"
        echo "Streaming test UI at: http://localhost:3000/public/streaming-test.html"
        
        # Stop test container
        docker stop rewriteforge-test
        echo "Test container stopped"
    else
        echo "Health check failed"
        docker logs rewriteforge-test
        docker stop rewriteforge-test
        exit 1
    fi
else
    echo "Build failed!"
    exit 1
fi

echo ""
echo "Ready to deploy with:"
echo "   docker-compose up -d"
echo ""
echo "For development:"
echo "   docker-compose --profile dev up -d" 