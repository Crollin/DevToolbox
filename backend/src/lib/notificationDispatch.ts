import {
  sendLicenceExpirationEmail,
  sendDomainExpirationEmail,
  sendTestEmail,
  sendTaskReminderEmail,
  ExpiringLicence,
  EmailPreferences,
  TaskReminder,
} from './email';
import { sendTelegramMessage } from './telegram';
import { NotificationChannel } from './notificationChannels';
import { sendWebPushToUser } from './webPush';

export interface NotificationDispatchConfig {
  channels: NotificationChannel[];
  serverUrl: string;
  topic: string;
  token: string | null;
  telegramChatId: string | null;
}

export interface NotificationDispatchResults {
  ntfy?: boolean;
  email?: boolean;
  telegram?: boolean;
  webpush?: boolean;
  errors?: {
    ntfy?: string;
    email?: string;
    telegram?: string;
    webpush?: string;
  };
}

export interface ExpiringDomain {
  name: string;
  clientName: string | null;
  clientEmail: string | null;
  payer: string;
  sellYearly: number | null;
  currency: string;
  daysUntilExpiry: number;
  isExpired: boolean;
}

type ChannelSenders = {
  ntfy?: () => Promise<boolean>;
  email?: () => Promise<boolean>;
  telegram?: () => Promise<boolean>;
};

async function dispatchChannels(
  channels: NotificationChannel[],
  senders: ChannelSenders,
  withErrors = false
): Promise<NotificationDispatchResults> {
  const results: NotificationDispatchResults = withErrors ? { errors: {} } : {};

  const run = async (channel: NotificationChannel, send?: () => Promise<boolean>) => {
    if (!channels.includes(channel) || !send) return;
    try {
      results[channel] = await send();
      if (withErrors && !results[channel]) {
        results.errors![channel] = `Erreur lors de l'envoi ${channel}`;
      }
    } catch (error) {
      console.error(`Erreur canal ${channel}:`, error);
      results[channel] = false;
      if (withErrors) {
        results.errors![channel] =
          error instanceof Error ? error.message : `Erreur ${channel}`;
      }
    }
  };

  await run('ntfy', senders.ntfy);
  await run('email', senders.email);
  await run('telegram', senders.telegram);

  return results;
}

function formatLicenceMessage(licences: ExpiringLicence[]): string {
  return licences
    .map((licence) => {
      if (licence.isExpired) {
        return `❌ ${licence.name} - Expirée depuis ${Math.abs(licence.daysUntilExpiry)} jours`;
      }
      return `⚠️ ${licence.name} - ${licence.daysUntilExpiry} jours restants`;
    })
    .join('\n');
}

export function formatDomainMessage(domains: ExpiringDomain[]): string {
  return domains
    .map((domain) => {
      const label = domain.clientName
        ? `${domain.name} (${domain.clientName})`
        : domain.name;
      const expiryLine = domain.isExpired
        ? `❌ Expiré depuis ${Math.abs(domain.daysUntilExpiry)} jours`
        : `⚠️ ${domain.daysUntilExpiry} jours restants`;

      const billingLines: string[] = [];
      if (domain.payer === 'client') {
        billingLines.push('💶 À facturer au client');
        if (domain.sellYearly != null && domain.sellYearly > 0) {
          billingLines.push(`   Montant : ${domain.sellYearly.toFixed(2)} ${domain.currency} HT/an`);
        }
        if (domain.clientEmail) {
          billingLines.push(`   Email : ${domain.clientEmail}`);
        }
      } else {
        billingLines.push('🏢 Renouvellement agence');
      }

      return `${label}\n${expiryLine}\n${billingLines.join('\n')}`;
    })
    .join('\n\n');
}

