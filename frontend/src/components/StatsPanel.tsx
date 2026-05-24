"use client";

import React from "react";
import { FileText, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";

interface Props {
  totalPapers: number;
  totalQuestions: number;
  likes: number;
  dislikes: number;
}

const stats = [
  { key: "papers", label: "Papers", icon: FileText, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  { key: "questions", label: "Questions", icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { key: "likes", label: "Positive", icon: ThumbsUp, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { key: "dislikes", label: "Negative", icon: ThumbsDown, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
] as const;

export default function StatsPanel({ totalPapers, totalQuestions, likes, dislikes }: Props) {
  const values = { papers: totalPapers, questions: totalQuestions, likes, dislikes };

  return (
    <div className="hidden xl:flex flex-col gap-3 w-56 shrink-0">
      <h3 className="text-sm font-bold bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent mb-1">
        Statistics
      </h3>
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.key}
            className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700/40 rounded-2xl hover:translate-y-[-2px] hover:shadow-lg hover:shadow-black/20 transition-all duration-200">
            <div className={`p-2 rounded-xl ${s.bg} border ${s.border}`}>
              <Icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{values[s.key]}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
