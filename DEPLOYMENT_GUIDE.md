# 🚀 Deployment Guide - Geo Social Travel Platform

## Pre-Deployment Checklist

### ✅ Required Components
- [x] Node.js application (Frontend + Backend)
- [x] MySQL database
- [x] Python 3.14+ with virtual environment
- [x] AI validation system (PyTorch, Torchvision)
- [x] File upload system (multer)
- [x] Authentication (Clerk)

---

## 🎯 Deployment Options

### Option 1: Traditional VPS (Recommended for AI)
**Best for**: Full control, AI validation support
**Providers**: DigitalOcean, Linode, AWS EC2, Google Cloud VM

### Option 2: Platform as a Service
**Best for**: Easy deployment, auto-scaling
**Providers**: Render, Railway, Heroku

### Option 3: Containerized (Docker)
**Best for**: Consistency, scalability
**Platform**: Docker + Kubernetes, AWS ECS

---

## 📦 Option 1: VPS Deployment (Ubuntu/Linux)

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python 3.11+
sudo apt install -y python3 python3-pip python3-venv

# Install MySQL
sudo apt install -y mysql-server

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

### Step 2: Clone and Setup Project

```bash
# Clone your repository
git clone https://github.com/your-username/geo-social-travel.git
cd geo-social-travel

# Setup Python virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r server/ai-service/requirements.txt

# Install server dependencies
cd server
npm install --production

# Install client dependencies and build
cd ../client
npm install
npm run build
```

### Step 3: Database Setup

```bash
# Login to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE geo_social;
CREATE USER 'geo_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON geo_social.* TO 'geo_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import schema
mysql -u geo_user -p geo_social < server/schema.sql
```

### Step 4: Environment Configuration

```bash
# Server environment
cd server
cp ../.env.production.example .env

# Edit with your values
nano .env
```

Update:
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `CLIENT_ORIGIN` (your frontend domain)
- `CLERK_SECRET_KEY` (production key)
- `DEV_BYPASS_AUTH=false`

### Step 5: Start with PM2

```bash
# Start backend
cd server
pm2 start start.js --name geo-social-api

# Save PM2 configuration
pm2 save
pm2 startup
```

