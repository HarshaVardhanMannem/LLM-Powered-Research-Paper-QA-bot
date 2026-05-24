"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, ChevronDown } from "lucide-react";
import type { KnowledgeBaseInfo } from "@/lib/api";

interface Props {
  knowledgeBases: KnowledgeBaseInfo[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  loading?: boolean;
}

export default function KBSelector({
  knowledgeBases,
  selectedIds,
  onChange,
  loading = false,
}: Props) {
  const [open, setOpen] = useState(false);

  const toggle = (id: number) => {
    if (id === 0) {
      onChange([]);
      setOpen(false);
      return;
    }
    const idx = selectedIds.indexOf(id);
    if (idx >= 0) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds.filter((x) => x !== 0), id]);
    }
  };

  const label =
    selectedIds.length === 0
      ? "My Papers"
      : selectedIds.length === 1
        ? knowledgeBases.find((k) => k.id === selectedIds[0])?.name ?? "1 KB"
        : `${selectedIds.length} KBs selected`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/40 text-sm text-slate-300 hover:bg-slate-800/80 hover:border-slate-600/60 transition-all min-w-[140px]"
      >
        <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
        <span className="truncate flex-1 text-left">{label}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-2 w-64 max-h-60 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-20 py-1">
            <button
              type="button"
              onClick={() => toggle(0)}
              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-800/80 transition-colors flex items-center gap-2 ${
                selectedIds.length === 0 ? "bg-indigo-500/20 text-indigo-300" : "text-slate-300"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              My Papers
            </button>
            {knowledgeBases.length > 0 && (
              <div className="border-t border-slate-700/50 my-1" />
            )}
            {knowledgeBases.map((kb) => (
              <button
                key={kb.id}
                type="button"
                onClick={() => toggle(kb.id)}
                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-800/80 transition-colors flex items-center gap-2 ${
                  selectedIds.includes(kb.id) ? "bg-indigo-500/20 text-indigo-300" : "text-slate-300"
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="truncate block">{kb.name}</span>
                  <span className="text-xs text-slate-500">
                    {kb.document_count} docs · {kb.domain}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
