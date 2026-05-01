import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  helper?: string;
  icon: LucideIcon;
  tone?: "emerald" | "blue" | "amber" | "neutral";
}

const toneClasses = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  blue: "bg-sky-50 text-sky-700 border-sky-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  neutral: "bg-stone-50 text-stone-700 border-stone-100",
};

export function StatCard({ title, value, helper, icon: Icon, tone = "neutral" }: StatCardProps) {
  return (
    <Card className="rounded-lg">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("flex size-11 items-center justify-center rounded-md border", toneClasses[tone])}>
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-semibold tracking-normal">{value}</p>
          {helper ? <p className="mt-1 truncate text-xs text-muted-foreground">{helper}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
