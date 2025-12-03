import { useState, useEffect } from "react";
import { X, Bell, Send, Loader2, Mail, CheckCircle2 } from "lucide-react";
import { NtfyConfig, Licence } from "@/types/licence";
import { getLicenceStatus, getDaysUntilRenewal } from "./LicenceStatusBadge";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: NtfyConfig;
  onSave: (config: Partial<NtfyConfig>) => void;
  licences: Licence[];
}

const NotificationModal = ({ isOpen, onClose, config, onSave, licences }: NotificationModalProps) => {
  const [serverUrl, setServerUrl] = useState(config.serverUrl || "https://ntfy.sh");
  const [topic, setTopic] = useState(config.topic || "");
  const [token, setToken] = useState(config.token || "");
  const [notificationType, setNotificationType] = useState<'ntfy' | 'email' | 'both'>(
    config.notificationType || 'ntfy'
  );
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
    results?: { ntfy?: boolean; email?: boolean };
    errors?: { ntfy?: string; email?: string };
  } | null>(null);

  useEffect(() => {
    setServerUrl(config.serverUrl || "https://ntfy.sh");
    setTopic(config.topic || "");
    setToken(config.token || "");
    setNotificationType(config.notificationType || 'ntfy');
    setAutoRemindersEnabled(config.autoRemindersEnabled || false);
    setReminderFrequency(config.reminderFrequency || 'daily');
  }, [config, isOpen]);

  const licencesToRenew = licences.filter((l) => {
    const status = getLicenceStatus(l);
    return status === "expired" || status === "warning";
  });

  const handleSave = async () => {
    try {
      await onSave({
        serverUrl,
        topic,
        token: token || undefined,
        enabled: true,
        notificationType,
        autoRemindersEnabled,
        reminderFrequency,
      });
      toast({
        title: "Configuration sauvegardée",
        description: "Les paramètres de notifications ont été mis à jour.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration.",
        variant: "destructive",
      });
    }
  };

  const testNotifications = async () => {
    setIsTesting(true);
    setTestResults(null);

    try {
      // Envoyer les valeurs du formulaire pour tester sans sauvegarder
      const response = await api.post<{
        message: string;
        results?: { ntfy?: boolean; email?: boolean };
        errors?: { ntfy?: string; email?: string };
      }>('/licences/test-notifications', {
        notificationType,
        serverUrl,
        topic,
        token: token || undefined,
      });
      setTestResults(response);
      
      const messages: string[] = [];
      if (response.results?.ntfy === true) {
        messages.push("✅ Test Ntfy réussi");
      } else if (response.results?.ntfy === false) {
        messages.push(`❌ Test Ntfy échoué${response.errors?.ntfy ? `: ${response.errors.ntfy}` : ''}`);
      }
      
      if (response.results?.email === true) {
        messages.push("✅ Test Email réussi");
      } else if (response.results?.email === false) {
        messages.push(`❌ Test Email échoué${response.errors?.email ? `: ${response.errors.email}` : ''}`);
      }

      if (messages.length > 0) {
        toast({
          title: messages.some(m => m.includes("✅")) ? "Test effectué" : "Test échoué",
          description: messages.join(", "),
          variant: messages.some(m => m.includes("❌")) ? "destructive" : "default",
        });
      }
    } catch (error) {
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
    // Vérifier les prérequis selon le type de notification
    if ((notificationType === 'ntfy' || notificationType === 'both') && !topic) {
      toast({
        title: "Erreur",
        description: "Veuillez configurer un topic ntfy.",
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
      // Envoyer les valeurs du formulaire pour utiliser la config actuelle sans sauvegarder
      const response = await api.post<{
        message?: string;
        sent: boolean;
        results?: { ntfy?: boolean; email?: boolean };
        licencesCount?: number;
      }>('/licences/send-notifications', {
        notificationType,
        serverUrl,
        topic,
        token: token || undefined,
      });
      
      if (response.sent) {
        const results = response.results || {};
        const messages: string[] = [];
        
        if (results.ntfy === true) {
          messages.push("Notification Ntfy envoyée");
        } else if (results.ntfy === false && (notificationType === 'ntfy' || notificationType === 'both')) {
          messages.push("Erreur lors de l'envoi Ntfy");
        }
        
        if (results.email === true) {
          messages.push("Email envoyé");
        } else if (results.email === false && (notificationType === 'email' || notificationType === 'both')) {
          messages.push("Erreur lors de l'envoi de l'email");
        }

        if (messages.length > 0) {
          toast({
            title: messages.some(m => m.includes("Erreur")) ? "Envoi partiel" : "Notifications envoyées",
            description: messages.join(", "),
            variant: messages.some(m => m.includes("Erreur")) ? "destructive" : "default",
          });
        }
      } else {
        toast({
          title: "Aucune notification",
          description: response.message || "Aucune licence nécessitant une notification.",
        });
      }
    } catch (error) {
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
          {/* Alert count */}
          <div className="p-3 rounded-lg bg-muted border border-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{licencesToRenew.length}</span> licence(s) à renouveler (expirées ou &lt;30 jours)
            </p>
          </div>

          {/* Type de notification */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Type de notification
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  name="notificationType"
                  value="ntfy"
                  checked={notificationType === 'ntfy'}
                  onChange={(e) => setNotificationType(e.target.value as 'ntfy')}
                  className="w-4 h-4 text-primary"
                />
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1">Ntfy uniquement</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  name="notificationType"
                  value="email"
                  checked={notificationType === 'email'}
                  onChange={(e) => setNotificationType(e.target.value as 'email')}
                  className="w-4 h-4 text-primary"
                />
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1">Email uniquement</span>
                {!config.emailConfigured && (
                  <span className="text-xs text-amber-500">(SMTP non configuré)</span>
                )}
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  name="notificationType"
                  value="both"
                  checked={notificationType === 'both'}
                  onChange={(e) => setNotificationType(e.target.value as 'both')}
                  className="w-4 h-4 text-primary"
                />
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <Mail className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="flex-1">Ntfy et Email</span>
                {!config.emailConfigured && (
                  <span className="text-xs text-amber-500">(SMTP non configuré)</span>
                )}
              </label>
            </div>
          </div>

          {/* Configuration Ntfy */}
          {(notificationType === 'ntfy' || notificationType === 'both') && (
            <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Configuration Ntfy
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  URL du serveur ntfy
                </label>
                <input
                  type="url"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="https://ntfy.sh"
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Topic *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="mon-topic-licences"
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Token d'authentification (optionnel)
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="tk_..."
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          )}

          {/* Configuration Email */}
          {(notificationType === 'email' || notificationType === 'both') && (
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4" />
                Configuration Email
              </h3>
              {config.emailConfigured ? (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  SMTP configuré - Les emails seront envoyés à l'adresse de votre compte
                </p>
              ) : (
                <p className="text-sm text-amber-500">
                  SMTP non configuré - Configurez les variables d'environnement SMTP pour activer les notifications par email
                </p>
              )}
            </div>
          )}

          {/* Rappels automatiques */}
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

          {/* Résultats du test */}
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
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={testNotifications}
              disabled={isTesting || ((notificationType === 'ntfy' || notificationType === 'both') && !topic)}
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
                disabled={isSending || ((notificationType === 'ntfy' || notificationType === 'both') && !topic)}
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

