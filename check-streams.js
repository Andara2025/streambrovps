const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/streamflow.db');

console.log('=== Checking Streams ===\n');

// Check if stream exists
const streamId = 'e19b45a3-cc35-4b32-b85d-8db4121eaf2d';

db.get(`SELECT id, title, status FROM streams WHERE id = ?`, [streamId], (err, stream) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  if (stream) {
    console.log('Stream found:');
    console.log(`  ID: ${stream.id}`);
    console.log(`  Title: ${stream.title}`);
    console.log(`  Status: ${stream.status}`);
  } else {
    console.log('Stream NOT found!');
  }
  
  console.log('\n=== Testing JOIN Query ===\n');
  
  // Test the actual query used by findPending
  db.all(`
    SELECT ss.*, s.title, s.video_id, s.rtmp_url, s.stream_key, s.platform
    FROM stream_schedules ss
    JOIN streams s ON ss.stream_id = s.id
    WHERE ss.status = 'pending'
    ORDER BY ss.schedule_time ASC
  `, [], (err, rows) => {
    if (err) {
      console.error('Query Error:', err);
      db.close();
      return;
    }
    
    console.log(`Found ${rows.length} schedule(s) with JOIN:\n`);
    rows.forEach((row, index) => {
      console.log(`${index + 1}. Schedule ID: ${row.id}`);
      console.log(`   Stream ID: ${row.stream_id}`);
      console.log(`   Stream Title: ${row.title}`);
      console.log(`   Schedule Time: ${row.schedule_time}`);
      console.log(`   Is Recurring: ${row.is_recurring ? 'Yes' : 'No'}`);
      console.log(`   Recurring Days: ${row.recurring_days || 'N/A'}`);
      console.log('');
    });
    
    db.close();
  });
});
