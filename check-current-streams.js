const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/streamflow.db');

console.log('=== Current Streams Status ===\n');

db.all(`
  SELECT id, title, status, start_time, end_time, created_at 
  FROM streams 
  ORDER BY created_at DESC 
  LIMIT 5
`, [], (err, streams) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log(`Found ${streams.length} recent stream(s):\n`);
  
  streams.forEach((stream, index) => {
    console.log(`${index + 1}. ${stream.title}`);
    console.log(`   ID: ${stream.id}`);
    console.log(`   Status: ${stream.status}`);
    console.log(`   Start Time: ${stream.start_time || 'N/A'}`);
    console.log(`   End Time: ${stream.end_time || 'N/A'}`);
    console.log(`   Created: ${stream.created_at}`);
    
    if (stream.status === 'live') {
      console.log('   🔴 LIVE NOW!');
    } else if (stream.status === 'scheduled') {
      console.log('   🗓️  SCHEDULED');
    } else {
      console.log('   ⚫ OFFLINE');
    }
    console.log('');
  });
  
  db.close();
});
