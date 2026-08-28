import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import zlib from 'zlib';
import { execFile, exec } from 'child_process';
import util from 'util';
import { initializeApp, cert } from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

const execFileAsync = util.promisify(execFile);
const execAsync = util.promisify(exec);

// Initialize Firebase Admin SDK if service account is provided
let db: Firestore | null = null;
try {
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountEnv) {
    const serviceAccount = JSON.parse(serviceAccountEnv);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    initializeApp({
      credential: cert(serviceAccount),
    });
    db = getFirestore();
    console.log('--- Firebase Firestore: INITIALIZED ---');
  }
} catch (err: any) {
  console.warn('--- Firebase Firestore: using fallback store ---', err?.message);
}

const app = express();
app.use(express.json());

// ─── yt-dlp Binary Management ────────────────────────────────────────────────
const YTDLP_TMP_PATH = '/tmp/yt-dlp';
const YTDLP_DOWNLOAD_URL =
  'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux';

let ytdlpReadyPath: string | null = null;
let ytdlpSetupPromise: Promise<string> | null = null;

async function downloadFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading yt-dlp`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buffer);
}

async function ensureYtDlp(): Promise<string> {
  if (ytdlpReadyPath) return ytdlpReadyPath;
  if (ytdlpSetupPromise) return ytdlpSetupPromise;

  ytdlpSetupPromise = (async () => {
    // 1. Try system yt-dlp first
    try {
      const { stdout } = await execAsync('yt-dlp --version', { timeout: 5000 });
      console.log('[yt-dlp] Using system yt-dlp', stdout.trim());
      ytdlpReadyPath = 'yt-dlp';
      return 'yt-dlp';
    } catch {
      console.log('[yt-dlp] System yt-dlp not found, setting up...');
    }

    // 2. Try /tmp/yt-dlp if already cached
    if (fs.existsSync(YTDLP_TMP_PATH)) {
      try {
        const { stdout } = await execFileAsync(YTDLP_TMP_PATH, ['--version'], { timeout: 15000 });
        console.log('[yt-dlp] Using cached /tmp/yt-dlp', stdout.trim());
        ytdlpReadyPath = YTDLP_TMP_PATH;
        return YTDLP_TMP_PATH;
      } catch {
        try { fs.unlinkSync(YTDLP_TMP_PATH); } catch {}
      }
    }

    // 3. Download yt-dlp to /tmp
    console.log('[yt-dlp] Downloading yt-dlp to /tmp...');
    await downloadFile(YTDLP_DOWNLOAD_URL, YTDLP_TMP_PATH);
    fs.chmodSync(YTDLP_TMP_PATH, '755');

    const { stdout: version } = await execFileAsync(YTDLP_TMP_PATH, ['--version'], { timeout: 20000 });
    console.log('[yt-dlp] Downloaded & verified:', version.trim());
    ytdlpReadyPath = YTDLP_TMP_PATH;
    return YTDLP_TMP_PATH;
  })();

  return ytdlpSetupPromise;
}

// ─── FFmpeg Binary Management ────────────────────────────────────────────────
const FFMPEG_TMP_PATH = '/tmp/ffmpeg';
const FFMPEG_LINUX_URL =
  'https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-linux-x64.gz';

let ffmpegReadyPath: string | null = null;
let ffmpegSetupPromise: Promise<string> | null = null;

async function ensureFfmpeg(): Promise<string> {
  if (ffmpegReadyPath) return ffmpegReadyPath;
  if (ffmpegSetupPromise) return ffmpegSetupPromise;

  ffmpegSetupPromise = (async () => {
    // 1. Try system ffmpeg in PATH
    try {
      await execAsync('ffmpeg -version', { timeout: 5000 });
      console.log('[ffmpeg] Using system ffmpeg');
      ffmpegReadyPath = 'ffmpeg';
      return 'ffmpeg';
    } catch {
      console.log('[ffmpeg] System ffmpeg not found, checking alternatives...');
    }

    // 2. Try ffmpeg-static package
    try {
      const ffmpegStaticPkg = (await import('ffmpeg-static')).default;
      if (ffmpegStaticPkg && fs.existsSync(ffmpegStaticPkg)) {
        console.log('[ffmpeg] Using ffmpeg-static package:', ffmpegStaticPkg);
        ffmpegReadyPath = ffmpegStaticPkg;
        return ffmpegStaticPkg;
      }
    } catch (e: any) {
      console.log('[ffmpeg] ffmpeg-static package check:', e?.message);
    }

    // 3. Try cached /tmp/ffmpeg
    if (fs.existsSync(FFMPEG_TMP_PATH)) {
      try {
        await execFileAsync(FFMPEG_TMP_PATH, ['-version'], { timeout: 5000 });
        console.log('[ffmpeg] Using cached /tmp/ffmpeg');
        ffmpegReadyPath = FFMPEG_TMP_PATH;
        return FFMPEG_TMP_PATH;
      } catch {
        try { fs.unlinkSync(FFMPEG_TMP_PATH); } catch {}
      }
    }

    // 4. Download and gunzip static ffmpeg to /tmp/ffmpeg
    console.log('[ffmpeg] Downloading static ffmpeg to /tmp/ffmpeg...');
    const res = await fetch(FFMPEG_LINUX_URL, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status} downloading ffmpeg`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uncompressed = zlib.gunzipSync(buffer);
    fs.writeFileSync(FFMPEG_TMP_PATH, uncompressed);
    fs.chmodSync(FFMPEG_TMP_PATH, '755');

    await execFileAsync(FFMPEG_TMP_PATH, ['-version'], { timeout: 10000 });
    console.log('[ffmpeg] Downloaded & verified /tmp/ffmpeg');
    ffmpegReadyPath = FFMPEG_TMP_PATH;
    return FFMPEG_TMP_PATH;
  })();

  return ffmpegSetupPromise;
}

