# Panduan & Roadmap Pengembangan Aplikasi (Development Roadmap)
# Proyek: GaMutual (Instagram Mutual & Unfollower Tracker)

- **Versi:** 1.0.0
- **Status:** Approved / Panduan Tahap Coding
- **Arsitektur:** Fullstack (Frontend: Next.js 14 + Tailwind CSS, Backend: Python FastAPI + instagrapi, DB: PostgreSQL + Redis)

---

## 1. Struktur Direktori Proyek Rekomendasi (Project Structure)

```
c:\GaMutual\
├── Docs\                               # Aset desain & dokumentasi visual
│   └── Design\                         # Mockup JPG & Logo GaMutual (SVG/PNG)
├── PRD.md                              # Product Requirements Document
├── SYSTEM_ARCHITECTURE.md              # Arsitektur sistem & alur kerja anti-ban
├── DATABASE_SCHEMA.md                  # Skema database relasional PostgreSQL
├── API_SPECIFICATION.md                # Kontrak endpoint REST API
├── UI_SPECIFICATION.md                 # Spesifikasi token desain & komponen UI
├── DEVELOPMENT_ROADMAP.md              # File ini (Panduan langkah coding)
├── README.md                           # Ringkasan utama proyek
│
├── frontend\                           # Next.js 14 App Router (React + Tailwind CSS)
│   ├── public\
│   │   ├── logo.svg                    # Dari Docs/Design/Logo GaMutual.svg
│   │   └── logo.png                    # Dari Docs/Design/Logo GaMutual.png
│   ├── src\
│   │   ├── app\
│   │   │   ├── layout.tsx              # Root layout & font provider
│   │   │   ├── page.tsx                # Auto redirect / logic root
│   │   │   ├── login\
│   │   │   │   └── page.tsx            # Login Page (Username/Password IG)
│   │   │   ├── home\
│   │   │   │   └── page.tsx            # Home Page (Profile, Sync, Metrics)
│   │   │   ├── unfollower\
│   │   │   │   └── page.tsx            # Unfollower Page (Table, Cooldown, Unfollow)
│   │   │   └── activity\
│   │   │       └── page.tsx            # Activity Page (Timeline Feed)
│   │   ├── components\
│   │   │   ├── layout\
│   │   │   │   ├── BottomNav.tsx       # Floating pill navigation bar
│   │   │   │   └── MobileShell.tsx     # Mobile-first responsive wrapper (max-w-md)
│   │   │   ├── home\
│   │   │   │   ├── ProfileCard.tsx
│   │   │   │   ├── SyncAntiBanCard.tsx
│   │   │   │   ├── WhitelistBanner.tsx
│   │   │   │   └── MetricGrid.tsx
│   │   │   ├── unfollower\
│   │   │   │   ├── AntiBanHeader.tsx
│   │   │   │   ├── SearchFilter.tsx
│   │   │   │   ├── UserRowItem.tsx
│   │   │   │   └── UnfollowConfirmModal.tsx
│   │   │   ├── activity\
│   │   │   │   ├── HighlightCards.tsx
│   │   │   │   └── TimelineFeed.tsx
│   │   │   └── modals\
│   │   │       ├── ChallengeModal.tsx  # Modal input 2FA / OTP
│   │   │       ├── SwitchAccountModal.tsx
│   │   │       └── ManageWhitelistModal.tsx
│   │   ├── lib\
│   │   │   ├── api.ts                  # Axios / fetch client instance
│   │   │   └── utils.ts
│   │   └── types\
│   │       └── index.ts
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
└── backend\                            # Python 3.11+ FastAPI Service
    ├── app\
    │   ├── api\
    │   │   ├── v1\
    │   │   │   ├── auth.py             # Login IG, challenge verify, account switcher
    │   │   │   ├── dashboard.py        # Metrik profil & kartu relasi
    │   │   │   ├── unfollower.py       # List non-mutual & aksi unfollow manual
    │   │   │   ├── activity.py         # Feed log kronologis (Hari Ini, Kemarin)
    │   │   │   └── whitelist.py        # Proteksi akun favorit
    │   │   └── router.py
    │   ├── core\
    │   │   ├── config.py               # Env variables (DB, Redis, Secret Key)
    │   │   ├── security.py             # AES-256 GCM encryption & JWT tokens
    │   │   └── anti_ban.py             # Rate limiter & 8-15s cooldown manager
    │   ├── db\
    │   │   ├── session.py              # PostgreSQL async engine (SQLAlchemy)
    │   │   └── models.py               # Database ORM models
    │   ├── services\
    │   │   ├── ig_client.py            # Wrapper instagrapi / mobile client
    │   │   ├── sync_service.py         # Snapshot diffing algorithm
    │   │   └── unfollow_service.py     # Safe unfollow execution with random jitter
    │   └── main.py                     # Entry point FastAPI app
    ├── requirements.txt
    └── Dockerfile
```

---

## 2. Kebutuhan Paket & Dependensi (Dependencies)

