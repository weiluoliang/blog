#!/usr/bin/env bash
# ============================================
# Static blog deployment script
#
# Usage:
#   bash scripts/deploy.sh
#
# Prerequisites:
#   - The server has nginx/caddy or another static file server configured.
#   - SSH key login is configured, for example:
#       ssh-copy-id user@host
#   - Copy .env.example to .env and fill in:
#       DEPLOY_HOST  - Server IP address or domain
#       DEPLOY_USER  - SSH user
#       DEPLOY_PATH  - Static file directory on the server, such as /var/www/blog
# ============================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
else
  echo "Error: .env file was not found."
  echo "Create one from the example and fill in your server information:"
  echo "  cp .env.example .env"
  exit 1
fi

required_vars=(DEPLOY_HOST DEPLOY_USER DEPLOY_PATH)
for var in "${required_vars[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo "Error: missing required environment variable: $var"
    exit 1
  fi
done

if [[ "$DEPLOY_PATH" != /* ]]; then
  echo "Error: DEPLOY_PATH must be an absolute path."
  exit 1
fi

case "${DEPLOY_PATH%/}" in
  ""|"/"|"/var"|"/var/www"|"/home"|"/usr"|"/etc"|"/opt"|"/srv")
    echo "Error: refusing to deploy to a broad or system directory: $DEPLOY_PATH"
    exit 1
    ;;
esac

command -v npm >/dev/null 2>&1 || {
  echo "Error: npm is required but was not found in PATH."
  exit 1
}

command -v ssh >/dev/null 2>&1 || {
  echo "Error: ssh is required but was not found in PATH."
  exit 1
}

command -v scp >/dev/null 2>&1 || {
  echo "Error: scp is required but was not found in PATH."
  exit 1
}

echo "=========================================="
echo "  Static blog deployment"
echo "  Target: ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"
echo "=========================================="

cd "$PROJECT_DIR"

echo ""
echo "[1/3] Cleaning old build output..."
rm -rf dist

echo ""
echo "[2/3] Building project..."
npm run build

if [ ! -d "$PROJECT_DIR/dist" ]; then
  echo "Error: build did not create dist/."
  exit 1
fi

echo ""
echo "[3/3] Uploading dist files..."
tar_file="blog-dist-$(date +%Y%m%d-%H%M%S).tar.gz"
local_tar="${TMPDIR:-/tmp}/$tar_file"
deploy_marker=".deploy-managed-by-blog"

tar -czf "$local_tar" -C "$PROJECT_DIR/dist" .

ssh -o StrictHostKeyChecking=accept-new "${DEPLOY_USER}@${DEPLOY_HOST}" << REMOTE_PREFLIGHT
set -euo pipefail
target_path="\$(realpath -m "${DEPLOY_PATH}")"
case "\${target_path%/}" in
  ""|"/"|"/var"|"/var/www"|"/home"|"/usr"|"/etc"|"/opt"|"/srv")
    echo "Error: refusing to deploy to a broad or system directory: \$target_path"
    exit 1
    ;;
esac

mkdir -p "\$target_path"
cd "\$target_path"

if [ ! -f "${deploy_marker}" ] && [ -n "\$(find . -mindepth 1 -maxdepth 1 -print -quit)" ]; then
  echo "Error: \$target_path already has files but is not marked as managed by this deploy script."
  echo "If this is the correct directory, create the marker once on the server:"
  echo "  touch \$target_path/${deploy_marker}"
  exit 1
fi
REMOTE_PREFLIGHT

scp -o StrictHostKeyChecking=accept-new \
  "$local_tar" \
  "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"

ssh -o StrictHostKeyChecking=accept-new "${DEPLOY_USER}@${DEPLOY_HOST}" << REMOTE
set -euo pipefail
target_path="\$(realpath -m "${DEPLOY_PATH}")"
case "\${target_path%/}" in
  ""|"/"|"/var"|"/var/www"|"/home"|"/usr"|"/etc"|"/opt"|"/srv")
    echo "Error: refusing to deploy to a broad or system directory: \$target_path"
    exit 1
    ;;
esac

cd "\$target_path"
if [ ! -f "${deploy_marker}" ] && [ -n "\$(find . -mindepth 1 -maxdepth 1 ! -name "${tar_file}" -print -quit)" ]; then
  echo "Error: \$target_path is not marked as managed by this deploy script."
  exit 1
fi

find . -mindepth 1 -maxdepth 1 ! -name "${tar_file}" -exec rm -rf {} +
tar -xzf "${tar_file}"
rm -f "${tar_file}"
touch "${deploy_marker}"
echo "Deployment completed at \$target_path"
REMOTE

rm -f "$local_tar"

echo ""
echo "=========================================="
echo "  Done."
echo "  Visit: http://${DEPLOY_HOST}"
echo "=========================================="
