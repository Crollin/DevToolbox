import { Action, ActionPanel, Form, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import {
  Licence,
  LicenceInput,
  LicenceType,
  createLicence,
  updateLicence,
} from "./api";

export function LicenceForm({
  licence,
  onSaved,
}: {
  licence?: Licence;
  onSaved?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(values: Record<string, string>) {
    const input: LicenceInput = {
      name: values.name.trim(),
      key: values.key.trim(),
      type: values.type as LicenceType,
      seatCount: values.seatCount ? Number(values.seatCount) : undefined,
      isLifetime: values.isLifetime === "true",
      renewalDate:
        values.isLifetime === "true"
          ? undefined
          : values.renewalDate || undefined,
      notes: values.notes.trim() || undefined,
      notificationsEnabled: values.notificationsEnabled !== "false",
    };
    setIsLoading(true);
    try {
      if (licence) await updateLicence(licence.id, input);
      else await createLicence(input);
      await showToast({
        style: Toast.Style.Success,
        title: licence ? "Licence mise à jour" : "Licence créée",
      });
      onSaved?.();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Impossible d'enregistrer la licence",
        message: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title={licence ? "Update Licence" : "Create Licence"}
            onSubmit={handleSubmit}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="name"
        title="Name"
        defaultValue={licence?.name}
        autoFocus
      />
      <Form.PasswordField
        id="key"
        title="Licence Key"
        defaultValue={licence?.key}
      />
      <Form.Dropdown
        id="type"
        title="Type"
        defaultValue={licence?.type ?? "saas"}
      >
        <Form.Dropdown.Item value="wordpress" title="WordPress" />
        <Form.Dropdown.Item value="saas" title="SaaS" />
        <Form.Dropdown.Item value="api" title="API" />
        <Form.Dropdown.Item value="autre" title="Autre" />
      </Form.Dropdown>
      <Form.TextField
        id="seatCount"
        title="Seats"
        defaultValue={licence?.seatCount?.toString()}
        placeholder="Optional"
      />
      <Form.Dropdown
        id="isLifetime"
        title="Duration"
        defaultValue={licence?.isLifetime ? "true" : "false"}
      >
        <Form.Dropdown.Item value="false" title="Renewable" />
        <Form.Dropdown.Item value="true" title="Lifetime" />
      </Form.Dropdown>
      <Form.TextField
        id="renewalDate"
        title="Renewal Date"
        defaultValue={licence?.renewalDate?.slice(0, 10)}
        placeholder="YYYY-MM-DD"
      />
      <Form.TextArea id="notes" title="Notes" defaultValue={licence?.notes} />
      <Form.Dropdown
        id="notificationsEnabled"
        title="Notifications"
        defaultValue={
          licence?.notificationsEnabled === false ? "false" : "true"
        }
      >
        <Form.Dropdown.Item value="true" title="Enabled" />
        <Form.Dropdown.Item value="false" title="Disabled" />
      </Form.Dropdown>
    </Form>
  );
}
