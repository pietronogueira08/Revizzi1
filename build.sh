#!/bin/bash

# Vercel Build Script
echo "Creating public directory..."
mkdir -p public

echo "Copying static root files to public..."
cp *.html *.jpeg *.jpg *.png *.json public/ 2>/dev/null || true

echo "Building React App (revizzi-os)..."
cd revizzi-os
npm install
npm run build
