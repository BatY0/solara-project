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

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  echo "Docker Compose is not installed. Install docker compose plugin or docker-compose."
  exit 1
fi

compose() {
  "${COMPOSE_CMD[@]}" "$@"
}

SUPPORTS_REMOVE_ORPHANS=false
if compose up --help 2>/dev/null | grep -q -- '--remove-orphans'; then
  SUPPORTS_REMOVE_ORPHANS=true
fi

compose down
compose pull || true
compose build --pull
if [ "${SUPPORTS_REMOVE_ORPHANS}" = "true" ]; then
  compose up -d --remove-orphans
else
  compose up -d
fi

docker image prune -f

echo "Deployment finished successfully."
