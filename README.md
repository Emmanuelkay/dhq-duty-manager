# DHQ CSOC Duty Manager

A full-stack personnel and duty management web application featuring a stunning Aurora Glass theme. The system is built with a React frontend, Python Flask backend, SQLite database, and is fully containerized using Docker for effortless deployment.

## Features

- **Aurora Glass Theme:** Premium, futuristic dark theme with glassmorphism panels and ambient animations.
- **Dynamic Duty Scheduler:** View and assign daily duty officers on an interactive calendar.
- **Dynamic Holiday API:** Automatically pulls correct public holidays (including moving dates like Easter) dynamically.
- **Role-Based Access Control:** Differentiates between 'Admin' (can manage personnel and schedule) and 'User' (view only).
- **Dockerized:** Easy deployment using `docker-compose`.

## Getting Started (Docker Deployment)

This project requires [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) to be installed.

### 1. Clone the repository

```bash
git clone <your-github-repo-url>
cd pers-management
```

### 2. Run the application

Start the application in detached mode:

```bash
docker compose up -d --build
```

### 3. Access the application

- **Frontend:** http://localhost:8080
- **Admin Login:** The default admin user is `admin` with the password `admin123` (make sure to change this in a production environment!).
- **Backend API:** http://localhost:5001

### 4. Stopping the application

```bash
docker compose down
```

## Architecture

- **Frontend:** React + Vite, styled with custom CSS variables and Lucide icons.
- **Backend:** Python + Flask, handling REST API requests and authentication.
- **Database:** SQLite (stored persistently via Docker volumes in `backend/instance`).
- **Web Server:** Nginx (serves the static frontend build and proxies API requests).
