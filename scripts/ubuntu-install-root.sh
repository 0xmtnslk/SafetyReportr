#!/bin/bash

# Complete Ubuntu 22.04 Installation Script for İSG Reports (ROOT VERSION)
echo "🚀 İSG Reports System - Ubuntu 22.04 Complete Installation (Root Mode)"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_info() { echo -e "${PURPLE}[INFO]${NC} $1"; }

# Root check
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

print_step "System Update..."
apt update && apt upgrade -y

print_step "Installing required packages..."
apt install postgresql postgresql-contrib jq curl git nodejs npm -y

# Install Node.js 20 if needed
NODE_VERSION=$(node --version 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" != "20" ]; then
    print_step "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install nodejs -y
fi

print_step "Setting up PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# PostgreSQL database setup
print_step "Creating database and user..."
sudo -u postgres psql << 'EOF'
DROP DATABASE IF EXISTS isg_reports;
DROP USER IF EXISTS isg_user;
CREATE DATABASE isg_reports;
CREATE USER isg_user WITH ENCRYPTED PASSWORD 'isg_secure_password_2024';
GRANT ALL PRIVILEGES ON DATABASE isg_reports TO isg_user;
ALTER USER isg_user CREATEDB;
GRANT ALL ON SCHEMA public TO isg_user;
\q
EOF

print_step "Creating system user..."
if ! id "isg" &>/dev/null; then
    adduser --system --group --home /opt/isg-reports --shell /bin/bash isg
fi

mkdir -p /opt/isg-reports
chown isg:isg /opt/isg-reports

print_step "Setting up application files..."
# Copy current directory content to /opt/isg-reports
cp -r ./* /opt/isg-reports/ 2>/dev/null || true
cp -r ./.* /opt/isg-reports/ 2>/dev/null || true
chown -R isg:isg /opt/isg-reports

print_step "Setting up environment..."
sudo -u isg bash << 'EOF'
cd /opt/isg-reports

# Create .env file
if [ -f .env.example ]; then
    cp .env.example .env
else
    echo "DATABASE_URL=postgresql://isg_user:isg_secure_password_2024@localhost:5432/isg_reports
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
PORT=5000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_FULLNAME=Sistem Yöneticisi
ADMIN_LOCATION=Yönetim" > .env
fi

# Update .env with correct database settings
sed -i 's|postgresql://username:password@localhost:5432/isg_reports|postgresql://isg_user:isg_secure_password_2024@localhost:5432/isg_reports|g' .env

# Generate secure JWT secrets
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

sed -i "s|your-super-secure-jwt-secret-key-change-this|$JWT_SECRET|g" .env
sed -i "s|your-super-secure-session-secret-change-this|$SESSION_SECRET|g" .env

echo "✅ Environment configured"
EOF

print_step "Fixing package.json scripts..."
sudo -u isg bash << 'EOF'
cd /opt/isg-reports

# Add missing scripts to package.json using sed (no jq dependency)
if ! grep -q "seed:admin" package.json; then
    # Backup package.json
    cp package.json package.json.backup
    
    # Add scripts before the closing of scripts section
    sed -i '/"scripts": {/,/}/ {
        /}/i\
    "seed:admin": "tsx scripts/seed-admin.ts",\
    "start:production": "npm run start",\
    "deploy": "chmod +x scripts/deploy.sh && ./scripts/deploy.sh",\
    "production:setup": "npm run db:push --force && npm run seed:admin && npm run build",\
    "db:setup": "npm run db:push --force",
    }' package.json
    
    # Fix JSON syntax (remove last comma before closing brace)
    sed -i ':a;N;$!ba;s/,\n[[:space:]]*}/\n  }/g' package.json
    
    echo "✅ Package.json scripts added"
fi
EOF

print_step "Installing dependencies..."
sudo -u isg bash -c "cd /opt/isg-reports && npm install"

print_step "Setting up database schema..."
sudo -u isg bash -c "cd /opt/isg-reports && npm run db:push -- --force"

print_step "Creating admin user..."
sudo -u isg bash -c "cd /opt/isg-reports && npx tsx scripts/seed-admin.ts"

print_step "Building production bundle..."
sudo -u isg bash -c "cd /opt/isg-reports && npm run build"

print_step "Setting up systemd service..."
cp /opt/isg-reports/systemd/isg-reports.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable isg-reports

print_step "Starting service..."
systemctl start isg-reports
sleep 5

print_step "Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 5000

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
    echo "⚠️  Next Steps:"
    echo "   • Access: http://$IP_ADDR:5000"
    echo "   • Change admin password after login"
    echo "   • Setup Nginx reverse proxy (optional)"
    echo "   • Install SSL certificate (optional)"
    echo ""
    echo "🔧 Useful Commands:"
    echo "   • Check status: systemctl status isg-reports"
    echo "   • View logs: journalctl -u isg-reports -f"
    echo "   • Restart: systemctl restart isg-reports"
else
    print_error "❌ Service failed to start!"
    echo "🔍 Debugging steps:"
    echo "1. Check service status: systemctl status isg-reports"
    echo "2. Check logs: journalctl -u isg-reports -f"
    echo "3. Manual test: sudo -u isg bash -c 'cd /opt/isg-reports && npm run start'"
    echo "4. Check database: sudo -u postgres psql -d isg_reports -c 'SELECT version();'"
    exit 1
fi