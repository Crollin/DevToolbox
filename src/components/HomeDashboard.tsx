import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, ListTodo, BookMarked, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface LicenceSummary {
  name: string;
  daysUntilExpiry: number;
}

interface TaskSummary {
  id: string;
  title: string;
  dueDate: string;
  status: string;
}

interface KBSummary {
  id: string;
  title: string;
  lastOpenedAt?: string;
}

export function HomeDashboard() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [licences, setLicences] = useState<LicenceSummary[]>([]);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [kbEntries, setKbEntries] = useState<KBSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const load = async () => {
      try {
        const [licData, taskData, kbData] = await Promise.all([
          api.get<{ licences: Array<{ name: string; expiresAt: string | null; status: string }> }>("/licences"),
          api.get<{ tasks: Array<{ id: string; title: string; dueDate: string; status: string }> }>("/tasks?status=pending"),
          api.get<{ entries: Array<{ id: string; title: string; lastOpenedAt?: string }> }>("/kb/entries?limit=5&sort=recent"),
        ]);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const expiring = (licData.licences || [])
          .filter((l) => l.status !== "lifetime" && l.expiresAt)
          .map((l) => {
            const exp = new Date(l.expiresAt!);
            exp.setHours(0, 0, 0, 0);
            const days = Math.ceil((exp.getTime() - today.getTime()) / (86400000));
            return { name: l.name, daysUntilExpiry: days };
          })
          .filter((l) => l.daysUntilExpiry <= 30)
          .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
          .slice(0, 5);

        setLicences(expiring);
        setTasks((taskData.tasks || []).slice(0, 5));
        setKbEntries((kbData.entries || []).slice(0, 5));
      } catch {
        // Dashboard optionnel — ne pas bloquer l'accueil
      } finally {
        setLoaded(true);
      }
    };

    void load();
  }, [isAuthenticated]);

  if (!isAuthenticated || !loaded) return null;
  if (licences.length === 0 && tasks.length === 0 && kbEntries.length === 0) return null;

  return (
    <section className="mb-10 grid gap-4 md:grid-cols-3 animate-fade-in">
      {licences.length > 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              Licences à surveiller
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {licences.map((l) => (
              <button
                key={l.name}
                type="button"
                className="w-full flex items-center justify-between text-sm hover:text-primary text-left"
                onClick={() => navigate("/tools/licence-key-hub")}
              >
                <span className="truncate">{l.name}</span>
                <span className={l.daysUntilExpiry <= 7 ? "text-destructive" : "text-muted-foreground"}>
                  J{l.daysUntilExpiry >= 0 ? `-${l.daysUntilExpiry}` : `+${Math.abs(l.daysUntilExpiry)}`}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {tasks.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-primary" />
              Tâches en cours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.map((t) => (
              <button
                key={t.id}
                type="button"
                className="w-full flex items-center justify-between text-sm hover:text-primary text-left gap-2"
                onClick={() => navigate("/tools/task-reminder")}
              >
                <span className="truncate">{t.title}</span>
                <ChevronRight className="w-3 h-3 shrink-0 opacity-50" />
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {kbEntries.length > 0 && (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-emerald-500" />
              Knowledge Base récente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {kbEntries.map((e) => (
              <button
                key={e.id}
                type="button"
                className="w-full flex items-center justify-between text-sm hover:text-primary text-left gap-2"
                onClick={() => navigate("/tools/knowledge-base")}
              >
                <span className="truncate">{e.title}</span>
                <ChevronRight className="w-3 h-3 shrink-0 opacity-50" />
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </section>
  );
}
