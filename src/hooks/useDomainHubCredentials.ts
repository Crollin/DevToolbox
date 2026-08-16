import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

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

  const load = useCallback(async () => {
    if (!enabled) {
      setCredentials(EMPTY_CREDENTIALS);
      return;
    }
    setLoading(true);
    try {
      const data = await api.get<DomainHubCredentialsForm>("/account/domain-hub-credentials");
      setCredentials(normalize(data));
    } catch {
      setCredentials(EMPTY_CREDENTIALS);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async () => {
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
  }, [credentials]);

  const noRegistrarConfigured =
    !credentials.configured.cloudflare &&
    !credentials.configured.hostinger &&
    !credentials.configured.ovh;

  return {
    credentials,
    setCredentials,
    loading,
    saving,
    load,
    save,
    noRegistrarConfigured,
  };
}
