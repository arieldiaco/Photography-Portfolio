
import React from 'react';
import { ContactContent } from '../types';

interface ContactProps {
  content: ContactContent;
}

export const Contact: React.FC<ContactProps> = ({ content }) => {
  return (
    <div className="pt-32 px-6 md:px-12 pb-20 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <div 
          className="prose prose-zinc prose-lg font-light leading-relaxed contact-content-display"
          dangerouslySetInnerHTML={{ __html: content.html }}
        />
        
        <div className="space-y-8">
          {content.images.map((img, idx) => (
            <div key={idx} className="bg-zinc-100 overflow-hidden shadow-sm">
              <img src={img} alt={`Contact ${idx}`} className="w-full h-auto" />
            </div>
          ))}
          {content.images.length === 0 && (
             <div className="h-96 bg-zinc-100 animate-pulse rounded flex items-center justify-center text-zinc-300">
               Photo display
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
