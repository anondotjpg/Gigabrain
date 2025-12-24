import axios from "axios";

// Sends a message to the server-side API to synthesize speech.
export async function synthesizeVoice(message: string, selectedVrm: number) {
  try {
    const response = await axios.post("https://pumpsan-u9wx.vercel.app/api/synthesizeVoice", { 
      message,
      selectedVrm // Pass the selected VRM to the API
    });
    // Directly return the base64 string instead of wrapping it in an 'audio' field
    return response.data.audio;
  } catch (error) {
    console.error("Error synthesizing voice:", error);
    throw error;
  }
}

// Fetches available voices from the server-side API.
export async function getVoices() {
  try {
    const response = await axios.get("https://pumpsan-u9wx.vercel.app/api/getVoices");
    return response.data;
  } catch (error) {
    console.error("Error fetching voices:", error);
    throw error;
  }
}