// ─── Instagram Cookies (optional for private/restricted access) ─────────────
const COOKIES_PATH = '/tmp/ig-cookies.txt';
let cookiesWritten = false;

function ensureCookiesFile(): string[] {
  const cookiesEnv = process.env.INSTAGRAM_COOKIES || process.env.COOKIES_TXT;
  if (!cookiesEnv) return [];

  try {
    if (!cookiesWritten) {
      let content = cookiesEnv;
      if (!content.includes('\n')) {
        content = content.split('\\n').join('\n');
      }
      fs.writeFileSync(COOKIES_PATH, content, 'utf-8');
      cookiesWritten = true;
      console.log('[yt-dlp] Instagram cookies configured');
    }
    return ['--cookies', COOKIES_PATH];
  } catch (err: any) {
    console.warn('[yt-dlp] Failed to write cookies:', err?.message);
    return [];
  }
}

// Pre-warm binaries
ensureYtDlp().catch((e) => console.warn('[yt-dlp] Setup warning:', e?.message));
ensureFfmpeg().catch((e) => console.warn('[ffmpeg] Setup warning:', e?.message));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitizeFilename(name: string): string {
  const cleaned = name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/[\s_]+/g, '_')
    .trim()
    .slice(0, 100);
  return cleaned || 'instagram_media';
}

