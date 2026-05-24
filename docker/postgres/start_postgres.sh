#!/bin/bash
echo "Starting PostgreSQL container..."
cd "$(dirname "$0")"
docker-compose up -d
echo ""
echo "PostgreSQL should now be running on localhost:5432"
echo "Default credentials: postgres/postgres"
echo "Database: research_qa"
echo ""
echo "To check status: docker-compose ps"
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"
