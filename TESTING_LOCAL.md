# 🧪 Panduan Testing StreamBro di Local

## ✅ Prerequisites Check

Sebelum testing, pastikan:
- ✅ Node.js v20+ terinstall
- ✅ FFmpeg terinstall (bundled atau system)
- ✅ Dependencies npm sudah terinstall
- ✅ File .env sudah dikonfigurasi

## 🚀 Langkah 1: Start Development Server

### Opsi A: Menggunakan nodemon (Auto-reload)
```bash
npm run dev
```

### Opsi B: Menggunakan node biasa
```bash
npm start
```

### Opsi C: Menggunakan PM2 (Production-like)
```bash
pm2 start app.js --name streambro-test
pm2 logs streambro-test
```

**Expected Output:**
```
StreamFlow running at:
  http://192.168.x.x:7575
  http://localhost:7575
Stream scheduler initialized
```

## 🌐 Langkah 2: Akses Aplikasi

Buka browser dan akses:
```
http://localhost:7575
```

### First Time Setup:
1. Akan redirect ke `/setup-account`
2. Buat akun admin pertama:
   - Username: `admin` (atau sesuai keinginan)
   - Password: minimal 8 karakter (harus ada huruf besar, kecil, dan angka)
   - Upload avatar (opsional)
3. Klik "Complete Setup"

## 📹 Langkah 3: Testing Upload Video

### A. Upload Video dari Local

1. Klik menu **"Gallery"**
2. Klik tombol **"Upload Video"**
3. Pilih file video (format: MP4, AVI, MOV, MKV)
4. Tunggu proses upload & processing
5. Video akan muncul di gallery dengan thumbnail

**Test Cases:**
- ✅ Upload video kecil (< 100MB)
- ✅ Upload video besar (> 500MB)
- ✅ Upload multiple videos
- ✅ Check thumbnail generation
- ✅ Check video metadata (duration, resolution, bitrate)

### B. Import dari Google Drive (Opsional)

1. Klik **"Connect YouTube"** di dashboard
2. Authorize Google OAuth
3. Gunakan fitur import dari Drive

## 🎬 Langkah 4: Testing Manual Streaming

### A. Setup RTMP Destination

**Untuk Testing Lokal, gunakan RTMP Test Server:**

#### Install RTMP Server (Opsional):
```bash
# Menggunakan Docker
docker run -d -p 1935:1935 --name rtmp-server tiangolo/nginx-rtmp
```

**Atau gunakan platform streaming:**
- YouTube Live: `rtmp://a.rtmp.youtube.com/live2/`
- Facebook Live: `rtmps://live-api-s.facebook.com:443/rtmp/`
- Twitch: `rtmp://live.twitch.tv/app/`

### B. Create Stream

1. Klik menu **"Dashboard"**
2. Klik tombol **"+ New Stream"**
3. Isi form:
   - **Title**: "Test Stream 1"
   - **Select Video**: Pilih video yang sudah diupload
   - **Platform**: YouTube / Custom
   - **RTMP Server**: `rtmp://localhost/live` (jika pakai local RTMP)
   - **Stream Key**: `test123`
   - **Advanced Settings**: 
     - Resolution: 1280x720
     - Bitrate: 2500 kbps
     - FPS: 30
     - Loop Video: ON
4. Klik **"Create Stream"**

### C. Start Streaming

1. Klik tombol **"Start"** pada stream card
2. Status akan berubah menjadi **"LIVE"** (merah)
3. Monitor logs dengan klik **"View Logs"**

**Expected Logs:**
```
Starting stream with command: ffmpeg -hwaccel auto -loglevel error -re ...
[FFmpeg] Stream started successfully
```

### D. Monitor Streaming

**Check di Dashboard:**
- ✅ Status badge berubah "LIVE" (merah)
- ✅ Start time tercatat
- ✅ Duration counter berjalan

**Check Logs:**
```bash
# Jika pakai PM2
pm2 logs streambro-test

# Atau check di UI
Klik "View Logs" pada stream card
```

**Expected FFmpeg Output:**
```
[FFmpeg] frame=  120 fps= 30 q=-1.0 size=    1024kB time=00:00:04.00 bitrate=2097.2kbits/s speed=1.00x
```

### E. Stop Streaming

1. Klik tombol **"Stop"** pada stream card
2. Status berubah menjadi **"OFFLINE"** (abu-abu)
3. Check history di menu **"History"**

**Verify:**
- ✅ End time tercatat
- ✅ Total duration calculated
- ✅ History entry created
- ✅ FFmpeg process terminated

## ⏰ Langkah 5: Testing Scheduled Streaming

### A. Create Scheduled Stream

