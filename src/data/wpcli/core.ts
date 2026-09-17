import { cmd } from "./helpers";
import type { WPCLICommandInput } from "@/types/wpcli";

export const coreCommands: WPCLICommandInput[] = [
  cmd({
    command: "wp core version",
    description: "Affiche la version de WordPress installée",
    category: "Core",
    tags: ["version", "audit"],
    options: "--extra : Infos supplémentaires (chemin, base DB…)",
    notes: "Utile en prod pour vérifier rapidement la version avant une mise à jour.",
    examples: [
      { title: "Version seule", code: "wp core version" },
      { title: "Détails", code: "wp core version --extra" },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "wp core check-update",
    description: "Vérifie si une mise à jour WordPress est disponible",
    category: "Core",
    difficulty: "débutant",
    tags: ["update", "audit"],
    options: "--major / --minor : Limite le type de mise à jour\n--format=<format> : table, csv, json, count",
    notes: "Ne télécharge rien — lecture seule.",
    examples: [
      { title: "Liste des mises à jour", code: "wp core check-update" },
      { title: "JSON", code: "wp core check-update --format=json" },
    ],
  }),
  cmd({
    command: "wp core update",
    description: "Met à jour WordPress vers la dernière version (ou une version précise)",
    category: "Core",
    difficulty: "intermédiaire",
    tags: ["update", "production"],
    options: "--version=<version> : Version cible\n--force : Réinstalle même si déjà à jour\n--minor : Mises à jour mineures uniquement",
    notes: "Toujours backup DB + fichiers avant. Tester en staging.",
    examples: [
      { title: "Dernière version", code: "wp core update" },
      { title: "Version précise", code: "wp core update --version=6.7.2" },
      { title: "Mineure seulement", code: "wp core update --minor" },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "wp core update-db",
    description: "Met à jour le schéma de la base après une mise à jour core",
    category: "Core",
    difficulty: "intermédiaire",
    tags: ["update", "database"],
    options: "--network : Tous les sites d'un multisite\n--dry-run : Affiche sans appliquer",
    notes: "À lancer après wp core update si l'admin affiche encore « Base de données à mettre à jour ».",
    examples: [
      { title: "Site unique", code: "wp core update-db" },
      { title: "Multisite", code: "wp core update-db --network" },
    ],
  }),
  cmd({
    command: "wp core download",
    description: "Télécharge les fichiers WordPress",
    category: "Core",
    tags: ["install", "setup"],
    options: "--locale=<locale> : Langue\n--version=<version> : Version\n--skip-content : Sans wp-content\n--force : Écrase les fichiers existants",
    notes: "Premier pas d'une install fraîche.",
    examples: [
      { title: "FR", code: "wp core download --locale=fr_FR" },
      { title: "Sans contenu", code: "wp core download --skip-content --locale=fr_FR" },
    ],
  }),
  cmd({
    command: "wp core install",
    description: "Finalise l'installation WordPress (crée les tables + admin)",
    category: "Core",
    difficulty: "intermédiaire",
    tags: ["install", "setup"],
    options: "--url --title --admin_user --admin_password --admin_email (requis)\n--skip-email : Pas d'email de bienvenue",
    notes: "Nécessite wp-config.php déjà configuré (wp config create).",
    examples: [
      {
        title: "Install complète",
        code: "wp core install --url=https://example.com --title='Mon site' --admin_user=admin --admin_password='ChangeMe!' --admin_email=admin@example.com",
      },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "wp core is-installed",
    description: "Code de sortie 0 si WordPress est installé, 1 sinon",
    category: "Core",
    tags: ["script", "ci"],
    notes: "Idéal dans les scripts bash / CI pour brancher des conditions.",
    examples: [
      { title: "Test shell", code: "wp core is-installed && echo 'OK' || echo 'Pas installé'" },
      { title: "Multisite", code: "wp core is-installed --network" },
    ],
  }),
  cmd({
    command: "wp core verify-checksums",
    description: "Vérifie l'intégrité des fichiers core WordPress",
    category: "Core",
    difficulty: "intermédiaire",
    tags: ["sécurité", "audit"],
    options: "--include-root : Inclut les fichiers à la racine (wp-config.php exclu)\n--version=<version> --locale=<locale>",
    notes: "Détecte fichiers core modifiés/corrompus. Ne vérifie pas wp-content.",
    examples: [
      { title: "Vérification standard", code: "wp core verify-checksums" },
      { title: "Locale FR", code: "wp core verify-checksums --locale=fr_FR" },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "wp core language install fr_FR --activate",
    description: "Installe et active une langue pour le core",
    category: "Language",
    tags: ["i18n", "locale"],
    options: "--activate : Active après install",
    notes: "Équivalent via `wp language core install`.",
    examples: [
      { title: "Français", code: "wp language core install fr_FR --activate" },
      { title: "Liste langues", code: "wp language core list --fields=language,english_name,status" },
    ],
  }),
];
