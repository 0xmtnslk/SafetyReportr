#!/bin/bash

# İSG Report System - Production Deployment Script
echo "🚀 Starting İSG Report System deployment..."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    print_warning "Please copy .env.example to .env and configure your settings:"
    echo "cp .env.example .env"
    echo "nano .env"
    exit 1
fi

print_step "Installing dependencies..."
npm install --production=false
if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi
print_success "Dependencies installed successfully"

print_step "Setting up database schema..."
npm run db:push --force
if [ $? -ne 0 ]; then
    print_error "Failed to setup database schema"
    exit 1
fi
print_success "Database schema created successfully"

print_step "Creating admin user..."
npm run seed:admin
if [ $? -ne 0 ]; then
    print_warning "Admin user creation failed or admin already exists"
fi

print_step "Building production bundle..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Failed to build production bundle"
    exit 1
fi
print_success "Production build completed successfully"

print_step "Setting up systemd service..."
sudo cp systemd/isg-reports.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable isg-reports
print_success "Systemd service configured"

print_step "Starting the service..."
sudo systemctl start isg-reports
sleep 3

# Check service status
if sudo systemctl is-active --quiet isg-reports; then
    print_success "🎉 İSG Report System deployed successfully!"
    echo ""
    echo "📋 Service Details:"
    echo "   • Service Status: $(sudo systemctl is-active isg-reports)"
    echo "   • Service URL: http://localhost:5000"
    echo "   • Logs: sudo journalctl -u isg-reports -f"
    echo ""
    echo "🔑 Admin Login:"
    echo "   • Username: $(grep ADMIN_USERNAME .env | cut -d '=' -f2)"
    echo "   • Password: $(grep ADMIN_PASSWORD .env | cut -d '=' -f2)"
    echo ""
    echo "⚠️  Don't forget to:"
    echo "   • Change admin password after first login"
    echo "   • Configure firewall (ufw allow 5000)"
    echo "   • Setup reverse proxy (nginx) for production"
else
    print_error "Service failed to start!"
    echo "Check logs with: sudo journalctl -u isg-reports -f"
    exit 1
fi