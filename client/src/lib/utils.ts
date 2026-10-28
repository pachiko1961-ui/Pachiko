import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 顯示時區：固定使用台灣時間（UTC+8），不受瀏覽器或伺服器時區影響
const DISPLAY_TIME_ZONE = 'Asia/Taipei';

/**
 * 格式化日期（僅顯示年月日），固定台灣時區
 * 例：2026/10/28
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('zh-TW', {
    timeZone: DISPLAY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 格式化日期與時間，固定台灣時區
 * 例：2026/10/28 14:30
 */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString('zh-TW', {
    timeZone: DISPLAY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const time = d.toLocaleTimeString('zh-TW', {
    timeZone: DISPLAY_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${date} ${time}`;
}
