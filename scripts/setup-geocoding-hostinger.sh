#!/bin/bash

# Quick setup script for geocoding services on Hostinger VPS
# Usage: ./setup-geocoding-hostinger.sh

set -e

echo "🚀 Setting up Geocoding Services on Hostinger VPS"
echo "=================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed. Please log out and back in, then run this script again."
    exit 0
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed."
fi

# Create directory
mkdir -p ~/geocoding-services
cd ~/geocoding-services

# Check if docker-compose.geocoding.yml exists
if [ ! -f "docker-compose.geocoding.yml" ]; then
    echo "❌ docker-compose.geocoding.yml not found in current directory."
    echo "Please upload the file from the repository to ~/geocoding-services/"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    read -sp "Enter a secure password for Nominatim database: " password
    echo ""
    echo "NOMINATIM_PASSWORD=$password" > .env
    echo "✅ .env file created."
else
    echo "✅ .env file already exists."
fi

# Check if services are already running
if docker-compose -f docker-compose.geocoding.yml ps | grep -q "Up"; then
    echo "⚠️  Services are already running."
    read -p "Do you want to restart them? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Restarting services..."
        docker-compose -f docker-compose.geocoding.yml restart
    else
        echo "✅ Services are running. Exiting."
        exit 0
    fi
else
    echo "🚀 Starting geocoding services..."
    echo "⚠️  Initial data import may take several hours!"
    echo "   Monitor progress with: docker-compose -f docker-compose.geocoding.yml logs -f nominatim"
    
    docker-compose -f docker-compose.geocoding.yml up -d
    
    echo ""
    echo "✅ Services started!"
    echo ""
    echo "📊 Useful commands:"
    echo "   View logs:        docker-compose -f docker-compose.geocoding.yml logs -f"
    echo "   Check status:     docker-compose -f docker-compose.geocoding.yml ps"
    echo "   Stop services:    docker-compose -f docker-compose.geocoding.yml stop"
    echo "   Restart services: docker-compose -f docker-compose.geocoding.yml restart"
    echo ""
    echo "🧪 Test services:"
    echo "   Nominatim: curl 'http://localhost:8080/reverse?format=json&lat=50.9375&lon=6.9603'"
    echo "   Photon:    curl 'http://localhost:2322/api?q=Köln&limit=5'"
    echo ""
    echo "📖 For full documentation, see: docs/geocoding-services-setup.md"
fi

