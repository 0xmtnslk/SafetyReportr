# 🚀 Ubuntu 22.04 - Tek Komut Kurulum

## ⚡ Hızlı Kurulum (Önerilen)

### 1️⃣ Repository İndirin
```bash
git clone https://github.com/yourusername/isg-reports.git
cd isg-reports
```

### 2️⃣ Otomatik Kurulum Çalıştırın
```bash
chmod +x scripts/ubuntu-install.sh
./scripts/ubuntu-install.sh
```

Bu script şunları yapar:
- ✅ PostgreSQL kurulumu ve konfigürasyonu  
- ✅ Node.js 20 kurulumu
- ✅ Sistem kullanıcısı oluşturma
- ✅ Environment ayarları 
- ✅ Package.json script düzeltmeleri
- ✅ Database schema kurulumu
- ✅ Admin kullanıcısı oluşturma
- ✅ Production build
- ✅ SystemD service kurulumu
- ✅ Firewall konfigürasyonu

---

## 🔧 Manuel Kurulum (Sorun Çıkarsa)

### Adım 1: Sistem Hazırlığı
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install postgresql postgresql-contrib jq curl git -y
```

### Adım 2: PostgreSQL Kurulumu  
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql

sudo -u postgres psql << 'EOF'
CREATE DATABASE isg_reports;
CREATE USER isg_user WITH ENCRYPTED PASSWORD 'isg_secure_password_2024';
GRANT ALL PRIVILEGES ON DATABASE isg_reports TO isg_user;
ALTER USER isg_user CREATEDB;
\q
EOF
```

### Adım 3: Node.js Kurulumu
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y
```

### Adım 4: Uygulama Kurulumu
```bash
# Sistem kullanıcısı oluştur
sudo adduser --system --group --home /opt/isg-reports --shell /bin/bash isg
sudo mkdir -p /opt/isg-reports
sudo chown isg:isg /opt/isg-reports

# Kodu kopyala
sudo cp -r . /opt/isg-reports/
sudo chown -R isg:isg /opt/isg-reports

# Environment ayarla
sudo -u isg bash << 'EOF'
cd /opt/isg-reports
cp .env.example .env
sed -i 's|postgresql://username:password@localhost:5432/isg_reports|postgresql://isg_user:isg_secure_password_2024@localhost:5432/isg_reports|g' .env
EOF

# Package.json düzelt
sudo -u isg bash -c "cd /opt/isg-reports && ./scripts/fix-package.sh"

# Kurulumu tamamla
sudo -u isg bash << 'EOF'
cd /opt/isg-reports
npm install
npm run db:setup
npm run seed:admin  
npm run build
EOF
```

### Adım 5: Service Kurulumu
```bash
sudo cp /opt/isg-reports/systemd/isg-reports.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable isg-reports
sudo systemctl start isg-reports
```

### Adım 6: Firewall
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 5000
```

---

## 🔑 Giriş Bilgileri

Kurulum sonrası erişim:
- **URL**: `http://sunucu-ip:5000`
- **Kullanıcı**: `admin`
- **Şifre**: `admin123`

## 🛠️ Sorun Giderme

### Servis durumu kontrol
```bash
sudo systemctl status isg-reports
sudo journalctl -u isg-reports -f
```

### Manual başlatma testi
```bash
sudo su - isg
cd /opt/isg-reports
npm run start:production
```

### Package.json scriptleri eksikse
```bash
cd /opt/isg-reports
sudo -u isg ./scripts/fix-package.sh
```

## 📋 Post-Installation

### Nginx Reverse Proxy (Opsiyonel)
```bash
sudo apt install nginx -y

# Site config
sudo tee /etc/nginx/sites-available/isg-reports << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    
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
EOF

sudo ln -s /etc/nginx/sites-available/isg-reports /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
sudo ufw allow 'Nginx Full'
```

### SSL Sertifikası (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## ✅ Tamamlandı!

Sistem artık production'da çalışıyor! 🎉