import db from '../db/database';

export type DomainHubCredentialsRow = {
  user_id: string;
  cloudflare_api_token: string | null;
  cloudflare_account_id: string | null;
  hostinger_api_token: string | null;
  ovh_app_key: string | null;
  ovh_app_secret: string | null;
  ovh_consumer_key: string | null;
  ovh_subsidiary: string | null;
  updated_at: string;
};

export interface DomainHubCredentialsPublic {
  cloudflareApiToken: string;
  cloudflareAccountId: string | null;
  hostingerApiToken: string;
  ovhAppKey: string;
  ovhAppSecret: string;
  ovhConsumerKey: string;
  ovhSubsidiary: string;
  configured: {
    cloudflare: boolean;
    hostinger: boolean;
    ovh: boolean;
  };
}

export interface RegistrarCredentials {
  cloudflareApiToken: string | null;
  cloudflareAccountId: string | null;
  hostingerApiToken: string | null;
  ovhAppKey: string | null;
  ovhAppSecret: string | null;
  ovhConsumerKey: string | null;
  ovhSubsidiary: string | null;
}

const SECRET_FIELDS = new Set([
  'cloudflareApiToken',
  'hostingerApiToken',
  'ovhAppKey',
  'ovhAppSecret',
  'ovhConsumerKey',
]);

type NullableCredentialColumn = Exclude<
  keyof DomainHubCredentialsRow,
  'user_id' | 'updated_at'
>;

const CAMEL_TO_SNAKE: Record<string, NullableCredentialColumn> = {
  cloudflareApiToken: 'cloudflare_api_token',
  cloudflareAccountId: 'cloudflare_account_id',
  hostingerApiToken: 'hostinger_api_token',
  ovhAppKey: 'ovh_app_key',
  ovhAppSecret: 'ovh_app_secret',
  ovhConsumerKey: 'ovh_consumer_key',
  ovhSubsidiary: 'ovh_subsidiary',
};

const EMPTY_REGISTRAR_CREDENTIALS: RegistrarCredentials = {
  cloudflareApiToken: null,
  cloudflareAccountId: null,
  hostingerApiToken: null,
  ovhAppKey: null,
  ovhAppSecret: null,
  ovhConsumerKey: null,
  ovhSubsidiary: null,
};

function maskSecret(value: string | null): string {
  return value ? '***' : '';
}

export function isCloudflareConfigured(c: RegistrarCredentials): boolean {
  return Boolean(c.cloudflareApiToken && c.cloudflareAccountId);
}

export function isHostingerConfigured(c: RegistrarCredentials): boolean {
  return Boolean(c.hostingerApiToken);
}

export function isOvhConfigured(c: RegistrarCredentials): boolean {
  return Boolean(c.ovhAppKey && c.ovhAppSecret && c.ovhConsumerKey);
}

export function getCredentialsRow(userId: string): DomainHubCredentialsRow | undefined {
  return db
    .prepare('SELECT * FROM domain_hub_credentials WHERE user_id = ?')
    .get(userId) as DomainHubCredentialsRow | undefined;
}

export function toRegistrarCredentials(row: DomainHubCredentialsRow | undefined): RegistrarCredentials {
  if (!row) {
    return { ...EMPTY_REGISTRAR_CREDENTIALS };
  }

  return {
    cloudflareApiToken: row.cloudflare_api_token,
    cloudflareAccountId: row.cloudflare_account_id,
    hostingerApiToken: row.hostinger_api_token,
    ovhAppKey: row.ovh_app_key,
    ovhAppSecret: row.ovh_app_secret,
    ovhConsumerKey: row.ovh_consumer_key,
    ovhSubsidiary: row.ovh_subsidiary,
  };
}

export function toPublic(row: DomainHubCredentialsRow | undefined): DomainHubCredentialsPublic {
  const raw = toRegistrarCredentials(row);

  return {
    cloudflareApiToken: maskSecret(raw.cloudflareApiToken),
    cloudflareAccountId: raw.cloudflareAccountId,
    hostingerApiToken: maskSecret(raw.hostingerApiToken),
    ovhAppKey: maskSecret(raw.ovhAppKey),
    ovhAppSecret: maskSecret(raw.ovhAppSecret),
    ovhConsumerKey: maskSecret(raw.ovhConsumerKey),
    ovhSubsidiary: raw.ovhSubsidiary ?? 'FR',
    configured: {
      cloudflare: isCloudflareConfigured(raw),
      hostinger: isHostingerConfigured(raw),
      ovh: isOvhConfigured(raw),
    },
  };
}

function applyBodyField(
  target: DomainHubCredentialsRow,
  existing: DomainHubCredentialsRow | undefined,
  camelKey: string,
  bodyValue: unknown
): void {
  const snakeKey = CAMEL_TO_SNAKE[camelKey];
  if (!snakeKey) {
    return;
  }

  const strVal =
    typeof bodyValue === 'string' ? bodyValue : bodyValue == null ? '' : String(bodyValue);

  if (SECRET_FIELDS.has(camelKey)) {
    if (strVal === '***') {
      target[snakeKey] = existing?.[snakeKey] ?? null;
      return;
    }
    target[snakeKey] = strVal === '' ? null : strVal;
    return;
  }

  target[snakeKey] = strVal === '' ? null : strVal;
}

export function upsertCredentials(
  userId: string,
  body: Record<string, unknown>
): DomainHubCredentialsPublic {
  const existing = getCredentialsRow(userId);
  const now = new Date().toISOString();

  const row: DomainHubCredentialsRow = {
    user_id: userId,
    cloudflare_api_token: existing?.cloudflare_api_token ?? null,
    cloudflare_account_id: existing?.cloudflare_account_id ?? null,
    hostinger_api_token: existing?.hostinger_api_token ?? null,
    ovh_app_key: existing?.ovh_app_key ?? null,
    ovh_app_secret: existing?.ovh_app_secret ?? null,
    ovh_consumer_key: existing?.ovh_consumer_key ?? null,
    ovh_subsidiary: existing?.ovh_subsidiary ?? null,
    updated_at: now,
  };

  for (const [camelKey, bodyValue] of Object.entries(body)) {
    applyBodyField(row, existing, camelKey, bodyValue);
  }

  if (existing) {
    db.prepare(
      `UPDATE domain_hub_credentials SET
        cloudflare_api_token = ?,
        cloudflare_account_id = ?,
        hostinger_api_token = ?,
        ovh_app_key = ?,
        ovh_app_secret = ?,
        ovh_consumer_key = ?,
        ovh_subsidiary = ?,
        updated_at = ?
      WHERE user_id = ?`
    ).run(
      row.cloudflare_api_token,
      row.cloudflare_account_id,
      row.hostinger_api_token,
      row.ovh_app_key,
      row.ovh_app_secret,
      row.ovh_consumer_key,
      row.ovh_subsidiary,
      row.updated_at,
      userId
    );
  } else {
    db.prepare(
      `INSERT INTO domain_hub_credentials (
        user_id,
        cloudflare_api_token,
        cloudflare_account_id,
        hostinger_api_token,
        ovh_app_key,
        ovh_app_secret,
        ovh_consumer_key,
        ovh_subsidiary,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      row.user_id,
      row.cloudflare_api_token,
      row.cloudflare_account_id,
      row.hostinger_api_token,
      row.ovh_app_key,
      row.ovh_app_secret,
      row.ovh_consumer_key,
      row.ovh_subsidiary,
      row.updated_at
    );
  }

  return toPublic(getCredentialsRow(userId));
}
