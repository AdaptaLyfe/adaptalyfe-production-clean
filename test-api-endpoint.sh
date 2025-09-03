#!/bin/bash
echo "Testing local API endpoint..."
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -v

echo -e "\n\nTesting Railway API endpoint..."
echo "Replace YOUR_RAILWAY_URL with your actual Railway app URL"
# curl -X POST https://YOUR_RAILWAY_URL/api/login \
#   -H "Content-Type: application/json" \
#   -d '{"username":"admin","password":"admin123"}' \
#   -v