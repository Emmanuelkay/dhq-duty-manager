FROM python:3.11-slim

WORKDIR /app

# Install dependencies first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Run db creation if needed
# We handle db creation inside app.py: db.create_all() happens under main block 
# but we are using gunicorn here so we need to initialize it.
# Wait, let's create a small script or just run it via gunicorn

EXPOSE 5000

ENV FLASK_APP=app.py

# Gunicorn runs create_app()
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:create_app()"]
