# 🏥 İSG Report System - Ubuntu 22.04 Production Deployment Guide

**Medical İSG Report System** için Ubuntu 22.04 sunucu deployment rehberi. Bu sistem medicalisg.com domain'ine bağlanacak şekilde yapılandırılmıştır.

**GitHub Repository:** https://github.com/0xmtnslk/SafetyReportr.git

---

## 📋 Ön Gereksinimler

- ✅ Ubuntu 22.04 LTS (temiz kurulum)
- ✅ Root veya sudo yetkisi
- ✅ İnternet bağlantısı
- ✅ Domain name (medicalisg.com) DNS ayarları
- ✅ En az 2GB RAM, 20GB disk alanı

---

## 🚀 Tam Kurulum Rehberi

### 🔧 1. Sistem Hazırlığı

```bash
# Sistem güncellemesi
sudo apt update && sudo apt upgrade -y

# Gerekli paketleri kur
sudo apt install -y curl wget git nano htop unzip software-properties-common

# Timezone ayarla
sudo timedatectl set-timezone Europe/Istanbul

echo "✅ Sistem hazırlığı tamamlandı"
```

### 🐘 2. PostgreSQL 15 Kurulumu

```bash
# PostgreSQL repository ekle
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update

# PostgreSQL 15 kur
sudo apt install -y postgresql-15 postgresql-contrib-15

# PostgreSQL servisini başlat
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Database ve kullanıcı oluştur
sudo -u postgres psql << 'EOF'
CREATE DATABASE isg_reports;
CREATE USER isg_user WITH ENCRYPTED PASSWORD 'IsgSecure2024!medicalisg';
GRANT ALL PRIVILEGES ON DATABASE isg_reports TO isg_user;
ALTER DATABASE isg_reports OWNER TO isg_user;
ALTER USER isg_user CREATEDB;
ALTER USER isg_user SUPERUSER;
\q
EOF

# PostgreSQL yapılandırması
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/15/main/postgresql.conf

# pg_hba.conf ayarları
sudo tee -a /etc/postgresql/15/main/pg_hba.conf << 'EOF'
# Local connections for isg_user
local   isg_reports     isg_user                    md5
host    isg_reports     isg_user    127.0.0.1/32    md5
EOF

# PostgreSQL yeniden başlat
sudo systemctl restart postgresql

# Bağlantı test et
sudo -u postgres psql -d isg_reports -c "SELECT version();"

echo "✅ PostgreSQL kurulumu tamamlandı"
```

### 📦 3. Node.js 20 Kurulumu

```bash
# Node.js 20 repository ekle
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Node.js ve npm kur
sudo apt install -y nodejs

# PM2 global kurulum (process management için)
sudo npm install -g pm2

# Yarn kurulum (opsiyonel, npm yerine)
sudo npm install -g yarn

# Sürümleri kontrol et
node --version  # v20.x.x olmalı
npm --version   # 10.x.x olmalı
pm2 --version

echo "✅ Node.js kurulumu tamamlandı"
```

### 👤 4. Uygulama Kullanıcısı ve Dizin Yapısı

```bash
# İSG Reports için sistem kullanıcısı oluştur
sudo useradd -r -s /bin/bash -d /opt/isg-reports isg-system
sudo mkdir -p /opt/isg-reports
sudo mkdir -p /var/log/isg-reports
sudo mkdir -p /opt/backups

# GitHub'dan projeyi çek
cd /opt/isg-reports
sudo git clone https://github.com/0xmtnslk/SafetyReportr.git .

# Dosya izinlerini ayarla
sudo chown -R isg-system:isg-system /opt/isg-reports
sudo chown -R isg-system:isg-system /var/log/isg-reports
sudo chown -R isg-system:isg-system /opt/backups

echo "✅ Kullanıcı ve dizin yapısı oluşturuldu"
```

### ⚙️ 5. Environment Configuration

