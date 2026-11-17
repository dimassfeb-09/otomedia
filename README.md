# Task Management Fullstack App

> Panduan lengkap langkah demi langkah (clone, install, migration, Docker, manual, env, testing): lihat [SETUP.md](SETUP.md).

## Stack
- Backend: Go (Gin), MySQL, Redis
- Frontend: React Native, TypeScript

## Project Structure
```
backend/   # Go clean architecture
frontend/  # React Native clean architecture
```

## Backend

### Run
```bash
cd backend
go mod tidy
go run ./cmd/server
```

Environment variables:
- `MYSQL_DSN` (default: root:password@tcp(localhost:3306)/taskmanager?parseTime=true&multiStatements=true)
- `REDIS_ADDR` (default: localhost:6379)
- `PORT` (default: 8080)

### Database Migration
Run the files in `backend/migrations/` against MySQL (`001_create_tasks.sql` creates the schema, `002_seed_tasks.sql` seeds sample rows), or use docker-compose which auto-loads the whole folder.

### API
- `GET /api/tasks` — list with filters: `status`, `keyword`, `assignee`, `page`, `limit`, `sort` (e.g. `sort=created_at:desc`). Pass `refresh=1` to bypass the Redis cache for this query.
- `GET /api/tasks/:id`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id` (soft delete)

Error responses are consistent:
```json
{ "error": { "code": "...", "message": "..." } }
```
Duplicate title returns HTTP 409.

### Cache
GET /api/tasks cached in Redis for 60s. Cache key includes query parameters. Invalidated on create/update/delete.

### Tests
```bash
cd backend && go test ./...
```

## Frontend (Expo / React Native)
```bash
cd frontend
npm install
npm test
npx tsc --noEmit
npm run android   # Expo Go (butuh emulator/device)
# atau build native:
npx expo prebuild --platform android
npx expo run:android
```

Features: search input, status filter, pagination, edit modal, loading state.

## Docker
```bash
docker compose up -d
```