import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { UrlInputBar } from './components/UrlInputBar';
import { ResultCard } from './components/ResultCard';
import { FeatureHighlights } from './components/FeatureHighlights';
import { HowToGuide } from './components/HowToGuide';
import { FaqSection } from './components/FaqSection';
import { AuthModal } from './components/AuthModal';
import { HistoryModal } from './components/HistoryModal';
import { InstagramMediaResult, UserAccount } from './types';
import { Sparkles, AlertCircle, Instagram, ShieldCheck, Heart } from 'lucide-react';

export const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<InstagramMediaResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // User state & free download quota
  const [user, setUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('insta_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [downloadCount, setDownloadCount] = useState<number>(() => {
    return Number(localStorage.getItem('insta_downloads') || 0);
  });

  const [history, setHistory] = useState<InstagramMediaResult[]>(() => {
    const saved = localStorage.getItem('insta_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleExtract = async (url: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Could not extract media from this Instagram link. Please make sure the link is public.');
      }

      setResult(json.data);

      // Save to local history
      const updated = [json.data, ...history.filter((h) => h.id !== json.data.id)].slice(0, 20);
      setHistory(updated);
      localStorage.setItem('insta_history', JSON.stringify(updated));
    } catch (err: any) {
      console.error('Extraction error:', err);
      setError(err?.message || 'Failed to extract video. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessfulDownload = () => {
    const newCount = downloadCount + 1;
    setDownloadCount(newCount);
    localStorage.setItem('insta_downloads', String(newCount));

    // Show auth modal on 3rd download if user is not logged in
    if (!user && newCount >= 3) {
      setTimeout(() => setIsAuthOpen(true), 1500);
    }
  };

  const handleLoginSuccess = (account: UserAccount) => {
    setUser(account);
    localStorage.setItem('insta_user', JSON.stringify(account));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('insta_user');
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('insta_history');
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 selection:bg-rose-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
      />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-10 sm:pt-16 pb-8 sm:pb-12 overflow-hidden">
          {/* Subtle Background Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-rose-500/10 via-purple-600/10 to-amber-500/10 blur-[120px] rounded-full pointer-events-none"></div>

          <div className="max-w-4xl mx-auto text-center px-4 space-y-4 sm:space-y-6">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
              <Instagram className="w-3.5 h-3.5" />
              <span>Free Online Instagram Downloader</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tight leading-[1.15]">
              Download Instagram{' '}
              <span className="bg-gradient-to-r from-rose-500 via-purple-600 to-amber-500 bg-clip-text text-transparent">
                Reels & Videos
              </span>{' '}
              in Full HD
            </h1>

            {/* Subheading */}
            <p className="max-w-xl mx-auto text-xs sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Save Instagram Reels, videos, carousels, and MP3 audio tracks in high definition without watermarks or third-party ads.
            </p>

            {/* Search / Paste Input Bar */}
            <div className="pt-2 sm:pt-4">
              <UrlInputBar onExtract={handleExtract} isLoading={isLoading} />
            </div>

            {/* Error Message Banner */}
            {error && (
              <div className="max-w-xl mx-auto p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs sm:text-sm flex items-center gap-3 text-left">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </section>

        {/* Result Area */}
        {result && (
          <section className="px-4 pb-12 animate-fade-in">
            <ResultCard result={result} onSuccessfulDownload={handleSuccessfulDownload} />
          </section>
        )}

        {/* Value Highlights */}
        <FeatureHighlights />

        {/* How To Step-by-Step Guide */}
        <HowToGuide />

        {/* FAQ Section */}
        <FaqSection />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-950/50 py-8 px-4 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[1.5px] shadow-sm flex items-center justify-center">
                <div className="w-full h-full bg-zinc-950 rounded-[6.5px] flex items-center justify-center p-1.5">
                  <svg viewBox="0 0 24 24" className="w-full h-full text-rose-500 fill-none stroke-current" xmlns="http://www.w3.org/2000/svg" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v13M7 11l5 5 5-5" />
                    <path d="M5 20h14" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1 sm:gap-1.5 whitespace-nowrap text-center">
                <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white tracking-tight">InstaDownloader</span>
                <span className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap">• Zero Watermarks • 100% Free</span>
              </div>
            </div>
            <p className="flex items-center gap-1">
              Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" /> for content creators
            </p>
          </div>

          <div className="pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50 text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed text-center sm:text-left">
            <p>
              <strong>Disclaimer:</strong> InstaDownloader is an independent utility tool and is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Instagram, Meta Platforms, Inc., or any of their subsidiaries or affiliates. The official Instagram website can be found at <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">instagram.com</a>. The name "Instagram" as well as related names, marks, emblems, and images are registered trademarks of their respective owners.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        user={user}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectResult={(r) => setResult(r)}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
};
