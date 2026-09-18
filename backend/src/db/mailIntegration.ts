import type Database from 'better-sqlite3';

export function migrateOptionalTaskDate(db: Database.Database) {
  const columns = db.prepare('PRAGMA table_info(tasks)').all() as { name: string; notnull: number }[];
  if (!columns.find(c => c.name === 'due_date')?.notnull) return;
  const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='tasks'").get() as { sql: string };
  const indexes = db.prepare("SELECT sql FROM sqlite_master WHERE tbl_name='tasks' AND type IN ('index','trigger') AND sql IS NOT NULL").all() as { sql: string }[];
  const foreignKeys = db.pragma('foreign_keys', { simple: true });
  db.pragma('foreign_keys = OFF');
  try {
    db.transaction(() => {
      db.exec(schema.sql.replace(/CREATE TABLE (?:IF NOT EXISTS )?["`]?tasks["`]?/i, 'CREATE TABLE tasks_nullable').replace(/due_date TEXT NOT NULL/i, 'due_date TEXT'));
      const names = columns.map(c => `"${c.name}"`).join(',');
      db.exec(`INSERT INTO tasks_nullable (${names}) SELECT ${names} FROM tasks; DROP TABLE tasks; ALTER TABLE tasks_nullable RENAME TO tasks;`);
      for (const index of indexes) db.exec(index.sql);
      if ((db.pragma('foreign_key_check') as unknown[]).length) throw new Error('Task migration: foreign key check failed');
    })();
  } finally {
    db.pragma(`foreign_keys = ${foreignKeys ? 'ON' : 'OFF'}`);
  }
}

export function initializeMailIntegration(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS mail_ai_config (
      id INTEGER PRIMARY KEY CHECK(id=1), provider TEXT NOT NULL DEFAULT 'openrouter',
      openrouter_key TEXT, deepseek_key TEXT,
      openrouter_model TEXT NOT NULL DEFAULT 'mistralai/mistral-small-2603',
      deepseek_model TEXT NOT NULL DEFAULT 'deepseek-chat',
      openrouter_tested INTEGER NOT NULL DEFAULT 0, deepseek_tested INTEGER NOT NULL DEFAULT 0
    );
    INSERT OR IGNORE INTO mail_ai_config(id) VALUES(1);
    CREATE TABLE IF NOT EXISTS zoho_connections (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      generation TEXT NOT NULL, account_id TEXT NOT NULL, email TEXT NOT NULL,
      refresh_token TEXT NOT NULL, activated_at INTEGER NOT NULL,
      paused INTEGER NOT NULL DEFAULT 0, last_sync INTEGER, last_error TEXT,
      next_sync INTEGER NOT NULL DEFAULT 0, lease_until INTEGER NOT NULL DEFAULT 0, lease_owner TEXT,
      mappings TEXT NOT NULL DEFAULT '[]', exclusions TEXT NOT NULL DEFAULT '[]'
    );
    CREATE TABLE IF NOT EXISTS zoho_oauth_states (
      hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS mail_messages (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_id TEXT NOT NULL, message_id TEXT NOT NULL, folder_id TEXT NOT NULL,
      thread_id TEXT, subject TEXT NOT NULL, sender TEXT NOT NULL, recipients TEXT NOT NULL,
      received_at INTEGER NOT NULL, has_attachment INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'queued', attempts INTEGER NOT NULL DEFAULT 0,
      next_attempt INTEGER NOT NULL DEFAULT 0, lease_until INTEGER NOT NULL DEFAULT 0, lease_owner TEXT,
      provider TEXT, model TEXT, error TEXT, decision TEXT, created_at TEXT NOT NULL,
      UNIQUE(user_id, account_id, message_id)
    );
    CREATE INDEX IF NOT EXISTS mail_queue ON mail_messages(status,next_attempt);
    CREATE TABLE IF NOT EXISTS mail_proposals (
      id TEXT PRIMARY KEY, message_id TEXT NOT NULL REFERENCES mail_messages(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      payload TEXT NOT NULL, reason TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
      task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS task_mail_sources (
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      message_id TEXT NOT NULL REFERENCES mail_messages(id) ON DELETE CASCADE,
      PRIMARY KEY(task_id,message_id)
    );
    CREATE TABLE IF NOT EXISTS mail_ai_usage (
      id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      provider TEXT NOT NULL, model TEXT NOT NULL, input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0, cost REAL, error TEXT, created_at TEXT NOT NULL
    );
  `);
}
