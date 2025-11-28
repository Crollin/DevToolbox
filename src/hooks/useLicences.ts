import { useState, useEffect } from "react";
import { Licence, NtfyConfig } from "@/types/licence";

const LICENCES_KEY = "licence-key-hub-licences";
const NTFY_CONFIG_KEY = "licence-key-hub-ntfy";

const defaultNtfyConfig: NtfyConfig = {
  enabled: false,
  serverUrl: "https://ntfy.sh",
  topic: "",
  token: "",
};

export function useLicences() {
  const [licences, setLicences] = useState<Licence[]>([]);
  const [ntfyConfig, setNtfyConfig] = useState<NtfyConfig>(defaultNtfyConfig);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const storedLicences = localStorage.getItem(LICENCES_KEY);
    const storedNtfy = localStorage.getItem(NTFY_CONFIG_KEY);

    if (storedLicences) {
      try {
        setLicences(JSON.parse(storedLicences));
      } catch (e) {
        console.error("Failed to parse licences", e);
      }
    }

    if (storedNtfy) {
      try {
        setNtfyConfig(JSON.parse(storedNtfy));
      } catch (e) {
        console.error("Failed to parse ntfy config", e);
      }
    }

    setIsLoaded(true);
  }, []);

  // Save licences to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(LICENCES_KEY, JSON.stringify(licences));
    }
  }, [licences, isLoaded]);

  // Save ntfy config to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(NTFY_CONFIG_KEY, JSON.stringify(ntfyConfig));
    }
  }, [ntfyConfig, isLoaded]);

  const addLicence = (licence: Omit<Licence, "id" | "createdAt">) => {
    const newLicence: Licence = {
      ...licence,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setLicences((prev) => [...prev, newLicence]);
    return newLicence;
  };

  const updateLicence = (id: string, updates: Partial<Omit<Licence, "id" | "createdAt">>) => {
    setLicences((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  };

  const deleteLicence = (id: string) => {
    setLicences((prev) => prev.filter((l) => l.id !== id));
  };

  const updateNtfyConfig = (config: Partial<NtfyConfig>) => {
    setNtfyConfig((prev) => ({ ...prev, ...config }));
  };

  return {
    licences,
    ntfyConfig,
    isLoaded,
    addLicence,
    updateLicence,
    deleteLicence,
    updateNtfyConfig,
  };
}
