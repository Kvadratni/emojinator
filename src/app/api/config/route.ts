import fs from "fs";
import { getEmojiDir, setEmojiDir } from "@/lib/config";

export async function GET() {
  return Response.json({ emojiDir: getEmojiDir() });
}

export async function POST(request: Request) {
  const { emojiDir } = await request.json();

  if (!emojiDir || typeof emojiDir !== "string") {
    return Response.json({ error: "Missing emojiDir" }, { status: 400 });
  }

  if (!fs.existsSync(emojiDir) || !fs.statSync(emojiDir).isDirectory()) {
    return Response.json(
      { error: "Directory does not exist" },
      { status: 400 }
    );
  }

  setEmojiDir(emojiDir);
  return Response.json({ ok: true, emojiDir });
}
