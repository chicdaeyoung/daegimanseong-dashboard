import { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  right?: ReactNode;
  children: ReactNode;
};

export function SectionCard({ title, description, right, children }: Props) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm shadow-black/40">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-50">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-xs text-slate-400">{description}</p>
          )}
        </div>
        {right}
      </div>
      <div className="mt-1">{children}</div>
    </section>
  );
}

