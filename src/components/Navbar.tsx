import React from 'react';
import { User, LogIn, Moon, Sun, History, Sparkles } from 'lucide-react';
import { UserAccount } from '../types';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  user: UserAccount | null;
  onOpenAuth: () => void;
  onOpenHistory: () => void;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  setDarkMode,
  user,
  onOpenAuth,
  onOpenHistory,
  historyCount,
}) => {
  return (
    <header className="w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
            <div className="w-full h-full bg-white dark:bg-zinc-950 rounded-[10px] flex items-center justify-center p-1.5">
              <svg viewBox="0 0 24 24" className="w-full h-full text-rose-500 fill-none stroke-current" xmlns="http://www.w3.org/2000/svg" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v13M7 11l5 5 5-5" />
                <path d="M5 20h14" />
              </svg>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-1">
              Insta<span className="bg-gradient-to-r from-rose-500 via-purple-600 to-amber-500 bg-clip-text text-transparent">Downloader</span>
            </span>
          </div>
        </a>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-xs font-semibold relative cursor-pointer"
            title="Download History"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {historyCount}
              </span>
            )}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Auth Profile / Login */}
          {user ? (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-rose-500 dark:hover:border-rose-500 transition-all cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white text-xs font-bold">
                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 max-w-[100px] truncate hidden sm:inline">
                {user.name || user.email.split('@')[0]}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-500 via-purple-600 to-amber-500 hover:opacity-90 text-white text-xs font-bold shadow-sm shadow-rose-500/20 transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
