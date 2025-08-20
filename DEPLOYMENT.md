# 🚀 Quick Deployment Guide

## Auto Deploy Script

En hızlı kurulum için deploy script'ini kullanın:

```bash
# Repository'yi clone edin
git clone https://github.com/yourusername/isg-reports.git
cd isg-reports

# .env dosyasını konfigüre edin
cp .env.example .env
nano .env  # Database ve diğer ayarları yapın

# Otomatik deployment başlatın
npm run deploy
```

## Manuel Package.json Scripts

Package.json'a aşağıdaki scriptleri ekleyin:

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

## Hızlı Başlangıç Komutları

```bash
# Dependencies
npm install

# Database kurulumu
npm run db:push --force

# Admin user oluştur
npm run seed:admin

# Build
npm run build

# Production başlat
npm run start:production
```

## Default Admin Credentials

- **Username**: admin
- **Password**: admin123
- **Location**: Yönetim

⚠️ İlk girişten sonra şifrenizi değiştirin!