import { useState, useEffect } from "react";
import { X, Bell, Send, Loader2 } from "lucide-react";
import {
  NtfyConfig,
  Licence,
  NotificationChannel,
  getNotificationChannelsFromConfig,
} from "@/types/licence";
import {
  NotificationChannelsFields,
  validateNotificationChannels,
} from "@/components/notifications/NotificationChannelsFields";
import { getLicenceStatus } from "./LicenceStatusBadge";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: NtfyConfig;
  onSave: (config: Partial<NtfyConfig>) => void;
  licences: Licence[];
}

type NotificationResults = {
  ntfy?: boolean;
  email?: boolean;
  telegram?: boolean;
};

type NotificationErrors = {
  ntfy?: string;
  email?: string;
  telegram?: string;
};

const NotificationModal = ({ isOpen, onClose, config, onSave, licences }: NotificationModalProps) => {
  const [serverUrl, setServerUrl] = useState(config.serverUrl || "https://ntfy.sh");
  const [topic, setTopic] = useState(config.topic || "");
  const [token, setToken] = useState(config.token || "");
  const [channels, setChannels] = useState<NotificationChannel[]>(
    getNotificationChannelsFromConfig(config)
  );
  const [telegramChatId, setTelegramChatId] = useState(config.telegramChatId || "");
  const [autoRemindersEnabled, setAutoRemindersEnabled] = useState(
    config.autoRemindersEnabled || false
  );
  const [reminderFrequency, setReminderFrequency] = useState<'daily' | 'weekly'>(
    config.reminderFrequency || 'daily'
  );
  const [isSending, setIsSending] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    message?: string;
    results?: NotificationResults;
    errors?: NotificationErrors;
  } | null>(null);

  useEffect(() => {
    setServerUrl(config.serverUrl || "https://ntfy.sh");
    setTopic(config.topic || "");
    setToken(config.token || "");
    setChannels(getNotificationChannelsFromConfig(config));
    setTelegramChatId(config.telegramChatId || "");
    setAutoRemindersEnabled(config.autoRemindersEnabled || false);
    setReminderFrequency(config.reminderFrequency || 'daily');
  }, [config, isOpen]);

  const hasNtfy = channels.includes("ntfy");
  const hasEmail = channels.includes("email");
  const hasTelegram = channels.includes("telegram");

  const licencesToRenew = licences.filter((l) => {
    const status = getLicenceStatus(l);
    return status === "expired" || status === "warning";
  });

  const buildPayload = () => ({
    notificationChannels: channels,
    serverUrl,
    topic,
    token: token || undefined,
    telegramChatId: telegramChatId || undefined,
  });

  const validateChannels = (): string | null =>
    validateNotificationChannels({
      channels,
      topic,
      telegramChatId,
      emailConfigured: config.emailConfigured,
      telegramConfigured: config.telegramConfigured,
    });

  const formatResultMessages = (results: NotificationResults, errors?: NotificationErrors) => {
    const messages: string[] = [];

    if (results.ntfy !== undefined) {
      messages.push(
        results.ntfy
          ? "✅ Test Ntfy réussi"
          : `❌ Test Ntfy échoué${errors?.ntfy ? `: ${errors.ntfy}` : ""}`
      );
    }

    if (results.email !== undefined) {
      messages.push(
        results.email
          ? "✅ Test Email réussi"
          : `❌ Test Email échoué${errors?.email ? `: ${errors.email}` : ""}`
      );
    }

    if (results.telegram !== undefined) {
      messages.push(
        results.telegram
          ? "✅ Test Telegram réussi"
          : `❌ Test Telegram échoué${errors?.telegram ? `: ${errors.telegram}` : ""}`
      );
    }

    return messages;
  };

  const handleSave = async () => {
    const validationError = validateChannels();
    if (validationError) {
      toast({
        title: "Configuration incomplète",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    try {
      await onSave({
        serverUrl,
        topic,
        token: token || undefined,
        telegramChatId: telegramChatId || undefined,
        notificationChannels: channels,
        enabled: true,
        autoRemindersEnabled,
        reminderFrequency,
      });
      toast({
        title: "Configuration sauvegardée",
        description: "Les paramètres de notifications ont été mis à jour.",
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration.",
        variant: "destructive",
      });
    }
  };

  const testNotifications = async () => {
    const validationError = validateChannels();
    if (validationError) {
      toast({
        title: "Configuration incomplète",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestResults(null);

    try {
      const response = await api.post<{
        message: string;
        results?: NotificationResults;
        errors?: NotificationErrors;
      }>('/licences/test-notifications', buildPayload());

      setTestResults(response);
      const messages = response.results ? formatResultMessages(response.results, response.errors) : [];

      if (messages.length > 0) {
        toast({
          title: messages.some((message) => message.includes("✅")) ? "Test effectué" : "Test échoué",
          description: messages.join(", "),
          variant: messages.some((message) => message.includes("❌")) ? "destructive" : "default",
        });
      }
    } catch {
      toast({
        title: "Erreur de test",
        description: "Impossible d'effectuer le test. Vérifiez votre configuration.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const sendNotification = async () => {
    const validationError = validateChannels();
    if (validationError) {
      toast({
        title: "Configuration incomplète",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    if (licencesToRenew.length === 0) {
      toast({
        title: "Aucune alerte",
        description: "Aucune licence ne nécessite de renouvellement.",
      });
      return;
    }

    setIsSending(true);

    try {
      const response = await api.post<{
        message?: string;
        sent: boolean;
        results?: NotificationResults;
        licencesCount?: number;
      }>('/licences/send-notifications', buildPayload());

      if (response.sent) {
        const results = response.results || {};
        const messages: string[] = [];

        if (hasNtfy) {
          messages.push(results.ntfy ? "Notification Ntfy envoyée" : "Erreur lors de l'envoi Ntfy");
        }
        if (hasEmail) {
          messages.push(results.email ? "Email envoyé" : "Erreur lors de l'envoi de l'email");
        }
        if (hasTelegram) {
          messages.push(results.telegram ? "Message Telegram envoyé" : "Erreur lors de l'envoi Telegram");
        }

        if (messages.length > 0) {
          toast({
            title: messages.some((message) => message.includes("Erreur")) ? "Envoi partiel" : "Notifications envoyées",
            description: messages.join(", "),
            variant: messages.some((message) => message.includes("Erreur")) ? "destructive" : "default",
          });
        }
      } else {
        toast({
          title: "Aucune notification",
          description: response.message || "Aucune licence nécessitant une notification.",
        });
      }
    } catch {
      toast({
        title: "Erreur d'envoi",
        description: "Impossible d'envoyer les notifications. Vérifiez votre configuration.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Jamais";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return "Date invalide";
    }
  };

  const canRunActions = channels.length > 0
    && (!hasNtfy || topic.trim())
    && (!hasTelegram || telegramChatId.trim());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4 bg-card border border-border rounded-xl shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Notifications de licences</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          <div className="p-3 rounded-lg bg-muted border border-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{licencesToRenew.length}</span> licence(s) à renouveler (expirées ou &lt;30 jours)
            </p>
          </div>

          <NotificationChannelsFields
            channels={channels}
            onChannelsChange={setChannels}
            serverUrl={serverUrl}
            onServerUrlChange={setServerUrl}
            topic={topic}
            onTopicChange={setTopic}
            token={token}
            onTokenChange={setToken}
            telegramChatId={telegramChatId}
            onTelegramChatIdChange={setTelegramChatId}
            emailConfigured={config.emailConfigured}
            telegramConfigured={config.telegramConfigured}
          />

          <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Rappels automatiques</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Rappels envoyés à 30 jours, 7 jours et 1 jour avant expiration
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRemindersEnabled}
                  onChange={(e) => setAutoRemindersEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {autoRemindersEnabled && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Fréquence de vérification
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                    <input
                      type="radio"
                      name="reminderFrequency"
                      value="daily"
                      checked={reminderFrequency === 'daily'}
                      onChange={(e) => setReminderFrequency(e.target.value as 'daily')}
                      className="w-4 h-4 text-primary"
                    />
                    <span>Quotidien</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                    <input
                      type="radio"
                      name="reminderFrequency"
                      value="weekly"
                      checked={reminderFrequency === 'weekly'}
                      onChange={(e) => setReminderFrequency(e.target.value as 'weekly')}
                      className="w-4 h-4 text-primary"
                    />
                    <span>Hebdomadaire</span>
                  </label>
                </div>
              </div>
            )}

            {config.lastReminderSentAt && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Dernière notification envoyée : <span className="font-medium text-foreground">{formatDate(config.lastReminderSentAt)}</span>
                </p>
              </div>
            )}
          </div>

          {testResults && (
            <div className="p-4 rounded-lg border border-border space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Résultats du test</h4>
              {testResults.results?.ntfy !== undefined && (
                <div className={`flex items-center gap-2 text-sm ${testResults.results.ntfy ? 'text-emerald-500' : 'text-red-500'}`}>
                  {testResults.results.ntfy ? '✅' : '❌'} Ntfy: {testResults.results.ntfy ? 'Succès' : testResults.errors?.ntfy || 'Échec'}
                </div>
              )}
              {testResults.results?.email !== undefined && (
                <div className={`flex items-center gap-2 text-sm ${testResults.results.email ? 'text-emerald-500' : 'text-red-500'}`}>
                  {testResults.results.email ? '✅' : '❌'} Email: {testResults.results.email ? 'Succès' : testResults.errors?.email || 'Échec'}
                </div>
              )}
              {testResults.results?.telegram !== undefined && (
                <div className={`flex items-center gap-2 text-sm ${testResults.results.telegram ? 'text-emerald-500' : 'text-red-500'}`}>
                  {testResults.results.telegram ? '✅' : '❌'} Telegram: {testResults.results.telegram ? 'Succès' : testResults.errors?.telegram || 'Échec'}
                </div>
              )}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={testNotifications}
              disabled={isTesting || !canRunActions}
              className="w-full px-4 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Test en cours...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  Tester les notifications
                </>
              )}
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
              >
                Sauvegarder
              </button>
              <button
                type="button"
                onClick={sendNotification}
                disabled={isSending || !canRunActions}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Envoyer maintenant
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
