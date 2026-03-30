export interface Emoji {
  filename: string;
  name: string;
  slackName: string; // pre-sanitized name for Slack matching
  ext: string;
  prefix: string;
}

export interface EmojiGroup {
  prefix: string;
  count: number;
}

export interface EmojiIndex {
  emojis: Emoji[];
  groups: EmojiGroup[];
  total: number;
}

export function sanitizeEmojiName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

export interface UploadProgress {
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
}
