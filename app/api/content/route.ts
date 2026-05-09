import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const contents = await prisma.content.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ contents });
  } catch (error) {
    console.error("GET /api/content error:", error);
    return NextResponse.json({ error: "Failed to fetch contents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { caption, imageUrl, imagePrompt, referenceImageUrl, format } = body;

    const content = await prisma.content.create({
      data: {
        caption,
        imageUrl,
        imagePrompt,
        referenceImageUrl: referenceImageUrl || null,
        format: format || "SQUARE",
      },
    });

    return NextResponse.json(content, { status: 201 });
  } catch (error) {
    console.error("POST /api/content error:", error);
    return NextResponse.json({ error: "Failed to create content" }, { status: 500 });
  }
}