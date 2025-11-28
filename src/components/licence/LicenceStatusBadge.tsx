import { Licence } from "@/types/licence";
import { cn } from "@/lib/utils";
import { Infinity, Clock, AlertTriangle } from "lucide-react";

interface LicenceStatusBadgeProps {
  licence: Licence;
}

export function getDaysUntilRenewal(licence: Licence): number | null {
  if (licence.isLifetime || !licence.renewalDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const renewal = new Date(licence.renewalDate);
  renewal.setHours(0, 0, 0, 0);
  const diffTime = renewal.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getLicenceStatus(licence: Licence): "lifetime" | "expired" | "warning" | "ok" {
  if (licence.isLifetime) return "lifetime";
  const days = getDaysUntilRenewal(licence);
  if (days === null) return "ok";
  if (days < 0) return "expired";
  if (days <= 30) return "warning";
  return "ok";
}

const LicenceStatusBadge = ({ licence }: LicenceStatusBadgeProps) => {
  const status = getLicenceStatus(licence);
  const days = getDaysUntilRenewal(licence);

  if (status === "lifetime") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30">
        <Infinity className="w-3 h-3" />
        Lifetime
      </span>
    );
  }

  if (status === "expired") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30">
        <AlertTriangle className="w-3 h-3" />
        Expirée
      </span>
    );
  }

  if (status === "warning") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
        <Clock className="w-3 h-3" />
        {days}j restants
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
      <Clock className="w-3 h-3" />
      {days}j restants
    </span>
  );
};

export default LicenceStatusBadge;
