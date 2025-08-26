#!/bin/bash

# Security Check Script
# Validates that no API keys or sensitive data are committed to the repository

echo "🔍 Running security checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ISSUES=0

# Check for common API key patterns
echo "Checking for API keys..."

# Google API Keys - Only check source files, not .env files
if find . -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" -o -name "*.md" | grep -v node_modules | grep -v dist | grep -v .next | xargs grep "AIza[A-Za-z0-9_-]\{35\}" 2>/dev/null | grep -v "your-firebase-api-key" | grep -v "your-gemini-api-key"; then
    echo -e "${RED}❌ Google API key detected!${NC}"
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}✅ No Google API keys found${NC}"
fi

# OpenAI API Keys - Only check source files, not .env files
if find . -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" -o -name "*.md" | grep -v node_modules | grep -v dist | grep -v .next | xargs grep "sk-[A-Za-z0-9]\{40,\}" 2>/dev/null; then
    echo -e "${RED}❌ OpenAI API key detected!${NC}"
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}✅ No OpenAI API keys found${NC}"
fi

# AWS Keys - Only check source files, not .env files (they should be in .env)
if find . -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" | grep -v node_modules | grep -v dist | grep -v .next | xargs grep "AKIA[0-9A-Z]\{16\}" 2>/dev/null; then
    echo -e "${RED}❌ AWS Access Key in source code detected!${NC}"
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}✅ No AWS keys in source code${NC}"
fi

# Check for hardcoded database URLs with passwords in source code only
if find . -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" -o -name "*.md" | grep -v node_modules | grep -v dist | grep -v .next | xargs grep "mysql://.*:.*@" 2>/dev/null | grep -v "your-username:your-password" | grep -v "username:password"; then
    echo -e "${RED}❌ Database URL with credentials in source code detected!${NC}"
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}✅ No database credentials in source code${NC}"
fi

# Check if .env files are properly gitignored
echo "Checking .gitignore configuration..."

if grep -q "^\.env$" .gitignore && grep -q "^\.env\.local$" .gitignore; then
    echo -e "${GREEN}✅ Environment files properly gitignored${NC}"
else
    echo -e "${RED}❌ .env files not properly gitignored${NC}"
    ISSUES=$((ISSUES + 1))
fi

# Check if any .env files are tracked (except .env.example which is allowed)
if git ls-files | grep -E "\.env(\.|$)" | grep -v ".env.example"; then
    echo -e "${RED}❌ Environment files are tracked by git!${NC}"
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}✅ No environment files tracked${NC}"
fi

# Summary
echo ""
echo "🛡️  Security Check Complete"
if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ All security checks passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Found $ISSUES security issues that need attention${NC}"
    echo ""
    echo "📖 See SECURITY.md for guidelines on fixing these issues"
    exit 1
fi
