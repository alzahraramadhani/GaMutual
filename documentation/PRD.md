# Product Requirements Document (PRD)
# Proyek: GaMutual (Instagram Mutual & Unfollower Tracker)

- **Versi:** 2.0.0 (Tersinkronisasi dengan Desain Visual UI/UX)
- **Status:** Approved / Siap untuk Eksekusi Coding
- **Tanggal:** 2026-11-10
- **Pemilik Produk:** Tim GaMutual
- **Referensi Desain:** `c:\GaMutual\Docs\Design\` (`Login Page.jpg`, `Home Page.jpg`, `Unfollower page.jpg`, `Activity Page.jpg`, `Logo GaMutual.svg`)

---

## 1. Ringkasan Eksekutif (Executive Summary)

**GaMutual** adalah aplikasi web analitik relasi Instagram berbasis *Mobile-First App Shell* yang elegan, intuitif, dan aman. GaMutual dirancang untuk membantu pengguna melacak akun yang berhenti mengikuti (*unfollowed*), followers baru, serta memetakan akun yang tidak melakukan *follow back* (*non-mutual* / GaMutual).

Aplikasi ini memungkinkan pengguna melakukan tindakan **Unfollow langsung dari dashboard** dengan sistem perlindungan akun cerdas (*Smart Anti-Ban Protection*), jeda interval dinamis (8–15 detik), batasan kuota harian (24/40 aksi), serta sistem proteksi akun penting (*List Terlindungi / Whitelist*).

---

## 2. Arsitektur Navigasi & Tampilan Aplikasi (App Layout)

Berdasarkan desain resmi, aplikasi menggunakan antarmuka modern dengan **Floating Bottom Navigation Bar** berformat pill gelap yang melayang di bagian bawah layar:

1. **Tab 1: Home (Beranda)**
   - Header profil aktif, tombol ganti akun (*switch account*), statistik followers & following, status enkripsi, dan timestamp sinkronisasi terakhir.
   - Tombol utama *"Sinkronisasi Sekarang"* (Oranye) dan bar indikator kuota anti-ban.
   - Card pintasan *"Tambah List Terlindungi"* untuk memproteksi akun.
   - Card unggulan *"Tidak Follback (GaMutual)"* dengan tombol *"Buka Daftar"*.
   - Grid 2x2 metrik relasi (Unfollowers Baru, Followers Baru, Mutuals Akun, Belum Difollow/Fans).
2. **Tab 2: Unfollower (Daftar GaMutual)**
   - Header gelap dengan indikator status anti-ban ("Status: Aman", kuota terpakai & tersisa).
   - Form pencarian cepat & filter pill (*Semua*, *Terlindungi*).
   - Daftar kartu pengguna lengkap dengan avatar, nama, username, badge proteksi, tombol Unfollow, state cooldown (*"↻ Jeda Aman 10s"*), state sukses (*"✓ Selesai"*), dan pintasan profil Instagram resmi.
   - Kotak informasi edukasi proteksi algoritma cerdas.
3. **Tab 3: Activity (Riwayat Aktivitas)**
   - Dua kartu sorotan metrik hari ini: *Unfollowed* (Merah) dan *Follower Baru* (Hijau).
   - Tab filter aktivitas: *Semua*, *Unfollowed*, *Follower Baru*.
   - Timeline aktivitas kronologis yang dikelompokkan berdasarkan tanggal (*Hari Ini*, *Kemarin*, dst.) dengan timestamp waktu (WIB) dan badge penanda status.

---

## 3. Spesifikasi Fungsional Per Layar (Detailed Screen Specs)

### 3.1. Layar Login (`Login Page.jpg`)
- **Tujuan:** Autentikasi pengguna secara langsung dan aman tanpa registrasi email terpisah yang rumit.
- **Elemen Tampilan:**
  - Logo GaMutual resmi (dua cincin bertautan ungu-oranye emas).
  - Judul: *"GaMutual"*, subjudul: *"Kelola mutual & relasi Instagram Anda dengan aman, cepat, dan transparan"*.
  - Form login:
    - Input Username Instagram (ikon `@`, placeholder: *"Masukkan username"*).
    - Input Kata Sandi (ikon gembok, toggle lihat/sembunyikan kata sandi, placeholder: *"Masukkan kata sandi"*).
    - Checkbox: *"Ingat perangkat ini selama 30 hari"*.
    - Tombol aksi utama: *"Masuk Sekarang ->"* (gradien ungu gelap/indigo).
  - Pemisah: *"ATAU MASUK DENGAN"*.
  - Tombol alternatif: *"Masuk dengan Akun Instagram"* (ikon logo Instagram).
  - Catatan Keamanan: Box hijau ramah dengan ikon perisai: *"Keamanan Terproteksi - Enkripsi end-to-end 256-bit terjamin aman. Token Instagram tidak pernah disimpan secara terbuka."*
- **Penanganan 2FA / Challenge:**
  - Jika akun Instagram memerlukan verifikasi 2FA atau kode OTP (SMS/Email), muncul modal bottom sheet untuk memasukkan kode 6 digit secara real-time.

---

### 3.2. Layar Beranda (`Home Page.jpg`)
- **Header Profil Pengguna (Dark Purple Gradient Card):**
  - Foto avatar lingkaran, nama pengguna (contoh: *"Zahra"*), username (`@jjahrav`).
  - Tombol **"⇄ Ganti Akun"**: Membuka *Bottom Sheet Account Switcher* untuk beralih antar akun Instagram yang tersimpan atau menambah akun baru.
  - Dua kotak metrik berdampingan:
    - **Followers:** Angka besar (contoh: `1.345`) + ikon 2 orang.
    - **Following:** Angka besar (contoh: `842`) + ikon orang centang.
  - Status keamanan: Ikon gembok hijau *"End-to-End Encrypted"* & ikon jam *"Sync 10 mnt lalu"*.
- **Card Aksi & Batas Tindakan Anti-Ban:**
  - Tombol Pill Besar Oranye: **"↺ Sinkronisasi Sekarang"** (memicu scanning background snapshot).
  - Card Proteksi Anti-Ban:
    - Ikon perisai hijau: *"Batas Tindakan Anti-Ban"*.
    - Counter kuota harian: `24 / 40 tersisa` (atau `16 terpakai / 40 total`).
    - Progress bar hijau visual.
    - Keterangan: *"Kecepatan algoritma anti-banned aktif"*.
- **Card List Terlindungi (Whitelist Banner):**
  - Ikon perisai berbintang ungu muda.
  - Teks: *"Tambah List Terlindungi - Amankan akun dari unfollow"*.
  - Tombol: *"Atur List >"* (membuka modal manajemen Whitelist).
- **Bagian Analisis Relasi:**
  - **Hero Card (Tidak Follback):**
    - Judul: *"Tidak Follback (GaMutual)"*
    - Deskripsi: *"Akun yang kamu ikuti tanpa mengikuti balik"*
    - Jumlah: `184 Akun`
    - Tombol: **"Buka Daftar ↗"** (mengalihkan langsung ke Tab Unfollower).
  - **Grid 2x2 Metrik Relasi:**
    1. **Unfollowers Baru:** `12` (Badge: `-2 hari ini`, ikon tren menurun).
    2. **Followers Baru:** `+28` (Badge: `+8 baru`, ikon user tambah).
    3. **Mutuals Akun:** `658` (Badge: `Sahabat`, ikon jabat tangan).
    4. **Belum Difollow (Fans):** `34` (Badge: `Fans`, ikon hati).

---

### 3.3. Layar Unfollower (`Unfollower page.jpg`)
- **Header Atas (Dark Purple Curved Shell):**
  - Judul: *"Daftar Unfollower"*, sub: *"Daftar yang meng-unfollow dan tidak follow balik"*.
  - Card Anti-Ban Header:
    - Ikon perisai: *"Batas Tindakan Anti-Ban"*, badge hijau: *"Status: Aman"*.
    - Progress bar visual.
    - Teks status: *"Digunakan hari ini: 24/40 aksi"* & *"Sisa kuota: 16"*.
- **Filter & Pencarian:**
  - Input field: *"Cari username atau nama..."* dengan ikon kaca pembesar.
  - Tab Filter:
    - **"Semua (184)"** (tab aktif warna ungu gelap).
    - **"🛡 Terlindungi (18)"** (tab filter akun whitelist warna putih).
- **Hasil Deteksi Unfollower (User Cards List):**
  - Setiap baris akun menampilkan:
    - Foto avatar lingkaran.
    - Nama lengkap & username (misal: *Kevin Adiputra* `@kevin_adiputra`).
    - Badge *"Terlindungi"* warna emas jika akun masuk dalam Whitelist.
    - Tombol aksi kontekstual:
      - **State 1 (Normal):** Tombol oranye **"Unfollow"**.
      - **State 2 (Cooldown / In-Progress):** Tombol ungu **"↻ Jeda Aman 10s"** dengan animasi countdown mundur 10 detik.
      - **State 3 (Selesai):** Badge hijau muda **"✓ Selesai"**.
    - Tombol ikon Instagram (kamera) di ujung kanan untuk membuka profil asli (`https://instagram.com/username`) di tab baru.
