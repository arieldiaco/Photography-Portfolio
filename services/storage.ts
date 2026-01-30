
import { createClient } from '@supabase/supabase-js';
import { Photo, ContactContent, AdminConfig } from '../types';

const getEnv = (key: string): string => {
  try {
    return (import.meta as any).env?.[`VITE_${key}`] || (window as any).process?.env?.[key] || '';
  } catch {
    return '';
  }
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_KEY');

// Initialize Supabase only if keys exist
export const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const DB_NAME = 'PhotoJournalDB';
const STORE_NAME = 'app_state';

async function getLocalDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2); // Bumped version for reliability
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
  // 1. Save locally for instant feedback
  const db = await getLocalDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put(data, key);

  // 2. Sync to Cloud
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
  // Priority 1: Fetch from Cloud (Global State)
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('site_data')
        .select('content')
        .eq('id', key)
        .maybeSingle();
      
      if (data && !error) return data.content as T;
    } catch (e) {
      console.warn(`[Cloud Sync] Could not reach cloud for ${key}, falling back to local.`);
    }
  }

  // Priority 2: Fallback to Local
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

/**
 * Verifies if the cloud connection is actually working (permissions and keys)
 */
export async function testCloudConnection(): Promise<{ success: boolean; message: string }> {
  if (!supabase) return { success: false, message: "No API keys found in environment." };
  try {
    const { error } = await supabase.from('site_data').select('id').limit(1);
    if (error) return { success: false, message: error.message };
    return { success: true, message: "Connected to Supabase successfully." };
  } catch (e: any) {
    return { success: false, message: e.message || "Network Error" };
  }
}
