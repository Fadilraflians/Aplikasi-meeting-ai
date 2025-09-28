
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Page, type Booking } from '../types';
import { BackArrowIcon } from '../components/icons';
import { ApiService } from '../src/config/api';
import { addHistory } from '../services/historyService';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useLanguage } from '../contexts/LanguageContext';
import RispatService from '../services/rispatService';
import RequestCancelModal from '../components/RequestCancelModal';
import KotakPattern from '../components/KotakPattern';

const ReservationListItem: React.FC<{ booking: Booking, onCancel: (id: string | number) => void, onDetail: (b: Booking) => void, onComplete: (b: Booking) => void, getBookingStatus: (date: string, startTime: string, endTime?: string, serverTime?: any) => string, hasRispat?: boolean, currentUser?: string, onRequestCancel?: (booking: Booking) => void }> = ({ booking, onCancel, onDetail, onComplete, getBookingStatus, hasRispat = false, currentUser, onRequestCancel }) => {
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
    if (name.includes('nusanipa')) return '/images/meeting-rooms/r9.jpeg'; // Add Nusanipa mapping
    if (name.includes('balidwipa')) return '/images/meeting-rooms/r10.jpeg';
    if (name.includes('swarnadwipa')) return '/images/meeting-rooms/r11.jpeg';
    if (name.includes('borobudur')) return '/images/meeting-rooms/r12.jpeg';
    if (name.includes('komodo')) return '/images/meeting-rooms/r13.jpeg';
    
    // Fallback ke gambar default
    return '/images/meeting-rooms/default-room.jpg';
  };

  const formatTime = (time?: string, endTime?: string) => {
    if (!time) return '';
    
    // Handle different time formats
    if (time.includes(' - ')) {
      // Already formatted as "HH:MM - HH:MM"
      return time;
    }
    
    // If we have end time, format as "HH:MM - HH:MM"
    if (endTime) {
      const startTime = time.slice(0, 5);
      const endTimeFormatted = endTime.slice(0, 5);
      return `${startTime} - ${endTimeFormatted}`;
    }
    
    // If it's just start time, return as is (first 5 chars)
    return time.slice(0, 5);
  };


  // Fungsi untuk mendapatkan label status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Upcoming';
      case 'ongoing':
        return 'Sedang Berlangsung';
      case 'expired':
        return 'Selesai';
      default:
        return 'Active';
    }
  };

  // Fungsi untuk mendapatkan warna status
  const getStatusColor = (status: string, isDarkMode: boolean) => {
    switch (status) {
      case 'upcoming':
        return isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800';
      case 'expired':
        return isDarkMode ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-800';
      default:
        return isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800';
    }
  };

  const handleDetail = () => {
    const facilitiesText = (() => {
      if (booking.facilities && Array.isArray(booking.facilities) && booking.facilities.length > 0) {
        return booking.facilities.join(', ');
      } else if (booking.facilities && typeof booking.facilities === 'string') {
        try {
          const parsed = JSON.parse(booking.facilities);
          return Array.isArray(parsed) ? parsed.join(', ') : booking.facilities;
        } catch (e) {
          return booking.facilities;
        }
      }
      return 'Tidak ada fasilitas khusus';
    })();
    
    alert(
      `Rincian Reservasi\n\n`+
      `Ruangan : ${booking.roomName}\n`+
      `Topik   : ${booking.topic}\n`+
      `Tanggal : ${booking.date}\n`+
      `Waktu   : ${formatTime(booking.time, booking.endTime)}\n`+
      `Peserta : ${booking.participants}\n`+
      `PIC     : ${booking.pic || '-'}\n`+
      `Jenis   : ${booking.meetingType}\n`+
      `Fasilitas : ${facilitiesText}`
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
            {(() => {
              const status = getBookingStatus(booking.date, booking.time, booking.endTime);
              let indicatorColor = 'bg-green-500'; // default
              
              switch (status) {
                case 'upcoming':
                  indicatorColor = 'bg-blue-500';
                  break;
                case 'ongoing':
                  indicatorColor = 'bg-green-500';
                  break;
                case 'expired':
                  indicatorColor = 'bg-gray-500';
                  break;
              }
              
              return (
                <div className={`absolute -top-2 -right-2 w-6 h-6 ${indicatorColor} rounded-full border-2 border-white flex items-center justify-center`}>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              );
            })()}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className={`font-bold text-xl mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {booking.topic || booking.meeting_topic || 'Meeting'}
                </h4>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {booking.roomName || booking.room_name || 'Meeting Room'}
                </p>
              </div>
              
              {/* Status Badge */}
              {(() => {
                const status = getBookingStatus(booking.date, booking.time, booking.endTime);
                const statusLabel = getStatusLabel(status);
                const statusColor = getStatusColor(status, isDarkMode);
                
                return (
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                    {statusLabel}
                  </div>
                );
              })()}
            </div>
            
            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                  <span className="text-blue-600 text-sm">📅</span>
                </div>
                <div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('reservations.date')}</div>
                  <div className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {new Date(booking.date || booking.meeting_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
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
                    {formatTime(booking.time || booking.meeting_time, booking.endTime)}
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
                    {booking.participants || booking.meeting_participants || 0} {t('meetingRooms.people')}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                  <span className="text-purple-600 text-sm">📋</span>
                </div>
                <div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Jenis Rapat</div>
                  <div className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {booking.meetingType === 'internal' ? 'Internal' : booking.meetingType === 'external' ? 'Eksternal' : booking.meetingType || 'Internal'}
                  </div>
                </div>
                
                {/* Rispat Status Indicator */}
                <div className="flex items-center gap-2">
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Risalah Rapat</div>
                  <div className={`font-semibold text-sm ${
                    !booking.requiresRispat 
                      ? 'text-gray-500' 
                      : hasRispat 
                        ? 'text-green-600' 
                        : 'text-orange-600'
                  }`}>
                    {!booking.requiresRispat ? (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Tidak Wajib</span>
                      </div>
                    ) : hasRispat ? (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Tersedia</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>Belum Upload</span>
                      </div>
                    )}
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
              {(() => {
                const status = getBookingStatus(booking.date, booking.time, booking.endTime);
                
                // Tampilkan tombol Complete untuk status ongoing atau upcoming
                if (status === 'ongoing' || status === 'upcoming') {
                  // Check if current user is the owner of this booking
                  const isOwner = currentUser && booking.pic && 
                    currentUser.toLowerCase() === booking.pic.toLowerCase();
                  
                  // Logika baru: 
                  // - Untuk status ongoing: bisa complete jika pemilik dan (tidak perlu rispat atau sudah upload rispat)
                  // - Untuk status upcoming: selalu disabled (belum bisa complete)
                  const canComplete = status === 'ongoing' && isOwner && (!booking.requiresRispat || hasRispat);
                  
                  return (
                    <>
                      <button 
                        onClick={handleComplete} 
                        disabled={!canComplete}
                        className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                          canComplete 
                            ? (isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600') + ' text-white shadow-md hover:shadow-lg'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        title={
                          status === 'upcoming'
                            ? 'Rapat belum dimulai. Tunggu hingga waktu rapat dimulai untuk menyelesaikan.'
                            : !isOwner 
                              ? 'Hanya pemilik reservasi yang bisa menyelesaikan'
                              : !booking.requiresRispat 
                                ? 'Klik untuk menyelesaikan reservasi' 
                                : hasRispat 
                                  ? 'Klik untuk menyelesaikan reservasi' 
                                  : 'Upload risalah rapat terlebih dahulu untuk menyelesaikan reservasi'
                        }
                      >
                        ✅ {
                          status === 'upcoming'
                            ? 'Belum Dimulai'
                            : !isOwner 
                              ? 'Bukan Milik Anda'
                              : !booking.requiresRispat 
                                ? t('reservations.complete')
                                : hasRispat 
                                  ? t('reservations.complete') 
                                  : 'Upload Rispat Dulu'
                        }
                      </button>
                      {(() => {
                        // Check if current user is the owner of this booking
                        const isOwner = currentUser && booking.pic && 
                          currentUser.toLowerCase() === booking.pic.toLowerCase();
                        
                        if (isOwner) {
                          // Owner can cancel directly
                          return (
                            <button 
                              onClick={() => onCancel(booking.id)} 
                              className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white shadow-md hover:shadow-lg`}
                            >
                              ❌ {t('reservations.cancel')}
                            </button>
                          );
                        } else {
                          // Non-owner can request cancellation
                          return (
                            <button 
                              onClick={() => onRequestCancel?.(booking)} 
                              className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${isDarkMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600'} text-white shadow-md hover:shadow-lg`}
                              title={`Minta izin untuk membatalkan reservasi dari ${booking.pic}`}
                            >
                              🙋‍♀️ Minta Izin Cancel
                            </button>
                          );
                        }
                      })()}
                    </>
                  );
                } else {
                  // Untuk status expired, hanya tampilkan tombol Detail
                  return (
                    <div className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm text-center text-gray-500">
                      Meeting telah berakhir
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const ReservationsPage: React.FC<{ onNavigate: (page: Page) => void, bookings: Booking[], onCancelBooking: (id: number) => void, onRemoveLocalBooking?: (id:number)=>void, refreshTrigger?: number }> = ({ onNavigate, bookings, onCancelBooking, onRemoveLocalBooking, refreshTrigger }) => {
    // Debug logging for bookings data
    console.log('🔍 ReservationsPage - Received bookings:', bookings.map(b => ({
        id: b.id,
        topic: b.topic,
        roomName: b.roomName,
        date: b.date,
        time: b.time,
        endTime: b.endTime,
        participants: b.participants,
        pic: b.pic,
        status: b.status,
        booking_state: b.booking_state,
        source: b.source
    })));
    
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<'Terbaru' | 'Terlama'>('Terbaru');
    const [serverBookings, setServerBookings] = useState<any[]>([]);
    const [aiBookings, setAiBookings] = useState<any[]>([]);
    const [serverCurrentTime, setServerCurrentTime] = useState<any>(null);
    
    console.log('🔍 ReservationsPage - Total bookings received:', bookings.length);
    console.log('🔍 ReservationsPage - Current time:', new Date().toLocaleString());
    console.log('🔍 ReservationsPage - Server time:', serverCurrentTime);
    const [rispatStatus, setRispatStatus] = useState<{[key: string]: boolean}>({}); // Track rispat status for each booking
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [bookingToCancel, setBookingToCancel] = useState<any>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [requestCancelModalOpen, setRequestCancelModalOpen] = useState(false);
    const [bookingToRequestCancel, setBookingToRequestCancel] = useState<Booking | null>(null);
    
    // Calculate active reservations based on current time and status
    const getActiveReservations = () => {
        // Use server time if available, otherwise use browser time
        const currentTime = serverCurrentTime || new Date();
        const currentDate = currentTime.date || currentTime.toISOString().split('T')[0];
        const currentTimeStr = currentTime.time ? currentTime.time.slice(0, 5) : currentTime.toTimeString().split(' ')[0].substring(0, 5);
        
        console.log('🔍 getActiveReservations - Using time:', { currentDate, currentTimeStr, serverCurrentTime: !!serverCurrentTime });
        console.log('🔍 getActiveReservations - Total bookings to check:', bookings.length);
        
        // Use bookings from props (not filteredSorted) to get all bookings
        const activeReservations = bookings.filter(booking => {
            console.log('🔍 getActiveReservations - Checking booking:', {
                id: booking.id,
                topic: booking.topic,
                date: booking.date,
                time: booking.time,
                endTime: booking.endTime,
                currentDate,
                currentTimeStr
            });
            
            // Check if booking is today
            if (booking.date !== currentDate) {
                console.log('🔍 getActiveReservations - Not today:', booking.topic);
                return false;
            }
            
            // Check if current time is within booking time range
            const startTime = booking.time;
            const endTime = booking.endTime || booking.time; // fallback to start time if no end time
            
            // Check if booking is currently active (time-wise)
            const isTimeActive = currentTimeStr >= startTime && currentTimeStr <= endTime;
            
            console.log('🔍 getActiveReservations - Time check:', {
                startTime,
                endTime,
                currentTimeStr,
                isTimeActive
            });
            
            // Also check if booking is not completed
            const history = JSON.parse(localStorage.getItem('booking_history') || '[]');
            const isCompleted = history.some((h: any) => 
                String(h.id) === String(booking.id).replace('ai_', '') && h.status === 'Selesai'
            );
            
            // Also check if booking is not cancelled
            const isCancelled = history.some((h: any) => 
                String(h.id) === String(booking.id).replace('ai_', '') && h.status === 'Dibatalkan'
            );
            
            // TEMPORARY FIX: Show all bookings that are today and not explicitly cancelled
            // This will help us see all active reservations
            const isActive = !isCancelled; // Simplified logic for debugging
            
            console.log('🔍 getActiveReservations - Final result (simplified):', {
                topic: booking.topic,
                isTimeActive,
                isCompleted,
                isCancelled,
                isActive
            });
            
            return isActive;
        });
        
        console.log('🔍 getActiveReservations - Final active reservations:', activeReservations.length, activeReservations.map(b => b.topic));
        return activeReservations;
    };
    
    // Calculate rooms currently in use
    const getRoomsInUse = () => {
        const activeReservations = getActiveReservations();
        const uniqueRooms = new Set(activeReservations.map(booking => booking.roomName));
        return uniqueRooms.size;
    };
    const { isDarkMode } = useDarkMode();
    const { t } = useLanguage();

    // Function to check rispat status for all bookings
    const checkRispatStatus = async () => {
        const statusMap: {[key: string]: boolean} = {};
        
        // Check rispat status for all bookings from props
        for (const booking of bookings) {
            try {
                let actualBookingId = booking.id;
                if (String(booking.id).startsWith('ai_')) {
                    actualBookingId = String(booking.id).replace('ai_', '');
                }
                
                const rispatFiles = await RispatService.getRispatByBookingId(Number(actualBookingId));
                statusMap[String(booking.id)] = rispatFiles.length > 0;
                console.log(`Rispat status for booking ${booking.id}: ${rispatFiles.length > 0 ? 'HAS RISPAT' : 'NO RISPAT'}`);
            } catch (error) {
                console.error('Error checking rispat for booking', booking.id, error);
                statusMap[String(booking.id)] = false;
            }
        }
        
        setRispatStatus(statusMap);
        console.log('Updated rispat status:', statusMap);
    };

    const fetchServerTime = async () => {
        try {
            // Try to get server time from API first
            const response = await fetch('/api/server_time.php');
            if (response.ok) {
                const serverTimeData = await response.json();
                if (serverTimeData.success) {
                    setServerCurrentTime(serverTimeData.data);
                    console.log('Server time set (from API):', serverTimeData.data);
                    return;
                }
            }
        } catch (error) {
            console.warn('Failed to fetch server time from API, using browser time:', error);
        }
        
        // Fallback to browser time
        const now = new Date();
        
        // Format date and time in WIB (browser timezone)
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        const serverTimeData = {
            date: `${year}-${month}-${day}`,
            time: `${hours}:${minutes}:${seconds}`,
            datetime: `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
            timezone: 'Asia/Jakarta',
            timestamp: Math.floor(now.getTime() / 1000)
        };
        
        setServerCurrentTime(serverTimeData);
        console.log('Server time set (browser WIB fallback):', serverTimeData);
    };

    // Fungsi untuk menentukan status berdasarkan waktu dengan server time
    const getBookingStatusWithServerTime = (date: string, startTime: string, endTime?: string, serverTime?: any) => {
        console.log('getBookingStatusWithServerTime called with:', { 
            date, 
            startTime, 
            endTime, 
            serverTime,
            serverTimeDate: serverTime?.date,
            serverTimeTime: serverTime?.time
        });
        
        // Use server time from API instead of browser time
        const currentServerTime = serverTime || new Date();
        const today = currentServerTime.date || currentServerTime.toISOString().slice(0, 10);
        const currentTime = currentServerTime.time ? currentServerTime.time.slice(0, 5) : currentServerTime.toTimeString().slice(0, 5);
        
        console.log('Using server time:', { currentServerTime, today, currentTime });
        
        // Debug logging
        console.log('Debug Status:', {
            date,
            today,
            startTime,
            endTime,
            currentTime,
            dateComparison: date === today,
            serverTime: currentServerTime
        });
        
        // Jika tanggal berbeda dari hari ini
        if (date !== today) {
            const bookingDate = new Date(date);
            const todayDate = new Date(today);
            
            if (bookingDate < todayDate) {
                return 'expired';
            } else {
                return 'upcoming';
            }
        }
        
        // Konversi waktu ke format yang bisa dibandingkan (HH:MM)
        const formatTime = (time: string) => {
            if (time.length === 5 && time.includes(':')) {
                return time;
            }
            if (time.length >= 5) {
                return time.slice(0, 5);
            }
            return time;
        };
        
        const formattedStartTime = formatTime(startTime);
        const formattedEndTime = endTime ? formatTime(endTime) : null;
        const formattedCurrentTime = formatTime(currentTime);
        
        // Konversi waktu ke menit untuk perbandingan yang akurat
        const timeToMinutes = (timeStr: string) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };
        
        const currentMinutes = timeToMinutes(formattedCurrentTime);
        const startMinutes = timeToMinutes(formattedStartTime);
        const endMinutes = formattedEndTime ? timeToMinutes(formattedEndTime) : null;
        
        // Jika tanggal sama dengan hari ini, cek waktu
        if (!endMinutes) {
            if (currentMinutes > startMinutes) {
                return 'expired';
            } else {
                return 'upcoming';
            }
        }
        
        // Jika ada end time, cek status lengkap
        let finalStatus;
        if (currentMinutes < startMinutes) {
            finalStatus = 'upcoming';
        } else if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
            finalStatus = 'ongoing';
        } else {
            finalStatus = 'expired';
        }
        
        console.log('Final Status Result:', {
            booking: `${date} ${formattedStartTime}-${formattedEndTime}`,
            currentTime: formattedCurrentTime,
            currentMinutes,
            startMinutes,
            endMinutes,
            finalStatus
        });
        
        return finalStatus;
    };

    // REMOVED loadServerBookings function - using bookings from props instead to prevent duplication

    // Fungsi untuk memindahkan meeting expired ke history
    const moveExpiredToHistory = useCallback(async (bookings: any[]) => {
        if (!serverCurrentTime) return;
        
        console.log('moveExpiredToHistory called with:', {
            bookingsCount: bookings.length,
            serverCurrentTime,
            sampleBooking: bookings[0]
        });
        
        const expiredBookings = bookings.filter(booking => {
            // Debug: log booking structure
            console.log('Checking booking:', {
                id: booking.id,
                topic: booking.topic || booking.meeting_topic,
                date: booking.date || booking.meeting_date,
                startTime: booking.start_time || booking.meeting_time,
                endTime: booking.end_time,
                allFields: Object.keys(booking)
            });
            
            const status = getBookingStatusWithServerTime(
                booking.date || booking.meeting_date, 
                booking.start_time || booking.meeting_time, 
                booking.end_time, 
                serverCurrentTime
            );
            
            console.log('Booking status:', status);
            return status === 'expired';
        });
        
        console.log('Found expired bookings:', expiredBookings.length);
        
        if (expiredBookings.length > 0) {
            console.log('Expired bookings details:', expiredBookings);
        }
        
        for (const booking of expiredBookings) {
            try {
                // Tambahkan ke history
                const historyEntry = {
                    id: booking.id,
                    roomName: booking.room_name || booking.name,
                    topic: booking.topic || booking.meeting_topic,
                    date: booking.date,
                    time: booking.start_time || booking.meeting_time,
                    endTime: booking.end_time,
                    pic: booking.pic || booking.meeting_pic,
                    participants: booking.participants || booking.meeting_participants,
                    status: 'Selesai' as const,
                    completedAt: new Date().toISOString(),
                    source: booking.source || 'server'
                };
                
                addHistory(historyEntry);
                console.log('Moved expired booking to history:', booking.topic);
                
                // Hapus dari database (opsional - bisa di-comment jika ingin tetap ada)
                // await ApiService.deleteBooking(booking.id);
                
            } catch (error) {
                console.error('Error moving expired booking to history:', error);
            }
        }
    }, [serverCurrentTime, getBookingStatusWithServerTime]);

    useEffect(() => {
        fetchServerTime();
        // loadServerBookings(); // REMOVED - using bookings from props instead
    }, []);

    // Pindahkan meeting expired ke history setelah data dimuat
    useEffect(() => {
        console.log('useEffect triggered:', {
            serverCurrentTime: !!serverCurrentTime,
            serverBookingsLength: serverBookings.length,
            aiBookingsLength: aiBookings.length,
            serverCurrentTimeData: serverCurrentTime
        });
        
        if (serverCurrentTime && (serverBookings.length > 0 || aiBookings.length > 0)) {
            console.log('Checking for expired bookings...');
            const allBookings = [...serverBookings, ...aiBookings];
            console.log('All bookings to check:', allBookings.length);
            moveExpiredToHistory(allBookings);
        } else {
            console.log('Skipping expired check - conditions not met');
        }
    }, [serverCurrentTime, serverBookings, aiBookings]);

    // Refresh data when refreshTrigger changes (after booking)
    useEffect(() => {
        if (refreshTrigger) {
            console.log('Refresh trigger changed, refreshing bookings...');
            // Refresh rispat status when data changes
            checkRispatStatus();
        }
    }, [refreshTrigger]);

    // Check rispat status when bookings change
    useEffect(() => {
        if (bookings.length > 0) {
            checkRispatStatus();
        }
    }, [bookings]);

    // Refresh data when component becomes visible (after booking)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                console.log('Page became visible, refreshing bookings...');
                // loadServerBookings(); // REMOVED - using bookings from props instead
            }
        };

        const handleFocus = () => {
            console.log('Window focused, refreshing bookings...');
            // loadServerBookings(); // REMOVED - using bookings from props instead
        };

        const handleRispatUploaded = () => {
            console.log('Rispat uploaded, refreshing rispat status...');
            checkRispatStatus();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('rispatUploaded', handleRispatUploaded);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('rispatUploaded', handleRispatUploaded);
        };
    }, []);

    const handleCancel = (id: string | number) => {
        // Find the booking to cancel from the main bookings prop (same data shown in the UI)
        const booking = bookings.find(b => 
            String(b.id) === String(id) || String(b.id) === String(id).replace('ai_', '')
        );
        
        console.log('🔍 handleCancel - Looking for booking with ID:', id);
        console.log('🔍 handleCancel - Available bookings:', bookings.map(b => ({ id: b.id, topic: b.topic })));
        console.log('🔍 handleCancel - Found booking:', booking);
        
        if (booking) {
            // SECURITY CHECK: Verify that current user is the owner of this booking
            const currentUser = getCurrentUser();
            const isOwner = currentUser && booking.pic && 
                currentUser.toLowerCase() === booking.pic.toLowerCase();
            
            if (!isOwner) {
                alert('Anda tidak memiliki izin untuk membatalkan reservasi ini. Hanya pemilik reservasi yang bisa melakukan aksi ini.');
                console.log('🚫 Unauthorized cancel attempt:', {
                    currentUser,
                    bookingOwner: booking.pic,
                    bookingId: booking.id
                });
                return;
            }
            
            console.log('✅ Authorized cancel attempt:', {
                currentUser,
                bookingOwner: booking.pic,
                bookingId: booking.id
            });
            
            console.log('🔍 handleCancel - Setting bookingToCancel with data:', {
                id: booking.id,
                topic: booking.topic,
                roomName: booking.roomName,
                date: booking.date,
                time: booking.time,
                participants: booking.participants,
                pic: booking.pic
            });
            setBookingToCancel({ ...booking, id });
            setCancelModalOpen(true);
        } else {
            // Fallback if booking not found - try to find from serverBookings or aiBookings
            const fallbackBooking = [...serverBookings, ...aiBookings].find(b => 
                String(b.id) === String(id) || String(b.id) === String(id).replace('ai_', '')
            );
            
            if (fallbackBooking) {
                console.log('🔍 handleCancel - Using fallback booking:', fallbackBooking);
                setBookingToCancel({ ...fallbackBooking, id });
                setCancelModalOpen(true);
            } else {
                // Last resort fallback - show error message instead of incomplete data
                console.error('🔍 handleCancel - No booking found for ID:', id);
                alert('Data reservasi tidak ditemukan. Silakan refresh halaman dan coba lagi.');
                return;
            }
        }
    };

    const handleConfirmCancel = async () => {
        if (!bookingToCancel || !cancelReason.trim()) {
            alert('Mohon masukkan alasan pembatalan');
            return;
        }

        try {
            console.log('Cancelling booking:', bookingToCancel.id, 'with reason:', cancelReason);
            console.log('Booking data:', bookingToCancel);
            
            // Check if this is an AI booking
            const isAiBooking = String(bookingToCancel.id).startsWith('ai_');
            
            let cancelSuccess = false;
            
            if (isAiBooking) {
                // For AI bookings, call the AI cancel endpoint with reason
                // Keep the full ID with 'ai_' prefix so the API method can detect it's an AI booking
                console.log('Attempting to cancel AI booking:', String(bookingToCancel.id));
                try {
                    const result = await ApiService.cancelBooking(bookingToCancel.id, cancelReason.trim());
                    console.log('AI booking cancel result:', result);
                    cancelSuccess = true;
                } catch (error) {
                    console.error('AI booking cancel failed:', error);
                    // Check if it's a 404 error (booking not found)
                    if (error.message && error.message.includes('not found')) {
                        alert('Reservasi tidak ditemukan atau sudah dibatalkan sebelumnya. Data akan dihapus dari tampilan.');
                        
                        // Remove the booking from UI since it doesn't exist in database
                        onRemoveLocalBooking?.(bookingToCancel.id);
                        
                        // Close modal
                        setCancelModalOpen(false);
                        setBookingToCancel(null);
                        setCancelReason('');
                        return;
                    }
                    throw error; // Re-throw other errors
                }
            } else {
                // For form bookings, call the regular API
                console.log('Attempting to cancel form booking:', Number(bookingToCancel.id));
                await onCancelBooking(Number(bookingToCancel.id));
                console.log('Form booking cancelled successfully');
                cancelSuccess = true;
            }
            
            if (!cancelSuccess) {
                throw new Error('Failed to cancel booking');
            }
            
            // Add to history with cancellation reason
            addHistory({
                id: String(bookingToCancel.id).replace('ai_', ''),
                roomName: bookingToCancel.room_name || bookingToCancel.roomName || 'Unknown Room',
                topic: bookingToCancel.topic || 'Reservasi Meeting',
                date: bookingToCancel.meeting_date || bookingToCancel.date || new Date().toISOString().split('T')[0],
                time: bookingToCancel.meeting_time || bookingToCancel.time || new Date().toLocaleTimeString(),
                participants: bookingToCancel.participants || 0,
                status: 'Dibatalkan',
                cancelReason: cancelReason.trim()
            });
            
            // Update booking status to cancelled instead of removing
            // For form bookings, update the status in local state
            if (!isAiBooking) {
                setServerBookings(prev => prev.map((b:any) => 
                    String(b.id) === String(bookingToCancel.id) 
                        ? { ...b, status: 'cancelled', cancel_reason: cancelReason.trim() }
                        : b
                ));
            } else {
                // For AI bookings, update the status in local state
                setAiBookings(prev => prev.map((b:any) => 
                    String(b.id) === String(bookingToCancel.id).replace('ai_', '') 
                        ? { ...b, booking_state: 'CANCELLED', cancel_reason: cancelReason.trim() }
                        : b
                ));
            }
            
            // Remove from active bookings list (but keep in history)
            onRemoveLocalBooking?.(bookingToCancel.id);
            
            // Close modal and reset
            setCancelModalOpen(false);
            setBookingToCancel(null);
            setCancelReason('');
            
            // Show success message
            alert('✅ Reservasi berhasil dibatalkan!\n\nData telah dipindahkan ke halaman History dan tidak akan muncul lagi di daftar reservasi aktif.');
            
            // Navigate to history page after successful cancellation
            setTimeout(() => {
                onNavigate('History');
            }, 1000); // Wait 1 second to let user see the success message
            
        } catch (error) {
            console.error('Error cancelling booking:', error);
            
            // Provide more specific error messages
            let errorMessage = 'Gagal membatalkan reservasi. Silakan coba lagi.';
            if (error.message) {
                if (error.message.includes('not found')) {
                    errorMessage = 'Reservasi tidak ditemukan atau sudah dibatalkan sebelumnya. Data akan dihapus dari tampilan.';
                } else if (error.message.includes('network')) {
                    errorMessage = 'Gagal terhubung ke server. Periksa koneksi internet Anda dan coba lagi.';
                } else if (error.message.includes('timeout')) {
                    errorMessage = 'Permintaan timeout. Silakan coba lagi dalam beberapa saat.';
                } else if (error.message.includes('Internal server error')) {
                    errorMessage = 'Terjadi kesalahan pada server. Silakan hubungi administrator.';
                }
            }
            
            alert(`❌ ${errorMessage}`);
        }
    };

    // Handle request cancel from non-owner
    const handleRequestCancel = (booking: Booking) => {
        setBookingToRequestCancel(booking);
        setRequestCancelModalOpen(true);
    };

    // Handle sending cancel request
    const handleSendCancelRequest = async (bookingId: number, reason: string, requesterName: string) => {
        try {
            console.log('Sending cancel request:', { bookingId, reason, requesterName });
            
            // Send cancel request via API
            const result = await ApiService.createCancelRequest({
                booking_id: String(bookingId),
                requester_name: requesterName,
                owner_name: bookingToRequestCancel?.pic || 'Unknown',
                reason: reason,
                requester_id: getCurrentUserId() // Get actual user ID from session
            });
            
            if (result.success) {
                alert(`Permintaan pembatalan telah dikirim kepada ${bookingToRequestCancel?.pic}. Mereka akan menerima notifikasi dan dapat menyetujui atau menolak permintaan Anda.`);
                
                // Close modal
                setRequestCancelModalOpen(false);
                setBookingToRequestCancel(null);
            } else {
                throw new Error(result.message || 'Failed to send cancel request');
            }
            
        } catch (error) {
            console.error('Error sending cancel request:', error);
            alert('Gagal mengirim permintaan pembatalan. Silakan coba lagi.');
        }
    };

    // Get current user from localStorage
    const getCurrentUser = () => {
        const userDataStr = localStorage.getItem('user_data');
        if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            return userData.full_name || userData.username || 'Unknown User';
        }
        return 'Unknown User';
    };

    // Get current user ID from localStorage
    const getCurrentUserId = () => {
        const userDataStr = localStorage.getItem('user_data');
        if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            return userData.id || 1; // Default to 1 if no ID found
        }
        return 1; // Default to 1 if no user data
    };

    // Selesaikan booking: hapus DB, catat histori, hapus dari tampilan, refresh
    const handleCompleteBooking = async (b: Booking) => {
        try {
            console.log('Completing booking:', b.id);
            
            // SECURITY CHECK: Verify that current user is the owner of this booking
            const currentUser = getCurrentUser();
            const isOwner = currentUser && b.pic && 
                currentUser.toLowerCase() === b.pic.toLowerCase();
            
            if (!isOwner) {
                alert('Anda tidak memiliki izin untuk menyelesaikan reservasi ini. Hanya pemilik reservasi yang bisa melakukan aksi ini.');
                console.log('🚫 Unauthorized complete attempt:', {
                    currentUser,
                    bookingOwner: b.pic,
                    bookingId: b.id
                });
                return;
            }
            
            console.log('✅ Authorized complete attempt:', {
                currentUser,
                bookingOwner: b.pic,
                bookingId: b.id
            });
            
            // Check if this is an AI booking
            const isAiBooking = String(b.id).startsWith('ai_');
            
            if (isAiBooking) {
                // For AI bookings, call the complete endpoint
                await ApiService.completeBooking(b.id);
                console.log('AI booking completed via API:', b.id);
            } else {
                // For form bookings, call the complete endpoint
                await ApiService.completeBooking(Number(b.id));
            }
            
            // Add to history
            addHistory({
                id: String(b.id).replace('ai_', ''), // Remove ai_ prefix for consistency
                roomName: b.roomName,
                topic: b.topic,
                date: b.date,
                time: b.time,
                participants: b.participants,
                status: 'Selesai',
                completedAt: new Date().toISOString()
            });
            
            // Remove booking from active list completely
            // This will make it disappear from ReservationsPage
            if (isAiBooking) {
                onRemoveLocalBooking?.(b.id); // Keep as string for AI bookings
                // Also remove from local AI bookings state
                setAiBookings(prev => prev.filter(aiBooking => String(aiBooking.id) !== String(b.id).replace('ai_', '')));
                // Remove from server bookings state as well
                setServerBookings(prev => prev.filter(serverBooking => String(serverBooking.id) !== String(b.id).replace('ai_', '')));
            } else {
                onRemoveLocalBooking?.(Number(b.id)); // Convert to number for regular bookings
                // Remove from server bookings state as well
                setServerBookings(prev => prev.filter(serverBooking => String(serverBooking.id) !== String(b.id)));
            }
            
            // The completed booking will now appear in RispatPage and HistoryPage
            // The filteredSorted useMemo will automatically filter out completed bookings
            
            // Show success message
            alert('✅ Reservasi berhasil diselesaikan! Risalah rapat dapat dilihat di halaman View Rispat.');
            
            // Refresh data to ensure completed booking is removed from active list
            // This will trigger a re-fetch from server
            window.dispatchEvent(new CustomEvent('refreshBookings'));
            
        } catch (e) {
            console.error('Error completing booking:', e);
            alert(t('reservations.completeError'));
            return;
        }
    };

    const filteredSorted = useMemo(() => {
        // Use bookings from props (same as DashboardPage)
        console.log('🔍 ReservationsPage - Using bookings from props:', bookings);
        console.log('🔍 ReservationsPage - Props bookings count:', bookings.length);
        
        // Log all booking details for debugging
        bookings.forEach((booking, index) => {
            console.log(`🔍 ReservationsPage - Booking ${index}:`, {
                id: booking.id,
                topic: booking.topic,
                date: booking.date,
                time: booking.time,
                roomName: booking.roomName,
                pic: booking.pic
            });
        });
        
        // Check for potential duplicates by content (not just ID)
        const contentDuplicates = [];
        for (let i = 0; i < bookings.length; i++) {
            for (let j = i + 1; j < bookings.length; j++) {
                const b1 = bookings[i];
                const b2 = bookings[j];
                if (b1.topic === b2.topic && 
                    b1.date === b2.date && 
                    b1.time === b2.time && 
                    b1.roomName === b2.roomName && 
                    b1.pic === b2.pic) {
                    contentDuplicates.push({
                        index1: i,
                        index2: j,
                        booking1: b1,
                        booking2: b2
                    });
                }
            }
        }
        
        if (contentDuplicates.length > 0) {
            console.log('🔍 ReservationsPage - Content duplicates found:', contentDuplicates);
        }
        
        // Deduplicate bookings by ID first
        const uniqueByIdBookings = bookings.filter((booking, index, self) => 
            index === self.findIndex(b => String(b.id) === String(booking.id))
        );
        console.log('🔍 ReservationsPage - After ID deduplication:', uniqueByIdBookings.length);
        
        // Additional deduplication by content (topic, date, time, room, pic)
        // But preserve AI bookings even if they have similar content to regular bookings
        const uniqueBookings = uniqueByIdBookings.filter((booking, index, self) => {
            // Always keep AI bookings
            if (booking.source === 'ai') {
                return true;
            }
            
            // For regular bookings, check for duplicates
            return index === self.findIndex(b => 
                b.topic === booking.topic && 
                b.date === booking.date && 
                b.time === booking.time && 
                b.roomName === booking.roomName && 
                b.pic === booking.pic &&
                b.source === booking.source // Also check source to avoid mixing AI and regular bookings
            );
        });
        console.log('🔍 ReservationsPage - After content deduplication:', uniqueBookings.length);
        
        // Filter bookings
        const list = uniqueBookings.filter(b => {
            const hay = `${b.topic} ${b.roomName}`.toLowerCase();
            const matchesSearch = hay.includes(search.toLowerCase());
            
            // Filter out expired bookings (they will be moved to history)
            // But be more lenient - only filter out if explicitly expired and not active
            if (serverCurrentTime) {
                const status = getBookingStatusWithServerTime(b.date, b.time, b.endTime, serverCurrentTime);
                const isExpired = status === 'expired';
                
                // Only filter out if it's explicitly expired AND not currently active
                // This prevents active reservations from being filtered out
                if (isExpired) {
                    // Double-check if it's actually expired by checking if it's currently active
                    const currentTime = serverCurrentTime || new Date();
                    const currentDate = currentTime.date || currentTime.toISOString().split('T')[0];
                    const currentTimeStr = currentTime.time ? currentTime.time.slice(0, 5) : currentTime.toTimeString().split(' ')[0].substring(0, 5);
                    
                    // If it's today and current time is within booking time range, don't filter out
                    if (b.date === currentDate) {
                        const startTime = b.time;
                        const endTime = b.endTime || b.time;
                        const isCurrentlyActive = currentTimeStr >= startTime && currentTimeStr <= endTime;
                        
                        if (isCurrentlyActive) {
                            console.log('🔍 ReservationsPage - Booking is currently active, not filtering out:', b.topic);
                            return matchesSearch; // Don't filter out active bookings
                        }
                    }
                    
                    console.log('Filtering out expired booking:', b.topic, 'Status:', status);
                    return false;
                }
            }
            
            // Filter out completed and cancelled bookings (they should appear in View Rispat/History)
            // Check if booking is completed or cancelled in localStorage history
            const history = JSON.parse(localStorage.getItem('booking_history') || '[]');
            const isCompletedInHistory = history.some((h: any) => 
                String(h.id) === String(b.id).replace('ai_', '') && h.status === 'Selesai'
            );
            const isCancelledInHistory = history.some((h: any) => 
                String(h.id) === String(b.id).replace('ai_', '') && h.status === 'Dibatalkan'
            );
            
            // Also check booking status from database
            // For AI bookings, be more lenient with status checking
            const isCompletedInDB = b.source === 'ai' ? false : (b.status === 'completed' || b.booking_state === 'COMPLETED');
            const isCancelledInDB = b.source === 'ai' ? false : (b.status === 'cancelled' || b.booking_state === 'CANCELLED');
            
            // Combined check - booking is completed if it's completed in history OR database
            const isCompleted = isCompletedInHistory || isCompletedInDB;
            const isCancelled = isCancelledInHistory || isCancelledInDB;
            
            // TEMPORARY FIX: Show all bookings except explicitly cancelled ones
            // This will help identify why some bookings are not showing
            if (isCancelled && !isCompleted) {
                console.log('Filtering out cancelled booking:', b.topic, 'ID:', b.id, 'Status:', b.status, 'Booking State:', b.booking_state, 'Source:', b.source, 'isCancelled:', isCancelled, 'isCancelledInDB:', isCancelledInDB);
                return false;
            }
            
            // For now, show all bookings that are not explicitly cancelled
            // This will help us see all 5 bookings
            console.log('🔍 ReservationsPage - Booking will be shown (temporary fix):', {
                id: b.id,
                topic: b.topic,
                status: b.status,
                booking_state: b.booking_state,
                source: b.source,
                isCompleted,
                isCancelled,
                matchesSearch
            });
            return matchesSearch;
        });
        
        const toDate = (b: Booking) => new Date(`${b.date} ${b.time}`).getTime();
        const sortedList = list.slice().sort((a, b) => sort === 'Terbaru' ? toDate(b) - toDate(a) : toDate(a) - toDate(b));
        
        console.log('🔍 ReservationsPage - Final filteredSorted result:', {
            totalBookings: bookings.length,
            afterDeduplication: uniqueBookings.length,
            afterFiltering: list.length,
            afterSorting: sortedList.length,
            finalList: sortedList.map(b => ({
                id: b.id,
                topic: b.topic,
                date: b.date,
                time: b.time,
                status: b.status,
                source: b.source
            }))
        });
        
        return sortedList;
    }, [bookings, search, sort, serverCurrentTime]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 relative">
            {/* Kotak Pattern Background dengan warna teal - hanya untuk bagian reservasi */}
            <KotakPattern 
                className="opacity-8"
                color="rgba(20, 184, 166, 0.08)"
                excludeAreas={[
                    {
                        top: '0',
                        left: '0',
                        width: '100%',
                        height: '200px',
                        borderRadius: '0'
                    }
                ]}
            />
            
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
                            
                            {/* Logo Section */}
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                                    <img 
                                        src="/images/meeting-rooms/kotak-removebg-preview.png" 
                                        alt="Spacio Logo" 
                                        className="w-12 h-12 object-contain"
                                    />
                                </div>
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
            </div>

            <div className="container mx-auto px-4 py-8 relative z-10">
                
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
                                <p className="text-3xl font-bold text-green-600">{getActiveReservations().length}</p>
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
                                <p className="text-3xl font-bold text-purple-600">{getRoomsInUse()}</p>
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
                    }} onComplete={handleCompleteBooking} getBookingStatus={(date, startTime, endTime) => getBookingStatusWithServerTime(date, startTime, endTime, serverCurrentTime)} hasRispat={rispatStatus[String(booking.id)] || false} currentUser={getCurrentUser()} onRequestCancel={handleRequestCancel} />)
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

            {/* Cancel Booking Modal */}
            {cancelModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300 scale-100 animate-slideIn">
                        {/* Header */}
                        <div className="text-center mb-4 sm:mb-5">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                                <span className="text-red-600 text-lg sm:text-xl">⚠️</span>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Batalkan Reservasi</h3>
                            <p className="text-xs sm:text-sm text-gray-600">Apakah Anda yakin ingin membatalkan reservasi ini?</p>
                        </div>

                        {/* Booking Details */}
                        {bookingToCancel && (
                            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-5">
                                <h4 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-base sm:text-lg">
                                    {bookingToCancel.topic || bookingToCancel.meeting_topic || 'Reservasi Meeting'}
                                </h4>
                                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <span className="w-4 h-4 bg-blue-500 rounded-full"></span>
                                        <span className="font-medium">Ruangan:</span>
                                        <span className={!bookingToCancel.roomName && !bookingToCancel.room_name ? 'text-red-500 italic' : ''}>
                                            {bookingToCancel.roomName || bookingToCancel.room_name || 'Data tidak tersedia'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-4 h-4 bg-green-500 rounded-full"></span>
                                        <span className="font-medium">Tanggal:</span>
                                        <span className={!bookingToCancel.date && !bookingToCancel.meeting_date ? 'text-red-500 italic' : ''}>
                                            {(() => {
                                                const dateStr = bookingToCancel.date || bookingToCancel.meeting_date;
                                                if (!dateStr) return 'Data tidak tersedia';
                                                
                                                // Format date to DD MMM YYYY if it's in YYYY-MM-DD format
                                                if (dateStr.includes('-') && dateStr.split('-').length === 3) {
                                                    const [year, month, day] = dateStr.split('-');
                                                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
                                                                      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                                                    return `${day} ${monthNames[parseInt(month) - 1]} ${year}`;
                                                }
                                                return dateStr;
                                            })()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-4 h-4 bg-orange-500 rounded-full"></span>
                                        <span className="font-medium">Waktu:</span>
                                        <span className={!bookingToCancel.time && !bookingToCancel.meeting_time ? 'text-red-500 italic' : ''}>
                                            {(() => {
                                                const startTime = bookingToCancel.time || bookingToCancel.meeting_time;
                                                const endTime = bookingToCancel.endTime;
                                                
                                                if (!startTime) return 'Data tidak tersedia';
                                                
                                                // Format time to HH:MM if it's in HH:MM:SS format
                                                const formatTime = (timeStr: string) => {
                                                    if (!timeStr) return '';
                                                    // If time is in HH:MM:SS format, take only HH:MM
                                                    if (timeStr.includes(':') && timeStr.split(':').length === 3) {
                                                        return timeStr.substring(0, 5);
                                                    }
                                                    return timeStr;
                                                };
                                                
                                                const formattedStartTime = formatTime(startTime);
                                                const formattedEndTime = endTime ? formatTime(endTime) : '';
                                                
                                                return formattedStartTime + (formattedEndTime ? ` - ${formattedEndTime}` : '');
                                            })()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-4 h-4 bg-purple-500 rounded-full"></span>
                                        <span className="font-medium">PIC:</span>
                                        <span className={!bookingToCancel.pic && !bookingToCancel.meeting_pic ? 'text-red-500 italic' : ''}>
                                            {bookingToCancel.pic || bookingToCancel.meeting_pic || 'Data tidak tersedia'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-4 h-4 bg-pink-500 rounded-full"></span>
                                        <span className="font-medium">Peserta:</span>
                                        <span className={!bookingToCancel.participants && !bookingToCancel.meeting_participants ? 'text-red-500 italic' : ''}>
                                            {bookingToCancel.participants || bookingToCancel.meeting_participants || 0} orang
                                        </span>
                                    </div>
                                    {(bookingToCancel.meeting_type || bookingToCancel.meetingType) && (
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 bg-indigo-500 rounded-full"></span>
                                            <span className="font-medium">Jenis Rapat:</span>
                                            <span>{bookingToCancel.meeting_type || bookingToCancel.meetingType}</span>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Debug info */}
                                {(!bookingToCancel.roomName && !bookingToCancel.room_name) && (
                                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-xs text-yellow-700">
                                            ⚠️ Data reservasi tidak lengkap. Silakan refresh halaman dan coba lagi.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Cancellation Reason Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Alasan Pembatalan <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Masukkan alasan pembatalan reservasi..."
                                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none text-sm"
                                rows={4}
                                required
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 sm:gap-3">
                            <button
                                onClick={() => {
                                    setCancelModalOpen(false);
                                    setBookingToCancel(null);
                                    setCancelReason('');
                                }}
                                className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-xs sm:text-sm"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleConfirmCancel}
                                className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors text-xs sm:text-sm"
                            >
                                Konfirmasi Batalkan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Request Cancel Modal */}
            <RequestCancelModal
                isOpen={requestCancelModalOpen}
                onClose={() => {
                    setRequestCancelModalOpen(false);
                    setBookingToRequestCancel(null);
                }}
                booking={bookingToRequestCancel}
                currentUser={getCurrentUser()}
                onRequestCancel={handleSendCancelRequest}
            />
        </div>
    );
};

export default ReservationsPage;
