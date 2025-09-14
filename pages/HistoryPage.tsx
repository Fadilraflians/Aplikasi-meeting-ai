import React, { useEffect, useMemo, useState } from 'react';
import { Page, type Booking } from '../types';
import { BackArrowIcon } from '../components/icons';
import { ApiService } from '../src/config/api';
import { getHistory } from '../services/historyService';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  onNavigate: (page: Page) => void;
}

const HistoryPage: React.FC<Props> = ({ onNavigate }) => {
  const [serverBookings, setServerBookings] = useState<any[]>([]);
  const [mongoBookings, setMongoBookings] = useState<any[]>([]);
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const { t } = useLanguage();


  useEffect(() => {
    const userDataStr = localStorage.getItem('user_data');
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    const userId = userData?.id;
    // Jika user tidak punya ID, tampilkan data kosong
    if (!userId) {
        console.log('User baru detected - showing empty history');
        setServerBookings([]);
        setMongoBookings([]);
        return;
    }
    ApiService.getUserBookings(userId).then(res=> setServerBookings(res.data||[])).catch(()=>setServerBookings([]));
    ApiService.getUserAIBookingsMongo(userId).then(res=> setMongoBookings(res.data||[])).catch(()=>setMongoBookings([]));
  }, []);

    const items = useMemo(() => {
    // hanya tampilkan histori (Selesai/Dibatalkan) yang tersimpan lokal, EXCLUDE expired
    const local = getHistory();
    console.log('HistoryPage - All history entries:', local);
    console.log('HistoryPage - Selected date:', date);
    
    const filtered = local.filter(h => h.date === date && h.status !== 'expired');
    console.log('HistoryPage - Filtered entries for date (excluding expired):', filtered);
    
    const sorted = filtered.sort((a,b)=> (a.time>b.time?1:-1));
    console.log('HistoryPage - Final sorted entries:', sorted);
    
    return sorted;
  }, [date]);

  return (
    <div className="bg-white/80 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-lg">
      <div className="flex items-center mb-6">
        <button onClick={() => onNavigate(Page.Dashboard)} className="mr-4 p-2 rounded-full hover:bg-gray-200">
          <BackArrowIcon />
        </button>
        <h2 className="text-3xl font-bold text-gray-800">{t('dashboard.bookingHistory')}</h2>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <input type="date" value={date} onChange={e=> setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="p-3 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-cyan-500 focus:border-cyan-500" />
        <div className="text-gray-600 self-center">Menampilkan pemesanan (dibatalkan & selesai) pada tanggal yang dipilih.</div>
      </div>

      <div className="space-y-4">
        {items.length === 0 && (
          <div className="text-center py-10 bg-gray-50 rounded-xl border">Tidak ada histori pada tanggal ini.</div>
        )}
        {items.map((h:any)=> {
          console.log('HistoryPage - Rendering item:', h);
          console.log('HistoryPage - Item status:', h.status);
          console.log('HistoryPage - Should show View Rispat button:', h.status === 'expired');
          
          return (
          <div key={`${h.id}-${h.savedAt || ''}`} className="bg-white p-5 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v3H3V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1ZM3 10h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8Zm4 3a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2H7Z"/></svg>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 leading-tight">{h.topic || '—'}</h4>
                  <p className="text-gray-600 text-sm">{h.roomName}</p>
                  {h.pic && h.pic !== '-' && (
                    <p className="text-gray-500 text-xs mt-1">PIC: {h.pic}</p>
                  )}
                  {h.participants && (
                    <p className="text-gray-500 text-xs">Peserta: {h.participants} orang</p>
                  )}
                </div>
              </div>
              <div className="text-right text-sm">
                <span className={`inline-block px-3 py-1 rounded-full font-semibold ${
                  h.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700' : 
                  h.status === 'expired' ? 'bg-orange-100 text-orange-700' :
                  'bg-rose-100 text-rose-700'
                }`}>{h.status === 'expired' ? 'Expired' : h.status}</span>
                <div className="text-gray-500 mt-1">
                  {h.date} {String(h.time).slice(0,5)}
                  {h.endTime && (
                    <span className="ml-1">- {String(h.endTime).slice(0,5)}</span>
                  )}
                  {h.status === 'expired' && h.completedAt && (
                    <div className="text-xs text-orange-600 mt-1">
                      Expired: {new Date(h.completedAt).toLocaleString('id-ID')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>

    </div>
  );
};

export default HistoryPage;


