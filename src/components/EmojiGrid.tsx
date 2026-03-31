"use client";

import React, { useState, useMemo, useCallback, CSSProperties } from "react";
import { Grid, type CellComponentProps } from "react-window";
import { EmojiCard } from "./EmojiCard";
import type { Emoji } from "@/lib/emoji-store";

const CELL_WIDTH = 96;
const CELL_HEIGHT = 88;

interface Props {
  emojis: Emoji[];
  isSelected: (filename: string) => boolean;
  onToggle: (filename: string) => void;
  selectionVersion: number;
}

interface CellExtra {
  emojis: Emoji[];
  columnCount: number;
  isSelected: (filename: string) => boolean;
  onToggle: (filename: string) => void;
  _v: number; // selection version — forces cell re-render
}

function CellComponent(props: CellComponentProps<CellExtra>) {
  const { columnIndex, rowIndex, style, emojis, columnCount, isSelected, onToggle } =
    props;
  const idx = rowIndex * columnCount + columnIndex;
  if (idx >= emojis.length) return null;
  const emoji = emojis[idx];
  return (
    <EmojiCard
      emoji={emoji}
      isSelected={isSelected(emoji.filename)}
      onToggle={onToggle}
      style={style as CSSProperties}
    />
  );
}

export function EmojiGrid({ emojis, isSelected, onToggle, selectionVersion }: Props) {
  const [width, setWidth] = useState(800);

  const handleResize = useCallback(
    (size: { width: number; height: number }) => {
      setWidth(size.width);
    },
    []
  );

  const columnCount = Math.max(1, Math.floor(width / CELL_WIDTH));
  const rowCount = Math.ceil(emojis.length / columnCount);

  const cellProps = useMemo(
    () => ({ emojis, columnCount, isSelected, onToggle, _v: selectionVersion }),
    [emojis, columnCount, isSelected, onToggle, selectionVersion]
  );

  if (emojis.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
        No emojis found
      </div>
    );
  }

  return (
    <Grid<CellExtra>
      cellComponent={CellComponent}
      cellProps={cellProps}
      columnCount={columnCount}
      columnWidth={CELL_WIDTH}
      defaultHeight={600}
      defaultWidth={800}
      rowCount={rowCount}
      rowHeight={CELL_HEIGHT}
      overscanCount={5}
      onResize={handleResize}
      style={{ flex: 1, minHeight: 0 }}
    />
  );
}
