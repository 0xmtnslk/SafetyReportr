#!/bin/bash

# Complete Ubuntu 22.04 Installation Script for İSG Reports
echo "🚀 İSG Reports System - Ubuntu 22.04 Complete Installation"

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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

print_step "System Update..."
sudo apt update && sudo apt upgrade -y

print_step "Installing PostgreSQL..."
sudo apt install postgresql postgresql-contrib jq curl git -y

print_step "Setting up PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# PostgreSQL database setup
print_step "Creating database and user..."
sudo -u postgres psql << 'EOF'
CREATE DATABASE isg_reports;
CREATE USER isg_user WITH ENCRYPTED PASSWORD 'isg_secure_password_2024';
GRANT ALL PRIVILEGES ON DATABASE isg_reports TO isg_user;
ALTER USER isg_user CREATEDB;
\q
EOF

print_step "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

print_step "Creating system user..."
sudo adduser --system --group --home /opt/isg-reports --shell /bin/bash isg
sudo mkdir -p /opt/isg-reports
sudo chown isg:isg /opt/isg-reports

print_step "Downloading İSG Reports..."
cd /tmp
if [ ! -d "isg-reports" ]; then
    read -p "Enter GitHub repository URL: " REPO_URL
    git clone $REPO_URL isg-reports
else
    print_info "Using existing isg-reports directory"
fi

sudo cp -r isg-reports/* /opt/isg-reports/
sudo chown -R isg:isg /opt/isg-reports

print_step "Setting up environment..."
sudo -u isg bash << 'EOF'
cd /opt/isg-reports

# Create .env file
cp .env.example .env

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
sudo -u isg bash -c "cd /opt/isg-reports && chmod +x scripts/fix-package.sh && ./scripts/fix-package.sh"

print_step "Installing dependencies..."
sudo -u isg bash -c "cd /opt/isg-reports && npm install"

print_step "Setting up database schema..."
sudo -u isg bash -c "cd /opt/isg-reports && npm run db:setup"

print_step "Creating admin user..."
sudo -u isg bash -c "cd /opt/isg-reports && npm run seed:admin"

print_step "Building production bundle..."
sudo -u isg bash -c "cd /opt/isg-reports && npm run build"

print_step "Setting up systemd service..."
sudo cp /opt/isg-reports/systemd/isg-reports.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable isg-reports

print_step "Starting service..."
sudo systemctl start isg-reports
sleep 5

print_step "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 5000

# Check service status
if sudo systemctl is-active --quiet isg-reports; then
    print_success "🎉 İSG Report System deployed successfully!"
    echo ""
    echo "📋 Service Details:"
    echo "   • Status: $(sudo systemctl is-active isg-reports)"
    echo "   • URL: http://$(hostname -I | awk '{print $1}'):5000"
    echo "   • Logs: sudo journalctl -u isg-reports -f"
    echo ""
    echo "🔑 Admin Login:"
    ADMIN_USER=$(sudo -u isg grep ADMIN_USERNAME /opt/isg-reports/.env | cut -d '=' -f2)
    ADMIN_PASS=$(sudo -u isg grep ADMIN_PASSWORD /opt/isg-reports/.env | cut -d '=' -f2)
    echo "   • Username: $ADMIN_USER"
    echo "   • Password: $ADMIN_PASS"
    echo ""
    echo "⚠️  Next Steps:"
    echo "   • Access: http://$(hostname -I | awk '{print $1}'):5000"
    echo "   • Change admin password after login"
    echo "   • Setup Nginx reverse proxy (optional)"
    echo "   • Install SSL certificate (optional)"
else
    print_error "❌ Service failed to start!"
    echo "Check logs: sudo journalctl -u isg-reports -f"
    echo "Check service: sudo systemctl status isg-reports"
    exit 1
fi