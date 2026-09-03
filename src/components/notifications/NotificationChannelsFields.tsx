import { Bell, Mail, MessageCircle, CheckCircle2 } from "lucide-react";
import { NotificationChannel } from "@/types/licence";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const NOTIFICATION_CHANNEL_OPTIONS: Array<{
  id: NotificationChannel;
  label: string;
  description: string;
  icon: typeof Bell;
}> = [
  { id: "ntfy", label: "Ntfy", description: "Notifications push via ntfy.sh", icon: Bell },
  { id: "email", label: "Email", description: "Notifications sur l'adresse de votre compte", icon: Mail },
  { id: "telegram", label: "Telegram", description: "Messages via votre bot Telegram", icon: MessageCircle },
];

export function validateNotificationChannels(opts: {
  channels: NotificationChannel[];
  topic: string;
  telegramChatId: string;
  emailConfigured?: boolean;
  telegramConfigured?: boolean;
}): string | null {
  const { channels, topic, telegramChatId, emailConfigured, telegramConfigured } = opts;
  if (channels.length === 0) return "Sélectionnez au moins un canal de notification.";
  if (channels.includes("ntfy") && !topic.trim()) return "Veuillez configurer un topic ntfy.";
  if (channels.includes("telegram") && !telegramChatId.trim()) {
    return "Veuillez renseigner votre Chat ID Telegram.";
  }
  if (channels.includes("email") && emailConfigured === false) {
    return "Le service email n'est pas configuré sur le serveur.";
  }
  if (channels.includes("telegram") && telegramConfigured === false) {
    return "Le bot Telegram n'est pas configuré sur le serveur.";
  }
  return null;
}

interface NotificationChannelsFieldsProps {
  channels: NotificationChannel[];
  onChannelsChange: (channels: NotificationChannel[]) => void;
  serverUrl: string;
  onServerUrlChange: (value: string) => void;
  topic: string;
  onTopicChange: (value: string) => void;
  token: string;
  onTokenChange: (value: string) => void;
  telegramChatId: string;
  onTelegramChatIdChange: (value: string) => void;
  emailConfigured?: boolean;
  telegramConfigured?: boolean;
  accountEmail?: string;
}

export function NotificationChannelsFields({
  channels,
  onChannelsChange,
  serverUrl,
  onServerUrlChange,
  topic,
  onTopicChange,
  token,
  onTokenChange,
  telegramChatId,
  onTelegramChatIdChange,
  emailConfigured,
  telegramConfigured,
  accountEmail,
}: NotificationChannelsFieldsProps) {
  const hasNtfy = channels.includes("ntfy");
  const hasEmail = channels.includes("email");
  const hasTelegram = channels.includes("telegram");

  const toggleChannel = (channel: NotificationChannel) => {
    onChannelsChange(
      channels.includes(channel)
        ? channels.filter((item) => item !== channel)
        : [...channels, channel]
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Canaux de communication</Label>
        <p className="text-xs text-muted-foreground">
          Activez un ou plusieurs canaux selon vos préférences.
        </p>
        <div className="space-y-2">
          {NOTIFICATION_CHANNEL_OPTIONS.map(({ id, label, description, icon: Icon }) => (
            <label
              key={id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <input
                type="checkbox"
                checked={channels.includes(id)}
                onChange={() => toggleChannel(id)}
                className="mt-1 w-4 h-4"
              />
              <Icon className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{label}</span>
                  {id === "email" && emailConfigured === false && (
                    <span className="text-xs text-amber-500">(email non configuré)</span>
                  )}
                  {id === "telegram" && telegramConfigured === false && (
                    <span className="text-xs text-amber-500">(bot Telegram non configuré)</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {hasNtfy && (
        <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Configuration Ntfy
          </h3>
          <div className="space-y-2">
            <Label>URL du serveur ntfy</Label>
            <Input
              value={serverUrl}
              onChange={(e) => onServerUrlChange(e.target.value)}
              placeholder="https://ntfy.sh"
            />
          </div>
          <div className="space-y-2">
            <Label>Topic *</Label>
            <Input value={topic} onChange={(e) => onTopicChange(e.target.value)} placeholder="mon-topic" />
          </div>
          <div className="space-y-2">
            <Label>Token (optionnel)</Label>
            <Input
              type="password"
              value={token}
              onChange={(e) => onTokenChange(e.target.value)}
              placeholder="tk_..."
            />
          </div>
        </div>
      )}

      {hasEmail && (
        <div className="p-4 rounded-lg bg-muted/30 border border-border">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4" />
            Configuration Email
          </h3>
          {emailConfigured ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Service email configuré
              {accountEmail ? ` — notifications envoyées à ${accountEmail}` : ""}
            </p>
          ) : (
            <p className="text-sm text-amber-500">
              Configurez SMTP/Resend dans l&apos;onglet SMTP ou via les variables d&apos;environnement du serveur.
            </p>
          )}
        </div>
      )}

      {hasTelegram && (
        <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Configuration Telegram
          </h3>
          {telegramConfigured ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Bot Telegram configuré sur le serveur
            </p>
          ) : (
            <p className="text-sm text-amber-500">
              Ajoutez TELEGRAM_BOT_TOKEN dans les variables d&apos;environnement du backend.
            </p>
          )}
          <div className="space-y-2">
            <Label>Chat ID *</Label>
            <Input
              value={telegramChatId}
              onChange={(e) => onTelegramChatIdChange(e.target.value)}
              placeholder="123456789"
            />
            <p className="text-xs text-muted-foreground">
              Obtenez votre Chat ID via @userinfobot sur Telegram.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
