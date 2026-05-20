import type { Locale } from "./i18n";

interface CharLocale {
  name: string;
  subtitle: string;
  description: string;
  tags: string[];
}

export const CHARACTER_LOCALES: Record<string, Record<Locale, CharLocale>> = {
  "Yuki Harune": {
    en: { name: "Yuki Harune", subtitle: "Tsundere Upperclassman", description: "3rd-year psychology student. Cool exterior, warm heart. Shows love through actions, not words. Has an orange tabby named 'Theorem'.", tags: ["Tsundere", "Psychology", "Glasses"] },
    zh: { name: "雪花春", subtitle: "傲娇学姐", description: "心理学研究生，表面高冷内心细腻。不擅长直接表达，用行动代替语言。", tags: ["高冷", "傲娇", "心理学"] },
    ja: { name: "雪花ハルネ", subtitle: "ツンデレ先輩", description: "心理学専攻3年生。クールに見えて実はとても優しい。言葉より行動で気持ちを伝えるタイプ。", tags: ["ツンデレ", "心理学", "メガネ"] },
  },
  "Hana Suzuki": {
    en: { name: "Hana Suzuki", subtitle: "Sunshine Next-Door Girlfriend", description: "2nd-year design student who lights up every room. Always smiling, always energetic, your most loyal cheerleader.", tags: ["Energetic", "Talkative", "Affectionate"] },
    zh: { name: "花铃", subtitle: "元气邻家女友", description: "设计系大学生，走进房间就能让气氛变好。爱笑、话多、永远充满能量。", tags: ["阳光", "话多", "爱撒娇"] },
    ja: { name: "花鈴", subtitle: "元気な隣の彼女", description: "デザイン学部2年生。入るだけで場が明るくなる。笑顔が絶えないあなたの応援団長。", tags: ["元気", "おしゃべり", "甘えん坊"] },
  },
  "Aoi Sato": {
    en: { name: "Aoi Sato", subtitle: "Gentle & Wise Type", description: "25-year-old bookstore editor. Soft-spoken and thoughtful. Listens first, guides gently. Your calmest emotional anchor.", tags: ["Gentle", "Patient", "Bookish"] },
    zh: { name: "葵", subtitle: "温柔知性型", description: "书店编辑，说话轻柔有条理。先共情再引导，是你情绪最安心的出口。", tags: ["温柔", "耐心", "书卷气"] },
    ja: { name: "葵", subtitle: "優しい知性派", description: "25歳の書店編集者。穏やかで思慮深い。まず共感してから優しく導く。", tags: ["優しい", "忍耐強い", "文学的"] },
  },
  "Rei Takahashi": {
    en: { name: "Rei Takahashi", subtitle: "Little Devil Contrast", description: "22-year-old freelance illustrator. Playful and sharp-tongued on the surface — surprisingly reliable when it counts. Teasing you is her love language.", tags: ["Playful", "Sharp-tongued", "Surprising"] },
    zh: { name: "玲", subtitle: "反差小恶魔", description: "自由插画师，嬉皮笑脸爱斗嘴，但认真起来出人意料地靠谱。", tags: ["调皮", "毒舌", "反差萌"] },
    ja: { name: "玲", subtitle: "ギャップ小悪魔", description: "22歳のフリーランスイラストレーター。いたずらっぽくて口が悪いが、いざとなると頼りになる。", tags: ["いたずら", "毒舌", "ギャップ萌え"] },
  },
  "Miyuki Asakura": {
    en: { name: "Miyuki Asakura", subtitle: "Commanding Big Sister", description: "28-year-old investment executive with a powerful aura. Ice-cold exterior, intensely warm inside. Her guard slips only for you.", tags: ["Mature", "Confident", "Strong presence"] },
    zh: { name: "朝倉美雪", subtitle: "霸道御姐", description: "投资公司高管，气场强大，外表冷艳内心火热。只在你面前偶尔露出温柔的一面。", tags: ["御姐", "强势", "成熟魅力"] },
    ja: { name: "朝倉美雪", subtitle: "ドS御姉様", description: "28歳の投資会社幹部。圧倒的なオーラ。クールに見えて内心は熱い。あなたの前だけで少し崩れる。", tags: ["お姉様", "強気", "大人の魅力"] },
  },
  "Sora Nishimura": {
    en: { name: "Sora Nishimura", subtitle: "Cool Indie Musician", description: "24-year-old indie musician. Androgynous style, few words, hard to approach. But for you she becomes a completely different kind of soft.", tags: ["Cool", "Quiet", "Surprising warmth"] },
    zh: { name: "空", subtitle: "酷飒音乐人", description: "独立音乐人，中性风格，外表酷飒不爱说话，对喜欢的人却温柔得像另一个人。", tags: ["帅气", "酷", "反差温柔"] },
    ja: { name: "空", subtitle: "クール系ミュージシャン", description: "24歳のインディーズミュージシャン。中性的でクール。でも好きな人にはまるで別人のように優しい。", tags: ["クール", "無口", "隠れた温かさ"] },
  },
  "Nana Fujiwara": {
    en: { name: "Nana Fujiwara", subtitle: "Elegant City Woman", description: "27-year-old magazine editor-in-chief. Polished but genuine, independent but warm. Like a perfectly made latte — comforting with layers.", tags: ["Elegant", "Independent", "Healing"] },
    zh: { name: "七", subtitle: "轻熟都市女性", description: "杂志主编，精致但不做作，独立但不冷漠。像一杯恰到好处的拿铁。", tags: ["优雅", "独立", "治愈"] },
    ja: { name: "七", subtitle: "大人のシティガール", description: "27歳の雑誌編集長。洗練されているが飾らない。ちょうどいいラテのような温かさ。", tags: ["エレガント", "自立", "癒し系"] },
  },
  "Satsuki Hayashi": {
    en: { name: "Satsuki Hayashi", subtitle: "Intellectual Older Sister", description: "32-year-old associate literature professor. Knowledgeable but never condescending. When you're lost, she'll share a story from her own past. One old cat, walls of books.", tags: ["Mature", "Wise", "Literary"] },
    zh: { name: "皋月", subtitle: "知性博士姐姐", description: "文学副教授，学识渊博却毫无架子。说话不疾不徐，在你迷茫时用亲身经历点你。", tags: ["成熟", "智慧", "文艺"] },
    ja: { name: "皐月", subtitle: "知的なお姉様", description: "32歳の文学准教授。博識で偉ぶらない。迷った時に自分の経験を話してくれる。老猫と本棚の部屋で暮らす。", tags: ["大人", "知的", "文学的"] },
  },
};

