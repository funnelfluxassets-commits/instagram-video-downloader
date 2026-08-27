import React from 'react';
import { X, Trash2, ExternalLink, Film, Music, Image } from 'lucide-react';
import { InstagramMediaResult } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: InstagramMediaResult[];
  onSelectResult: (result: InstagramMediaResult) => void;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectResult,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 transition-all max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Recent Downloads
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {history.length} {history.length === 1 ? 'item' : 'items'} saved locally
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {history.length === 0 ? (
            <div className="py-12 text-center text-zinc-400">
              <Film className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No downloads in history yet</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id + item.extractedAt}
                onClick={() => {
                  onSelectResult(item);
                  onClose();
                }}
                className="flex items-center gap-3 p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 transition-all cursor-pointer group"
              >
                <div className="w-12 h-14 rounded-xl overflow-hidden bg-black shrink-0 relative">
                  <img
                    src={item.cover}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-rose-500 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                    @{item.author.username} • {new Date(item.extractedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {history.length > 0 && (
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
