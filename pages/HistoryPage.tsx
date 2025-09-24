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
    ApiService.getUserBookings(userId, true).then(res=> setServerBookings(res.data||[])).catch(()=>setServerBookings([]));
    ApiService.getUserAIBookingsMongo(userId).then(res=> setMongoBookings(res.data||[])).catch(()=>setMongoBookings([]));
  }, []);

    const items = useMemo(() => {
    // Gabungkan data dari localStorage dan server
    const local = getHistory();
    console.log('HistoryPage - All history entries:', local);
    console.log('HistoryPage - Server bookings:', serverBookings);
    console.log('HistoryPage - Selected date:', date);
    
    // Filter data lokal dengan status 'Selesai' atau 'Dibatalkan' (EXCLUDE expired)
    const localFiltered = local.filter(h => h.date === date && h.status !== 'expired').sort((a, b) => {
      // Sort local data by time (newest first)
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      return timeB.localeCompare(timeA);
    });
    
    // Filter data server untuk tanggal yang sama dan status complete/cancelled
    const serverFiltered = serverBookings.filter(booking => {
      const bookingDate = booking.meeting_date || booking.date;
      const isCompleteOrCancelled = booking.booking_state === 'COMPLETED' || 
                                   booking.booking_state === 'CANCELLED' ||
                                   booking.status === 'completed' ||
                                   booking.status === 'cancelled';
      return bookingDate === date && isCompleteOrCancelled;
    }).sort((a, b) => {
      // Sort server data by time (newest first)
      const timeA = a.start_time || a.time || '00:00';
      const timeB = b.start_time || b.time || '00:00';
      return timeB.localeCompare(timeA);
    });
    
    // Gabungkan dan format data
    const combinedItems = [
      ...localFiltered.map(item => ({
        ...item,
        source: 'local'
      })),
      ...serverFiltered.map(booking => ({
        id: booking.id,
        roomName: booking.room_name,
        topic: booking.topic,
        date: booking.meeting_date || booking.date,
        time: booking.start_time || booking.time,
        endTime: booking.end_time,
        participants: booking.participants,
        pic: booking.pic,
        status: booking.booking_state === 'COMPLETED' || booking.status === 'completed' ? 'Selesai' : 
                booking.booking_state === 'CANCELLED' || booking.status === 'cancelled' ? 'Dibatalkan' : 'Selesai',
        cancelReason: booking.cancel_reason || booking.cancelReason,
        source: 'server'
      }))
    ];
    
    // Remove duplicates berdasarkan ID (handle ai_ prefix)
    const uniqueItems = combinedItems.filter((item, index, self) => 
      index === self.findIndex(t => 
        String(t.id).replace('ai_', '') === String(item.id).replace('ai_', '')
      )
    );
    
    const sorted = uniqueItems.sort((a,b)=> {
      // Normalize time format and create proper datetime
      const normalizeTime = (timeStr) => {
        if (!timeStr) return '00:00';
        // If time is in HH:MM:SS format, take only HH:MM
        if (timeStr.includes(':') && timeStr.split(':').length === 3) {
          return timeStr.substring(0, 5);
        }
        return timeStr;
      };
      
      const normalizeDate = (dateStr) => {
        if (!dateStr) return new Date().toISOString().split('T')[0];
        // Ensure date is in YYYY-MM-DD format
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        return dateStr;
      };
      
      const timeA = normalizeTime(a.time);
      const timeB = normalizeTime(b.time);
      const dateA = normalizeDate(a.date);
      const dateB = normalizeDate(b.date);
      
      // Create datetime objects for comparison
      const datetimeA = new Date(dateA + ' ' + timeA);
      const datetimeB = new Date(dateB + ' ' + timeB);
      
      // Debug logging (can be removed in production)
      // console.log('Sorting:', {
      //   a: { date: a.date, normalizedDate: dateA, time: a.time, normalizedTime: timeA, datetime: datetimeA },
      //   b: { date: b.date, normalizedDate: dateB, time: b.time, normalizedTime: timeB, datetime: datetimeB },
      //   result: datetimeB.getTime() - datetimeA.getTime()
      // });
      
      // Sort in descending order (newest first)
      return datetimeB.getTime() - datetimeA.getTime();
    });
    console.log('HistoryPage - Final combined entries:', sorted);
    
    return sorted;
  }, [date, serverBookings]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-cyan-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-3xl shadow-xl border border-white/20">
          {/* Header dengan gradient */}
          <div className="flex items-center mb-8">
            <button 
              onClick={() => onNavigate(Page.Dashboard)} 
              className="mr-4 p-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <BackArrowIcon />
            </button>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {t('history.title')}
              </h2>
              <p className="text-gray-600 mt-1">{t('history.subtitle')}</p>
            </div>
          </div>

          {/* Date picker dengan desain yang lebih menarik */}
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    {t('history.selectDate')}
                  </span>
                </label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e=> setDate(e.target.value)} 
                  className="w-full p-4 bg-white border-2 border-blue-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-blue-300 text-lg font-medium" 
                />
              </div>
              <div className="text-gray-600 text-center md:text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="font-semibold">{t('history.bookingStatus')}</span>
                </div>
                <p className="text-sm">{t('history.statusDescription')}</p>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="space-y-6">
            {items.length === 0 && (
              <div className="text-center py-16 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('history.noHistory')}</h3>
                <p className="text-gray-500">{t('history.noHistoryDesc')}</p>
              </div>
            )}
            
            {items.map((h:any)=> {
              console.log('HistoryPage - Rendering item:', h);
              console.log('HistoryPage - Item status:', h.status);
              console.log('HistoryPage - Should show View Rispat button:', h.status === 'expired');
              
              const isCompleted = h.status === 'Selesai';
              const isExpired = h.status === 'expired';
              const statusColor = isCompleted ? 'green' : isExpired ? 'orange' : 'red';
              const statusIcon = isCompleted ? '✅' : isExpired ? '⏰' : '❌';
              
              return (
                <div key={`${h.id}-${h.savedAt || ''}`} className="group bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Status Icon */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                        isCompleted 
                          ? 'bg-green-50 border-green-200 text-green-600' 
                          : isExpired
                          ? 'bg-orange-50 border-orange-200 text-orange-600'
                          : 'bg-red-50 border-red-200 text-red-600'
                      }`}>
                        <span className="text-xl">{statusIcon}</span>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="text-lg font-bold text-gray-800 leading-tight mb-1">
                              {h.topic || '—'}
                            </h4>
                            <p className="text-gray-600 font-medium">{h.roomName}</p>
                          </div>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            isCompleted 
                              ? 'bg-green-100 text-green-700 border border-green-200' 
                              : isExpired
                              ? 'bg-orange-100 text-orange-700 border border-orange-200'
                              : 'bg-red-100 text-red-700 border border-red-200'
                          }`}>
                            {h.status === 'expired' ? 'Expired' : h.status}
                          </span>
                        </div>
                        
                        {/* Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {h.pic && h.pic !== '-' && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                              <span className="font-medium">PIC:</span>
                              <span>{h.pic}</span>
                            </div>
                          )}
                          {h.participants && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                              <span className="font-medium">Peserta:</span>
                              <span>{h.participants} orang</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                            <span className="font-medium">Tanggal:</span>
                            <span>{h.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            <span className="font-medium">Waktu:</span>
                            <span>
                              {String(h.time).slice(0,5)}
                              {h.endTime && ` - ${String(h.endTime).slice(0,5)}`}
                            </span>
                          </div>
                        </div>
                        
                        {/* Additional info for cancelled bookings */}
                        {!isCompleted && !isExpired && h.cancelReason && (
                          <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-start gap-2 text-red-700 text-sm">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1"></span>
                              <div>
                                <span className="font-medium">{t('history.cancelReason')}:</span>
                                <p className="mt-1 text-red-600">{h.cancelReason}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Additional info for expired bookings */}
                        {h.status === 'expired' && h.completedAt && (
                          <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="flex items-center gap-2 text-orange-700 text-sm">
                              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                              <span className="font-medium">{t('history.expired')}:</span>
                              <span>{new Date(h.completedAt).toLocaleString('id-ID')}</span>
                            </div>
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
      </div>
    </div>
  );
};

export default HistoryPage;


