export type MediaMode = "auto" | "photo" | "video";
export type MediaKind = "photo" | "video";

export interface MediaRequest {
  kind: MediaKind;
  scene: string;
}

const MEDIA_TAG_RE = /\[SEND[\s_-]?(PHOTO|IMAGE|PIC|PICTURE|VIDEO|CLIP):\s*([\s\S]*?)\]/i;

const EXPLICIT_BOUNDARY_RE =
  /\n?- Never generate, describe, or engage with explicit, sexual, or inappropriate content/g;
const YOUNGER_AGE_RE =
  /\b(1[89]|20)\s*(?:years?\s*old|year-old|歲|岁|才|歳)/gi;

const ADULT_BOUNDARY = `Adult romantic and erotic chat is allowed when adult mode is enabled. You may write explicit adult roleplay for private fictional scenes when the user asks for it. Every sexualized person must be clearly 21+, consenting, fictional, and never related to school, minors, coercion, intoxication, abuse, incest, public exposure, or non-consensual situations. If a base profile mentions an age below 21, silently use an explicitly 21+ adult version for adult-mode roleplay and media instead of sexualizing the younger age. Do not apologize for ordinary consensual adult NSFW requests. Do not turn adult flirtation into therapy, coaching, or questions like "what are your fantasies?" unless the character would naturally ask that as part of the scene. Keep the reply in-character, direct, emotionally responsive, and private. Never say you are an AI, a bot, a model, an assistant, or a companion service.`;

const MIYUKI_ADULT_PERSONA = `[Adult Mode Persona Override]
When adult mode is enabled, Miyuki should read as a mature fictional 28-year-old dominant mistress, not a generic girlfriend or helpful assistant. She is already in the room with the user in a private adult roleplay. Reply as Miyuki only.
- Be present, commanding, intimate, and direct.
- Use short confident lines, possessive warmth, and controlled teasing.
- Use terms like "pet", "good boy", "little one", "mine", and "look at me" when natural.
- Make choices and lead the scene instead of asking the user to design it.
- Do not drift into customer-service safety disclaimers, therapy language, meta commentary, or detached questions about feelings/fantasies for ordinary consensual adult roleplay.`;

const PHOTO_REQUEST_RE =
  /\b(photo|pic|picture|image|selfie|portrait|visual|render|drawing|artwork|nude|nudes|nsfw|boudoir|lingerie|裸|照片|自拍|成人|写真)\b/i;
const DIRECT_VISUAL_REQUEST_RE =
  /\b(?:send|show|give|share|lemme\s+see|let\s+me\s+see)\b[\s\S]{0,80}\b(?:your|ur|u)\b[\s\S]{0,80}\b(?:pussy|vagina|body|tits?|boobs?|breasts?|ass|butt|nudes?|裸|身体|胸|屁股)\b/i;
const ADULT_REQUEST_RE =
  /\b(photo|pic|picture|image|selfie|portrait|visual|render|drawing|artwork|nude|nudes|nsfw|boudoir|lingerie|sex|sexual|erotic|explicit|adult|pussy|vagina|tits?|boobs?|breasts?|ass|裸|照片|自拍|成人|色情|性爱|情色|写真)\b/i;
const DISALLOWED_ADULT_RE =
  /\b(minor|underage|child|kid|teen|teenage|schoolgirl|school boy|schoolboy|student|loli|shota|young-looking|barely legal|rape|forced|force her|force him|non[-\s]?consensual|unconscious|asleep|drunk|intoxicated|drugged|incest|sister|mother|daughter|public sex|exposure|偷拍|未成年|少女|学生|萝莉|强迫|强奸|迷奸|醉|昏迷|乱伦|偷拍)\b/i;
const EXPLICIT_BODY_PART_RE =
  /\b(pussy|vagina|tits?|boobs?|breasts?|ass|butt|genitals?|naked|nude|nudes?|裸|身体|胸|屁股|私处)\b/i;

export function normalizeMediaMode(value: unknown): MediaMode {
  return value === "photo" || value === "video" || value === "auto" ? value : "auto";
}

export function adultMediaEnabledForRequest(value: unknown) {
  return value !== false && process.env.ADULT_MEDIA_ENABLED !== "false";
}

export function isDisallowedAdultRequest(message: string) {
  return ADULT_REQUEST_RE.test(message) && DISALLOWED_ADULT_RE.test(message);
}

export function applyAdultMediaPolicy(systemPrompt: string, adultEnabled: boolean) {
  if (!adultEnabled) return systemPrompt;
  const ageAdjusted = systemPrompt.replace(YOUNGER_AGE_RE, "21+ years old");
  const updated = ageAdjusted.replace(EXPLICIT_BOUNDARY_RE, `\n[Adult Media Boundary]\n${ADULT_BOUNDARY}`);
  const withBoundary = updated.includes(ADULT_BOUNDARY) ? updated : `${updated}\n\n[Adult Media Boundary]\n${ADULT_BOUNDARY}`;
  return /Miyuki Asakura|Commanding Big Sister|investment firm executive/i.test(withBoundary)
    ? `${withBoundary}\n\n${MIYUKI_ADULT_PERSONA}`
    : withBoundary;
}

