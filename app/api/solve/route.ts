import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize the API with your key
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { problem, image } = body;

    if (!problem && !image) {
      return NextResponse.json(
        { error: "Please provide a question or an image." },
        { status: 400 }
      );
    }

    // We use Flash for speed and higher free-tier rate limits
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let result;
    const systemPrompt = "You are an expert tutor. Provide a step-by-step solution. If relevant, output numerical data so the UI can generate a graph.";

    if (image) {
      // Handle Image + Text
      const base64Data = image.split(",")[1];
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg", // ensure this matches your upload type
        },
      };
      const fullTextPrompt = `${systemPrompt}\n\nUser Question:\n${problem || "Explain this image."}`;
      result = await model.generateContent([fullTextPrompt, imagePart]);
    } else {
      // Handle Text Only
      const fullTextPrompt = `${systemPrompt}\n\nUser Question:\n${problem}`;
      result = await model.generateContent(fullTextPrompt);
    }

    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ solution: text }, { status: 200 });

  } catch (error: any) {
    console.error("Backend Error:", error);
    
    // Catch Rate Limit Errors specifically to show a friendly message
    if (error.status === 429 || error.message.includes("429")) {
      return NextResponse.json(
        { error: "We are receiving too many requests right now. Please wait 15 seconds and try again." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "An error occurred while generating the solution. Please try again." },
      { status: 500 }
    );
  }
}