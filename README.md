# GaMutual - Instagram Mutual & Unfollower Tracker

<div align="center">
  <img src="Docs/Design/Logo GaMutual.svg" width="110" height="110" alt="GaMutual Logo" />
  <br>
  <h3>Solusi Cerdas, Aman, dan Transparan untuk Mengelola Relasi & Mutual Instagram</h3>
  <p>Dilengkapi <b>Smart Anti-Ban Engine</b>, enkripsi sesi tingkat militer <b>AES-256-GCM</b>, dan antarmuka <b>Mobile-First App Shell</b> modern.</p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 14" />
    <img src="https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.11+" />
    <img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  </p>
</div>

---

## 📖 Daftar Isi

1. [Tentang Proyek](#-tentang-proyek)
2. [Fitur Unggulan](#-fitur-unggulan)
3. [Tampilan Desain & Antarmuka](#-tampilan-desain--antarmuka)
4. [Arsitektur Sistem & Keamanan](#-arsitektur-sistem--keamanan)
5. [Struktur Direktori Repositori](#-struktur-direktori-repositori)
6. [Dokumentasi Lengkap](#-dokumentasi-lengkap)
7. [Panduan Instalasi & Menjalankan (Quickstart)](#-panduan-instalasi--menjalankan-quickstart)
8. [Akun Uji Coba & Demo (Demo Accounts)](#-akun-uji-coba--demo-demo-accounts)
9. [Menjalankan Pengujian Otomatis (Testing)](#-menjalankan-pengujian-otomatis-testing)
10. [Deployment dengan Docker Compose](#-deployment-dengan-docker-compose)
11. [Kebijakan Keamanan & Fair Use](#-kebijakan-keamanan--fair-use)
12. [Lisensi & Kontribusi](#-lisensi--kontribusi)

---

## 📱 Tentang Proyek

**GaMutual** adalah aplikasi web analitik relasi Instagram berbasis *Mobile-First App Shell* yang elegan, responsif, dan mengutamakan keselamatan akun pengguna. Aplikasi ini dirancang untuk mengatasi masalah umum pengguna Instagram yang ingin melacak siapa saja yang tidak mengikuti balik (*unfollowers* / *tidak follback*) tanpa membahayakan akun mereka dari pemblokiran atau penalti algoritma Instagram.

Berbeda dengan aplikasi pihak ketiga tradisional yang sering kali memicu penangguhan akun akibat aktivitas bot yang agresif, GaMutual mengintegrasikan **Smart Anti-Ban Engine** yang meregulasi seluruh aksi unfollow dengan kuota ketat dan interval jeda acak dinamis yang meniru perilaku manusiawi.

---

## ✨ Fitur Unggulan

### 🛡️ 1. Smart Anti-Ban Engine
- **Kuota Harian Terbatas (40 Aksi/Hari):** Membatasi kuota harian maksimal 40 unfollow per akun untuk mematuhi batas aman algoritma Instagram.
- **Dynamic Safe Delay (8–15 Detik):** Jeda waktu aman dinamis dengan jitter acak antar-aksi, mencegah deteksi pola robotik.
- **Per-Account Async Mutex:** Mengunci eksekusi paralel untuk akun yang sama sehingga mencegah *race conditions* atau double action.
- **HTTP 429 Instant Protection:** Endpoint langsung menolak permintaan bertubi-tubi dengan status `429 Too Many Requests` dan informasi detik sisa *cooldown*.

### 🔐 2. Keamanan & Privasi Sesi Terenkripsi
- **AES-256-GCM Session Encryption:** Sesi login disimpan dalam format terenkripsi biner berkunci simetris. Kata sandi pengguna tidak disimpan secara permanen di database.
- **Dukungan 2FA / Challenge Checkpoint:** Mampu menangani alur keamanan Instagram berupa tantangan OTP 6-digit (SMS/Email/Authenticator App).
- **Opsi Login Fleksibel (Cookie sessionid):** Tersedia opsi login langsung menggunakan cookie `sessionid` peramban untuk akun dengan keamanan berlapis.

### 📊 3. Dashboard Analitik Relasi Mendalam
- **Statistik Profil Real-Time:** Menampilkan jumlah Followers, Following, status enkripsi data, dan waktu sinkronisasi terakhir.
- **Top Bar Branding Bersih & Terpusat:** Tipografi "GaMutual" diposisikan *center-aligned* dengan palet warna `#251245` tanpa ikon mockup berlebih.
- **Hero Card "Tidak Follback" (GaMutual):** Menyoroti jumlah akun yang Anda ikuti namun tidak mengikuti Anda kembali.
- **Grid Analisis Relasi 2x2 Real-Time:**
  - *Unfollowers Baru* (dihitung per hari dengan badge kapsul `"-{jumlah} hari ini"`).
  - *Followers Baru* (dihitung per hari dengan badge kapsul `"+{jumlah} hari ini"`).
  - *Mutuals / Sahabat* (saling mengikuti, badge "Sahabat").
  - *Belum Difollow / Fans* (mengikuti Anda tapi belum Anda ikuti balik, badge "Fans").
- **Live Snapshot Diffing Engine:** Secara otomatis mendeteksi akun baru yang mem-follow dan akun yang meng-unfollow saat proses sinkronisasi berjalan secara realtime.

### 🔒 4. Autentikasi Ketat & Route Guard
- **Client-Side AuthGuard:** Melindungi seluruh rute privat (`/home`, `/unfollower`, `/whitelist`, `/activity`). Pengguna tanpa sesi valid secara otomatis dialihkan langsung ke `/login`.
- **Auto Session Clean-up:** Menangani penanganan error 401 Unauthorized secara terpusat untuk membersihkan kredensial kedaluwarsa dari penyimpanan peramban.
- **Dedicated Logout Option:** Tombol *"Keluar dari Akun"* pada antarmuka pemilihan akun untuk menghapus token dan sesi secara aman.

### ⚡ 5. Manajemen Unfollower Interaktif
- **Pencarian Cepat & Filter:** Cari pengguna berdasarkan username atau nama lengkap, serta filter tab *Semua* vs *Terlindungi (Whitelist)*.
- **3 Micro-States Tombol Aksi:**
  1. *Normal State:* Tombol oranye elegan "Unfollow".
  2. *Cooldown State:* Tombol dinonaktifkan dengan animasi putar `↻ Jeda Aman (Xs)` yang menghitung mundur real-time.
  3. *Completed State:* Tombol abu-abu `✓ Selesai`.
- **Modal Konfirmasi Berperingatan:** Melindungi dari klik tidak sengaja sebelum aksi dieksekusi.
- **Pintasan Profil Instagram:** Tautan eksternal yang langsung membuka profil akun di aplikasi/web Instagram resmi.

### ⭐ 6. Proteksi Akun Terlindungi (Whitelist)
- Tandai akun sahabat, keluarga, atau akun inspiratif sebagai *Terlindungi*.
- Akun yang masuk daftar whitelist terkunci dari tombol unfollow massal/tidak sengaja.

### 📜 7. Riwayat Aktivitas Kronologis (Activity Feed)
- **Ringkasan Sorotan Hari Ini:** Kartu sorotan total akun yang di-unfollow dan follower baru yang masuk hari ini.
- **Pengelompokan Waktu Otomatis:** Peristiwa dikelompokkan berdasarkan tanggal (*Hari Ini*, *Kemarin*, atau tanggal spesifik) dengan stempel waktu akurat dalam zona waktu Indonesia Barat (WIB).

---

## 🎨 Tampilan Desain & Antarmuka

Seluruh antarmuka dikembangkan dengan tingkat presisi tinggi berbasis spesifikasi desain resmi pada folder [`Docs/Design/`](./Docs/Design/):

| Halaman | Cuplikan Desain | Deskripsi |
| :--- | :---: | :--- |
| **Login Page** | `Docs/Design/Login Page.jpg` | Form otentikasi aman, tombol masuk alternatif IG, modal 2FA checkpoint, dan banner enkripsi 256-bit. |
| **Home Dashboard** | `Docs/Design/Home Page.jpg` | Header dark plum, statistik follower/following, kuota anti-ban progress bar, hero card tidak follback, dan tombol *Sinkronisasi Sekarang*. |
| **Unfollower Page** | `Docs/Design/Unfollower page.jpg` | Header melengkung, input filter pencarian, kuota sisa harian, micro-states jeda aman, dan proteksi whitelist. |
| **Activity Feed** | `Docs/Design/Activity Page.jpg` | Kartu sorotan aktivitas harian, feed kronologis terkelompok tanggal, dan label aksi berwarna. |

---

## 🏗️ Arsitektur Sistem & Keamanan

```
                    ┌────────────────────────────────────────┐
                    │       Client Browser (Mobile Shell)    │
                    │      Next.js 14 App Router + Tailwind  │
                    └───────────────────┬────────────────────┘
                                        │ HTTPS / JSON API
                                        ▼
                    ┌────────────────────────────────────────┐
                    │           FastAPI Backend              │
                    │   - Pydantic Data Validation           │
                    │   - In-Memory Asyncio Mutex            │
                    │   - Token Bucket Anti-Ban Engine       │
                    └───────────────┬────────────┬───────────┘
                                    │            │
            ┌───────────────────────┘            └────────────────────────┐
            ▼                                                             ▼
┌───────────────────────┐                                     ┌───────────────────────┐
│  Instagram Private    │                                     │  Relational Database  │
│  API Gateway          │                                     │  PostgreSQL / SQLite  │
│  (Instagrapi Engine)  │                                     │  (SQLAlchemy Async)   │
└───────────────────────┘                                     └───────────────────────┘
```

Untuk detail teknis arsitektur, silakan baca [SYSTEM_ARCHITECTURE.md](./documentation/SYSTEM_ARCHITECTURE.md).

---

## 📁 Struktur Direktori Repositori

```text
c:\GaMutual\
├── .env.example                     # Contoh konfigurasi environment root & Docker
├── .gitignore                       # Aturan pengabaian berkas sensitif, DB & dependensi
├── docker-compose.yml               # Orkestrasi kontainer Next.js, FastAPI, PostgreSQL & Redis
├── README.md                        # Dokumentasi utama proyek
├── Docs/
│   └── Design/                      # Aset visual mockup UI & Logo resmi GaMutual
│       ├── Login Page.jpg
│       ├── Home Page.jpg
│       ├── Unfollower page.jpg
│       ├── Activity Page.jpg
│       ├── Logo GaMutual.png
│       └── Logo GaMutual.svg
├── documentation/                   # Spesifikasi teknis & modul desain sistem
│   ├── README.md                    # Indeks & daftar isi dokumentasi
│   ├── PRD.md                       # Product Requirements Document
│   ├── SYSTEM_ARCHITECTURE.md       # Arsitektur sistem & Anti-Ban Engine
│   ├── API_SPECIFICATION.md         # Kontrak endpoint REST API
│   ├── DATABASE_SCHEMA.md           # Skema & model basis data relasional
│   ├── UI_SPECIFICATION.md          # Spesifikasi desain visual & token UI
│   └── DEVELOPMENT_ROADMAP.md       # Rencana pengembangan & milestone
├── backend/                         # Backend API Server (FastAPI)
│   ├── .dockerignore
│   ├── .env.example                 # Template variabel lingkungan backend
│   ├── Dockerfile
│   ├── pytest.ini
│   ├── requirements.txt             # Dependensi Python (FastAPI, Instagrapi, SQLAlchemy, dll.)
│   ├── app/
│   │   ├── main.py                  # Entry point aplikasi FastAPI
│   │   ├── api/v1/                  # Router endpoint (Auth, Dashboard, Unfollower, Whitelist, Activity)
│   │   ├── core/                    # Konfigurasi, enkripsi AES-256, dan Anti-Ban engine
│   │   ├── db/                      # Model ORM SQLAlchemy dan inisialisasi sesi DB
│   │   └── services/                # Instagram service client, sync service, unfollow service
│   └── tests/                       # Automated test suite (Pytest & HTTPX AsyncClient)
│       └── test_api.py
└── frontend/                        # Frontend Web App (Next.js 14 App Router)
    ├── .dockerignore
    ├── .env.example                 # Template variabel lingkungan frontend
    ├── Dockerfile
    ├── package.json                 # Dependensi Node.js & React
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── public/                      # Aset favicon dan logo publik
    └── src/
        ├── app/                     # Halaman rute (/login, /home, /unfollower, /whitelist, /activity)
        ├── components/              # Komponen UI (MobileShell, BottomNav, Modals, UnfollowCard)
        ├── lib/                     # API client wrapper
        └── types/                   # TypeScript interfaces & definitions
```

---

## 📚 Dokumentasi Lengkap

Dokumentasi teknis lengkap telah dirapikan pada direktori [`documentation/`](./documentation/):

1. [**Product Requirements Document (PRD.md)**](./documentation/PRD.md): Latar belakang, user persona, user stories, dan batasan operasional.
2. [**System Architecture & Anti-Ban Engine (SYSTEM_ARCHITECTURE.md)**](./documentation/SYSTEM_ARCHITECTURE.md): Diagram alur, rate-limiter logic, token-bucket formula, dan detail proteksi brute force.
3. [**API Specification (API_SPECIFICATION.md)**](./documentation/API_SPECIFICATION.md): Katalog endpoint, format payload JSON, response codes, dan skenario error.
4. [**Database Schema (DATABASE_SCHEMA.md)**](./documentation/DATABASE_SCHEMA.md): Tabel `instagram_accounts`, `encrypted_sessions`, `relation_snapshots`, `whitelist_entries`, `activity_logs`.
5. [**UI & UX Specification (UI_SPECIFICATION.md)**](./documentation/UI_SPECIFICATION.md): Panduan warna Tailwind, tipografi, Mobile-First App Shell, dan transisi micro-interactions.
6. [**Development Roadmap (DEVELOPMENT_ROADMAP.md)**](./documentation/DEVELOPMENT_ROADMAP.md): Tahapan eksekusi dan checklist pengujian fitur.

---

## 🚀 Panduan Instalasi & Menjalankan (Quickstart)

### Prasyarat Sistem
- **Python:** Versi 3.11 atau lebih baru
- **Node.js:** Versi 18.17 atau lebih baru (direkomendasikan v20 LTS)
- **Git:** Terpasang di sistem operasi Anda

---

### Langkah 1: Kloning Repositori
```bash
git clone https://github.com/alzahraramadhani/GaMutual.git
cd GaMutual
```

---

### Langkah 2: Menyiapkan dan Menjalankan Backend (FastAPI)

1. Masuk ke direktori `backend`:
   ```bash
   cd backend
   ```

2. Buat dan aktifkan virtual environment Python:
   - **Windows:**
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **Linux / macOS:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Pasang seluruh dependensi:
   ```bash
   pip install -r requirements.txt
   ```

4. Buat file `.env` dari template:
   ```bash
   cp .env.example .env
   ```

5. Jalankan server pengembangan FastAPI:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Server backend akan aktif di: [http://localhost:8000](http://localhost:8000)  
   Dokumentasi Swagger API Interaktif: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Langkah 3: Menyiapkan dan Menjalankan Frontend (Next.js)

1. Buka terminal baru dan masuk ke direktori `frontend`:
   ```bash
   cd frontend
   ```

2. Pasang dependensi Node.js:
   ```bash
   npm install
   ```

3. Buat file `.env.local` dari template:
   ```bash
   cp .env.example .env.local
   ```

4. Jalankan server pengembang Next.js:
   ```bash
   npm run dev
   ```
   Buka aplikasi web di peramban: [http://localhost:3000](http://localhost:3000)

---

## 👥 Akun Uji Coba & Demo (Demo Accounts)

Untuk mempermudah peninjauan dan pengujian tanpa harus menghubungkan akun Instagram pribadi, sistem menyediakan akun mock bawaan:

| Tipe Akun | Username | Password / Kode | Keterangan |
| :--- | :--- | :--- | :--- |
| **Akun Utama Mock** | `demo_test` | `Password123!` | Memuat profil visual lengkap (Demo Tester, 100 Followers, 50 Following, list unfollowers realistis). |
| **Skenario 2FA / OTP** | `challenge_test` | Sembarang kata sandi | Memunculkan modal verifikasi OTP 6-digit. Masukkan kode: **`892014`** untuk melanjutkan. |
| **Akun Instagram Asli** | Username IG Anda | Password IG Anda | Melakukan otentikasi langsung ke server Instagram via protokol Instagrapi. |
| **Login Cookie Sesi** | Username IG Anda | Nilai cookie `sessionid` | Opsi darurat jika akun Anda memiliki proteksi keamanan ganda dari web browser. |

---

## 🧪 Menjalankan Pengujian Otomatis (Testing)

### Pengujian Backend (Pytest Suite)
Suite pengujian otomatis mencakup 10 skenario komprehensif:
- Health check root endpoint
- Normal login flow & 2FA checkpoint challenge
- Sinkronisasi snapshot dashboard
- Pencarian dan filter daftar unfollower
- Eksekusi aksi unfollow dengan guard cooldown anti-ban
- Toggle status whitelist akun terproteksi
- Mutex konkurensi (mencegah unfollow paralel bersamaan)
- Proteksi pemblokiran unfollow pada akun whitelist
- Penguncian kuota harian saat kuota habis (40 aksi)
- Pergantian akun aktif (*account switcher*)

Jalankan pengujian dengan perintah:
```bash
cd backend
.\venv\Scripts\pytest -v tests/test_api.py
```

> [!NOTE]
> Seluruh test backend dieksekusi menggunakan database SQLite in-memory yang terisolasi penuh (`sqlite+aiosqlite:///:memory:` via `StaticPool`), sehingga eksekusi testing tidak akan pernah mengotori atau mengubah data akun asli pada database utama.

### Pengujian Frontend (Build Verification)
Pastikan kode TypeScript dan komponen React terkompilasi tanpa error:
```bash
cd frontend
npm run build
```

---

## 🐳 Deployment dengan Docker Compose

Untuk menjalankan seluruh ekosistem (Frontend, Backend API, PostgreSQL, Redis) secara kontainerisasi satu-perintah:

```bash
# Build dan jalankan seluruh container di background
docker compose up -d --build

# Periksa status seluruh layanan
docker compose ps

# Memantau logs aplikasi secara real-time
docker compose logs -f
```

Layanan yang tersedia:
- **Frontend App:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8000](http://localhost:8000)
- **API Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **PostgreSQL Database:** Port 5432
- **Redis Cache:** Port 6379

Untuk mematikan kontainer:
```bash
docker compose down
```

---

## ⚠️ Kebijakan Keamanan & Fair Use

1. **Keamanan Akun:** GaMutual menerapkan algoritma *conservative rate limiting* untuk menjaga keamanan akun Anda. Namun, pengguna bertanggung jawab penuh atas frekuensi penggunaan akun masing-masing.
2. **Kepatuhan Privasi:** GaMutual tidak menjual, menyimpan, atau mentransmisikan kredensial atau data pribadi Instagram Anda ke server pihak ketiga manapun. Seluruh sesi disimpan secara lokal di mesin Anda dengan enkripsi AES-256-GCM.
3. **Instagram Terms of Service:** Perangkat lunak ini dikembangkan untuk tujuan edukasi, analitik data pribadi, dan portofolio pengembangan perangkat lunak modern.

---

## 📄 Lisensi & Kontribusi

Proyek ini dirilis di bawah lisensi [MIT License](https://opensource.org/licenses/MIT).

Dibuat dengan dedikasi oleh **[Al Zahra Ramadhani](https://github.com/alzahraramadhani)**.  
Kritik, saran, dan *pull request* sangat disambut baik untuk pengembangan fitur di masa mendatang!