```bash
cd /opt/isg-reports

# Environment dosyasını oluştur
sudo -u isg-system tee .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://isg_user:IsgSecure2024!medicalisg@localhost:5432/isg_reports

# JWT Secret (Güçlü kriptografik anahtar)
JWT_SECRET=1cH1QqQ6GA64XVQpS_uFgxUZCu3XN-cAImNg0B0xDeB7WEi2xrtbqHtWGCt6DIfy-0d9-yeEYElvyMp6hSyF7g

# Server Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Default Admin User (İlk kurulum sonrası değiştirin)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin2024!medicalisg
ADMIN_FULLNAME=Sistem Yöneticisi
ADMIN_LOCATION=Merkez Ofis

# Session Configuration (Güçlü kriptografik anahtar)
SESSION_SECRET=WGVH-_zLE_yeeqlRrUzI5LBZeHUr8HAMneI55eySa7IGVGsGujabBlnjzgjWdP3M6mSpHs2Gf7UjpksS09pkSg

# Production URL
PRODUCTION_URL=https://medicalisg.com
EOF

# Dosya izinlerini güvenli hale getir
sudo chmod 600 .env
sudo chown isg-system:isg-system .env

echo "✅ Environment configuration tamamlandı"
```

### 📦 6. Dependencies ve Build

```bash
cd /opt/isg-reports

# İSG kullanıcısı olarak işlemleri yap
sudo -u isg-system bash << 'EOF'
# Node modules temizle (eğer varsa)
rm -rf node_modules package-lock.json

# Dependencies kur
npm install

# Database schema'yı kur
npm run db:push

# Admin kullanıcısı oluştur
npx tsx scripts/seed-admin.ts

# Production build
npm run build

echo "✅ Build işlemi tamamlandı"
EOF
```

### 🔄 7. PM2 ile Servis Kurulumu

```bash
cd /opt/isg-reports

# PM2 ecosystem dosyası oluştur
sudo -u isg-system tee ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'medicalisg',
    script: 'npm',
    args: 'run start',
    cwd: '/opt/isg-reports',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      HOST: '0.0.0.0'
    },
    error_file: '/var/log/isg-reports/error.log',
    out_file: '/var/log/isg-reports/out.log',
    log_file: '/var/log/isg-reports/combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    kill_timeout: 3000,
    wait_ready: true,
    listen_timeout: 3000
  }]
};
EOF

# PM2 ile uygulamayı başlat
sudo -u isg-system pm2 start ecosystem.config.cjs

# PM2'yi root olarak sistem başlangıcında otomatik başlat
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u isg-system --hp /opt/isg-reports
sudo -u isg-system pm2 save

# PM2 durumunu kontrol et
sudo -u isg-system pm2 status

echo "✅ PM2 servis kurulumu tamamlandı"
```

### 🔥 8. Firewall Konfigürasyonu

```bash
# UFW'yi etkinleştir
sudo ufw --force enable

# SSH erişimini koru
sudo ufw allow OpenSSH

# HTTP/HTTPS portlarını aç
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Uygulama portunu aç (sadece localhost - nginx proxy için)
sudo ufw allow from 127.0.0.1 to any port 5000

# PostgreSQL portunu sadece localhost'tan aç
sudo ufw allow from 127.0.0.1 to any port 5432

# Firewall durumunu kontrol et
sudo ufw status numbered

echo "✅ Firewall konfigürasyonu tamamlandı"
```

### 🌐 9. Nginx Reverse Proxy

```bash
# Nginx kur
sudo apt install -y nginx

# Mevcut default konfigürasyonu yedekle
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# medicalisg.com için site konfigürasyonu oluştur
sudo tee /etc/nginx/sites-available/medicalisg << 'EOF'
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=3r/m;

server {
    listen 80;
    server_name medicalisg.com www.medicalisg.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; img-src 'self' data: blob: https:; font-src 'self' data: https:;" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Rate limiting for login
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Rate limiting for API
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Main application
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_Set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:5000;
        access_log off;
    }
    
    # Block sensitive files
    location ~ /\.(env|git|svn) {
        deny all;
        return 404;
    }
    
    # Block backup files
    location ~ \.(bak|backup|sql|log)$ {
        deny all;
        return 404;
    }
}
EOF

# Default site'ı devre dışı bırak
sudo rm -f /etc/nginx/sites-enabled/default

# Yeni site'ı etkinleştir
sudo ln -sf /etc/nginx/sites-available/medicalisg /etc/nginx/sites-enabled/

# Nginx konfigürasyonunu test et
sudo nginx -t

if [ $? -eq 0 ]; then
    # Nginx'i başlat
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    echo "✅ Nginx kurulumu tamamlandı"
else
    echo "❌ Nginx konfigürasyon hatası!"
    exit 1
fi
```

