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
    
    // CRITICAL FIX: The updated system prompt that forces the AI to format graphs correctly for Recharts
    const systemPrompt = `You are an expert tutor. Provide a step-by-step solution. 
If the user asks for a graph, you MUST output the data as an array of JSON objects inside a code block labeled 'chart'. 
Example format:
\`\`\`chart
[{"x": 0, "y": 10}, {"x": 5, "y": 20}]
\`\`\`
Do not put any other text inside the chart code block. Use standard markdown for the rest of your explanation.`;

    if (image) {
      // Handle Image + Text
      const base64Data = image.split(",")[1];
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg", 
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