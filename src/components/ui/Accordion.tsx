"use client";

import { ReactNode, useState } from "react";

export type AccordionItem = {
  id: string;
  title: ReactNode;
  content: ReactNode;
  defaultOpen?: boolean;
};

export function Accordion({ items }: { items: AccordionItem[] }) {
  const initial = new Set(
    items.filter((i) => i.defaultOpen).map((i) => i.id),
  );
  const [openIds, setOpenIds] = useState<Set<string>>(initial);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const open = openIds.has(item.id);
        return (
          <div
            key={item.id}
            className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60"
          >
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm"
            >
              <div className="font-medium text-slate-50">{item.title}</div>
              <span className="text-slate-400">{open ? "−" : "+"}</span>
            </button>
            {open && <div className="border-t border-slate-800 p-3">{item.content}</div>}
          </div>
        );
      })}
    </div>
  );
}

