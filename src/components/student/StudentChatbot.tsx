import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bot, X, Send, Cpu } from "lucide-react";
import { parseMarkdownAndMath } from "./shared";
import { Student } from "../../types";

interface StudentChatbotProps {
  student: Student;
  darkMode: boolean;
  disabled?: boolean;
}

export default function StudentChatbot({ student, darkMode, disabled }: StudentChatbotProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "ai"; content: string; time: string }>>([
    {
      role: "ai",
      content: "Hello! I'm your SAMS Academic AI. Ask me to explain a concept, quiz you, or help you debug your thinking.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    if (disabled) {
      setIsChatOpen(false);
    }
  }, [disabled]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    const newHistory = [
      ...chatMessages,
      { role: "user" as const, content: msg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ];
    setChatMessages(newHistory);
    setChatLoading(true);

    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: msg,
          history: newHistory.slice(0, -1),
          studentProfile: { classId: student.classId || "xii-a" }
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setChatMessages(prev => [
        ...prev,
        { role: "ai", content: data.reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    } catch {
      setChatMessages(prev => [
        ...prev,
        { role: "ai", content: "I'm having trouble connecting to my neural net right now. Could you try again in a moment?", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (disabled) return null;

  return (
    <>
      <button
        onClick={() => setIsChatOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl z-40 transition-all hover:scale-110 flex items-center justify-center ${darkMode ? "bg-indigo-600 text-white shadow-indigo-900/50" : "bg-indigo-600 text-white shadow-indigo-500/30"}`}
      >
        <Bot className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className={`fixed bottom-6 right-6 w-[90vw] max-w-sm sm:w-96 h-[32rem] max-h-[80vh] rounded-[2rem] border shadow-2xl z-50 flex flex-col overflow-hidden ${darkMode ? "bg-slate-900 border-slate-800 shadow-slate-950/80" : "bg-white border-slate-200 shadow-slate-400/50"}`}
          >
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between ${darkMode ? "bg-slate-900 border-slate-800" : "bg-indigo-50 border-indigo-100"}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${darkMode ? "bg-indigo-500/20" : "bg-indigo-100"}`}>
                  <Cpu className={`h-5 w-5 ${darkMode ? "text-indigo-400" : "text-indigo-600"}`} />
                </div>
                <div>
                  <h4 className={`text-sm font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>SAMS AI Tutor</h4>
                  <p className={`text-[10px] font-bold ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}>Always Online</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className={`p-2 rounded-full transition-colors cursor-pointer ${darkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-indigo-200 text-indigo-400"}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "ml-auto" : "mr-auto"}`}>
                  <div className={`p-3 rounded-2xl ${msg.role === "user"
                    ? (darkMode ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-indigo-600 text-white rounded-tr-sm")
                    : (darkMode ? "bg-slate-800 text-slate-200 rounded-tl-sm" : "bg-slate-100 text-slate-800 rounded-tl-sm")
                    }`}>
                    <div className="text-[13px] font-medium leading-relaxed">
                      {msg.role === "ai" ? parseMarkdownAndMath(msg.content) : msg.content}
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold mt-1 px-1 ${msg.role === "user" ? "text-right" : "text-left"} ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                    {msg.time}
                  </span>
                </div>
              ))}
              {chatLoading && (
                <div className="flex flex-col max-w-[85%] mr-auto">
                  <div className={`p-4 rounded-2xl rounded-tl-sm flex gap-1.5 ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className={`p-3 border-t ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask a question..."
                  className={`w-full pl-4 pr-12 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"} border`}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || chatLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-indigo-600 text-white disabled:bg-slate-400 transition-colors cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
