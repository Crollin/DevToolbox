import { getPreferenceValues } from "@raycast/api";

export type LicenceType = "wordpress" | "saas" | "api" | "autre";
export interface Licence {
  id: string;
  name: string;
  key: string;
  type: LicenceType;
  seatCount?: number;
  isLifetime: boolean;
  renewalDate?: string;
  notes?: string;
  notificationsEnabled?: boolean;
  createdAt: string;
}
export interface LicenceInput {
  name: string;
  key: string;
  type: LicenceType;
  seatCount?: number;
  isLifetime: boolean;
  renewalDate?: string;
  notes?: string;
  notificationsEnabled?: boolean;
}
interface Preferences {
  apiBaseUrl: string;
  personalAccessToken: string;
}

function preferences(): Preferences {
  const values = getPreferenceValues<Preferences>();
  if (!values.apiBaseUrl || !values.personalAccessToken)
    throw new Error(
      "Configurez l'URL de l'API et le Personal Access Token dans les préférences Raycast.",
    );
  return values;
}
function apiUrl(path: string) {
  return `${preferences().apiBaseUrl.replace(/\/$/, "")}${path}`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { personalAccessToken } = preferences();
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${personalAccessToken}`,
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    if (response.status === 401)
      throw new Error("Personal Access Token invalide, expiré ou révoqué.");
    throw new Error(body.error ?? `Erreur API (${response.status})`);
  }
  return response.json() as Promise<T>;
}
export async function listLicences() {
  return (await request<{ licences: Licence[] }>("/licences")).licences;
}
export async function createLicence(input: LicenceInput) {
  return request<Licence>("/licences", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
export async function updateLicence(id: string, input: LicenceInput) {
  return request<Licence>(`/licences/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
export async function deleteLicence(id: string) {
  await request<{ success: boolean }>(`/licences/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
export function appLicenceUrl(id?: string) {
  const base = preferences()
    .apiBaseUrl.replace(/\/api\/?$/, "")
    .replace(/\/$/, "");
  return `${base}/tools/licence-key-hub${id ? `?licence=${encodeURIComponent(id)}` : ""}`;
}
