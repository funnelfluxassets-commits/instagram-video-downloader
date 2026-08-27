import React from 'react';
import { Copy, Link2, Download, Instagram } from 'lucide-react';

export const HowToGuide: React.FC = () => {
  const steps = [
    {
      step: '01',
      icon: <Copy className="w-5 h-5 text-rose-500" />,
      title: 'Copy Instagram Link',
      desc: 'Open Instagram on your phone or web browser, find the Reel or Post, tap the Share icon and click "Copy Link".',
    },
    {
      step: '02',
      icon: <Link2 className="w-5 h-5 text-purple-500" />,
      title: 'Paste into InstaDownloader',
      desc: 'Paste the copied URL into the search bar at the top of this page and click the "Download" button.',
    },
    {
      step: '03',
      icon: <Download className="w-5 h-5 text-amber-500" />,
      title: 'Save HD Video or MP3',
      desc: 'Select your preferred format (1080p Full HD MP4, 720p HD, or 320kbps MP3 Audio) and click "Save".',
    },
  ];

  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-8 sm:py-12 border-t border-zinc-200/60 dark:border-zinc-800/60">
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
        <h2 className="text-xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          How to Download Instagram Videos
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2">
          Save your favorite Instagram Reels and videos to your device in 3 easy steps.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((s, i) => (
          <div
            key={i}
            className="relative p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col items-center text-center group"
          >
            <div className="absolute top-4 right-4 text-2xl font-black text-zinc-200 dark:text-zinc-800 select-none">
              {s.step}
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 mb-4 group-hover:scale-110 transition-transform">
              {s.icon}
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
              {s.title}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {s.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
