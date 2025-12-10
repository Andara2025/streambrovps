const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/streamflow.db');

console.log('=== Checking Stream Schedules ===\n');

db.all(`SELECT id, stream_id, schedule_time, duration, status, is_recurring, recurring_days, created_at 
        FROM stream_schedules 
        ORDER BY created_at DESC 
        LIMIT 10`, [], (err, rows) => {
    if (err) {
        console.error('Error:', err);
        return;
    }

    console.log(`Found ${rows.length} schedule(s):\n`);
    rows.forEach((row, index) => {
        console.log(`${index + 1}. Schedule ID: ${row.id}`);
        console.log(`   Stream ID: ${row.stream_id}`);
        console.log(`   Schedule Time: ${row.schedule_time}`);
        console.log(`   Duration: ${row.duration} minutes`);
        console.log(`   Status: ${row.status}`);
        console.log(`   Is Recurring: ${row.is_recurring ? 'Yes' : 'No'}`);
        console.log(`   Recurring Days: ${row.recurring_days || 'N/A'}`);
        console.log(`   Created At: ${row.created_at}`);
        console.log('');
    });

    db.close();
});
