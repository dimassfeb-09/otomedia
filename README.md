# Task Management Fullstack App

Task management app with Go (Gin) + MySQL + Redis backend and React Native (Expo) + TypeScript frontend.

## Stack

- Backend: Go 1.26+, Gin, MySQL, Redis
- Frontend: React Native (Expo), TypeScript
- Infra: Docker Compose (MySQL + Redis)

## Quick Start

Choose one database setup.

### Option A: Docker (recommended)

```bash
docker compose up -d
cd backend
go mod download
go run ./cmd/server
```

- MySQL: `localhost:3306`, database `taskmanager`
- Redis: `localhost:6379`
- Migrations apply automatically from `backend/migrations`

### Option B: Your own MySQL/Redis

Set environment variables, then run backend:

```bash
export MYSQL_DSN="user:pass@tcp(host:3306)/dbname?parseTime=true&multiStatements=true"
export REDIS_ADDR="host:6379"
export PORT="8080"

cd backend
go mod download
go run ./cmd/server
```

Apply migrations manually:

```bash
mysql -u user -p dbname < backend/migrations/001_create_tasks.sql
mysql -u user -p dbname < backend/migrations/002_seed_tasks.sql
```

Notes:
- `MYSQL_DSN` default: `root:password@tcp(localhost:3306)/taskmanager?parseTime=true&multiStatements=true`
- `REDIS_ADDR` default: `localhost:6379`
- `PORT` default: `8080`
- Redis is used for list cache; backend still starts without it, but caching/invalidation will not work

### Run frontend

```bash
cd frontend
npm install
npm start
```

Press `a` for Android emulator, `w` for web, or scan the QR code with Expo Go.

Android emulator access:

```bash
adb reverse tcp:8080 tcp:8080
```

Physical device: set `HOST` in `frontend/src/services/api.ts` to your computer's LAN IP, then back to `localhost` for emulator/web.

## Features

- Task list with search, status filter, pagination, pull-to-refresh
- Create task via FAB ("Tambah")
- Task detail page (tap card)
- Edit and delete from detail page
- Redis-backed list cache with 60s TTL and invalidation on create/update/delete

## Testing

Backend:

```bash
cd backend && go test ./...
```

Frontend:

```bash
cd frontend && npx tsc --noEmit && npm test
```



## API Documentation

- Scalar UI: [http://localhost:8080/docs](http://localhost:8080/docs)
- OpenAPI spec: `backend/docs/openapi.yaml`

## Notes

- Backend Redis cache key prefix: `tasks:list:`
- Use `refresh=1` query param to bypass cache
- Frontend API host defaults to `localhost`
