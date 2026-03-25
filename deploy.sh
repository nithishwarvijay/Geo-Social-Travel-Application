#!/bin/bash

# Geo Social Travel Platform - Deployment Script
# This script automates the deployment process

set -e  # Exit on error

echo "🚀 Starting Geo Social Travel Platform Deployment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_warning "Please do not run as root"
    exit 1
fi

# Check prerequisites
print_info "Checking prerequisites..."

command -v node >/dev/null 2>&1 || { print_error "Node.js is required but not installed. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { print_error "npm is required but not installed. Aborting."; exit 1; }
command -v python3 >/dev/null 2>&1 || { print_error "Python 3 is required but not installed. Aborting."; exit 1; }
command -v mysql >/dev/null 2>&1 || { print_error "MySQL is required but not installed. Aborting."; exit 1; }

print_success "All prerequisites found"

# Check if .env files exist
if [ ! -f "server/.env" ]; then
    print_error "server/.env not found. Please create it from .env.production.example"
    exit 1
fi

if [ ! -f "client/.env.production" ]; then
    print_warning "client/.env.production not found. Using .env if available"
fi

# Setup Python virtual environment
print_info "Setting up Python virtual environment..."
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    print_success "Virtual environment created"
else
    print_info "Virtual environment already exists"
fi

source .venv/bin/activate
pip install -r server/ai-service/requirements.txt
print_success "Python dependencies installed"

# Install backend dependencies
print_info "Installing backend dependencies..."
cd server
npm install --production
print_success "Backend dependencies installed"

# Build frontend
print_info "Building frontend..."
cd ../client
npm install
npm run build
print_success "Frontend built successfully"

# Create uploads directory
print_info "Creating uploads directory..."
cd ../server
mkdir -p uploads
chmod 755 uploads
print_success "Uploads directory ready"

# Test database connection
print_info "Testing database connection..."
source .env
mysql -u $DB_USER -p$DB_PASSWORD -h $DB_HOST $DB_NAME -e "SELECT 1;" >/dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "Database connection successful"
else
    print_error "Database connection failed. Please check your credentials."
    exit 1
fi

# Test AI service
print_info "Testing AI validation service..."
cd ..
source .venv/bin/activate
if [ -f "server/uploads/test.png" ]; then
    python server/ai-service/deepfake_detector.py server/uploads/test.png >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_success "AI validation service working"
    else
        print_warning "AI validation test failed, but continuing..."
    fi
else
    print_warning "No test image found, skipping AI validation test"
fi

# Ask if user wants to start the application
echo ""
read -p "Do you want to start the application now? (y/n) " -n 1 -r
echo
if [[ $RPLY =~ ^[Yy]$ ]]; then
    print_info "Starting application with PM2..."
    
    # Install PM2 if not present
    if ! command -v pm2 >/dev/null 2>&1; then
        print_info "Installing PM2..."
        sudo npm install -g pm2
    fi
    
    cd server
    pm2 start start.js --name geo-social-api
    pm2 save
    
    print_success "Application started!"
    print_info "Run 'pm2 logs geo-social-api' to view logs"
    print_info "Run 'pm2 status' to check status"
else
    print_info "Skipping application start"
    print_info "To start manually, run: cd server && pm2 start start.js --name geo-social-api"
fi

echo ""
echo "=================================================="
print_success "Deployment completed successfully!"
echo "=================================================="
echo ""
print_info "Next steps:"
echo "  1. Configure Nginx reverse proxy (see DEPLOYMENT_GUIDE.md)"
echo "  2. Set up SSL certificate with Let's Encrypt"
echo "  3. Configure firewall rules"
echo "  4. Set up monitoring and alerts"
echo "  5. Test all features in production"
echo ""
print_info "Frontend build location: client/dist"
print_info "Backend running on: http://localhost:5000"
echo ""
