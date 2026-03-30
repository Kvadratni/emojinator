import fs from "fs";
import path from "path";
import os from "os";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dir = searchParams.get("dir") || os.homedir();

  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    return Response.json({ error: "Not a valid directory" }, { status: 400 });
  }

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const dirs: string[] = [];
    let imageCount = 0;

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      if (entry.isDirectory()) {
        dirs.push(entry.name);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if ([".png", ".gif", ".jpg", ".jpeg", ".webp"].includes(ext)) {
          imageCount++;
        }
      }
    }

    dirs.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    return Response.json({
      current: dir,
      parent: path.dirname(dir),
      dirs,
      imageCount,
    });
  } catch {
    return Response.json({ error: "Cannot read directory" }, { status: 400 });
  }
}