### Step 6: Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/geo-social
```

Add:
```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Increase upload size for images
    client_max_body_size 10M;
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /path/to/geo-social-travel/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/geo-social /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: SSL Certificate (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

---

## 📦 Option 2: Render.com Deployment

### Backend Deployment

1. **Create New Web Service**
   - Connect your GitHub repository
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `node start.js`

2. **Environment Variables**
   ```
   PORT=5000
   NODE_ENV=production
   DB_HOST=your-render-db-host
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   DB_NAME=geo_social
   CLIENT_ORIGIN=https://your-frontend.onrender.com
   CLERK_SECRET_KEY=sk_live_xxx
   ENABLE_AI_VALIDATION=true
   DEV_BYPASS_AUTH=false
   ```

3. **Add Python Support**
   Create `server/render-build.sh`:
   ```bash
   #!/bin/bash
   python3 -m venv /opt/render/project/.venv
   source /opt/render/project/.venv/bin/activate
   pip install -r ai-service/requirements.txt
   npm install
   ```

   Update Build Command: `bash render-build.sh`

### Frontend Deployment

1. **Create Static Site**
   - Root Directory: `client`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

2. **Environment Variables**
   ```
   VITE_API_BASE_URL=https://your-backend.onrender.com
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxx
   VITE_DISABLE_CLERK=false
   ```

### Database (Render PostgreSQL or External MySQL)

Option A: Use Render PostgreSQL (requires code changes)
Option B: Use external MySQL (PlanetScale, AWS RDS)

---

## 🐳 Option 3: Docker Deployment

### Create Dockerfile for Backend

```dockerfile
# server/Dockerfile
FROM node:20-slim

# Install Python for AI service
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install --production

# Setup Python virtual environment
COPY ai-service/requirements.txt ./ai-service/
RUN python3 -m venv /app/.venv && \
    /app/.venv/bin/pip install -r ai-service/requirements.txt

# Copy application files
COPY . .

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "start.js"]
```

### Create Dockerfile for Frontend

```dockerfile
# client/Dockerfile
FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: geo_social
      MYSQL_USER: geo_user
      MYSQL_PASSWORD: secure_password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./server/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "3306:3306"

  backend:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - DB_HOST=mysql
      - DB_USER=geo_user
      - DB_PASSWORD=secure_password
      - DB_NAME=geo_social
      - CLIENT_ORIGIN=http://localhost:3000
      - ENABLE_AI_VALIDATION=true
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
    depends_on:
      - mysql
    volumes:
      - ./server/uploads:/app/uploads

  frontend:
    build: ./client
    ports:
      - "80:80"
    environment:
      - VITE_API_BASE_URL=http://localhost:5000
      - VITE_CLERK_PUBLISHABLE_KEY=${VITE_CLERK_PUBLISHABLE_KEY}
    depends_on:
      - backend

volumes:
  mysql_data:
```

Deploy:
```bash
docker-compose up -d
```

---

## 🔒 Security Checklist

### Before Going Live:

- [ ] Change all default passwords
- [ ] Set `DEV_BYPASS_AUTH=false`
- [ ] Use production Clerk keys
- [ ] Enable HTTPS/SSL
- [ ] Set secure CORS origins
- [ ] Configure firewall (UFW/iptables)
- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Add monitoring (PM2, New Relic, Datadog)
- [ ] Set up error logging (Sentry)
- [ ] Review file upload limits
- [ ] Secure environment variables
- [ ] Enable database SSL connections

---

## 📊 Post-Deployment

### Monitoring

```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs geo-social-api

# Check status
pm2 status
```

### Database Backups

```bash
# Create backup script
nano /home/user/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u geo_user -p'secure_password' geo_social > /backups/geo_social_$DATE.sql
find /backups -name "geo_social_*.sql" -mtime +7 -delete
```

```bash
chmod +x /home/user/backup-db.sh
crontab -e
# Add: 0 2 * * * /home/user/backup-db.sh
```

### Performance Optimization

1. **Enable Gzip in Nginx**
2. **Set up CDN for static assets**
3. **Configure Redis for caching**
4. **Optimize database indexes**
5. **Enable image compression**

---

## 🆘 Troubleshooting

### AI Validation Not Working
```bash
# Check Python environment
source /path/to/.venv/bin/activate
python --version
pip list

# Test AI script
python server/ai-service/deepfake_detector.py server/uploads/test.png
```

### Database Connection Issues
```bash
# Check MySQL status
sudo systemctl status mysql

# Test connection
mysql -u geo_user -p -h localhost geo_social
```

### Upload Issues
```bash
# Check permissions
ls -la server/uploads
sudo chown -R www-data:www-data server/uploads
chmod 755 server/uploads
```

---

## 📝 Environment Variables Reference

### Server (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment | production |
| DB_HOST | Database host | localhost |
| DB_USER | Database user | geo_user |
| DB_PASSWORD | Database password | secure_pass |
| DB_NAME | Database name | geo_social |
| CLIENT_ORIGIN | Frontend URL | https://app.com |
| CLERK_SECRET_KEY | Clerk secret | sk_live_xxx |
| ENABLE_AI_VALIDATION | Enable AI | true |
| DEV_BYPASS_AUTH | Bypass auth | false |

### Client (.env.production)
| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_BASE_URL | Backend URL | https://api.app.com |
| VITE_CLERK_PUBLISHABLE_KEY | Clerk public key | pk_live_xxx |
| VITE_DISABLE_CLERK | Disable Clerk | false |

---

## ✅ Deployment Complete!

Your application should now be live at:
- Frontend: https://yourdomain.com
- Backend API: https://api.yourdomain.com

**Next Steps:**
1. Test all features in production
2. Monitor logs for errors
3. Set up analytics
4. Configure backups
5. Add monitoring alerts

---

**Need Help?** Check the troubleshooting section or review server logs.