1. Buat stream baru atau edit existing stream
2. Set **Schedule Time**: 2-3 menit dari sekarang
3. Set **Duration**: 5 menit
4. Klik **"Create Stream"** atau **"Update"**

**Status akan menjadi:** `SCHEDULED` (kuning)

### B. Monitor Scheduler

**Check Console Logs:**
```bash
pm2 logs streambro-test --lines 50
```

**Expected Output (setiap 60 detik):**
```
[Scheduler] Checking scheduled streams...
[Scheduler] Found 1 scheduled stream(s) to start
[Scheduler] Starting stream: abc-123 - Test Stream 1
[Scheduler] Successfully started: abc-123
```

### C. Verify Auto-Start

Tunggu hingga waktu schedule tiba (2-3 menit):

**Expected Behavior:**
- ✅ Stream otomatis start
- ✅ Status berubah "LIVE"
- ✅ FFmpeg process spawned
- ✅ Start time recorded

### D. Verify Auto-Stop (Duration)

Tunggu hingga durasi selesai (5 menit):

**Expected Behavior:**
- ✅ Stream otomatis stop
- ✅ Status berubah "OFFLINE"
- ✅ FFmpeg process terminated
- ✅ History entry created

## 🔄 Langkah 6: Testing Recurring Schedule

### A. Create Recurring Schedule

1. Buat stream baru
2. Enable **"Recurring Schedule"**
3. Pilih hari: Senin, Rabu, Jumat
4. Set waktu: 09:00 AM
5. Set duration: 60 menit
6. Save

### B. Verify Schedule Logic

**Check Database:**
```bash
# Buka SQLite database
sqlite3 db/streams.db

# Query schedules
SELECT * FROM stream_schedules WHERE is_recurring = 1;
```

**Expected:**
```
id | stream_id | schedule_time | duration | is_recurring | recurring_days
---|-----------|---------------|----------|--------------|---------------
1  | abc-123   | 09:00:00      | 60       | 1            | 1,3,5
```

### C. Test Recurring Execution

**Cara cepat test (tanpa tunggu hari):**

1. Edit `services/schedulerService.js` sementara:
```javascript
// Ubah interval dari 60000 (1 menit) ke 10000 (10 detik)
scheduleIntervalId = setInterval(checkScheduledStreams, 10000);
```

2. Set recurring schedule untuk hari ini dengan waktu 1-2 menit ke depan
3. Monitor logs
4. Verify stream start otomatis

## 🎯 Langkah 7: Testing Stream Templates

### A. Create Template

1. Klik **"Stream Templates"** di dashboard
2. Klik **"+ New Template"**
3. Isi form:
   - **Template Name**: "Daily Morning Stream"
   - **Platform**: YouTube
   - **RTMP Server**: `rtmp://a.rtmp.youtube.com/live2/`
   - **Stream Key**: (kosongkan atau isi default)
   - **Resolution**: 1920x1080
   - **Bitrate**: 4500
   - **FPS**: 60
4. Save template

### B. Use Template

1. Saat create new stream
2. Klik **"Load from Template"**
3. Pilih template "Daily Morning Stream"
4. Form auto-fill dengan settings dari template
5. Tinggal pilih video dan adjust stream key

**Verify:**
- ✅ All settings loaded correctly
- ✅ Can modify after loading
- ✅ Template reusable

## 🎵 Langkah 8: Testing Playlist Streaming

### A. Create Playlist

1. Upload beberapa video (minimal 3)
2. Klik **"Create Playlist"**
3. Isi nama: "Test Playlist"
4. Drag & drop video untuk arrange order
5. Enable **"Shuffle"** (opsional)
6. Save playlist

### B. Stream Playlist

1. Create new stream
2. Pilih **"Playlist"** sebagai content type
3. Pilih playlist yang sudah dibuat
4. Enable **"Loop"**
5. Start stream

**Expected Behavior:**
- ✅ FFmpeg uses concat demuxer
- ✅ Videos play in sequence
- ✅ Loop back to first video after last
- ✅ Smooth transitions between videos

**Check Logs:**
```
[StreamingService] Using playlist mode with 3 videos
[FFmpeg] Concat file created: temp/playlist_abc-123.txt
```

## 🔍 Langkah 9: Testing Error Handling

### A. Test Invalid RTMP URL

1. Create stream dengan RTMP URL invalid: `rtmp://invalid-server.com/live`
2. Start stream
3. **Expected**: Error message muncul, stream tidak start

### B. Test Missing Video

1. Delete video file dari `public/uploads/videos/`
2. Try start stream yang menggunakan video tersebut
3. **Expected**: Error "Video file not found"

### C. Test FFmpeg Crash Recovery

