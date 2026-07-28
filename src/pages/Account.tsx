import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Bell, Palette, MessageCircle, CheckCircle2, Copy, KeyRound, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import {
  NotificationChannel,
  getNotificationChannelsFromConfig,
} from "@/types/licence";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

const THEME_OPTIONS = [
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
  { value: "system", label: "Système" },
] as const;

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromEmail: string;
  source?: string;
}

interface NtfyConfig {
  enabled?: boolean;
  serverUrl: string;
  topic: string;
  token: string;
  notificationType?: "ntfy" | "email" | "both" | "telegram";
  notificationChannels?: NotificationChannel[];
  telegramChatId?: string;
  autoRemindersEnabled: boolean;
  taskAutoRemindersEnabled?: boolean;
  reminderFrequency: "daily" | "weekly";
  emailConfigured?: boolean;
  telegramConfigured?: boolean;
}

const CHANNEL_OPTIONS: Array<{
  id: NotificationChannel;
  label: string;
  description: string;
  icon: typeof Bell;
}> = [
  { id: "ntfy", label: "Ntfy", description: "Notifications push via ntfy.sh", icon: Bell },
  { id: "email", label: "Email", description: "Notifications sur l'adresse de votre compte", icon: Mail },
  { id: "telegram", label: "Telegram", description: "Messages via votre bot Telegram", icon: MessageCircle },
];

interface EmailPreferences {
  companyName: string;
  signature: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  welcomeText: string;
  licencesText: string;
  tasksText: string;
}

interface PersonalAccessToken {
  id: string;
  name: string;
  scope: string[];
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

const PERSONAL_TOKEN_SCOPE_OPTIONS = [
  { value: "licences", label: "Licences", description: "Lire et gérer les clés de licence" },
  { value: "tasks", label: "Tâches", description: "Consulter et mettre à jour les tâches" },
  { value: "knowledge_base", label: "Knowledge Base", description: "Rechercher et ouvrir vos notes" },
  { value: "domains", label: "Domaines", description: "Comparer et gérer le portefeuille Domain Hub" },
] as const;

const Account = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const { setTheme } = useTheme();

