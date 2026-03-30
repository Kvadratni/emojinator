"use client";

import type { EmojiGroup } from "@/lib/emoji-store";

interface Props {
  groups: EmojiGroup[];
  total: number;
  activeGroup: string | null;
  onSelectGroup: (prefix: string | null) => void;
  filteredCount: number;
}

export function Sidebar({
  groups,
  total,
  activeGroup,
  onSelectGroup,
  filteredCount,
}: Props) {
  return (
    <aside className="w-56 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-700 flex flex-col bg-zinc-50 dark:bg-zinc-900">
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-700">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          Showing {filteredCount.toLocaleString()} of{" "}
          {total.toLocaleString()} emojis
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <button
          onClick={() => onSelectGroup(null)}
          className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
            activeGroup === null
              ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          }`}
        >
          All{" "}
          <span className="text-zinc-400 dark:text-zinc-500 text-xs">
            {total.toLocaleString()}
          </span>
        </button>
        {groups.map((g) => (
          <button
            key={g.prefix}
            onClick={() => onSelectGroup(g.prefix)}
            className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
              activeGroup === g.prefix
                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            {g.prefix}{" "}
            <span className="text-zinc-400 dark:text-zinc-500 text-xs">
              {g.count.toLocaleString()}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
