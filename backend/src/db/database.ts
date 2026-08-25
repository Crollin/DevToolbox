import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/devtoolbox.db');
const DB_DIR = path.dirname(DB_PATH);

// Créer le dossier data s'il n'existe pas
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Activer les clés étrangères
db.pragma('foreign_keys = ON');

// Créer les tables
export function initializeDatabase() {
  // Table pour les snippets de code
  db.exec(`
    CREATE TABLE IF NOT EXISTS code_snippets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      code TEXT NOT NULL,
      language TEXT NOT NULL,
      scope TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 10,
      tags TEXT, -- JSON array
      folder TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      run_once INTEGER NOT NULL DEFAULT 0,
      wp_code_box_id INTEGER,
      cloud_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Table pour les snippets folders
  db.exec(`
    CREATE TABLE IF NOT EXISTS snippet_folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    )
  `);

  // Table pour les tags personnalisés de snippets
  db.exec(`
    CREATE TABLE IF NOT EXISTS snippet_custom_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    )
  `);

  // Table pour les hooks WordPress
  db.exec(`
    CREATE TABLE IF NOT EXISTS wp_hooks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- 'action' or 'filter'
      description TEXT,
      category TEXT NOT NULL,
      tags TEXT, -- JSON array
      example TEXT,
      parameters TEXT,
      since TEXT,
      deprecated TEXT,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Table pour les catégories de hooks
  db.exec(`
    CREATE TABLE IF NOT EXISTS wp_hook_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    )
  `);

  // Table pour les queries WordPress sauvegardées
  db.exec(`
    CREATE TABLE IF NOT EXISTS wp_queries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      config TEXT NOT NULL, -- JSON
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Table pour les palettes de couleurs
  db.exec(`
    CREATE TABLE IF NOT EXISTS color_palettes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      harmony TEXT NOT NULL,
      colors TEXT NOT NULL, -- JSON array
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Table pour les scripts WordPress
  db.exec(`
    CREATE TABLE IF NOT EXISTS wp_scripts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      code TEXT NOT NULL,
      language TEXT NOT NULL,
      category TEXT NOT NULL,
      tags TEXT, -- JSON array
      wp_version_min TEXT,
      wp_version_max TEXT,
      author TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      instructions TEXT,
      dependencies TEXT, -- JSON array
      warnings TEXT, -- JSON array
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Table pour les catégories de scripts
  db.exec(`
    CREATE TABLE IF NOT EXISTS wp_script_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    )
  `);

  // Table pour les tags personnalisés de scripts
  db.exec(`
    CREATE TABLE IF NOT EXISTS wp_script_custom_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    )
  `);

  // Table pour les commandes WP-CLI
  db.exec(`
    CREATE TABLE IF NOT EXISTS wp_cli_commands (
      id TEXT PRIMARY KEY,
      command TEXT NOT NULL,
      description TEXT,
      example TEXT,
      options TEXT,
      notes TEXT,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Table pour les catégories WP-CLI
  db.exec(`
    CREATE TABLE IF NOT EXISTS wp_cli_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    )
  `);

  // Table pour les commandes Docker
  db.exec(`
    CREATE TABLE IF NOT EXISTS docker_commands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      command TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      tags TEXT, -- JSON array
      is_favorite INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Table pour les catégories Docker
  db.exec(`
    CREATE TABLE IF NOT EXISTS docker_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    )
  `);

  // Table pour les commandes Git
  db.exec(`
    CREATE TABLE IF NOT EXISTS git_commands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      command TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      tags TEXT, -- JSON array
      is_favorite INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Table pour les catégories Git
  db.exec(`
    CREATE TABLE IF NOT EXISTS git_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    )
  `);

  // Table pour les icônes SVG
  db.exec(`
    CREATE TABLE IF NOT EXISTS svg_icons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      svg TEXT NOT NULL,
      tags TEXT, -- JSON array
      category TEXT,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Table pour les utilisateurs
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Table pour les tokens de réinitialisation de mot de passe
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Table pour les sessions (blacklist de tokens)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS personal_access_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      scope TEXT NOT NULL DEFAULT 'licences',
      expires_at TEXT,
      revoked_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Table pour les licences
  db.exec(`
    CREATE TABLE IF NOT EXISTS licences (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      key TEXT NOT NULL,
      type TEXT NOT NULL,
      seat_count INTEGER,
      status TEXT NOT NULL,
      expires_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Table pour les configurations Ntfy par utilisateur
  db.exec(`
    CREATE TABLE IF NOT EXISTS ntfy_configs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      enabled INTEGER NOT NULL DEFAULT 0,
      server_url TEXT NOT NULL DEFAULT 'https://ntfy.sh',
      topic TEXT NOT NULL DEFAULT '',
      token TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Table pour les abonnements Web Push (PWA)
  db.exec(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      user_agent TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
    ON push_subscriptions(user_id)
  `);

  // Table pour la configuration SMTP globale (une seule ligne)
  db.exec(`
    CREATE TABLE IF NOT EXISTS smtp_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      host TEXT,
      port INTEGER DEFAULT 587,
      user TEXT,
      pass TEXT,
      from_email TEXT,
      updated_at TEXT NOT NULL
    )
  `);

  // Table pour les préférences de personnalisation des emails par utilisateur
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_email_preferences (
      user_id TEXT PRIMARY KEY,
      company_name TEXT,
      signature TEXT,
      primary_color TEXT DEFAULT '#0066CC',
      secondary_color TEXT DEFAULT '#004499',
      logo_url TEXT,
      welcome_text TEXT,
      licences_text TEXT,
      tasks_text TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Migration : Ajouter preferences à la table users si elle n'existe pas
  try {
    const usersTableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
    const usersColumnNames = usersTableInfo.map((col) => col.name);

    if (!usersColumnNames.includes('preferences')) {
      db.exec(`ALTER TABLE users ADD COLUMN preferences TEXT DEFAULT '{}'`);
      console.log('Colonne preferences ajoutée à users');
    }
  } catch (error) {
    console.log('Migration users (preferences) déjà effectuée ou table n\'existe pas encore');
  }

  // Migration : Ajouter les nouvelles colonnes à ntfy_configs si elles n'existent pas
  try {
    const tableInfo = db.prepare("PRAGMA table_info(ntfy_configs)").all() as Array<{ name: string }>;
    const columnNames = tableInfo.map((col) => col.name);
    
    if (!columnNames.includes('notification_type')) {
      db.exec(`ALTER TABLE ntfy_configs ADD COLUMN notification_type TEXT NOT NULL DEFAULT 'ntfy'`);
      console.log('Colonne notification_type ajoutée à ntfy_configs');
    }
    
    if (!columnNames.includes('auto_reminders_enabled')) {
      db.exec(`ALTER TABLE ntfy_configs ADD COLUMN auto_reminders_enabled INTEGER NOT NULL DEFAULT 0`);
      console.log('Colonne auto_reminders_enabled ajoutée à ntfy_configs');
    }
    
    if (!columnNames.includes('reminder_frequency')) {
      db.exec(`ALTER TABLE ntfy_configs ADD COLUMN reminder_frequency TEXT NOT NULL DEFAULT 'daily'`);
      console.log('Colonne reminder_frequency ajoutée à ntfy_configs');
    }
    
    if (!columnNames.includes('last_reminder_sent_at')) {
      db.exec(`ALTER TABLE ntfy_configs ADD COLUMN last_reminder_sent_at TEXT`);
      console.log('Colonne last_reminder_sent_at ajoutée à ntfy_configs');
    }

    if (!columnNames.includes('notification_channels')) {
      db.exec(`ALTER TABLE ntfy_configs ADD COLUMN notification_channels TEXT`);
      console.log('Colonne notification_channels ajoutée à ntfy_configs');
    }

    if (!columnNames.includes('telegram_chat_id')) {
      db.exec(`ALTER TABLE ntfy_configs ADD COLUMN telegram_chat_id TEXT`);
      console.log('Colonne telegram_chat_id ajoutée à ntfy_configs');
    }

    if (!columnNames.includes('task_auto_reminders_enabled')) {
      db.exec(`ALTER TABLE ntfy_configs ADD COLUMN task_auto_reminders_enabled INTEGER NOT NULL DEFAULT 0`);
      console.log('Colonne task_auto_reminders_enabled ajoutée à ntfy_configs');
    }
  } catch (error) {
    console.log('Migration ntfy_configs déjà effectuée ou table n\'existe pas encore');
  }

  // Migration : Ajouter notifications_enabled à la table licences si elle n'existe pas
  try {
    const licencesTableInfo = db.prepare("PRAGMA table_info(licences)").all() as Array<{ name: string }>;
    const licencesColumnNames = licencesTableInfo.map((col) => col.name);
    
    if (!licencesColumnNames.includes('notifications_enabled')) {
      db.exec(`ALTER TABLE licences ADD COLUMN notifications_enabled INTEGER NOT NULL DEFAULT 1`);
      console.log('Colonne notifications_enabled ajoutée à licences');
    }
  } catch (error) {
    console.log('Migration licences (notifications_enabled) déjà effectuée ou table n\'existe pas encore');
  }

  // Migration : Ajouter seat_count à la table licences si elle n'existe pas
  try {
    const licencesTableInfo = db.prepare("PRAGMA table_info(licences)").all() as Array<{ name: string }>;
    const licencesColumnNames = licencesTableInfo.map((col) => col.name);

    if (!licencesColumnNames.includes('seat_count')) {
      db.exec(`ALTER TABLE licences ADD COLUMN seat_count INTEGER`);
      console.log('Colonne seat_count ajoutée à licences');
    }
  } catch (error) {
    console.log('Migration licences (seat_count) déjà effectuée ou table n\'existe pas encore');
  }

  // Migration : Ajouter user_id à la table licences si elle existe déjà sans cette colonne
  try {
    const tableInfo = db.prepare("PRAGMA table_info(licences)").all() as Array<{ name: string }>;
    const hasUserId = tableInfo.some((col) => col.name === 'user_id');
    
    if (!hasUserId) {
      // Si la table existe sans user_id, on doit créer une nouvelle table et migrer les données
      db.exec(`
        CREATE TABLE IF NOT EXISTS licences_new (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          name TEXT NOT NULL,
          key TEXT NOT NULL,
          type TEXT NOT NULL,
          seat_count INTEGER,
          status TEXT NOT NULL,
          expires_at TEXT,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      
      // Copier les données existantes (sans user_id pour l'instant)
      db.exec(`
        INSERT INTO licences_new (id, name, key, type, seat_count, status, expires_at, notes, created_at, updated_at)
        SELECT id, name, key, type, seat_count, status, expires_at, notes, created_at, updated_at
        FROM licences
      `);
      
      // Supprimer l'ancienne table et renommer la nouvelle
      db.exec(`DROP TABLE licences`);
      db.exec(`ALTER TABLE licences_new RENAME TO licences`);
      
      console.log('Migration de la table licences effectuée avec succès');
    }
  } catch (error) {
    // Si la table n'existe pas encore, pas de problème
    console.log('Table licences n\'existe pas encore ou migration déjà effectuée');
  }

  // Migration : Ajouter is_favorite à la table code_snippets si elle n'existe pas
  try {
    const snippetsTableInfo = db.prepare("PRAGMA table_info(code_snippets)").all() as Array<{ name: string }>;
    const snippetsColumnNames = snippetsTableInfo.map((col) => col.name);
    
    if (!snippetsColumnNames.includes('is_favorite')) {
      db.exec(`ALTER TABLE code_snippets ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0`);
      console.log('Colonne is_favorite ajoutée à code_snippets');
    }
  } catch (error) {
    console.log('Migration code_snippets (is_favorite) déjà effectuée ou table n\'existe pas encore');
  }

  // Table pour les tâches
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT NOT NULL,
      client TEXT,
      link TEXT,
      tags TEXT, -- JSON array de tags
      priority TEXT NOT NULL DEFAULT 'normal',
      notification_channels TEXT, -- JSON array; null = configuration globale
      status TEXT NOT NULL DEFAULT 'pending',
      reminder_days TEXT, -- JSON array des jours avant (ex: [7, 3, 1])
      reminder_datetime TEXT, -- Date/heure précise du rappel (optionnel)
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Évolution des tâches : ces colonnes sont ajoutées aux bases existantes.
  const taskColumns = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
  const taskColumnNames = taskColumns.map((column) => column.name);
  if (!taskColumnNames.includes('tags')) db.exec(`ALTER TABLE tasks ADD COLUMN tags TEXT`);
  if (!taskColumnNames.includes('priority')) db.exec(`ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal'`);
  if (!taskColumnNames.includes('notification_channels')) db.exec(`ALTER TABLE tasks ADD COLUMN notification_channels TEXT`);

  db.exec(`
    CREATE TABLE IF NOT EXISTS task_clients (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, name),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  const clientColumns = db.prepare("PRAGMA table_info(task_clients)").all() as Array<{ name: string }>;
  if (!clientColumns.map((c) => c.name).includes('color')) {
    db.exec(`ALTER TABLE task_clients ADD COLUMN color TEXT`);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS task_attachments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      stored_filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id)`);

  // Table pour tracker les rappels envoyés
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_reminders (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      reminder_type TEXT NOT NULL, -- 'days_before' ou 'datetime'
      reminder_value TEXT NOT NULL, -- Nombre de jours ou date/heure
      sent_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);

  // Table pour l'ordre personnalisé des outils par utilisateur
  db.exec(`
    CREATE TABLE IF NOT EXISTS tool_order (
      user_id TEXT NOT NULL,
      tool_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, tool_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // =========================
  // Knowledge Base (KB)
  // =========================
  db.exec(`
    CREATE TABLE IF NOT EXISTS kb_categories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, name),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS kb_tags (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, name),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS kb_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category_id TEXT,
      url TEXT,
      title TEXT NOT NULL,
      summary TEXT,
      content TEXT,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active', -- active|archived
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_opened_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES kb_categories(id) ON DELETE SET NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS kb_entry_tags (
      entry_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (entry_id, tag_id),
      FOREIGN KEY (entry_id) REFERENCES kb_entries(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES kb_tags(id) ON DELETE CASCADE
    )
  `);

  // FTS5 pour la recherche (si dispo). Fallback: l'app utilisera LIKE côté API.
  try {
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS kb_entries_fts
      USING fts5(
        entry_id UNINDEXED,
        user_id UNINDEXED,
        title,
        url,
        summary,
        content,
        content='',
        tokenize='unicode61'
      )
    `);

    db.exec(`
      CREATE TRIGGER IF NOT EXISTS kb_entries_ai AFTER INSERT ON kb_entries BEGIN
        INSERT INTO kb_entries_fts(entry_id, user_id, title, url, summary, content)
        VALUES (new.id, new.user_id, new.title, coalesce(new.url,''), coalesce(new.summary,''), coalesce(new.content,''));
      END;
    `);

    db.exec(`
      CREATE TRIGGER IF NOT EXISTS kb_entries_au AFTER UPDATE ON kb_entries BEGIN
        DELETE FROM kb_entries_fts WHERE entry_id = old.id;
        INSERT INTO kb_entries_fts(entry_id, user_id, title, url, summary, content)
        VALUES (new.id, new.user_id, new.title, coalesce(new.url,''), coalesce(new.summary,''), coalesce(new.content,''));
      END;
    `);

    db.exec(`
      CREATE TRIGGER IF NOT EXISTS kb_entries_ad AFTER DELETE ON kb_entries BEGIN
        DELETE FROM kb_entries_fts WHERE entry_id = old.id;
      END;
    `);
  } catch (error) {
    console.log('FTS5 non disponible pour kb_entries_fts (fallback LIKE).', error);
  }

  // Index pour les requêtes fréquentes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_user_id_status ON tasks(user_id, status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_licences_user_id ON licences(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_licences_expires_at ON licences(expires_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_code_snippets_created_at ON code_snippets(created_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_code_snippets_folder ON code_snippets(folder)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_wp_hooks_category ON wp_hooks(category)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_wp_hooks_created_at ON wp_hooks(created_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_wp_queries_created_at ON wp_queries(created_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_personal_access_tokens_user_id ON personal_access_tokens(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_task_reminders_task_id ON task_reminders(task_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_task_clients_user_id ON task_clients(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_tool_order_user_id ON tool_order(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_ntfy_configs_user_id ON ntfy_configs(user_id)`);

  // Index KB
  db.exec(`CREATE INDEX IF NOT EXISTS idx_kb_entries_user_id ON kb_entries(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_kb_entries_user_id_status ON kb_entries(user_id, status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_kb_entries_user_id_category_id ON kb_entries(user_id, category_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_kb_entries_user_id_updated_at ON kb_entries(user_id, updated_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_kb_categories_user_id_position ON kb_categories(user_id, position)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_kb_tags_user_id_name ON kb_tags(user_id, name)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_kb_entry_tags_tag_id ON kb_entry_tags(tag_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_kb_entry_tags_entry_id ON kb_entry_tags(entry_id)`);

  // Domain Hub — portefeuille
  db.exec(`
    CREATE TABLE IF NOT EXISTS domains (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      registrar TEXT NOT NULL,
      client_name TEXT,
      client_email TEXT,
      payer TEXT NOT NULL DEFAULT 'agency',
      cost_yearly REAL,
      sell_yearly REAL,
      currency TEXT NOT NULL DEFAULT 'EUR',
      expires_at TEXT,
      auto_renew INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      external_id TEXT,
      notifications_enabled INTEGER NOT NULL DEFAULT 1,
      billing_status TEXT NOT NULL DEFAULT 'pending',
      last_billed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_domains_expires_at ON domains(expires_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_domains_user_id_name ON domains(user_id, name)`);

  db.exec(`
    CREATE TABLE IF NOT EXISTS domain_hub_credentials (
      user_id TEXT PRIMARY KEY,
      cloudflare_api_token TEXT,
      cloudflare_account_id TEXT,
      hostinger_api_token TEXT,
      ovh_app_key TEXT,
      ovh_app_secret TEXT,
      ovh_consumer_key TEXT,
      ovh_subsidiary TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Migration : billing_status / last_billed_at sur domains
  try {
    const domainsTableInfo = db.prepare('PRAGMA table_info(domains)').all() as Array<{ name: string }>;
    const domainsColumnNames = domainsTableInfo.map((col) => col.name);

    if (!domainsColumnNames.includes('billing_status')) {
      db.exec(`ALTER TABLE domains ADD COLUMN billing_status TEXT NOT NULL DEFAULT 'pending'`);
      console.log('Colonne billing_status ajoutée à domains');
    }

    if (!domainsColumnNames.includes('last_billed_at')) {
      db.exec(`ALTER TABLE domains ADD COLUMN last_billed_at TEXT`);
      console.log('Colonne last_billed_at ajoutée à domains');
    }
  } catch (error) {
    console.log('Migration domains (billing) déjà effectuée ou table n\'existe pas encore');
  }

  console.log('Base de données initialisée avec succès');
}

export default db;
