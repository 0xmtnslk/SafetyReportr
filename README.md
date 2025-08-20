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
sudo apt update && sudo apt upgrade -y
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
CREATE USER isg_user WITH ENCRYPTED PASSWORD 'secure_password_2024';
GRANT ALL PRIVILEGES ON DATABASE isg_reports TO isg_user;
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

# Sürümleri kontrol et
node --version  # v20.x.x olmalı
npm --version   # 10.x.x olmalı
```

### 👤 Adım 4: Sistem Kullanıcısı Oluştur

```bash
# İSG Reports için özel kullanıcı
sudo adduser --system --group --home /opt/isg-reports --shell /bin/bash isg

# Kullanıcı dizinini oluştur
sudo mkdir -p /opt/isg-reports
sudo chown isg:isg /opt/isg-reports
```

### 📂 Adım 5: Kod İndirme ve Kurulum

```bash
# İSG kullanıcısına geç
sudo su - isg

# GitHub'dan projeyi indir
cd /opt/isg-reports
git clone https://github.com/yourusername/isg-reports.git .

# Ownership düzelt (root'a geri dön)
exit
sudo chown -R isg:isg /opt/isg-reports
```

### ⚙️ Adım 6: Environment Configuration

```bash
# İSG kullanıcısı olarak devam et
sudo su - isg
cd /opt/isg-reports

# Environment dosyasını oluştur
cp .env.example .env

# Environment değişkenlerini düzenle
nano .env
```

**`.env` dosyasını şu şekilde düzenleyin:**
```env
# Database Configuration
DATABASE_URL=postgresql://isg_user:secure_password_2024@localhost:5432/isg_reports

# JWT Secret (Güçlü bir rastgele anahtar oluşturun)
JWT_SECRET=super-secure-jwt-secret-key-change-this-in-production-2024

# Server Configuration
NODE_ENV=production
PORT=5000

# Default Admin User
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_FULLNAME=Sistem Yöneticisi
ADMIN_LOCATION=Yönetim

# Session Configuration
SESSION_SECRET=super-secure-session-secret-change-this-in-production-2024
```

### 📦 Adım 7: Dependencies ve Build

```bash
# Dependencies kur (development dependencies dahil)
npm install

# Database schema'yı kur
npm run db:push --force

# Admin kullanıcısı oluştur
npm run seed:admin

# Production build
npm run build
```

**IMPORTANT:** Package.json'a aşağıdaki scriptleri manuel olarak ekleyin:

```json
{
  "scripts": {
    "seed:admin": "tsx scripts/seed-admin.ts",
    "start:production": "npm run start",
    "deploy": "chmod +x scripts/deploy.sh && ./scripts/deploy.sh",
    "production:setup": "npm run db:push --force && npm run seed:admin && npm run build"
  }
}
```

### 🔄 Adım 8: Systemd Service Kurulumu

```bash
# Root kullanıcısına geri dön
exit

# Service dosyasını kopyala
sudo cp /opt/isg-reports/systemd/isg-reports.service /etc/systemd/system/

# Service dosyasını düzenle (gerekirse)
sudo nano /etc/systemd/system/isg-reports.service

# Systemd'yi yenile ve servisi etkinleştir
sudo systemctl daemon-reload
sudo systemctl enable isg-reports

# Servisi başlat
sudo systemctl start isg-reports

# Servis durumunu kontrol et
sudo systemctl status isg-reports
```

### 🔥 Adım 9: Firewall Konfigürasyonu

```bash
# UFW'yi etkinleştir
sudo ufw enable

# SSH erişimini koru
sudo ufw allow ssh

# Uygulama portunu aç
sudo ufw allow 5000

# PostgreSQL portunu sadece localhost'tan aç
sudo ufw allow from 127.0.0.1 to any port 5432

# Firewall durumunu kontrol et
sudo ufw status
```

### 🌐 Adım 10: Nginx Reverse Proxy (Opsiyonel)

Production ortamında 80/443 portlarından erişim için:

```bash
# Nginx kur
sudo apt install nginx -y

# Site konfigürasyonu
sudo nano /etc/nginx/sites-available/isg-reports

# Konfigürasyon içeriği:
```

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Kendi domain'inizi yazın
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Site'ı etkinleştir
sudo ln -s /etc/nginx/sites-available/isg-reports /etc/nginx/sites-enabled/

# Nginx'i test et ve başlat
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Nginx için firewall kuralı
sudo ufw allow 'Nginx Full'
```

### 🔒 Adım 11: SSL Sertifikası (Let's Encrypt)

```bash
# Certbot kur
sudo apt install certbot python3-certbot-nginx -y

# SSL sertifikası al
sudo certbot --nginx -d your-domain.com

# Otomatik yenileme test et
sudo certbot renew --dry-run
```

### ✅ Adım 12: Kurulum Doğrulama

```bash
# Servis durumu
sudo systemctl status isg-reports

# Logları kontrol et
sudo journalctl -u isg-reports -f

# Port dinleme kontrolü
sudo netstat -tlnp | grep :5000

# HTTP erişim testi
curl http://localhost:5000

# Nginx varsa
curl http://your-domain.com
```

### 📊 Adım 13: Monitoring ve Maintenance

```bash
# Log rotation için
sudo nano /etc/logrotate.d/isg-reports
```

```bash
/var/log/isg-reports/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    create 0644 isg isg
    postrotate
        systemctl reload isg-reports
    endscript
}
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
# İSG kullanıcısına geç
sudo su - isg
cd /opt/isg-reports

# Güncellemeleri çek
git pull origin main

# Dependencies güncelle
npm install

# Build yap
npm run build

# Root kullanıcısına geç
exit

# Servisi yeniden başlat
sudo systemctl restart isg-reports
```

## 🆘 Sorun Giderme

### Servis başlamıyor
```bash
# Detaylı logları kontrol et
sudo journalctl -u isg-reports -n 50

# Manuel başlatma testi
sudo su - isg
cd /opt/isg-reports
npm run start:production
```

### Database bağlantı hatası
```bash
# PostgreSQL durumu
sudo systemctl status postgresql

# Database erişim testi
sudo -u postgres psql -c "SELECT version();"
```

### Port kullanımda hatası
```bash
# Port kim kullanıyor
sudo netstat -tlnp | grep :5000
sudo lsof -i :5000
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