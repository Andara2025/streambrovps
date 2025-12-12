# Analisis Video & Koneksi: 1080p @ 4000 kbps

## 📊 Status Setting Saat Ini

Berdasarkan kode yang ada, sistem menggunakan:

### Default Settings (use_advanced_settings = false)
```javascript
const defaultBitrate = 4000;  // 4000 kbps
const defaultFps = 30;
// Tidak ada setting resolusi default (akan menggunakan resolusi video asli)
```

### Advanced Settings (use_advanced_settings = true)
```javascript
const resolution = stream.resolution || '1280x720';  // Default 720p
const bitrate = stream.bitrate || 2500;  // Default 2500 kbps
const fps = stream.fps || 30;
```

## ⚠️ MASALAH UTAMA: 1080p @ 4000 kbps

### 1. **Bitrate Tidak Cukup untuk 1080p**

**Rekomendasi Bitrate untuk Live Streaming:**

| Resolusi | Bitrate Minimum | Bitrate Optimal | Bitrate Maksimal |
|----------|----------------|-----------------|------------------|
| 720p 30fps | 2,500 kbps | 3,000-4,500 kbps | 6,000 kbps |
| 1080p 30fps | 4,500 kbps | 6,000-8,000 kbps | 12,000 kbps |
| 1080p 60fps | 6,000 kbps | 9,000-12,000 kbps | 15,000 kbps |

**Kesimpulan:** 4000 kbps untuk 1080p itu **TERLALU RENDAH** ❌

### 2. **Masalah yang Terjadi dengan 1080p @ 4000 kbps:**

#### A. **Kualitas Video Buruk**
- Pixelation (gambar kotak-kotak)
- Blur pada gerakan cepat
- Loss of detail pada scene kompleks
- Banding pada gradien warna

#### B. **Koneksi Issues**
- **Buffer underrun**: FFmpeg tidak bisa maintain bitrate yang konsisten
- **Frame drops**: Encoder skip frames untuk maintain bitrate
- **Stuttering**: Video tersendat-sendat
- **Connection drops**: Platform streaming reject karena quality terlalu rendah

#### C. **Encoding Stress**
```javascript
'-preset', 'veryfast',  // Fast encoding tapi quality lebih rendah
'-tune', 'zerolatency', // Low latency tapi quality trade-off
```
- Preset `veryfast` + bitrate rendah = kualitas sangat buruk
- Encoder harus compress terlalu banyak data ke bitrate kecil

### 3. **Bandwidth Requirements**

**Upload Speed yang Dibutuhkan:**

| Setting | Bitrate Video | Audio | Total | Upload Minimum |
|---------|--------------|-------|-------|----------------|
| 720p @ 3000 kbps | 3,000 kbps | 128 kbps | 3,128 kbps | **5 Mbps** |
| 1080p @ 4000 kbps | 4,000 kbps | 128 kbps | 4,128 kbps | **6 Mbps** ⚠️ |
| 1080p @ 6000 kbps | 6,000 kbps | 128 kbps | 6,128 kbps | **8 Mbps** ✅ |
| 1080p @ 8000 kbps | 8,000 kbps | 128 kbps | 8,128 kbps | **10 Mbps** ✅ |

**Catatan:** Upload speed harus **1.5x - 2x** dari total bitrate untuk stability!

### 4. **FFmpeg Buffer Settings**

Kode saat ini:
```javascript
'-bufsize', `${defaultBitrate * 2}k`,  // 8000k untuk 4000 kbps
```

**Masalah:**
- Buffer terlalu kecil untuk 1080p
- Tidak ada rate control yang baik
- Tidak ada adaptive bitrate

## 🔧 SOLUSI & REKOMENDASI

### Solusi 1: **Gunakan 720p @ 4000 kbps** (RECOMMENDED) ✅

**Kenapa ini optimal:**
- 4000 kbps sangat bagus untuk 720p
- Kualitas excellent
- Stabil di koneksi 5-6 Mbps
- CPU usage lebih rendah
- Compatible dengan semua platform

**Setting:**
```javascript
resolution: '1280x720'
bitrate: 4000
fps: 30
```

### Solusi 2: **Naikkan Bitrate untuk 1080p** ✅

**Jika HARUS 1080p:**
```javascript
resolution: '1920x1080'
bitrate: 6000  // Minimum untuk quality bagus
fps: 30
```

**Requirements:**
- Upload speed minimum: **8 Mbps**
- Upload speed recommended: **10 Mbps**
- CPU yang lebih kuat

### Solusi 3: **Adaptive Settings Berdasarkan Koneksi** ✅

Tambahkan preset quality:

```javascript
const QUALITY_PRESETS = {
  'low': {
    resolution: '854x480',
    bitrate: 1500,
    fps: 30,
    uploadRequired: '2.5 Mbps'
  },
  'medium': {
    resolution: '1280x720',
    bitrate: 3000,
    fps: 30,
    uploadRequired: '5 Mbps'
  },
  'high': {
    resolution: '1280x720',
    bitrate: 4500,
    fps: 30,
    uploadRequired: '6 Mbps'
  },
  'full-hd': {
    resolution: '1920x1080',
    bitrate: 6000,
    fps: 30,
    uploadRequired: '8 Mbps'
  },
  'full-hd-high': {
    resolution: '1920x1080',
    bitrate: 8000,
    fps: 30,
    uploadRequired: '10 Mbps'
  }
};
```

