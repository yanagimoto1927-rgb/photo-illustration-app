import OpenAI from "openai";

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

    const response = await client.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "この写真を、明るく親しみやすい漫画風イラストにしてください。人物の特徴、髪型、眼鏡、表情、構図はできるだけ元写真に近づけてください。"
            },
            {
              type: "input_image",
              image_url: imageBase64
            }
          ]
        }
      ],
      tools: [
        {
          type: "image_generation"
        }
      ]
    });

    const imageData = response.output
      .filter(item => item.type === "image_generation_call")
      .map(item => item.result)[0];

    if (!imageData) {
      return res.status(500).json({ error: "画像生成結果がありません" });
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