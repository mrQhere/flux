"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Message = {
  role: "user" | "ai";
  text: string;
  image?: string | null;
};

// --- Custom Copy Button Component ---
const CodeBlock = ({ children }: { children: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4 rounded-lg bg-stone-900 overflow-hidden">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="p-1.5 bg-stone-700 text-stone-300 rounded hover:text-white hover:bg-stone-600 text-xs flex items-center gap-1"
        >
          {copied ? (
            <span>Copied!</span>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm text-stone-300 font-mono">
        <code>{children}</code>
      </pre>
    </div>
  );
};

export default function FluxSolver() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Smooth scroll that fires whenever messages update
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !image) return;

    const currentInput = input;
    const currentImage = image;

    setMessages((prev) => [...prev, { role: "user", text: currentInput, image: currentImage }]);
    setInput("");
    setImage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem: currentInput, image: currentImage }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate a response.");

      setMessages((prev) => [...prev, { role: "ai", text: data.solution }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "ai", text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFDF9] text-stone-800 font-sans">
      <header className="sticky top-0 z-10 flex items-center justify-center py-4 bg-[#FDFDF9]/80 backdrop-blur-sm border-b border-stone-200/50">
        <h1 className="text-xl font-semibold tracking-wide text-stone-700">Flux</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 w-full max-w-3xl mx-auto pb-32">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-stone-400 mt-20">
            <p className="text-lg">How can Flux help you today?</p>
          </div>
        ) : (
          <div className="space-y-8 mt-4">
            {messages.map((msg, index) => (
              <div key={index} className="flex flex-col">
                <span className="text-sm font-semibold mb-1 text-stone-500">
                  {msg.role === "user" ? "You" : "Flux"}
                </span>
                
                {msg.image && (
                  <img src={msg.image} alt="Uploaded context" className="max-w-xs rounded-lg border border-stone-200 mb-3 shadow-sm" />
                )}
                
                <div className={`prose prose-stone max-w-none ${msg.role === "user" ? "text-stone-800" : "text-stone-700"}`}>
                  {msg.role === "user" ? (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  ) : (
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Intercept Code Blocks
                        code(props) {
                          const { children, className, node, ...rest } = props;
                          const match = /language-(\w+)/.exec(className || '');
                          const language = match ? match[1] : '';

                          // 1. If it is a chart, render the Graph!
                          if (language === 'chart') {
                            try {
                              const chartData = JSON.parse(String(children));
                              return (
                                <div className="h-64 w-full my-6 bg-white p-4 rounded-xl shadow-sm border border-stone-200">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                      <XAxis dataKey="x" stroke="#78716c" fontSize={12} />
                                      <YAxis stroke="#78716c" fontSize={12} />
                                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                      <Line type="monotone" dataKey="y" stroke="#292524" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              );
                            } catch (e) {
                              return <div className="text-red-500 text-sm">Failed to render graph data.</div>;
                            }
                          }

                          // 2. If it is normal code, render the Copy Button component
                          if (match) {
                            return <CodeBlock>{String(children).replace(/\n$/, '')}</CodeBlock>;
                          }

                          // 3. Inline code
                          return <code className="bg-stone-200 px-1 py-0.5 rounded text-sm text-stone-800" {...rest}>{children}</code>;
                        }
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold mb-3 text-stone-500">Flux</span>
                <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin"></div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </main>

      <div className="fixed bottom-0 w-full bg-gradient-to-t from-[#FDFDF9] via-[#FDFDF9] to-transparent pt-10 pb-6 px-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative bg-white border border-stone-300 shadow-sm rounded-2xl flex flex-col focus-within:ring-1 focus-within:ring-stone-400 focus-within:border-stone-400 transition-all">
          {image && (
            <div className="relative inline-block w-16 h-16 m-3 mb-0">
              <img src={image} alt="Preview" className="w-full h-full object-cover rounded-md border border-stone-200" />
              <button type="button" onClick={() => setImage(null)} className="absolute -top-2 -right-2 bg-stone-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-stone-700">✕</button>
            </div>
          )}
          <textarea
            className="w-full max-h-48 p-4 bg-transparent border-none outline-none resize-none text-stone-800 placeholder-stone-400"
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'inherit';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            placeholder="Message Flux..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <div className="flex justify-between items-center px-3 pb-3">
            <label className="cursor-pointer text-stone-400 hover:text-stone-600 p-2 rounded-lg hover:bg-stone-100 transition-colors">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
            </label>
            <button type="submit" disabled={loading || (!input.trim() && !image)} className="bg-stone-800 text-white p-2 rounded-lg hover:bg-stone-700 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}