### Solusi 4: **Improve FFmpeg Settings untuk 1080p**

```javascript
// Untuk 1080p yang lebih baik
const ffmpegArgs = [
  '-hwaccel', 'auto',
  '-loglevel', 'error',
  '-re',
  '-stream_loop', loopValue,
  '-fflags', '+genpts+igndts',
  '-avoid_negative_ts', 'make_zero',
  '-i', videoPath,
  
  // Video encoding
  '-c:v', 'libx264',
  '-preset', 'medium',  // ← Ubah dari 'veryfast' ke 'medium' untuk quality lebih baik
  '-tune', 'film',      // ← Ubah dari 'zerolatency' ke 'film' untuk quality
  '-profile:v', 'high', // ← Tambahkan profile
  '-level', '4.1',      // ← Tambahkan level
  
  // Bitrate control
  '-b:v', '6000k',      // ← Naikkan bitrate
  '-maxrate', '7000k',  // ← Maxrate sedikit lebih tinggi
  '-bufsize', '12000k', // ← Buffer 2x bitrate
  
  // Quality settings
  '-pix_fmt', 'yuv420p',
  '-g', '60',           // ← Keyframe setiap 2 detik (30fps * 2)
  '-keyint_min', '30',
  '-sc_threshold', '0',
  '-s', '1920x1080',
  '-r', '30',
  
  // Audio
  '-c:a', 'aac',
  '-b:a', '192k',       // ← Naikkan audio bitrate
  '-ar', '48000',       // ← Naikkan sample rate
  
  // Streaming
  '-max_muxing_queue_size', '9999',
  '-muxdelay', '0',
  '-muxpreload', '0',
  '-f', 'flv',
  rtmpUrl
];
```

## 📋 CHECKLIST TROUBLESHOOTING

### Jika Stream Terputus-putus:

- [ ] **Cek upload speed**: Harus minimal 1.5x dari bitrate
  ```bash
  # Test upload speed
  speedtest-cli
  ```

- [ ] **Cek CPU usage**: Jangan sampai 100%
  ```bash
  # Windows
  taskmgr
  
  # Linux
  htop
  ```

- [ ] **Cek FFmpeg logs**: Lihat error messages
  ```javascript
  // Di dashboard, klik "View Logs" pada stream
  ```

- [ ] **Cek platform limits**: 
  - YouTube: Max 51 Mbps
  - Facebook: Max 4 Mbps (720p recommended)
  - TikTok: Max 3 Mbps (720p only)
  - Twitch: Max 6 Mbps

### Jika Kualitas Buruk:

- [ ] **Naikkan bitrate** (jika koneksi kuat)
- [ ] **Turunkan resolusi** (jika koneksi lemah)
- [ ] **Ubah preset** dari `veryfast` ke `medium`
- [ ] **Cek source video quality**: Jangan upscale video low quality

### Jika Connection Drops:

- [ ] **Stabilkan koneksi**: Gunakan kabel ethernet, bukan WiFi
- [ ] **Reduce bitrate**: Turunkan 20-30%
- [ ] **Check RTMP server**: Ping ke server streaming
- [ ] **Firewall/Router**: Pastikan port tidak diblock

## 🎯 REKOMENDASI FINAL

### Untuk Koneksi Standar (5-10 Mbps Upload):
```
✅ 720p @ 4000 kbps, 30fps
   - Kualitas excellent
   - Sangat stabil
   - CPU friendly
```

### Untuk Koneksi Kuat (10-20 Mbps Upload):
```
✅ 1080p @ 6000-8000 kbps, 30fps
   - Kualitas premium
   - Butuh CPU lebih kuat
   - Preset: medium atau slow
```

### Untuk Koneksi Lemah (2-5 Mbps Upload):
```
✅ 720p @ 2500-3000 kbps, 30fps
   atau
✅ 480p @ 1500-2000 kbps, 30fps
```

## 🔍 DIAGNOSIS CEPAT

**Gejala:** Stream buffering/terputus
**Penyebab:** Bitrate terlalu tinggi untuk upload speed
**Solusi:** Turunkan bitrate atau resolusi

**Gejala:** Video pixelated/blur
**Penyebab:** Bitrate terlalu rendah untuk resolusi
**Solusi:** Naikkan bitrate atau turunkan resolusi

**Gejala:** CPU 100%, stream lag
**Penyebab:** Preset terlalu slow atau resolusi terlalu tinggi
**Solusi:** Gunakan preset veryfast atau turunkan resolusi

**Gejala:** Platform reject stream
**Penyebab:** Bitrate/resolusi tidak sesuai platform limits
**Solusi:** Cek platform requirements dan adjust

## 📝 KESIMPULAN

**1080p @ 4000 kbps TIDAK OPTIMAL** karena:
1. Bitrate terlalu rendah → kualitas buruk
2. Encoder stress → frame drops
3. Connection unstable → buffering
4. Platform mungkin reject → poor quality

**SOLUSI TERBAIK:**
- Gunakan **720p @ 4000 kbps** untuk hasil optimal
- Atau naikkan ke **1080p @ 6000-8000 kbps** jika koneksi kuat
- Tambahkan quality presets di UI untuk user pilih sesuai koneksi

