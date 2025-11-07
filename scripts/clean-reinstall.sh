#!/bin/bash
set -e

echo "🧹 Cleaning all node_modules..."
rm -rf node_modules apps/*/node_modules packages/*/node_modules
find . -name ".modules.yaml" -delete

echo "📦 Reinstalling with hoisted dependencies..."
pnpm install

echo "✅ Clean reinstall complete!"
echo "Now you can run: pnpm build:dmg:clean"
