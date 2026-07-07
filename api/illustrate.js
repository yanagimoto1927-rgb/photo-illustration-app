import OpenAI from "openai";
import { toFile } from "openai/uploads";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const stylePrompts = {
  comic:
    "明るく親しみやすい漫画風イラスト。人物の特徴、髪型、眼鏡、表情、構図は元写真に近づける。太めの輪郭線、自然な笑顔、見やすい色使い。",
  anime:
    "日本のアニメ風イラスト。人物の特徴、髪型、眼鏡、表情、構図を元写真に近づける。やわらかい光、きれいな線、清潔感のある雰囲気。",
  watercolor:
    "やさしい水彩画風イラスト。淡い色、柔らかいにじみ、温かい雰囲気。人物の特徴、髪型、眼鏡、表情、構図は元写真に近づける。",
  oil:
    "油絵風の肖像イラスト。筆の質感、深みのある色、立体感。人物の特徴、髪型、眼鏡、表情、構図は元写真に近づける。",
  stamp:
    "LINEスタンプ風のかわいいイラスト。はっきりした輪郭、明るい表情、シンプルな背景。人物の特徴、髪型、眼鏡、表情は元写真に近づける。",
  chibi:
    "デフォルメされたかわいいキャラクター風イラスト。頭を少し大きめ、親しみやすい表情。人物の特徴、髪型、眼鏡は元写真に近づける。",
  pop:
    "ポップアート風イラスト。明るい色、楽しい雰囲気、印象的な線。人物の特徴、髪型、眼鏡、表情、構図は元写真に近づける。",
  pixel:
    "ピクセルアート風イラスト。レトロゲーム風、ドット絵、シンプルでかわいい表現。人物の特徴、髪型、眼鏡、表情は元写真に近づける。",
  real:
    "リアル寄りの高品質イラスト。写真の人物特徴を保ちつつ、自然で美しいイラストにする。髪型、眼鏡、表情、構図は元写真に近づける。",
  pencil:
    "鉛筆画風イラスト。繊細な線、手描き感、やさしい陰影。人物の特徴、髪型、眼鏡、表情、構図は元写真に近づける。"
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POSTのみ対応しています" });
  }

  try {
    const { imageBase64, style = "comic" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "画像がありません" });
    }

    const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);

    if (!match) {
      return res.status(400).json({ error: "画像形式が正しくありません" });
    }

    const mimeType = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, "base64");

    const imageFile = await toFile(buffer, "photo.png", {
      type: mimeType
    });

    const selectedPrompt = stylePrompts[style] || stylePrompts.comic;

    const result = await client.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      prompt: selectedPrompt,
      size: "1024x1024"
    });

    const imageData = result.data?.[0]?.b64_json;

    if (!imageData) {
      return res.status(500).json({
        error: "画像生成結果がありません",
        detail: JSON.stringify(result)
      });
    }

    return res.status(200).json({
      resultImage: `data:image/png;base64,${imageData}`
    });
  } catch (error) {
    return res.status(500).json({
      error: "イラスト化に失敗しました",
      detail: error.message
    });
  }
}