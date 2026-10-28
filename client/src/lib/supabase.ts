/// <reference types="vite/client" />
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// 支援 Vercel 環境變數覆寫（VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY），未設定時使用內建預設值
const DEFAULT_SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  'https://zexwhzgxunfnbschkizq.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  'sb_publishable_OPftLOAUJFzwKZ8eK7GIXg_2LEEMMwn';

const STORAGE_KEY_URL = 'ws_supabase_url';
const STORAGE_KEY_ANON = 'ws_supabase_anon_key';

function getStoredConfig(): { url: string; anonKey: string } {
  if (typeof window === 'undefined') {
    return { url: DEFAULT_SUPABASE_URL, anonKey: DEFAULT_SUPABASE_ANON_KEY };
  }
  const url = localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_SUPABASE_URL;
  const anonKey = localStorage.getItem(STORAGE_KEY_ANON) || DEFAULT_SUPABASE_ANON_KEY;
  return { url, anonKey };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  const { url, anonKey } = getStoredConfig();
  if (!supabaseInstance) {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseInstance;
}

export function resetSupabaseClient() {
  supabaseInstance = null;
}

export function updateSupabaseConfig(url: string, anonKey: string) {
  localStorage.setItem(STORAGE_KEY_URL, url);
  localStorage.setItem(STORAGE_KEY_ANON, anonKey);
  resetSupabaseClient();
}

export function getSupabaseConfig() {
  return getStoredConfig();
}

export const WS_IMAGES_BUCKET = 'ws-images';

export function getPublicImageUrl(filePath: string): string {
  const { url } = getStoredConfig();
  return `${url}/storage/v1/object/public/${WS_IMAGES_BUCKET}/${filePath}`;
}

export function isTableNotExistError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: string }).code;
  const message = (error as { message?: string }).message || '';
  if (code === '42P01') return true;
  if (code === 'PGRST204') return true;
  if (message.includes('does not exist') && message.includes('WS_')) return true;
  if (message.includes('relation') && message.includes('does not exist')) return true;
  if (message.includes('Could not find the table') && message.includes('WS_')) return true;
  if (message.includes('schema cache') && message.includes('WS_')) return true;
  return false;
}

export function extractErrorMessage(error: unknown): string {
  if (!error) return '發生未知錯誤';
  if (typeof error === 'string') return error;
  const err = error as { message?: string; error_description?: string; code?: string };
  return err.message || err.error_description || err.code || '發生未知錯誤';
}
