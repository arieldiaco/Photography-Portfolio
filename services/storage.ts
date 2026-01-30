
import { createClient } from '@supabase/supabase-js';
import { Photo, ContactContent, AdminConfig } from '../types';

// Helper to find variables across different injection methods (Vite, Netlify, process.env)
const findEnvVar = (key: string): string => {
  const viteKey = `VITE_${key}`;
  return (
    (import.meta as any).env?.[viteKey] || 
    (import.meta as any).env?.[key] || 
    (window as any).process?.env?.[viteKey] ||
    (window as any).process?.env?.[key] ||
    ''
  );
};

const supabaseUrl = findEnvVar('SUPABASE_URL');
const supabaseKey = findEnvVar('SUPABASE_KEY');

// Initialize Supabase only if keys exist
export const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const DB_NAME = 'PhotoJournalDB';
const STORE_NAME = 'app_state';

async function getLocalDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveToDB(key: string, data: any): Promise<void> {
  const db = await getLocalDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put(data, key);

  if (supabase) {
    try {
      const { error } = await supabase
        .from('site_data')
        .upsert({ id: key, content: data }, { onConflict: 'id' });
      
      if (error) console.error(`[Cloud Sync] Error saving ${key}:`, error.message);
    } catch (e) {
      console.error(`[Cloud Sync] Network error saving ${key}`);
    }
  }
}

export async function getFromDB<T>(key: string): Promise<T | null> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('site_data')
        .select('content')
        .eq('id', key)
        .maybeSingle();
      
      if (data && !error) return data.content as T;
    } catch (e) {
      console.warn(`[Cloud Sync] Could not reach cloud for ${key}`);
    }
  }

  const db = await getLocalDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
  });
}

export function isCloudEnabled(): boolean {
  return !!supabase;
}

export async function testCloudConnection(): Promise<{ 
  success: boolean; 
  message: string; 
  debug?: { url: string; hasKey: boolean; rawError?: any } 
}> {
  const debugInfo = {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : 'UNDETECTED',
    hasKey: !!supabaseKey,
  };

  if (!supabaseUrl || !supabaseKey) {
    return { 
      success: false, 
      message: "Keys are not detected in the browser session.",
      debug: debugInfo
    };
  }
  
  if (!supabase) {
    return { success: false, message: "Client failed initialization.", debug: debugInfo };
  }

  try {
    const { error } = await supabase.from('site_data').select('id').limit(1);
    if (error) {
      return { 
        success: false, 
        message: `Database connection failed: ${error.message}`, 
        debug: { ...debugInfo, rawError: error } 
      };
    }
    return { success: true, message: "Connected to Supabase successfully.", debug: debugInfo };
  } catch (e: any) {
    return { 
      success: false, 
      message: `Network/System Error: ${e.message || "Unknown"}`, 
      debug: { ...debugInfo, rawError: e } 
    };
  }
}