function parseInstagramUrl(inputUrl: string): { mediaId: string; isReel: boolean; cleanUrl: string } | null {
  try {
    const trimmed = inputUrl.trim();
    const reelMatch = trimmed.match(/instagram\.com\/(?:reel|reels|share\/reel)\/([a-zA-Z0-9_-]+)/i);
    if (reelMatch) {
      return { mediaId: reelMatch[1], isReel: true, cleanUrl: `https://www.instagram.com/reel/${reelMatch[1]}/` };
    }
    const postMatch = trimmed.match(/instagram\.com\/(?:p|tv)\/([a-zA-Z0-9_-]+)/i);
    if (postMatch) {
      return { mediaId: postMatch[1], isReel: false, cleanUrl: `https://www.instagram.com/p/${postMatch[1]}/` };
    }
    if (/^[a-zA-Z0-9_-]{10,15}$/.test(trimmed)) {
      return { mediaId: trimmed, isReel: true, cleanUrl: `https://www.instagram.com/reel/${trimmed}/` };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Signup Notification System ───────────────────────────────────────────────
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'funnelflux.assets@gmail.com';

async function sendSignupNotification(params: {
  appName: string;
  email: string;
  name?: string;
  req?: express.Request;
}) {
  const { appName, email, name, req } = params;
  const userName = name || email.split('@')[0];
  const dateStr = new Date().toUTCString();

  const country = (req?.headers['x-vercel-ip-country'] as string) || (req?.headers['cf-ipcountry'] as string) || 'Global';
  const city = (req?.headers['x-vercel-ip-city'] as string) || '';
  const locationStr = city ? `${city}, ${country}` : String(country);
  const userAgent = (req?.headers['user-agent'] as string) || '';

  let deviceType = 'Desktop';
  if (/iPhone|iPad|iPod/i.test(userAgent)) deviceType = 'Apple iOS (iPhone/iPad)';
  else if (/Android/i.test(userAgent)) deviceType = 'Android Mobile';
  else if (/Macintosh|Mac OS X/i.test(userAgent)) deviceType = 'Apple Mac';
  else if (/Windows/i.test(userAgent)) deviceType = 'Windows PC';

  console.log(`[Notification] 🚀 New Signup on ${appName}: ${email} (${userName}) from ${locationStr} [${deviceType}]`);

  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background: linear-gradient(135deg, #E1306C, #833AB4); padding: 24px 32px; color: #ffffff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">🚀 New User Registered</h2>
            <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.9;">${appName} • ${dateStr}</p>
          </div>
          <div style="padding: 24px 32px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #71717a; font-size: 13px; font-weight: 600; width: 130px;">Full Name</td>
                <td style="padding: 10px 0; color: #18181b; font-size: 14px; font-weight: 700;">${userName}</td>
              </tr>
              <tr style="border-top: 1px solid #f4f4f5;">
                <td style="padding: 10px 0; color: #71717a; font-size: 13px; font-weight: 600;">Email Address</td>
                <td style="padding: 10px 0; color: #18181b; font-size: 14px; font-weight: 700;"><a href="mailto:${email}" style="color: #E1306C; text-decoration: none;">${email}</a></td>
              </tr>
              <tr style="border-top: 1px solid #f4f4f5;">
                <td style="padding: 10px 0; color: #71717a; font-size: 13px; font-weight: 600;">Application</td>
                <td style="padding: 10px 0; color: #E1306C; font-size: 14px; font-weight: 700;">${appName}</td>
              </tr>
              <tr style="border-top: 1px solid #f4f4f5;">
                <td style="padding: 10px 0; color: #71717a; font-size: 13px; font-weight: 600;">Location</td>
                <td style="padding: 10px 0; color: #18181b; font-size: 14px;">${locationStr}</td>
              </tr>
              <tr style="border-top: 1px solid #f4f4f5;">
                <td style="padding: 10px 0; color: #71717a; font-size: 13px; font-weight: 600;">Device / OS</td>
                <td style="padding: 10px 0; color: #18181b; font-size: 14px;">${deviceType}</td>
              </tr>
            </table>
            <div style="margin-top: 24px; text-align: center;">
              <a href="https://console.firebase.google.com" style="display: inline-block; background: #18181b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 600;">Open Firebase Dashboard →</a>
            </div>
          </div>
        </div>
      `;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${appName} <onboarding@resend.dev>`,
          to: [NOTIFICATION_EMAIL],
          subject: `🚀 New User: ${userName} on ${appName}`,
          html: htmlBody,
        }),
      });
      console.log(`[Notification] Email notification dispatched to ${NOTIFICATION_EMAIL}`);
    } catch (e: any) {
      console.warn('[Notification] Resend email error:', e?.message);
    }
  }

  const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🚀 **New User Registered on ${appName}!**\n👤 **Name:** ${userName}\n✉️ **Email:** ${email}\n🌍 **Location:** ${locationStr}\n💻 **Device:** ${deviceType}\n⏰ **Time:** ${dateStr}`,
        }),
      });
    } catch (e: any) {
      console.warn('[Notification] Webhook error:', e?.message);
    }
  }
}

// ─── Instagram Media Extraction ───────────────────────────────────────────────

async function extractInstagramMedia(targetUrl: string) {
  const parsed = parseInstagramUrl(targetUrl);
  if (!parsed) {
    throw new Error('Invalid Instagram URL. Please enter a valid Instagram Reel, Video, or Post link.');
  }

  const { mediaId, isReel, cleanUrl } = parsed;
  const ytdlpBin = await ensureYtDlp();
  const cookieArgs = ensureCookiesFile();

  // Run yt-dlp dump JSON
  const args = [
    '--dump-json',
    '--no-playlist',
    '--no-warnings',
    ...cookieArgs,
    cleanUrl,
  ];

  let mediaInfo: any;
  try {
    const { stdout } = await execFileAsync(ytdlpBin, args, { timeout: 25000 });
    mediaInfo = JSON.parse(stdout.trim());
  } catch (err: any) {
    console.warn('[yt-dlp] Extraction fallback triggered:', err?.message);
    // Fallback info if dump-json was blocked
    mediaInfo = {
      id: mediaId,
      title: `Instagram ${isReel ? 'Reel' : 'Video'}`,
      uploader: 'Instagram Creator',
      thumbnail: `https://www.instagram.com/p/${mediaId}/media/?size=l`,
      duration: 0,
    };
  }

  const title = mediaInfo.description || mediaInfo.title || (isReel ? 'Instagram Reel' : 'Instagram Video');
  const cleanTitle = title.length > 80 ? title.substring(0, 80) + '...' : title;
  const authorName = mediaInfo.uploader || mediaInfo.channel || 'Instagram Creator';
  const authorUsername = mediaInfo.uploader_id || authorName.replace(/[^\w]/g, '').toLowerCase();
  const coverUrl = mediaInfo.thumbnail || `https://www.instagram.com/p/${mediaId}/media/?size=l`;

  const downloads: any[] = [
    {
      id: 'ig_1080p_fhd',
      label: '1080p Full HD (Recommended)',
      quality: '1080',
      description: 'Original high-definition MP4 video with crisp audio',
      badge: '1080p FULL HD',
      type: 'video',
      url: cleanUrl,
      extension: 'mp4',
      recommend: true,
    },
    {
      id: 'ig_720p_hd',
      label: '720p HD (Fast Download)',
      quality: '720',
      description: 'Standard HD MP4 — quick to save and share',
      badge: '720p HD',
      type: 'video',
      url: cleanUrl,
      extension: 'mp4',
      recommend: false,
    },
    {
      id: 'ig_audio_mp3',
      label: 'Download Audio (MP3)',
      quality: 'audio',
      description: 'Extract background song or voice soundtrack as 320kbps MP3',
      badge: 'MP3 AUDIO',
      type: 'audio',
      url: cleanUrl,
      extension: 'mp3',
      recommend: false,
    },
    {
      id: 'ig_thumbnail',
      label: 'Download HD Cover Artwork',
      quality: 'thumb',
      description: 'Full-resolution video artwork image in JPG',
      badge: 'HD IMAGE',
      type: 'thumbnail',
      url: coverUrl,
      extension: 'jpg',
      recommend: false,
    },
  ];

  return {
    id: mediaId,
    title: cleanTitle,
    duration: mediaInfo.duration || 0,
    durationFormatted: isReel ? 'Reel' : 'Video',
    cover: coverUrl,
    author: {
      name: authorName,
      username: authorUsername,
      profileUrl: `https://www.instagram.com/${authorUsername}/`,
    },
    stats: {
      likes: mediaInfo.like_count || 0,
      comments: mediaInfo.comment_count || 0,
      views: mediaInfo.view_count || 0,
    },
    isReel,
    aspectRatio: isReel ? ('9:16' as const) : ('1:1' as const),
    downloads,
    originalUrl: cleanUrl,
    extractedAt: Date.now(),
  };
}

