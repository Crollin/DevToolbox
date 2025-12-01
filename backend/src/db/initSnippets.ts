import db from './database';

// Initialiser les dossiers par défaut
export function initializeDefaultSnippets() {
  try {
    // Vérifier si des snippets existent déjà
    const count = db.prepare('SELECT COUNT(*) as count FROM code_snippets').get() as { count: number };
    
    if (count.count > 0) {
      console.log(`✓ ${count.count} snippets déjà présents dans la base de données`);
      return;
    }

    console.log('Initialisation des snippets par défaut...');
    
    // Les snippets par défaut seront chargés depuis le frontend
    // Pour l'instant, on initialise juste les dossiers par défaut
    const defaultFolders = [
      'WordPress',
      'WooCommerce',
      'Sécurité',
      'Performance',
      'SEO',
      'Admin',
      'Frontend',
      'API',
      'Database',
      'Utilities',
    ];

    const now = new Date().toISOString();
    const insertFolder = db.prepare('INSERT OR IGNORE INTO snippet_folders (name, created_at) VALUES (?, ?)');
    
    for (const folder of defaultFolders) {
      insertFolder.run(folder, now);
    }

    console.log('✓ Dossiers par défaut initialisés');
    console.log('⚠ Les snippets par défaut doivent être importés depuis le frontend');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des snippets:', error);
  }
}