### 🔒 10. SSL Sertifikası (Let's Encrypt)

```bash
# Certbot kur
sudo apt install -y certbot python3-certbot-nginx

# Domain'in IP'ye yönlendirildiğinden emin olun
echo "⚠️  DNS kayıtlarınızın doğru yapılandırıldığından emin olun:"
echo "A Record: medicalisg.com -> $(curl -s ifconfig.me)"
echo "A Record: www.medicalisg.com -> $(curl -s ifconfig.me)"
echo ""
read -p "DNS kayıtları doğru mu? (y/N): " dns_ready

if [[ $dns_ready =~ ^[Yy]$ ]]; then
    # SSL sertifikası al
    sudo certbot --nginx -d medicalisg.com -d www.medicalisg.com --non-interactive --agree-tos --email admin@medicalisg.com
    
    # Otomatik yenileme testi
    sudo certbot renew --dry-run
    
    # Cron job ekle (iki kere günde kontrol)
    (sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | sudo crontab -
    
    echo "✅ SSL sertifikası kurulumu tamamlandı"
else
    echo "⚠️  DNS kayıtlarını yapılandırdıktan sonra SSL kurulumunu yapın:"
    echo "sudo certbot --nginx -d medicalisg.com -d www.medicalisg.com"
fi
```

### ✅ 11. Monitoring ve Backup

```bash
# Log rotation konfigürasyonu
sudo tee /etc/logrotate.d/isg-reports << 'EOF'
/var/log/isg-reports/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    create 0644 isg-system isg-system
    postrotate
        sudo -u isg-system pm2 reload medicalisg
    endscript
}
EOF

# Database backup scripti oluştur
sudo tee /opt/backups/backup-database.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="isg_reports"
DB_USER="isg_user"

# Database backup
export PGPASSWORD="IsgSecure2024!medicalisg"
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/isg_reports_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/isg_reports_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "isg_reports_*.sql.gz" -mtime +30 -delete

echo "$(date): Database backup completed - isg_reports_$DATE.sql.gz"
EOF

sudo chmod +x /opt/backups/backup-database.sh

# Cron jobs ekle
(sudo crontab -l 2>/dev/null; cat << 'EOF'
# Daily database backup at 2 AM
0 2 * * * /opt/backups/backup-database.sh >> /var/log/isg-reports/backup.log 2>&1

# Weekly restart at 3 AM Sunday
0 3 * * 0 sudo -u isg-system pm2 restart medicalisg

# Cleanup old logs weekly
0 1 * * 0 find /var/log/isg-reports -name "*.log.*" -mtime +7 -delete
EOF
) | sudo crontab -

echo "✅ Monitoring ve backup kurulumu tamamlandı"
```

### 🔍 12. Kurulum Doğrulama

```bash
echo "🔍 Sistem durumu kontrol ediliyor..."

# PM2 durumu
echo "=== PM2 Status ==="
sudo -u isg-system pm2 status

# Nginx durumu
echo -e "\n=== Nginx Status ==="
sudo systemctl status nginx --no-pager

# PostgreSQL durumu
echo -e "\n=== PostgreSQL Status ==="
sudo systemctl status postgresql --no-pager

# Port dinleme kontrolü
echo -e "\n=== Port Check ==="
sudo netstat -tlnp | grep :5000
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# SSL sertifika durumu
echo -e "\n=== SSL Certificate ==="
sudo certbot certificates 2>/dev/null || echo "SSL henüz kurulmadı"

# HTTP erişim testi
echo -e "\n=== HTTP Test ==="
sleep 3
curl -I http://localhost:5000 2>/dev/null | head -1 || echo "Local test failed"

# Application health check
echo -e "\n=== Application Health ==="
curl -s http://localhost:5000/health 2>/dev/null || echo "Health check endpoint not available"

# Disk usage
echo -e "\n=== Disk Usage ==="
df -h /opt/isg-reports
df -h /var/log/isg-reports

echo ""
echo "✅ Kurulum tamamlandı!"
echo ""
echo "🔑 Giriş Bilgileri:"
echo "URL: https://medicalisg.com (SSL kuruluysa)"
echo "URL: http://medicalisg.com (SSL henüz kurulmadıysa)"
echo "Kullanıcı Adı: admin"
echo "Şifre: Admin2024!medicalisg"
echo ""
echo "⚠️  UYARI: İlk girişten sonra mutlaka admin şifresini değiştirin!"
echo ""
echo "📱 Sistem Yönetimi:"
echo "PM2 Status: sudo -u isg-system pm2 status"
echo "PM2 Logs: sudo -u isg-system pm2 logs medicalisg"
echo "PM2 Restart: sudo -u isg-system pm2 restart medicalisg"
echo "Nginx Test: sudo nginx -t"
echo "Nginx Restart: sudo systemctl restart nginx"
```

