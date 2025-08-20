#!/bin/bash

# Node.js kurulum sorununu düzelt
echo "🔧 Fixing Node.js installation conflicts..."

# Eski Node.js paketlerini tamamen kaldır
echo "📦 Removing old Node.js packages..."
apt remove --purge nodejs npm libnode-dev -y
apt autoremove -y
apt autoclean

# Node.js repository'sini tamamen temizle
echo "🧹 Cleaning Node.js repositories..."
rm -f /etc/apt/sources.list.d/nodesource.list
rm -f /etc/apt/trusted.gpg.d/nodesource.gpg

# Repository güncellemesi
apt update

# Node.js 20 kurulumu
echo "📥 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install nodejs -y

# Kurulum kontrolü
echo "✅ Verifying installation..."
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# npm global permissions düzelt
echo "🔐 Fixing npm permissions..."
mkdir -p /opt/isg-reports/.npm-global
chown -R isg:isg /opt/isg-reports/.npm-global

echo "✅ Node.js installation fixed!"