// ─── API: /api/debug ──────────────────────────────────────────────────────────

app.get('/api/debug', async (_req, res) => {
  const info: any = {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    cwd: process.cwd(),
    tmpExists: fs.existsSync('/tmp'),
    ytdlpTmpExists: fs.existsSync(YTDLP_TMP_PATH),
    ytdlpReadyPath,
    ffmpegTmpExists: fs.existsSync(FFMPEG_TMP_PATH),
    ffmpegReadyPath,
  };

  try {
    const bin = await ensureYtDlp();
    info.ytdlpBin = bin;
    const { stdout } = await execFileAsync(bin, ['--version'], { timeout: 15000 });
    info.ytdlpVersion = stdout.trim();
  } catch (e: any) {
    info.ytdlpError = e?.message?.slice(0, 300);
  }

  try {
    const ffBin = await ensureFfmpeg();
    info.ffmpegBin = ffBin;
    const { stdout } = await execFileAsync(ffBin, ['-version'], { timeout: 10000 });
    info.ffmpegVersion = stdout.trim().split('\n')[0];
  } catch (e: any) {
    info.ffmpegError = e?.message?.slice(0, 300);
  }

  return res.json(info);
});

// ─── API: /api/extract ────────────────────────────────────────────────────────

app.post('/api/extract', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ success: false, error: 'Please provide a valid Instagram Reel or Video URL.' });
    }
    const result = await extractInstagramMedia(url.trim());
    return res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Instagram extraction error:', err);
    return res.status(400).json({ success: false, error: err?.message || 'Failed to extract Instagram video.' });
  }
});

