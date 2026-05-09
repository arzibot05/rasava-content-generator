import { NextResponse } from "next/server";
import OpenAI from "openai";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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

    // Build GPT Image 2 prompt
    let fullPrompt = caption;
    if (imageDescription) {
      fullPrompt += `. ${imageDescription}`;
    }
    fullPrompt += `. Style: ${BRAND_STYLE.imageStyleSuffix}. Instagram ${format || "SQUARE"} format, engaging social media visual.`;

    // Image size based on format
    const size = format === "STORY" ? "1365x768" : format === "PORTRAIT" ? "1024x1280" : "1024x1024";

    const imageResponse = await openai.images.generate({
      model: "gpt-image-2",
      prompt: fullPrompt,
      quality: "high",
      size: size as "1024x1024" | "1024x1280" | "1365x768",
      response_format: "b64_json",
    });

    const imageResult = imageResponse?.data?.[0] as any;
    if (!imageResult?.b64_json) {
      return NextResponse.json({ error: "No image generated" }, { status: 500 });
    }
    const b64 = imageResult.b64_json;

    // Save image
    const generatedDir = path.join(process.cwd(), "public", "generated");
    await mkdir(generatedDir, { recursive: true });

    const filename = `${uuidv4()}.png`;
    const filepath = path.join(generatedDir, filename);
    const imageBuffer = Buffer.from(b64, "base64");
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