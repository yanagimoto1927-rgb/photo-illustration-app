import OpenAI from "openai";
import { toFile } from "openai/uploads";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POSTのみ対応しています" });
  }

  try {
    const { imageBase64 } = req.body;

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

    const result = await client.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      prompt:
        "この写真を、明るく親しみやすい漫画風イラストにしてください。人物の特徴、髪型、眼鏡、表情、構図はできるだけ元写真に近づけてください。",
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