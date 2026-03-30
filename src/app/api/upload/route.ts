import { uploadEmojis } from "@/lib/slack-uploader";

export async function POST(request: Request) {
  const { team, cookie, token, filenames } = await request.json();

  if (!team || !cookie || !token || !filenames?.length) {
    return new Response(
      JSON.stringify({ error: "Missing team, cookie, token, or filenames" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of uploadEmojis(team, cookie, token, filenames)) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        }
      } catch (e) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "done",
              succeeded: 0,
              failed: 0,
              errors: [{ name: "system", error: String(e) }],
            })}\n\n`
          )
        );
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
