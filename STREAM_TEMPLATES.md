# Stream Templates Feature

## Overview
Stream Templates memungkinkan user untuk save dan load konfigurasi stream lengkap, sehingga tidak perlu setup ulang setiap kali membuat stream baru.

## Fitur

### 1. **Save Template** 💾
Simpan konfigurasi stream saat ini sebagai template yang bisa digunakan kembali.

**Yang disimpan:**
- Video yang dipilih
- Stream title
- RTMP URL & Stream Key
- Platform (YouTube, Facebook, TikTok, dll)
- Loop video setting
- Schedule settings (waktu start/end)
- Recurring patterns (hari-hari berulang)
- Advanced settings (jika ada)

**Cara menggunakan:**
1. Setup stream configuration di modal "Create New Stream"
2. Klik button **"Save"** di header modal
3. Masukkan nama template dan deskripsi (optional)
4. Klik "Save Template"

### 2. **Load Template** 📂
Load template yang sudah disimpan untuk quick setup.

**Cara menggunakan:**
1. Klik button **"Load"** di header modal
2. Pilih template dari list
3. Semua field akan terisi otomatis
4. Edit jika perlu, lalu create stream

### 3. **Export Template** 📤
Export template ke file JSON untuk backup atau sharing.

**Cara menggunakan:**
1. Klik button **"Load"** untuk membuka template list
2. Klik icon **download** pada template yang ingin di-export
3. File JSON akan terdownload otomatis

**Kegunaan:**
- Backup konfigurasi
- Share template ke team/teman
- Version control
- Migration antar server

### 4. **Import Template** 📥
Import template dari file JSON.

**Cara menggunakan:**
1. Klik button **"Import"** di header modal
2. Pilih file JSON template
3. Template akan ditambahkan ke list

### 5. **Delete Template** 🗑️
Hapus template yang tidak diperlukan.

**Cara menggunakan:**
1. Klik button **"Load"** untuk membuka template list
2. Klik icon **trash** pada template yang ingin dihapus
3. Confirm deletion

## Database Schema

```sql
CREATE TABLE stream_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  video_id TEXT,
  video_name TEXT,
  stream_title TEXT,
  rtmp_url TEXT,
  stream_key TEXT,
  platform TEXT,
  loop_video BOOLEAN DEFAULT 1,
  schedules TEXT,  -- JSON array
  use_advanced_settings BOOLEAN DEFAULT 0,
  advanced_settings TEXT,  -- JSON object
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## API Endpoints

### GET `/api/templates`
Get all templates for current user.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "YouTube Gaming Setup",
    "description": "1080p gaming stream",
    "video_name": "gameplay.mp4",
    "platform": "YouTube",
    "created_at": "2024-01-01 10:00:00",
    "updated_at": "2024-01-01 10:00:00"
  }
]
```

### GET `/api/templates/:id`
Get single template with full details.

**Response:**
```json
{
  "id": "uuid",
  "name": "YouTube Gaming Setup",
  "description": "1080p gaming stream",
  "video_id": "video-uuid",
  "video_name": "gameplay.mp4",
  "stream_title": "Live Gaming Stream",
  "rtmp_url": "rtmps://a.rtmp.youtube.com/live2",
  "stream_key": "xxxx-xxxx-xxxx-xxxx",
  "platform": "YouTube",
  "loop_video": true,
  "schedules": [
    {
      "time": "20:00",
      "duration": 120,
      "is_recurring": true,
      "recurring_days": "1,2,3,4,5"
    }
  ],
  "use_advanced_settings": false,
  "advanced_settings": {}
}
```

### POST `/api/templates`
Create new template.

**Request Body:**
```json
{
  "name": "Template Name",
  "description": "Optional description",
  "video_id": "video-uuid",
  "video_name": "video.mp4",
  "stream_title": "Stream Title",
  "rtmp_url": "rtmps://...",
  "stream_key": "xxxx-xxxx",
  "platform": "YouTube",
  "loop_video": true,
  "schedules": [...],
  "use_advanced_settings": false,
  "advanced_settings": {}
}
```

### PUT `/api/templates/:id`
Update existing template.

### DELETE `/api/templates/:id`
Delete template.

### GET `/api/templates/:id/export`
Export template as JSON file.

### POST `/api/templates/import`
Import template from JSON.

## UI Components

### Template Buttons (Modal Header)
- **Load** - Blue button untuk load template
- **Save** - Green button untuk save template
- **Import** - Purple button untuk import JSON

### Template Selector Modal
Modal untuk memilih template yang akan di-load.

**Features:**
- List semua templates
- Search/filter (future enhancement)
- Quick actions (export, delete)
- Template preview info

### Save Template Modal
Modal untuk save konfigurasi sebagai template baru.

**Fields:**
- Template Name (required)
- Description (optional)

## Use Cases

### 1. Daily Streaming
Save template untuk daily stream dengan schedule recurring.

**Example:**
- Name: "Daily Gaming Stream"
- Schedule: 20:00 - 22:00
- Recurring: Mon-Fri
- Platform: YouTube

### 2. Multi-Platform Streaming
Save template untuk setiap platform.

**Examples:**
- "YouTube 1080p Setup"
- "Facebook Live Standard"
- "TikTok Stream Config"

### 3. Team Collaboration
Export template dan share ke team members.

### 4. Backup & Recovery
Export semua templates untuk backup sebelum migration.

## Future Enhancements

- [ ] Template categories/tags
- [ ] Template sharing (public templates)
- [ ] Template marketplace
- [ ] Bulk export/import
- [ ] Template versioning
- [ ] Template preview before load
- [ ] Search & filter templates
- [ ] Template usage statistics

## Notes

- Templates are user-specific (tidak bisa dilihat user lain)
- Stream key disimpan dalam template (hati-hati saat export/share)
- Schedules disimpan sebagai JSON array
- Advanced settings disimpan sebagai JSON object
- Template name harus unique per user (future enhancement)