- **Dialog Konfirmasi Unfollow:**
  - Saat tombol "Unfollow" diklik, muncul pop-up konfirmasi ringkas: *"Yakin ingin berhenti mengikuti @username? Sisa kuota aman hari ini: 16 aksi"*.
- **Info Box Bawah:**
  - Box ungu muda dengan ikon perisai: *"Proteksi Akun Cerdas Aktif - GaMutual membatasi laju unfollow secara otomatis dengan interval dinamis 8–15 detik untuk mematuhi regulasi algoritma Instagram."*

---

### 3.4. Layar Riwayat Aktivitas (`Activity Page.jpg`)
- **Header Layar (Dark Purple Theme):**
  - Judul: *"Riwayat Aktivitas"*, sub: *"Pantau pergerakan relasi akun secara real-time"*.
  - 2 Kartu Sorotan Berdampingan:
    - **Unfollowed Card:** Angka `12 Akun`, sub: `Hari ini`, ikon merah user-minus.
    - **Follower Baru Card:** Angka `+28 Akun`, sub: `Hari ini`, ikon hijau user-plus.
- **Tab Filter Riwayat:**
  - **"Semua"** (aktif)
  - **"Unfollowed"**
  - **"Follower Baru"**
- **Timeline Aktivitas Dikelompokkan Tanggal:**
  - Header Grup 1: *"• Hari Ini 9 Nov 2026"* (kanan: *"3 Aktivitas"*).
    - Item 1: Avatar + badge minus merah, Nama & Handle, badge `👤- Unfollowed` (merah), waktu `09:15 WIB`, ikon Instagram.
    - Item 2: Avatar + badge plus hijau, Nama & Handle, badge `👤+ Follower Baru` (hijau), waktu `08:40 WIB`, ikon Instagram.
    - Item 3: Avatar + badge plus hijau, Nama & Handle, badge `👤+ Follower Baru`, waktu `07:10 WIB`, ikon Instagram.
  - Header Grup 2: *"• Kemarin 8 Nov 2026"* (kanan: *"3 Aktivitas"*).
    - Item 4, 5, 6 sesuai data historis dengan stempel waktu akurat.

