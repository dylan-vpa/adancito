const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database/adan.db');
const db = new Database(dbPath, { verbose: console.log });

try {
    const stmt = db.prepare('DELETE FROM chat_messages');
    const info = stmt.run();
    console.log(`✅ Success: Deleted ${info.changes} messages from chat history.`);
} catch (error) {
    console.error('❌ Error clearing messages:', error);
}

db.close();
