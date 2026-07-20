import { Action, ActionPanel, Form, showToast, Toast } from "@raycast/api";
import { createTask } from "./task-api";

export default function CreateTask() {
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

    const reminderDays = [7, 3, 1].filter(
      (days) => values[`reminder${days}`] === true,
    );
    const reminderDatetime = values.reminderDatetime;

    try {
      await createTask({
        title: values.title.trim(),
        dueDate: formatDateOnly(dueDate),
        description: values.description.trim() || undefined,
        client: values.client.trim() || undefined,
        link: values.link.trim() || undefined,
        reminderDays: reminderDays.length > 0 ? reminderDays : undefined,
        reminderDatetime:
          reminderDatetime instanceof Date
            ? reminderDatetime.toISOString()
            : undefined,
      });
      await showToast({ style: Toast.Style.Success, title: "Tâche créée" });
    } catch (caught) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Création impossible",
        message: String(caught),
      });
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Créer la tâche" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="title" title="Titre" autoFocus />
      <Form.DatePicker
        id="dueDate"
        title="Date d'échéance"
        type={Form.DatePicker.Type.Date}
        defaultValue={new Date(Date.now() + 24 * 60 * 60 * 1000)}
      />
      <Form.TextField id="client" title="Client" />
      <Form.TextField id="link" title="Lien" placeholder="https://..." />
      <Form.TextArea id="description" title="Description" />
      <Form.Checkbox id="reminder7" label="7 jours avant" />
      <Form.Checkbox id="reminder3" label="3 jours avant" />
      <Form.Checkbox id="reminder1" label="1 jour avant" />
      <Form.DatePicker
        id="reminderDatetime"
        title="Rappel à une date/heure précise"
        type={Form.DatePicker.Type.DateTime}
        info="Format : jj/mm/aaaa - hh:mm (optionnel)"
      />
    </Form>
  );
}
