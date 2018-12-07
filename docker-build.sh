#!/bin/bash
set -e

TAG=$(git log -1 --pretty=%h)
LATEST="latest"

echo "Building deipworld/server image..."
export IMAGE_NAME="deipworld/server:$TAG"
export NODE_ENV="production"
docker build -t=${IMAGE_NAME} .
docker push ${IMAGE_NAME}
