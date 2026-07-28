import { useEffect, useState } from "react";
import {
  Action,
  ActionPanel,
  closeMainWindow,
  Form,
  showToast,
  Toast,
} from "@raycast/api";
import {
  createTask,
  createTaskClient,
  listTaskClients,
  TaskClient,
} from "./task-api";

type Channel = "ntfy" | "email" | "telegram";

const channelFields: Array<{ id: Channel; label: string }> = [
  { id: "email", label: "Email" },
  { id: "telegram", label: "Telegram" },
  { id: "ntfy", label: "Ntfy" },
];

export default function CreateTask() {
  const [clients, setClients] = useState<TaskClient[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    listTaskClients()
      .then(setClients)
      .catch(() => undefined);
  }, []);

  function formatDateOnly(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  async function handleSubmit(values: Form.Values) {
    const dueDate = values.dueDate;
    if (!(dueDate instanceof Date)) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Date d'échéance requise",
      });
      return;
    }

    const title = String(values.title ?? "").trim();
    if (!title) {
      await showToast({ style: Toast.Style.Failure, title: "Titre requis" });
      return;
    }

    const newClient = String(values.newClient ?? "").trim();
    let client = String(values.client ?? "").trim();

    setIsLoading(true);
    try {
      if (newClient) {
        const createdClient = await createTaskClient(newClient);
        client = createdClient.name;
        setClients((current) => [
          ...current.filter((item) => item.name !== client),
          createdClient,
        ]);
      }

      const reminderDays = [7, 3, 1].filter(
        (days) => values[`reminder${days}`] === true,
      );
      const tags = String(values.tags ?? "")
        .split(",")
        .map((tag) => tag.trim().replace(/^#/, ""))
        .filter(Boolean);
      const notificationChannels = channelFields
        .filter(({ id }) => values[`channel-${id}`] === true)
        .map(({ id }) => id);
      const reminderDatetime = values.reminderDatetime;

      await createTask({
        title,
        dueDate: formatDateOnly(dueDate),
        description: String(values.description ?? "").trim() || undefined,
        client: client || undefined,
        link: String(values.link ?? "").trim() || undefined,
        tags: tags.length ? tags : undefined,
        priority:
          (values.priority as "low" | "normal" | "high" | "urgent") || "normal",
        notificationChannels: notificationChannels.length
          ? notificationChannels
          : undefined,
        reminderDays: reminderDays.length ? reminderDays : undefined,
        reminderDatetime:
          reminderDatetime instanceof Date
            ? reminderDatetime.toISOString()
            : undefined,
      });
      await showToast({ style: Toast.Style.Success, title: "Tâche créée" });
      await closeMainWindow();
    } catch (caught) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Création impossible",
        message: String(caught),
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
          <Action.SubmitForm title="Créer la tâche" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="title"
        title="Titre"
        autoFocus
        placeholder="Ex. Valider la maquette d'accueil"
      />
      <Form.TextArea
        id="description"
        title="Description"
        placeholder="Notes, contexte, checklist… Markdown accepté."
      />
      <Form.DatePicker
        id="dueDate"
        title="Date d'échéance"
        type={Form.DatePicker.Type.Date}
        defaultValue={new Date(Date.now() + 24 * 60 * 60 * 1000)}
      />

      <Form.Dropdown id="priority" title="Priorité" defaultValue="normal">
        <Form.Dropdown.Item value="low" title="Faible" />
        <Form.Dropdown.Item value="normal" title="Normale" />
        <Form.Dropdown.Item value="high" title="Haute" />
        <Form.Dropdown.Item value="urgent" title="Urgente" />
      </Form.Dropdown>

      <Form.Dropdown id="client" title="Client" defaultValue="">
        <Form.Dropdown.Item value="" title="Sans client" />
        {clients.map((client) => (
          <Form.Dropdown.Item
            key={client.id}
            value={client.name}
            title={client.name}
          />
        ))}
      </Form.Dropdown>
      <Form.TextField
        id="newClient"
        title="Ajouter un client"
        placeholder="Laisser vide pour utiliser la liste"
      />
      <Form.TextField
        id="tags"
        title="Tags"
        placeholder="design, urgent, site-web"
        info="Séparez les tags par des virgules."
      />
      <Form.TextField id="link" title="Lien" placeholder="https://..." />

      <Form.Separator />
      <Form.Description text="Canaux de notification — laissez tout décoché pour utiliser la configuration du compte." />
      {channelFields.map((channel) => (
        <Form.Checkbox
          key={channel.id}
          id={`channel-${channel.id}`}
          label={channel.label}
        />
      ))}

      <Form.Separator />
      <Form.Checkbox id="reminder7" label="7 jours avant" />
      <Form.Checkbox id="reminder3" label="3 jours avant" />
      <Form.Checkbox id="reminder1" label="1 jour avant" />
      <Form.DatePicker
        id="reminderDatetime"
        title="Rappel à une date/heure précise"
        type={Form.DatePicker.Type.DateTime}
        info="Optionnel"
      />
    </Form>
  );
}
