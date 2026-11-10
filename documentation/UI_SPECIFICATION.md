# Spesifikasi Desain Antarmuka (UI Specification & Design System)
# Proyek: GaMutual (Instagram Mutual & Unfollower Tracker)

- **Versi:** 1.0.0
- **Status:** Approved / Panduan Resmi Frontend
- **Referensi Desain Visual:** `c:\GaMutual\Docs\Design\`
  - `Login Page.jpg`
  - `Home Page.jpg`
  - `Unfollower page.jpg`
  - `Activity Page.jpg`
  - `Logo GaMutual.svg` & `Logo GaMutual.png`

---

## 1. Design System Tokens (Palet Warna & Tipografi)

### 1.1. Color Palette (Hex & Tailwind Mapping)

| Nama Token | Hex Code | Tailwind CSS Class / CSS Var | Kegunaan |
| :--- | :--- | :--- | :--- |
| **Dark Plum / Brand Primary** | `#251245` | `bg-[#251245]`, `text-[#251245]` | Latar header atas, bottom navigation pill, card profil utama |
| **Brand Purple Mid** | `#5E3A9B` | `bg-[#5E3A9B]` | Gradien logo dan aksen sekunder |
| **Brand Purple Light** | `#6E4AAC` | `bg-[#6E4AAC]` | Gradien stop logo GaMutual |
| **Amber Orange / Action CTA** | `#FEA619` | `bg-[#FEA619]`, `text-[#FEA619]` | Cincin kanan logo, tombol "Sinkronisasi Sekarang", tombol "Unfollow" |
| **Amber Orange Hover** | `#E59514` | `hover:bg-[#E59514]` | Hover state tombol CTA oranye |
| **Success Emerald** | `#10B981` | `text-[#10B981]`, `bg-[#10B981]` | Indikator aman, progress bar kuota, badge follower baru |
| **Success Light Badge** | `#D1FAE5` | `bg-[#D1FAE5]`, `text-[#065F46]` | Badge "✓ Selesai" pada baris unfollower |
| **Danger Rose** | `#EF4444` | `text-[#EF4444]`, `bg-[#EF4444]` | Badge Unfollowed, indikator minus riwayat |
| **Danger Light Badge** | `#FEE2E2` | `bg-[#FEE2E2]`, `text-[#991B1B]` | Badge `👤- Unfollowed` di halaman Activity |
| **Warning / Whitelist Gold** | `#F59E0B` | `text-[#F59E0B]`, `bg-[#FEF3C7]` | Badge "Terlindungi" (Whitelist) |
| **Cooldown Purple Light** | `#EDE9FE` | `bg-[#EDE9FE]`, `text-[#6D28D9]` | Tombol "↻ Jeda Aman 10s" saat countdown aktif |
| **Background Shell** | `#F8FAFC` | `bg-[#F8FAFC]` / `bg-slate-50` | Latar belakang seluruh halaman aplikasi |
| **Surface White** | `#FFFFFF` | `bg-white` | Latar belakang kartu (*cards*), item baris, dan form |
| **Text Primary (Dark)** | `#1E1B4B` | `text-[#1E1B4B]` / `text-slate-900` | Judul, nama profil, angka metrik besar |
| **Text Secondary (Muted)**| `#6B7280` | `text-[#6B7280]` / `text-slate-500` | Subjudul, username handle, deskripsi kartu |

---

### 1.2. Tipografi
- **Font Family Utama:** `Plus Jakarta Sans`, `Inter`, atau `sans-serif` sistem.
- **Hierarki Teks:**
  - **Hero / Big Numbers:** `text-3xl` / `text-4xl` (`font-bold`, tracking-tight) -> Digunakan untuk angka metrik 1.345, 184, +28, 658.
  - **Screen Titles:** `text-2xl` (`font-bold`, `text-white` di header plum).
  - **Card Headings:** `text-base` / `text-lg` (`font-bold` / `font-semibold`).
  - **Body / Usernames:** `text-sm` (`font-medium` / `font-normal`).
  - **Badges / Footnotes:** `text-xs` (`font-medium`).

