import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const BRAND_STYLE = {
  imageStyleSuffix:
    "clean modern aesthetic, minimalist composition, professional photography, soft natural lighting, brand colors orange and navy, consistent visual identity",
};

export async function POST(request: Request) {
  try {
    const { caption, imageDescription, format } = await request.json();

    if (!caption) {
      return NextResponse.json({ error: "Caption is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    // Build prompt
    let fullPrompt = caption;
    if (imageDescription) {
      fullPrompt += `. ${imageDescription}`;
    }
    fullPrompt += `. Style: ${BRAND_STYLE.imageStyleSuffix}. Instagram ${format || "SQUARE"} format, engaging social media visual.`;

    // OpenRouter API call - use gpt-5-image-mini
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-image-mini",
        messages: [{ role: "user", content: fullPrompt }],
        modalities: ["image"],
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error("OpenRouter error:", error);
      return NextResponse.json(
        { error: error?.error?.message || "OpenRouter API error" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const message = data?.choices?.[0]?.message;

    // Extract base64 image from message.images array
    let imageBase64: string | null = null;

    if (message?.images && message.images.length > 0) {
      const img = message.images[0];
      if (img.image_url?.url) {
        const url = img.image_url.url;
        if (url.startsWith("data:")) {
          const parts = url.split(",");
          if (parts.length >= 2) imageBase64 = parts[1];
        }
      }
    }

    if (!imageBase64) {
      console.error("No image in response:", JSON.stringify(data).slice(0, 500));
      return NextResponse.json({ error: "No image generated" }, { status: 500 });
    }

    // Save image
    const generatedDir = path.join(process.cwd(), "public", "generated");
    await mkdir(generatedDir, { recursive: true });

    const filename = `${uuidv4()}.png`;
    const filepath = path.join(generatedDir, filename);
    const imageBuffer = Buffer.from(imageBase64, "base64");
    await writeFile(filepath, imageBuffer);

    return NextResponse.json({
      imageUrl: `/generated/${filename}`,
      imagePrompt: fullPrompt,
      format: format || "SQUARE",
    });
  } catch (error) {
    console.error("POST /api/generate error:", error);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}