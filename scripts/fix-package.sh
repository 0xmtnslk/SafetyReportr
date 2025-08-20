#!/bin/bash

# Ubuntu Deployment - Package.json Script Fixer
echo "🔧 Fixing package.json scripts for Ubuntu deployment..."

# Backup current package.json
cp package.json package.json.backup

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "📦 Installing jq for JSON editing..."
    sudo apt update && sudo apt install -y jq
fi

# Add missing scripts to package.json
echo "✨ Adding deployment scripts..."

# Use jq to add the missing scripts
jq '.scripts += {
  "seed:admin": "tsx scripts/seed-admin.ts",
  "start:production": "npm run start", 
  "deploy": "chmod +x scripts/deploy.sh && ./scripts/deploy.sh",
  "production:setup": "npm run db:push --force && npm run seed:admin && npm run build",
  "db:setup": "npm run db:push --force"
}' package.json > package.json.tmp && mv package.json.tmp package.json

echo "✅ Package.json scripts updated successfully!"

echo "📋 Added scripts:"
echo "  • seed:admin - Creates default admin user"
echo "  • start:production - Starts production server"
echo "  • deploy - Full deployment automation"
echo "  • production:setup - Database + admin + build"
echo "  • db:setup - Force database schema update"

echo ""
echo "🚀 Now you can run: npm run production:setup"