"use client";

import React, { useState } from "react";
import { Menu, FlaskConical, LogOut, ChevronDown } from "lucide-react";

interface User { id: number; email: string; full_name: string | null; }

interface Props {
  user: User;
  onMenuClick: () => void;
  onLogout: () => void;
}

export default function Header({ user, onMenuClick, onLogout }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initial = (user.full_name || user.email || "?")[0].toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/40 shadow-xl shadow-black/20">
      <div className="flex items-center justify-between h-full px-4 max-w-screen-2xl mx-auto">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick}
            className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <FlaskConical className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent hidden sm:block">
              Research Papers QA
            </h1>
          </div>
        </div>

        {/* Right - User menu */}
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700/50 transition-all">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
              {initial}
            </div>
            <span className="text-sm text-slate-300 hidden sm:block max-w-[120px] truncate">
              {user.full_name || user.email}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700/50 rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden animate-fade-in">
                <div className="px-4 py-3 border-b border-slate-700/50">
                  <p className="text-sm font-medium text-slate-200 truncate">{user.full_name || "User"}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                <button onClick={() => { setMenuOpen(false); onLogout(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
