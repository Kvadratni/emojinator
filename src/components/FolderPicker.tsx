"use client";

import { useState, useCallback, useRef, useEffect } from "react";

const STORAGE_KEY = "emojinator_emoji_dir";

interface Props {
  onDirectoryChange: (dir: string) => void;
  currentDir: string;
}

interface BrowseData {
  current: string;
  parent: string;
  dirs: string[];
  imageCount: number;
}

export function FolderPicker({ onDirectoryChange, currentDir }: Props) {
  const [value, setValue] = useState(currentDir);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const [browseData, setBrowseData] = useState<BrowseData | null>(null);
  const [browseLoading, setBrowseLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(currentDir);
  }, [currentDir]);

  const applyDir = useCallback(
    async (dir: string) => {
      if (!dir.trim()) return;
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emojiDir: dir.trim() }),
        });
        const data = await res.json();
        if (data.ok) {
          localStorage.setItem(STORAGE_KEY, dir.trim());
          onDirectoryChange(dir.trim());
        } else {
          setError(data.error || "Invalid directory");
        }
      } catch {
        setError("Failed to set directory");
      }
      setLoading(false);
    },
    [onDirectoryChange]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setValue(v);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => applyDir(v), 500);
    },
    [applyDir]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        if (timerRef.current) clearTimeout(timerRef.current);
        applyDir(value);
      }
    },
    [applyDir, value]
  );

  const browseTo = useCallback(async (dir: string) => {
    setBrowseLoading(true);
    try {
      const res = await fetch(`/api/browse?dir=${encodeURIComponent(dir)}`);
      const data = await res.json();
      if (data.error) {
        // stay on current
      } else {
        setBrowseData(data);
      }
    } catch {
      // ignore
    }
    setBrowseLoading(false);
  }, []);

  const openBrowse = useCallback(() => {
    setShowBrowse(true);
    browseTo(value || "");
  }, [value, browseTo]);

  const selectDir = useCallback(
    (dir: string) => {
      setValue(dir);
      setShowBrowse(false);
      applyDir(dir);
    },
    [applyDir]
  );

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={openBrowse}
          className="p-1 rounded hover:bg-zinc-700 transition-colors"
          title="Browse for emoji folder"
        >
          <svg
            className="w-4 h-4 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        </button>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="/path/to/emojis"
          className={`w-48 px-2 py-1 rounded border text-xs font-mono bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-zinc-100 ${
            error
              ? "border-red-500"
              : "border-zinc-200 dark:border-zinc-700"
          }`}
        />
        {loading && (
          <span className="text-xs text-zinc-400 animate-pulse">...</span>
        )}
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>

      {showBrowse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md max-h-[70vh] flex flex-col">
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
              <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">
                Select Emoji Folder
              </h3>
              <button
                onClick={() => setShowBrowse(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {browseData && (
              <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400 truncate flex-1">
                  {browseData.current}
                </span>
                {browseData.imageCount > 0 && (
                  <span className="text-xs text-green-400 whitespace-nowrap">
                    {browseData.imageCount} images
                  </span>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-2">
              {browseLoading ? (
                <div className="flex items-center justify-center py-8 text-zinc-400 text-sm">
                  Loading...
                </div>
              ) : browseData ? (
                <div className="space-y-0.5">
                  {browseData.current !== browseData.parent && (
                    <button
                      onClick={() => browseTo(browseData.parent)}
                      className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      ..
                    </button>
                  )}
                  {browseData.dirs.map((d) => (
                    <button
                      key={d}
                      onClick={() =>
                        browseTo(`${browseData.current}/${d}`)
                      }
                      className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4 text-zinc-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                        />
                      </svg>
                      {d}
                    </button>
                  ))}
                  {browseData.dirs.length === 0 && (
                    <div className="text-xs text-zinc-500 text-center py-4">
                      No subdirectories
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {browseData && (
              <div className="p-3 border-t border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => selectDir(browseData.current)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Select This Folder
                  {browseData.imageCount > 0 &&
                    ` (${browseData.imageCount} images)`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function getSavedEmojiDir(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY) || "";
}
