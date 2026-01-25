
import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ViewState } from '../types';

interface NavbarProps {
  currentView: ViewState;
  setView: (v: ViewState) => void;
  isDark: boolean;
  onHome: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView, isDark, onHome }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Since Home is now always white, we use dark text for home as well
  const textColor = 'text-zinc-900';
  const bgColor = isOpen ? 'bg-white' : 'bg-transparent';

  const handleNav = (v: ViewState) => {
    setView(v);
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 p-6 md:p-10 flex justify-between items-start pointer-events-none">
      <div className={`pointer-events-auto cursor-pointer transition-colors duration-500`} onClick={() => handleNav('home')}>
        <h1 className={`text-lg md:text-2xl font-light tracking-tight ${textColor}`}>
          Ariel Diacovetzky Photo Journal
        </h1>
      </div>

      <div className="pointer-events-auto relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`transition-colors duration-500 p-2 rounded-full ${isOpen ? 'text-zinc-900' : textColor}`}
        >
          {isOpen ? <X size={32} /> : <Menu size={32} />}
        </button>

        {isOpen && (
          <div className="absolute top-14 right-0 bg-white shadow-2xl rounded-xl p-8 w-56 text-zinc-900 border border-zinc-100">
            <ul className="space-y-5 font-light text-right">
              <li>
                <button 
                  onClick={() => handleNav('home')} 
                  className={`w-full text-right text-lg hover:font-normal transition-all ${currentView === 'home' ? 'font-medium' : ''}`}
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('gallery')} 
                  className={`w-full text-right text-lg hover:font-normal transition-all ${currentView === 'gallery' ? 'font-medium' : ''}`}
                >
                  Gallery
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('contact')} 
                  className={`w-full text-right text-lg hover:font-normal transition-all ${currentView === 'contact' ? 'font-medium' : ''}`}
                >
                  Contact
                </button>
              </li>
              <li className="pt-5 mt-5 border-t border-zinc-100">
                <button 
                  onClick={() => handleNav('admin')} 
                  className={`w-full text-right text-sm text-zinc-400 hover:text-zinc-900 transition-colors`}
                >
                  Admin Panel
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};
