# Task Management Fullstack App

A task management app. The backend API is built with Go + Gin backed by MySQL and Redis, and the frontend is React Native + Expo + TypeScript.

Features: task list with search, status filter, pagination (infinite scroll), edit modal, delete with confirmation, pull-to-refresh, and loading states.

## Stack

- Backend: Go (Gin), MySQL, Redis
- Frontend: React Native, Expo, TypeScript

## Project Structure

```
backend/   # Go API (clean architecture: domain, usecase, repository, handler, dto)
frontend/  # React Native app (Expo)
```

## Prerequisites

Required:

- Git
- Go 1.26 or newer — https://go.dev/dl
- Node.js 20 or newer (npm included) — https://nodejs.org

Optional (pick one):

- Docker Desktop — https://www.docker.com/products/docker-desktop (easiest way to get MySQL + Redis running)
- Or install MySQL 8 and Redis manually if you prefer not to use Docker

To view the app:

- An Android Emulator, or the Expo Go app on your phone

## 1. Clone the repo

```bash
git clone https://github.com/dimassfeb-09/otomedia.git
cd otomedia
```

## 2. Run MySQL + Redis (Docker, fastest way)

From the repo root (where `docker-compose.yml` lives):

```bash
docker compose up -d
```

What happens automatically:

- MySQL runs on port `3306`, the `taskmanager` database is created
- The migrations in `backend/migrations/` are applied automatically (schema + sample data)
- Redis runs on port `6379`

Check that they are running:

```bash
docker ps
```

Follow the MySQL logs:

```bash
docker compose logs -f mysql
```

To start over from scratch (this also deletes the data):

```bash
docker compose down -v
docker compose up -d
```

The migrations only run automatically the first time the volume is empty. If the volume already exists, run the migrations manually (see section 4).

## 3. Run the backend

Open a new terminal:

```bash
cd backend
go mod download
go run ./cmd/server
```

If it starts successfully, the server listens on http://localhost:8080

Quick check:

```bash
curl http://localhost:8080/api/tasks
```

## 4. Manual setup (without Docker)

If MySQL and Redis are already installed locally:

1. Create the database:

   ```bash
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS taskmanager;"
   ```

2. Run the migrations.

   macOS / Linux / Git Bash:

   ```bash
   mysql -u root -p taskmanager < backend/migrations/001_create_tasks.sql
   mysql -u root -p taskmanager < backend/migrations/002_seed_tasks.sql
   ```

   Windows PowerShell (the `<` operator does not work in PowerShell):

   ```powershell
   Get-Content backend/migrations/001_create_tasks.sql | mysql -u root -p taskmanager
   Get-Content backend/migrations/002_seed_tasks.sql | mysql -u root -p taskmanager
   ```

3. Make sure Redis is running (the command depends on how you installed it, for example `redis-server`).

4. Set the environment variables to match your credentials (see section 5), then:

   ```bash
   cd backend
   go run ./cmd/server
   ```

## 5. Backend environment variables

All of them have defaults, so you only need to set them if your setup differs.

| Variable | Default | Description |
|---|---|---|
| `MYSQL_DSN` | `root:password@tcp(localhost:3306)/taskmanager?parseTime=true&multiStatements=true` | MySQL connection |
| `REDIS_ADDR` | `localhost:6379` | Redis address |
| `PORT` | `8080` | Server port |

How to set them if needed.

Windows PowerShell:

```powershell
$env:MYSQL_DSN = "root:password@tcp(localhost:3306)/taskmanager?parseTime=true&multiStatements=true"
$env:REDIS_ADDR = "localhost:6379"
$env:PORT = "8080"
go run ./cmd/server
```

macOS / Linux / Git Bash:

```bash
export MYSQL_DSN="root:password@tcp(localhost:3306)/taskmanager?parseTime=true&multiStatements=true"
export REDIS_ADDR="localhost:6379"
export PORT="8080"
go run ./cmd/server
```

## 6. Run the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

Once the Expo menu appears, press `a` to open it on the Android Emulator, or scan the QR code with the Expo Go app on your phone.

Connect the frontend to the backend:

- Android Emulator: `localhost` inside the emulator refers to the emulator itself, not your computer. Run this first so it can reach the backend:

  ```bash
  adb reverse tcp:8080 tcp:8080
  ```

- Physical phone: change `HOST` in `frontend/src/services/api.ts` from `localhost` to your computer's LAN IP (for example `192.168.1.10`), and make sure the phone and computer are on the same Wi-Fi.

## 7. Testing

Backend:

```bash
cd backend
go test ./...
```

Frontend:

```bash
cd frontend
npx tsc --noEmit
npm test
```

## 8. API

Interactive API docs (Swagger UI) are available at http://localhost:8080/swagger while the backend is running. The OpenAPI spec lives in `backend/docs/openapi.yaml`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | List tasks |
| GET | `/api/tasks/:id` | Get one task |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task (soft delete) |

Filters for `GET /api/tasks`: `status`, `keyword`, `assignee`, `page`, `limit`, `sort` (for example `sort=created_at:desc`). Add `refresh=1` to bypass the Redis cache for that query.

Error responses are always consistent:

```json
{ "error": { "code": "...", "message": "..." } }
```

A duplicate title returns HTTP 409.

## 9. Cache (Redis)

`GET /api/tasks` is cached in Redis for 60 seconds. The cache key includes the query parameters. The cache is invalidated on every create, update, or delete.

## 10. Database Migration

The migration files live in `backend/migrations/`:

- `001_create_tasks.sql` — creates the table
- `002_seed_tasks.sql` — inserts sample data

Run them manually (see section 4), or let docker-compose apply them automatically.

## Troubleshooting

- Backend cannot reach MySQL → check `docker ps`, make sure the MySQL container is running, and confirm the credentials in `MYSQL_DSN` are correct.
- The app shows a connection error → make sure the backend runs on port `8080` and that `adb reverse tcp:8080 tcp:8080` has been run (for the emulator).
- Data changes do not show up immediately → data is cached in Redis for 60 seconds; wait a moment or pull down to refresh.
