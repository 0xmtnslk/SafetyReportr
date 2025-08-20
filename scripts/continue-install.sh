#!/bin/bash

# İSG Reports kurulumunu Node.js düzeltmesinden sonra devam ettir
echo "🚀 Continuing İSG Reports installation..."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Node.js ve npm kontrolü
if ! command -v npm &> /dev/null; then
    print_error "npm still not found! Run fix-nodejs.sh first"
    exit 1
fi

print_step "Installing dependencies..."
cd /opt/isg-reports
sudo -u isg bash << 'EOF'
cd /opt/isg-reports
export npm_config_cache=/opt/isg-reports/.npm-cache
npm install
EOF

if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi
print_success "Dependencies installed successfully"

print_step "Setting up database schema..."
sudo -u isg bash << 'EOF'
cd /opt/isg-reports
export npm_config_cache=/opt/isg-reports/.npm-cache
npm run db:push -- --force
EOF

if [ $? -ne 0 ]; then
    print_error "Failed to setup database schema"
    exit 1
fi
print_success "Database schema created successfully"

print_step "Creating admin user..."
sudo -u isg bash << 'EOF'
cd /opt/isg-reports
export npm_config_cache=/opt/isg-reports/.npm-cache
npx tsx scripts/seed-admin.ts
EOF

print_success "Admin user created"

print_step "Building production bundle..."
sudo -u isg bash << 'EOF'
cd /opt/isg-reports
export npm_config_cache=/opt/isg-reports/.npm-cache
npm run build
EOF

if [ $? -ne 0 ]; then
    print_error "Failed to build production bundle"
    exit 1
fi
print_success "Production build completed successfully"

print_step "Starting service..."
systemctl restart isg-reports
sleep 5

# Check service status
if systemctl is-active --quiet isg-reports; then
    print_success "🎉 İSG Report System deployed successfully!"
    echo ""
    echo "📋 Service Details:"
    echo "   • Status: $(systemctl is-active isg-reports)"
    IP_ADDR=$(hostname -I | awk '{print $1}')
    echo "   • URL: http://$IP_ADDR:5000"
    echo "   • Logs: journalctl -u isg-reports -f"
    echo ""
    echo "🔑 Admin Login:"
    ADMIN_USER=$(sudo -u isg grep ADMIN_USERNAME /opt/isg-reports/.env | cut -d '=' -f2)
    ADMIN_PASS=$(sudo -u isg grep ADMIN_PASSWORD /opt/isg-reports/.env | cut -d '=' -f2)
    echo "   • Username: $ADMIN_USER"
    echo "   • Password: $ADMIN_PASS"
    echo ""
    echo "✅ Installation completed successfully!"
else
    print_error "❌ Service failed to start!"
    echo ""
    echo "🔍 Quick debugging:"
    echo "Service status:"
    systemctl status isg-reports --no-pager
    echo ""
    echo "Recent logs:"
    journalctl -u isg-reports --no-pager -n 10
    echo ""
    echo "Manual test:"
    echo "sudo -u isg bash -c 'cd /opt/isg-reports && npm run start'"
fi