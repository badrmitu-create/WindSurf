const clients = new Set<ReadableStreamDefaultController>();

export function notifyClients(message: string, level: string = "info") {
  const data = JSON.stringify({
    message,
    level,
    timestamp: new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  });

  const chunk = `data: ${data}\n\n`;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(chunk);

  clients.forEach((controller) => {
    try {
      controller.enqueue(bytes);
    } catch {
      clients.delete(controller);
    }
  });
}

export function addClient(controller: ReadableStreamDefaultController) {
  clients.add(controller);
}

export function removeClient(controller: ReadableStreamDefaultController) {
  clients.delete(controller);
}
