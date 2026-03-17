# Personnel Management System - Installation Guide (Ubuntu Server)

This guide provides step-by-step instructions to deploy the Personnel Management System on an Ubuntu Server.

## Prerequisites
- Ubuntu Server (20.04 or newer)
- Node.js & npm
- Python 3.8+ & venv
- Nginx
- PM2 (Process Manager for Node.js/Python)

## 1. Environment Setup
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3-venv python3-pip nginx nodejs npm git
sudo npm install -g pm2
```

## 2. Project Deployment
Clone the repository and navigate to the project root:
```bash
git clone https://github.com/Emmanuelkay/dhq-duty-manager.git
cd dhq-duty-manager
```

## 3. Backend Setup (Flask + PM2)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt gunicorn
deactivate

# Start backend with PM2
pm2 start "./venv/bin/gunicorn" --name backend --interpreter none -- --workers 3 --bind 127.0.0.1:5000 "app:create_app()"
pm2 save
```

## 4. Frontend Setup (React + Nginx)
```bash
cd ../frontend
npm install
npm run build

# Deploy build assets to Nginx root
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
```

## 5. Nginx Configuration
Create or edit `/etc/nginx/sites-available/default`:
```nginx
server {
    listen 80 default_server;
    server_name _;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
Test and reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 6. Access the Application
The application is now accessible at your server's IP address on port 80.