export type MBTIType = "INTJ" | "INTP" | "ENTJ" | "ENTP" | "INFJ" | "INFP" | "ENFJ" | "ENFP" | "ISTJ" | "ISFJ" | "ESTJ" | "ESFJ" | "ISTP" | "ISFP" | "ESTP" | "ESFP";

export const CHARACTER_MBTI: Record<string, MBTIType> = {
  "Yuki Harune": "INTJ",
  "Hana Suzuki": "ESFP",
  "Aoi Sato": "INFJ",
  "Rei Takahashi": "ENTP",
  "Miyuki Asakura": "ENTJ",
  "Sora Nishimura": "ISTP",
  "Nana Fujiwara": "ENFJ",
  "Satsuki Hayashi": "INFJ",
};

const MBTI_COMPAT: Record<MBTIType, MBTIType[]> = {
  INTJ: ["ENFP", "ENTP"],
  INTP: ["ENTJ", "ESTJ"],
  ENTJ: ["INFP", "INTP"],
  ENTP: ["INFJ", "INTJ"],
  INFJ: ["ENFP", "ENTP"],
  INFP: ["ENFJ", "ENTJ"],
  ENFJ: ["INFP", "ISFP"],
  ENFP: ["INFJ", "INTJ"],
  ISTJ: ["ESFP", "ENFP"],
  ISFJ: ["ESFP", "ESTP"],
  ESTJ: ["INTP", "ISFP"],
  ESFJ: ["ISTP", "INTP"],
  ISTP: ["ESFJ", "ENFJ"],
  ISFP: ["ENFJ", "ESTJ"],
  ESTP: ["ISFJ", "ISTJ"],
  ESFP: ["ISTJ", "ISFJ"],
};

export function getCompatibleMBTIs(userMBTI: MBTIType): MBTIType[] {
  return MBTI_COMPAT[userMBTI] || [];
}

export function getCharacterMatchScore(userMBTI: MBTIType, charName: string): number {
  const charMBTI = CHARACTER_MBTI[charName];
  if (!charMBTI) return 0;
  const compatibles = getCompatibleMBTIs(userMBTI);
  if (compatibles.includes(charMBTI)) return 100;
  if (charMBTI[0] !== userMBTI[0]) return 60;
  return 40;
}

export function getLocalizedChar(originalName: string, locale: Locale): { name: string; subtitle: string } {
  const loc = CHARACTER_LOCALES[originalName]?.[locale];
  return {
    name: loc?.name || originalName,
    subtitle: loc?.subtitle || "",
  };
}
