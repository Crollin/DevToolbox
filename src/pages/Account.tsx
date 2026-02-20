import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Bell, Palette } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
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
  serverUrl: string;
  topic: string;
  token: string;
  notificationType: "ntfy" | "email" | "both";
  autoRemindersEnabled: boolean;
  reminderFrequency: "daily" | "weekly";
  emailConfigured?: boolean;
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
    notificationType: "ntfy",
    autoRemindersEnabled: false,
    reminderFrequency: "daily",
  });
  const [ntfyLoading, setNtfyLoading] = useState(false);
  const [ntfySaving, setNtfySaving] = useState(false);
  const [ntfyTesting, setNtfyTesting] = useState(false);
  const [ntfyTestResult, setNtfyTestResult] = useState<{ ntfy?: boolean; email?: boolean } | null>(null);

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
      setNtfyConfig({
        serverUrl: data.serverUrl || "https://ntfy.sh",
        topic: data.topic || "",
        token: data.token || "",
        notificationType: (data.notificationType as "ntfy" | "email" | "both") || "ntfy",
        autoRemindersEnabled: data.autoRemindersEnabled ?? false,
        reminderFrequency: (data.reminderFrequency as "daily" | "weekly") || "daily",
        emailConfigured: data.emailConfigured,
      });
    } catch {
      setNtfyConfig({
        serverUrl: "https://ntfy.sh",
        topic: "",
        token: "",
        notificationType: "ntfy",
        autoRemindersEnabled: false,
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

  useEffect(() => {
    loadSmtpConfig();
    loadNtfyConfig();
    loadEmailPrefs();
  }, []);

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
      const updates: { name?: string; preferences?: { theme: string } } = {};
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

  const handleNtfySave = async () => {
    setNtfySaving(true);
    try {
      await api.put("/account/ntfy-config", ntfyConfig);
      toast({ title: "Configuration enregistrée", description: "Les paramètres de notifications ont été mis à jour." });
      loadNtfyConfig();
    } catch (err) {
      toast({ title: "Erreur", description: err instanceof Error ? err.message : "Impossible de sauvegarder.", variant: "destructive" });
    } finally {
      setNtfySaving(false);
    }
  };

  const handleNtfyTest = async () => {
    setNtfyTesting(true);
    setNtfyTestResult(null);
    try {
      const res = await api.post<{ results?: { ntfy?: boolean; email?: boolean } }>("/account/ntfy-config/test", {
        notificationType: ntfyConfig.notificationType,
        serverUrl: ntfyConfig.serverUrl,
        topic: ntfyConfig.topic,
        token: ntfyConfig.token || undefined,
      });
      setNtfyTestResult(res.results ?? null);
      const msgs: string[] = [];
      if (res.results?.ntfy === true) msgs.push("✅ Ntfy réussi");
      else if (res.results?.ntfy === false) msgs.push("❌ Ntfy échoué");
      if (res.results?.email === true) msgs.push("✅ Email réussi");
      else if (res.results?.email === false) msgs.push("❌ Email échoué");
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
          <TabsList className="grid w-full grid-cols-4">
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
                <CardTitle>Notifications (ntfy)</CardTitle>
                <CardDescription>Recevez des notifications push (licences et rappels de tâches) via ntfy.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {ntfyLoading ? (
                  <p className="text-muted-foreground text-sm">Chargement...</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Type de notification</Label>
                      <div className="flex gap-4">
                        {(["ntfy", "email", "both"] as const).map((t) => (
                          <label key={t} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="ntfyType" checked={ntfyConfig.notificationType === t} onChange={() => setNtfyConfig((c) => ({ ...c, notificationType: t }))} />
                            <span>{t === "ntfy" ? "Ntfy" : t === "email" ? "Email" : "Ntfy et Email"}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {(ntfyConfig.notificationType === "ntfy" || ntfyConfig.notificationType === "both") && (
                      <>
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
                      </>
                    )}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={ntfyConfig.autoRemindersEnabled} onChange={(e) => setNtfyConfig((c) => ({ ...c, autoRemindersEnabled: e.target.checked }))} />
                        <span>Rappels automatiques (licences)</span>
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
                      <div className="p-3 rounded-lg bg-muted text-sm">
                        {ntfyTestResult.ntfy !== undefined && <p>Ntfy: {ntfyTestResult.ntfy ? "✅" : "❌"}</p>}
                        {ntfyTestResult.email !== undefined && <p>Email: {ntfyTestResult.email ? "✅" : "❌"}</p>}
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
        </Tabs>
      </main>
    </div>
  );
};

export default Account;