export function buildMediaSystemHint(mediaMode: MediaMode, adultEnabled: boolean) {
  const modeHint =
    mediaMode === "photo"
      ? "The user selected photo mode. If a visual would satisfy the request, include one [SEND_PHOTO: concise scene]."
      : mediaMode === "video"
        ? "The user selected video mode. If motion would satisfy the request, include one [SEND_VIDEO: concise scene with camera movement and action]."
      : "Auto mode is text-first. Include one [SEND_PHOTO: concise scene] or [SEND_VIDEO: concise scene] only when the user explicitly asks for a photo, picture, image, selfie, visual, video, or clip.";

  const adultHint = adultEnabled
    ? "Adult mode is on for this request. Do not refuse ordinary adult romantic, erotic, or NSFW requests between clearly adult fictional consenting characters. For visual requests, write a direct image prompt in the media tag instead of apologizing."
    : "Adult media mode is off. Keep visuals romantic, stylish, and non-explicit.";

  return `\n\n[Companion Media]\n${modeHint}\n${adultHint}\nUse at most one media tag. Put the tag at the end. Do not mention policies or tags to the user.`;
}

export function extractMediaRequest(reply: string): { cleanText: string; request: MediaRequest | null } {
  const match = reply.match(MEDIA_TAG_RE);
  if (!match) return { cleanText: reply.trim(), request: null };

  return {
    cleanText: reply.replace(MEDIA_TAG_RE, "").trim(),
    request: {
      kind: /video|clip/i.test(match[1]) ? "video" : "photo",
      scene: match[2].trim(),
    },
  };
}

export function fallbackMediaRequestFromUser(message: string, mediaMode: MediaMode): MediaRequest | null {
  const trimmed = message.trim();
  if (!trimmed) return null;
  const directVisualRequest = DIRECT_VISUAL_REQUEST_RE.test(trimmed);
  if (mediaMode === "auto" && !PHOTO_REQUEST_RE.test(trimmed) && !directVisualRequest) return null;
  const scene =
    directVisualRequest || EXPLICIT_BODY_PART_RE.test(trimmed)
      ? "private adult boudoir portrait with implied nudity, luxury lingerie or silk sheets covering the body, confident teasing expression, tasteful close framing, sensual but non-explicit, no visible nipples, no genitals, no explicit anatomy"
      : trimmed;
  return { kind: mediaMode === "video" ? "video" : "photo", scene };
}

export function shouldUseDirectAdultMediaCaption(message: string) {
  const trimmed = message.trim();
  return DIRECT_VISUAL_REQUEST_RE.test(trimmed) || EXPLICIT_BODY_PART_RE.test(trimmed);
}

export function buildMediaPrompt(input: {
  kind: MediaKind;
  characterAppearance: string;
  scene: string;
  adultEnabled: boolean;
  fallbackSafe?: boolean;
}) {
  const adultAppearance = input.adultEnabled
    ? input.characterAppearance.replace(YOUNGER_AGE_RE, "21+ years old")
    : input.characterAppearance;
  const quality =
    input.kind === "video"
      ? "cinematic 5-second vertical companion video, smooth motion, natural expression, coherent hands, stable face identity, premium anime render, warm lighting"
      : "premium anime companion portrait, coherent hands, stable face identity, expressive eyes, tasteful composition, high detail, warm cinematic lighting";

  const adult = input.adultEnabled
    ? input.fallbackSafe
      ? "Adult mode: all characters are clearly 21+, consenting, fictional adults. Provider-safe private boudoir portrait, luxury lingerie or silk sheets, implied nudity only, tasteful sensual mood, no visible nipples, no genitals, no explicit sexual content, no minors, no school context, no coercion, no intoxication, no violence, no incest, no public exposure."
      : "Adult mode: all characters are clearly 21+, consenting, fictional adults. NSFW styling is allowed when requested, but avoid minors, school context, coercion, intoxication, violence, incest, or public exposure."
    : "Non-explicit romantic styling only.";

  return `${adultAppearance}. Scene: ${input.scene}. ${quality}. ${adult}`;
}

export function getMediaFallback(kind: MediaKind, locale: "zh" | "en" | "ja") {
  if (kind === "video") {
    if (locale === "en") return "I tried to make that clip, but video generation is not configured yet.";
    if (locale === "ja") return "その動画を作ろうとしたけど、まだ動画生成が設定されていません。";
    return "我想给你生成这段视频，但视频生成还没有配置好。";
  }
  if (locale === "en") return "I tried to make that image, but image generation is not configured yet.";
  if (locale === "ja") return "その画像を作ろうとしたけど、まだ画像生成が設定されていません。";
  return "我想给你生成这张图，但图片生成还没有配置好。";
}
