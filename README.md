# İSG Report System - Turkish Occupational Health & Safety Reports

🏥 **İstinye Üniversitesi Topkapı Liv Hastanesi** için geliştirilmiş kapsamlı İş Sağlığı ve Güvenliği rapor yönetim sistemi.

## 🚀 Ubuntu 22.04 Production Kurulum Rehberi

Bu rehber, sistemi temiz bir Ubuntu 22.04 sunucusuna production ortamında kurmanız için gerekli tüm adımları içerir.

### 📋 Ön Gereksinimler

Sisteminizde aşağıdakilerin kurulu olması gerekiyor:
- Ubuntu 22.04 LTS (temiz kurulum)
- Root veya sudo yetkisi
- İnternet bağlantısı

### 🔧 Adım 1: Sistem Güncellemesi

```bash
sudo apt update && apt upgrade -y
sudo apt install curl wget git nano htop -y
```

### 🐘 Adım 2: PostgreSQL Kurulumu

```bash
# PostgreSQL kurulumu
sudo apt install postgresql postgresql-contrib -y

# PostgreSQL servisini başlat
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Database ve kullanıcı oluştur
sudo -u postgres psql << EOF
CREATE DATABASE isg_reports;
CREATE USER isg_user WITH ENCRYPTED PASSWORD 'IsgSecure2024';
GRANT ALL PRIVILEGES ON DATABASE isg_reports TO isg_user;
ALTER DATABASE isg_reports OWNER TO isg_user;
ALTER USER isg_user CREATEDB;
\q
EOF
```

### 📦 Adım 3: Node.js 20 Kurulumu

```bash
# Node.js repository ekle
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Node.js ve npm kur
sudo apt install nodejs -y

# PM2 global kurulum (process management için)
npm install -g pm2

# Sürümleri kontrol et
node --version  # v20.x.x olmalı
npm --version   # 10.x.x olmalı
pm2 --version
```

### 👤 Adım 4: Sistem Kullanıcısı Oluştur

```bash
# İSG Reports için özel kullanıcı
mkdir -p /opt/isg-reports
cd /opt/isg-reports

# GitHub'dan projeyi indir
git clone https://github.com/0xmtnslk/SafetyReportr.git .

# Log dizini oluştur
mkdir -p /var/log/isg-reports

# Backup dizini oluştur
mkdir -p /opt/backups


### ⚙️ Adım 5: Environment Configuration

```bash
# Environment dosyasını oluştur
cd /opt/isg-reports
cp .env.example .env 2>/dev/null || touch .env

# Environment dosyasını düzenle
cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://isg_user:IsgSecure2024@localhost:5432/isg_reports

# JWT Secret (Güçlü kriptografik anahtar)
JWT_SECRET=1cH1QqQ6GA64XVQpS_uFgxUZCu3XN-cAImNg0B0xDeB7WEi2xrtbqHtWGCt6DIfy-0d9-yeEYElvyMp6hSyF7g

# Server Configuration
NODE_ENV=production
PORT=5000

# Default Admin User (İlk kurulum sonrası değiştirin)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_FULLNAME=Sistem Yöneticisi
ADMIN_LOCATION=Yönetim

# Session Configuration (Güçlü kriptografik anahtar)
SESSION_SECRET=WGVH-_zLE_yeeqlRrUzI5LBZeHUr8HAMneI55eySa7IGVGsGujabBlnjzgjWdP3M6mSpHs2Gf7UjpksS09pkSg
EOF

# Dosya izinlerini güvenli hale getir
chmod 600 .env

```

### 📦 Adım 6: Dependencies ve Build

```bash
cd /opt/isg-reports

# Dependencies kur
npm install

# Package.json'a gerekli scriptleri ekle (eğer yoksa)
npm pkg set scripts.seed:admin="tsx scripts/seed-admin.ts"
npm pkg set scripts.start:production="npm run start"
npm pkg set scripts.production:setup="npm run db:push --force && npm run seed:admin && npm run build"

