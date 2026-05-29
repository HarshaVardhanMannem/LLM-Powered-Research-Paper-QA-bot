"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import AuthPage from "@/components/AuthPage";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ChatMessage from "@/components/ChatMessage";
import MessageInput from "@/components/MessageInput";
import KBSelector from "@/components/KBSelector";
import StatsPanel from "@/components/StatsPanel";
import { Loader2, MessageSquareText } from "lucide-react";
import * as api from "@/lib/api";

interface Message { role: string; content: string; isError?: boolean; }
interface Paper { id: string; title: string; }

export default function Home() {
  const { user, loading: authLoading, logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [feedbackStats, setFeedbackStats] = useState({ likes: 0, dislikes: 0 });
  const [knowledgeBases, setKnowledgeBases] = useState<api.KnowledgeBaseInfo[]>([]);
  const [selectedKBIds, setSelectedKBIds] = useState<number[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (user) {
      api.fetchPapers().then(setPapers).catch(() => {});
      api.fetchFeedbackStats().then(setFeedbackStats).catch(() => {});
      api.fetchKnowledgeBases().then(setKnowledgeBases).catch(() => {});
      api.fetchConversations().then((convs) => {
        if (convs?.length) setMessages(convs.map((c) => ({ role: c.role, content: c.content })));
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await api.sendMessage(
        text,
        selectedKBIds.length > 0 ? selectedKBIds : undefined
      );
      setMessages((prev) => [...prev, { role: "assistant", content: res.response }]);
      setPapers(res.papers);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      const msg = error.response?.data?.detail || "Error getting response";
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${msg}`, isError: true }]);
      showToast(msg, "error");
    } finally { setLoading(false); }
  };

  const handleAddPaper = async (id: string) => {
    try {
      const res = await api.addPaper(id);
      setPapers(res.papers);
      showToast(res.message);
      setSidebarOpen(false);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      showToast(error.response?.data?.detail || "Error adding paper", "error");
      throw err;
    }
  };

  const handleUpload = async (file: File) => {
    try {
      const res = await api.uploadPaper(file);
      setPapers(res.papers);
      showToast(res.message || "Uploaded successfully");
      setSidebarOpen(false);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      showToast(error.response?.data?.detail || "Upload failed", "error");
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await api.deletePaper(id);
      setPapers(res.papers);
      showToast("Paper deleted");
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      showToast(error.response?.data?.detail || "Delete failed", "error");
    }
  };

  const handleFeedback = async (q: string, a: string, type: string) => {
    try {
      await api.submitFeedback(q, a, type);
      const stats = await api.fetchFeedbackStats();
      setFeedbackStats(stats);
      showToast("Feedback submitted");
    } catch { showToast("Error submitting feedback", "error"); }
  };

  const handleLogout = () => {
    logout();
    setMessages([]); setPapers([]); setFeedbackStats({ likes: 0, dislikes: 0 });
    showToast("Signed out");
  };

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!user) return <AuthPage />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <Header user={user} onMenuClick={() => setSidebarOpen(true)} onLogout={handleLogout} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} papers={papers}
        onAddPaper={handleAddPaper} onUploadPaper={handleUpload} onDeletePaper={handleDelete} />

      {/* Main */}
      <div className="pt-16 flex justify-center min-h-screen">
        <div className="flex w-full max-w-7xl px-4 py-6 gap-6">
          {/* Chat area */}
          <div className="flex-1 flex flex-col min-w-0 max-w-3xl mx-auto w-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto mb-4 pr-1 min-h-[400px]">
              <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-2xl p-4 sm:p-6 min-h-full">
                {messages.length === 0 && !loading ? (
                  <div className="flex flex-col items-center justify-center h-80 text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500/10 to-pink-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 animate-pulse">
                      <MessageSquareText className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent mb-1">
                      Start a conversation
                    </h3>
                    <p className="text-sm text-slate-500 max-w-xs">
                      Add papers from the sidebar, then ask questions about your research
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, i) => (
                      <ChatMessage key={i} message={msg} index={i} messages={messages} onFeedback={handleFeedback} />
                    ))}
                    {loading && (
                      <div className="flex items-center gap-3 py-4 animate-fade-in">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border-2 border-indigo-500/30 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                        </div>
                        <div className="px-4 py-3 bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-tl-md">
                          <span className="text-sm text-slate-400">Thinking...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </>
                )}
              </div>
            </div>

            {/* KB selector + Input */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <KBSelector
                  knowledgeBases={knowledgeBases}
                  selectedIds={selectedKBIds}
                  onChange={setSelectedKBIds}
                  loading={loading}
                />
                <span className="text-xs text-slate-500">
                  {selectedKBIds.length > 0
                    ? "Querying selected knowledge bases"
                    : "Querying your papers"}
                </span>
              </div>
              <MessageInput value={input} onChange={setInput} onSend={handleSend} loading={loading} />
            </div>
          </div>

          {/* Stats sidebar */}
          <div className="pt-2">
            <StatsPanel
              totalPapers={papers.length}
              totalQuestions={messages.filter((m) => m.role === "user").length}
              likes={feedbackStats.likes}
              dislikes={feedbackStats.dislikes}
            />
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl animate-fade-in ${
          toast.type === "error"
            ? "bg-red-500/90 text-white shadow-red-500/30"
            : "bg-emerald-500/90 text-white shadow-emerald-500/30"
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
