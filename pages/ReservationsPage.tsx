
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Page, type Booking } from '../types';
import { BackArrowIcon } from '../components/icons';
import { ApiService } from '../src/config/api';
import { addHistory } from '../services/historyService';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useLanguage } from '../contexts/LanguageContext';
import RispatService from '../services/rispatService';

const ReservationListItem: React.FC<{ booking: Booking, onCancel: (id: string | number) => void, onDetail: (b: Booking) => void, onComplete: (b: Booking) => void, getBookingStatus: (date: string, startTime: string, endTime?: string, serverTime?: any) => string, hasRispat?: boolean }> = ({ booking, onCancel, onDetail, onComplete, getBookingStatus, hasRispat = false }) => {
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
                  {booking.roomName || 'Meeting Room'}
                </h4>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {booking.topic || 'Meeting'}
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
                    {formatTime(booking.time, booking.endTime)}
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
              
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                  <span className="text-cyan-600 text-sm">⚙️</span>
                </div>
                <div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fasilitas</div>
                  <div className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {(() => {
                      if (booking.facilities && Array.isArray(booking.facilities) && booking.facilities.length > 0) {
                        return booking.facilities.slice(0, 2).join(', ') + (booking.facilities.length > 2 ? '...' : '');
                      } else if (booking.facilities && typeof booking.facilities === 'string') {
                        try {
                          const parsed = JSON.parse(booking.facilities);
                          if (Array.isArray(parsed) && parsed.length > 0) {
                            return parsed.slice(0, 2).join(', ') + (parsed.length > 2 ? '...' : '');
                          }
                        } catch (e) {
                          return booking.facilities.length > 20 ? booking.facilities.substring(0, 20) + '...' : booking.facilities;
                        }
                      }
                      return 'Tidak ada';
                    })()}
                  </div>
                </div>
                
                {/* Rispat Status Indicator */}
                <div className="flex items-center gap-2">
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Risalah Rapat</div>
                  <div className={`font-semibold text-sm ${hasRispat ? 'text-green-600' : 'text-orange-600'}`}>
                    {hasRispat ? (
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
                
                // Hanya tampilkan tombol Complete untuk status ongoing atau upcoming
                if (status === 'ongoing' || status === 'upcoming') {
                  return (
                    <>
                      <button 
                        onClick={handleComplete} 
                        disabled={!hasRispat}
                        className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                          hasRispat 
                            ? (isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600') + ' text-white shadow-md hover:shadow-lg'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        title={hasRispat ? 'Klik untuk menyelesaikan reservasi' : 'Upload risalah rapat terlebih dahulu untuk menyelesaikan reservasi'}
                      >
                        ✅ {hasRispat ? t('reservations.complete') : 'Upload Rispat Dulu'}
                      </button>
                      <button 
                        onClick={() => onCancel(booking.id)} 
                        className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white shadow-md hover:shadow-lg`}
                      >
                        ❌ {t('reservations.cancel')}
                      </button>
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
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<'Terbaru' | 'Terlama'>('Terbaru');
    const [serverBookings, setServerBookings] = useState<any[]>([]);
    const [aiBookings, setAiBookings] = useState<any[]>([]);
    const [serverCurrentTime, setServerCurrentTime] = useState<any>(null);
    const [rispatStatus, setRispatStatus] = useState<{[key: string]: boolean}>({}); // Track rispat status for each booking
    
    // Calculate active reservations based on current time
    const getActiveReservations = () => {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
        
        return filteredSorted.filter(booking => {
            // Check if booking is today
            if (booking.date !== currentDate) return false;
            
            // Check if current time is within booking time range
            const startTime = booking.time;
            const endTime = booking.endTime || booking.time; // fallback to start time if no end time
            
            return currentTime >= startTime && currentTime <= endTime;
        });
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
        
        // Check rispat status for all bookings
        const allBookings = [...serverBookings, ...aiBookings];
        
        for (const booking of allBookings) {
            try {
                let actualBookingId = booking.id;
                if (String(booking.id).startsWith('ai_')) {
                    actualBookingId = String(booking.id).replace('ai_', '');
                }
                
                const rispatFiles = await RispatService.getRispatByBookingId(Number(actualBookingId));
                statusMap[String(booking.id)] = rispatFiles.length > 0;
            } catch (error) {
                console.error('Error checking rispat for booking', booking.id, error);
                statusMap[String(booking.id)] = false;
            }
        }
        
        setRispatStatus(statusMap);
    };

    const fetchServerTime = async () => {
        // Use browser time directly since it's already in WIB
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
        console.log('Server time set (browser WIB):', serverTimeData);
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
        loadServerBookings();
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
            loadServerBookings();
        }
    }, [refreshTrigger]);

    // Check rispat status when bookings change
    useEffect(() => {
        if (serverBookings.length > 0 || aiBookings.length > 0) {
            checkRispatStatus();
        }
    }, [serverBookings, aiBookings]);

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

    const handleCancel = async (id: string | number) => {
        try {
            // Show confirmation dialog
            const confirmed = window.confirm(t('reservations.confirmCancel'));
            if (!confirmed) return;

            console.log('Cancelling booking:', id);
            
            // Check if this is an AI booking
            const isAiBooking = String(id).startsWith('ai_');
            
            if (isAiBooking) {
                // For AI bookings, call the AI cancel endpoint
                console.log('Attempting to cancel AI booking:', String(id));
                const result = await ApiService.cancelBooking(String(id));
                console.log('AI booking cancel result:', result);
            } else {
                // For form bookings, call the regular API
                console.log('Attempting to cancel form booking:', Number(id));
                await onCancelBooking(Number(id));
                console.log('Form booking cancelled successfully');
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
            console.error('Error details:', {
                id,
                isAiBooking: String(id).startsWith('ai_'),
                error: e
            });
            alert(`Failed to cancel booking. Error: ${e.message || e}`);
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
                status: 'Selesai',
                completedAt: new Date().toISOString()
            });
            
            // Remove from all states - PERMANENT REMOVAL
            onRemoveLocalBooking?.(Number(b.id));
            
            // Remove from server bookings (form bookings)
            setServerBookings(prev => prev.filter((x:any) => String(x.id) !== String(b.id)));
            
            // Remove from AI bookings (AI bookings)
            setAiBookings(prev => prev.filter((x:any) => String(x.id) !== String(String(b.id).replace('ai_', ''))));
            
            // Show success message
            alert('✅ Reservasi berhasil diselesaikan! Risalah rapat dapat dilihat di halaman View Rispat.');
            
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
        
        // Gunakan hanya bookings dari props (yang sudah di-format dari App.tsx)
        const list = bookings.filter(b => {
            const hay = `${b.topic} ${b.roomName}`.toLowerCase();
            const matchesSearch = hay.includes(search.toLowerCase());
            
            // Filter out expired bookings (they will be moved to history)
            if (serverCurrentTime) {
                const status = getBookingStatusWithServerTime(b.date, b.time, b.endTime, serverCurrentTime);
                const isExpired = status === 'expired';
                
                if (isExpired) {
                    console.log('Filtering out expired booking:', b.topic, 'Status:', status);
                    return false;
                }
            }
            
            return matchesSearch;
        });
        const toDate = (b: Booking) => new Date(`${b.date} ${b.time}`).getTime();
        return list.slice().sort((a, b) => sort === 'Terbaru' ? toDate(b) - toDate(a) : toDate(a) - toDate(b));
    }, [bookings, search, sort, serverCurrentTime]);

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
                    }} onComplete={handleCompleteBooking} getBookingStatus={(date, startTime, endTime) => getBookingStatusWithServerTime(date, startTime, endTime, serverCurrentTime)} hasRispat={rispatStatus[String(booking.id)] || false} />)
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
