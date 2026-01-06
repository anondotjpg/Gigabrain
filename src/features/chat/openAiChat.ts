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
 * Fetch current cryptocurrency prices from CoinGecko API
 * Returns top cryptocurrencies with USD prices
 */
async function getCryptoContext(): Promise<string | null> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,ripple,cardano,solana,polkadot,dogecoin&vs_currencies=usd&include_24hr_change=true",
      {
        headers: {
          "Accept": "application/json",
        },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();

    const cryptoList = [
      { id: "bitcoin", name: "Bitcoin (BTC)" },
      { id: "ethereum", name: "Ethereum (ETH)" },
      { id: "binancecoin", name: "BNB" },
      { id: "ripple", name: "XRP" },
      { id: "cardano", name: "Cardano (ADA)" },
      { id: "solana", name: "Solana (SOL)" },
      { id: "polkadot", name: "Polkadot (DOT)" },
      { id: "dogecoin", name: "Dogecoin (DOGE)" },
    ];

    const prices = cryptoList
      .map((crypto) => {
        const priceData = data[crypto.id];
        if (!priceData) return null;

        const price = priceData.usd.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        const change = priceData.usd_24h_change?.toFixed(2);
        const changeStr = change
          ? ` (${change > 0 ? "+" : ""}${change}% 24h)`
          : "";

        return `${crypto.name}: ${price}${changeStr}`;
      })
      .filter(Boolean);

    if (prices.length === 0) return null;

    return ["Current cryptocurrency prices:", ...prices].join("\n");
  } catch (err) {
    console.warn("Failed to load crypto context", err);
    return null;
  }
}

/**
 * Streaming chat completion with injected live news and crypto context
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

        const YOUR_SITE_URL = "https://igigabrain.com/";
        const YOUR_SITE_NAME = "Gigabrain";

        // 🔹 Fetch live contexts in parallel
        const [newsContext, cryptoContext] = await Promise.all([
          getNewsContext(),
          getCryptoContext(),
        ]);

        // 🔹 Build final messages with injected context
        const finalMessages: Message[] = [];

        // Preserve original system message if present
        if (messages.length && messages[0].role === "system") {
          finalMessages.push(messages[0]);
          messages = messages.slice(1);
        }

        // Inject combined context as transient system message
        const contextParts: string[] = [];
        
        if (newsContext) {
          contextParts.push(newsContext);
        }
        
        if (cryptoContext) {
          contextParts.push(cryptoContext);
        }

        if (contextParts.length > 0) {
          finalMessages.push({
            role: "system",
            content:
              "You may use the following current information as factual context if relevant:\n\n" +
              contextParts.join("\n\n"),
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
              model: "anthropic/claude-opus-4.5",
              messages: finalMessages,
              temperature: 0.7,
              max_tokens: 200,
              stream: true,
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