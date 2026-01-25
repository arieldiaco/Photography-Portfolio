
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Photo } from '../types';

interface HomeProps {
  photos: Photo[];
  onPhotoChange: (photo: Photo) => void;
}

export const Home: React.FC<HomeProps> = ({ photos, onPhotoChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (photos.length > 0) {
      onPhotoChange(photos[currentIndex]);
    }
  }, [currentIndex, photos, onPhotoChange]);

  const hasNewer = currentIndex > 0;
  const hasOlder = currentIndex < photos.length - 1;

  const nextPhoto = useCallback(() => {
    if (hasNewer) setCurrentIndex(prev => prev - 1);
  }, [hasNewer]);

  const prevPhoto = useCallback(() => {
    if (hasOlder) setCurrentIndex(prev => prev + 1);
  }, [hasOlder]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        nextPhoto();
      } else if (e.key === 'ArrowRight') {
        prevPhoto();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPhoto, prevPhoto]);

  if (photos.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <p className="text-zinc-400 font-light">No photos to display yet.</p>
      </div>
    );
  }

  const currentPhoto = photos[currentIndex];

  /**
   * Layout Logic:
   * Header Height: ~120px
   * Caption Area: ~80px
   * Margins: ~40px
   * Total non-image vertical space: ~240px
   */
  const verticalOffset = 240;
  const horizontalOffset = 80;

  return (
    <div className="fixed inset-0 w-full h-full bg-white transition-colors duration-500 overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Centered Image + Text Container Wrapper */}
      <div 
        className="relative flex flex-col items-start animate-in fade-in duration-700 ease-out" 
        style={{ 
          // Dynamically constrain width based on aspect ratio vs available viewport height
          width: `min(calc(100vw - ${horizontalOffset}px), calc((100vh - ${verticalOffset}px) * ${currentPhoto.aspectRatio}))`,
        }}
      >
        <div className="w-full shadow-sm bg-zinc-50 border border-zinc-100">
          <img 
            src={currentPhoto.url} 
            alt="Photograph"
            className="w-full h-auto object-contain select-none pointer-events-none"
            key={currentPhoto.id}
          />
        </div>

        {/* Date and Description area - Smaller typography as requested */}
        <div className="mt-4 w-full animate-in fade-in slide-in-from-bottom-1 duration-1000 delay-150">
          {currentPhoto.dateText && (
            <p className="text-[10px] md:text-[11px] font-semibold text-zinc-900 uppercase tracking-[0.2em] mb-1">
              {currentPhoto.dateText}
            </p>
          )}
          {currentPhoto.description && (
            <p className="text-[11px] md:text-xs font-light text-zinc-500 leading-relaxed">
              {currentPhoto.description}
            </p>
          )}
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 md:px-8 z-30 pointer-events-none">
        <div className="w-12 h-12 md:w-20 md:h-20 flex items-center justify-center">
          {hasNewer && (
            <button 
              onClick={nextPhoto}
              className="pointer-events-auto p-2 md:p-4 rounded-full transition-all duration-300 shadow-sm backdrop-blur-md group border border-zinc-100 bg-white/40 text-zinc-400 hover:text-zinc-900 hover:bg-white/90"
              aria-label="Newer photo"
            >
              <ChevronLeft size={28} strokeWidth={1} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        <div className="w-12 h-12 md:w-20 md:h-20 flex items-center justify-center">
          {hasOlder && (
            <button 
              onClick={prevPhoto}
              className="pointer-events-auto p-2 md:p-4 rounded-full transition-all duration-300 shadow-sm backdrop-blur-md group border border-zinc-100 bg-white/40 text-zinc-400 hover:text-zinc-900 hover:bg-white/90"
              aria-label="Older photo"
            >
              <ChevronRight size={28} strokeWidth={1} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
