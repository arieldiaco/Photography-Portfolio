
export interface Photo {
  id: string;
  url: string; 
  timestamp: number;
  dominantColor: string; 
  isHeaderDark: boolean; 
  aspectRatio: number;
  width: number;
  height: number;
  dateText?: string;
  description?: string;
}

export interface ContactContent {
  html: string;
  images: string[];
}

export interface AdminConfig {
  user: string;
  pass: string;
}

export type ViewState = 'home' | 'gallery' | 'contact' | 'admin';
