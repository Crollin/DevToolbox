export type LicenceType = "wordpress" | "saas" | "api" | "autre";

export interface Licence {
  id: string;
  name: string;
  key: string;
  type: LicenceType;
  isLifetime: boolean;
  renewalDate?: string;
  notes?: string;
  notificationsEnabled?: boolean;
  createdAt: string;
}

export interface NtfyConfig {
  enabled: boolean;
  serverUrl: string;
  topic: string;
  token?: string;
  notificationType?: 'ntfy' | 'email' | 'both';
  autoRemindersEnabled?: boolean;
  reminderFrequency?: 'daily' | 'weekly';
  lastReminderSentAt?: string;
  emailConfigured?: boolean;
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
