# 🎵 dcover

Platform web untuk cover artist berbagi karya musik mereka.

## ✨ Tech Stack

- **Frontend**: React.js + Tailwind CSS + Vite
- **Backend**: Node.js + Express.js
- **Database**: MySQL
- **Auth**: Google OAuth + JWT

## 🚀 Setup

### 1. Database MySQL
```bash
mysql -u root < server/schema.sql
```

### 2. Setup Server
```bash
cd server
cp .env.example .env
npm install
npm run dev
```

### 3. Setup Frontend
```bash
cp .env.example .env
npm install
npm run dev
```

## 🔧 Environment Variables

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### Server (`server/.env`)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=dcover
JWT_SECRET=your-secret-key
PORT=3001
```

## 📱 Fitur

- ✅ Google SSO Login
- ✅ Upload/Record audio cover
- ✅ Buat album & kelola lagu
- ✅ Like/favorite lagu
- ✅ Sticky music player
- ✅ Admin panel
- ✅ Mobile-friendly dark theme
