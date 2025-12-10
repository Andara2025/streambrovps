const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/streamflow.db');

const streamId = 'e19b45a3-cc35-4b32-b85d-8db4121eaf2d';

db.run(
  `UPDATE streams SET status = 'offline', start_time = NULL, end_time = NULL WHERE id = ?`,
  [streamId],
  function(err) {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log(`✓ Stream status fixed! Changes: ${this.changes}`);
      console.log('Stream is now ready for scheduler to start.');
    }
    db.close();
  }
);
