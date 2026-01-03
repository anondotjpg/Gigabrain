import { Message } from "../messages/messages";

/**
 * Fetch BBC World News RSS and convert to compact LLM context
 * Server-safe via Next.js API route
 */
async function getNewsContext(): Promise<string | null> {
  try {
    const res = await fetch("/api/bbc-news");
    if (!res.ok) return null;

    const xmlText = await res.text();

    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, "text/xml");

    const items = Array.from(xml.querySelectorAll("item")).slice(0, 5);

    if (items.length === 0) return null;

    const headlines = items.map((item, i) => {
      const title = item.querySelector("title")?.textContent?.trim();
      return title ? `${i + 1}. ${title}` : null;
    }).filter(Boolean);

    return [
      "Current world news headlines (BBC):",
      ...headlines,
    ].join("\n");
  } catch (err) {
    console.warn("Failed to load news context", err);
    return null;
  }
}

/**
 * Streaming chat completion with injected live news context
 */
export async function getChatResponseStream(
  messages: Message[],
  apiKey: string,
  openRouterKey: string
) {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const OPENROUTER_API_KEY =
          openRouterKey || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

        if (!OPENROUTER_API_KEY) {
          throw new Error("Missing OpenRouter API key");
        }

        const YOUR_SITE_URL = "https://www.donthedog.com/";
        const YOUR_SITE_NAME = "Don the Dog";

        // 🔹 Fetch live news context
        const newsContext = await getNewsContext();

        // 🔹 Build final messages with injected context
        const finalMessages: Message[] = [];

        // Preserve original system message if present
        if (messages.length && messages[0].role === "system") {
          finalMessages.push(messages[0]);
          messages = messages.slice(1);
        }

        // Inject news context as transient system message
        if (newsContext) {
          finalMessages.push({
            role: "system",
            content:
              "You may use the following current world news as factual context if relevant:\n\n" +
              newsContext,
          });
        }

        // Append remaining conversation
        finalMessages.push(...messages);

        const generation = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
              "HTTP-Referer": YOUR_SITE_URL,
              "X-Title": YOUR_SITE_NAME,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "x-ai/grok-4-fast",
              messages: finalMessages,
              temperature: 0.7,
              max_tokens: 200,
              stream: false,
            }),
          }
        );

        if (!generation.body) {
          throw new Error("No response body from OpenRouter");
        }

        const reader = generation.body.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk
              .split("\n")
              .filter(
                (line) =>
                  line.startsWith("data:") &&
                  !line.includes("[DONE]") &&
                  !line.includes(": OPENROUTER PROCESSING")
              );

            for (const line of lines) {
              try {
                const json = JSON.parse(line.replace("data: ", ""));
                const content = json?.choices?.[0]?.delta?.content;
                if (content) controller.enqueue(content);
              } catch (err) {
                console.error("Stream parse error", err);
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return stream;
}
