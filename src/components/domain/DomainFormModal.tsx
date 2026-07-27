import { useState, type FormEvent } from 'react';
import { PortfolioDomain, PortfolioDomainInput, PortfolioRegistrar, DomainPayer, REGISTRAR_LABELS } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface DomainFormModalProps {
  open: boolean;
  initial?: PortfolioDomain | null;
  onClose: () => void;
  onSave: (data: PortfolioDomainInput) => Promise<void>;
}

const emptyForm: PortfolioDomainInput = {
  name: '',
  registrar: 'other',
  clientName: '',
  clientEmail: '',
  payer: 'agency',
  costYearly: null,
  sellYearly: null,
  currency: 'EUR',
  expiresAt: '',
  autoRenew: false,
  notes: '',
  notificationsEnabled: true,
  qontoClientId: '',
};

export function DomainFormModal({ open, initial, onClose, onSave }: DomainFormModalProps) {
  const [form, setForm] = useState<PortfolioDomainInput>(
    initial
      ? {
          name: initial.name,
          registrar: initial.registrar,
          clientName: initial.clientName || '',
          clientEmail: initial.clientEmail || '',
          payer: initial.payer,
          costYearly: initial.costYearly,
          sellYearly: initial.sellYearly,
          currency: initial.currency,
          expiresAt: initial.expiresAt?.slice(0, 10) || '',
          autoRenew: initial.autoRenew,
          notes: initial.notes || '',
          notificationsEnabled: initial.notificationsEnabled,
          qontoClientId: initial.qontoClientId || '',
        }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const set = <K extends keyof PortfolioDomainInput>(key: K, value: PortfolioDomainInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        clientName: form.clientName || null,
        clientEmail: form.clientEmail || null,
        notes: form.notes || null,
        expiresAt: form.expiresAt || null,
        qontoClientId: form.qontoClientId || null,
        costYearly: form.costYearly === undefined || form.costYearly === null || Number.isNaN(Number(form.costYearly))
          ? null
          : Number(form.costYearly),
        sellYearly: form.sellYearly === undefined || form.sellYearly === null || Number.isNaN(Number(form.sellYearly))
          ? null
          : Number(form.sellYearly),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-background p-5 space-y-4"
      >
        <h2 className="font-mono text-lg font-medium">
          {initial ? 'Modifier le domaine' : 'Ajouter un domaine'}
        </h2>

        <div className="space-y-1.5">
          <Label htmlFor="dom-name">Nom de domaine</Label>
          <Input
            id="dom-name"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="exemple.com"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="dom-registrar">Registrar</Label>
            <select
              id="dom-registrar"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.registrar}
              onChange={(e) => set('registrar', e.target.value as PortfolioRegistrar)}
            >
              {(Object.keys(REGISTRAR_LABELS) as PortfolioRegistrar[]).map((k) => (
                <option key={k} value={k}>
                  {REGISTRAR_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dom-payer">Qui paye</Label>
            <select
              id="dom-payer"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.payer}
              onChange={(e) => set('payer', e.target.value as DomainPayer)}
            >
              <option value="agency">Agence (moi)</option>
              <option value="client">Client</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="dom-client">Client</Label>
            <Input
              id="dom-client"
              value={form.clientName || ''}
              onChange={(e) => set('clientName', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dom-email">Email client</Label>
            <Input
              id="dom-email"
              type="email"
              value={form.clientEmail || ''}
              onChange={(e) => set('clientEmail', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="dom-cost">Coût / an</Label>
            <Input
              id="dom-cost"
              type="number"
              step="0.01"
              value={form.costYearly ?? ''}
              onChange={(e) => set('costYearly', e.target.value === '' ? null : Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dom-sell">Revente / an</Label>
            <Input
              id="dom-sell"
              type="number"
              step="0.01"
              value={form.sellYearly ?? ''}
              onChange={(e) => set('sellYearly', e.target.value === '' ? null : Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dom-cur">Devise</Label>
            <Input
              id="dom-cur"
              value={form.currency || 'EUR'}
              onChange={(e) => set('currency', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="dom-exp">Expiration</Label>
            <Input
              id="dom-exp"
              type="date"
              value={form.expiresAt || ''}
              onChange={(e) => set('expiresAt', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dom-qonto">Qonto client ID</Label>
            <Input
              id="dom-qonto"
              value={form.qontoClientId || ''}
              onChange={(e) => set('qontoClientId', e.target.value)}
              placeholder="uuid Qonto"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dom-notes">Notes</Label>
          <Input
            id="dom-notes"
            value={form.notes || ''}
            onChange={(e) => set('notes', e.target.value)}
          />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={Boolean(form.autoRenew)}
              onCheckedChange={(v) => set('autoRenew', Boolean(v))}
            />
            Auto-renew
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.notificationsEnabled !== false}
              onCheckedChange={(v) => set('notificationsEnabled', Boolean(v))}
            />
            Alertes
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </div>
  );
}
