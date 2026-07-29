import { Loader2 } from 'lucide-react';

interface CompareLoadingProps {
  label: string;
  domainCount: number;
}

export function CompareLoading({ label, domainCount }: CompareLoadingProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
        <div>
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cela peut prendre quelques secondes selon les registrars actifs.
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: Math.min(domainCount, 6) }).map((_, i) => (
          <div
            key={i}
            className="h-10 rounded-md bg-muted/50 animate-pulse"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
        {domainCount > 6 && (
          <p className="text-xs text-muted-foreground text-center">
            + {domainCount - 6} autre{domainCount - 6 > 1 ? 's' : ''} extension
            {domainCount - 6 > 1 ? 's' : ''}…
          </p>
        )}
      </div>
    </div>
  );
}