---

### 1.3. Struktur Shell & Layout Mobile-First
- Container aplikasi dibatasi pada lebar maksimal perangkat bergerak modern:
  ```tsx
  <div className="min-h-screen bg-slate-100 flex justify-center">
    <div className="w-full max-w-[430px] min-h-screen bg-[#F8FAFC] shadow-2xl relative pb-28 flex flex-col">
      {/* Konten Halaman */}
      {/* Floating Bottom Nav */}
    </div>
  </div>
  ```

---

## 2. Rincian Komponen Per Layar

### 2.1. Layar Login (`Login Page.jpg`)
1. **Logo Container:**
   - Ukuran: 64x64px, rounded-2xl (`rounded-2xl`).
   - Berisi aset SVG resmi `Logo GaMutual.svg`.
2. **Kartu Form:**
   - Card putih dengan border tipis halus (`border border-slate-100 shadow-sm rounded-3xl p-6`).
   - Input Username:
     - Prefix icon: `@` (`text-slate-400`).
     - Border halus, padding nyaman (`rounded-xl bg-slate-50 border-slate-200 text-sm`).
   - Input Kata Sandi:
     - Prefix icon: `Lock` (`text-slate-400`).
     - Suffix icon: `Eye` / `EyeOff` tombol interaktif toggle password.
   - Checkbox: Custom checkbox ungu dengan label *"Ingat perangkat ini selama 30 hari"*.
   - Tombol Masuk:
     - Background: Gradien `#251245` ke `#1F1138`.
     - Teks: *"Masuk Sekarang"* dengan panah `ArrowRight`.
     - Efek hover: `shadow-lg shadow-indigo-950/20`.
   - Tombol Alternatif:
     - Background: `#F8FAFC`, border tipis, icon Instagram warna-warni, teks: *"Masuk dengan Akun Instagram"*.
   - Keamanan Terproteksi Banner:
     - Background: `#F0FDF4` (hijau muda), border `#DCFCE7`, ikon `ShieldCheck` hijau.

---

### 2.2. Layar Beranda (`Home Page.jpg`)
1. **Header Profil (Dark Purple Card):**
   - Background: Gradien linier `#251245` ke `#1F1138`, rounded-3xl, padding 5.
   - Foto avatar lingkaran 56x56px dengan border putih tipis.
   - Tombol *"⇄ Ganti Akun"*: Pill semi-transparan `bg-white/10 hover:bg-white/20 text-xs px-3 py-1.5 rounded-full`.
   - Grid 2 Box Statistik (Followers & Following): `bg-white/5 border border-white/10 rounded-2xl p-3.5`.
   - Footer card: Ikon gembok hijau *"End-to-End Encrypted"* & jam *"Sync 10 mnt lalu"*.
2. **Tombol "Sinkronisasi Sekarang":**
   - Tombol pill penuh warna oranye `#FEA619`, font-semibold, teks hitam/putih kontras, ikon `RefreshCw`.
3. **Card Batas Tindakan Anti-Ban:**
   - Background: `#F0FDF4`, border `#DCFCE7`.
   - Progress bar: Bar abu-abu dengan isi hijau emerald `#10B981` (lebar dinamis: `width: (24/40)*100%`).
4. **Card Tambah List Terlindungi (Whitelist Banner):**
   - Card putih rounded-2xl p-4 flex items-center justify-between.
   - Ikon perisai ungu muda di kiri.
   - Tombol pill *"Atur List >"* di kanan (`bg-[#F3E8FF] text-[#6B21A8]`).
5. **Hero Card "Tidak Follback (GaMutual)":**
   - Card putih p-5 rounded-2xl shadow-sm border border-slate-100.
   - Ikon `UserX` ungu muda.
   - Angka besar `184` + kata `"Akun"`.
   - Tombol gelap *"Buka Daftar ↗"* (`bg-[#1E1B4B] text-white`).
