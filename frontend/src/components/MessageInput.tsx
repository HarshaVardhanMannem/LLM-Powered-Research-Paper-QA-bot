"use client";

import React, { useRef } from "react";
import { Send } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  loading: boolean;
}

export default function MessageInput({ value, onChange, onSend, loading }: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/40 rounded-2xl p-2 shadow-xl shadow-black/20">
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          rows={1}
          placeholder="Ask about your research papers... (Enter to send, Shift+Enter for new line)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 resize-none bg-slate-900/50 border border-slate-700/30 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 transition-all max-h-32 scrollbar-thin"
          style={{ minHeight: "44px" }}
        />
        <button
          onClick={onSend}
          disabled={loading || !value.trim()}
          className="shrink-0 p-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
