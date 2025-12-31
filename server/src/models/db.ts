import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Database path from environment or default
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../database/adan.db');

// Ensure the database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`📁 Created database directory: ${dbDir}`);
}

// Initialize database
const db = new Database(DB_PATH, { verbose: console.log });

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Initialize database schema
 * Creates all tables if they don't exist
 */
export function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      avatar_url TEXT,
      referral_code TEXT UNIQUE,
      referred_by TEXT,
      total_referrals INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (referred_by) REFERENCES users(id)
    )
  `);

  // Projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT CHECK(status IN ('active', 'completed', 'archived')) DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Project deliverables/steps table
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_deliverables (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      step_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      eden_level TEXT,
      status TEXT CHECK(status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
      chat_id TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (chat_id) REFERENCES chat_sessions(id) ON DELETE SET NULL
    )
  `);

  // Chat sessions table (updated with project_id)
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      project_id TEXT,
      title TEXT NOT NULL,
      status TEXT CHECK(status IN ('active', 'archived')) DEFAULT 'active',
      last_active TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    )
  `);

  // Chat messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT CHECK(role IN ('user', 'assistant')) NOT NULL,
      content TEXT NOT NULL,
      code_language TEXT,
      code_content TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // User coins table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_coins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE NOT NULL,
      total_coins INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Coin transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS coin_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      price REAL NOT NULL,
      paypal_order_id TEXT,
      transaction_type TEXT CHECK(transaction_type IN ('purchase', 'refund', 'usage')) DEFAULT 'purchase',
      status TEXT CHECK(status IN ('completed', 'pending', 'failed')) DEFAULT 'completed',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // User feedback table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      email TEXT,
      rating INTEGER CHECK(rating >= 1 AND rating <= 5),
      feedback_type TEXT,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for performance (separate to avoid cascade failures)
  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)');
  } catch (e) { console.log('Index idx_projects_user_id already exists'); }

  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_deliverables_project_id ON project_deliverables(project_id)');
  } catch (e) { console.log('Index idx_deliverables_project_id already exists'); }

  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id)');
  } catch (e) { console.log('Index idx_chat_sessions_user_id already exists'); }

  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_chat_sessions_project_id ON chat_sessions(project_id)');
  } catch (e) { console.log('Index idx_chat_sessions_project_id already exists'); }

  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id)');
  } catch (e) { console.log('Index idx_chat_messages_session_id already exists'); }

  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id)');
  } catch (e) { console.log('Index idx_chat_messages_user_id already exists'); }

  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id)');
  } catch (e) { console.log('Index idx_coin_transactions_user_id already exists'); }

  console.log('✅ Database initialized successfully');
}

/**
 * Generate a new UUID for IDs
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Get current ISO timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Utility to run prepared statements safely
 */
export function runQuery<T>(query: string, params: any[] = []): T {
  const stmt = db.prepare(query);
  return stmt.run(...params) as T;
}

export function getOne<T>(query: string, params: any[] = []): T | undefined {
  const stmt = db.prepare(query);
  return stmt.get(...params) as T | undefined;
}

export function getAll<T>(query: string, params: any[] = []): T[] {
  const stmt = db.prepare(query);
  return stmt.all(...params) as T[];
}

export default db;
