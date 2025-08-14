#!/bin/bash
# Build script for Render deployment

echo "🚀 Starting build process..."

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install

# Install client dependencies and build
echo "📦 Installing client dependencies..."
cd ../client
npm install

echo "🔨 Building React app..."
npm run build

echo "✅ Build completed successfully!"
