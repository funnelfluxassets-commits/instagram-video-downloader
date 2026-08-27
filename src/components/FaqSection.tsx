import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: 'How do I download Instagram Reels without watermarks?',
    a: 'Simply copy the Instagram Reel link from the app, paste it into the URL field above on InstaDownloader, and click "Save" on 1080p Full HD. The video downloads directly without any watermarks to your device.',
  },
  {
    q: 'Can I extract and download audio (MP3) from Instagram Reels?',
    a: 'Yes! Every extracted Instagram video includes a dedicated "Download Audio (MP3)" option to extract the original audio or background soundtrack as a crisp 320kbps MP3 file.',
  },
  {
    q: 'Does InstaDownloader support photo carousels & multi-slide posts?',
    a: 'Yes! If you paste a multi-photo carousel post link, InstaDownloader allows you to download each high-definition photo in original resolution.',
  },
  {
    q: 'Do I need to install an app or browser extension?',
    a: 'No installation is needed! InstaDownloader works entirely inside your web browser on iPhone (Safari), Android (Chrome), Mac, Windows, and Linux.',
  },
  {
    q: 'Where are the downloaded Instagram videos and MP3 files saved?',
    a: 'Files are saved directly to your device\'s default "Downloads" folder. On iPhones/iPads, you can find them in the Files app or Safari downloads menu.',
  },
  {
    q: 'Can I download private Instagram posts?',
    a: 'To respect user privacy and Instagram security policies, InstaDownloader only processes publicly accessible Instagram Reels, videos, and posts.',
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="w-full max-w-4xl mx-auto pt-8 sm:pt-12 pb-[80px] px-3.5 sm:px-6">
      <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/70 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800/60 mb-7">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Frequently Asked Questions</span>
        </div>
        <h2 className="text-xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          Got Questions? We’ve Got Answers.
        </h2>
      </div>

      <div className="space-y-2.5 sm:space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all shadow-sm"
            >
              <button
                id={`faq-toggle-${idx}`}
                onClick={() => toggle(idx)}
                className="w-full px-4 sm:px-6 py-3.5 sm:py-4 text-left flex items-center justify-between gap-3 font-semibold text-zinc-900 dark:text-zinc-100 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
              >
                <span className="text-xs sm:text-sm md:text-base leading-snug">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-rose-600 dark:text-rose-400' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-4 sm:px-6 pb-4 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
