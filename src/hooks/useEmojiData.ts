"use client";

import { useState, useEffect, useMemo, useCallback, useTransition } from "react";
import type { Emoji, EmojiIndex } from "@/lib/emoji-store";

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
  const [isPending, startTransition] = useTransition();

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

  const fetchExistingEmojis = useCallback(async (forceRefresh = false) => {
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

      // Check cache first
      const cacheKey = `emojinator_existing_${team}`;
      if (!forceRefresh) {
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const { emojis: cachedEmojis, timestamp } = JSON.parse(cached);
            // Use cache if less than 1 hour old
            if (Date.now() - timestamp < 3600000) {
              setExistingEmojis(new Set(cachedEmojis));
              setFetchingExisting(false);
              return;
            }
          }
        } catch {
          // ignore cache errors
        }
      }

      const res = await fetch("/api/existing-emojis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team, cookie, token }),
      });
      const data = await res.json();
      if (data.emojis) {
        setExistingEmojis(new Set(data.emojis));
        // Cache per team
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ emojis: data.emojis, timestamp: Date.now() })
        );
      }
    } catch {
      // silently fail
    }
    setFetchingExisting(false);
  }, []);

  const handleToggleHideUploaded = useCallback(
    (enabled: boolean) => {
      if (enabled && !existingEmojis) {
        fetchExistingEmojis();
      }
      // Use transition so filtering 90k items doesn't block the UI
      startTransition(() => {
        setHideUploaded(enabled);
      });
    },
    [existingEmojis, fetchExistingEmojis, startTransition]
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
      result = result.filter((e) => !existingEmojis.has(e.slackName));
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
    setActiveGroup: (group: string | null) =>
      startTransition(() => setActiveGroup(group)),
    searchQuery,
    setSearchQuery: (q: string) =>
      startTransition(() => setSearchQuery(q)),
    emojiDir,
    handleDirectoryChange,
    hideUploaded,
    handleToggleHideUploaded,
    refreshExistingEmojis: () => fetchExistingEmojis(true),
    existingEmojis,
    fetchingExisting,
    isPending,
  };
}
