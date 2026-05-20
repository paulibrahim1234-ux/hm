import OpenAI from "openai";
import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const LLM_API_KEY = process.env.LLM_API_KEY || process.env.OPENROUTER_API_KEY || OPENAI_API_KEY;
const LLM_BASE_URL = process.env.LLM_BASE_URL || process.env.OPENROUTER_BASE_URL || process.env.OPENAI_BASE_URL;
const OPENROUTER_ROLEPLAY_MODEL = process.env.OPENROUTER_MODEL || "sao10k/l3.3-euryale-70b";

function resolveChatModel() {
  const requestedModel = process.env.LLM_MODEL?.trim();
  const usesOpenRouter = Boolean(process.env.OPENROUTER_API_KEY) || LLM_BASE_URL?.includes("openrouter.ai");

  if (usesOpenRouter) {
    // OpenClaw shells can export LLM_MODEL=gpt-4o-mini globally. That should
    // not override this app's OpenRouter roleplay model from .env.
    if (!requestedModel || requestedModel === "gpt-4o-mini") return OPENROUTER_ROLEPLAY_MODEL;
  }

  return requestedModel || (usesOpenRouter ? OPENROUTER_ROLEPLAY_MODEL : "gpt-4o-mini");
}

export const CHAT_MODEL = resolveChatModel();

const GENERATED_DIR = path.join(process.cwd(), "public", "generated");

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || "";
const MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL || "https://api.minimaxi.com/v1";

function asciiHeaderValue(value: string, fallback: string) {
  const normalized = value.replace(/[^\x20-\x7E]/g, "").trim();
  return normalized || fallback;
}

export const llmClient = new OpenAI({
  apiKey: LLM_API_KEY,
  ...(LLM_BASE_URL ? { baseURL: LLM_BASE_URL } : {}),
  defaultHeaders: LLM_BASE_URL?.includes("openrouter.ai")
    ? {
        "HTTP-Referer": process.env.AUTH_CANONICAL_URL || "http://localhost:3000",
        "X-Title": asciiHeaderValue(process.env.NEXT_PUBLIC_APP_NAME || "", "AI Companion"),
      }
    : undefined,
});

export const minimaxClient = new OpenAI({
  baseURL: MINIMAX_BASE_URL,
  apiKey: MINIMAX_API_KEY,
});

export async function chatWithCharacter(
  systemPrompt: string,
  messages: { role: "system" | "user" | "assistant"; content: string }[]
) {
  const response = await llmClient.chat.completions.create({
    model: CHAT_MODEL,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    max_tokens: 4096,
    temperature: 0.85,
  });

  const raw = response.choices[0]?.message?.content || "";
  return raw.trim();
}

const IMAGE_MODEL = process.env.IMAGE_MODEL || "gpt-image-1";
const TTS_MODEL = process.env.TTS_MODEL || "gpt-4o-mini-tts";
const IMAGE_PROVIDER = process.env.IMAGE_PROVIDER || "auto";
const FAL_KEY = process.env.FAL_KEY || "";
const FAL_IMAGE_MODEL = process.env.FAL_IMAGE_MODEL || process.env.IMAGE_MODEL || "fal-ai/nano-banana-2";
const FAL_IMAGE_ASPECT_RATIO = process.env.FAL_IMAGE_ASPECT_RATIO || "9:16";
const FAL_IMAGE_RESOLUTION = process.env.FAL_IMAGE_RESOLUTION || "1K";
const FAL_IMAGE_SAFETY_TOLERANCE = process.env.FAL_IMAGE_SAFETY_TOLERANCE || "6";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isCertificateWarmupError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const cause = error.cause as { code?: string } | undefined;
  return cause?.code === "CERT_NOT_YET_VALID";
}

async function fetchWithCertificateWarmupRetry(input: string, init: RequestInit) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await fetch(input, init);
    } catch (error) {
      lastError = error;
      if (!isCertificateWarmupError(error) || attempt === 3) throw error;
      await sleep(1500);
    }
  }
  throw lastError;
}

async function generatePollinationsImage(prompt: string): Promise<string | null> {
  try {
    const seed = Math.floor(Math.random() * 100_000_000);
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=1024&height=1024&seed=${seed}&nologo=true`;
    return url;
  } catch (error) {
    console.error("Pollinations image generation failed:", error);
    return null;
  }
}

async function generateFalImage(prompt: string, referenceImageUrl?: string): Promise<string | null> {
  if (!FAL_KEY) return null;

  const isEdit = Boolean(referenceImageUrl);
  const model = isEdit ? `${FAL_IMAGE_MODEL.replace(/\/edit$/, "")}/edit` : FAL_IMAGE_MODEL;

  try {
    const response = await fetchWithCertificateWarmupRetry(`https://fal.run/${model}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${FAL_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        num_images: 1,
        aspect_ratio: FAL_IMAGE_ASPECT_RATIO,
        output_format: "png",
        safety_tolerance: FAL_IMAGE_SAFETY_TOLERANCE,
        sync_mode: false,
        resolution: FAL_IMAGE_RESOLUTION,
        limit_generations: true,
        enable_web_search: false,
        ...(referenceImageUrl ? { image_urls: [referenceImageUrl] } : {}),
      }),
    });

    if (!response.ok) {
      console.error("fal image generation failed:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    return findUrl(data);
  } catch (error) {
    console.error("fal image generation failed:", error);
    return null;
  }
}

export async function generateImage(
  prompt: string,
  referenceImageUrl?: string
): Promise<string | null> {
  if (IMAGE_PROVIDER === "fal") return generateFalImage(prompt, referenceImageUrl);
  if (IMAGE_PROVIDER === "pollinations") return generatePollinationsImage(prompt);

  try {
    if (OPENAI_API_KEY) {
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
      if (url) return url;
    }
  } catch (error) {
    console.error("Image generation failed:", error);
  }

  if (IMAGE_PROVIDER === "auto") {
    const falUrl = await generateFalImage(prompt, referenceImageUrl);
    return falUrl ?? generatePollinationsImage(prompt);
  }

  return null;
}

const VIDEO_GENERATION_ENDPOINT = process.env.VIDEO_GENERATION_ENDPOINT || "";
const VIDEO_GENERATION_API_KEY = process.env.VIDEO_GENERATION_API_KEY || "";
const VIDEO_GENERATION_MODEL = process.env.VIDEO_GENERATION_MODEL || "";

function findUrl(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    return /^https?:\/\//.test(value) ? value : null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const url = findUrl(item);
      if (url) return url;
    }
    return null;
  }
  if (typeof value === "object") {
    const data = value as Record<string, unknown>;
    for (const key of ["videoUrl", "video_url", "url", "assetUrl", "asset_url", "imageUrl", "image_url", "images", "output", "data", "result"]) {
      const url = findUrl(data[key]);
      if (url) return url;
    }
  }
  return null;
}

export async function generateVideo(prompt: string): Promise<string | null> {
  if (!VIDEO_GENERATION_ENDPOINT) return null;
  try {
    const response = await fetch(VIDEO_GENERATION_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(VIDEO_GENERATION_API_KEY ? { Authorization: `Bearer ${VIDEO_GENERATION_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        prompt,
        model: VIDEO_GENERATION_MODEL || undefined,
        durationSeconds: 5,
        aspectRatio: "9:16",
      }),
    });

    if (!response.ok) {
      console.error("Video generation failed:", response.status, await response.text());
      return null;
    }

    return findUrl(await response.json());
  } catch (error) {
    console.error("Video generation failed:", error);
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
