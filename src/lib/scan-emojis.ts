import fs from "fs";
import path from "path";
import { detectPrefixes } from "./prefix-detector";
import { getEmojiDir } from "./config";
import { sanitizeEmojiName } from "./emoji-store";
import type { Emoji, EmojiGroup, EmojiIndex } from "./emoji-store";

const VALID_EXTENSIONS = new Set([".png", ".gif", ".jpg", ".jpeg", ".webp"]);

let cachedIndex: EmojiIndex | null = null;
let cachedDir: string | null = null;

export function scanEmojis(): EmojiIndex {
  const imagesDir = getEmojiDir();

  // Invalidate cache if directory changed
  if (cachedIndex && cachedDir === imagesDir) return cachedIndex;
  cachedDir = imagesDir;
  cachedIndex = null;

  if (!fs.existsSync(imagesDir)) {
    return { emojis: [], groups: [], total: 0 };
  }
  const files = fs.readdirSync(imagesDir);

  const emojis: Emoji[] = [];
  const filenames: string[] = [];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!VALID_EXTENSIONS.has(ext)) continue;

    const name = file.slice(0, -ext.length);
    filenames.push(name);
    emojis.push({ filename: file, name, slackName: sanitizeEmojiName(name), ext, prefix: "" });
  }

  const prefixMap = detectPrefixes(filenames);

  // Assign prefix to each emoji
  const nameToPrefix = new Map<string, string>();
  for (const [prefix, names] of prefixMap) {
    for (const n of names) {
      nameToPrefix.set(n, prefix);
    }
  }
  for (const emoji of emojis) {
    emoji.prefix = nameToPrefix.get(emoji.name) || "other";
  }

  // Build sorted groups
  const groups: EmojiGroup[] = [];
  for (const [prefix, names] of prefixMap) {
    if (prefix === "other") continue;
    groups.push({ prefix, count: names.length });
  }
  groups.sort((a, b) => b.count - a.count);

  const otherCount = prefixMap.get("other")?.length || 0;
  if (otherCount > 0) {
    groups.push({ prefix: "other", count: otherCount });
  }

  cachedIndex = { emojis, groups, total: emojis.length };
  return cachedIndex;
}
