export type DifficultyLevel = "débutant" | "intermédiaire" | "avancé";

export interface WPCLICommand {
  id: string;
  command: string;
  description: string;
  example: string;
  options: string;
  notes: string;
  category: string;
  difficulty: DifficultyLevel;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export const defaultCategories = [
  "Core",
  "Plugins",
  "Themes",
  "Database",
  "Users",
  "Posts",
  "Cache",
  "Config",
  "Media",
  "Maintenance",
];

export const difficultyColors: Record<DifficultyLevel, { bg: string; text: string }> = {
  "débutant": { bg: "bg-emerald-500/20", text: "text-emerald-400" },
  "intermédiaire": { bg: "bg-amber-500/20", text: "text-amber-400" },
  "avancé": { bg: "bg-rose-500/20", text: "text-rose-400" },
};

export const defaultCommands: Omit<WPCLICommand, "id" | "createdAt" | "updatedAt">[] = [
  // Core
  {
    command: "wp core version",
    description: "Affiche la version de WordPress installée",
    example: "wp core version\n# Output: 6.4.2",
    options: "--extra : Affiche des infos supplémentaires",
    notes: "Utile pour vérifier rapidement la version en production",
    category: "Core",
    difficulty: "débutant",
    isFavorite: false,
  },
  {
    command: "wp core update",
    description: "Met à jour WordPress vers la dernière version",
    example: "wp core update --version=6.4.2",
    options: "--version=<version> : Version spécifique\n--force : Forcer la réinstallation\n--minor : Mise à jour mineure uniquement",
    notes: "Toujours faire un backup avant de mettre à jour",
    category: "Core",
    difficulty: "intermédiaire",
    isFavorite: true,
  },
  {
    command: "wp core download",
    description: "Télécharge les fichiers WordPress",
    example: "wp core download --locale=fr_FR",
    options: "--locale=<locale> : Langue\n--version=<version> : Version spécifique\n--skip-content : Sans wp-content",
    notes: "Premier pas pour une installation WordPress",
    category: "Core",
    difficulty: "débutant",
    isFavorite: false,
  },
  // Plugins
  {
    command: "wp plugin list",
    description: "Liste tous les plugins installés",
    example: "wp plugin list --status=active --format=table",
    options: "--status=<status> : active, inactive, must-use\n--format=<format> : table, csv, json",
    notes: "Parfait pour auditer les plugins d'un site",
    category: "Plugins",
    difficulty: "débutant",
    isFavorite: true,
  },
  {
    command: "wp plugin install",
    description: "Installe un plugin depuis le répertoire WordPress",
    example: "wp plugin install advanced-custom-fields --activate",
    options: "--activate : Active après installation\n--version=<version> : Version spécifique\n--force : Réinstalle si déjà présent",
    notes: "Accepte aussi une URL ZIP ou un chemin local",
    category: "Plugins",
    difficulty: "débutant",
    isFavorite: true,
  },
  {
    command: "wp plugin update --all",
    description: "Met à jour tous les plugins",
    example: "wp plugin update --all --dry-run",
    options: "--all : Tous les plugins\n--dry-run : Simule sans appliquer\n--exclude=<plugins> : Exclure certains plugins",
    notes: "Toujours tester en staging d'abord",
    category: "Plugins",
    difficulty: "intermédiaire",
    isFavorite: true,
  },
  // Database
  {
    command: "wp db export",
    description: "Exporte la base de données en fichier SQL",
    example: "wp db export backup-$(date +%Y%m%d).sql --add-drop-table",
    options: "--add-drop-table : Ajoute DROP TABLE\n--tables=<tables> : Tables spécifiques\n--exclude_tables=<tables> : Exclure des tables",
    notes: "Indispensable avant toute manipulation risquée",
    category: "Database",
    difficulty: "débutant",
    isFavorite: true,
  },
  {
    command: "wp db import",
    description: "Importe un fichier SQL dans la base de données",
    example: "wp db import backup.sql",
    options: "Aucune option majeure, juste le fichier en argument",
    notes: "Écrase les données existantes, attention !",
    category: "Database",
    difficulty: "intermédiaire",
    isFavorite: false,
  },
  {
    command: "wp search-replace",
    description: "Recherche et remplace du texte dans la BDD",
    example: "wp search-replace 'http://old.com' 'https://new.com' --dry-run",
    options: "--dry-run : Simule\n--network : Multisite\n--all-tables : Toutes les tables\n--precise : Gère la sérialisation",
    notes: "Essentiel pour les migrations de domaine",
    category: "Database",
    difficulty: "avancé",
    isFavorite: true,
  },
  // Users
  {
    command: "wp user list",
    description: "Liste tous les utilisateurs",
    example: "wp user list --role=administrator --format=table",
    options: "--role=<role> : Filtrer par rôle\n--format=<format> : table, csv, json, ids",
    notes: "Utile pour auditer les comptes admin",
    category: "Users",
    difficulty: "débutant",
    isFavorite: false,
  },
  {
    command: "wp user create",
    description: "Crée un nouvel utilisateur",
    example: "wp user create john john@example.com --role=editor --user_pass=secret123",
    options: "--role=<role> : Rôle assigné\n--user_pass=<pass> : Mot de passe\n--send-email : Envoie le mail de bienvenue",
    notes: "Le premier argument est le login, le second l'email",
    category: "Users",
    difficulty: "débutant",
    isFavorite: true,
  },
  {
    command: "wp user update",
    description: "Met à jour un utilisateur existant",
    example: "wp user update 1 --user_pass=newpassword --skip-email",
    options: "--user_pass=<pass> : Nouveau mot de passe\n--role=<role> : Changer le rôle\n--skip-email : Ne pas notifier",
    notes: "Accepte l'ID, le login ou l'email comme identifiant",
    category: "Users",
    difficulty: "intermédiaire",
    isFavorite: false,
  },
  // Cache
  {
    command: "wp cache flush",
    description: "Vide le cache objet WordPress",
    example: "wp cache flush",
    options: "Aucune option",
    notes: "Pour le cache persistant (Redis, Memcached)",
    category: "Cache",
    difficulty: "débutant",
    isFavorite: true,
  },
  {
    command: "wp transient delete --all",
    description: "Supprime tous les transients",
    example: "wp transient delete --all --network",
    options: "--all : Tous les transients\n--network : Multisite\n--expired : Seulement les expirés",
    notes: "Nettoie les données temporaires périmées",
    category: "Cache",
    difficulty: "intermédiaire",
    isFavorite: false,
  },
  // Config
  {
    command: "wp config get",
    description: "Affiche une valeur de wp-config.php",
    example: "wp config get DB_NAME",
    options: "--type=<type> : constant ou variable\n--format=<format> : Format de sortie",
    notes: "Lecture sûre des constantes de configuration",
    category: "Config",
    difficulty: "débutant",
    isFavorite: false,
  },
  {
    command: "wp config set",
    description: "Modifie une valeur dans wp-config.php",
    example: "wp config set WP_DEBUG true --raw",
    options: "--raw : Valeur brute (true, false, entiers)\n--type=<type> : constant ou variable\n--add : Ajoute si n'existe pas",
    notes: "Modifier les constantes sans éditer le fichier",
    category: "Config",
    difficulty: "intermédiaire",
    isFavorite: true,
  },
  // Maintenance
  {
    command: "wp cron event list",
    description: "Liste les tâches cron programmées",
    example: "wp cron event list --format=table",
    options: "--format=<format> : table, csv, json",
    notes: "Diagnostiquer les problèmes de cron",
    category: "Maintenance",
    difficulty: "intermédiaire",
    isFavorite: false,
  },
  {
    command: "wp rewrite flush",
    description: "Régénère les règles de réécriture",
    example: "wp rewrite flush --hard",
    options: "--hard : Réécrit aussi .htaccess",
    notes: "Résout souvent les erreurs 404 sur les permaliens",
    category: "Maintenance",
    difficulty: "débutant",
    isFavorite: true,
  },
];
