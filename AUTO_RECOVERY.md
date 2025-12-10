# Auto-Recovery System

## Overview
StreamBro memiliki sistem **Auto-Recovery** yang secara otomatis me-restart stream yang masih aktif setelah server restart atau VPS down.

## Cara Kerja

### 1. Saat Server Shutdown (Graceful)
- Semua stream yang sedang live akan di-stop dengan benar
- Status di database direset ke 'offline'
- FFmpeg process di-terminate dengan clean
- Ini mencegah "ghost streams" (status live tapi FFmpeg sudah mati)

### 2. Saat Server Startup (Auto-Recovery)
Server akan otomatis:
1. **Reset semua status** stream yang tertinggal ke 'offline'
2. **Cek database** untuk schedule yang seharusnya masih aktif
3. **Auto-restart stream** yang masih dalam jadwal aktif
4. **Hitung sisa durasi** dan lanjutkan streaming

### 3. Kondisi Recovery

Stream akan di-recover jika:

#### Recurring Schedule (Harian)
- Hari ini termasuk dalam `recurring_days`
- Waktu sekarang berada dalam window jadwal (start time - end time)
- Status schedule: `pending` atau `active`

**Contoh:**
- Schedule: 18:35 - 23:00 (setiap hari)
- Server restart jam 20:00
- ✅ Stream akan auto-restart dengan sisa durasi 3 jam

#### One-Time Schedule
- Waktu sekarang berada antara start time dan end time
- Status schedule: `pending` atau `active`

**Contoh:**
- Schedule: 2024-12-10 18:35 - 23:00
- Server restart jam 20:00 (masih di tanggal yang sama)
- ✅ Stream akan auto-restart dengan sisa durasi 3 jam

## Skenario Penggunaan

### Skenario 1: VPS Restart Mendadak
```
1. Stream sedang live (18:35 - 23:00)
2. VPS restart jam 20:00
3. Server startup otomatis (via PM2/systemd)
4. Auto-recovery detect schedule masih aktif
5. Stream auto-restart dengan sisa 3 jam
```

### Skenario 2: Update Code (Manual Restart)
```
1. Stream sedang live
2. Developer restart server untuk update
3. Auto-recovery detect schedule masih aktif
4. Stream auto-restart otomatis
```

### Skenario 3: Server Crash
```
1. Stream sedang live
2. Server crash/error
3. PM2 auto-restart server
4. Auto-recovery detect dan restart stream
```

## Log Output

Saat server startup, Anda akan melihat log seperti ini:

```
[Recovery] Starting auto-recovery for active streams...
[Recovery] Found 2 schedule(s) to check
[Recovery] Recurring schedule abc-123 should be active now (18:35 - 23:00)
[Recovery] Recovering stream xyz-456 (Melayu 1)
Starting stream: ffmpeg -hwaccel auto -loglevel error ...
[Recovery] ✓ Successfully recovered stream xyz-456, remaining: 180 minutes
[Recovery] ✓ Successfully recovered 1 stream(s)
```

## Konfigurasi

### Delay Recovery
Default: 3 detik setelah server start
```javascript
setTimeout(async () => {
  await streamingService.recoverActiveStreams();
}, 3000); // 3 seconds
```

Anda bisa ubah delay ini di `app.js` jika perlu waktu lebih lama untuk inisialisasi.

## Production Setup

### Dengan PM2 (Recommended)
```bash
# Install PM2
npm install -g pm2

# Start dengan PM2
pm2 start ecosystem.config.js

# Auto-start on boot
pm2 startup
pm2 save
```

PM2 akan:
- Auto-restart server jika crash
- Keep server running setelah VPS reboot
- Auto-recovery akan handle stream restart

### Dengan Systemd (Linux)
```bash
# Create service file
sudo nano /etc/systemd/system/streambro.service

# Enable auto-start
sudo systemctl enable streambro
sudo systemctl start streambro
```

## Limitasi

### Yang TIDAK Bisa Di-Recovery:
1. **Stream manual** (tanpa schedule) - Tidak ada informasi kapan harus stop
2. **Schedule yang sudah selesai** - End time sudah lewat
3. **Schedule di hari yang berbeda** (untuk recurring) - Bukan hari yang diizinkan

### Yang Bisa Di-Recovery:
1. ✅ Recurring schedule yang masih dalam window waktu
2. ✅ One-time schedule yang masih dalam window waktu
3. ✅ Stream dengan durasi tersisa minimal 1 menit

## Troubleshooting

### Stream Tidak Auto-Recover

**Cek log server:**
```bash
# Jika pakai PM2
pm2 logs

# Jika manual
# Lihat console output
```

**Kemungkinan penyebab:**
1. Schedule sudah expired (end time lewat)
2. Recurring schedule tapi bukan hari yang diizinkan
3. Status schedule bukan 'pending' atau 'active'
4. Error saat start stream (cek RTMP URL/key)

### Recovery Terlalu Cepat/Lambat

Edit delay di `app.js`:
```javascript
setTimeout(async () => {
  await streamingService.recoverActiveStreams();
}, 5000); // Ubah ke 5 detik
```

## Best Practices

1. **Gunakan PM2** untuk production - Auto-restart otomatis
2. **Monitor logs** - Pastikan recovery berjalan dengan benar
3. **Test recovery** - Restart server saat ada schedule aktif
4. **Backup database** - Jaga data schedule tetap aman
5. **Set proper duration** - Jangan terlalu pendek (minimal 5 menit)

## FAQ

**Q: Apakah stream akan restart dari awal video?**
A: Ya, stream akan restart dari awal video dengan sisa durasi yang tersisa.

**Q: Bagaimana jika VPS down lebih lama dari durasi schedule?**
A: Stream tidak akan di-recover karena end time sudah lewat.

**Q: Apakah bisa disable auto-recovery?**
A: Ya, comment out bagian recovery di `app.js` (baris `setTimeout(async () => { await streamingService.recoverActiveStreams(); ...`).

**Q: Apakah auto-recovery memakan RAM?**
A: Minimal, hanya berjalan sekali saat startup (3 detik setelah server start).

## Summary

Auto-Recovery System memastikan stream Anda tetap berjalan meskipun terjadi:
- ✅ VPS restart
- ✅ Server crash
- ✅ Manual restart untuk update
- ✅ Network issue yang menyebabkan restart

Sistem ini sangat penting untuk production environment dimana uptime adalah prioritas!
