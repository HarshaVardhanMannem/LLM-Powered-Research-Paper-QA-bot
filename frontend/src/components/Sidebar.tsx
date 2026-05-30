"use client";

import React, { useState } from "react";
import { X, Plus, Upload, FileText, Loader2, Trash2, Database } from "lucide-react";
import type { KnowledgeBaseInfo } from "@/lib/api";

interface Paper { id: string; title: string; }

interface Props {
  open: boolean;
  onClose: () => void;
  papers: Paper[];
  onAddPaper: (id: string) => Promise<void>;
  onUploadPaper: (file: File) => Promise<void>;
  onDeletePaper: (id: string) => Promise<void>;
  knowledgeBases?: KnowledgeBaseInfo[];
  onCreateKnowledgeBase?: (params: {
    name: string;
    domain: string;
    description?: string;
    chunking_strategy?: string;
  }) => Promise<void>;
  onAddDocumentToKnowledgeBase?: (
    kbId: number,
    params: { paper_id?: string; file?: File; title?: string; authors?: string; abstract?: string; categories?: string }
  ) => Promise<void>;
}

export default function Sidebar({
  open,
  onClose,
  papers,
  onAddPaper,
  onUploadPaper,
  onDeletePaper,
  knowledgeBases = [],
  onCreateKnowledgeBase = async () => {},
  onAddDocumentToKnowledgeBase = async () => {},
}: Props) {
  const [paperId, setPaperId] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [kbName, setKbName] = useState("");
  const [kbDomain, setKbDomain] = useState("");
  const [kbDescription, setKbDescription] = useState("");
  const [kbStrategy, setKbStrategy] = useState("section");
  const [kbLoading, setKbLoading] = useState(false);
  const [selectedKbId, setSelectedKbId] = useState<number | "">("");
  const [kbPaperId, setKbPaperId] = useState("");
  const [kbFile, setKbFile] = useState<File | null>(null);
  const [kbDocTitle, setKbDocTitle] = useState("");
  const [kbDocAuthors, setKbDocAuthors] = useState("");
  const [kbDocAbstract, setKbDocAbstract] = useState("");
  const [kbDocCategories, setKbDocCategories] = useState("");
  const [kbDocLoading, setKbDocLoading] = useState(false);

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

  const handleCreateKb = async () => {
    if (!kbName.trim() || !kbDomain.trim()) return;
    setKbLoading(true);
    try {
      await onCreateKnowledgeBase({
        name: kbName,
        domain: kbDomain,
        description: kbDescription,
        chunking_strategy: kbStrategy,
      });
      setKbName("");
      setKbDomain("");
      setKbDescription("");
      setKbStrategy("section");
    } catch {}
    finally { setKbLoading(false); }
  };

  const handleAddKbDoc = async () => {
    if (!selectedKbId || (!kbPaperId.trim() && !kbFile)) return;
    setKbDocLoading(true);
    try {
      await onAddDocumentToKnowledgeBase(Number(selectedKbId), {
        paper_id: kbPaperId.trim() || undefined,
        file: kbFile || undefined,
        title: kbDocTitle,
        authors: kbDocAuthors,
        abstract: kbDocAbstract,
        categories: kbDocCategories,
      });
      setKbPaperId("");
      setKbFile(null);
      setKbDocTitle("");
      setKbDocAuthors("");
      setKbDocAbstract("");
      setKbDocCategories("");
    } catch {}
    finally { setKbDocLoading(false); }
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

            <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Create Knowledge Base</h3>
              <div className="space-y-2">
                <input type="text" placeholder="Name" value={kbName} onChange={(e) => setKbName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
                <input type="text" placeholder="Domain, e.g. NLP" value={kbDomain} onChange={(e) => setKbDomain(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
                <input type="text" placeholder="Description" value={kbDescription} onChange={(e) => setKbDescription(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
                <select value={kbStrategy} onChange={(e) => setKbStrategy(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40">
                  <option value="section">Section-aware</option>
                  <option value="recursive">Recursive</option>
                  <option value="semantic">Semantic</option>
                </select>
              </div>
              <button onClick={handleCreateKb} disabled={kbLoading || !kbName.trim() || !kbDomain.trim()}
                className="w-full mt-3 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {kbLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                Create KB
              </button>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Add to Knowledge Base</h3>
              <div className="space-y-2">
                <select value={selectedKbId} onChange={(e) => setSelectedKbId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40">
                  <option value="">Select KB</option>
                  {knowledgeBases.filter((kb) => !kb.is_system).map((kb) => (
                    <option key={kb.id} value={kb.id}>{kb.name} ({kb.document_count})</option>
                  ))}
                </select>
                <input type="text" placeholder="ArXiv ID" value={kbPaperId} onChange={(e) => setKbPaperId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
                <label className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-slate-600/50 hover:border-indigo-500/40 rounded-xl text-sm text-slate-400 hover:text-indigo-400 cursor-pointer transition-all">
                  <Upload className="w-4 h-4" />
                  {kbFile ? kbFile.name : "Or choose PDF"}
                  <input type="file" accept=".pdf" hidden onChange={(e) => setKbFile(e.target.files?.[0] || null)} />
                </label>
                <input type="text" placeholder="Title override" value={kbDocTitle} onChange={(e) => setKbDocTitle(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
                <input type="text" placeholder="Authors" value={kbDocAuthors} onChange={(e) => setKbDocAuthors(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
                <textarea placeholder="Abstract or summary" value={kbDocAbstract} onChange={(e) => setKbDocAbstract(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 min-h-20" />
                <input type="text" placeholder="Categories or keywords" value={kbDocCategories} onChange={(e) => setKbDocCategories(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
              </div>
              <button onClick={handleAddKbDoc} disabled={kbDocLoading || !selectedKbId || (!kbPaperId.trim() && !kbFile)}
                className="w-full mt-3 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {kbDocLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add to KB
              </button>
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
