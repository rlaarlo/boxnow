#!/bin/bash
set -e

APP_DIR="/www/wwwroot/boxnow/web"
APP_NAME="boxnow"   # nama project di aaPanel Node.js Manager

echo "==> Pulling latest code..."
cd "$APP_DIR"
git pull origin main

echo "==> Installing dependencies..."
bun install --frozen-lockfile

echo "==> Building..."
bun run build

echo "==> Restarting app via PM2..."
pm2 restart "$APP_NAME" --update-env

echo "==> Done! $(date)"
