#!/bin/bash

# BlackIA Setup Verification Script
# Run this after `pnpm install` to verify everything is correctly set up

set -e

echo "🔍 BlackIA Setup Verification"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0
WARN=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAIL++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
    ((WARN++))
}

check_info() {
    echo -e "${BLUE}ℹ️  INFO${NC}: $1"
}

echo "1️⃣  Checking Prerequisites..."
echo "--------------------------------"

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 20 ]; then
        check_pass "Node.js version $(node --version)"
    else
        check_fail "Node.js version too old ($(node --version)). Required: v20+"
    fi
else
    check_fail "Node.js not found"
fi

# Check pnpm version
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version | cut -d'.' -f1)
    if [ "$PNPM_VERSION" -ge 8 ]; then
        check_pass "pnpm version $(pnpm --version)"
    else
        check_fail "pnpm version too old ($(pnpm --version)). Required: v8+"
    fi
else
    check_fail "pnpm not found. Install with: npm install -g pnpm"
fi

echo ""
echo "2️⃣  Checking Project Structure..."
echo "--------------------------------"

# Check workspace configuration
if [ -f "pnpm-workspace.yaml" ]; then
    check_pass "Workspace configuration exists"
else
    check_fail "pnpm-workspace.yaml not found"
fi

# Check main packages
REQUIRED_DIRS=(
    "apps/desktop"
    "packages/shared"
    "packages/ui"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        check_pass "Directory $dir exists"
    else
        check_fail "Directory $dir not found"
    fi
done

echo ""
echo "3️⃣  Checking Dependencies Installation..."
echo "--------------------------------"

# Check root node_modules
if [ -d "node_modules" ]; then
    check_pass "Root node_modules exists"
    MODULE_COUNT=$(find node_modules -maxdepth 1 -type d | wc -l)
    check_info "Root has ~$MODULE_COUNT packages"
else
    check_fail "Root node_modules not found. Run: pnpm install"
fi

# Check app node_modules
if [ -d "apps/desktop/node_modules" ]; then
    check_pass "Desktop app node_modules exists"
else
    check_warn "Desktop app node_modules not found"
fi

# Check key dependencies
KEY_DEPS=(
    "node_modules/react"
    "node_modules/typescript"
    "node_modules/electron"
    "node_modules/vite"
)

for dep in "${KEY_DEPS[@]}"; do
    if [ -d "$dep" ]; then
        check_pass "Dependency $(basename $dep) installed"
    else
        check_warn "Dependency $(basename $dep) missing"
    fi
done

echo ""
echo "4️⃣  Checking Configuration Files..."
echo "--------------------------------"

CONFIG_FILES=(
    "tsconfig.json"
    ".eslintrc.json"
    ".prettierrc"
    "turbo.json"
    "apps/desktop/package.json"
    "apps/desktop/tsconfig.json"
    "apps/desktop/vite.config.ts"
    "apps/desktop/tailwind.config.js"
)

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_pass "Config file $file exists"
    else
        check_fail "Config file $file not found"
    fi
done

echo ""
echo "5️⃣  Checking Source Files..."
echo "--------------------------------"

# Count TypeScript files
TS_COUNT=$(find apps/desktop/src -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l)
if [ "$TS_COUNT" -gt 0 ]; then
    check_pass "Found $TS_COUNT TypeScript files"
else
    check_fail "No TypeScript files found"
fi

# Check main source files
MAIN_FILES=(
    "apps/desktop/src/main/index.ts"
    "apps/desktop/src/preload/index.ts"
    "apps/desktop/src/renderer/src/main.tsx"
    "apps/desktop/src/renderer/src/App.tsx"
)

for file in "${MAIN_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_pass "Source file $file exists"
    else
        check_fail "Source file $file not found"
    fi
done

echo ""
echo "6️⃣  TypeScript Type Checking..."
echo "--------------------------------"

if command -v pnpm &> /dev/null && [ -d "node_modules" ]; then
    check_info "Running TypeScript type check..."
    if pnpm type-check 2>&1 | tee /tmp/typecheck.log; then
        check_pass "TypeScript type check passed"
    else
        check_fail "TypeScript type check failed. See /tmp/typecheck.log"
        echo "First 10 errors:"
        head -10 /tmp/typecheck.log
    fi
else
    check_warn "Skipping type check (dependencies not installed)"
fi

echo ""
echo "7️⃣  Linting Check..."
echo "--------------------------------"

if command -v pnpm &> /dev/null && [ -d "node_modules" ]; then
    check_info "Running ESLint..."
    if pnpm lint 2>&1 | tee /tmp/lint.log; then
        check_pass "ESLint check passed"
    else
        LINT_WARNINGS=$(grep -c "warning" /tmp/lint.log || echo "0")
        LINT_ERRORS=$(grep -c "error" /tmp/lint.log || echo "0")

        if [ "$LINT_ERRORS" -gt 0 ]; then
            check_fail "ESLint found $LINT_ERRORS errors"
        else
            check_warn "ESLint found $LINT_WARNINGS warnings"
        fi
    fi
else
    check_warn "Skipping lint check (dependencies not installed)"
fi

echo ""
echo "8️⃣  Build Verification..."
echo "--------------------------------"

if [ -d "node_modules" ]; then
    check_info "Attempting to build main process..."
    cd apps/desktop

    if pnpm exec tsc -p tsconfig.main.json 2>&1 | tee /tmp/build-main.log; then
        if [ -f "dist/main/index.js" ]; then
            check_pass "Main process compiled successfully"
        else
            check_fail "Main process compilation succeeded but dist/main/index.js not found"
        fi
    else
        check_fail "Main process compilation failed. See /tmp/build-main.log"
    fi

    cd ../..
else
    check_warn "Skipping build verification (dependencies not installed)"
fi

echo ""
echo "=============================="
echo "📊 Results Summary"
echo "=============================="
echo -e "${GREEN}✅ Passed: $PASS${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARN${NC}"
echo -e "${RED}❌ Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 Setup verification completed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run 'pnpm desktop:dev' to start the app"
    echo "  2. Check FIRST_RUN.md for detailed testing instructions"
    exit 0
else
    echo -e "${RED}⚠️  Setup verification found issues.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  - Run 'pnpm install' if dependencies are missing"
    echo "  - Check error logs in /tmp/"
    echo "  - Review FIRST_RUN.md for troubleshooting"
    exit 1
fi
