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

# Setup Python virtual environment and install AI dependencies
COPY ai-service/requirements.txt ./ai-service/
RUN python3 -m venv /app/.venv && \
    /app/.venv/bin/pip install --no-cache-dir -r ai-service/requirements.txt

# Copy application files
COPY . .

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chmod 755 uploads

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "start.js"]
