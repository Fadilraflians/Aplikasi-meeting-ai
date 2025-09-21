export type HistoryStatus = 'Selesai' | 'Dibatalkan' | 'expired';

export interface HistoryEntry {
  id: string | number;
  roomName: string;
  topic: string;
  date: string;
  time: string;
  endTime?: string;
  participants: number;
  pic?: string;
  status: HistoryStatus;
  savedAt: string; // ISO timestamp
  completedAt?: string; // ISO timestamp for expired bookings
  source?: string; // 'server' or 'ai'
  cancelReason?: string; // Alasan pembatalan
  rispatFiles?: Array<{
    id: number;
    file_name: string;
    original_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
    uploaded_by: string;
    uploaded_at: string;
  }>; // Data rispat yang dibackup
}

const STORAGE_KEY = 'booking_history';

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (Array.isArray(list)) return list as HistoryEntry[];
    return [];
  } catch {
    return [];
  }
}

export function addHistory(entry: Omit<HistoryEntry, 'savedAt'>) {
  const list = getHistory();
  
  // Check for duplicates before adding
  const isDuplicate = list.some(existing => 
    existing.id === entry.id && 
    existing.topic === entry.topic && 
    existing.date === entry.date && 
    existing.time === entry.time && 
    existing.roomName === entry.roomName &&
    existing.status === entry.status
  );
  
  if (isDuplicate) {
    console.log('🚫 Duplicate history entry prevented:', entry.topic);
    return;
  }
  
  const saved: HistoryEntry = { ...entry, savedAt: new Date().toISOString() };
  list.unshift(saved);
  // Keep last 200
  const trimmed = list.slice(0, 200);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}



