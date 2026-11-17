# Task Management Fullstack App

Aplikasi manajemen tugas (task manager). Backend API memakai Go + Gin dengan MySQL dan Redis, frontend memakai React Native + Expo + TypeScript.

Fitur: daftar tugas dengan search, filter status, pagination (infinite scroll), ubah tugas (edit modal), hapus dengan konfirmasi, pull-to-refresh, dan loading state.

## Teknologi

- Backend: Go (Gin), MySQL, Redis
- Frontend: React Native, Expo, TypeScript

> Catatan: frontend project ini memakai **Expo / React Native**, bukan Flutter.

## Struktur Project

```
backend/   # API Go (clean architecture: domain, usecase, repository, handler, dto)
frontend/  # Aplikasi React Native (Expo)
```

## Yang perlu disiapkan dulu

Wajib:

- Git
- Go versi 1.26 atau lebih baru — https://go.dev/dl
- Node.js versi 20 atau lebih baru (sudah termasuk npm) — https://nodejs.org

Opsional (pilih salah satu):

- Docker Desktop — https://www.docker.com/products/docker-desktop (cara paling gampang, MySQL + Redis langsung jadi)
- Atau install MySQL 8 dan Redis manual kalau tidak mau pakai Docker

Untuk melihat aplikasinya:

- Android Emulator, atau aplikasi Expo Go di HP

## 1. Clone repo

```bash
git clone <URL_REPO>
cd Otomedia
```

Ganti `<URL_REPO>` dengan URL repo Anda.

## 2. Jalankan MySQL + Redis (cara Docker, paling cepat)

Dari folder paling atas repo (yang ada `docker-compose.yml`):

```bash
docker compose up -d
```

Yang terjadi otomatis:

- MySQL jalan di port `3306`, database `taskmanager` langsung dibuat
- Migration di folder `backend/migrations/` ikut dijalankan otomatis (tabel + data contoh)
- Redis jalan di port `6379`

Cek sudah jalan:

```bash
docker ps
```

Lihat log MySQL:

```bash
docker compose logs -f mysql
```

Kalau mau mengulang dari bersih (hapus datanya juga):

```bash
docker compose down -v
docker compose up -d
```

> Migration hanya otomatis jalan saat volume masih kosong (pertama kali). Kalau volume sudah ada, jalankan migration manual (lihat bagian 4).

## 3. Jalankan backend

Buka terminal baru:

```bash
cd backend
go mod download
go run ./cmd/server
```

Kalau sukses, server jalan di: http://localhost:8080

Tes cepat:

```bash
curl http://localhost:8080/api/tasks
```

## 4. Cara manual (tanpa Docker)

Kalau MySQL dan Redis sudah diinstall sendiri:

1. Buat databasenya:

   ```bash
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS taskmanager;"
   ```

2. Jalankan migration-nya.

   macOS / Linux / Git Bash:

   ```bash
   mysql -u root -p taskmanager < backend/migrations/001_create_tasks.sql
   mysql -u root -p taskmanager < backend/migrations/002_seed_tasks.sql
   ```

   Windows PowerShell (tanda `<` tidak jalan di PowerShell):

   ```powershell
   Get-Content backend/migrations/001_create_tasks.sql | mysql -u root -p taskmanager
   Get-Content backend/migrations/002_seed_tasks.sql | mysql -u root -p taskmanager
   ```

3. Pastikan Redis jalan (perintahnya tergantung cara install Anda, misalnya `redis-server`).

4. Set environment variable sesuai kredensial Anda (lihat bagian 5), lalu:

   ```bash
   cd backend
   go run ./cmd/server
   ```

## 5. Environment variable backend

Semua punya nilai default, jadi tidak wajib diisi kalau setup Anda standar.

| Variable | Default | Keterangan |
|---|---|---|
| `MYSQL_DSN` | `root:password@tcp(localhost:3306)/taskmanager?parseTime=true&multiStatements=true` | Koneksi ke MySQL |
| `REDIS_ADDR` | `localhost:6379` | Alamat Redis |
| `PORT` | `8080` | Port server |

Cara set kalau perlu diubah.

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

## 6. Jalankan frontend

Buka terminal baru:

```bash
cd frontend
npm install
npm start
```

Setelah muncul menu Expo, tekan `a` untuk membuka di Android Emulator, atau scan QR code pakai app Expo Go di HP.

Hubungkan frontend ke backend:

- Android Emulator: `localhost` di dalam emulator itu emulator sendiri, bukan komputer Anda. Jalankan ini dulu supaya nyambung ke backend:

  ```bash
  adb reverse tcp:8080 tcp:8080
  ```

- HP fisik: ganti `HOST` di `frontend/src/services/api.ts` dari `localhost` menjadi IP LAN komputer Anda (misal `192.168.1.10`), dan pastikan HP dan komputer satu WiFi.

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

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/tasks` | Ambil daftar tugas |
| GET | `/api/tasks/:id` | Ambil satu tugas |
| POST | `/api/tasks` | Tambah tugas |
| PUT | `/api/tasks/:id` | Ubah tugas |
| DELETE | `/api/tasks/:id` | Hapus tugas (soft delete) |

Filter untuk `GET /api/tasks`: `status`, `keyword`, `assignee`, `page`, `limit`, `sort` (contoh `sort=created_at:desc`). Tambahkan `refresh=1` untuk melewati cache Redis pada query tersebut.

Response error selalu konsisten:

```json
{ "error": { "code": "...", "message": "..." } }
```

Judul duplikat mengembalikan HTTP 409.

## 9. Cache (Redis)

`GET /api/tasks` di-cache di Redis selama 60 detik. Key cache menyertakan query parameter. Cache dihapus (invalidated) setiap kali ada create, update, atau delete.

## 10. Database Migration

File migration ada di `backend/migrations/`:

- `001_create_tasks.sql` — membuat tabel
- `002_seed_tasks.sql` — mengisi data contoh

Jalankan manual (lihat bagian 4), atau biarkan docker-compose menjalankannya otomatis.

## Ada masalah?

- Backend tidak nyambung ke MySQL → cek `docker ps`, pastikan container MySQL jalan dan kredensial di `MYSQL_DSN` benar.
- Aplikasi menampilkan error koneksi → pastikan backend jalan di port `8080` dan `adb reverse tcp:8080 tcp:8080` sudah dijalankan (untuk emulator).
- Perubahan data tidak langsung muncul → data di-cache Redis selama 60 detik; tunggu sebentar atau tarik layar ke bawah (pull-to-refresh).
