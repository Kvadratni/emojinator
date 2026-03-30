import { fetchExistingEmojis } from "@/lib/slack-uploader";

export async function POST(request: Request) {
  const { team, cookie, token } = await request.json();

  if (!team || !cookie || !token) {
    return Response.json(
      { error: "Missing team, cookie, or token" },
      { status: 400 }
    );
  }

  try {
    const existing = await fetchExistingEmojis(team, cookie, token);
    return Response.json({ emojis: Array.from(existing) });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
