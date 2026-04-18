# Flux: Next-Gen AI Problem Solver 🚀

**Live Demo:** [Insert your Vercel Link Here]

Flux is a minimalist, high-performance, multimodal AI assistant designed to solve complex math, science, and logic problems. Built with a focus on speed and user experience, Flux allows users to input text or upload images (like handwritten equations or diagrams) and receives highly accurate, formatted markdown responses.

## ✨ Key Features
* **Multimodal Capabilities:** Processes both standard text inputs and image uploads (OCR & Contextual Vision).
* **Conversational UI:** A seamless, distraction-free interface inspired by premium AI tools, featuring auto-scrolling, image previews, and real-time loading states.
* **Markdown Rendering:** Natively supports complex formatting, tables, lists, and bold text for highly readable academic solutions.
* **High-Speed Processing:** Powered by the lightweight, high-bandwidth Gemini 2.5 Flash model to bypass standard rate limits and deliver answers in milliseconds.

## 🛠️ Technical Stack
* **Frontend:** Next.js (React), Tailwind CSS, React-Markdown.
* **Backend:** Next.js API Routes (Serverless).
* **AI Engine:** Google Generative AI SDK (Gemini 2.5 Flash).
* **Deployment:** Vercel.

## 🚀 Run Locally
1. Clone the repository: `git clone https://github.com/mrQhere/flux.git`
2. Install dependencies: `npm install`
3. Create a `.env` file in the root directory and add your API key: `GEMINI_API_KEY=your_api_key_here`
4. Start the server: `npm run dev`
