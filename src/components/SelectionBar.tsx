"use client";

interface Props {
  count: number;
  onClear: () => void;
  onUpload: () => void;
  onSelectAllVisible: () => void;
  onDeselectAllVisible: () => void;
  visibleCount: number;
}

export function SelectionBar({
  count,
  onClear,
  onUpload,
  onSelectAllVisible,
  onDeselectAllVisible,
  visibleCount,
}: Props) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700 shadow-lg z-50">
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {count.toLocaleString()} selected
          </span>
          <button
            onClick={onSelectAllVisible}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Select all visible ({visibleCount.toLocaleString()})
          </button>
          <button
            onClick={onDeselectAllVisible}
            className="text-xs text-zinc-500 hover:underline"
          >
            Deselect visible
          </button>
          <button
            onClick={onClear}
            className="text-xs text-zinc-500 hover:underline"
          >
            Clear all
          </button>
        </div>
        <button
          onClick={onUpload}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Upload to Slack
        </button>
      </div>
    </div>
  );
}
