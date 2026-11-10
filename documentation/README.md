# 📚 GaMutual Documentation

Selamat datang di direktori dokumentasi teknis dan produk **GaMutual**. Direktori ini berisi seluruh spesifikasi, arsitektur, skema basis data, dan panduan teknis yang digunakan untuk merancang serta membangun platform GaMutual.

---

## 📑 Daftar Dokumen

| Dokumen | Deskripsi | Status |
| :--- | :--- | :---: |
| [**PRD.md**](./PRD.md) | **Product Requirements Document**<br>Menjelaskan visi produk, target persona, fitur utama, metrik keberhasilan, dan batasan operasional. | Lengkap |
| [**SYSTEM_ARCHITECTURE.md**](./SYSTEM_ARCHITECTURE.md) | **Sistem & Arsitektur Keamanan**<br>Merinci topologi backend FastAPI, integrasi Instagrapi, Smart Anti-Ban Engine, rate limiting token-bucket, enkripsi sesi AES-256-GCM, dan per-account mutex. | Lengkap |
| [**API_SPECIFICATION.md**](./API_SPECIFICATION.md) | **Spesifikasi Kontrak REST API**<br>Katalog lengkap endpoint API (Autentikasi, Challenge 2FA, Dashboard snapshot, Unfollowers pagination/search, Whitelist guard, dan Activity Feed). | Lengkap |
| [**DATABASE_SCHEMA.md**](./DATABASE_SCHEMA.md) | **Skema Basis Data**<br>Definisi tabel PostgreSQL/SQLite (Akun Instagram, Sesi Enkripsi, Snapshot Relasi, Whitelist, dan Log Audit Aktivitas) beserta indeks performa. | Lengkap |
| [**UI_SPECIFICATION.md**](./UI_SPECIFICATION.md) | **Spesifikasi Desain & Komponen UI**<br>Design tokens Tailwind CSS, hierarki warna (Dark Plum / Accent Orange), Mobile-First App Shell (maks 430px), animasi micro-interactions, dan layout per halaman. | Lengkap |
| [**DEVELOPMENT_ROADMAP.md**](./DEVELOPMENT_ROADMAP.md) | **Roadmap Pengembangan**<br>Langkah-langkah fase implementasi fitur bertahap, checklist verifikasi kualitas, dan milestone rilis. | Selesai |

---

## 🎨 Referensi Desain Visual

Desain antarmuka merujuk pada visual mockup berkualitas tinggi yang tersimpan pada direktori:
- [`Docs/Design/`](../Docs/Design/)
  - `Login Page.jpg`
  - `Home Page.jpg`
  - `Unfollower page.jpg`
  - `Activity Page.jpg`
  - `Logo GaMutual.png` & `Logo GaMutual.svg`
