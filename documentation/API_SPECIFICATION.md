# Spesifikasi Kontrak REST API (API Specification)
# Proyek: GaMutual (Instagram Mutual & Unfollower Tracker)

- **Versi:** 2.0.0 (Tersinkronisasi dengan Desain Visual UI/UX)
- **Base URL:** `http://localhost:8000/api/v1` (atau URL server domain saat di-deploy)
- **Format:** JSON (RESTful API)
- **Header Standar:** `Authorization: Bearer <jwt_session_token>`

---

## 1. Modul Otentikasi Langsung Instagram (Auth Endpoints)

### 1.1. Login Langsung Akun Instagram
`POST /auth/instagram/login`
- **Request Body:**
```json
{
  "username": "jjahrav",
  "password": "PasswordInstagram123!",
  "remember_device": true
}
```
- **Response Sukses (`200 OK`):**
```json
{
  "status": "SUCCESS",
  "message": "Login berhasil, akun Instagram terhubung",
  "session_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "account": {
    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "username": "jjahrav",
    "full_name": "Zahra",
    "profile_pic_url": "https://instagram.fsub1-1.fna.fbcdn.net/...",
    "follower_count": 1345,
    "following_count": 842,
    "is_encrypted": true
  }
}
```
- **Response Perlu 2FA / Challenge OTP (`202 Accepted`):**
```json
{
  "status": "CHALLENGE_REQUIRED",
  "challenge_type": "SMS_OR_EMAIL", 
  "contact_point": "+62812****89 / z***@gmail.com",
  "temporary_session_id": "temp_session_xyz789",
  "message": "Instagram mengirimkan kode verifikasi 6-digit. Masukkan kode untuk menyelesaikan login."
}
```

### 1.2. Verifikasi Kode OTP / 2FA
`POST /auth/instagram/challenge/verify`
- **Request Body:**
```json
{
  "temporary_session_id": "temp_session_xyz789",
  "verification_code": "892014"
}
```
- **Response Sukses (`200 OK`):**
```json
{
  "status": "SUCCESS",
  "message": "Verifikasi 2FA berhasil!",
  "session_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "account_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
}
```

### 1.3. Ganti Akun Aktif (Account Switcher)
`GET /auth/instagram/accounts`
- **Response (`200 OK`):** Mengembalikan daftar semua akun Instagram yang tersimpan untuk modal bottom sheet *"⇄ Ganti Akun"*.
```json
{
  "active_account_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "accounts": [
    {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "username": "jjahrav",
      "full_name": "Zahra",
      "profile_pic_url": "https://...",
      "follower_count": 1345,
      "following_count": 842,
      "is_active": true
    },
    {
      "id": "f9e8d7c6-b5a4-3210-fedc-ba9876543210",
      "username": "zahra_olshop",
      "full_name": "Zahra Hijab Store",
      "profile_pic_url": "https://...",
      "follower_count": 5210,
      "following_count": 210,
      "is_active": false
    }
  ]
}
```

---

## 2. Modul Dashboard & Analisis Relasi (Home Page)

### 2.1. Dapatkan Profil & Seluruh Kartu Analisis Relasi
`GET /instagram/accounts/{account_id}/home-dashboard`
- **Response (`200 OK`):**
```json
{
  "profile": {
    "username": "jjahrav",
    "full_name": "Zahra",
    "profile_pic_url": "https://...",
    "follower_count": 1345,
    "following_count": 842,
    "last_synced_text": "Sync 10 mnt lalu",
    "is_encrypted": true
  },
  "anti_ban": {
    "used_today": 24,
    "quota_limit": 40,
    "remaining_quota": 16,
    "status_text": "Status: Aman",
    "speed_status": "Kecepatan algoritma anti-banned aktif"
  },
  "relation_analysis": {
    "tidak_follback_count": 184,
    "unfollowers_baru": {
      "count": 12,
      "badge": "-2 hari ini"
    },
    "followers_baru": {
      "count": 28,
      "badge": "+8 baru"
    },
    "mutuals": {
      "count": 658,
      "badge": "Sahabat"
    },
    "belum_difollow": {
      "count": 34,
      "badge": "Fans"
    }
  }
}
```

---

## 3. Modul Sinkronisasi Snapshot (Sync Engine)

### 3.1. Jalankan Sinkronisasi Sekarang
`POST /instagram/accounts/{account_id}/sync`
- **Response (`202 Accepted`):**
```json
{
  "status": "QUEUED",
  "task_id": "sync_task_882910",
  "message": "Pengecekan relasi Instagram sedang berjalan di latar belakang..."
}
```

### 3.2. Cek Status Progres Sinkronisasi
`GET /instagram/accounts/{account_id}/sync/status?task_id=sync_task_882910`
- **Response (`200 OK`):**
```json
{
  "task_id": "sync_task_882910",
  "status": "COMPLETED", // 'QUEUED', 'IN_PROGRESS', 'COMPLETED'
  "progress_percentage": 100,
  "detected_unfollowers": 2,
  "detected_new_followers": 8
}
```

