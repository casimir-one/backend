#!/bin/bash
set -e

STAGING_TAG=""
while getopts ":s" opt
do
  case $opt in
    s) STAGING_TAG="staging-";;
  esac
done

TAG=$(git log -1 --pretty=%h)
LATEST="latest"

echo "Building deipworld/ip-protection-platform-web-server $STAGING_TAG image..."
export IMAGE_NAME="deipworld/ip-protection-platform-web-server:${STAGING_TAG}${TAG}"
export LATEST_IMAGE_NAME="deipworld/ip-protection-platform-web-server:${STAGING_TAG}${LATEST}"
export NODE_ENV="development"
docker build -t=${IMAGE_NAME} .
docker tag ${IMAGE_NAME} ${LATEST_IMAGE_NAME}
docker push ${IMAGE_NAME}
docker push ${LATEST_IMAGE_NAME}
docker rmi ${IMAGE_NAME}
docker rmi ${LATEST_IMAGE_NAME}