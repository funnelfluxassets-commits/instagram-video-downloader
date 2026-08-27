import React, { useState } from 'react';
import { Search, Clipboard, X, Loader2, Sparkles, Instagram } from 'lucide-react';

interface UrlInputBarProps {
  onExtract: (url: string) => void;
  isLoading: boolean;
}

export const UrlInputBar: React.FC<UrlInputBarProps> = ({ onExtract, isLoading }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onExtract(url.trim());
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        onExtract(text.trim());
      }
    } catch {
      // Fallback
    }
  };

  const handleClear = () => {
    setUrl('');
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 via-purple-600 to-amber-500 rounded-3xl blur-md opacity-25 group-hover:opacity-40 transition duration-500 group-focus-within:opacity-75"></div>

        <div className="relative flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl shadow-zinc-200/50 dark:shadow-black/40 overflow-hidden focus-within:border-rose-500 dark:focus-within:border-rose-500 transition-all">
          <div className="pl-4 sm:pl-5 text-zinc-400">
            <Instagram className="w-5 h-5 text-rose-500" />
          </div>

          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste Instagram Reel, Video, or Photo link here..."
            className="w-full py-4 sm:py-5 px-3 sm:px-4 text-xs sm:text-base bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
            disabled={isLoading}
          />

          {/* Action Buttons inside Input */}
          <div className="flex items-center gap-1.5 pr-2 sm:pr-3 shrink-0">
            {url && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {!url && (
              <button
                type="button"
                onClick={handlePaste}
                className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Paste</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl bg-gradient-to-r from-rose-500 via-purple-600 to-amber-500 hover:opacity-95 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-500/25 transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Processing...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Helper Format Badges */}
      <div className="mt-3 flex items-center justify-center gap-2 flex-wrap text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1 font-medium">
          <Sparkles className="w-3 h-3 text-rose-500" /> Supports:
        </span>
        <span className="bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-200/60 dark:border-zinc-700/60 font-semibold">
          Reels
        </span>
        <span className="bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-200/60 dark:border-zinc-700/60 font-semibold">
          Videos
        </span>
        <span className="bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-200/60 dark:border-zinc-700/60 font-semibold">
          Carousels
        </span>
        <span className="bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-200/60 dark:border-zinc-700/60 font-semibold">
          Audio MP3
        </span>
      </div>
    </div>
  );
};
