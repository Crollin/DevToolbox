import { sendLicenceExpirationEmail, sendDomainExpirationEmail, sendTestEmail, ExpiringLicence, EmailPreferences } from './email';
import { sendTelegramMessage } from './telegram';
import { hasChannel, NotificationChannel } from './notificationChannels';

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
  errors?: {
    ntfy?: string;
    email?: string;
    telegram?: string;
  };
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

async function sendNtfyMessage(
  config: NotificationDispatchConfig,
  title: string,
  body: string,
  tags: string,
  priority: 'default' | 'high' = 'default'
): Promise<boolean> {
  if (!config.topic) {
    return false;
  }

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

export async function testNotifications(
  config: NotificationDispatchConfig,
  user: { email: string; name: string },
  emailPrefs?: EmailPreferences | null
): Promise<NotificationDispatchResults> {
  const results: NotificationDispatchResults = { errors: {} };

  if (hasChannel(config.channels, 'ntfy')) {
    if (!config.topic) {
      results.ntfy = false;
      results.errors!.ntfy = 'Topic non configuré';
    } else {
      try {
        results.ntfy = await sendNtfyMessage(
          config,
          'Test de notification DevToolbox',
          'Ceci est un message de test depuis DevToolbox. Si vous recevez ce message, votre configuration Ntfy fonctionne correctement ! ✅',
          'test,devtoolbox'
        );
        if (!results.ntfy) {
          results.errors!.ntfy = 'Erreur HTTP lors de l\'envoi Ntfy';
        }
      } catch (error) {
        results.ntfy = false;
        results.errors!.ntfy = error instanceof Error ? error.message : 'Erreur de connexion';
      }
    }
  }

  if (hasChannel(config.channels, 'email')) {
    try {
      results.email = await sendTestEmail(user.email, user.name, emailPrefs);
      if (!results.email) {
        results.errors!.email = 'Service email non configuré ou erreur d\'envoi';
      }
    } catch (error) {
      results.email = false;
      results.errors!.email = error instanceof Error ? error.message : 'Erreur d\'envoi';
    }
  }

  if (hasChannel(config.channels, 'telegram')) {
    if (!config.telegramChatId) {
      results.telegram = false;
      results.errors!.telegram = 'Chat ID Telegram non configuré';
    } else {
      try {
        results.telegram = await sendTelegramMessage(
          config.telegramChatId,
          '✅ Test de notification DevToolbox\n\nSi vous recevez ce message, votre configuration Telegram fonctionne correctement.'
        );
        if (!results.telegram) {
          results.errors!.telegram = 'Erreur lors de l\'envoi Telegram';
        }
      } catch (error) {
        results.telegram = false;
        results.errors!.telegram = error instanceof Error ? error.message : 'Erreur Telegram';
      }
    }
  }

  if (results.errors && Object.keys(results.errors).length === 0) {
    delete results.errors;
  }

  return results;
}

export async function sendLicenceNotifications(
  config: NotificationDispatchConfig,
  user: { email: string; name: string },
  licences: ExpiringLicence[],
  emailPrefs?: EmailPreferences | null
): Promise<NotificationDispatchResults> {
  const results: NotificationDispatchResults = {};
  const message = formatLicenceMessage(licences);
  const hasExpired = licences.some((licence) => licence.isExpired);

  if (hasChannel(config.channels, 'ntfy')) {
    if (!config.topic) {
      results.ntfy = false;
    } else {
      try {
        results.ntfy = await sendNtfyMessage(
          config,
          `Licences à renouveler (${licences.length})`,
          message,
          hasExpired ? 'warning,key' : 'key',
          hasExpired ? 'high' : 'default'
        );
      } catch (error) {
        console.error('Erreur lors de l\'envoi Ntfy:', error);
        results.ntfy = false;
      }
    }
  }

  if (hasChannel(config.channels, 'email')) {
    try {
      results.email = await sendLicenceExpirationEmail(user.email, user.name, licences, emailPrefs);
    } catch (error) {
      console.error('Erreur lors de l\'envoi email:', error);
      results.email = false;
    }
  }

  if (hasChannel(config.channels, 'telegram')) {
    if (!config.telegramChatId) {
      results.telegram = false;
    } else {
      try {
        results.telegram = await sendTelegramMessage(
          config.telegramChatId,
          `🔑 Licences à renouveler (${licences.length})\n\n${message}`
        );
      } catch (error) {
        console.error('Erreur lors de l\'envoi Telegram:', error);
        results.telegram = false;
      }
    }
  }

  return results;
}

export async function sendDomainNotifications(
  config: NotificationDispatchConfig,
  user: { email: string; name: string },
  domains: ExpiringDomain[],
  emailPrefs?: EmailPreferences | null
): Promise<NotificationDispatchResults> {
  const results: NotificationDispatchResults = {};
  const message = formatDomainMessage(domains);
  const hasExpired = domains.some((domain) => domain.isExpired);
  const billableCount = domains.filter((d) => d.payer === 'client').length;

  if (hasChannel(config.channels, 'ntfy')) {
    if (!config.topic) {
      results.ntfy = false;
    } else {
      try {
        const title =
          billableCount > 0
            ? `Domaines à renouveler (${domains.length}, ${billableCount} à facturer)`
            : `Domaines à renouveler (${domains.length})`;
        results.ntfy = await sendNtfyMessage(
          config,
          title,
          message,
          hasExpired ? 'warning,globe' : 'globe',
          hasExpired ? 'high' : 'default'
        );
      } catch (error) {
        console.error('Erreur lors de l\'envoi Ntfy (domaines):', error);
        results.ntfy = false;
      }
    }
  }

  if (hasChannel(config.channels, 'email')) {
    try {
      results.email = await sendDomainExpirationEmail(
        user.email,
        user.name,
        domains,
        emailPrefs
      );
    } catch (error) {
      console.error('Erreur lors de l\'envoi email (domaines):', error);
      results.email = false;
    }
  }

  if (hasChannel(config.channels, 'telegram')) {
    if (!config.telegramChatId) {
      results.telegram = false;
    } else {
      try {
        const header =
          billableCount > 0
            ? `🌐 Domaines à renouveler (${domains.length}, ${billableCount} à facturer)\n\n`
            : `🌐 Domaines à renouveler (${domains.length})\n\n`;
        results.telegram = await sendTelegramMessage(config.telegramChatId, header + message);
      } catch (error) {
        console.error('Erreur lors de l\'envoi Telegram (domaines):', error);
        results.telegram = false;
      }
    }
  }

  return results;
}

export async function sendNtfyTaskNotification(
  config: NotificationDispatchConfig,
  title: string,
  body: string
): Promise<boolean> {
  if (!hasChannel(config.channels, 'ntfy') || !config.topic) {
    return false;
  }

  return sendNtfyMessage(config, title, body, 'clipboard');
}

export async function sendTelegramTaskNotification(
  config: NotificationDispatchConfig,
  text: string
): Promise<boolean> {
  if (!hasChannel(config.channels, 'telegram') || !config.telegramChatId) {
    return false;
  }

  return sendTelegramMessage(config.telegramChatId, text);
}
