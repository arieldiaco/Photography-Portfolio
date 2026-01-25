
import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { AdminConfig } from '../types';

interface LoginProps {
  config: AdminConfig;
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ config, onLogin }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === config.user && pass === config.pass) {
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="pt-32 px-6 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-sm border border-zinc-100">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-zinc-50 rounded-full">
            <Lock size={24} className="text-zinc-400" />
          </div>
        </div>
        <h2 className="text-xl font-medium text-center mb-8">Admin Access</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Username</label>
            <input 
              type="text" 
              value={user} 
              onChange={(e) => { setUser(e.target.value); setError(false); }}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-zinc-900 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Password</label>
            <input 
              type="password" 
              value={pass} 
              onChange={(e) => { setPass(e.target.value); setError(false); }}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-zinc-900 transition-colors"
            />
          </div>
          {error && <p className="text-xs text-red-500 text-center">Invalid credentials</p>}
          <button 
            type="submit"
            className="w-full bg-zinc-900 text-white py-3 rounded-lg font-medium hover:bg-zinc-800 transition-colors mt-4"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};
