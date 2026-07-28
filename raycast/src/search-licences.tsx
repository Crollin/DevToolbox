import {
  Action,
  ActionPanel,
  Alert,
  confirmAlert,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { appLicenceUrl, deleteLicence, Licence, listLicences } from "./api";
import { LicenceForm } from "./licence-form";

function expiryLabel(licence: Licence) {
  if (licence.isLifetime) return "Lifetime";
  if (!licence.renewalDate) return "No renewal date";
  return `Renews ${new Date(licence.renewalDate).toLocaleDateString()}`;
}
function EditLicence({
  licence,
  onSaved,
}: {
  licence: Licence;
  onSaved: () => void;
}) {
  const { pop } = useNavigation();
  return (
    <LicenceForm
      licence={licence}
      onSaved={() => {
        onSaved();
        pop();
      }}
    />
  );
}

export default function SearchLicences() {
  const [licences, setLicences] = useState<Licence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  async function load() {
    setIsLoading(true);
    setError(undefined);
    try {
      setLicences(await listLicences());
    } catch (caught) {
      setError(String(caught));
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function remove(licence: Licence) {
    if (
      !(await confirmAlert({
        title: `Delete ${licence.name}?`,
        message: "Cette action est irréversible.",
        primaryAction: {
          style: Alert.ActionStyle.Destructive,
          title: "Delete",
        },
      }))
    )
      return;
    try {
      await deleteLicence(licence.id);
      await showToast({
        style: Toast.Style.Success,
        title: "Licence supprimée",
      });
      await load();
    } catch (caught) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Suppression impossible",
        message: String(caught),
      });
    }
  }
  if (error)
    return (
      <List isLoading={isLoading}>
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="API indisponible"
          description={error}
          actions={
            <ActionPanel>
              <Action
                title="Retry"
                icon={Icon.RotateClockwise}
                onAction={load}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search by name, type, key or notes..."
    >
      {licences.map((licence) => (
        <List.Item
          key={licence.id}
          title={licence.name}
          subtitle={`${licence.type} · ${expiryLabel(licence)}`}
          accessories={[{ text: licence.key ? "••••••••" : "No key" }]}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard
                title="Copy Licence Key"
                content={licence.key}
                concealed
              />
              <Action.Push
                title="Edit Licence"
                icon={Icon.Pencil}
                target={<EditLicence licence={licence} onSaved={load} />}
              />
              <Action.OpenInBrowser
                title="Open in DevToolbox"
                url={appLicenceUrl(licence.id)}
              />
              <Action
                title="Delete Licence"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                onAction={() => remove(licence)}
              />
              <Action
                title="Refresh"
                icon={Icon.RotateClockwise}
                onAction={load}
              />
            </ActionPanel>
          }
        />
      ))}
      {!isLoading && licences.length === 0 && (
        <List.EmptyView
          title="No licences"
          description="Créez votre première licence depuis la commande Create Licence."
        />
      )}
    </List>
  );
}
