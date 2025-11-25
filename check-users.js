const { db } = require('./db/database');

console.log('\n===== Daftar User di Database =====\n');

db.all('SELECT id, username, user_role, status, created_at FROM users', [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  
  if (rows.length === 0) {
    console.log('❌ Tidak ada user di database.');
  } else {
    console.log(`Ditemukan ${rows.length} user:\n`);
    rows.forEach((user, index) => {
      console.log(`${index + 1}. Username: ${user.username}`);
      console.log(`   Role: ${user.user_role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Dibuat: ${user.created_at}`);
      console.log('');
    });
    
    console.log('\n⚠️  CATATAN: Password tidak ditampilkan karena sudah di-hash (terenkripsi).');
    console.log('Untuk reset password, jalankan: node reset-password.js\n');
  }
  
  db.close();
});