export function formatTaskMessage(task: TaskReminder): string {
  return [
    `📋 ${task.title}`,
    task.daysUntilDue !== undefined && task.daysUntilDue < 0
      ? `⚠️ En retard depuis ${Math.abs(task.daysUntilDue)} jour(s)`
      : task.daysUntilDue === 0
        ? "🔴 Échéance aujourd'hui !"
        : task.daysUntilDue === 1
          ? '⚠️ Échéance demain'
          : task.daysUntilDue !== undefined
            ? `📅 Échéance dans ${task.daysUntilDue} jour(s)`
            : '',
    task.dueDate ? `📅 ${new Date(task.dueDate).toLocaleDateString('fr-FR')}` : '',
    task.client ? `👤 ${task.client}` : '',
    task.link || '',
  ]
    .filter(Boolean)
    .join('\n');
}

async function sendNtfyMessage(
  config: NotificationDispatchConfig,
  title: string,
  body: string,
  tags: string,
  priority: 'default' | 'high' = 'default'
): Promise<boolean> {
  if (!config.topic) return false;

  const headers: Record<string, string> = {
    'Content-Type': 'text/plain; charset=utf-8',
    Title: title,
    Priority: priority,
    Tags: tags,
  };

  if (config.token) {
    headers.Authorization = `Bearer ${config.token}`;
  }

  const response = await fetch(`${config.serverUrl}/${config.topic}`, {
    method: 'POST',
    headers,
    body,
  });

  return response.ok;
}

/** Mode B : fan-out Web Push si l'utilisateur a des appareils abonnés. */
async function fanOutWebPush(
  results: NotificationDispatchResults,
  userId: string | undefined,
  title: string,
  body: string,
  url = '/'
): Promise<void> {
  if (!userId) return;

  try {
    const pushResult = await sendWebPushToUser(userId, { title, body, url });
    if (pushResult.count === 0 && !pushResult.error) return;
    results.webpush = pushResult.sent;
    if (!pushResult.sent && pushResult.error) {
      results.errors = results.errors || {};
      results.errors.webpush = pushResult.error;
    }
  } catch (error) {
    console.error('Erreur fan-out Web Push:', error);
    results.webpush = false;
    results.errors = results.errors || {};
    results.errors.webpush = error instanceof Error ? error.message : 'Erreur Web Push';
  }
}

function channelSendersFor(
  config: NotificationDispatchConfig,
  opts: {
    ntfyTitle: string;
    ntfyBody: string;
    ntfyTags: string;
    ntfyPriority?: 'default' | 'high';
    email: () => Promise<boolean>;
    telegramText: string;
  }
): ChannelSenders {
  return {
    ntfy: config.topic
      ? () =>
          sendNtfyMessage(
            config,
            opts.ntfyTitle,
            opts.ntfyBody,
            opts.ntfyTags,
            opts.ntfyPriority
          )
      : async () => false,
    email: opts.email,
    telegram: config.telegramChatId
      ? () => sendTelegramMessage(config.telegramChatId!, opts.telegramText)
      : async () => false,
  };
}

export async function testNotifications(
  config: NotificationDispatchConfig,
  user: { email: string; name: string },
  emailPrefs?: EmailPreferences | null,
  userId?: string
): Promise<NotificationDispatchResults> {
  const results = await dispatchChannels(
    config.channels,
    channelSendersFor(config, {
      ntfyTitle: 'Test de notification DevToolbox',
      ntfyBody:
        'Ceci est un message de test depuis DevToolbox. Si vous recevez ce message, votre configuration Ntfy fonctionne correctement ! ✅',
      ntfyTags: 'test,devtoolbox',
      email: () => sendTestEmail(user.email, user.name, emailPrefs),
      telegramText:
        '✅ Test de notification DevToolbox\n\nSi vous recevez ce message, votre configuration Telegram fonctionne correctement.',
    }),
    true
  );

  if (!config.topic && config.channels.includes('ntfy')) {
    results.ntfy = false;
    results.errors = results.errors || {};
    results.errors.ntfy = 'Topic non configuré';
  }
  if (!config.telegramChatId && config.channels.includes('telegram')) {
    results.telegram = false;
    results.errors = results.errors || {};
    results.errors.telegram = 'Chat ID Telegram non configuré';
  }

  await fanOutWebPush(
    results,
    userId,
    'Test de notification DevToolbox',
    'Ceci est un message de test depuis DevToolbox. Si vous recevez cette notification, le Web Push fonctionne ! ✅',
    '/'
  );

  if (results.errors && Object.keys(results.errors).length === 0) {
    delete results.errors;
  }

  return results;
}

