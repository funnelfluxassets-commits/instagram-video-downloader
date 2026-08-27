import React, { useState } from 'react';
import {
  Download,
  Film,
  Music,
  Image,
  Check,
  Loader2,
  Share2,
  Copy,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Instagram,
} from 'lucide-react';
import { InstagramMediaResult, DownloadOption } from '../types';

interface ResultCardProps {
  result: InstagramMediaResult;
  onSuccessfulDownload: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, onSuccessfulDownload }) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [customFilename, setCustomFilename] = useState(result.title);
  const [copiedTitle, setCopiedTitle] = useState(false);

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(result.title);
    setCopiedTitle(true);
    setTimeout(() => setCopiedTitle(false), 2000);
  };

  const handleResetFilename = () => {
    setCustomFilename(result.title);
  };

  const handleDownload = async (option: DownloadOption) => {
    try {
      setDownloadingId(option.id);
      setDownloadError(null);

      const baseName = (customFilename || result.title || 'instagram_media')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .replace(/[\s_]+/g, '_')
        .trim()
        .slice(0, 100);

      let suffix = '';
      if (option.type === 'audio') {
        suffix = '_audio';
      } else if (option.type === 'thumbnail') {
        suffix = '_cover';
      } else if (option.type === 'photo') {
        suffix = `_photo_${(option.slideIndex || 0) + 1}`;
      } else if (option.quality) {
        suffix = `_${option.quality.replace(/[\s()]/g, '')}`;
      }

      const safeTitle = `${baseName}${suffix}`;
      const ext = option.extension || (option.type === 'audio' ? 'mp3' : option.type === 'thumbnail' || option.type === 'photo' ? 'jpg' : 'mp4');

      // Direct Stream Download straight to Downloads folder
      let endpoint = '';
      if (option.type === 'thumbnail' || option.type === 'photo') {
        endpoint = `/api/proxy-download?url=${encodeURIComponent(option.url || result.cover)}&filename=${encodeURIComponent(safeTitle)}&ext=jpg&type=thumbnail`;
      } else {
        endpoint = `/api/proxy-download?id=${result.id}&url=${encodeURIComponent(result.originalUrl)}&quality=${encodeURIComponent(option.quality)}&type=${option.type}&filename=${encodeURIComponent(safeTitle)}&ext=${ext}&isShorts=${result.isReel ? '1' : '0'}`;
      }

      const response = await fetch(endpoint);
      if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        const msg = errorJson?.detail
          ? `${errorJson.error} (${errorJson.detail})`
          : errorJson?.error || `Server returned error status ${response.status}`;
        throw new Error(msg);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.download = `${safeTitle}.${ext}`;
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 3000);

      onSuccessfulDownload();
      setDownloadSuccessId(option.id);
      setTimeout(() => setDownloadSuccessId(null), 3000);
    } catch (err: any) {
      console.error('Download error:', err);
      setDownloadError(err?.message || 'Download could not complete. Please try another quality option.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-7 shadow-2xl border border-zinc-200 dark:border-zinc-800 transition-all space-y-6">
      {/* Top Header Badge & Copy Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <Instagram className="w-3.5 h-3.5" />
            {result.isReel ? 'INSTAGRAM REEL' : 'INSTAGRAM POST'}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            <Sparkles className="w-3 h-3 text-amber-500" /> FULL HD READY
          </span>
        </div>

        <button
          onClick={handleCopyTitle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
        >
          {copiedTitle ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedTitle ? 'Copied!' : 'Copy Caption'}</span>
        </button>
      </div>

      {/* Main Grid: Media Preview + Download Options */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Media Preview */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="relative w-full max-w-[280px] rounded-2xl overflow-hidden shadow-lg border border-zinc-200 dark:border-zinc-800 bg-black aspect-[9/16] flex items-center justify-center group">
            <img
              src={result.cover}
              alt={result.title}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-[10px] font-bold">
                  {result.author.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold truncate">@{result.author.username}</span>
              </div>
              <p className="text-[11px] text-zinc-300 line-clamp-2">{result.title}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Download Options */}
        <div className="md:col-span-7 space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white line-clamp-2">
              {result.title}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              <span>By {result.author.name}</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Direct File Download</span>
            </div>
          </div>

          {/* Download Options List */}
          <div className="space-y-2.5 pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Select Download Format:
            </div>

            {result.downloads.map((opt) => {
              const isDownloading = downloadingId === opt.id;
              const isSuccess = downloadSuccessId === opt.id;

              return (
                <div
                  key={opt.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    opt.recommend
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 shadow-sm'
                      : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        opt.type === 'video'
                          ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'
                          : opt.type === 'audio'
                          ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400'
                          : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {opt.type === 'video' ? (
                        <Film className="w-4 h-4" />
                      ) : opt.type === 'audio' ? (
                        <Music className="w-4 h-4" />
                      ) : (
                        <Image className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {opt.label}
                        </span>
                        {opt.badge && (
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              opt.recommend
                                ? 'bg-rose-500 text-white'
                                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {opt.description}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownload(opt)}
                    disabled={isDownloading}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSuccess
                        ? 'bg-emerald-500 text-white'
                        : opt.recommend
                        ? 'bg-gradient-to-r from-rose-500 via-purple-600 to-amber-500 hover:opacity-90 text-white shadow-sm shadow-rose-500/25'
                        : 'bg-white dark:bg-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-600'
                    }`}
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Custom Filename Field */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
              <span>Save File As:</span>
              <button
                type="button"
                onClick={handleResetFilename}
                className="text-rose-500 hover:underline flex items-center gap-1 cursor-pointer text-[11px]"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>
            <input
              type="text"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-rose-500"
              placeholder="Enter custom file name"
            />
          </div>

          {/* Error message notification banner if any */}
          {downloadError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <span>⚠️ {downloadError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