// ─── API: /api/proxy-download ────────────────────────────────────────────────

app.get('/api/proxy-download', async (req, res) => {
  try {
    const { url, id, quality, type, filename, ext } = req.query;

    const safeFilename = sanitizeFilename(typeof filename === 'string' ? filename : 'instagram_media');
    let fileExt = typeof ext === 'string' ? ext.replace('.', '').toLowerCase() : 'mp4';

    // ── 1. Thumbnail / Photo Image download ──────────────────────────────────
    if (type === 'thumbnail' || type === 'photo' || (typeof url === 'string' && (url.includes('.jpg') || url.includes('.webp') || url.includes('.png')))) {
      const imgUrl = typeof url === 'string' ? url.trim() : '';
      if (!imgUrl) return res.status(400).json({ error: 'Missing image URL.' });

      const imgRes = await fetch(imgUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.instagram.com/' },
      });
      if (!imgRes.ok) return res.status(404).json({ error: 'Image not found.' });

      const buffer = await imgRes.arrayBuffer();
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.jpg"`);
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Length', String(buffer.byteLength));
      return res.end(Buffer.from(buffer));
    }

    // ── 2. Video / Audio download via yt-dlp + FFmpeg ─────────────────────────
    const targetUrl = typeof url === 'string' && url.trim() ? url.trim() : (typeof id === 'string' ? `https://www.instagram.com/reel/${id}/` : '');
    if (!targetUrl) return res.status(400).json({ error: 'Missing media URL.' });

    const isAudio = type === 'audio' || fileExt === 'mp3';
    const qualityStr = typeof quality === 'string' ? quality : '1080';
    if (isAudio) fileExt = 'mp3';

    let ytdlpBin: string;
    let ffmpegBin: string;
    try {
      const [yt, ff] = await Promise.all([
        Promise.race([
          ensureYtDlp(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('yt-dlp setup timeout')), 50000)),
        ]),
        Promise.race([
          ensureFfmpeg(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('ffmpeg setup timeout')), 50000)),
        ]),
      ]);
      ytdlpBin = yt;
      ffmpegBin = ff;
    } catch (setupErr: any) {
      console.error('[setup] Failed:', setupErr?.message);
      return res.status(503).json({ error: 'Download engine is initialising. Please try again in 15 seconds.' });
    }

    const cookieArgs = ensureCookiesFile();
    const tempFileId = `ig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const tmpFile = path.join('/tmp', `${tempFileId}.${fileExt}`);

    let ytdlpArgs: string[];
    if (isAudio) {
      ytdlpArgs = [
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '--ffmpeg-location', ffmpegBin,
        '-o', tmpFile,
        '--no-playlist',
        '--js-runtimes', 'node',
        ...cookieArgs,
        targetUrl,
      ];
    } else {
      const isShortsVideo = req.query.isShorts === '1';
      const qNum = parseInt(qualityStr, 10) || 1080;
      let maxHeight = isShortsVideo ? (qNum === 720 ? 1280 : 1920) : (qNum === 720 ? 720 : 1080);
      let maxWidth = isShortsVideo ? (qNum === 720 ? 720 : 1080) : (qNum === 720 ? 1280 : 1920);

      const h264Vid = `bestvideo[vcodec^=avc][height<=${maxHeight}][width<=${maxWidth}]`;
      const fallbackVid = `bestvideo[height<=${maxHeight}][width<=${maxWidth}]`;
      const format = `${h264Vid}+bestaudio[acodec^=mp4a]/${h264Vid}+bestaudio/${fallbackVid}+bestaudio/best`;

      ytdlpArgs = [
        '-f', format,
        '--merge-output-format', 'mp4',
        '--ffmpeg-location', ffmpegBin,
        '--postprocessor-args', 'ffmpeg:-movflags +faststart',
        '-o', tmpFile,
        '--no-playlist',
        '--js-runtimes', 'node',
        ...cookieArgs,
        targetUrl,
      ];
    }

    console.log('[yt-dlp] Downloading Instagram media:', ytdlpArgs.join(' '));
    try {
      await execFileAsync(ytdlpBin, ytdlpArgs, { timeout: 45000 });
    } catch (execErr: any) {
      const errDetail = (execErr?.stderr || execErr?.message || 'unknown error').slice(0, 300);
      console.error('[yt-dlp] Exec error:', errDetail);

      let userFriendlyMsg = 'Could not process media download.';
      if (errDetail.includes('not granting access') || errDetail.includes('empty media response') || errDetail.includes('Sign in') || errDetail.includes('cookies')) {
        userFriendlyMsg = 'Instagram requires session authentication. Please add INSTAGRAM_COOKIES to Vercel Environment Variables.';
      }
      return res.status(500).json({ error: userFriendlyMsg, detail: errDetail });
    }

    let actualFile = tmpFile;
    if (!fs.existsSync(actualFile)) {
      if (fs.existsSync(`${tmpFile}.mp3`)) actualFile = `${tmpFile}.mp3`;
      else if (fs.existsSync(`${tmpFile}.mp4`)) actualFile = `${tmpFile}.mp4`;
    }

    if (!fs.existsSync(actualFile)) {
      return res.status(500).json({ error: 'Failed to generate media file.' });
    }

    if (!isAudio) {
      const fixedFile = path.join('/tmp', `${tempFileId}_play.mp4`);
      try {
        console.log('[ffmpeg] Transcoding Instagram media to universal H.264 (yuv420p) + AAC for QuickTime...');
        await execFileAsync(ffmpegBin, [
          '-y',
          '-i', actualFile,
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-crf', '22',
          '-pix_fmt', 'yuv420p',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-movflags', '+faststart',
          fixedFile,
        ], { timeout: 35000 });

        if (fs.existsSync(fixedFile) && fs.statSync(fixedFile).size > 0) {
          try { fs.unlinkSync(actualFile); } catch {}
          actualFile = fixedFile;
          console.log('[ffmpeg] Transcode successful, output size:', fs.statSync(actualFile).size);
        }
      } catch (ffErr: any) {
        console.warn('[ffmpeg] libx264 transcode warning, attempting safe copy:', ffErr?.message);
        try {
          await execFileAsync(ffmpegBin, [
            '-y',
            '-i', actualFile,
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-movflags', '+faststart',
            fixedFile,
          ], { timeout: 20000 });
          if (fs.existsSync(fixedFile) && fs.statSync(fixedFile).size > 0) {
            try { fs.unlinkSync(actualFile); } catch {}
            actualFile = fixedFile;
          }
        } catch (copyErr: any) {
          console.warn('[ffmpeg] copy fallback failed:', copyErr?.message);
        }
      }
    }

    const stat = fs.statSync(actualFile);
    if (stat.size === 0) {
      try { fs.unlinkSync(actualFile); } catch {}
      return res.status(500).json({ error: 'Generated file is empty.' });
    }

    const contentType = isAudio ? 'audio/mpeg' : 'video/mp4';
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.${fileExt}"`);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', String(stat.size));
    res.setHeader('Cache-Control', 'no-cache');

    const readStream = fs.createReadStream(actualFile);
    readStream.pipe(res);

    const cleanup = () => {
      try {
        if (fs.existsSync(actualFile)) fs.unlinkSync(actualFile);
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
      } catch {}
    };

    res.on('finish', cleanup);
    res.on('close', cleanup);
    readStream.on('error', (err) => {
      console.error('[stream] File read error:', err);
      cleanup();
      if (!res.headersSent) res.status(500).json({ error: 'Stream interrupted.' });
    });
  } catch (err: any) {
    console.error('Download proxy error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream media file.', detail: err?.message });
    }
  }
});