6. **Grid 2x2 Analisis Relasi:**
   - 4 Card persegi rounded-2xl p-4 bg-white border border-slate-100:
     - Card 1: *Unfollowers Baru* (Angka 12, Badge merah `-2 hari ini`, ikon `TrendingDown`).
     - Card 2: *Followers Baru* (Angka +28, Badge hijau `+8 baru`, ikon `UserPlus`).
     - Card 3: *Mutuals Akun* (Angka 658, Badge ungu `Sahabat`, ikon `Handshake`).
     - Card 4: *Belum Difollow* (Angka 34, Badge pink `Fans`, ikon `Heart`).

---

### 2.3. Layar Unfollower (`Unfollower page.jpg`)
1. **Curved Header Plum:**
   - Header ungu gelap melengkung di bagian bawah (`rounded-b-[36px] pb-6 pt-8 px-5`).
   - Kartu Anti-ban tersemat di dalam header dengan background `rgba(255,255,255,0.08)`.
2. **Search Bar & Filter Tabs:**
   - Input search melayang dengan shadow halus.
   - 2 Filter Pill:
     - Pill "Semua (184)": Aktif warna ungu gelap (`bg-[#251245] text-white`).
     - Pill "🛡 Terlindungi (18)": Pasif warna putih border tipis (`bg-white text-slate-700`).
3. **User Row Item Component:**
   - Card putih rounded-2xl p-3.5 flex items-center justify-between.
   - Avatar 48x48px rounded-full.
   - Nama pengguna, badge "Terlindungi" (jika whitelisted), handle `@username`.
   - **State Mesin Tombol Unfollow:**
     - **Normal:** Tombol oranye `#FEA619` dengan teks *"Unfollow"*.
     - **Sedang Cooldown / Jeda:** Tombol ungu muda `#EDE9FE` dengan animasi spinner *"↻ Jeda Aman 10s"*.
     - **Selesai:** Badge hijau `#D1FAE5` dengan teks *"✓ Selesai"*.
   - Tombol Instagram Icon di samping kanan (`border border-slate-200 rounded-xl p-2 hover:bg-slate-50`).

---

### 2.4. Layar Riwayat Aktivitas (`Activity Page.jpg`)
1. **Header & 2 Highlight Cards:**
   - Card 1: Unfollowed (`12 Akun`, subtitle `Hari ini`, badge ikon merah).
   - Card 2: Follower Baru (`+28 Akun`, subtitle `Hari ini`, badge ikon hijau).
2. **Filter Tabs:**
   - Tiga opsi: `Semua`, `Unfollowed`, `Follower Baru`.
3. **Timeline Grouped by Date:**
   - Header Section: Dot ungu bulat + teks tanggal bold (*"• Hari Ini 9 Nov 2026"*), sebelah kanan: *"3 Aktivitas"*.
   - Item Timeline:
     - Avatar dengan floating dot badge di pojok kanan bawah (merah `-` atau hijau `+`).
     - Tag status: `👤- Unfollowed` (merah) atau `👤+ Follower Baru` (hijau).
     - Waktu kejadian: format `09:15 WIB`.
     - Tombol shortcut Instagram.

---

### 2.5. Floating Bottom Navigation Bar
- Posisi: Fixed di bagian bawah container, melayang dengan margin bawah 6px (`fixed bottom-5 left-1/2 -translate-x-1/2 w-[90%] max-w-[390px]`).
- Background: Gelap `#1F1138` dengan blur backdrop, rounded-full, padding 2, shadow-2xl.
- 3 Tab Navigasi:
  - **Home:** Icon `Home`, label "Home".
  - **Unfollower:** Icon `UserMinus`, label "Unfollower".
  - **Activity:** Icon `ArrowLeftRight`, label "Activity".
- State Tab Aktif:
  - Pill ungu terang `bg-[#5E3A9B] text-white px-5 py-2 rounded-full font-medium transition-all duration-200`.
- State Tab Pasif:
  - `text-slate-400 hover:text-white px-3 py-2 flex flex-col items-center text-xs`.