# Database schema'yı kur
npm run db:push --force

# Admin kullanıcısı oluştur
npm run seed:admin

# Production build
npm run build
```

### 🔄 Adım 7: Systemd Service Kurulumu

```bash
cd /opt/isg-reports

# PM2 ecosystem dosyası oluştur
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'isg-reports',
    script: 'npm',
    args: 'run start:production',
    cwd: '/opt/isg-reports',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/isg-reports/error.log',
    out_file: '/var/log/isg-reports/out.log',
    log_file: '/var/log/isg-reports/combined.log',
    time: true
  }]
};
EOF

# PM2 ile uygulamayı başlat
pm2 start ecosystem.config.cjs

# PM2'yi sistem başlangıcında otomatik başlat
pm2 startup
pm2 save

echo "✅ PM2 servis kurulumu tamamlandı"
```

### 🔥 Adım 9: Firewall Konfigürasyonu

```bash
# UFW'yi etkinleştir
ufw --force enable

# SSH erişimini koru
ufw allow ssh

# Uygulama portunu aç
ufw allow 5000

# HTTP/HTTPS portlarını aç (Nginx için)
ufw allow 80
ufw allow 443

# PostgreSQL portunu sadece localhost'tan aç
ufw allow from 127.0.0.1 to any port 5432

# Firewall durumunu kontrol et
ufw status
```

### 🌐 Adım 9: Nginx Reverse Proxy (Opsiyonel)

Production ortamında 80/443 portlarından erişim için:

```bash
# Nginx kur
apt install nginx -y