### 2.1. Frontend (`frontend/package.json`)
- `next`: `^14.2.0`
- `react`: `^18.2.0`
- `react-dom`: `^18.2.0`
- `lucide-react`: `^0.359.0` (Ikon: Home, UserMinus, ArrowLeftRight, Shield, Heart, Handshake, etc.)
- `tailwindcss`: `^3.4.0`
- `clsx`: `^2.1.0` & `tailwind-merge`: `^2.2.0` (Utility styling dinamis)
- `axios` / `ky`: Komunikasi HTTP REST API

### 2.2. Backend (`backend/requirements.txt`)
- `fastapi`: `^0.110.0`
- `uvicorn[standard]`: `^0.28.0`
- `pydantic`: `^2.6.0` & `pydantic-settings`: `^2.2.0`
- `sqlalchemy[asyncio]`: `^2.0.28`
- `asyncpg`: `^0.29.0` (Driver PostgreSQL async)
- `redis`: `^5.0.3` (Queue & cooldown bucket)
- `cryptography`: `^42.0.5` (AES-GCM enkripsi sesi)
- `python-jose[cryptography]`: `^3.3.0` (JWT token auth)
- `instagrapi`: `^2.1.2` (Instagram Private API mobile emulator)
- `celery`: `^5.3.6` (Opsional untuk background worker task)

---

## 3. Rencana Eksekusi Bertahap (Execution Phases)

### Tahap 1: Setup Lingkungan & Scaffold Proyek
- [ ] Buat folder `frontend/` dan inisialisasi Next.js 14 dengan Tailwind CSS.
- [ ] Buat folder `backend/` dan inisialisasi virtual environment Python beserta `requirements.txt`.
- [ ] Salin aset logo dari `Docs/Design/Logo GaMutual.svg` ke `frontend/public/logo.svg`.
- [ ] Konfigurasi Tailwind CSS dengan token warna desain GaMutual (`#251245`, `#FEA619`, `#10B981`, dll).

### Tahap 2: Backend Database & Core Security
- [ ] Buat model ORM SQLAlchemy di `backend/app/db/models.py` sesuai [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md).
- [ ] Implementasikan utilitas enkripsi AES-256 di `backend/app/core/security.py`.
- [ ] Siapkan koneksi PostgreSQL dan Redis di `backend/app/core/config.py`.

### Tahap 3: Engine Instagram & Integrasi Private API
- [ ] Bangun modul `backend/app/services/ig_client.py` untuk mengelola login, serialisasi cookie, dan penanganan challenge/2FA.
- [ ] Implementasikan modul pembanding snapshot di `backend/app/services/sync_service.py` untuk menghitung relasi (Unfollowers, Followers Baru, Non-Mutual, Mutuals, Fans).
- [ ] Implementasikan guard anti-ban di `backend/app/core/anti_ban.py` (penghitung kuota 40/hari dan interval 8–15 detik).

### Tahap 4: Endpoint API RESTful
- [ ] Implementasikan rute otentikasi: `POST /api/v1/auth/instagram/login` & `POST /api/v1/auth/instagram/challenge/verify`.
- [ ] Implementasikan rute dashboard: `GET /api/v1/instagram/accounts/{id}/home-dashboard`.
- [ ] Implementasikan rute unfollower: `GET /api/v1/instagram/accounts/{id}/unfollowers` & `POST /api/v1/instagram/accounts/{id}/actions/unfollow`.
- [ ] Implementasikan rute aktivitas: `GET /api/v1/instagram/accounts/{id}/activities` (terkelompok tanggal WIB).
- [ ] Implementasikan rute whitelist: `POST /api/v1/instagram/accounts/{id}/whitelist/toggle`.

### Tahap 5: Pengembangan Antarmuka Frontend (Next.js)
- [ ] Buat komponen shell `MobileShell.tsx` dan `BottomNav.tsx` dengan transisi aktif.
- [ ] Bangun halaman **Login** (`app/login/page.tsx`) persis sesuai `Login Page.jpg`.
- [ ] Bangun halaman **Home** (`app/home/page.tsx`) persis sesuai `Home Page.jpg`.
- [ ] Bangun halaman **Unfollower** (`app/unfollower/page.tsx`) persis sesuai `Unfollower page.jpg` lengkap dengan state Normal, Cooldown (*"↻ Jeda Aman 10s"*), dan Sukses (*"✓ Selesai"*).
- [ ] Bangun halaman **Activity** (`app/activity/page.tsx`) persis sesuai `Activity Page.jpg`.
- [ ] Bangun modal 2FA, modal ganti akun, modal kelola whitelist, dan dialog konfirmasi unfollow.

### Tahap 6: Integrasi Penuh & Pengujian End-to-End
- [ ] Hubungkan frontend dengan backend API.
- [ ] Uji skenario login normal dan skenario 2FA checkpoint.
- [ ] Uji tombol "Sinkronisasi Sekarang" dan verifikasi pembaruan data metrik.
- [ ] Uji tindakan "Unfollow" manual: pastikan dialog konfirmasi muncul, jeda aman aktif, kuota berkurang (24/40), dan riwayat tercatat di Activity Page.

