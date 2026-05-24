# PostgreSQL for Research Paper QA Bot

Run PostgreSQL in a separate Docker stack.

## Quick Start

### Windows:
```powershell
# Option 1: Use the helper script
.\start_postgres.bat

# Option 2: Manual start
docker-compose up -d
```

### Linux/macOS:
```bash
# Option 1: Use the helper script
chmod +x start_postgres.sh
./start_postgres.sh

# Option 2: Manual start
docker-compose up -d
```

## Verify PostgreSQL is Running

Check if the container is running:
```bash
docker-compose ps
```

You should see the `research_qa_postgres` container with status "Up".

## Connection Details

The app connects using these defaults (from `.env`):

- **Host:** `localhost`
- **Port:** `5432`
- **User:** `postgres`
- **Password:** `postgres`
- **Database:** `research_qa`

## Troubleshooting

### "Password authentication failed"

1. **Check if PostgreSQL is running:**
   ```bash
   docker-compose ps
   ```

2. **If not running, start it:**
   ```bash
   docker-compose up -d
   ```

3. **Check logs for errors:**
   ```bash
   docker-compose logs
   ```

4. **Verify credentials match:**
   - Check `fastapi_app/backend/.env` has:
     ```
     POSTGRES_HOST=localhost
     POSTGRES_PORT=5432
     POSTGRES_USER=postgres
     POSTGRES_PASSWORD=postgres
     POSTGRES_DB=research_qa
     ```

### Port Already in Use

If port 5432 is already in use by another PostgreSQL instance:

1. **Stop the other PostgreSQL instance**, or
2. **Change the port** in `docker-compose.yml` and update `.env`:
   ```yaml
   ports:
     - "5433:5432"  # Use 5433 instead
   ```
   Then in `.env`: `POSTGRES_PORT=5433`

## Environment Variables (Optional)

Create a `.env` file in this folder to override defaults:

- `POSTGRES_USER` (default: postgres)
- `POSTGRES_PASSWORD` (default: postgres)
- `POSTGRES_DB` (default: research_qa)
- `POSTGRES_PORT` (default: 5432)

**Important:** If you change these, also update `fastapi_app/backend/.env` with matching values.

## Stop PostgreSQL

```bash
docker-compose down
```

To remove data volume (⚠️ deletes all data):
```bash
docker-compose down -v
```
