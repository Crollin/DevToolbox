import { cmd } from "./helpers";
import type { WPCLICommandInput } from "@/types/wpcli";

export const userCommands: WPCLICommandInput[] = [
  cmd({
    command: "wp user list",
    description: "Liste les utilisateurs",
    category: "Users",
    tags: ["audit", "list"],
    options: "--role=<role>\n--format=table|csv|json|ids\n--fields=<fields>",
    examples: [
      { title: "Admins", code: "wp user list --role=administrator --fields=ID,user_login,user_email" },
      { title: "IDs seulement", code: "wp user list --format=ids" },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "wp user get <user>",
    description: "Détails d'un utilisateur (ID, login ou email)",
    category: "Users",
    tags: ["audit"],
    examples: [{ title: "Par ID", code: "wp user get 1 --format=json" }],
  }),
  cmd({
    command: "wp user create <user> <email>",
    description: "Crée un utilisateur",
    category: "Users",
    tags: ["create"],
    options: "--role=<role>\n--user_pass=<pass>\n--display_name=<name>\n--send-email",
    examples: [
      {
        title: "Éditeur",
        code: "wp user create jean jean@example.com --role=editor --user_pass='ChangeMe!'",
      },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "wp user update <user>",
    description: "Met à jour un utilisateur",
    category: "Users",
    difficulty: "intermédiaire",
    tags: ["update", "password"],
    options: "--user_pass=<pass>\n--role=<role>\n--user_email=<email>\n--skip-email",
    examples: [
      { title: "Reset password", code: "wp user update admin --user_pass='NewSecurePass!' --skip-email" },
      { title: "Changer rôle", code: "wp user update jean --role=author" },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "wp user delete <user>",
    description: "Supprime un utilisateur",
    category: "Users",
    difficulty: "intermédiaire",
    tags: ["cleanup"],
    options: "--reassign=<id> : Réassigne les contenus\n--yes",
    notes: "Sans --reassign, les contenus de l'utilisateur sont aussi impactés selon le prompt.",
    examples: [{ title: "Supprimer + réassigner", code: "wp user delete 42 --reassign=1 --yes" }],
  }),
  cmd({
    command: "wp user meta get <user> <key>",
    description: "Lit une métadonnée utilisateur",
    category: "Users",
    difficulty: "intermédiaire",
    tags: ["meta"],
    examples: [
      { title: "Get", code: "wp user meta get 1 nickname" },
      { title: "List", code: "wp user meta list 1" },
      { title: "Update", code: "wp user meta update 1 rich_editing true" },
    ],
  }),
  cmd({
    command: "wp user generate",
    description: "Génère des utilisateurs de test",
    category: "Users",
    difficulty: "intermédiaire",
    tags: ["dev", "fixtures"],
    options: "--count=<n>\n--role=<role>\n--format=table",
    examples: [{ title: "10 auteurs", code: "wp user generate --count=10 --role=author" }],
  }),
  cmd({
    command: "wp user import-csv <file>",
    description: "Importe des utilisateurs depuis un CSV",
    category: "Users",
    difficulty: "avancé",
    tags: ["import", "csv"],
    examples: [{ title: "Import", code: "wp user import-csv users.csv --send-email" }],
  }),
];

export const roleCommands: WPCLICommandInput[] = [
  cmd({
    command: "wp role list",
    description: "Liste les rôles WordPress",
    category: "Roles",
    tags: ["capabilities", "audit"],
    examples: [{ title: "Rôles", code: "wp role list --format=table" }],
  }),
  cmd({
    command: "wp role create <role> <label>",
    description: "Crée un rôle personnalisé",
    category: "Roles",
    difficulty: "intermédiaire",
    tags: ["capabilities"],
    options: "--clone=<role> : Clone les caps d'un rôle existant",
    examples: [
      { title: "Clone éditeur", code: "wp role create shop_manager_custom 'Shop Manager Custom' --clone=shop_manager" },
    ],
  }),
  cmd({
    command: "wp role delete <role>",
    description: "Supprime un rôle",
    category: "Roles",
    difficulty: "intermédiaire",
    tags: ["cleanup"],
    examples: [{ title: "Supprimer", code: "wp role delete shop_manager_custom" }],
  }),
  cmd({
    command: "wp cap list <role>",
    description: "Liste les capacités d'un rôle",
    category: "Roles",
    difficulty: "intermédiaire",
    tags: ["capabilities"],
    examples: [
      { title: "Caps éditeur", code: "wp cap list editor" },
      { title: "Caps d'un user", code: "wp cap list admin --format=table" },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "wp cap add <role> <cap>",
    description: "Ajoute une capacité à un rôle",
    category: "Roles",
    difficulty: "avancé",
    tags: ["capabilities"],
    examples: [
      { title: "Ajouter", code: "wp cap add editor manage_woocommerce" },
      { title: "Retirer", code: "wp cap remove editor publish_pages" },
    ],
  }),
];

export const postCommands: WPCLICommandInput[] = [
  cmd({
    command: "wp post list",
    description: "Liste articles, pages ou CPT",
    category: "Posts",
    tags: ["list", "content"],
    options: "--post_type --post_status --format --fields --s=<search> --posts_per_page",
    examples: [
      { title: "Publiés", code: "wp post list --post_type=post --post_status=publish --fields=ID,post_title,post_date" },
      { title: "Pages brouillon", code: "wp post list --post_type=page --post_status=draft" },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "wp post get <id>",
    description: "Affiche un contenu",
    category: "Posts",
    tags: ["content"],
    examples: [{ title: "JSON", code: "wp post get 42 --format=json" }],
  }),
  cmd({
    command: "wp post create",
    description: "Crée un article / page / CPT",
    category: "Posts",
    difficulty: "intermédiaire",
    tags: ["create", "content"],
    options: "--post_title --post_status --post_content --post_type --post_author --porcelain",
    examples: [
      {
        title: "Brouillon",
        code: "wp post create --post_title='Mon article' --post_status=draft --post_content='Contenu…'",
      },
      { title: "Depuis fichier", code: "wp post create ./contenu.html --post_title='Import HTML' --post_status=publish" },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "wp post update <id>",
    description: "Met à jour un contenu",
    category: "Posts",
    difficulty: "intermédiaire",
    tags: ["update"],
    examples: [
      { title: "Publier", code: "wp post update 42 --post_status=publish" },
      { title: "Plusieurs IDs", code: "wp post update 42 43 44 --post_status=draft" },
    ],
  }),
  cmd({
    command: "wp post delete <id>",
    description: "Supprime un contenu (corbeille ou définitif)",
    category: "Posts",
    difficulty: "intermédiaire",
    tags: ["cleanup"],
    options: "--force : Bypass corbeille\n--defer",
    examples: [
      { title: "Corbeille", code: "wp post delete 42" },
      { title: "Définitif", code: "wp post delete 42 --force" },
    ],
  }),
  cmd({
    command: "wp post meta list <id>",
    description: "Liste les métadonnées d'un post",
    category: "Posts",
    difficulty: "intermédiaire",
    tags: ["meta", "acf"],
    examples: [
      { title: "Liste", code: "wp post meta list 42" },
      { title: "Get", code: "wp post meta get 42 _thumbnail_id" },
      { title: "Update", code: "wp post meta update 42 my_key 'ma valeur'" },
      { title: "Delete", code: "wp post meta delete 42 my_key" },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "wp post generate",
    description: "Génère des contenus de test",
    category: "Posts",
    difficulty: "intermédiaire",
    tags: ["dev", "fixtures"],
    options: "--count --post_type --post_status --format",
    examples: [{ title: "20 posts", code: "wp post generate --count=20 --post_type=post" }],
  }),
  cmd({
    command: "wp post term add <id> <taxonomy> <term>",
    description: "Assigne un terme à un post",
    category: "Posts",
    difficulty: "intermédiaire",
    tags: ["taxonomy"],
    examples: [
      { title: "Catégorie", code: "wp post term add 42 category news" },
      { title: "List", code: "wp post term list 42 category" },
    ],
  }),
];

export const commentCommands: WPCLICommandInput[] = [
  cmd({
    command: "wp comment list",
    description: "Liste les commentaires",
    category: "Comments",
    tags: ["moderation", "list"],
    options: "--status=approve|hold|spam|trash\n--format --fields",
    examples: [
      { title: "En attente", code: "wp comment list --status=hold --fields=ID,comment_author,comment_content" },
      { title: "Spam", code: "wp comment list --status=spam --format=count" },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "wp comment approve <id>",
    description: "Approuve un commentaire",
    category: "Comments",
    tags: ["moderation"],
    examples: [{ title: "Approuver", code: "wp comment approve 15" }],
  }),
  cmd({
    command: "wp comment spam <id>",
    description: "Marque un commentaire comme spam",
    category: "Comments",
    tags: ["moderation"],
    examples: [
      { title: "Spam", code: "wp comment spam 15" },
      { title: "Trash", code: "wp comment trash 15" },
      { title: "Delete", code: "wp comment delete 15 --force" },
    ],
  }),
  cmd({
    command: "wp comment create",
    description: "Crée un commentaire",
    category: "Comments",
    difficulty: "intermédiaire",
    tags: ["create"],
    examples: [
      {
        title: "Commentaire",
        code: "wp comment create --comment_post_ID=42 --comment_content='Super article' --comment_author='Jean'",
      },
    ],
  }),
  cmd({
    command: "wp comment generate",
    description: "Génère des commentaires de test",
    category: "Comments",
    difficulty: "intermédiaire",
    tags: ["dev", "fixtures"],
    examples: [{ title: "50 commentaires", code: "wp comment generate --count=50" }],
  }),
];

export const termCommands: WPCLICommandInput[] = [
  cmd({
    command: "wp term list <taxonomy>",
    description: "Liste les termes d'une taxonomie",
    category: "Terms",
    tags: ["taxonomy", "list"],
    examples: [
      { title: "Catégories", code: "wp term list category --fields=term_id,name,slug,count" },
      { title: "Tags", code: "wp term list post_tag --format=csv" },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "wp term create <taxonomy> <name>",
    description: "Crée un terme",
    category: "Terms",
    tags: ["taxonomy", "create"],
    options: "--slug --parent --description --porcelain",
    examples: [
      { title: "Catégorie", code: "wp term create category 'Actualités' --slug=actualites" },
    ],
  }),
  cmd({
    command: "wp term update <taxonomy> <term>",
    description: "Met à jour un terme",
    category: "Terms",
    difficulty: "intermédiaire",
    tags: ["taxonomy"],
    examples: [{ title: "Rename", code: "wp term update category 5 --name='News'" }],
  }),
  cmd({
    command: "wp term delete <taxonomy> <term>",
    description: "Supprime un terme",
    category: "Terms",
    difficulty: "intermédiaire",
    tags: ["taxonomy", "cleanup"],
    examples: [{ title: "Delete", code: "wp term delete post_tag obsolete" }],
  }),
  cmd({
    command: "wp term get <taxonomy> <term>",
    description: "Détails d'un terme",
    category: "Terms",
    tags: ["taxonomy"],
    examples: [{ title: "Get", code: "wp term get category actualites" }],
  }),
];
