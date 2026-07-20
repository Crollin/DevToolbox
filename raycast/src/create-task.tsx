import { Action, ActionPanel, Form, showToast, Toast } from "@raycast/api";
import { createTask } from "./task-api";

export default function CreateTask() {
  async function handleSubmit(values: Record<string, string>) {
    try {
      await createTask({
        title: values.title.trim(),
        dueDate: values.dueDate.trim(),
        description: values.description.trim() || undefined,
        client: values.client.trim() || undefined,
        link: values.link.trim() || undefined,
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
      <Form.TextField
        id="dueDate"
        title="Date d’échéance"
        placeholder="YYYY-MM-DD"
      />
      <Form.TextField id="client" title="Client" />
      <Form.TextField id="link" title="Lien" placeholder="https://..." />
      <Form.TextArea id="description" title="Description" />
    </Form>
  );
}
