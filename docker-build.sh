#!/bin/bash
set -e

TAG=$(git log -1 --pretty=%h)
LATEST="latest"
ORG="deipworld"
IMAGE_PREFIX="$1"

echo "Building $ORG/$IMAGE_PREFIX-web-server image..."
export IMAGE_NAME="$ORG/$IMAGE_PREFIX-web-server:$TAG"
export LATEST_IMAGE_NAME="$ORG/$IMAGE_PREFIX-web-server:$LATEST"
export NODE_ENV="development"
docker build -t=${IMAGE_NAME} .
docker tag ${IMAGE_NAME} ${LATEST_IMAGE_NAME}
docker push ${IMAGE_NAME}
docker push ${LATEST_IMAGE_NAME}
docker rmi ${IMAGE_NAME}
docker rmi ${LATEST_IMAGE_NAME}