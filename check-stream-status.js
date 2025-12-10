const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/streamflow.db');

console.log('=== Checking Stream Status ===\n');

// Check streams
db.all(`
  SELECT 
    id, 
    title, 
    status, 
    datetime(start_time, 'localtime') as start_time,
    datetime(schedule_time, 'localtime') as schedule_time,
    duration
  FROM streams 
  ORDER BY id DESC 
  LIMIT 5
`, (err, streams) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  console.log('Recent Streams:');
  console.table(streams);
  
  // Check schedules
  db.all(`
    SELECT 
      id,
      stream_id,
      datetime(schedule_time, 'localtime') as schedule_time,
      duration,
      status,
      is_recurring,
      recurring_days
    FROM stream_schedules
    ORDER BY id DESC
    LIMIT 10
  `, (err, schedules) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('\nRecent Schedules:');
      console.table(schedules);
    }
    
    db.close();
  });
});
