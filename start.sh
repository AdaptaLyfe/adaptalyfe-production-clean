#!/bin/bash
echo "Starting Adaptalyfe Medical App..."
echo "Killing any existing node processes..."
pkill -f "node server-simple" 2>/dev/null || true
sleep 2
echo "Starting server on port 8080..."
cd /home/runner/workspace
node server-simple.js &
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"
sleep 3
echo "Testing server health..."
curl -s http://localhost:8080/health
echo ""
echo "Server is running. You can now access your app in Replit's preview."
echo "PID: $SERVER_PID"
wait $SERVER_PID