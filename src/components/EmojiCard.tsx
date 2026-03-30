"use client";

import React from "react";
import type { Emoji } from "@/lib/emoji-store";

interface Props {
  emoji: Emoji;
  isSelected: boolean;
  onToggle: (filename: string) => void;
  style?: React.CSSProperties;
}

export const EmojiCard = React.memo(function EmojiCard({
  emoji,
  isSelected,
  onToggle,
  style,
}: Props) {
  return (
    <div style={style}>
      <button
        onClick={() => onToggle(emoji.filename)}
        className={`w-full h-full flex flex-col items-center justify-center p-1 rounded-lg transition-all cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
          isSelected
            ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950"
            : ""
        }`}
        title={emoji.name}
      >
        <img
          src={`/api/image/${encodeURIComponent(emoji.filename)}`}
          alt={emoji.name}
          loading="lazy"
          className="w-12 h-12 object-contain"
        />
        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate w-full text-center mt-0.5 leading-tight">
          {emoji.name.length > 16
            ? emoji.name.slice(0, 15) + "\u2026"
            : emoji.name}
        </span>
      </button>
    </div>
  );
});
