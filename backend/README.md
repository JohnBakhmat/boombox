# boombox

Music streaming server built with Bun, Elysia, and Effect.

## Development

To install dependencies:

```bash
bun install
```

To run locally:

```bash
# Set required environment variables
export DB_URL=./data/boombox.db
export FOLDER_PATH=/path/to/your/music

bun run src/index.ts
```

## Docker Deployment

### Using Docker Run

Build the image:

```bash
docker build -t boombox-backend .
```

Run the container:

```bash
docker run -d \
  --name boombox \
  -p 3000:3000 \
  -v /path/to/your/music:/app/music:ro \
  -v boombox-data:/app/data \
  boombox-backend
```

### Using Docker Compose

1. Edit `docker-compose.yml` and update the music library path:

```yaml
volumes:
  - /path/to/your/music:/app/music:ro  # Update this path
```

2. Start the service:

```bash
docker compose up -d
```

### Required Volumes

- **Music Library** (`/app/music`): Mount your music folder here (read-only recommended)
- **Database** (`/app/data`): Persistent storage for the SQLite database

### Environment Variables

- `DB_URL`: Path to SQLite database file (default: `/app/data/boombox.db`)
- `FOLDER_PATH`: Path to music library folder (default: `/app/music`)

This project was created using `bun init` in bun v1.2.2. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
