#!/bin/bash
set -e

TAG=$(git log -1 --pretty=%h)
LATEST="latest"

echo "Building deipworld/ip-protection-platform-web-server image..."
export IMAGE_NAME="deipworld/ip-protection-platform-web-server:$TAG"
export LATEST_IMAGE_NAME="deipworld/ip-protection-platform-web-server:$LATEST"
export NODE_ENV="development"
docker build -t=${IMAGE_NAME} .
docker tag ${IMAGE_NAME} ${LATEST_IMAGE_NAME}
docker push ${IMAGE_NAME}
docker push ${LATEST_IMAGE_NAME}