import { addClient, removeClient } from "@/lib/sse";

export function GET() {
  const stream = new ReadableStream({
    start(controller) {
      addClient(controller);
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            message: "Connected to automation log stream",
            level: "system",
            timestamp: new Date().toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            id: `init-${Date.now()}`,
          })}\n\n`
        )
      );
    },
    cancel(controller) {
      removeClient(controller);
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
