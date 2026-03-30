import path from "path";

let emojiDir: string = path.join(process.cwd(), "images");
let lastSetDir: string = emojiDir;

export function getEmojiDir(): string {
  return emojiDir;
}

export function setEmojiDir(dir: string): void {
  emojiDir = dir;
  lastSetDir = dir;
}

export function hasEmojiDirChanged(dir: string): boolean {
  return dir !== lastSetDir;
}