1. Start stream
2. Kill FFmpeg process manual:
```bash
# Find FFmpeg PID
ps aux | grep ffmpeg

# Kill process
kill -9 <PID>
```
3. **Expected**: Auto-retry up to 3 times

### D. Test Concurrent Streams

1. Create 3 streams dengan video berbeda
2. Start semua streams bersamaan
3. **Expected**: All streams running simultaneously

**Monitor Resource:**
```bash
# CPU & Memory usage
pm2 monit

# Or use htop
htop
```

## 📊 Langkah 10: Testing Monitoring & Logs

### A. Real-time Logs

1. Start stream
2. Klik **"View Logs"** pada stream card
3. **Verify**: Logs update real-time setiap beberapa detik

### B. Stream History

1. Stop stream yang sudah running
2. Klik menu **"History"**
3. **Verify**:
   - ✅ Entry created dengan correct data
   - ✅ Duration calculated correctly
   - ✅ Thumbnail displayed
   - ✅ Can delete history entry

### C. System Monitor

Check di Dashboard:
- ✅ Active streams count
- ✅ Total videos
- ✅ Storage usage
- ✅ System resources (CPU, RAM)

## 🐛 Common Issues & Solutions

### Issue 1: Port Already in Use
```bash
# Windows
netstat -ano | findstr :7575
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :7575
kill -9 <PID>
```

### Issue 2: FFmpeg Not Found
```bash
# Check FFmpeg path
where ffmpeg  # Windows
which ffmpeg  # Linux/Mac

# Update .env if needed
FFMPEG_PATH=/path/to/ffmpeg
```

### Issue 3: Database Locked
```bash
# Stop all processes
pm2 stop all

# Remove lock
rm db/*.db-shm db/*.db-wal

# Restart
pm2 start all
```

### Issue 4: Upload Failed
```bash
# Check permissions
chmod -R 755 public/uploads/

# Check disk space
df -h
```

### Issue 5: Stream Won't Start
**Check:**
1. Video file exists
2. RTMP URL valid
3. FFmpeg installed
4. No other stream using same stream key
5. Check logs for detailed error

## ✅ Testing Checklist

### Basic Features
- [ ] User registration & login
- [ ] Upload video (small & large)
- [ ] Create stream
- [ ] Start/stop stream manually
- [ ] View stream logs
- [ ] Check stream history

### Advanced Features
- [ ] Schedule stream (one-time)
- [ ] Schedule stream (recurring)
- [ ] Auto-start scheduled stream
- [ ] Auto-stop by duration
- [ ] Create & use templates
- [ ] Create & stream playlist
- [ ] Shuffle playlist

### Error Handling
- [ ] Invalid RTMP URL
- [ ] Missing video file
- [ ] FFmpeg crash recovery
- [ ] Concurrent streams
- [ ] Network interruption

### Performance
- [ ] Multiple concurrent streams
- [ ] Large file upload
- [ ] Long-running stream (> 1 hour)
- [ ] Memory leak check
- [ ] CPU usage monitoring

## 📝 Test Report Template

```markdown
## Test Report - [Date]

### Environment
- OS: Windows 11 / Ubuntu 22.04
- Node.js: v20.13.1
- FFmpeg: 4.4.2
- Browser: Chrome 120

### Test Results

#### Manual Streaming
- ✅ Create stream: PASS
- ✅ Start stream: PASS
- ✅ Stop stream: PASS
- ✅ View logs: PASS

#### Scheduled Streaming
- ✅ One-time schedule: PASS
- ✅ Recurring schedule: PASS
- ✅ Auto-start: PASS
- ✅ Auto-stop: PASS

#### Issues Found
1. [Issue description]
   - Severity: High/Medium/Low
   - Steps to reproduce: ...
   - Expected: ...
   - Actual: ...

### Performance Metrics
- Concurrent streams: 3
- CPU usage: 45%
- Memory usage: 512MB
- Stream stability: 99.9%
```

## 🎓 Tips Testing

1. **Start Simple**: Test basic features dulu sebelum advanced
2. **Use Test Data**: Jangan pakai production data
3. **Monitor Logs**: Selalu check console & PM2 logs
4. **Test Edge Cases**: Invalid input, missing files, etc.
5. **Document Issues**: Catat semua bug yang ditemukan
6. **Performance Test**: Test dengan multiple concurrent streams
7. **Clean Up**: Hapus test data setelah selesai

## 🚀 Next Steps

Setelah testing lokal berhasil:
1. Deploy ke VPS staging
2. Test di environment production-like
3. Load testing dengan tools seperti Apache Bench
4. Security testing
5. Deploy ke production

---

**Happy Testing! 🎉**
