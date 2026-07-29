import { cn } from "@/lib/utils";

interface AppLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-7 h-7",
  md: "w-9 h-9",
  lg: "w-16 h-16",
} as const;

export default function AppLogo({ size = "md", className }: AppLogoProps) {
  return (
    <div className={cn("rounded-xl overflow-hidden flex-shrink-0", sizeMap[size], className)}>
      <img
        src="/favicon.svg"
        alt="DevToolbox"
        className="w-full h-full object-contain"
      />
    </div>
  );
}
