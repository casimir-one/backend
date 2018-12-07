#!/bin/bash
set -e

TAG=$(git log -1 --pretty=%h)
LATEST="latest"

export NODE_ENV="production"

echo "Building deipworld/server image..."
export IMAGE_NAME="deipworld/server:$TAG"
docker build -t=${IMAGE_NAME} .
docker push ${IMAGE_NAME}