---

## 4. Aturan Bisnis & Algoritma Keamanan (Anti-Ban Guardrails)

1. **Batas Kuota Harian Dinamis:**
   - Standar harian: Maksimal **40 aksi unfollow per hari**.
   - Kuota direset otomatis setiap pukul 00:00 waktu lokal akun.
2. **Interval Cooldown Dinamis (8–15 Detik):**
   - Setelah pengguna mengklik unfollow pada akun A, sistem menerapkan cooldown acak antara 8 hingga 15 detik.
   - Selama masa cooldown, tombol unfollow lainnya menampilkan indikator hitung mundur *"↻ Jeda Aman Xs"* untuk mencegah penalti Instagram.
3. **Proteksi Akun Terlindungi (Whitelist Guard):**
   - Akun yang memiliki badge *"Terlindungi"* tidak dapat di-unfollow secara langsung tanpa konfirmasi ekstra membuka proteksi terlebih dahulu.
4. **Enkripsi Sesi End-to-End:**
   - Kredensial dan cookie sesi disimpan dengan cipher AES-GCM 256-bit.

---

## 5. Kriteria Penerimaan (Acceptance Criteria)

- [ ] Seluruh tampilan web sesuai 100% dengan tata letak, warna, tipografi, dan komponen pada file desain di `Docs/Design/`.
- [ ] Pengguna dapat login langsung dengan Username & Password Instagram, atau via tombol alternatif.
- [ ] Bottom Navigation Bar berfungsi mulus berpindah antara tab **Home**, **Unfollower**, dan **Activity**.
- [ ] Tombol "Sinkronisasi Sekarang" memperbarui metrik relasi dan mendeteksi perubahan followers/following.
- [ ] Tombol "Unfollow" pada halaman Unfollower menjalankan aksi unfollow nyata di Instagram dengan dialog konfirmasi, state cooldown (*"↻ Jeda Aman 10s"*), dan state selesai (*"✓ Selesai"*).
- [ ] Kuota tindakan anti-ban berkurang secara tepat (misal 24/40 tersisa) dan tercatat di riwayat aktivitas.
- [ ] Halaman Riwayat Aktivitas menampilkan log unfollow dan follower baru terkelompok tanggal dan waktu WIB.
