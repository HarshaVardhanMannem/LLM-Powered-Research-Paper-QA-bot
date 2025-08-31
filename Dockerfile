# Use Python 3.9 as the base image for the backend
FROM python:3.9-slim as backend

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the entire backend directory
COPY fastapi_app/backend/ ./backend/

# Set PYTHONPATH to include the backend directory
ENV PYTHONPATH=/app/backend

# Expose the port the app runs on
EXPOSE 8000

# Command to run the backend
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Frontend stage
FROM node:18-alpine as frontend

# Set working directory
WORKDIR /app

# Install additional dependencies for node-gyp
RUN apk add --no-cache python3 make g++

# Copy package files first for better layer caching
COPY fastapi_app/frontend/package*.json ./

# Install dependencies with clean npm cache
RUN npm cache clean --force && \
    npm install --legacy-peer-deps --production=false

# Copy frontend source code
COPY fastapi_app/frontend/ .

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose the port for frontend
EXPOSE 3000

# Command to run the frontend
CMD ["npm", "start"] 