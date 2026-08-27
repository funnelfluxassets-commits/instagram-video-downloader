export interface DownloadOption {
  id: string;
  label: string;
  quality: string;
  description: string;
  badge?: string;
  type: 'video' | 'audio' | 'thumbnail' | 'photo';
  url: string;
  extension: 'mp4' | 'mp3' | 'jpg';
  recommend?: boolean;
  slideIndex?: number;
}

export interface InstagramMediaResult {
  id: string;
  title: string;
  duration: number;
  durationFormatted: string;
  cover: string;
  originCover?: string;
  author: {
    name: string;
    username: string;
    avatar?: string;
    profileUrl?: string;
  };
  stats?: {
    views?: number;
    likes?: number;
    comments?: number;
  };
  isReel: boolean;
  aspectRatio: '9:16' | '1:1' | '4:5' | '16:9';
  downloads: DownloadOption[];
  originalUrl: string;
  extractedAt: number;
  carouselItems?: {
    type: 'image' | 'video';
    url: string;
    thumbnail: string;
  }[];
}

export interface UserAccount {
  email: string;
  name?: string;
  createdAt: number;
  avatar?: string;
}
