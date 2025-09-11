
import React, { useEffect, useMemo, useState } from 'react';
import { Page, type Booking } from '../types';
import { BackArrowIcon } from '../components/icons';
import { ApiService } from '../src/config/api';
import { addHistory } from '../services/historyService';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useLanguage } from '../contexts/LanguageContext';

const ReservationListItem: React.FC<{ booking: Booking, onCancel: (id: number) => void, onDetail: (b: Booking) => void, onComplete: (b: Booking) => void }> = ({ booking, onCancel, onDetail, onComplete }) => {
  const { isDarkMode } = useDarkMode();
  const { t } = useLanguage();
  const getRoomImage = (roomName?: string, imageUrl?: string) => {
    // Jika ada image_url dari database, gunakan itu
    if (imageUrl && imageUrl !== '/images/meeting-rooms/default-room.jpg') {
      return imageUrl;
    }
    
    // Fallback ke mapping berdasarkan nama ruangan untuk ruangan lama
    if (!roomName) return '/images/meeting-rooms/default-room.jpg';
    const name = roomName.toLowerCase();
    
    // Gunakan file JPEG yang sesuai dengan halaman meeting room
    if (name.includes('samudrantha')) return '/images/meeting-rooms/r1.jpeg';
    if (name.includes('nusantara')) return '/images/meeting-rooms/r2.jpeg';
    if (name.includes('garuda')) return '/images/meeting-rooms/r3.jpeg';
    if (name.includes('jawadwipa 1') || name.includes('jawadwipa1')) return '/images/meeting-rooms/r4.jpeg';
    if (name.includes('jawadwipa 2') || name.includes('jawadwipa2') || name.includes('auditorium jawadwipa 2')) return '/images/meeting-rooms/r5.jpeg';
    if (name.includes('kalamant') || name.includes('kalamanthana')) return '/images/meeting-rooms/r6.jpeg';
    if (name.includes('cedaya')) return '/images/meeting-rooms/r7.jpeg';
    if (name.includes('celebes')) return '/images/meeting-rooms/r8.jpeg';
    if (name.includes('balidwipa')) return '/images/meeting-rooms/r9.jpeg';
    if (name.includes('swarnadwipa')) return '/images/meeting-rooms/r10.jpeg';
    if (name.includes('borobudur')) return '/images/meeting-rooms/r11.jpeg';
    if (name.includes('komodo')) return '/images/meeting-rooms/r12.jpeg';
    if (name.includes('nusantara')) return '/images/meeting-rooms/r13.jpeg';
    
    // Fallback ke gambar default
    return '/images/meeting-rooms/default-room.jpg';
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    
    // Handle different time formats
    if (time.includes(' - ')) {
      // Already formatted as "HH:MM - HH:MM"
      return time;
    }
    
    // If it's just start time, return as is (first 5 chars)
    return time.slice(0, 5);
  };

  const handleDetail = () => {
    alert(
      `Rincian Reservasi\n\n`+
      `Ruangan : ${booking.roomName}\n`+
      `Topik   : ${booking.topic}\n`+
      `Tanggal : ${booking.date}\n`+
      `Waktu   : ${formatTime(booking.time)}\n`+
      `Peserta : ${booking.participants}\n`+
      `PIC     : ${booking.pic || '-'}\n`+
      `Jenis   : ${booking.meetingType}\n`+
      `Makanan : ${booking.foodOrder}`
    );
  };

  const handleComplete = () => onComplete(booking);

  return (
    <div className={`group relative overflow-hidden rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative p-6">
        <div className="flex items-start gap-6">
          {/* Room Image */}
          <div className="relative">
        <img
          src={getRoomImage(booking.roomName, booking.imageUrl)}
          alt={booking.roomName}
              className={`w-20 h-20 rounded-xl object-cover border-2 shadow-md ${isDarkMode ? 'border-gray-500' : 'border-gray-200'}`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/images/meeting-rooms/default-room.jpg';
          }}
        />
            {/* Status indicator */}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
        <div>
                <h4 className={`font-bold text-xl mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {booking.roomName || 'Meeting Room'}
                </h4>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {booking.topic || 'Meeting'}
                </p>
              </div>
              
              {/* Status Badge */}
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                {t('reservations.active')}
              </div>
            </div>
            
            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                  <span className="text-blue-600 text-sm">📅</span>
                </div>
                <div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('reservations.date')}</div>
                  <div className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {new Date(booking.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                  <span className="text-green-600 text-sm">⏰</span>
                </div>
                <div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('reservations.time')}</div>
                  <div className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {formatTime(booking.time)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                  <span className="text-purple-600 text-sm">👤</span>
                </div>
                <div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('reservations.pic')}</div>
                  <div className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {booking.pic || '-'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                  <span className="text-orange-600 text-sm">👥</span>
                </div>
                <div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('reservations.participants')}</div>
                  <div className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {booking.participants} {t('meetingRooms.people')}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => onDetail(booking)} 
                className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${isDarkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                📋 {t('reservations.detail')}
              </button>
              <button 
                onClick={handleComplete} 
                className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white shadow-md hover:shadow-lg`}
              >
                ✅ {t('reservations.complete')}
              </button>
              <button 
                onClick={() => onCancel(booking.id)} 
                className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white shadow-md hover:shadow-lg`}
              >
                ❌ {t('reservations.cancel')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const ReservationsPage: React.FC<{ onNavigate: (page: Page) => void, bookings: Booking[], onCancelBooking: (id: number) => void, onRemoveLocalBooking?: (id:number)=>void, refreshTrigger?: number }> = ({ onNavigate, bookings, onCancelBooking, onRemoveLocalBooking, refreshTrigger }) => {
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<'Terbaru' | 'Terlama'>('Terbaru');
    const [serverBookings, setServerBookings] = useState<any[]>([]);
    const [aiBookings, setAiBookings] = useState<any[]>([]);
    const { isDarkMode } = useDarkMode();
    const { t } = useLanguage();

    const loadServerBookings = () => {
        const userDataStr = localStorage.getItem('user_data');
        let userData: any = null;
        try {
            userData = userDataStr ? JSON.parse(userDataStr) : null;
        } catch (e) {
            // Jika localStorage berisi string non-JSON, jangan crash
            userData = null;
        }
        const primaryUserId = userData?.id || 1;
        const fallbackUserId = 1;



        // Load MySQL bookings (form-based)
        console.log('Loading server bookings for user:', primaryUserId);
        ApiService.getUserBookings(primaryUserId)
            .then(res => {
                console.log('Server bookings response:', res);
                const rows = res.data || [];
                if (rows.length > 0 || primaryUserId === fallbackUserId) {
                    setServerBookings(rows);
                } else {
                    // Fallback ke user default agar kompatibel dengan data sample
                    return ApiService.getUserBookings(fallbackUserId)
                        .then(res2 => {
                            console.log('Fallback server bookings response:', res2);
                            setServerBookings(res2.data || []);
                        })
                        .catch((e) => {
                            console.error('Fallback server bookings error:', e);
                            setServerBookings([]);
                        });
                }
            })
            .catch((e) => {
                console.error('Server bookings error:', e);
                setServerBookings([]);
            });

        // Load AI bookings from ai_bookings_success table
        console.log('Loading AI bookings for user:', primaryUserId);
        ApiService.getAIBookingsByUserId(primaryUserId)
            .then(res => {
                console.log('AI bookings response:', res);
                const rows = res.data || [];
                if (rows.length > 0 || primaryUserId === fallbackUserId) {
                    setAiBookings(rows);
                } else {
                    // Fallback ke user default agar kompatibel dengan data sample
                    return ApiService.getAIBookingsByUserId(fallbackUserId)
                        .then(res2 => {
                            console.log('Fallback AI bookings response:', res2);
                            setAiBookings(res2.data || []);
                        })
                        .catch((e) => {
                            console.error('Fallback AI bookings error:', e);
                            setAiBookings([]);
                        });
                }
            })
            .catch((e) => {
                console.error('AI bookings error:', e);
                setAiBookings([]);
            });
    };

    useEffect(() => {
        loadServerBookings();
    }, []);

    // Refresh data when refreshTrigger changes (after booking)
    useEffect(() => {
        if (refreshTrigger) {
            console.log('Refresh trigger changed, refreshing bookings...');
            loadServerBookings();
        }
    }, [refreshTrigger]);

    // Refresh data when component becomes visible (after booking)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                console.log('Page became visible, refreshing bookings...');
                loadServerBookings();
            }
        };

        const handleFocus = () => {
            console.log('Window focused, refreshing bookings...');
            loadServerBookings();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const handleCancel = async (id: number) => {
        try {
            // Show confirmation dialog
            const confirmed = window.confirm(t('reservations.confirmCancel'));
            if (!confirmed) return;

            console.log('Cancelling booking:', id);
            
            // Check if this is an AI booking
            const isAiBooking = String(id).startsWith('ai_');
            
            if (isAiBooking) {
                // For AI bookings, call the AI cancel endpoint
                await ApiService.cancelBooking(id);
                console.log('AI booking cancelled via API:', id);
            } else {
                // For form bookings, call the regular API
                await onCancelBooking(id);
            }
            
            // Add to history
            const bookingToCancel = [...serverBookings, ...aiBookings].find(b => 
                String(b.id) === String(id) || String(b.id) === String(id).replace('ai_', '')
            );
            
            if (bookingToCancel) {
                addHistory({
                    id: id,
                    roomName: bookingToCancel.room_name || bookingToCancel.roomName,
                    topic: bookingToCancel.topic,
                    date: bookingToCancel.meeting_date || bookingToCancel.date,
                    time: bookingToCancel.meeting_time || bookingToCancel.time,
                    participants: bookingToCancel.participants,
                    status: 'Dibatalkan'
                });
            }
            
            // Remove from all states - PERMANENT REMOVAL
            onRemoveLocalBooking?.(id);
            
            // Remove from server bookings (form bookings)
            setServerBookings(prev => prev.filter((b:any) => String(b.id) !== String(id)));
            
            // Remove from AI bookings (AI bookings)
            setAiBookings(prev => prev.filter((b:any) => String(b.id) !== String(String(id).replace('ai_', ''))));
            
            // Show success message
            alert(t('reservations.cancelSuccess'));
            
        } catch (e) {
            console.error('Error cancelling booking:', e);
            alert(t('reservations.cancelError'));
            return;
        }
    };

    // Selesaikan booking: hapus DB, catat histori, hapus dari tampilan, refresh
    const handleCompleteBooking = async (b: Booking) => {
        try {
            console.log('Completing booking:', b.id);
            
            // Check if this is an AI booking
            const isAiBooking = String(b.id).startsWith('ai_');
            
            if (isAiBooking) {
                // For AI bookings, call the AI cancel endpoint
                await ApiService.cancelBooking(b.id);
                console.log('AI booking completed via API:', b.id);
            } else {
                // For form bookings, call the regular API
                await ApiService.cancelBooking(Number(b.id));
            }
            
            // Add to history
            addHistory({
                id: b.id,
                roomName: b.roomName,
                topic: b.topic,
                date: b.date,
                time: b.time,
                participants: b.participants,
                status: 'Selesai'
            });
            
            // Remove from all states - PERMANENT REMOVAL
            onRemoveLocalBooking?.(Number(b.id));
            
            // Remove from server bookings (form bookings)
            setServerBookings(prev => prev.filter((x:any) => String(x.id) !== String(b.id)));
            
            // Remove from AI bookings (AI bookings)
            setAiBookings(prev => prev.filter((x:any) => String(x.id) !== String(String(b.id).replace('ai_', ''))));
            
        } catch (e) {
            console.error('Error completing booking:', e);
            alert(t('reservations.completeError'));
            return;
        }
    };

    const filteredSorted = useMemo(() => {
        // Format MySQL bookings (form-based)
        const userRaw = localStorage.getItem('user_data');
        let userName = '-';
        try {
            const ud = userRaw ? JSON.parse(userRaw) : null;
            userName = ud?.full_name || ud?.username || '-';
        } catch {}
        const serverBookingsFormatted: Booking[] = serverBookings.map((b: any): Booking => {
            // Only show start time, no duration/end time
            let timeDisplay = '';
            
            if (b.start_time) {
                // Extract time from start_time
                const startTime = new Date(b.start_time);
                timeDisplay = startTime.toTimeString().slice(0, 5);
            } else if (b.meeting_time) {
                // Use meeting_time directly
                timeDisplay = b.meeting_time.slice(0, 5);
            }
            
            return {
                id: b.id,
                roomId: b.room_id || 0,
                roomName: b.room_name || `Room ${b.room_id}` || '—',
                topic: b.topic || b.title,
                date: b.meeting_date || b.start_time?.split(' ')[0] || '',
                time: timeDisplay,
                participants: Number(b.participants || b.attendees || 0),
                pic: (b.pic && String(b.pic).trim()) ? b.pic : '-',
                meetingType: (b.meeting_type === 'external' ? 'external' : 'internal'),
                facilities: (b.facilities && Array.isArray(b.facilities)) ? b.facilities : [],
                imageUrl: b.image_url
            };
        });

        // Format AI bookings from ai_bookings_success table
        const aiBookingsFormatted: Booking[] = aiBookings.map((b: any): Booking => {
            // Only show start time, no duration/end time
            let timeDisplay = b.meeting_time || '';
            if (b.meeting_time) {
                timeDisplay = b.meeting_time.slice(0, 5);
            }
            
            return {
                id: `ai_${b.id}`, // Prefix dengan 'ai_' untuk membedakan dari form bookings
                roomId: b.room_id || 0,
                roomName: b.room_name || `Room ${b.room_id}` || '—',
                topic: b.topic,
                date: b.meeting_date,
                time: timeDisplay,
                participants: Number(b.participants || 0),
                pic: (b.pic && String(b.pic).trim()) ? b.pic : '-',
                meetingType: (b.meeting_type === 'external' ? 'external' : 'internal'),
                facilities: (b.facilities && Array.isArray(b.facilities)) ? b.facilities : [],
                imageUrl: b.image_url
            };
        });

        const unified: Booking[] = [];
        const seenIds = new Set<string>();
        const seenBookings = new Set<string>(); // Untuk mendeteksi duplikasi berdasarkan kriteria booking

        // Gabungkan hasil dari server (MySQL), AI bookings, dan lokal
        // Prioritaskan AI bookings (yang lebih baru) untuk menghindari duplikasi
        console.log('AI bookings count:', aiBookingsFormatted.length);
        console.log('Server bookings count:', serverBookingsFormatted.length);
        console.log('Local bookings count:', bookings.length);
        
        // First, add AI bookings (most recent)
        aiBookingsFormatted.forEach(b => { 
            const key = String(b.id);
            const bookingKey = `${b.roomName}-${b.topic}-${b.date}-${b.time}-${b.participants}`;
            
            if (!seenIds.has(key) && !seenBookings.has(bookingKey)) { 
                unified.push(b); 
                seenIds.add(key); 
                seenBookings.add(bookingKey);
                console.log('Added AI booking:', key, bookingKey);
            } else {
                console.log('Skipped duplicate AI booking:', key, bookingKey);
            }
        });
        
        // Then add server bookings (form bookings)
        serverBookingsFormatted.forEach(b => { 
            const key = String(b.id);
            const bookingKey = `${b.roomName}-${b.topic}-${b.date}-${b.time}-${b.participants}`;
            
            if (!seenIds.has(key) && !seenBookings.has(bookingKey)) { 
                unified.push(b); 
                seenIds.add(key); 
                seenBookings.add(bookingKey);
                console.log('Added server booking:', key, bookingKey);
            } else {
                console.log('Skipped duplicate server booking:', key, bookingKey);
            }
        });
        
        // Finally add local bookings (fallback)
        bookings.forEach(b => { 
            const key = String(b.id);
            const bookingKey = `${b.roomName}-${b.topic}-${b.date}-${b.time}-${b.participants}`;
            
            if (!seenIds.has(key) && !seenBookings.has(bookingKey)) { 
                unified.push(b); 
                seenIds.add(key); 
                seenBookings.add(bookingKey);
                console.log('Added local booking:', key, bookingKey);
            } else {
                console.log('Skipped duplicate local booking:', key, bookingKey);
            }
        });
        
        console.log('Final unified bookings count:', unified.length);

        const list = unified.filter(b => {
            const hay = `${b.topic} ${b.roomName}`.toLowerCase();
            return hay.includes(search.toLowerCase());
        });
        const toDate = (b: Booking) => new Date(`${b.date} ${b.time}`).getTime();
        return list.slice().sort((a, b) => sort === 'Terbaru' ? toDate(b) - toDate(a) : toDate(a) - toDate(b));
    }, [bookings, search, sort, serverBookings, aiBookings]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50">
            {/* Modern Header Section */}
            <div className="relative overflow-hidden">
                {/* Background - Teal Solid */}
                <div className="absolute inset-0 bg-teal-500"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-teal-600"></div>
                
                {/* Decorative Elements - Teal Variations */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-teal-300/30 to-transparent rounded-full -translate-y-36 translate-x-36"></div>
                <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-tr from-teal-400/25 to-transparent rounded-full translate-y-28 -translate-x-28"></div>
                <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-gradient-to-r from-teal-200/20 to-teal-300/20 rounded-full blur-xl"></div>
                <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-gradient-to-r from-teal-300/15 to-teal-400/15 rounded-full blur-lg"></div>
                
                {/* Subtle Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent"></div>
                
                <div className="relative max-w-7xl mx-auto px-8 py-12">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-8">
                            <button 
                                onClick={() => onNavigate(Page.Dashboard)} 
                                className="group p-4 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 hover:border-white/40 transition-all duration-300 hover:scale-105 shadow-xl"
                            >
                                <BackArrowIcon />
                            </button>
                            <div>
                                <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
                                    {t('reservations.title')}
                                </h1>
                                <p className="text-white/80 text-lg font-medium">
                                    {t('reservations.subtitle')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                
                {/* Stats Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">{t('reservations.totalReservations')}</p>
                                <p className="text-3xl font-bold text-gray-800">{filteredSorted.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <span className="text-blue-600 text-xl">📅</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">{t('reservations.activeReservations')}</p>
                                <p className="text-3xl font-bold text-green-600">{filteredSorted.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <span className="text-green-600 text-xl">✅</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">{t('reservations.roomsUsed')}</p>
                                <p className="text-3xl font-bold text-purple-600">{new Set(filteredSorted.map(b => b.roomName)).size}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <span className="text-purple-600 text-xl">🏢</span>
                            </div>
                        </div>
                    </div>
            </div>
            
            {/* Search and Filter Bar */}
                <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-400 text-lg">🔍</span>
                            </div>
                <input 
                    type="text" 
                    placeholder={t('reservations.searchPlaceholder')}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-400 text-lg">📊</span>
                            </div>
                            <select 
                                value={sort} 
                                onChange={e => setSort(e.target.value as any)} 
                                className="pl-10 pr-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white"
                            >
                    <option value="Terbaru">{t('reservations.sortNewest')}</option>
                    <option value="Terlama">{t('reservations.sortOldest')}</option>
                </select>
                        </div>
                    </div>
            </div>

            {/* Reservations List */}
                <div className="space-y-6">
                {filteredSorted.length > 0 ? (
                    filteredSorted.map(booking => <ReservationListItem key={booking.id} booking={booking} onCancel={handleCancel} onDetail={(b)=>{
                        // Simpan sementara ke session untuk ditarik di App
                        sessionStorage.setItem('detail_booking', JSON.stringify(b));
                        const ev = new CustomEvent('set_detail_booking');
                        window.dispatchEvent(ev as any);
                    }} onComplete={handleCompleteBooking} />)
                ) : (
                        <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-gray-400 text-4xl">📅</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-3">{t('reservations.noReservations')}</h3>
                            <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                {t('reservations.noReservationsDesc')}
                            </p>
                        <button 
                            onClick={() => onNavigate(Page.MeetingRooms)}
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-3 px-8 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                                {t('reservations.searchRooms')}
                        </button>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

export default ReservationsPage;
