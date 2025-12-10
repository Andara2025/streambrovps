const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/streamflow.db');

console.log('=== Active Streams Check ===\n');

// Check all live streams
db.all(`
  SELECT id, title, stream_key, status, start_time 
  FROM streams 
  WHERE status = 'live'
  ORDER BY start_time DESC
`, [], (err, streams) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  console.log(`Found ${streams.length} LIVE stream(s):\n`);
  
  if (streams.length === 0) {
    console.log('No active streams found.');
    db.close();
    return;
  }
  
  const streamKeyGroups = {};
  
  streams.forEach((stream, index) => {
    console.log(`${index + 1}. ${stream.title}`);
    console.log(`   ID: ${stream.id}`);
    console.log(`   Stream Key: ${stream.stream_key}`);
    console.log(`   Status: ${stream.status}`);
    console.log(`   Start Time: ${stream.start_time}`);
    console.log('');
    
    // Group by stream key
    if (!streamKeyGroups[stream.stream_key]) {
      streamKeyGroups[stream.stream_key] = [];
    }
    streamKeyGroups[stream.stream_key].push(stream);
  });
  
  // Check for duplicates
  console.log('\n=== Duplicate Stream Key Check ===\n');
  let hasDuplicates = false;
  
  Object.keys(streamKeyGroups).forEach(key => {
    if (streamKeyGroups[key].length > 1) {
      hasDuplicates = true;
      console.log(`⚠️  DUPLICATE FOUND! Stream key "${key}" is used by ${streamKeyGroups[key].length} streams:`);
      streamKeyGroups[key].forEach(s => {
        console.log(`   - ${s.title} (${s.id})`);
      });
      console.log('');
    }
  });
  
  if (!hasDuplicates) {
    console.log('✓ No duplicate stream keys found.');
  }
  
  db.close();
});
