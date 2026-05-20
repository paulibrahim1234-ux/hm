import OpenAI from "openai";
import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const LLM_MODEL = process.env.LLM_MODEL || "gpt-4o-mini";

const GENERATED_DIR = path.join(process.cwd(), "public", "generated");

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || "";
const MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL || "https://api.minimaxi.com/v1";

export const llmClient = new OpenAI({ apiKey: OPENAI_API_KEY });

export const minimaxClient = new OpenAI({
  baseURL: MINIMAX_BASE_URL,
  apiKey: MINIMAX_API_KEY,
});

export async function chatWithCharacter(
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[]
) {
  const response = await llmClient.chat.completions.create({
    model: LLM_MODEL,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    max_tokens: 4096,
    temperature: 0.85,
  });

  const raw = response.choices[0]?.message?.content || "";
  return raw.trim();
}

const IMAGE_MODEL = process.env.IMAGE_MODEL || "gpt-image-1";
const TTS_MODEL = process.env.TTS_MODEL || "gpt-4o-mini-tts";

export async function generateImage(
  prompt: string,
  _referenceImageUrl?: string
): Promise<string | null> {
  if (!OPENAI_API_KEY) return null;
  try {
    const response = await llmClient.images.generate({
      model: IMAGE_MODEL,
      prompt,
      size: "1024x1024",
      n: 1,
    });
    const b64 = response.data?.[0]?.b64_json;
    if (b64) {
      await fs.mkdir(GENERATED_DIR, { recursive: true });
      const filename = `${nanoid()}.png`;
      const filePath = path.join(GENERATED_DIR, filename);
      await fs.writeFile(filePath, Buffer.from(b64, "base64"));
      return `/generated/${filename}`;
    }
    const url = response.data?.[0]?.url;
    return url ?? null;
  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
}

// Map a few MiniMax-style voice IDs onto OpenAI voices; fall back to "alloy".
const OPENAI_VOICE_MAP: Record<string, string> = {
  "female-shaonv": "nova",
  "female-tianmei": "shimmer",
  "female-yujie": "sage",
  "male-qn-qingse": "ash",
  "male-qn-jingying": "onyx",
};

export async function generateTTS(
  text: string,
  voiceId: string = "female-shaonv"
): Promise<string | null> {
  if (!OPENAI_API_KEY) return null;
  try {
    const voice = OPENAI_VOICE_MAP[voiceId] || "alloy";
    const response = await llmClient.audio.speech.create({
      model: TTS_MODEL,
      voice,
      input: text,
      response_format: "mp3",
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.mkdir(GENERATED_DIR, { recursive: true });
    const filename = `${nanoid()}.mp3`;
    await fs.writeFile(path.join(GENERATED_DIR, filename), buffer);
    return `/generated/${filename}`;
  } catch (error) {
    console.error("TTS generation failed:", error);
    return null;
  }
}
