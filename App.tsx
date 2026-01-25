
import React, { useState, useEffect, useCallback } from 'react';
import { Photo, ContactContent, ViewState, AdminConfig } from './types';
import { Navbar } from './components/Navbar';
import { Home } from './components/Home';
import { Gallery } from './components/Gallery';
import { Contact } from './components/Contact';
import { Admin } from './components/Admin';
import { Login } from './components/Login';
import { INITIAL_CONTACT_HTML } from './constants';
import { saveToDB, getFromDB } from './services/storage';

const STORAGE_KEY_PHOTOS = 'ariel_photos';
const STORAGE_KEY_CONTACT = 'ariel_contact';
const STORAGE_KEY_AUTH = 'ariel_auth';

const DEFAULT_AUTH: AdminConfig = {
  user: 'admin',
  pass: 'admin123'
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [contact, setContact] = useState<ContactContent>({
    html: INITIAL_CONTACT_HTML,
    images: []
  });
  const [adminConfig, setAdminConfig] = useState<AdminConfig>(DEFAULT_AUTH);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentHeroPhoto, setCurrentHeroPhoto] = useState<Photo | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // SEO: Dynamic Title Management
  useEffect(() => {
    let title = "Ariel Diacovetzky | Photo Journal";
    switch (view) {
      case 'gallery':
        title = "Gallery | Ariel Diacovetzky Photo Journal";
        break;
      case 'contact':
        title = "About & Contact | Ariel Diacovetzky";
        break;
      case 'admin':
        title = "Admin Dashboard | Ariel Diacovetzky";
        break;
      case 'home':
        if (currentHeroPhoto?.dateText) {
          title = `${currentHeroPhoto.dateText} | Ariel Diacovetzky`;
        } else {
          title = "Home | Ariel Diacovetzky Photo Journal";
        }
        break;
    }
    document.title = title;
  }, [view, currentHeroPhoto]);

  // Persistence Load
  useEffect(() => {
    const loadData = async () => {
      const savedPhotos = await getFromDB<Photo[]>(STORAGE_KEY_PHOTOS);
      const savedContact = await getFromDB<ContactContent>(STORAGE_KEY_CONTACT);
      const savedAuth = await getFromDB<AdminConfig>(STORAGE_KEY_AUTH);

      if (savedPhotos) setPhotos(savedPhotos);
      if (savedContact) setContact(savedContact);
      if (savedAuth) setAdminConfig(savedAuth);
      
      setIsLoaded(true);
    };
    loadData();
  }, []);

  // Persistence Save
  useEffect(() => {
    if (!isLoaded) return;
    saveToDB(STORAGE_KEY_PHOTOS, photos);
  }, [photos, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveToDB(STORAGE_KEY_CONTACT, contact);
  }, [contact, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveToDB(STORAGE_KEY_AUTH, adminConfig);
  }, [adminConfig, isLoaded]);

  const handleGallerySelect = (index: number) => {
    setView('home');
  };

  const handleHeroPhotoChange = useCallback((photo: Photo) => {
    setCurrentHeroPhoto(photo);
  }, []);

  const renderView = () => {
    if (!isLoaded) return <div className="h-screen flex items-center justify-center bg-zinc-50 font-light text-zinc-400">Loading Journal...</div>;

    switch (view) {
      case 'gallery':
        return <Gallery photos={photos} onSelect={handleGallerySelect} />;
      case 'contact':
        return <Contact content={contact} />;
      case 'admin':
        return isLoggedIn ? (
          <Admin 
            photos={photos} 
            setPhotos={setPhotos} 
            contact={contact} 
            setContact={setContact}
            adminConfig={adminConfig}
            setAdminConfig={setAdminConfig}
            onLogout={() => setIsLoggedIn(false)}
          />
        ) : (
          <Login config={adminConfig} onLogin={() => setIsLoggedIn(true)} />
        );
      case 'home':
      default:
        return <Home photos={photos} onPhotoChange={handleHeroPhotoChange} />;
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar 
        currentView={view} 
        setView={setView} 
        onHome={view === 'home'}
        isDark={currentHeroPhoto?.isHeaderDark || false} 
      />
      {renderView()}
    </div>
  );
};

export default App;
