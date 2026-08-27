import React from 'react';
import { ShieldCheck, Zap, Sparkles, Smartphone, Download, CheckCircle2 } from 'lucide-react';

export const FeatureHighlights: React.FC = () => {
  const features = [
    {
      icon: <Sparkles className="w-5 h-5 text-rose-500" />,
      title: 'No Watermark',
      desc: 'Download clean Instagram Reels and videos in original studio quality with zero watermarks or branding.',
    },
    {
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      title: 'High-Speed Proxy Stream',
      desc: 'Lightning-fast downloads routed directly to your browser’s default Downloads folder with zero redirects.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-purple-500" />,
      title: '100% Free & Secure',
      desc: 'No paid API keys, zero third-party scam redirects, and no software or app installation required.',
    },
    {
      icon: <Smartphone className="w-5 h-5 text-emerald-500" />,
      title: 'Universal Compatibility',
      desc: 'Fully compatible with iPhone (iOS Safari), Android (Chrome), Mac, Windows, and Linux.',
    },
  ];

  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
        <h2 className="text-xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          Why Choose <span className="bg-gradient-to-r from-rose-500 via-purple-600 to-amber-500 bg-clip-text text-transparent">InstaDownloader</span>?
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2">
          The fastest and most reliable way to save Instagram Reels, videos, carousels, and audio tracks.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {features.map((f, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 w-fit mb-3.5">
              {f.icon}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              {f.title}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
