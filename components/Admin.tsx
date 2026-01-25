
import React, { useState } from 'react';
import { Trash2, MoveUp, MoveDown, Plus, Image as ImageIcon, Key, Calendar, AlignLeft, ShieldCheck } from 'lucide-react';
import { Photo, ContactContent, AdminConfig } from '../types';
import { analyzeImage } from '../services/geminiService';

interface AdminProps {
  photos: Photo[];
  setPhotos: (p: Photo[]) => void;
  contact: ContactContent;
  setContact: (c: ContactContent) => void;
  adminConfig: AdminConfig;
  setAdminConfig: (cfg: AdminConfig) => void;
  onLogout: () => void;
}

export const Admin: React.FC<AdminProps> = ({ 
  photos, setPhotos, contact, setContact, adminConfig, setAdminConfig, onLogout 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'photos' | 'contact' | 'settings'>('photos');
  const [newPass, setNewPass] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  // Security: Simple HTML Sanitizer to prevent XSS
  const sanitizeHTML = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const scripts = doc.querySelectorAll('script, iframe, object, embed, link[rel="stylesheet"]');
    scripts.forEach(s => s.remove());
    
    // Remove inline event handlers
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(el => {
      const attrs = el.attributes;
      for (let i = attrs.length - 1; i >= 0; i--) {
        if (attrs[i].name.startsWith('on')) {
          el.removeAttribute(attrs[i].name);
        }
      }
    });
    
    return doc.body.innerHTML;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const analysis = await analyzeImage(base64);
        
        const img = new Image();
        img.src = base64;
        img.onload = () => {
          const newPhoto: Photo = {
            id: Date.now().toString(),
            url: base64,
            timestamp: Date.now(),
            dominantColor: analysis.hexColor || '#ffffff',
            isHeaderDark: analysis.isDark || false,
            aspectRatio: img.width / img.height,
            width: img.width,
            height: img.height,
            dateText: '',
            description: ''
          };
          setPhotos([newPhoto, ...photos]);
          setIsUploading(false);
        };
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setIsUploading(false);
    }
  };

  const updatePhoto = (id: string, updates: Partial<Photo>) => {
    setPhotos(photos.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePhoto = (id: string) => {
    if (confirm('Are you sure you want to delete this photo from your journal?')) {
      const updatedPhotos = photos.filter(p => p.id !== id);
      setPhotos(updatedPhotos);
    }
  };

  const movePhoto = (index: number, direction: 'up' | 'down') => {
    const newPhotos = [...photos];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= photos.length) return;
    [newPhotos[index], newPhotos[target]] = [newPhotos[target], newPhotos[index]];
    setPhotos(newPhotos);
  };

  const handleContactBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const cleanHTML = sanitizeHTML(e.currentTarget.innerHTML);
    setContact({ ...contact, html: cleanHTML });
  };

  const updatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 4) return;
    setAdminConfig({ ...adminConfig, pass: newPass });
    setSaveStatus('Password updated successfully!');
    setNewPass('');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  return (
    <div className="pt-32 px-6 md:px-12 pb-20 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8 border-b border-zinc-200">
        <div className="flex gap-8 overflow-x-auto scrollbar-hide">
          <button onClick={() => setActiveTab('photos')} className={`pb-4 px-2 whitespace-nowrap transition-colors ${activeTab === 'photos' ? 'border-b-2 border-zinc-900 font-medium' : 'text-zinc-400'}`}>Photos Library</button>
          <button onClick={() => setActiveTab('contact')} className={`pb-4 px-2 whitespace-nowrap transition-colors ${activeTab === 'contact' ? 'border-b-2 border-zinc-900 font-medium' : 'text-zinc-400'}`}>Contact Information</button>
          <button onClick={() => setActiveTab('settings')} className={`pb-4 px-2 whitespace-nowrap transition-colors ${activeTab === 'settings' ? 'border-b-2 border-zinc-900 font-medium' : 'text-zinc-400'}`}>Security Settings</button>
        </div>
        <button onClick={onLogout} className="text-sm font-medium text-red-500 pb-4 hover:text-red-700 transition-colors">Logout</button>
      </div>

      {activeTab === 'photos' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-light">Library Content ({photos.length})</h2>
            <label className={`cursor-pointer bg-zinc-900 text-white px-6 py-2.5 rounded-full flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-sm ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
              <Plus size={20} />
              {isUploading ? 'Processing Image...' : 'Upload Photo'}
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
            </label>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl divide-y divide-zinc-100 overflow-hidden shadow-sm">
            {photos.map((photo, idx) => (
              <div key={photo.id} className="p-6 flex flex-col md:flex-row md:items-start gap-6 group hover:bg-zinc-50 transition-colors">
                <div className="w-full md:w-32 h-32 flex-shrink-0 bg-zinc-100 rounded-lg overflow-hidden border border-zinc-100">
                  <img src={photo.url} alt="Thumbnail" className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5 mb-1.5">
                        <Calendar size={12} /> Date Reference
                      </label>
                      <input 
                        type="text" 
                        value={photo.dateText || ''} 
                        onChange={(e) => updatePhoto(photo.id, { dateText: e.target.value })}
                        placeholder="e.g. May 2024"
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:border-zinc-900 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5 mb-1.5">
                        <AlignLeft size={12} /> Description
                      </label>
                      <textarea 
                        value={photo.description || ''} 
                        onChange={(e) => updatePhoto(photo.id, { description: e.target.value.slice(0, 350) })}
                        placeholder="Brief story about the capture..."
                        rows={3}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:border-zinc-900 outline-none transition-all resize-none"
                      />
                      <div className="text-right text-[10px] text-zinc-400 mt-1">
                        {(photo.description?.length || 0)}/350
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-end items-end gap-4">
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-300 font-mono mb-1">REF: {photo.id}</p>
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-3 h-3 rounded-full border border-zinc-200" style={{ backgroundColor: photo.dominantColor }} />
                        <span className="text-[10px] text-zinc-400 font-medium">{photo.width} × {photo.height}px</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                       <button onClick={() => movePhoto(idx, 'up')} disabled={idx === 0} className="p-2 text-zinc-400 hover:text-zinc-900 disabled:opacity-20 transition-colors"><MoveUp size={18} /></button>
                       <button onClick={() => movePhoto(idx, 'down')} disabled={idx === photos.length - 1} className="p-2 text-zinc-400 hover:text-zinc-900 disabled:opacity-20 transition-colors"><MoveDown size={18} /></button>
                       <button onClick={() => deletePhoto(photo.id)} className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"><Trash2 size={20} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'contact' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="space-y-6">
            <h3 className="text-xl font-light">Biography & Statement</h3>
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 space-y-4 shadow-sm">
               <div className="flex gap-3 border-b border-zinc-100 pb-3 flex-wrap">
                 <button onClick={() => document.execCommand('bold')} className="p-2 hover:bg-zinc-100 rounded-md font-bold transition-colors">B</button>
                 <button onClick={() => document.execCommand('italic')} className="p-2 hover:bg-zinc-100 rounded-md italic transition-colors">I</button>
                 <button onClick={() => document.execCommand('underline')} className="p-2 hover:bg-zinc-100 rounded-md underline transition-colors">U</button>
                 <div className="w-px h-6 bg-zinc-200 self-center mx-1" />
                 <button onClick={() => document.execCommand('fontSize', false, '5')} className="p-2 hover:bg-zinc-100 rounded-md transition-colors">Text +</button>
                 <button onClick={() => document.execCommand('fontSize', false, '3')} className="p-2 hover:bg-zinc-100 rounded-md transition-colors">Text -</button>
               </div>
               <div 
                 contentEditable
                 className="min-h-[400px] outline-none prose prose-zinc max-w-none font-light leading-relaxed p-2"
                 onBlur={handleContactBlur}
                 dangerouslySetInnerHTML={{ __html: contact.html }}
               />
               <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-2 px-2">
                 <ShieldCheck size={12} className="text-green-500" /> Content is automatically sanitized for safety
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-light">Profile Images</h3>
              <label className="cursor-pointer bg-zinc-100 text-zinc-600 hover:bg-zinc-200 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
                <ImageIcon size={18} /> Add Image
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                   const file = e.target.files?.[0];
                   if (!file) return;
                   const r = new FileReader();
                   r.onload = (ev) => setContact({...contact, images: [...contact.images, ev.target?.result as string]});
                   r.readAsDataURL(file);
                }} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-5">
              {contact.images.map((img, idx) => (
                <div key={idx} className="relative aspect-square bg-zinc-100 rounded-xl overflow-hidden group shadow-sm border border-zinc-100">
                   <img src={img} className="w-full h-full object-cover" />
                   <button onClick={() => setContact({ ...contact, images: contact.images.filter((_, i) => i !== idx) })} className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-md animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h3 className="text-xl font-light mb-6">Administrator Access</h3>
          <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
            <form onSubmit={updatePassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-2">Change Password</label>
                <div className="relative">
                  <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Min 4 chars" className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-zinc-900 transition-all" />
                  <Key size={18} className="absolute left-4 top-3.5 text-zinc-400" />
                </div>
              </div>
              <button type="submit" disabled={newPass.length < 4} className="w-full bg-zinc-900 text-white py-3.5 rounded-xl font-medium hover:bg-zinc-800 transition-all disabled:opacity-50 shadow-md">Update Credentials</button>
              {saveStatus && <p className="text-xs text-green-600 text-center mt-2">{saveStatus}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