---

## 4. Modul Unfollower (Tab Unfollower)

### 4.1. Ambil Daftar Akun yang Tidak Follback
`GET /instagram/accounts/{account_id}/unfollowers?filter=all&search=kevin&page=1&limit=20`
- **Query Params:**
  - `filter`: `all` (Semua 184) atau `whitelisted` (Terlindungi 18)
  - `search`: string kata kunci pencarian username atau nama
  - `page`: nomor halaman
- **Response (`200 OK`):**
```json
{
  "total_count": 184,
  "whitelisted_count": 18,
  "anti_ban": {
    "used_today": 24,
    "quota_limit": 40,
    "remaining_quota": 16,
    "status": "Status: Aman"
  },
  "items": [
    {
      "target_ig_pk": "184920194",
      "target_username": "kevin_adiputra",
      "target_full_name": "Kevin Adiputra",
      "target_pic_url": "https://...",
      "is_whitelisted": false,
      "instagram_url": "https://instagram.com/kevin_adiputra",
      "unfollow_state": "NORMAL" // 'NORMAL', 'COOLDOWN', 'COMPLETED'
    },
    {
      "target_ig_pk": "739102849",
      "target_username": "fashion_bella",
      "target_full_name": "Bella C",
      "target_pic_url": "https://...",
      "is_whitelisted": true,
      "instagram_url": "https://instagram.com/fashion_bella",
      "unfollow_state": "NORMAL"
    }
  ]
}
```

### 4.2. Eksekusi Tindakan Unfollow Langsung
`POST /instagram/accounts/{account_id}/actions/unfollow`
- **Request Body:**
```json
{
  "target_ig_pk": "184920194",
  "target_username": "kevin_adiputra"
}
```
- **Response Sukses (`200 OK`):**
```json
{
  "status": "SUCCESS",
  "message": "Berhasil berhenti mengikuti @kevin_adiputra",
  "unfollow_state": "COMPLETED",
  "cooldown_seconds": 10,
  "quota": {
    "used_today": 25,
    "quota_limit": 40,
    "remaining_quota": 15
  }
}
```
- **Response Sedang Cooldown (`429 Too Many Requests`):**
```json
{
  "status": "RATE_LIMITED",
  "message": "Harap tunggu jeda aman sebelum unfollow berikutnya demi keamanan akun Anda",
  "remaining_cooldown_seconds": 8
}
```

---

## 5. Modul Riwayat Aktivitas (Activity Page)

### 5.1. Ambil Feed Aktivitas Terkelompok Tanggal
`GET /instagram/accounts/{account_id}/activities?filter=all`
- **Query Params:**
  - `filter`: `all`, `unfollowed`, `follower_baru`
- **Response (`200 OK`):**
```json
{
  "highlights": {
    "unfollowed_today": 12,
    "new_followers_today": 28
  },
  "groups": [
    {
      "date_title": "Hari Ini 9 Nov 2026",
      "activity_count": 3,
      "items": [
        {
          "id": "evt_01",
          "event_type": "UNFOLLOWED_YOU",
          "tag_label": "Unfollowed",
          "tag_color": "red",
          "target_username": "sarah_melinda",
          "target_full_name": "Sarah Melinda",
          "target_pic_url": "https://...",
          "timestamp_wib": "09:15 WIB",
          "instagram_url": "https://instagram.com/sarah_melinda"
        },
        {
          "id": "evt_02",
          "event_type": "NEW_FOLLOWER",
          "tag_label": "Follower Baru",
          "tag_color": "green",
          "target_username": "rizky_ramadhan",
          "target_full_name": "Rizky Ramadhan",
          "target_pic_url": "https://...",
          "timestamp_wib": "08:40 WIB",
          "instagram_url": "https://instagram.com/rizky_ramadhan"
        }
      ]
    },
    {
      "date_title": "Kemarin 8 Nov 2026",
      "activity_count": 3,
      "items": [
        {
          "id": "evt_04",
          "event_type": "UNFOLLOWED_YOU",
          "tag_label": "Unfollowed",
          "tag_color": "red",
          "target_username": "vintage_garage_id",
          "target_full_name": "Vintage Garage",
          "target_pic_url": "https://...",
          "timestamp_wib": "18:40 WIB",
          "instagram_url": "https://instagram.com/vintage_garage_id"
        }
      ]
    }
  ]
}
```

---

## 6. Modul List Terlindungi (Whitelist)

### 6.1. Toggle Status Terlindungi (Quick Protect/Unprotect)
`POST /instagram/accounts/{account_id}/whitelist/toggle`
- **Request Body:**
```json
{
  "target_ig_pk": "739102849",
  "target_username": "fashion_bella"
}
```
- **Response (`200 OK`):**
```json
{
  "status": "SUCCESS",
  "is_whitelisted": true,
  "message": "@fashion_bella sekarang berada dalam List Terlindungi"
}
```