export async function sendLicenceNotifications(
  config: NotificationDispatchConfig,
  user: { email: string; name: string },
  licences: ExpiringLicence[],
  emailPrefs?: EmailPreferences | null,
  userId?: string
): Promise<NotificationDispatchResults> {
  const message = formatLicenceMessage(licences);
  const hasExpired = licences.some((licence) => licence.isExpired);
  const title = `Licences à renouveler (${licences.length})`;

  const results = await dispatchChannels(
    config.channels,
    channelSendersFor(config, {
      ntfyTitle: title,
      ntfyBody: message,
      ntfyTags: hasExpired ? 'warning,key' : 'key',
      ntfyPriority: hasExpired ? 'high' : 'default',
      email: () => sendLicenceExpirationEmail(user.email, user.name, licences, emailPrefs),
      telegramText: `🔑 Licences à renouveler (${licences.length})\n\n${message}`,
    })
  );

  await fanOutWebPush(results, userId, title, message, '/licences');
  return results;
}

export async function sendDomainNotifications(
  config: NotificationDispatchConfig,
  user: { email: string; name: string },
  domains: ExpiringDomain[],
  emailPrefs?: EmailPreferences | null,
  userId?: string
): Promise<NotificationDispatchResults> {
  const message = formatDomainMessage(domains);
  const hasExpired = domains.some((domain) => domain.isExpired);
  const billableCount = domains.filter((d) => d.payer === 'client').length;
  const title =
    billableCount > 0
      ? `Domaines à renouveler (${domains.length}, ${billableCount} à facturer)`
      : `Domaines à renouveler (${domains.length})`;
  const telegramHeader =
    billableCount > 0
      ? `🌐 Domaines à renouveler (${domains.length}, ${billableCount} à facturer)\n\n`
      : `🌐 Domaines à renouveler (${domains.length})\n\n`;

  const results = await dispatchChannels(
    config.channels,
    channelSendersFor(config, {
      ntfyTitle: title,
      ntfyBody: message,
      ntfyTags: hasExpired ? 'warning,globe' : 'globe',
      ntfyPriority: hasExpired ? 'high' : 'default',
      email: () => sendDomainExpirationEmail(user.email, user.name, domains, emailPrefs),
      telegramText: telegramHeader + message,
    })
  );

  await fanOutWebPush(results, userId, title, message, '/domains');
  return results;
}

export async function sendTaskNotifications(
  config: NotificationDispatchConfig,
  user: { id: string; email: string; name: string },
  task: TaskReminder,
  emailPrefs?: EmailPreferences | null
): Promise<boolean> {
  const message = formatTaskMessage(task);
  let urgencyTag = 'calendar';
  if (task.daysUntilDue !== undefined) {
    if (task.daysUntilDue < 0) urgencyTag = 'warning';
    else if (task.daysUntilDue <= 1) urgencyTag = 'alarm';
  }
  const priority =
    task.daysUntilDue !== undefined && task.daysUntilDue <= 1 ? 'high' : 'default';

  const results = await dispatchChannels(
    config.channels,
    channelSendersFor(config, {
      ntfyTitle: `📋 Rappel : ${task.title}`,
      ntfyBody: message,
      ntfyTags: urgencyTag,
      ntfyPriority: priority,
      email: () => sendTaskReminderEmail(user.email, user.name, task, emailPrefs),
      telegramText: message,
    })
  );

  await fanOutWebPush(results, user.id, `Rappel : ${task.title}`, message, '/tasks');

  return Object.values(results).some((value) => value === true);
}
