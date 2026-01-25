
import React from 'react';
import { Photo } from '../types';

interface GalleryProps {
  photos: Photo[];
  onSelect: (index: number) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ photos, onSelect }) => {
  return (
    <div className="pt-32 px-6 md:px-12 pb-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div 
            key={photo.id} 
            className="aspect-[4/5] bg-zinc-200 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => onSelect(index)}
          >
            <img 
              src={photo.url} 
              alt="Gallery item" 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
      {photos.length === 0 && (
        <div className="text-center py-20 text-zinc-400 font-light">
          Your gallery is currently empty.
        </div>
      )}
    </div>
  );
};