// ─── API: /api/proxy-stream ──────────────────────────────────────────────────

app.get('/api/proxy-stream', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Missing stream URL' });
    }

    const streamRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Referer: 'https://www.instagram.com/',
      },
    });

    if (!streamRes.ok) {
      return res.status(streamRes.status).json({ error: 'Stream source unavailable' });
    }

    const contentType = streamRes.headers.get('content-type') || 'video/mp4';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const arrayBuffer = await streamRes.arrayBuffer();
    return res.end(Buffer.from(arrayBuffer));
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to proxy media stream' });
  }
});

// ─── Auth APIs ────────────────────────────────────────────────────────────────

const inMemoryUsers = new Map<string, any>();

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, name } = req.body || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = typeof name === 'string' && name.trim() ? name.trim() : undefined;
    const now = Date.now();
    const userData = { email: cleanEmail, name: cleanName, createdAt: now, lastLoginAt: now };

    let isNewUser = false;
    if (db) {
      try {
        const ref = db.collection('users').doc(cleanEmail);
        const doc = await ref.get();
        if (!doc.exists) {
          await ref.set(userData);
          isNewUser = true;
        } else {
          await ref.update({ lastLoginAt: now, ...(cleanName ? { name: cleanName } : {}) });
        }
      } catch { /* non-fatal */ }
    } else {
      if (!inMemoryUsers.has(cleanEmail)) isNewUser = true;
    }
    inMemoryUsers.set(cleanEmail, userData);

    if (isNewUser) {
      sendSignupNotification({ appName: 'InstaDownloader', email: cleanEmail, name: cleanName, req }).catch(() => {});
    }

    return res.json({ success: true, user: { email: cleanEmail, name: cleanName, createdAt: now } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to process account.' });
  }
});

app.get('/api/auth/verify', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'Email parameter required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    if (db) {
      try {
        const doc = await db.collection('users').doc(cleanEmail).get();
        if (doc.exists) {
          const data = doc.data();
          return res.json({ success: true, user: { email: cleanEmail, name: data?.name, createdAt: data?.createdAt } });
        }
      } catch { /* non-fatal */ }
    }
    const local = inMemoryUsers.get(cleanEmail);
    if (local) return res.json({ success: true, user: local });
    return res.json({ success: true, user: { email: cleanEmail, createdAt: Date.now() } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Verification failed.' });
  }
});

// ─── Local Dev Server ─────────────────────────────────────────────────────────

if (!process.env.VERCEL) {
  const bootstrap = async () => {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req, r) => r.sendFile(path.join(distPath, 'index.html')));
    }
    const PORT = process.env.PORT || 3000;
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`InstaDownloader Server on http://0.0.0.0:${PORT}`);
    });
  };
  bootstrap();
}

export default app;
