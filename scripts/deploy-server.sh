#!/bin/bash
# Server-side deployment script
# This script should be placed on the server at /opt/adaptmap/deploy.sh

set -e

STACK_NAME="adaptmap"
IMAGE_NAME="adaptmap-app"
COMPOSE_FILE="/opt/adaptmap/docker-compose.yml"

echo "Starting deployment..."

# Load the new image (if provided as argument)
if [ -n "$1" ] && [ -f "$1" ]; then
    echo "Loading Docker image from $1..."
    gunzip -c "$1" | docker load
    rm "$1"
fi

# Navigate to project directory
cd /opt/adaptmap || exit 1

# Update the Docker stack
echo "Updating Docker stack..."
docker stack deploy -c "$COMPOSE_FILE" "$STACK_NAME" --with-registry-auth

# Wait for services to update
echo "Waiting for services to update..."
sleep 15

# Check service status
echo "Service status:"
docker service ls | grep "${STACK_NAME}_app" || echo "Service not found"

echo "Deployment complete!"

