export type LicenceType = "wordpress" | "saas" | "api" | "autre";

export interface Licence {
  id: string;
  name: string;
  key: string;
  type: LicenceType;
  seatCount?: number;
  isLifetime: boolean;
  renewalDate?: string;
  notes?: string;
  notificationsEnabled?: boolean;
  createdAt: string;
}

export type NotificationChannel = 'ntfy' | 'email' | 'telegram';

export interface NtfyConfig {
  enabled: boolean;
  serverUrl: string;
  topic: string;
  token?: string;
  notificationChannels?: NotificationChannel[];
  notificationType?: 'ntfy' | 'email' | 'both' | 'telegram';
  telegramChatId?: string;
  autoRemindersEnabled?: boolean;
  reminderFrequency?: 'daily' | 'weekly';
  lastReminderSentAt?: string;
  emailConfigured?: boolean;
  telegramConfigured?: boolean;
}

export function getNotificationChannelsFromConfig(config: Pick<NtfyConfig, 'notificationChannels' | 'notificationType'>): NotificationChannel[] {
  if (config.notificationChannels && config.notificationChannels.length > 0) {
    return config.notificationChannels;
  }

  switch (config.notificationType) {
    case 'both':
      return ['ntfy', 'email'];
    case 'email':
      return ['email'];
    case 'telegram':
      return ['telegram'];
    case 'ntfy':
    default:
      return ['ntfy'];
  }
}

export const licenceTypeLabels: Record<LicenceType, string> = {
  wordpress: "WordPress",
  saas: "SaaS",
  api: "API",
  autre: "Autre",
};

export const licenceTypeColors: Record<LicenceType, { bg: string; text: string; border: string }> = {
  wordpress: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  saas: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
  api: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  autre: { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/30" },
};
