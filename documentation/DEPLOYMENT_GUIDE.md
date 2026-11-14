# Panduan Deployment Gratis GaMutual (Vercel + Render)

Panduan lengkap langkah demi langkah untuk melakukan hosting aplikasi **GaMutual** secara **100% GRATIS (Rp 0)** tanpa memerlukan kartu kredit/debit sama sekali.

---

## Ringkasan Arsitektur
- **Frontend (Web User Interface)**: Dideploy ke **[Vercel](https://vercel.com)** (Gratis selamanya, auto SSL, CDN cepat).
- **Backend (API Python FastAPI)**: Dideploy ke **[Render.com](https://render.com)** (Gratis selamanya, auto deploy via GitHub).

---

## Langkah 1: Deploy Backend ke Render.com (3 Menit)

1. Buka situs **[render.com](https://render.com)** lalu klik tombol **Sign Up** atau **Sign In** menggunakan akun **GitHub** Anda.
2. Di Dashboard Render, klik tombol **New +** di pojok kanan atas, lalu pilih **Blueprint**.
3. Hubungkan repositori GitHub Anda:
   - Pilih repositori `alzahraramadhani/GaMutual`.
   - Render akan secara otomatis membaca berkas `render.yaml` yang sudah kami sediakan.
4. Beri nama instance (misalnya: `gamutual-backend`).
5. Klik **Apply**.
6. Render akan langsung menginstal dependensi Python dan menjalankan FastAPI.
7. Setelah statusnya menjadi **Live**, salin URL Backend Anda yang tertera di bagian atas dashboard Render.
   > **Contoh URL Backend**: `https://gamutual-backend.onrender.com`

---

## Langkah 2: Deploy Frontend ke Vercel (2 Menit)

1. Buka situs **[vercel.com](https://vercel.com)** lalu klik tombol **Sign Up** atau **Login** menggunakan akun **GitHub** Anda.
2. Di Dashboard Vercel, klik tombol **Add New...** → pilih **Project**.
3. Di daftar repositori GitHub, klik tombol **Import** pada repositori `alzahraramadhani/GaMutual`.
4. **PENTING — Pengaturan Root Directory**:
   - Pada bagian **Root Directory**, klik tombol **Edit**.
   - Pilih folder **`frontend`** lalu klik **Continue**.
5. **Pengaturan Environment Variables**:
   - Buka menu dropdown **Environment Variables**.
   - Tambahkan variabel baru:
     - **Key**: `NEXT_PUBLIC_API_URL`
     - **Value**: Masukkan URL Backend Render Anda dari Langkah 1 (contoh: `https://gamutual-backend.onrender.com`).
   - Klik **Add**.
6. Klik tombol **Deploy**.
7. Tunggu sekitar 1 menit hingga kembang api muncul di layar!
8. Vercel akan memberikan domain gratis (contoh: `https://gamutual.vercel.app`).

---

## Langkah 3: Uji Coba Aplikasi Online Anda

1. **Buka URL Vercel Anda** di browser HP atau laptop.
2. **Fitur Mode Aman (Offline JSON/ZIP)**:
   - Coba seret file `.zip` atau `.json` unduhan data Instagram Anda.
   - Hasil analisis akun yang tidak follback akan langsung muncul seketika di browser Anda tanpa risiko diblokir Meta.
3. **Fitur Login Langsung**:
   - Klik tombol *Masuk dengan Akun Instagram* untuk mencoba sinkronisasi otomatis menggunakan backend FastAPI di Render.

---

> [!TIP]
> **Tips Perawatan Render Free Tier:**
> Layanan web gratis di Render akan memasuki mode tidur (*sleep*) jika tidak ada pengunjung selama 15 menit. Saat pertama kali ada pengunjung yang mengakses fitur login langsung setelah periode tidur, server memerlukan waktu sekitar 30 detik untuk aktif kembali. Fitur analisis ZIP/JSON di frontend tetap berjalan instan karena diproses 100% di browser.

