#!/bin/bash

echo "🎯 AutoTrack Liquidity - Starting Server..."
echo ""
echo "Opening browser at: http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

# Start Python server
python3 -m http.server 8000

# Fallback to Python 2 if Python 3 not available
if [ $? -ne 0 ]; then
    python -m SimpleHTTPServer 8000
fi
