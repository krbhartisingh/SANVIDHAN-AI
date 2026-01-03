
import { GoogleGenAI, Modality } from "@google/genai";
import { Message, UserMode } from "../types";
import { SYSTEM_INSTRUCTIONS } from "../constants";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export async function chatWithSanvidhan(
  messages: Message[],
  mode: UserMode,
  language: string,
  pdfBase64?: string | null
): Promise<string> {
  const ai = getAIClient();
  const systemInstruction = SYSTEM_INSTRUCTIONS[mode];

  const finalPrompt = `Current Language: ${language}. \n\n${systemInstruction}\n\nUser Question: ${messages[messages.length - 1].content}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: pdfBase64 
      ? { parts: [{ inlineData: { mimeType: 'application/pdf', data: pdfBase64 } }, { text: finalPrompt }] }
      : { parts: [{ text: finalPrompt }] },
    config: {
      temperature: 0.1,
      topP: 0.95,
      topK: 64,
    }
  });

  return response.text || "I apologize, I could not generate a response.";
}

export async function generateSpeech(text: string): Promise<string | undefined> {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
}

// Audio Decoding Utilities
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
