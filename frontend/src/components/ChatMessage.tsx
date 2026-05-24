"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ThumbsUp, ThumbsDown, Bot, Copy, Check } from "lucide-react";

interface Message {
  role: string;
  content: string;
  isError?: boolean;
}

interface Props {
  message: Message;
  index: number;
  messages: Message[];
  onFeedback: (q: string, a: string, type: string) => void;
}

export default function ChatMessage({ message, index, messages, onFeedback }: Props) {
  const [copied, setCopied] = useState("");
  const isUser = message.role === "user";

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className={`flex gap-3 mb-6 ${isUser ? "flex-row-reverse" : ""} ${isUser ? "animate-slide-right" : "animate-slide-left"}`}>
      {/* Avatar */}
      <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg ${
        isUser
          ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-500/25"
          : "bg-slate-800 border-2 border-indigo-500/30 text-indigo-400 shadow-indigo-500/10"
      }`}>
        {isUser ? "U" : <Bot className="w-5 h-5" />}
      </div>

      {/* Bubble */}
      <div className="relative max-w-[80%] group">
        <div className={`px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl rounded-tr-md shadow-lg shadow-indigo-500/20"
            : message.isError
              ? "bg-red-500/10 border border-red-500/20 text-red-300 rounded-2xl rounded-tl-md"
              : "bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-2xl rounded-tl-md shadow-lg shadow-black/20"
        }`}>
          <div className="prose prose-invert prose-sm max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const codeStr = String(children).replace(/\n$/, "");
                  const match = /language-(\w+)/.exec(className || "");
                  const isInline = !match && !codeStr.includes("\n");
                  if (isInline) return <code className={className} {...props}>{children}</code>;
                  return (
                    <div className="relative my-2">
                      <button onClick={() => handleCopy(codeStr)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-white transition-colors z-10">
                        {copied === codeStr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match?.[1] || "text"}
                        PreTag="div"
                        customStyle={{ borderRadius: "0.75rem", padding: "1em", margin: 0, fontSize: "0.8rem" }}
                      >
                        {codeStr}
                      </SyntaxHighlighter>
                    </div>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Feedback */}
        {!isUser && !message.isError && index > 0 && (
          <div className="flex gap-1.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onFeedback(messages[index - 1].content, message.content, "like")}
              className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/40 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all" title="Helpful">
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onFeedback(messages[index - 1].content, message.content, "dislike")}
              className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/40 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-all" title="Not helpful">
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
