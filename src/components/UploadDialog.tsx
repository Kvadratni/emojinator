"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { UploadProgress } from "@/lib/emoji-store";

const STORAGE_KEY = "emojinator_profile";

function loadProfile(): { team: string; cookie: string; token: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { team: "", cookie: "", token: "" };
}

function saveProfile(team: string, cookie: string, token: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ team, cookie, token }));
}

function clearProfile() {
  localStorage.removeItem(STORAGE_KEY);
}

interface Props {
  filenames: string[];
  onClose: () => void;
}

export function UploadDialog({ filenames, onClose }: Props) {
  const [team, setTeam] = useState("");
  const [cookie, setCookie] = useState("");
  const [token, setToken] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    const p = loadProfile();
    if (p.team) setTeam(p.team);
    if (p.cookie) setCookie(p.cookie);
    if (p.token) setToken(p.token);
    setProfileLoaded(true);
  }, []);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress[]>([]);
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState<{
    succeeded: number;
    failed: number;
    skippedCount: number;
    errors: { name: string; error: string }[];
  } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startUpload = useCallback(async () => {
    if (!team.trim() || !cookie.trim() || !token.trim()) return;
    saveProfile(team.trim(), cookie.trim(), token.trim());
    setUploading(true);
    setProgress([]);
    setDone(false);
    setSummary(null);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team: team.trim(),
          cookie: cookie.trim(),
          token: token.trim(),
          filenames,
        }),
        signal: abortRef.current.signal,
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const event: UploadProgress = JSON.parse(line.slice(6));

          if (event.type === "done") {
            setDone(true);
            setSummary({
              succeeded: event.succeeded || 0,
              failed: event.failed || 0,
              skippedCount: event.skippedCount || 0,
              errors: event.errors || [],
            });
          } else {
            setProgress((prev) => [...prev, event]);
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setSummary({
          succeeded: 0,
          failed: filenames.length,
          skippedCount: 0,
          errors: [{ name: "system", error: String(e) }],
        });
        setDone(true);
      }
    }
    setUploading(false);
  }, [team, cookie, filenames]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setUploading(false);
  }, []);

  const handleClearProfile = useCallback(() => {
    clearProfile();
    setTeam("");
    setCookie("");
    setToken("");
  }, []);

  const lastProgress = progress[progress.length - 1];
  const pct = lastProgress
    ? Math.round(
        ((lastProgress.completed || 0) / (lastProgress.total || 1)) * 100
      )
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
          <h2 className="font-semibold text-zinc-800 dark:text-zinc-100">
            Upload {filenames.length.toLocaleString()} emojis to Slack
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <svg
              className="w-5 h-5"
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

        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {!uploading && !done && (
            <>
              {profileLoaded && team && token && cookie && (
                <div className="flex items-center justify-between bg-green-900/20 border border-green-800/30 rounded-lg px-3 py-2">
                  <span className="text-xs text-green-400">
                    Saved credentials loaded for <strong>{team}</strong>.slack.com
                  </span>
                  <button
                    onClick={handleClearProfile}
                    className="text-xs text-zinc-400 hover:text-red-400 ml-2"
                  >
                    Clear
                  </button>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Slack Team Name
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    placeholder="myworkspace"
                    className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-zinc-100"
                  />
                  <span className="text-sm text-zinc-400">.slack.com</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  API Token (xoxc-...)
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="xoxc-..."
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-zinc-100 font-mono text-xs"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Open Slack in browser → F12 → Network tab → upload any
                  emoji manually → find the{" "}
                  <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
                    emoji.add
                  </code>{" "}
                  request → check the payload for the{" "}
                  <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
                    xoxc-...
                  </code>{" "}
                  token value.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Session Cookie (d=xoxd-...)
                </label>
                <textarea
                  value={cookie}
                  onChange={(e) => setCookie(e.target.value)}
                  placeholder="Paste the full Cookie header from Network tab..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-zinc-100 font-mono text-xs"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  F12 → Network → reload → click any slack.com request →
                  copy the full{" "}
                  <strong className="text-zinc-300">Cookie</strong> request header.
                </p>
              </div>
              <button
                onClick={startUpload}
                disabled={!team.trim() || !cookie.trim() || !token.trim()}
                className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-zinc-300 disabled:dark:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Start Upload
              </button>
            </>
          )}

          {uploading && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                <span>
                  {lastProgress?.completed || 0} /{" "}
                  {lastProgress?.total || filenames.length}
                </span>
                <span>{pct}%</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {lastProgress && (
                <div className="text-xs text-zinc-500">
                  {lastProgress.skipped
                    ? "Skipped (exists)"
                    : lastProgress.success
                      ? "OK"
                      : `Error: ${lastProgress.error}`}{" "}
                  - {lastProgress.current}
                </div>
              )}
              <button
                onClick={cancel}
                className="text-xs text-red-500 hover:underline"
              >
                Cancel
              </button>
            </div>
          )}

          {done && summary && (
            <div className="space-y-3">
              <div className="flex gap-4 text-sm">
                <span className="text-green-600 font-medium">
                  {summary.succeeded} uploaded
                </span>
                {summary.skippedCount > 0 && (
                  <span className="text-zinc-400 font-medium">
                    {summary.skippedCount} skipped
                  </span>
                )}
                {summary.failed > 0 && (
                  <span className="text-red-500 font-medium">
                    {summary.failed} failed
                  </span>
                )}
              </div>
              {summary.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto text-xs space-y-1">
                  {summary.errors.map((err, i) => (
                    <div key={i} className="text-red-500">
                      {err.name}: {err.error}
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={onClose}
                className="w-full py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-sm rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
