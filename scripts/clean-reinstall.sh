#!/bin/bash
set -e

echo "🧹 Cleaning all node_modules..."
rm -rf node_modules apps/*/node_modules packages/*/node_modules

echo "🧹 Cleaning pnpm metadata..."
find . -name ".modules.yaml" -delete
find . -name "node_modules/.pnpm" -type d -exec rm -rf {} + 2>/dev/null || true

echo "📦 Reinstalling with hoisted dependencies..."
pnpm install

echo ""
echo "✅ Clean reinstall complete!"
echo ""
echo "Verifying hoisting..."
if [ -f "node_modules/.modules.yaml" ]; then
  echo "📋 Checking if hoisting is active..."
  grep -q "hoisted" node_modules/.modules.yaml && echo "✅ Hoisting is ENABLED" || echo "⚠️  Hoisting might not be active"
else
  echo "⚠️  No .modules.yaml found"
fi
echo ""
echo "Now you can run: pnpm build:dmg:clean"
