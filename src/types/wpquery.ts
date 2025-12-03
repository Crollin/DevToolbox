export interface MetaQuery {
  key: string;
  value: string;
  compare: "=" | "!=" | ">" | ">=" | "<" | "<=" | "LIKE" | "NOT LIKE" | "IN" | "NOT IN" | "BETWEEN" | "NOT BETWEEN" | "EXISTS" | "NOT EXISTS";
  type?: "NUMERIC" | "BINARY" | "CHAR" | "DATE" | "DATETIME" | "DECIMAL" | "SIGNED" | "TIME" | "UNSIGNED";
}

export interface TaxQuery {
  taxonomy: string;
  field: "term_id" | "name" | "slug" | "term_taxonomy_id";
  terms: string[];
  operator: "IN" | "NOT IN" | "AND" | "EXISTS" | "NOT EXISTS";
}

export interface DateQuery {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  after?: string;
  before?: string;
  compare?: "=" | "!=" | ">" | ">=" | "<" | "<=" | "IN" | "NOT IN" | "BETWEEN" | "NOT BETWEEN";
  column?: "post_date" | "post_date_gmt" | "post_modified" | "post_modified_gmt";
}

export interface WPQueryConfig {
  post_type?: string[];
  post_status?: string[];
  posts_per_page?: number;
  offset?: number;
  paged?: number;
  orderby?: "none" | "ID" | "author" | "title" | "name" | "type" | "date" | "modified" | "parent" | "rand" | "comment_count" | "relevance" | "menu_order" | "meta_value" | "meta_value_num" | "post__in" | "post_name__in" | "post_parent__in";
  order?: "ASC" | "DESC";
  meta_key?: string;
  meta_value?: string;
  meta_query?: MetaQuery[];
  tax_query?: TaxQuery[];
  date_query?: DateQuery[];
  author?: number | number[];
  author_name?: string;
  category__in?: number[];
  category__not_in?: number[];
  tag__in?: number[];
  tag__not_in?: number[];
  search?: string;
  post__in?: number[];
  post__not_in?: number[];
  exclude?: number[];
  include?: number[];
}

export interface SavedQuery {
  id: string;
  name: string;
  description?: string;
  config: WPQueryConfig;
  createdAt: string;
  updatedAt: string;
}

export const defaultPostTypes = [
  "post",
  "page",
  "attachment",
  "revision",
  "nav_menu_item",
  "custom_css",
  "customize_changeset",
  "oembed_cache",
  "user_request",
  "wp_block",
];

export const defaultPostStatuses = [
  "publish",
  "pending",
  "draft",
  "auto-draft",
  "future",
  "private",
  "inherit",
  "trash",
];

export const orderByOptions = [
  { value: "none", label: "Aucun" },
  { value: "ID", label: "ID" },
  { value: "author", label: "Auteur" },
  { value: "title", label: "Titre" },
  { value: "name", label: "Nom (slug)" },
  { value: "type", label: "Type" },
  { value: "date", label: "Date" },
  { value: "modified", label: "Modifié" },
  { value: "parent", label: "Parent" },
  { value: "rand", label: "Aléatoire" },
  { value: "comment_count", label: "Nombre de commentaires" },
  { value: "relevance", label: "Pertinence" },
  { value: "menu_order", label: "Ordre du menu" },
  { value: "meta_value", label: "Valeur meta" },
  { value: "meta_value_num", label: "Valeur meta (numérique)" },
  { value: "post__in", label: "IDs spécifiques" },
];

export const metaCompareOptions = [
  "=",
  "!=",
  ">",
  ">=",
  "<",
  "<=",
  "LIKE",
  "NOT LIKE",
  "IN",
  "NOT IN",
  "BETWEEN",
  "NOT BETWEEN",
  "EXISTS",
  "NOT EXISTS",
];

export const metaTypeOptions = [
  "NUMERIC",
  "BINARY",
  "CHAR",
  "DATE",
  "DATETIME",
  "DECIMAL",
  "SIGNED",
  "TIME",
  "UNSIGNED",
];

export const taxOperatorOptions = [
  "IN",
  "NOT IN",
  "AND",
  "EXISTS",
  "NOT EXISTS",
];

export const taxFieldOptions = [
  { value: "term_id", label: "ID du terme" },
  { value: "name", label: "Nom" },
  { value: "slug", label: "Slug" },
  { value: "term_taxonomy_id", label: "ID de taxonomie" },
];




