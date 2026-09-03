import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Bell, Palette, CheckCircle2, Copy, KeyRound, Trash2, Globe, Smartphone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import {
  NotificationChannel,
  getNotificationChannelsFromConfig,
} from "@/types/licence";
import {
  NotificationChannelsFields,
  validateNotificationChannels,
} from "@/components/notifications/NotificationChannelsFields";
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
import { useDomainHubCredentials } from "@/hooks/useDomainHubCredentials";
import api from "@/lib/api";
import { useFeatureFlags } from "@/contexts/FeatureFlagsContext";
import {
  getPushStatus,
  isPushSupported,
  subscribeToWebPush,
  testWebPush,
  unsubscribeFromWebPush,
  type PushStatus,
} from "@/lib/webPushClient";
import { usePwaInstall } from "@/lib/pwaInstall";

const OVH_SUBSIDIARIES: Array<{ value: string; label: string }> = [
  { value: "FR", label: "France (FR)" },
  { value: "GB", label: "Royaume-Uni (GB)" },
  { value: "DE", label: "Allemagne (DE)" },
  { value: "ES", label: "Espagne (ES)" },
  { value: "IT", label: "Italie (IT)" },
  { value: "PL", label: "Pologne (PL)" },
  { value: "PT", label: "Portugal (PT)" },
  { value: "IE", label: "Irlande (IE)" },
  { value: "NL", label: "Pays-Bas (NL)" },
  { value: "BE", label: "Belgique (BE)" },
];

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
  notificationChannels?: NotificationChannel[];
  telegramChatId?: string;
  autoRemindersEnabled: boolean;
  taskAutoRemindersEnabled?: boolean;
  reminderFrequency: "daily" | "weekly";
  emailConfigured?: boolean;
  telegramConfigured?: boolean;
}

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
  const { domainHubEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const { setTheme } = useTheme();

  const [tab, setTab] = useState(() => {
    const q = new URLSearchParams(window.location.search).get("tab");
    return q === "domain-hub" ? "domain-hub" : "profil";
  });

  const {
    credentials: domainHubCredentials,
    setCredentials: setDomainHubCredentials,
    loading: domainHubLoading,
    saving: domainHubSaving,
    loaded: domainHubLoaded,
    loadError: domainHubLoadError,
    load: loadDomainHubCredentials,
    save: saveDomainHubCredentials,
    noRegistrarConfigured,
  } = useDomainHubCredentials(domainHubEnabled);

  const ovhSubsidiaryOptions = useMemo(() => {
    const current = domainHubCredentials.ovhSubsidiary;
    if (!current || OVH_SUBSIDIARIES.some((opt) => opt.value === current)) {
      return OVH_SUBSIDIARIES;
    }
    return [...OVH_SUBSIDIARIES, { value: current, label: current }];
  }, [domainHubCredentials.ovhSubsidiary]);

  const personalTokenScopeOptions = useMemo(
    () => PERSONAL_TOKEN_SCOPE_OPTIONS.filter(
      (scope) => scope.value !== 'domains' || domainHubEnabled
    ),
    [domainHubEnabled]
  );

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
  const [ntfyTestResult, setNtfyTestResult] = useState<{
    ntfy?: boolean;
    email?: boolean;
    telegram?: boolean;
    webpush?: boolean;
  } | null>(null);

  const [pushStatus, setPushStatus] = useState<PushStatus>({ count: 0, enabled: false, configured: false });
  const [pushLoading, setPushLoading] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [installBusy, setInstallBusy] = useState(false);
  const { canInstall, isInstalled, promptInstall } = usePwaInstall();

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

  useEffect(() => {
    if (!flagsLoading && !domainHubEnabled && tab === "domain-hub") {
      setTab("profil");
    }
  }, [flagsLoading, domainHubEnabled, tab]);

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

  const loadPushStatus = async () => {
    setPushLoading(true);
    try {
      const status = await getPushStatus();
      setPushStatus(status);
    } catch {
      setPushStatus({ count: 0, enabled: false, configured: false });
    } finally {
      setPushLoading(false);
    }
  };

  useEffect(() => {
    loadSmtpConfig();
    loadNtfyConfig();
    loadEmailPrefs();
    loadPersonalTokens();
    loadPushStatus();
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

  const validateNotificationConfig = (): string | null =>
    validateNotificationChannels({
      channels: notificationChannels,
      topic: ntfyConfig.topic,
      telegramChatId,
      emailConfigured: ntfyConfig.emailConfigured,
      telegramConfigured: ntfyConfig.telegramConfigured,
    });

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
      const res = await api.post<{
        results?: { ntfy?: boolean; email?: boolean; telegram?: boolean; webpush?: boolean };
      }>("/account/ntfy-config/test", {
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
      if (res.results?.webpush === true) msgs.push("✅ Navigateur réussi");
      else if (res.results?.webpush === false) msgs.push("❌ Navigateur échoué");
      if (msgs.length) toast({ title: "Test effectué", description: msgs.join(", ") });
    } catch (err) {
      toast({ title: "Erreur de test", description: err instanceof Error ? err.message : "Impossible de tester.", variant: "destructive" });
    } finally {
      setNtfyTesting(false);
    }
  };

  const handlePushEnable = async () => {
    setPushBusy(true);
    try {
      await subscribeToWebPush();
      await loadPushStatus();
      toast({
        title: "Notifications navigateur activées",
        description: "Cet appareil recevra les alertes DevToolbox.",
      });
    } catch (err) {
      toast({
        title: "Activation impossible",
        description: err instanceof Error ? err.message : "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setPushBusy(false);
    }
  };

  const handlePushDisable = async () => {
    setPushBusy(true);
    try {
      await unsubscribeFromWebPush();
      await loadPushStatus();
      toast({
        title: "Notifications navigateur désactivées",
        description: "Cet appareil ne recevra plus de push.",
      });
    } catch (err) {
      toast({
        title: "Désactivation impossible",
        description: err instanceof Error ? err.message : "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setPushBusy(false);
    }
  };

  const handlePushTest = async () => {
    setPushBusy(true);
    try {
      await testWebPush();
      toast({
        title: "Notification envoyée",
        description: "Vérifiez le centre de notifications de votre appareil.",
      });
    } catch (err) {
      toast({
        title: "Test push échoué",
        description: err instanceof Error ? err.message : "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setPushBusy(false);
    }
  };

  const handleInstallApp = async () => {
    setInstallBusy(true);
    try {
      const accepted = await promptInstall();
      if (accepted) {
        toast({
          title: "Application installée",
          description: "DevToolbox est disponible sur votre écran d'accueil.",
        });
      }
    } catch (err) {
      toast({
        title: "Installation impossible",
        description: err instanceof Error ? err.message : "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setInstallBusy(false);
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

  const handleDomainHubSave = async () => {
    try {
      await saveDomainHubCredentials();
      toast({
        title: "Clés Domain Hub enregistrées",
        description: "Les identifiants registrar ont été mis à jour.",
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de sauvegarder.",
        variant: "destructive",
      });
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
        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className={`grid w-full ${domainHubEnabled ? "grid-cols-6" : "grid-cols-5"}`}>
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
            {domainHubEnabled && (
              <TabsTrigger value="domain-hub">
                <Globe className="w-4 h-4 mr-2" />
                Domain Hub
              </TabsTrigger>
            )}
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
                    <NotificationChannelsFields
                      channels={notificationChannels}
                      onChannelsChange={setNotificationChannels}
                      serverUrl={ntfyConfig.serverUrl}
                      onServerUrlChange={(v) => setNtfyConfig((c) => ({ ...c, serverUrl: v }))}
                      topic={ntfyConfig.topic}
                      onTopicChange={(v) => setNtfyConfig((c) => ({ ...c, topic: v }))}
                      token={ntfyConfig.token}
                      onTokenChange={(v) => setNtfyConfig((c) => ({ ...c, token: v }))}
                      telegramChatId={telegramChatId}
                      onTelegramChatIdChange={setTelegramChatId}
                      emailConfigured={ntfyConfig.emailConfigured}
                      telegramConfigured={ntfyConfig.telegramConfigured}
                      accountEmail={user?.email}
                    />

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
                        {ntfyTestResult.webpush !== undefined && <p>Navigateur: {ntfyTestResult.webpush ? "✅" : "❌"}</p>}
                      </div>
                    )}

                    <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        Application (PWA)
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Installez DevToolbox sur votre appareil pour un accès rapide et des notifications natives.
                        Sur iOS, utilisez Partager → Sur l&apos;écran d&apos;accueil.
                      </p>
                      {isInstalled ? (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Application déjà installée sur cet appareil
                        </p>
                      ) : canInstall ? (
                        <Button type="button" onClick={handleInstallApp} disabled={installBusy}>
                          Installer l&apos;application
                        </Button>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Sur Android ou Chrome : menu du navigateur (⋮) → Installer l&apos;application ou Ajouter à l&apos;écran d&apos;accueil.
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Notifications navigateur
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Reçoit les alertes dans le centre de notifications de cet appareil,
                        en parallèle des canaux Ntfy, email et Telegram.
                      </p>
                      {pushLoading ? (
                        <p className="text-sm text-muted-foreground">Chargement…</p>
                      ) : !pushStatus.configured ? (
                        <p className="text-sm text-amber-500">
                          Web Push non configuré côté serveur (variables VAPID manquantes).
                        </p>
                      ) : !isPushSupported() ? (
                        <p className="text-sm text-amber-500">
                          Ce navigateur ne prend pas en charge les notifications push.
                        </p>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            {pushStatus.enabled ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                {pushStatus.count} appareil{pushStatus.count > 1 ? "s" : ""} abonné
                              </>
                            ) : (
                              "Aucun appareil abonné pour ce compte."
                            )}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" onClick={handlePushEnable} disabled={pushBusy}>
                              Activer sur cet appareil
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handlePushDisable}
                              disabled={pushBusy || !pushStatus.enabled}
                            >
                              Désactiver cet appareil
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handlePushTest}
                              disabled={pushBusy || !pushStatus.enabled}
                            >
                              Tester
                            </Button>
                          </div>
                        </>
                      )}
                    </div>

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
                      {personalTokenScopeOptions.map((scope) => (
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

          {domainHubEnabled && (
            <TabsContent value="domain-hub" className="space-y-4">
              {domainHubLoading ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                  </CardContent>
                </Card>
              ) : domainHubLoadError && !domainHubLoaded ? (
                <Card>
                  <CardContent className="space-y-4 pt-6">
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-foreground">
                      Impossible de charger les identifiants Domain Hub. Réessayez avant de modifier ou enregistrer.
                    </div>
                    <Button variant="outline" onClick={() => void loadDomainHubCredentials()}>
                      Réessayer
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {domainHubLoadError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-foreground">
                      Le rechargement a échoué. Les valeurs affichées peuvent être obsolètes.
                      <Button
                        variant="link"
                        className="ml-2 h-auto p-0 text-sm"
                        onClick={() => void loadDomainHubCredentials()}
                      >
                        Réessayer
                      </Button>
                    </div>
                  )}
                  {noRegistrarConfigured && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground">
                      Ajoutez au moins un registrar pour utiliser Domain Hub.
                    </div>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        Cloudflare
                        {domainHubCredentials.configured.cloudflare && (
                          <span className="inline-flex items-center gap-1 text-sm font-normal text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                            Configuré
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Jeton API et identifiant de compte pour comparer et commander des domaines via Cloudflare Registrar.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="dh-cf-token">Jeton API</Label>
                        <Input
                          id="dh-cf-token"
                          type="password"
                          autoComplete="new-password"
                          value={domainHubCredentials.cloudflareApiToken}
                          onChange={(e) =>
                            setDomainHubCredentials((c) => ({ ...c, cloudflareApiToken: e.target.value }))
                          }
                          placeholder="••••••••"
                        />
                        <p className="text-xs text-muted-foreground">
                          Créez un jeton dans le tableau de bord Cloudflare (API Tokens). Laissez « *** » pour conserver le jeton actuel.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dh-cf-account">Identifiant de compte</Label>
                        <Input
                          id="dh-cf-account"
                          value={domainHubCredentials.cloudflareAccountId}
                          onChange={(e) =>
                            setDomainHubCredentials((c) => ({ ...c, cloudflareAccountId: e.target.value }))
                          }
                          placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        />
                        <p className="text-xs text-muted-foreground">
                          Visible dans la barre latérale de n'importe quel domaine sur dash.cloudflare.com.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        Hostinger
                        {domainHubCredentials.configured.hostinger && (
                          <span className="inline-flex items-center gap-1 text-sm font-normal text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                            Configuré
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Jeton API hPanel pour comparer les tarifs et synchroniser les dates d'expiration.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="dh-hostinger-token">Jeton API</Label>
                        <Input
                          id="dh-hostinger-token"
                          type="password"
                          autoComplete="new-password"
                          value={domainHubCredentials.hostingerApiToken}
                          onChange={(e) =>
                            setDomainHubCredentials((c) => ({ ...c, hostingerApiToken: e.target.value }))
                          }
                          placeholder="••••••••"
                        />
                        <p className="text-xs text-muted-foreground">
                          Générez un jeton depuis hPanel → Compte → API. Laissez « *** » pour conserver le jeton actuel.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        OVH
                        {domainHubCredentials.configured.ovh && (
                          <span className="inline-flex items-center gap-1 text-sm font-normal text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                            Configuré
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Clés d'application OVH (App Key, App Secret, Consumer Key) et filiale du catalogue.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="dh-ovh-app-key">App Key</Label>
                        <Input
                          id="dh-ovh-app-key"
                          type="password"
                          autoComplete="new-password"
                          value={domainHubCredentials.ovhAppKey}
                          onChange={(e) =>
                            setDomainHubCredentials((c) => ({ ...c, ovhAppKey: e.target.value }))
                          }
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dh-ovh-app-secret">App Secret</Label>
                        <Input
                          id="dh-ovh-app-secret"
                          type="password"
                          autoComplete="new-password"
                          value={domainHubCredentials.ovhAppSecret}
                          onChange={(e) =>
                            setDomainHubCredentials((c) => ({ ...c, ovhAppSecret: e.target.value }))
                          }
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dh-ovh-consumer-key">Consumer Key</Label>
                        <Input
                          id="dh-ovh-consumer-key"
                          type="password"
                          autoComplete="new-password"
                          value={domainHubCredentials.ovhConsumerKey}
                          onChange={(e) =>
                            setDomainHubCredentials((c) => ({ ...c, ovhConsumerKey: e.target.value }))
                          }
                          placeholder="••••••••"
                        />
                        <p className="text-xs text-muted-foreground">
                          Créez les clés sur api.ovh.com. Laissez « *** » pour conserver une clé déjà enregistrée.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dh-ovh-subsidiary">Filiale</Label>
                        <Select
                          value={domainHubCredentials.ovhSubsidiary}
                          onValueChange={(value) =>
                            setDomainHubCredentials((c) => ({ ...c, ovhSubsidiary: value }))
                          }
                        >
                          <SelectTrigger id="dh-ovh-subsidiary">
                            <SelectValue placeholder="Choisir une filiale" />
                          </SelectTrigger>
                          <SelectContent>
                            {ovhSubsidiaryOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Détermine le catalogue et la devise utilisés pour les prix OVH.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Button
                    onClick={handleDomainHubSave}
                    disabled={domainHubSaving || !domainHubLoaded}
                  >
                    {domainHubSaving ? "Enregistrement..." : "Sauvegarder"}
                  </Button>
                </>
              )}
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Account;
