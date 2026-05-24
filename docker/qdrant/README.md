# Qdrant for Research Paper QA Bot

Run Qdrant in a separate Docker stack.

## Usage

From this folder:

```bash
docker-compose up -d
```

Connect from the app using:

- **Host:** `localhost` (or the host where this is running)
- **Port:** `6333` (or set `QDRANT_PORT` in `.env`)

## Environment (optional)

Create a `.env` file here or set:

- `QDRANT_PORT` (default: 6333)

Ensure the main app `.env` has `QDRANT_HOST=localhost` when connecting to this stack.
