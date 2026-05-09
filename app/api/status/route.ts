import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey || apiKey === "your-openai-api-key-here") {
    return NextResponse.json({ status: "missing", message: "API key not configured" });
  }

  if (!apiKey.startsWith("sk-")) {
    return NextResponse.json({ status: "invalid", message: "Invalid API key format" });
  }

  // Test the key with a lightweight request
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (response.status === 401) {
      return NextResponse.json({ status: "invalid", message: "Invalid API key" });
    }

    if (response.ok) {
      return NextResponse.json({ status: "healthy", message: "API key active" });
    }

    return NextResponse.json({ status: "unknown", message: `Status ${response.status}` });
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Network error" });
  }
}