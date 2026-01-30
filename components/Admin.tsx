
import React, { useState, useEffect } from 'react';
import { 
  Trash2, MoveUp, MoveDown, Plus, Image as ImageIcon, 
  Key, Cloud, CloudOff, Info, ExternalLink, RefreshCcw, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { Photo, ContactContent, AdminConfig } from '../types';
import { analyzeImage } from '../services/geminiService';
import { isCloudEnabled, testCloudConnection, saveToDB } from '../services/storage';

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
  const [activeTab, setActiveTab] = useState<'photos' | 'contact' | 'settings' | 'cloud'>('photos');
  const [newPass, setNewPass] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [cloudStatus, setCloudStatus] = useState<{ loading: boolean; success: boolean; message: string }>({
    loading: true, success: false, message: ''
  });
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    checkCloud();
  }, []);

  const checkCloud = async () => {
    setCloudStatus(prev => ({ ...prev, loading: true }));
    const result = await testCloudConnection();
    setCloudStatus({ loading: false, ...result });
  };

  const handleMigration = async () => {
    if (!cloudStatus.success) return;
    setIsMigrating(true);
    try {
      // Re-save everything to trigger cloud sync
      await saveToDB('ariel_photos', photos);
      await saveToDB('ariel_contact', contact);
      await saveToDB('ariel_auth', adminConfig);
      alert('Local data successfully pushed to Global Cloud!');
    } catch (e) {
      alert('Migration failed. Check console for details.');
    } finally {
      setIsMigrating(false);
    }
  };

  const sanitizeHTML = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const scripts = doc.querySelectorAll('script, iframe, object, embed, link[rel="stylesheet"]');
    scripts.forEach(s => s.remove());
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
    if (confirm('Are you sure? This will remove the photo from everyone\'s view.')) {
      setPhotos(photos.filter(p => p.id !== id));
    }
  };

  return (
    <div className="pt-32 px-6 md:px-12 pb-20 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-zinc-200">
        <div className="flex gap-8 overflow-x-auto scrollbar-hide">
          <button onClick={() => setActiveTab('photos')} className={`pb-4 px-2 whitespace-nowrap transition-colors ${activeTab === 'photos' ? 'border-b-2 border-zinc-900 font-medium' : 'text-zinc-400'}`}>Library</button>
          <button onClick={() => setActiveTab('contact')} className={`pb-4 px-2 whitespace-nowrap transition-colors ${activeTab === 'contact' ? 'border-b-2 border-zinc-900 font-medium' : 'text-zinc-400'}`}>Biography</button>
          <button onClick={() => setActiveTab('settings')} className={`pb-4 px-2 whitespace-nowrap transition-colors ${activeTab === 'settings' ? 'border-b-2 border-zinc-900 font-medium' : 'text-zinc-400'}`}>Security</button>
          <button onClick={() => setActiveTab('cloud')} className={`pb-4 px-2 whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'cloud' ? 'border-b-2 border-zinc-900 font-medium' : 'text-zinc-400'}`}>
            {cloudStatus.success ? <Cloud size={16} className="text-green-500" /> : <CloudOff size={16} className="text-amber-500" />}
            Sync Wizard
          </button>
        </div>
        <button onClick={onLogout} className="text-sm font-medium text-red-500 pb-4 hover:text-red-700 transition-colors">Logout</button>
      </div>

      {activeTab === 'photos' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-light">Your Archive</h2>
            <label className={`cursor-pointer bg-zinc-900 text-white px-6 py-2.5 rounded-full flex items-center gap-2 hover:bg-zinc-800 transition-all ${isUploading ? 'opacity-50' : ''}`}>
              <Plus size={20} />
              {isUploading ? 'Analyzing...' : 'Add New Work'}
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
            </label>
          </div>

          {!cloudStatus.success && !cloudStatus.loading && (
            <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex items-start gap-3 text-amber-800">
              <AlertCircle className="mt-0.5 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold text-sm">Persistence is currently LOCAL-ONLY</p>
                <p className="text-xs opacity-80 mt-1">Changes made now will disappear if you clear your browser cache or visit from another device. Use the <b>Sync Wizard</b> to go global.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {photos.map((photo, idx) => (
              <div key={photo.id} className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-all">
                <div className="w-full md:w-40 aspect-square rounded-xl overflow-hidden bg-zinc-100">
                  <img src={photo.url} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-4">
                  <input 
                    className="w-full text-lg font-light outline-none border-b border-transparent focus:border-zinc-200 pb-1"
                    placeholder="Capture Date..."
                    value={photo.dateText}
                    onChange={(e) => updatePhoto(photo.id, { dateText: e.target.value })}
                  />
                  <textarea 
                    className="w-full text-sm font-light text-zinc-500 outline-none resize-none h-24 bg-zinc-50 p-3 rounded-lg"
                    placeholder="Tell the story behind this image..."
                    value={photo.description}
                    onChange={(e) => updatePhoto(photo.id, { description: e.target.value })}
                  />
                </div>
                <div className="flex flex-row md:flex-col justify-between items-center gap-2">
                  <button onClick={() => deletePhoto(photo.id)} className="p-3 text-red-400 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={20} /></button>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      const newPhotos = [...photos];
                      if (idx > 0) {
                        [newPhotos[idx], newPhotos[idx-1]] = [newPhotos[idx-1], newPhotos[idx]];
                        setPhotos(newPhotos);
                      }
                    }} className="p-2 text-zinc-400 hover:text-zinc-900"><MoveUp size={18} /></button>
                    <button onClick={() => {
                      const newPhotos = [...photos];
                      if (idx < photos.length - 1) {
                        [newPhotos[idx], newPhotos[idx+1]] = [newPhotos[idx+1], newPhotos[idx]];
                        setPhotos(newPhotos);
                      }
                    }} className="p-2 text-zinc-400 hover:text-zinc-900"><MoveDown size={18} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'cloud' && (
        <div className="max-w-3xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-4">
            <h2 className="text-3xl font-light">Global Connectivity Wizard</h2>
            <p className="text-zinc-500 font-light leading-relaxed">
              To make your photography journal visible to the whole world, you need to connect a Supabase database. This bypasses local storage and makes your site truly persistent.
            </p>
          </div>

          <div className={`p-8 rounded-3xl border-2 transition-all ${cloudStatus.success ? 'bg-green-50 border-green-200' : 'bg-white border-zinc-100 shadow-xl'}`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-5">
                <div className={`p-4 rounded-2xl ${cloudStatus.success ? 'bg-green-500 text-white' : 'bg-amber-100 text-amber-600'}`}>
                  {cloudStatus.success ? <Cloud size={32} /> : <CloudOff size={32} />}
                </div>
                <div>
                  <h3 className="text-xl font-medium">{cloudStatus.success ? 'Global Sync Active' : 'Local Mode Only'}</h3>
                  <p className="text-sm opacity-70">
                    {cloudStatus.loading ? 'Verifying connection...' : cloudStatus.message}
                  </p>
                </div>
              </div>
              <button onClick={checkCloud} className="flex items-center gap-2 text-zinc-400 hover:text-zinc-900 transition-colors text-sm font-medium">
                <RefreshCcw size={16} className={cloudStatus.loading ? 'animate-spin' : ''} />
                Refresh Status
              </button>
            </div>

            {cloudStatus.success && photos.length > 0 && (
              <div className="mt-8 pt-8 border-t border-green-200/50">
                <h4 className="font-medium text-green-900 mb-2">Sync Found Local Data</h4>
                <p className="text-sm text-green-700 mb-4">You have {photos.length} photos in your current local session. Would you like to push them to the global cloud so others can see them?</p>
                <button 
                  onClick={handleMigration}
                  disabled={isMigrating}
                  className="bg-green-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-green-700 transition-all flex items-center gap-2"
                >
                  {isMigrating ? 'Syncing...' : 'Push Local to Global Cloud'}
                  {!isMigrating && <RefreshCcw size={14} />}
                </button>
              </div>
            )}

            {!cloudStatus.success && (
              <div className="space-y-8 mt-4 animate-in fade-in duration-700">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2"><CheckCircle2 size={18} className="text-zinc-400" /> 1. Create Supabase Account</h4>
                  <p className="text-sm text-zinc-500 ml-7">Sign up for free at <a href="https://supabase.com" target="_blank" className="text-blue-600 underline">supabase.com</a>. Create a project named 'PhotoJournal'.</p>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2"><CheckCircle2 size={18} className="text-zinc-400" /> 2. Run Database Script</h4>
                  <p className="text-sm text-zinc-500 ml-7">Open the <b>SQL Editor</b> in your Supabase project and run this:</p>
                  <pre className="ml-7 bg-zinc-900 text-zinc-300 p-4 rounded-xl text-xs overflow-x-auto select-all">
{`CREATE TABLE IF NOT EXISTS site_data (
  id TEXT PRIMARY KEY,
  content JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow everyone to read and write (simple for portfolio apps)
ALTER TABLE site_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read/Write" ON site_data FOR ALL USING (true);`}
                  </pre>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2"><CheckCircle2 size={18} className="text-zinc-400" /> 3. Update Netlify Environment</h4>
                  <p className="text-sm text-zinc-500 ml-7">In Netlify, go to <b>Site Settings > Environment Variables</b> and add:</p>
                  <div className="ml-7 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 bg-zinc-100 rounded border border-zinc-200">SUPABASE_URL</div>
                    <div className="p-2 bg-zinc-100 rounded border border-zinc-200">SUPABASE_KEY</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Biography and Security Tabs remained simplified and clean as before */}
      {activeTab === 'contact' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="space-y-6">
            <h3 className="text-xl font-light">Biography</h3>
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 space-y-4 shadow-sm min-h-[400px]">
               <div 
                 contentEditable
                 className="outline-none prose prose-zinc max-w-none font-light leading-relaxed p-2 min-h-[300px]"
                 onBlur={(e) => setContact({ ...contact, html: sanitizeHTML(e.currentTarget.innerHTML) })}
                 dangerouslySetInnerHTML={{ __html: contact.html }}
               />
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-xl font-light">Profile Images</h3>
            <div className="grid grid-cols-2 gap-5">
              {contact.images.map((img, idx) => (
                <div key={idx} className="relative aspect-square bg-zinc-100 rounded-xl overflow-hidden border border-zinc-100">
                   <img src={img} className="w-full h-full object-cover" />
                   <button onClick={() => setContact({ ...contact, images: contact.images.filter((_, i) => i !== idx) })} className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full"><Trash2 size={16} /></button>
                </div>
              ))}
              <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-50 transition-colors">
                <Plus className="text-zinc-300" size={32} />
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                   const file = e.target.files?.[0];
                   if (!file) return;
                   const r = new FileReader();
                   r.onload = (ev) => setContact({...contact, images: [...contact.images, ev.target?.result as string]});
                   r.readAsDataURL(file);
                }} />
              </label>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-md animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h3 className="text-xl font-light mb-6">Access Control</h3>
          <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
            <form onSubmit={(e) => {
              e.preventDefault();
              setAdminConfig({ ...adminConfig, pass: newPass });
              setSaveStatus('Password saved globally!');
              setNewPass('');
              setTimeout(() => setSaveStatus(''), 3000);
            }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-2">Change Admin Password</label>
                <div className="relative">
                  <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="New Password" className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-zinc-900" />
                  <Key size={18} className="absolute left-4 top-3.5 text-zinc-400" />
                </div>
              </div>
              <button type="submit" disabled={newPass.length < 4} className="w-full bg-zinc-900 text-white py-3.5 rounded-xl font-medium hover:bg-zinc-800 disabled:opacity-50 transition-all">Update Access</button>
              {saveStatus && <p className="text-xs text-green-600 text-center mt-2">{saveStatus}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
