import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export interface DomainHubCredentialsForm {
  cloudflareApiToken: string;
  cloudflareAccountId: string;
  hostingerApiToken: string;
  ovhAppKey: string;
  ovhAppSecret: string;
  ovhConsumerKey: string;
  ovhSubsidiary: string;
  configured: { cloudflare: boolean; hostinger: boolean; ovh: boolean };
}

const EMPTY_CREDENTIALS: DomainHubCredentialsForm = {
  cloudflareApiToken: "",
  cloudflareAccountId: "",
  hostingerApiToken: "",
  ovhAppKey: "",
  ovhAppSecret: "",
  ovhConsumerKey: "",
  ovhSubsidiary: "FR",
  configured: { cloudflare: false, hostinger: false, ovh: false },
};

function normalize(data: Partial<DomainHubCredentialsForm> | null | undefined): DomainHubCredentialsForm {
  return {
    cloudflareApiToken: data?.cloudflareApiToken ?? "",
    cloudflareAccountId: data?.cloudflareAccountId ?? "",
    hostingerApiToken: data?.hostingerApiToken ?? "",
    ovhAppKey: data?.ovhAppKey ?? "",
    ovhAppSecret: data?.ovhAppSecret ?? "",
    ovhConsumerKey: data?.ovhConsumerKey ?? "",
    ovhSubsidiary: data?.ovhSubsidiary || "FR",
    configured: {
      cloudflare: Boolean(data?.configured?.cloudflare),
      hostinger: Boolean(data?.configured?.hostinger),
      ovh: Boolean(data?.configured?.ovh),
    },
  };
}

export function useDomainHubCredentials(enabled: boolean) {
  const [credentials, setCredentials] = useState<DomainHubCredentialsForm>(EMPTY_CREDENTIALS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) {
      setCredentials(EMPTY_CREDENTIALS);
      setLoaded(false);
      setLoadError(false);
      return;
    }
    setLoading(true);
    setLoadError(false);
    try {
      const data = await api.get<DomainHubCredentialsForm>("/account/domain-hub-credentials");
      setCredentials(normalize(data));
      setLoaded(true);
    } catch (err) {
      setLoadError(true);
      toast({
        title: "Chargement impossible",
        description: err instanceof Error ? err.message : "Impossible de charger les identifiants Domain Hub.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async () => {
    if (!loaded) {
      throw new Error("Les identifiants Domain Hub ne sont pas encore chargés.");
    }
    const payload = {
      cloudflareApiToken: credentials.cloudflareApiToken,
      cloudflareAccountId: credentials.cloudflareAccountId,
      hostingerApiToken: credentials.hostingerApiToken,
      ovhAppKey: credentials.ovhAppKey,
      ovhAppSecret: credentials.ovhAppSecret,
      ovhConsumerKey: credentials.ovhConsumerKey,
      ovhSubsidiary: credentials.ovhSubsidiary,
    };
    setSaving(true);
    try {
      const data = await api.put<DomainHubCredentialsForm>("/account/domain-hub-credentials", payload);
      setCredentials(normalize(data));
      return data;
    } finally {
      setSaving(false);
    }
  }, [credentials, loaded]);

  const noRegistrarConfigured =
    !credentials.configured.cloudflare &&
    !credentials.configured.hostinger &&
    !credentials.configured.ovh;

  return {
    credentials,
    setCredentials,
    loading,
    saving,
    loaded,
    loadError,
    load,
    save,
    noRegistrarConfigured,
  };
}
