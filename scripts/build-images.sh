#!/bin/bash
# filename: scripts/build-images.sh

set -e

echo "🔨 Building Docker images for Parkrun Helper Organizer..."

# Build database image
echo "📦 Building database image..."
docker build -t parkrun-helper/database:latest ./database

# Build backend image
echo "🚀 Building backend image..."
docker build -t parkrun-helper/backend:latest ./backend

# Build frontend image
echo "🌐 Building frontend image..."
docker build -t parkrun-helper/frontend:latest ./frontend

echo "✅ All images built successfully!"
echo ""
echo "Available images:"
docker images | grep parkrun-helper

echo ""
echo "🎯 To deploy to Docker Swarm, run:"
echo "   ./scripts/deploy-stack.sh"