# 🚀 Quick Deploy Guide

## Choose Your Deployment Method

### 🐳 Option 1: Docker (Easiest - Recommended)

```bash
# 1. Copy environment file
cp .env.docker.example .env

# 2. Edit .env with your values
nano .env

# 3. Build and start
docker-compose up -d

# 4. Check status
docker-compose ps

# 5. View logs
docker-compose logs -f
```

**Access:**
- Frontend: http://localhost
- Backend: http://localhost:5000

---

### 🖥️ Option 2: VPS/Server (Full Control)

```bash
# 1. Install dependencies
sudo apt update
sudo apt install -y nodejs npm python3 python3-venv mysql-server nginx

# 2. Setup database
sudo mysql -u root -p
CREATE DATABASE geo_social;
CREATE USER 'geo_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON geo_social.* TO 'geo_user'@'localhost';
EXIT;

mysql -u geo_user -p geo_social < server/schema.sql

# 3. Setup Python environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r server/ai-service/requirements.txt

# 4. Install Node dependencies
cd server && npm install --production
cd ../client && npm install && npm run build

# 5. Configure environment
cp .env.production.example server/.env
nano server/.env  # Edit with your values

# 6. Start with PM2
npm install -g pm2
cd server
pm2 start start.js --name geo-social
pm2 save
pm2 startup
```

---

### ☁️ Option 3: Render.com (Platform as a Service)

#### Backend:
1. Create new **Web Service**
2. Connect GitHub repo
3. Settings:
   - Root: `server`
   - Build: `npm install`
   - Start: `node start.js`
4. Add environment variables (see below)

#### Frontend:
1. Create new **Static Site**
2. Settings:
   - Root: `client`
   - Build: `npm install && npm run build`
   - Publish: `dist`
3. Add environment variables

#### Database:
Use Render PostgreSQL or external MySQL (PlanetScale, AWS RDS)

---

## 📋 Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=production
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=geo_social
CLIENT_ORIGIN=https://your-frontend.com
CLERK_SECRET_KEY=sk_live_xxx
ENABLE_AI_VALIDATION=true
DEV_BYPASS_AUTH=false
```

### Frontend (.env.production)
```env
VITE_API_BASE_URL=https://your-backend.com
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxx
VITE_DISABLE_CLERK=false
```

---

## ✅ Pre-Deployment Checklist

- [ ] Database created and schema imported
- [ ] Environment variables configured
- [ ] Clerk production keys obtained
- [ ] Python dependencies installed
- [ ] Frontend built successfully
- [ ] CORS origins configured
- [ ] SSL certificate installed (production)
- [ ] File upload directory writable
- [ ] Health check endpoint working

---

## 🧪 Test Deployment

```bash
# Test backend health
curl http://localhost:5000/health

# Test AI validation
source .venv/bin/activate
python server/ai-service/deepfake_detector.py server/uploads/test.png

# Test frontend build
cd client && npm run build

# Test database connection
mysql -u geo_user -p -h localhost geo_social
```

---

## 🔧 Common Issues

### Port Already in Use
```bash
# Find process
lsof -i :5000
# Kill it
kill -9 <PID>
```

### Python Not Found
```bash
# Activate virtual environment
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows
```

### Database Connection Failed
```bash
# Check MySQL status
sudo systemctl status mysql
# Restart MySQL
sudo systemctl restart mysql
```

### AI Validation Not Working
```bash
# Test manually
python server/ai-service/deepfake_detector.py server/uploads/test.png
# Check logs
pm2 logs geo-social
```

---

## 📊 Monitor Deployment

### Docker
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker stats
```

### PM2
```bash
pm2 status
pm2 logs geo-social
pm2 monit
```

### Nginx
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🎉 Deployment Complete!

Your app is now live! Test all features:
- [ ] User registration/login
- [ ] Create post with image
- [ ] AI validation working
- [ ] View posts on map
- [ ] Like and comment
- [ ] Admin dashboard

**Need help?** Check DEPLOYMENT_GUIDE.md for detailed instructions.
