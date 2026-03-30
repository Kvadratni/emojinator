import fs from "fs";
import path from "path";
import { getEmojiDir } from "./config";
import { sanitizeEmojiName } from "./emoji-store";

const INITIAL_THROTTLE_MS = 500;
const MAX_RETRIES = 10;

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36";

function getMimeType(ext: string): string {
  switch (ext.toLowerCase()) {
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchExistingEmojis(
  team: string,
  cookie: string,
  token: string
): Promise<Set<string>> {
  const existing = new Set<string>();
  const origin = `https://${team}.slack.com`;
  let page = 1;

  while (true) {
    const formData = new URLSearchParams();
    formData.append("token", token);
    formData.append("query", "");
    formData.append("page", String(page));
    formData.append("count", "1000");

    const res = await fetch(
      `https://${team}.slack.com/api/emoji.adminList`,
      {
        method: "POST",
        headers: {
          Cookie: cookie,
          "User-Agent": BROWSER_UA,
          Origin: origin,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

    if (!res.ok) break;

    const data = await res.json();
    if (!data.ok) break;

    if (data.emoji) {
      for (const e of data.emoji) {
        existing.add(e.name);
      }
    }

    if (!data.paging || page >= data.paging.pages) break;
    page++;
  }

  return existing;
}

export async function* uploadEmojis(
  team: string,
  cookie: string,
  token: string,
  filenames: string[]
): AsyncGenerator<{
  type: "progress" | "done";
  completed?: number;
  total?: number;
  current?: string;
  success?: boolean;
  error?: string;
  skipped?: boolean;
  succeeded?: number;
  failed?: number;
  skippedCount?: number;
  errors?: { name: string; error: string }[];
}> {
  const imagesDir = getEmojiDir();
  const apiUrl = `https://${team}.slack.com/api/emoji.add`;
  const origin = `https://${team}.slack.com`;
  const total = filenames.length;
  let succeeded = 0;
  let failed = 0;
  let skippedCount = 0;
  const errors: { name: string; error: string }[] = [];
  let throttleMs = INITIAL_THROTTLE_MS;

  // Step 1: fetch existing emojis to skip duplicates
  yield {
    type: "progress",
    completed: 0,
    total,
    current: "Fetching existing emoji list...",
    success: true,
  };

  let existing = new Set<string>();
  try {
    existing = await fetchExistingEmojis(team, cookie, token);
  } catch {
    // If we can't fetch the list, continue without it
  }

  if (existing.size > 0) {
    yield {
      type: "progress",
      completed: 0,
      total,
      current: `Found ${existing.size} existing emojis, will skip duplicates`,
      success: true,
    };
  }

  for (let i = 0; i < filenames.length; i++) {
    const filename = filenames[i];
    const ext = path.extname(filename);
    const rawName = filename.slice(0, -ext.length);
    const emojiName = sanitizeEmojiName(rawName);

    if (!emojiName) {
      failed++;
      errors.push({ name: filename, error: "invalid_name" });
      yield {
        type: "progress",
        completed: i + 1,
        total,
        current: filename,
        success: false,
        error: "invalid_name",
      };
      continue;
    }

    // Skip if emoji already exists
    if (existing.has(emojiName)) {
      skippedCount++;
      yield {
        type: "progress",
        completed: i + 1,
        total,
        current: filename,
        success: true,
        skipped: true,
      };
      continue;
    }

    const filePath = path.join(imagesDir, filename);
    if (!fs.existsSync(filePath)) {
      failed++;
      errors.push({ name: filename, error: "file_not_found" });
      yield {
        type: "progress",
        completed: i + 1,
        total,
        current: filename,
        success: false,
        error: "file_not_found",
      };
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: getMimeType(ext) });

    let retries = 0;
    let success = false;
    let errorMsg = "";

    while (retries < MAX_RETRIES) {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("name", emojiName);
      formData.append("mode", "data");
      formData.append("image", blob, filename);

      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: {
            Cookie: cookie,
            "User-Agent": BROWSER_UA,
            Origin: origin,
          },
          body: formData,
        });

        if (res.status === 429) {
          const retryAfter = parseInt(res.headers.get("Retry-After") || "30");
          // Back off: wait the requested time, then slow down future requests
          throttleMs = Math.min(throttleMs * 2, 10000);
          yield {
            type: "progress",
            completed: i + 1,
            total,
            current: `Rate limited, waiting ${retryAfter}s (attempt ${retries + 1}/${MAX_RETRIES})...`,
            success: true,
          };
          await sleep(retryAfter * 1000);
          retries++;
          continue;
        }

        const data = await res.json();
        if (data.ok) {
          success = true;
          // Gradually speed back up after success
          throttleMs = Math.max(throttleMs * 0.9, INITIAL_THROTTLE_MS);
        } else if (data.error === "error_name_taken") {
          // Already exists — treat as skip
          success = true;
          skippedCount++;
          existing.add(emojiName);
          yield {
            type: "progress",
            completed: i + 1,
            total,
            current: filename,
            success: true,
            skipped: true,
          };
          break;
        } else if (data.error === "ratelimited") {
          // API-level rate limit (different from HTTP 429)
          throttleMs = Math.min(throttleMs * 2, 10000);
          yield {
            type: "progress",
            completed: i + 1,
            total,
            current: `Rate limited, waiting ${Math.round(throttleMs / 1000)}s (attempt ${retries + 1}/${MAX_RETRIES})...`,
            success: true,
          };
          await sleep(throttleMs);
          retries++;
          continue;
        } else {
          errorMsg = data.error || "unknown_error";
        }
        break;
      } catch (e) {
        errorMsg = e instanceof Error ? e.message : "network_error";
        retries++;
        if (retries < MAX_RETRIES) await sleep(2000);
      }
    }

    if (retries >= MAX_RETRIES && !success) {
      errorMsg = errorMsg || "max_retries_exceeded";
    }

    if (success) {
      // Don't double-count skipped ones
      if (!existing.has(emojiName)) {
        succeeded++;
        existing.add(emojiName);
      }
      yield {
        type: "progress",
        completed: i + 1,
        total,
        current: filename,
        success: true,
      };
    } else if (errorMsg) {
      failed++;
      errors.push({ name: filename, error: errorMsg });
      yield {
        type: "progress",
        completed: i + 1,
        total,
        current: filename,
        success: false,
        error: errorMsg,
      };
    }

    await sleep(throttleMs);
  }

  yield { type: "done", succeeded, failed, skippedCount, errors };
}
