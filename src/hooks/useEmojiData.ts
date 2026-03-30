"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { Emoji, EmojiIndex } from "@/lib/emoji-store";

function sanitizeEmojiName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

export function useEmojiData() {
  const [data, setData] = useState<EmojiIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [emojiDir, setEmojiDir] = useState("");
  const [hideUploaded, setHideUploaded] = useState(false);
  const [existingEmojis, setExistingEmojis] = useState<Set<string> | null>(
    null
  );
  const [fetchingExisting, setFetchingExisting] = useState(false);

  const fetchEmojis = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/emojis")
      .then((r) => r.json())
      .then((d: EmojiIndex) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  // On mount: set saved directory then fetch emojis
  useEffect(() => {
    const savedDir = localStorage.getItem("emojinator_emoji_dir") || "";
    if (savedDir) {
      setEmojiDir(savedDir);
      fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emojiDir: savedDir }),
      })
        .then(() => fetchEmojis())
        .catch(() => fetchEmojis());
    } else {
      fetchEmojis();
    }
  }, [fetchEmojis]);

  const handleDirectoryChange = useCallback(
    (dir: string) => {
      setEmojiDir(dir);
      setActiveGroup(null);
      setSearchQuery("");
      setExistingEmojis(null);
      fetchEmojis();
    },
    [fetchEmojis]
  );

  const fetchExistingEmojis = useCallback(async () => {
    setFetchingExisting(true);
    try {
      const profile = localStorage.getItem("emojinator_profile");
      if (!profile) {
        setFetchingExisting(false);
        return;
      }
      const { team, cookie, token } = JSON.parse(profile);
      if (!team || !cookie || !token) {
        setFetchingExisting(false);
        return;
      }

      const res = await fetch("/api/existing-emojis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team, cookie, token }),
      });
      const data = await res.json();
      if (data.emojis) {
        setExistingEmojis(new Set(data.emojis));
      }
    } catch {
      // silently fail
    }
    setFetchingExisting(false);
  }, []);

  const handleToggleHideUploaded = useCallback(
    (enabled: boolean) => {
      setHideUploaded(enabled);
      if (enabled && !existingEmojis) {
        fetchExistingEmojis();
      }
    },
    [existingEmojis, fetchExistingEmojis]
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    let result: Emoji[] = data.emojis;

    if (activeGroup) {
      result = result.filter((e) => e.prefix === activeGroup);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) => e.name.toLowerCase().includes(q));
    }

    if (hideUploaded && existingEmojis) {
      result = result.filter(
        (e) => !existingEmojis.has(sanitizeEmojiName(e.name))
      );
    }

    return result;
  }, [data, activeGroup, searchQuery, hideUploaded, existingEmojis]);

  return {
    emojis: filtered,
    groups: data?.groups || [],
    total: data?.total || 0,
    loading,
    error,
    activeGroup,
    setActiveGroup,
    searchQuery,
    setSearchQuery,
    emojiDir,
    handleDirectoryChange,
    hideUploaded,
    handleToggleHideUploaded,
    existingEmojis,
    fetchingExisting,
  };
}