---

## 🔄 Güncelleme Prosedürü

```bash
# Uygulama güncellemesi
cd /opt/isg-reports

# Git repository'den güncellemeleri çek
sudo -u isg-system git pull origin main

# Dependencies güncelle
sudo -u isg-system npm install

# Database schema güncellemelerini uygula
sudo -u isg-system npm run db:push

# Production build yap
sudo -u isg-system npm run build

# Uygulamayı yeniden başlat
sudo -u isg-system pm2 restart medicalisg

# Nginx reload (eğer konfigürasyon değiştiyse)
sudo systemctl reload nginx

echo "✅ Güncelleme tamamlandı"
```

---

## 🆘 Sorun Giderme

### Uygulama başlamıyor
```bash
# PM2 loglarını kontrol et
sudo -u isg-system pm2 logs medicalisg

# Manuel başlatma testi
cd /opt/isg-reports
sudo -u isg-system npm run start

# Environment dosyasını kontrol et
sudo -u isg-system cat .env
```

### Database bağlantı hatası
```bash
# PostgreSQL durumu
sudo systemctl status postgresql

# Database bağlantı testi
sudo -u postgres psql -d isg_reports -c "SELECT current_database();"

# Connection string testi
sudo -u isg-system psql "postgresql://isg_user:IsgSecure2024!medicalisg@localhost:5432/isg_reports" -c "SELECT version();"
```

### Nginx sorunları
```bash
# Nginx konfigürasyon testi
sudo nginx -t

# Nginx logları
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Port kullanım kontrolü
sudo netstat -tlnp | grep :80
sudo lsof -i :80
```

### SSL sorunları
```bash
# Certbot durumu
sudo certbot certificates

# SSL yenileme testi
sudo certbot renew --dry-run

# Nginx SSL konfigürasyonu
sudo nginx -T | grep ssl
```

---

## 📊 Önemli Dosya Yolları

- **Uygulama**: `/opt/isg-reports/`
- **Loglar**: `/var/log/isg-reports/`
- **Backups**: `/opt/backups/`
- **Environment**: `/opt/isg-reports/.env`
- **PM2 Config**: `/opt/isg-reports/ecosystem.config.cjs`
- **Nginx Config**: `/etc/nginx/sites-available/medicalisg`
- **SSL Certificates**: `/etc/letsencrypt/live/medicalisg.com/`

---

## 🎯 Production Checklist

- [ ] Ubuntu 22.04 sistem güncellemesi
- [ ] PostgreSQL 15 kurulumu ve konfigürasyonu
- [ ] Node.js 20 kurulumu
- [ ] Uygulama kullanıcısı oluşturma
- [ ] GitHub'dan kod çekme
- [ ] Environment dosyası konfigürasyonu
- [ ] Dependencies kurulumu ve build
- [ ] PM2 servis kurulumu
- [ ] Firewall konfigürasyonu
- [ ] Nginx reverse proxy kurulumu
- [ ] SSL sertifikası kurulumu
- [ ] Monitoring ve backup kurulumu
- [ ] Sistem doğrulama testleri
- [ ] DNS kayıtları (medicalisg.com → Server IP)
- [ ] İlk admin girişi ve şifre değişimi

---

**🎉 Kurulum Tamamlandı!** 

medicalisg.com artık production ortamında çalışıyor. Sistem güvenli, scalable ve monitoring altında.