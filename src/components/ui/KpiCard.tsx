import { ReactNode } from "react";

type Props = {
  label: string;
  value: string;
  subLabel?: string;
  trend?: string;
  trendType?: "up" | "down" | "neutral";
  pill?: string;
  icon?: ReactNode;
};

export function KpiCard({
  label,
  value,
  subLabel,
  trend,
  trendType = "neutral",
  pill,
  icon,
}: Props) {
  const trendColor =
    trendType === "up"
      ? "text-emerald-400"
      : trendType === "down"
        ? "text-red-400"
        : "text-slate-400";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm shadow-black/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
            {label}
            {pill && (
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-emerald-300">
                {pill}
              </span>
            )}
          </div>
          <div className="text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
            {value}
          </div>
          {subLabel && (
            <div className="mt-1 text-xs text-slate-400">{subLabel}</div>
          )}
        </div>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800/80 text-slate-200">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 text-[11px] text-slate-400">
          <span className={trendColor}>{trend}</span>{" "}
          <span className="text-slate-500">vs. yesterday</span>
        </div>
      )}
      <div className="pointer-events-none absolute -right-6 -top-10 h-24 w-24 rounded-full bg-emerald-500/5" />
    </div>
  );
}