  const [name, setName] = useState("");
  const [themeValue, setThemeValue] = useState<string>("system");
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    host: "",
    port: 587,
    user: "",
    pass: "",
    fromEmail: "",
  });
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);

  const [ntfyConfig, setNtfyConfig] = useState<NtfyConfig>({
    serverUrl: "https://ntfy.sh",
    topic: "",
    token: "",
    notificationChannels: ["ntfy"],
    autoRemindersEnabled: false,
    taskAutoRemindersEnabled: false,
    reminderFrequency: "daily",
  });
  const [notificationChannels, setNotificationChannels] = useState<NotificationChannel[]>(["ntfy"]);
  const [telegramChatId, setTelegramChatId] = useState("");
  const [ntfyLoading, setNtfyLoading] = useState(false);
  const [ntfySaving, setNtfySaving] = useState(false);
  const [ntfyTesting, setNtfyTesting] = useState(false);
  const [ntfyTestResult, setNtfyTestResult] = useState<{ ntfy?: boolean; email?: boolean; telegram?: boolean } | null>(null);

  const hasNtfy = notificationChannels.includes("ntfy");
  const hasEmail = notificationChannels.includes("email");
  const hasTelegram = notificationChannels.includes("telegram");

  const toggleChannel = (channel: NotificationChannel) => {
    setNotificationChannels((current) =>
      current.includes(channel)
        ? current.filter((item) => item !== channel)
        : [...current, channel]
    );
  };

  const [emailPrefs, setEmailPrefs] = useState<EmailPreferences>({
    companyName: "",
    signature: "",
    primaryColor: "#0066CC",
    secondaryColor: "#004499",
    logoUrl: "",
    welcomeText: "",
    licencesText: "",
    tasksText: "",
  });
  const [emailPrefsLoading, setEmailPrefsLoading] = useState(false);
  const [emailPrefsSaving, setEmailPrefsSaving] = useState(false);

  const [personalTokens, setPersonalTokens] = useState<PersonalAccessToken[]>([]);
  const [personalTokensLoading, setPersonalTokensLoading] = useState(false);
  const [personalTokenSaving, setPersonalTokenSaving] = useState(false);
  const [personalTokenName, setPersonalTokenName] = useState("");
  const [personalTokenExpiresAt, setPersonalTokenExpiresAt] = useState("");
  const [personalTokenScopes, setPersonalTokenScopes] = useState<string[]>(["licences"]);
  const [createdPersonalToken, setCreatedPersonalToken] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setThemeValue(user.preferences?.theme || "system");
    }
  }, [user]);

  const loadSmtpConfig = async () => {
    setSmtpLoading(true);
    try {
      const data = await api.get<SmtpConfig>("/account/smtp-config");
      setSmtpConfig(data);
    } catch {
      setSmtpConfig({ host: "", port: 587, user: "", pass: "", fromEmail: "" });
    } finally {
      setSmtpLoading(false);
    }
  };

  const loadNtfyConfig = async () => {
    setNtfyLoading(true);
    try {
      const data = await api.get<NtfyConfig>("/account/ntfy-config");
      const channels = getNotificationChannelsFromConfig(data);
      setNotificationChannels(channels.length > 0 ? channels : ["ntfy"]);
      setTelegramChatId(data.telegramChatId || "");
      setNtfyConfig({
        serverUrl: data.serverUrl || "https://ntfy.sh",
        topic: data.topic || "",
        token: data.token || "",
        notificationChannels: channels,
        telegramChatId: data.telegramChatId,
        autoRemindersEnabled: data.autoRemindersEnabled ?? false,
        taskAutoRemindersEnabled: data.taskAutoRemindersEnabled ?? false,
        reminderFrequency: (data.reminderFrequency as "daily" | "weekly") || "daily",
        emailConfigured: data.emailConfigured,
        telegramConfigured: data.telegramConfigured,
      });
    } catch {
      setNotificationChannels(["ntfy"]);
      setTelegramChatId("");
      setNtfyConfig({
        serverUrl: "https://ntfy.sh",
        topic: "",
        token: "",
        notificationChannels: ["ntfy"],
        autoRemindersEnabled: false,
        taskAutoRemindersEnabled: false,
        reminderFrequency: "daily",
      });
    } finally {
      setNtfyLoading(false);
    }
  };

  const loadEmailPrefs = async () => {
    setEmailPrefsLoading(true);
    try {
      const data = await api.get<EmailPreferences>("/account/email-preferences");
      setEmailPrefs({
        companyName: data.companyName || "",
        signature: data.signature || "",
        primaryColor: data.primaryColor || "#0066CC",
        secondaryColor: data.secondaryColor || "#004499",
        logoUrl: data.logoUrl || "",
        welcomeText: data.welcomeText || "",
        licencesText: data.licencesText || "",
        tasksText: data.tasksText || "",
      });
    } catch {
      setEmailPrefs({
        companyName: "",
        signature: "",
        primaryColor: "#0066CC",
        secondaryColor: "#004499",
        logoUrl: "",
        welcomeText: "",
        licencesText: "",
        tasksText: "",
      });
    } finally {
      setEmailPrefsLoading(false);
    }
  };

  const loadPersonalTokens = async () => {
    setPersonalTokensLoading(true);
    try {
      const data = await api.get<{ personalAccessTokens: PersonalAccessToken[] }>("/auth/personal-tokens");
      setPersonalTokens(data.personalAccessTokens);
    } catch {
      setPersonalTokens([]);
    } finally {
      setPersonalTokensLoading(false);
    }
  };

  useEffect(() => {
    loadSmtpConfig();
    loadNtfyConfig();
    loadEmailPrefs();
    loadPersonalTokens();
  }, []);

  const handlePersonalTokenCreate = async () => {
    const trimmedName = personalTokenName.trim();
    if (!trimmedName) {
      toast({ title: "Nom requis", description: "Donnez un nom à ce token.", variant: "destructive" });
      return;
    }

    setPersonalTokenSaving(true);
    try {
      const response = await api.post<{
        token: string;
        personalAccessToken: PersonalAccessToken;
      }>("/auth/personal-tokens", {
        name: trimmedName,
        expiresAt: personalTokenExpiresAt || null,
        scopes: personalTokenScopes,
      });
      setCreatedPersonalToken(response.token);
      setPersonalTokenExpiresAt("");
      await loadPersonalTokens();
      toast({ title: "Token créé", description: "Copiez-le maintenant : il ne sera plus affiché ensuite." });
    } catch (err) {
      toast({ title: "Création impossible", description: err instanceof Error ? err.message : "Une erreur est survenue.", variant: "destructive" });
    } finally {
      setPersonalTokenSaving(false);
    }
  };

  const handlePersonalTokenCopy = async () => {
    if (!createdPersonalToken) return;
    await navigator.clipboard.writeText(createdPersonalToken);
    toast({ title: "Token copié", description: "Enregistrez-le dans votre client API (Raycast, Hermes, script…)." });
  };

  const handlePersonalTokenRevoke = async (token: PersonalAccessToken) => {
    if (!window.confirm(`Révoquer le token « ${token.name} » ? Les clients qui l'utilisent perdront immédiatement l'accès.`)) return;
    try {
      await api.delete(`/auth/personal-tokens/${token.id}`);
      await loadPersonalTokens();
      toast({ title: "Token révoqué", description: "Les clients API ne pourront plus utiliser ce token." });
    } catch (err) {
      toast({ title: "Révocation impossible", description: err instanceof Error ? err.message : "Une erreur est survenue.", variant: "destructive" });
    }
  };

  const handlePersonalTokenDelete = async (token: PersonalAccessToken) => {
    if (!window.confirm(`Supprimer définitivement le token révoqué « ${token.name} » ?`)) return;
    try {
      await api.delete(`/auth/personal-tokens/${token.id}/permanent`);
      await loadPersonalTokens();
      toast({ title: "Token supprimé", description: "Le token a été retiré de la liste." });
    } catch (err) {
      toast({ title: "Suppression impossible", description: err instanceof Error ? err.message : "Une erreur est survenue.", variant: "destructive" });
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    const trimmedName = name.trim();
    if (!trimmedName) {
      setProfileError("Le nom ne peut pas être vide");
      return;
    }
    setProfileLoading(true);
    try {
      const updates: { name?: string; preferences?: { theme: "light" | "dark" | "system" } } = {};
      if (trimmedName !== user?.name) updates.name = trimmedName;
      if (themeValue !== (user?.preferences?.theme || "system")) {
        updates.preferences = { theme: themeValue as "light" | "dark" | "system" };
      }
      if (Object.keys(updates).length > 0) {
        await updateProfile(updates);
        if (updates.preferences?.theme) setTheme(updates.preferences.theme);
      }
      toast({ title: "Profil mis à jour", description: "Vos modifications ont été enregistrées." });
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSmtpSave = async () => {
    if (!smtpConfig.host || !smtpConfig.user) {
      toast({ title: "Erreur", description: "Host et utilisateur sont requis.", variant: "destructive" });
      return;
    }
    setSmtpSaving(true);
    try {
      await api.put("/account/smtp-config", smtpConfig);
      toast({ title: "Configuration SMTP enregistrée", description: "Les paramètres ont été mis à jour." });
      loadSmtpConfig();
    } catch (err) {
      toast({ title: "Erreur", description: err instanceof Error ? err.message : "Impossible de sauvegarder.", variant: "destructive" });
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleSmtpTest = async () => {
    setSmtpTesting(true);
    try {
      await api.post("/account/smtp-config/test");
      toast({ title: "Email envoyé", description: "Un email de test a été envoyé à votre adresse." });
    } catch (err) {
      toast({ title: "Échec du test", description: err instanceof Error ? err.message : "Impossible d'envoyer l'email.", variant: "destructive" });
    } finally {
      setSmtpTesting(false);
    }
  };

  const validateNotificationConfig = (): string | null => {
    if (notificationChannels.length === 0) {
      return "Sélectionnez au moins un canal de notification.";
    }
    if (hasNtfy && !ntfyConfig.topic.trim()) {
      return "Veuillez configurer un topic ntfy.";
    }
    if (hasTelegram && !telegramChatId.trim()) {
      return "Veuillez renseigner votre Chat ID Telegram.";
    }
    if (hasEmail && !ntfyConfig.emailConfigured) {
      return "Le service email n'est pas configuré sur le serveur.";
    }
    if (hasTelegram && !ntfyConfig.telegramConfigured) {
      return "Le bot Telegram n'est pas configuré sur le serveur.";
    }
    return null;
  };

  const handleNtfySave = async () => {
    const validationError = validateNotificationConfig();
    if (validationError) {
      toast({ title: "Configuration incomplète", description: validationError, variant: "destructive" });
      return;
    }
    setNtfySaving(true);
    try {
      await api.put("/account/ntfy-config", {
        ...ntfyConfig,
        enabled: notificationChannels.length > 0,
        notificationChannels,
        telegramChatId: telegramChatId || undefined,
      });
      toast({ title: "Configuration enregistrée", description: "Les paramètres de notifications ont été mis à jour." });
      loadNtfyConfig();
    } catch (err) {
      toast({ title: "Erreur", description: err instanceof Error ? err.message : "Impossible de sauvegarder.", variant: "destructive" });
    } finally {
      setNtfySaving(false);
    }
  };

  const handleNtfyTest = async () => {
    const validationError = validateNotificationConfig();
    if (validationError) {
      toast({ title: "Configuration incomplète", description: validationError, variant: "destructive" });
      return;
    }
    setNtfyTesting(true);
    setNtfyTestResult(null);
    try {
      const res = await api.post<{ results?: { ntfy?: boolean; email?: boolean; telegram?: boolean } }>("/account/ntfy-config/test", {
        notificationChannels,
        serverUrl: ntfyConfig.serverUrl,
        topic: ntfyConfig.topic,
        token: ntfyConfig.token || undefined,
        telegramChatId: telegramChatId || undefined,
      });
      setNtfyTestResult(res.results ?? null);
      const msgs: string[] = [];
      if (res.results?.ntfy === true) msgs.push("✅ Ntfy réussi");
      else if (res.results?.ntfy === false) msgs.push("❌ Ntfy échoué");
      if (res.results?.email === true) msgs.push("✅ Email réussi");
      else if (res.results?.email === false) msgs.push("❌ Email échoué");
      if (res.results?.telegram === true) msgs.push("✅ Telegram réussi");
      else if (res.results?.telegram === false) msgs.push("❌ Telegram échoué");
      if (msgs.length) toast({ title: "Test effectué", description: msgs.join(", ") });
    } catch (err) {
      toast({ title: "Erreur de test", description: err instanceof Error ? err.message : "Impossible de tester.", variant: "destructive" });
    } finally {
      setNtfyTesting(false);
    }
  };

  const handleEmailPrefsSave = async () => {
    setEmailPrefsSaving(true);
    try {
      await api.put("/account/email-preferences", emailPrefs);
      toast({ title: "Préférences enregistrées", description: "La personnalisation des emails a été mise à jour." });
    } catch (err) {
      toast({ title: "Erreur", description: err instanceof Error ? err.message : "Impossible de sauvegarder.", variant: "destructive" });
    } finally {
      setEmailPrefsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Retour</span>
            </button>
            <div className="h-6 w-px bg-border" />
            <h1 className="font-mono font-semibold text-foreground">Mon compte</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <Tabs defaultValue="profil" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profil" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="smtp">
              <Mail className="w-4 h-4 mr-2" />
              SMTP
            </TabsTrigger>
            <TabsTrigger value="ntfy">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="emails">
              <Palette className="w-4 h-4 mr-2" />
              Emails
            </TabsTrigger>
            <TabsTrigger value="api-access">
              <KeyRound className="w-4 h-4 mr-2" />
              Accès API
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profil">
            <Card>
              <CardHeader>
                <CardTitle>Profil</CardTitle>
                <CardDescription>Modifiez votre nom et vos préférences d'affichage.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  {profileError && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{profileError}</div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" required disabled={profileLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="theme">Thème</Label>
                    <Select value={themeValue} onValueChange={setThemeValue} disabled={profileLoading}>
                      <SelectTrigger id="theme">
                        <SelectValue placeholder="Choisir un thème" />
                      </SelectTrigger>
                      <SelectContent>
                        {THEME_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" disabled={profileLoading}>Enregistrer</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="smtp">
            <Card>
              <CardHeader>
                <CardTitle>Serveur SMTP</CardTitle>
                <CardDescription>Configuration du serveur pour l'envoi des emails (bienvenue, licences, tâches).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {smtpLoading ? (
                  <p className="text-muted-foreground text-sm">Chargement...</p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Hôte</Label>
                        <Input value={smtpConfig.host} onChange={(e) => setSmtpConfig((c) => ({ ...c, host: e.target.value }))} placeholder="smtp.example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>Port</Label>
                        <Input type="number" value={smtpConfig.port} onChange={(e) => setSmtpConfig((c) => ({ ...c, port: parseInt(e.target.value) || 587 }))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Utilisateur</Label>
                      <Input value={smtpConfig.user} onChange={(e) => setSmtpConfig((c) => ({ ...c, user: e.target.value }))} placeholder="user@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Mot de passe</Label>
                      <Input type="password" value={smtpConfig.pass} onChange={(e) => setSmtpConfig((c) => ({ ...c, pass: e.target.value }))} placeholder="••••••••" />
                    </div>
                    <div className="space-y-2">
                      <Label>Expéditeur (From)</Label>
                      <Input value={smtpConfig.fromEmail} onChange={(e) => setSmtpConfig((c) => ({ ...c, fromEmail: e.target.value }))} placeholder="noreply@example.com" />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSmtpSave} disabled={smtpSaving}>Sauvegarder</Button>
                      <Button variant="outline" onClick={handleSmtpTest} disabled={smtpTesting || !smtpConfig.host || !smtpConfig.user}>
                        {smtpTesting ? "Envoi..." : "Envoyer un email de test"}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ntfy">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Canaux pour les rappels de licences et de tâches : Ntfy, email ou Telegram.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {ntfyLoading ? (
                  <p className="text-muted-foreground text-sm">Chargement...</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Canaux de communication</Label>
                      <p className="text-xs text-muted-foreground">
                        Activez un ou plusieurs canaux selon vos préférences.
                      </p>
                      <div className="space-y-2">
                        {CHANNEL_OPTIONS.map(({ id, label, description, icon: Icon }) => (
                          <label
                            key={id}
                            className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={notificationChannels.includes(id)}
                              onChange={() => toggleChannel(id)}
                              className="mt-1 w-4 h-4"
                            />
                            <Icon className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">{label}</span>
                                {id === "email" && !ntfyConfig.emailConfigured && (
                                  <span className="text-xs text-amber-500">(email non configuré)</span>
                                )}
                                {id === "telegram" && !ntfyConfig.telegramConfigured && (
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
                          <Input value={ntfyConfig.serverUrl} onChange={(e) => setNtfyConfig((c) => ({ ...c, serverUrl: e.target.value }))} placeholder="https://ntfy.sh" />
                        </div>
                        <div className="space-y-2">
                          <Label>Topic *</Label>
                          <Input value={ntfyConfig.topic} onChange={(e) => setNtfyConfig((c) => ({ ...c, topic: e.target.value }))} placeholder="mon-topic" />
                        </div>
                        <div className="space-y-2">
                          <Label>Token (optionnel)</Label>
                          <Input type="password" value={ntfyConfig.token} onChange={(e) => setNtfyConfig((c) => ({ ...c, token: e.target.value }))} placeholder="tk_..." />
                        </div>
                      </div>
                    )}

                    {hasEmail && (
                      <div className="p-4 rounded-lg bg-muted/30 border border-border">
                        <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4" />
                          Configuration Email
                        </h3>
                        {ntfyConfig.emailConfigured ? (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            Service email configuré — notifications envoyées à {user?.email}
                          </p>
                        ) : (
                          <p className="text-sm text-amber-500">
                            Configurez SMTP/Resend dans l'onglet SMTP ou via les variables d'environnement du serveur.
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
                        {ntfyConfig.telegramConfigured ? (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            Bot Telegram configuré sur le serveur
                          </p>
                        ) : (
                          <p className="text-sm text-amber-500">
                            Ajoutez TELEGRAM_BOT_TOKEN dans les variables d'environnement du backend.
                          </p>
                        )}
                        <div className="space-y-2">
                          <Label>Chat ID *</Label>
                          <Input
                            value={telegramChatId}
                            onChange={(e) => setTelegramChatId(e.target.value)}
                            placeholder="123456789"
                          />
                          <p className="text-xs text-muted-foreground">
                            Obtenez votre Chat ID via @userinfobot sur Telegram.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={ntfyConfig.autoRemindersEnabled} onChange={(e) => setNtfyConfig((c) => ({ ...c, autoRemindersEnabled: e.target.checked }))} />
                        <span>Rappels automatiques (licences)</span>
                      </label>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={ntfyConfig.taskAutoRemindersEnabled ?? false} onChange={(e) => setNtfyConfig((c) => ({ ...c, taskAutoRemindersEnabled: e.target.checked }))} />
                        <span>Rappels automatiques (tâches)</span>
                      </label>
                    </div>
                    {ntfyConfig.autoRemindersEnabled && (
                      <div className="space-y-2">
                        <Label>Fréquence</Label>
                        <Select value={ntfyConfig.reminderFrequency} onValueChange={(v) => setNtfyConfig((c) => ({ ...c, reminderFrequency: v as "daily" | "weekly" }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Quotidien</SelectItem>
                            <SelectItem value="weekly">Hebdomadaire</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {ntfyTestResult && (
                      <div className="p-3 rounded-lg bg-muted text-sm space-y-1">
                        {ntfyTestResult.ntfy !== undefined && <p>Ntfy: {ntfyTestResult.ntfy ? "✅" : "❌"}</p>}
                        {ntfyTestResult.email !== undefined && <p>Email: {ntfyTestResult.email ? "✅" : "❌"}</p>}
                        {ntfyTestResult.telegram !== undefined && <p>Telegram: {ntfyTestResult.telegram ? "✅" : "❌"}</p>}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button onClick={handleNtfySave} disabled={ntfySaving}>Sauvegarder</Button>
                      <Button variant="outline" onClick={handleNtfyTest} disabled={ntfyTesting}>Tester</Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emails">
            <Card>
              <CardHeader>
                <CardTitle>Personnalisation des emails</CardTitle>
                <CardDescription>Signature, couleurs et textes personnalisés pour vos emails.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {emailPrefsLoading ? (
                  <p className="text-muted-foreground text-sm">Chargement...</p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nom / Société</Label>
                        <Input value={emailPrefs.companyName} onChange={(e) => setEmailPrefs((c) => ({ ...c, companyName: e.target.value }))} placeholder="DevToolbox" />
                      </div>
                      <div className="space-y-2">
                        <Label>Signature</Label>
                        <Input value={emailPrefs.signature} onChange={(e) => setEmailPrefs((c) => ({ ...c, signature: e.target.value }))} placeholder="L'équipe DevToolbox" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Couleur principale</Label>
                        <Input type="color" value={emailPrefs.primaryColor} onChange={(e) => setEmailPrefs((c) => ({ ...c, primaryColor: e.target.value }))} className="h-10 w-full" />
                      </div>
                      <div className="space-y-2">
                        <Label>Couleur secondaire</Label>
                        <Input type="color" value={emailPrefs.secondaryColor} onChange={(e) => setEmailPrefs((c) => ({ ...c, secondaryColor: e.target.value }))} className="h-10 w-full" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>URL du logo</Label>
                      <Input value={emailPrefs.logoUrl} onChange={(e) => setEmailPrefs((c) => ({ ...c, logoUrl: e.target.value }))} placeholder="https://..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Texte email de bienvenue</Label>
                      <Input value={emailPrefs.welcomeText} onChange={(e) => setEmailPrefs((c) => ({ ...c, welcomeText: e.target.value }))} placeholder="Texte personnalisé pour l'email de bienvenue" className="font-normal" />
                    </div>
                    <div className="space-y-2">
                      <Label>Texte intro licences</Label>
                      <Input value={emailPrefs.licencesText} onChange={(e) => setEmailPrefs((c) => ({ ...c, licencesText: e.target.value }))} placeholder="Texte personnalisé pour les emails de licences" />
                    </div>
                    <div className="space-y-2">
                      <Label>Texte intro tâches</Label>
                      <Input value={emailPrefs.tasksText} onChange={(e) => setEmailPrefs((c) => ({ ...c, tasksText: e.target.value }))} placeholder="Texte personnalisé pour les rappels de tâches" />
                    </div>
                    <Button onClick={handleEmailPrefsSave} disabled={emailPrefsSaving}>Sauvegarder</Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api-access">
            <Card>
              <CardHeader>
                <CardTitle>Accès API</CardTitle>
                <CardDescription>
                  Gérez les tokens d'accès pour Raycast, Hermes, scripts ou tout client HTTP (licences, tâches, Knowledge Base, domaines).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground">
                  <p className="font-medium">Le token n'est affiché qu'une seule fois.</p>
                  <p className="mt-1 text-muted-foreground">
                    Après création, copiez-le dans votre client API. Si vous le perdez, révoquez-le et créez-en un nouveau.
                  </p>
                </div>

                <div className="space-y-4 rounded-lg border border-border p-4">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <KeyRound className="h-4 w-4" />
                      Créer un token d'accès
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">Choisissez précisément les outils accessibles via l'API.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="api-token-name">Nom</Label>
                      <Input id="api-token-name" value={personalTokenName} onChange={(e) => setPersonalTokenName(e.target.value)} placeholder="Raycast Mac, Hermes Agent…" disabled={personalTokenSaving} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="api-token-expiry">Expiration (optionnelle)</Label>
                      <Input id="api-token-expiry" type="date" value={personalTokenExpiresAt} onChange={(e) => setPersonalTokenExpiresAt(e.target.value)} min={new Date().toISOString().slice(0, 10)} disabled={personalTokenSaving} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Périmètres d’accès</Label>
                    <div className="space-y-2">
                      {PERSONAL_TOKEN_SCOPE_OPTIONS.map((scope) => (
                        <label key={scope.value} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/50">
                          <input
                            type="checkbox"
                            checked={personalTokenScopes.includes(scope.value)}
                            onChange={(event) => setPersonalTokenScopes((current) => event.target.checked
                              ? [...current, scope.value]
                              : current.filter((value) => value !== scope.value))}
                            disabled={personalTokenSaving}
                            className="mt-1 h-4 w-4"
                          />
                          <span>
                            <span className="block text-sm font-medium">{scope.label}</span>
                            <span className="block text-xs text-muted-foreground">{scope.description}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handlePersonalTokenCreate} disabled={personalTokenSaving}>
                    {personalTokenSaving ? "Création..." : "Créer le token"}
                  </Button>
                </div>

                {createdPersonalToken && (
                  <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <div>
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Token prêt à copier</p>
                      <p className="mt-1 text-xs text-muted-foreground">Copiez-le maintenant, puis configurez-le dans votre client API.</p>
                    </div>
                    <div className="flex gap-2">
                      <Input value={createdPersonalToken} readOnly className="font-mono text-xs" />
                      <Button variant="outline" onClick={handlePersonalTokenCopy} aria-label="Copier le token">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setCreatedPersonalToken(null)}>J'ai copié le token</Button>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold">Tokens existants</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Révoquez immédiatement un token si vous n'en avez plus besoin.</p>
                  </div>
                  {personalTokensLoading ? (
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                  ) : personalTokens.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">Aucun token créé.</p>
                  ) : (
                    <div className="space-y-2">
                      {personalTokens.map((token) => (
                        <div key={token.id} className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{token.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Scope : {token.scope.join(", ")} · Créé le {new Date(token.createdAt).toLocaleDateString()}
                              {token.expiresAt ? ` · Expire le ${new Date(token.expiresAt).toLocaleDateString()}` : " · Sans expiration"}
                              {token.revokedAt ? ` · Révoqué le ${new Date(token.revokedAt).toLocaleDateString()}` : ""}
                            </p>
                          </div>
                          {token.revokedAt ? (
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="text-xs text-muted-foreground">Révoqué</span>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handlePersonalTokenDelete(token)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handlePersonalTokenRevoke(token)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Révoquer
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Account;
