import { uploadEmojis } from "@/lib/slack-uploader";

export async function POST(request: Request) {
  const { team, cookie, token } = await request.json();

  if (!team || !cookie || !token) {
    return Response.json(
      { error: "Missing team, cookie, or token" },
      { status: 400 }
    );
  }

  // Test with a dummy filename to verify auth works
  try {
    const testFile = "__test_nonexistent__.png";
    for await (const event of uploadEmojis(team, cookie, token, [testFile])) {
      if (event.type === "progress" && event.error === "file_not_found") {
        // Auth worked — we got past Slack's auth to the point where
        // the only error is our test file not existing locally
        return Response.json({ success: true, message: "Auth verified" });
      }
      if (event.type === "done" && event.errors?.length) {
        const err = event.errors[0];
        if (err.error === "file_not_found") {
          return Response.json({ success: true, message: "Auth verified" });
        }
        return Response.json({ success: false, error: err.error });
      }
    }
    return Response.json({ success: false, error: "unexpected" });
  } catch (e) {
    return Response.json({
      success: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