# Site konfigürasyonu oluştur
cat > /etc/nginx/sites-available/medicalisg << 'EOF'
server {
    listen 80;
    server_name medicalisg.com www.medicalisg.com;  # Sadece medicalisg.com ve www.medicalisg.com için
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
    
    location / {
        proxy_pass http://91.99.184.43:5000;  # IP adresi ve port
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
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://91.99.184.43:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Default site'ı devre dışı bırak
rm -f /etc/nginx/sites-enabled/default

# Yeni site'ı etkinleştir
ln -sf /etc/nginx/sites-available/medicalisg /etc/nginx/sites-enabled/

# Nginx konfigürasyonunu test et
nginx -t

# Nginx'i başlat
systemctl restart nginx
systemctl enable nginx

echo "✅ Nginx kurulumu tamamlandı"

# Nginx için firewall kuralı
sudo ufw allow 'Nginx Full'
```

### 🔒 Adım 10: SSL Sertifikası (Let's Encrypt)

```bash
# Certbot kur (domain'iniz varsa)
apt install certbot python3-certbot-nginx -y

# SSL sertifikası al (domain'inizi yazın)
# certbot --nginx -d your-domain.com

# Otomatik yenileme test et
# certbot renew --dry-run

echo "ℹ️  SSL kurulumu için domain gerekli - manuel olarak yapılabilir"
```
### ✅ Adım 11: Monitoring ve Backup Kurulumu
```bash
# Log rotation konfigürasyonu
cat > /etc/logrotate.d/isg-reports << 'EOF'
/var/log/isg-reports/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    create 0644 root root
    postrotate
        pm2 reload isg-reports
    endscript
}
EOF

# Günlük database backup cron job
(crontab -l 2>/dev/null; echo "0 2 * * * sudo -u postgres pg_dump isg_reports > /opt/backups/isg_reports_\$(date +\\%Y\\%m\\%d).sql") | crontab -

# Eski backup'ları temizle (30 gün)
(crontab -l 2>/dev/null; echo "0 3 * * * find /opt/backups -name 'isg_reports_*.sql' -mtime +30 -delete") | crontab -

echo "✅ Monitoring ve backup kurulumu tamamlandı"
```

### ✅ Adım 12: Kurulum Doğrulama

```bash
echo "🔍 Sistem durumu kontrol ediliyor..."

# PM2 durumu
pm2 status

# Nginx durumu
systemctl status nginx --no-pager

# PostgreSQL durumu
systemctl status postgresql --no-pager

# Port dinleme kontrolü
netstat -tlnp | grep :5000
netstat -tlnp | grep :80

# HTTP erişim testi
sleep 5
curl -I http://localhost:5000 2>/dev/null | head -1
curl -I http://localhost 2>/dev/null | head -1

echo ""
echo "✅ Kurulum tamamlandı!"
echo ""
echo "🔑 Giriş Bilgileri:"
echo "URL: http://$(hostname -I | awk '{print $1}')"
echo "Kullanıcı Adı: admin"
echo "Şifre: ql\$zzLZSD*t3NR%b"
echo ""
echo "⚠️  UYARI: İlk girişten sonra mutlaka admin şifresini değiştirin!"
```

### 📊 Adım 13: Önemli Komutlar ve Dosya Yolları

```bash
# PM2 komutları
pm2 status                    # Durum kontrolü
pm2 logs isg-reports         # Logları görüntüle
pm2 restart isg-reports      # Yeniden başlat
pm2 stop isg-reports         # Durdur
pm2 start isg-reports        # Başlat

# Nginx komutları
systemctl status nginx       # Durum kontrolü
systemctl restart nginx      # Yeniden başlat
nginx -t                     # Konfigürasyon test
```

## 🔑 İlk Giriş Bilgileri

Kurulum tamamlandıktan sonra aşağıdaki bilgilerle giriş yapabilirsiniz:

- **URL**: http://your-domain.com (veya http://server-ip:5000)
- **Kullanıcı Adı**: admin
- **Şifre**: admin123

**⚠️ UYARI**: İlk girişten sonra mutlaka admin şifresini değiştirin!

## 📂 Önemli Dosya Yolları

- **Uygulama**: `/opt/isg-reports/`
- **Loglar**: `sudo journalctl -u isg-reports -f`
- **Konfigürasyon**: `/opt/isg-reports/.env`
- **Service**: `/etc/systemd/system/isg-reports.service`
- **Nginx**: `/etc/nginx/sites-available/isg-reports`

## 🔄 Güncelleme Prosedürü

```bash
cd /opt/isg-reports

# Güncellemeleri çek
git pull origin main

# Dependencies güncelle
npm install

# Build yap
npm run build

# PM2 ile yeniden başlat
pm2 restart isg-reports

echo "✅ Güncelleme tamamlandı"
```

## 🆘 Sorun Giderme

### Servis başlamıyor
```bash
# PM2 logları kontrol et
pm2 logs isg-reports

# Manuel başlatma testi
cd /opt/isg-reports
npm run start:production
```

### Database bağlantı hatası
```bash
# PostgreSQL durumu
systemctl status postgresql

# Database erişim testi
sudo -u postgres psql -c "SELECT version();"

# Bağlantı testi
sudo -u postgres psql -d isg_reports -c "SELECT current_database();"
```

### Port kullanımda hatası
```bash
# Port kim kullanıyor
netstat -tlnp | grep :5000
lsof -i :5000

# PM2 processlerini temizle
pm2 delete all
pm2 start ecosystem.config.js
```

## 📞 Destek

Sorunlarınız için:
1. Sistem loglarını kontrol edin
2. GitHub Issues bölümünde sorun bildirin
3. Sistem yöneticinizle iletişime geçin

## 🏆 Sistem Özellikleri

- ✅ Multi-kullanıcı sistemi
- ✅ Role-based access control (Admin/User)
- ✅ Location-based report filtering
- ✅ Turkish character support
- ✅ PDF export functionality
- ✅ Offline-first architecture
- ✅ Responsive design
- ✅ Production-ready deployment

---

**🎯 Kurulum tamamlandı!** Artık İSG Report System production ortamında çalışıyor.
