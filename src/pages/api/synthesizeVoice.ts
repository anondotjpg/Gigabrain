// pages/api/synthesizeVoice.ts
import type { NextApiRequest, NextApiResponse } from "next";
import axios, { AxiosRequestConfig, ResponseType } from "axios";

// Define voice IDs for each VRM
const VOICE_IDS = {
  1: "QvlD90AkjGTCqc9685Rq", // Current voice ID for VRM 1
  2: "QvlD90AkjGTCqc9685Rq",    // Replace with actual voice ID for VRM 2
  3: "QvlD90AkjGTCqc9685Rq",    // Replace with actual voice ID for VRM 3
  4: "QvlD90AkjGTCqc9685Rq",
};

const API_KEY = process.env.ELEVENLABS_API_KEY;

if (!API_KEY) {
  throw new Error("ELEVENLABS_API_KEY is not set in environment variables");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, selectedVrm } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "A valid 'message' field is required" });
  }

  if (!selectedVrm || ![1, 2, 3, 4].includes(selectedVrm)) {
    return res.status(400).json({ error: "A valid 'selectedVrm' field (1, 2, or 3) is required" });
  }

  // Get the voice ID based on the selected VRM
  const voiceId = VOICE_IDS[selectedVrm as keyof typeof VOICE_IDS];

  try {
    const options: AxiosRequestConfig = {
      method: "POST",
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      headers: {
        accept: "audio/mpeg",
        "content-type": "application/json",
        "xi-api-key": API_KEY,
      },
      data: {
        text: message,
      },
      responseType: "arraybuffer" as ResponseType,
    };

    const response = await axios.request(options);
    const audioData = response.data;

    // Convert binary audio data to Base64
    const base64Audio = Buffer.from(audioData).toString("base64");

    res.status(200).json({ audio: base64Audio });
  } catch (error) {
    console.error("Error synthesizing voice:", error);

    const errorMessage =
      axios.isAxiosError(error) && error.response
        ? `API Error: ${error.response.status} - ${error.response.data}`
        : "An unexpected error occurred";

    res.status(500).json({ error: errorMessage });
  }
}