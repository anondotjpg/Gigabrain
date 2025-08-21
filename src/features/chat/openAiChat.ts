export async function getChatResponseStream(
  messages: Message[],
  apiKey: string,
  openRouterKey: string
) {
  const stream = new ReadableStream({
    async start(controller: ReadableStreamDefaultController) {
      try {
        // Use the openRouterKey parameter instead of process.env
        const OPENROUTER_API_KEY = openRouterKey;
        const YOUR_SITE_URL = 'https://www.waifu-gamma.vercel.app/';
        const YOUR_SITE_NAME = 'ChatVRM';

        // Validate the API key
        if (!OPENROUTER_API_KEY) {
          throw new Error("OpenRouter API key is required");
        }

        let isStreamed = false;
        const generation = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": `${YOUR_SITE_URL}`,
            "X-Title": `${YOUR_SITE_NAME}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            "model": "x-ai/grok-4",
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 200,
            "stream": true,
          })
        });

        // Check if the response is ok
        if (!generation.ok) {
          const errorText = await generation.text();
          throw new Error(`API request failed: ${generation.status} - ${errorText}`);
        }

        if (generation.body) {
          const reader = generation.body.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              let chunk = new TextDecoder().decode(value);
              let lines = chunk.split('\n');

              const SSE_COMMENT = ": OPENROUTER PROCESSING";

              lines = lines.filter((line) => !line.trim().startsWith(SSE_COMMENT));
              lines = lines.filter((line) => !line.trim().endsWith("data: [DONE]"));

              const dataLines = lines.filter(line => line.startsWith("data:"));

              const parsedMessages = dataLines.map(line => {
                const jsonStr = line.substring(5);
                try {
                  return JSON.parse(jsonStr);
                } catch (parseError) {
                  console.error('Error parsing JSON:', jsonStr, parseError);
                  return null;
                }
              }).filter(Boolean); // Remove null entries

              try {
                parsedMessages.forEach((message) => {
                  const content = message.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(content);
                  }
                });
              } catch (error) {
                console.error('Error processing stream messages:', error);
                throw error;
              }

              isStreamed = true;
            }
          } catch (error) {
            console.error('Error reading the stream', error);
            throw error;
          } finally {
            reader.releaseLock();
          }
        }

        if (!isStreamed) {
          console.error('Streaming not supported! Need to handle this case.');
        }
      } catch (error) {
        console.error('Stream error:', error);
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });

  return stream;
}