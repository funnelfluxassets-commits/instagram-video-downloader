import React, { useState, useMemo } from 'react';
import {
  Download,
  Play,
  Copy,
  Check,
  Sparkles,
  Film,
  FileVideo,
  FileAudio,
  AlertCircle,
  RotateCcw,
  Tag,
  CheckCircle2,
  Loader2,
  Instagram,
  ImageIcon,
} from 'lucide-react';
import { InstagramMediaResult, DownloadOption } from '../types';

interface ResultCardProps {
  result: InstagramMediaResult;
  onSuccessfulDownload: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, onSuccessfulDownload }) => {
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [selectedDownloadId, setSelectedDownloadId] = useState<string | null>(
    () => result.downloads.find((d) => d.recommend)?.id || result.downloads[0]?.id || null
  );

  const cleanForFilename = (str: string): string => {
    return str
      .replace(/[^\w\s-]/gi, '')
      .replace(/[\s_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80);
  };

  const titleSlug = useMemo(() => {
    const raw = result.title || '';
    const cleaned = cleanForFilename(raw);
    return cleaned || 'instagram_video';
  }, [result.title]);

  const authorSlug = useMemo(() => {
    return cleanForFilename(result.author.username || result.author.name || 'instagram_creator');
  }, [result.author.username, result.author.name]);

  const presetCreatorCaption = useMemo(() => {
    return `${authorSlug}_${titleSlug}`;
  }, [authorSlug, titleSlug]);

  const presetCaptionOnly = useMemo(() => {
    return titleSlug;
  }, [titleSlug]);

  const presetCreatorId = useMemo(() => {
    return `${authorSlug}_${result.id}`;
  }, [authorSlug, result.id]);

  const [customFilename, setCustomFilename] = useState<string>(presetCreatorCaption);

  const handleCopyCaption = () => {
    if (result.title) {
      navigator.clipboard.writeText(result.title);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    }
  };

  const handleTriggerDownload = async (option: DownloadOption) => {
    setDownloadingId(option.id);
    setDownloadError(null);

    try {
      const baseName = cleanForFilename(customFilename.trim()) || presetCreatorCaption;
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
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              <Instagram className="w-3 h-3 text-rose-500" />
              {result.isReel ? 'Instagram Reel (9:16)' : 'Instagram Post'}
            </span>

            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Full HD Ready
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white line-clamp-2 leading-snug">
            {result.title}
          </h2>

          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              @{result.author.username || result.author.name}
            </span>
            <span>•</span>
            <span className="text-emerald-500 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Direct File Download (Zero Ads)
            </span>
          </div>
        </div>

        <button
          onClick={handleCopyCaption}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 px-3 py-1.5 rounded-xl transition-colors shrink-0 cursor-pointer self-start"
          title="Copy Caption"
        >
          {copiedCaption ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedCaption ? 'Copied' : 'Copy Caption'}</span>
        </button>
      </div>

      {/* Media Preview & Download Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Interactive Responsive Video Player Preview */}
        <div className="md:col-span-5 relative rounded-2xl overflow-hidden bg-black shadow-lg border border-zinc-200 dark:border-zinc-800 aspect-[9/16] max-h-[460px] mx-auto w-full max-w-[280px]">
          {isPlayingVideo ? (
            <iframe
              src={`https://www.instagram.com/p/${result.id}/embed/`}
              title={result.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <div className="relative w-full h-full group cursor-pointer" onClick={() => setIsPlayingVideo(true)}>
              <img
                src={result.cover}
                alt={result.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-black/35 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                <button
                  id="play-video-preview-btn"
                  className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  title="Click to Play Reel"
                >
                  <Play className="w-6 h-6 fill-white translate-x-0.5" />
                </button>
              </div>

              <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg">
                <Play className="w-3 h-3 fill-white" />
                <span>Click to Play Reel</span>
              </span>
            </div>
          )}
        </div>

        {/* Quality Selector & Direct Download Options */}
        <div className="md:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Film className="w-4 h-4 text-rose-500" />
              <span>Select Download Quality:</span>
            </h3>
            <span className="text-xs text-zinc-400">Direct to Downloads</span>
          </div>

          {/* List of Formats with Consistent Card Sizing & Zero Height Shifts */}
          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
            {result.downloads.map((option) => {
              const isSelected = selectedDownloadId === option.id;
              const isDownloading = downloadingId === option.id;
              const isSuccess = downloadSuccessId === option.id;

              return (
                <div
                  key={option.id}
                  onClick={() => setSelectedDownloadId(option.id)}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 min-h-[72px] ${
                    isSelected
                      ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 ring-2 ring-rose-500/20'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        option.type === 'audio'
                          ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                          : option.type === 'thumbnail' || option.type === 'photo'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {option.type === 'audio' ? (
                        <FileAudio className="w-4.5 h-4.5" />
                      ) : option.type === 'thumbnail' || option.type === 'photo' ? (
                        <ImageIcon className="w-4.5 h-4.5" />
                      ) : (
                        <FileVideo className="w-4.5 h-4.5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">
                          {option.label}
                        </span>
                        {option.badge && (
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              option.recommend
                                ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white'
                                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {option.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                        {option.description}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTriggerDownload(option);
                    }}
                    disabled={isDownloading}
                    className={`min-w-[84px] sm:min-w-[92px] h-9 sm:h-10 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-wait ${
                      isSuccess
                        ? 'bg-emerald-500 text-white'
                        : option.recommend
                        ? 'bg-gradient-to-r from-rose-500 via-purple-600 to-amber-500 hover:opacity-90 text-white shadow-sm shadow-rose-500/25'
                        : 'bg-white dark:bg-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-600'
                    }`}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : isSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Filename Customization & Presets */}
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-zinc-400" />
                <span>Custom Filename:</span>
              </span>
              <button
                type="button"
                onClick={() => setCustomFilename(presetCreatorCaption)}
                className="text-rose-500 hover:underline flex items-center gap-1 cursor-pointer text-[11px]"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            <input
              type="text"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-rose-500"
              placeholder="Enter custom file name"
            />

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-zinc-400">Presets:</span>
              <button
                type="button"
                onClick={() => setCustomFilename(presetCreatorCaption)}
                className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer truncate max-w-[140px]"
              >
                Author + Title
              </button>
              <button
                type="button"
                onClick={() => setCustomFilename(presetCaptionOnly)}
                className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer truncate max-w-[120px]"
              >
                Title Only
              </button>
              <button
                type="button"
                onClick={() => setCustomFilename(presetCreatorId)}
                className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer truncate max-w-[120px]"
              >
                Author + ID
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {downloadError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{downloadError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
