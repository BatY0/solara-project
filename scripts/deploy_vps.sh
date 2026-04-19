#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-$HOME/solara-project}"
BRANCH="${BRANCH:-main}"

echo "Deploying Solara from branch: ${BRANCH}"
echo "App directory: ${APP_DIR}"

if [ ! -d "${APP_DIR}" ]; then
  echo "App directory does not exist: ${APP_DIR}"
  echo "Clone your repository on the VPS first."
  exit 1
fi

cd "${APP_DIR}"

if [ ! -d .git ]; then
  echo "No git repository found at ${APP_DIR}"
  exit 1
fi

git fetch origin "${BRANCH}"
git checkout "${BRANCH}"
git reset --hard "origin/${BRANCH}"

docker compose down --remove-orphans
docker compose pull || true
docker compose build --pull
docker compose up -d --remove-orphans

docker image prune -f

echo "Deployment finished successfully."
