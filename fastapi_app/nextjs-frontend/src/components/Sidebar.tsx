"use client";

import React, { useState } from "react";
import { X, Plus, Upload, FileText, Loader2, Trash2 } from "lucide-react";

interface Paper { id: string; title: string; }

interface Props {
  open: boolean;
  onClose: () => void;
  papers: Paper[];
  onAddPaper: (id: string) => Promise<void>;
  onUploadPaper: (file: File) => Promise<void>;
  onDeletePaper: (id: string) => Promise<void>;
}

export default function Sidebar({ open, onClose, papers, onAddPaper, onUploadPaper, onDeletePaper }: Props) {
  const [paperId, setPaperId] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const handleAdd = async () => {
    if (!paperId.trim()) return;
    setAddLoading(true);
    try { await onAddPaper(paperId); setPaperId(""); } catch {}
    finally { setAddLoading(false); }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploadLoading(true);
    try { await onUploadPaper(file); setFile(null); } catch {}
    finally { setUploadLoading(false); }
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />}
      <div className={`fixed top-0 left-0 h-full w-80 max-w-[90vw] bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 z-50 transform transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <h2 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">Papers</h2>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Add Paper */}
            <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Add by ArXiv ID</h3>
              <input
                type="text" placeholder="e.g., 1706.03762" value={paperId}
                onChange={(e) => setPaperId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all"
              />
              <button onClick={handleAdd} disabled={addLoading || !paperId.trim()}
                className="w-full mt-3 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Paper
              </button>
            </div>

            {/* Upload Paper */}
            <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Upload PDF</h3>
              <label className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-slate-600/50 hover:border-indigo-500/40 rounded-xl text-sm text-slate-400 hover:text-indigo-400 cursor-pointer transition-all">
                <Upload className="w-4 h-4" />
                {file ? file.name : "Choose PDF file"}
                <input type="file" accept=".pdf" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
              {file && (
                <button onClick={handleUpload} disabled={uploadLoading}
                  className="w-full mt-3 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {uploadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload
                </button>
              )}
            </div>

            {/* Papers List */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Your Papers ({papers.length})
              </h3>
              {papers.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No papers yet</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {papers.map((paper) => (
                    <div key={paper.id}
                      className="group flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-all">
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-indigo-400" />
                      </div>
                      <span className="text-sm text-slate-300 truncate flex-1">{paper.title}</span>
                      <button onClick={() => onDeletePaper(paper.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
