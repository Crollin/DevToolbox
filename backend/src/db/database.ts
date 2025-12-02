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

  // Table pour les licences
  db.exec(`
    CREATE TABLE IF NOT EXISTS licences (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      key TEXT NOT NULL,
      type TEXT NOT NULL,
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
        INSERT INTO licences_new (id, name, key, type, status, expires_at, notes, created_at, updated_at)
        SELECT id, name, key, type, status, expires_at, notes, created_at, updated_at
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

  // Table pour les calculs électriques
  db.exec(`
    CREATE TABLE IF NOT EXISTS electricalc_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      settings TEXT NOT NULL, -- JSON
      updated_at TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS electricalc_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      calculation TEXT NOT NULL, -- JSON
      created_at TEXT NOT NULL
    )
  `);

  console.log('Base de données initialisée avec succès');
}

export default db;

