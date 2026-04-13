import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, mode } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const prompt =
      mode === "improve"
        ? `Improve this academic writing:\n\n${text}`
        : `Check this academic writing for mistakes and clarity:\n\n${text}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const data = await response.json();

    return NextResponse.json({
      result: data.choices?.[0]?.message?.content || "No response",
    });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}