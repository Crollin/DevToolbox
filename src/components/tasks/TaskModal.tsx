import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Task, CreateTaskInput } from "@/types/task";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: CreateTaskInput) => void;
  editTask?: Task | null;
}

const TaskModal = ({ isOpen, onClose, onSave, editTask }: TaskModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [client, setClient] = useState("");
  const [link, setLink] = useState("");
  const [reminderDays, setReminderDays] = useState<number[]>([]);
  const [reminderDatetime, setReminderDatetime] = useState("");

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || "");
      setDueDate(editTask.dueDate.split('T')[0]); // Format YYYY-MM-DD pour input date
      setClient(editTask.client || "");
      setLink(editTask.link || "");
      setReminderDays(editTask.reminderDays || []);
      setReminderDatetime(editTask.reminderDatetime ? new Date(editTask.reminderDatetime).toISOString().slice(0, 16) : "");
    } else {
      setTitle("");
      setDescription("");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDueDate(tomorrow.toISOString().split('T')[0]);
      setClient("");
      setLink("");
      setReminderDays([]);
      setReminderDatetime("");
    }
  }, [editTask, isOpen]);

  const handleReminderDayToggle = (days: number) => {
    setReminderDays((prev) =>
      prev.includes(days)
        ? prev.filter((d) => d !== days)
        : [...prev, days].sort((a, b) => b - a)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convertir dueDate en format ISO complet
    const dueDateISO = new Date(dueDate).toISOString();
    
    // Convertir reminderDatetime en format ISO si fourni
    const reminderDatetimeISO = reminderDatetime 
      ? new Date(reminderDatetime).toISOString() 
      : undefined;

    onSave({
      title,
      description: description || undefined,
      dueDate: dueDateISO,
      client: client || undefined,
      link: link || undefined,
      reminderDays: reminderDays.length > 0 ? reminderDays : undefined,
      reminderDatetime: reminderDatetimeISO,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4 bg-card border border-border rounded-xl shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
          <h2 className="text-lg font-semibold text-foreground">
            {editTask ? "Modifier la tâche" : "Nouvelle tâche"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Titre de la tâche *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Ex: Finaliser le design du site"
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails de la tâche..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          {/* Date d'accomplissement */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Date d'accomplissement *
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Client
            </label>
            <input
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Ex: Client ABC"
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Lien */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Lien / URL
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Rappels - Jours avant */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Rappels (jours avant l'échéance)
            </label>
            <div className="flex flex-wrap gap-3">
              {[7, 3, 1].map((days) => (
                <div key={days} className="flex items-center space-x-2">
                  <Checkbox
                    id={`reminder-${days}`}
                    checked={reminderDays.includes(days)}
                    onCheckedChange={() => handleReminderDayToggle(days)}
                  />
                  <Label
                    htmlFor={`reminder-${days}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {days} jour{days > 1 ? 's' : ''} avant
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Rappel date/heure précise */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Rappel à une date/heure précise (optionnel)
            </label>
            <input
              type="datetime-local"
              value={reminderDatetime}
              onChange={(e) => setReminderDatetime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Si défini, un rappel sera envoyé à cette date/heure précise
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {editTask ? "Modifier" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
