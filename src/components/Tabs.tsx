"use client";

import { useState } from "react";

export type TabItem = {
  id: string;
  label: string;
  /** rood bolletje, bijvoorbeeld bij nieuw meerwerk of een opmerking */
  dot?: boolean;
  content: React.ReactNode;
};

export function Tabs({ tabs, initial }: { tabs: TabItem[]; initial?: string }) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className="space-y-5">
      {/* schuift horizontaal op een telefoon in plaats van af te breken */}
      <div
        role="tablist"
        className="-mx-1 flex gap-1 overflow-x-auto border-b border-jurgh-border px-1"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === current?.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActive(tab.id)}
              className={`relative whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "border-jurgh-red text-jurgh-text"
                  : "border-transparent text-jurgh-muted hover:text-jurgh-text"
              }`}
            >
              {tab.label}
              {tab.dot && (
                <span
                  aria-label="nieuw"
                  className="ml-1.5 inline-block h-2 w-2 rounded-full bg-jurgh-red align-middle"
                />
              )}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">{current?.content}</div>
    </div>
  );
}
