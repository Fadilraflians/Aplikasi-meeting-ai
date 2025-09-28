import React, { useState, useEffect } from 'react';
import { Page, type MeetingRoom, type Booking, type User } from '../types';
import { BackArrowIcon } from '../components/icons';
import { ApiService } from '../src/config/api';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useLanguage } from '../contexts/LanguageContext';

interface RoomDetailPageProps {
  onNavigate: (page: Page) => void;
  onBookRoom: (room: MeetingRoom, bookingData?: Partial<Booking>) => void;
  room: MeetingRoom;
  bookings: Booking[];
  onEditRoom: (room: MeetingRoom) => void;
  onDeleteRoom: (roomId: number) => void;
  onUpdateRoomStatus?: (roomId: number, isActive: boolean) => void;
  user?: User;
}

const RoomDetailPage: React.FC<RoomDetailPageProps> = ({ onNavigate, onBookRoom, room, bookings, onEditRoom, onDeleteRoom, onUpdateRoomStatus, user }) => {
  const [roomBookings, setRoomBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { isDarkMode } = useDarkMode();
  const { t } = useLanguage();

  // Debug room data
  console.log('🔍 RoomDetailPage - Room data:', {
    id: room.id,
    name: room.name,
    isActive: room.isActive,
    roomObject: room
  });

  // Auto-refresh every minute to hide expired bookings
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔍 RoomDetailPage - Auto-refresh triggered');
      // Trigger re-filter by updating a dummy state
      setRoomBookings(prev => [...prev]);
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log('🔍 RoomDetailPage - Filtering bookings for room:', room.name);
    console.log('🔍 RoomDetailPage - Total bookings received:', bookings.length);
    console.log('🔍 RoomDetailPage - Selected date:', selectedDate);
    
    // Filter bookings untuk ruangan ini dari props bookings (yang sudah dikonfirmasi)
    const filteredBookings = bookings
      .filter(booking => {
        console.log('🔍 RoomDetailPage - Checking booking:', {
          id: booking.id,
          topic: booking.topic,
          roomName: booking.roomName,
          date: booking.date,
          time: booking.time,
          endTime: booking.endTime
        });
        
        // Check for exact match first
        let roomMatch = booking.roomName === room.name;
        
        // If no exact match, try partial match (case insensitive)
        if (!roomMatch) {
          const bookingRoomLower = booking.roomName?.toLowerCase() || '';
          const currentRoomLower = room.name?.toLowerCase() || '';
          roomMatch = bookingRoomLower.includes(currentRoomLower) || 
                     currentRoomLower.includes(bookingRoomLower);
        }
        
        const normalizedBookingDate = normalizeDate(booking.date);
        const normalizedSelectedDate = normalizeDate(selectedDate);
        const dateMatch = normalizedBookingDate === normalizedSelectedDate;
        
        // Check if booking has ended (auto-hide expired bookings)
        const now = new Date();
        const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
        const endTime = booking.endTime || calculateEndTime(booking.time, 60);
        const bookingEndDateTime = new Date(`${booking.date}T${endTime}`);
        
        const isExpired = bookingEndDateTime < now;
        
        // Check if booking is completed (same logic as ReservationsPage)
        const history = JSON.parse(localStorage.getItem('booking_history') || '[]');
        const isCompleted = history.some((h: any) => 
          String(h.id) === String(booking.id).replace('ai_', '') && h.status === 'Selesai'
        );
        
        // Check if booking is cancelled (same logic as ReservationsPage)
        const isCancelled = history.some((h: any) => 
          String(h.id) === String(booking.id).replace('ai_', '') && h.status === 'Dibatalkan'
        );
        
        // For AI bookings, ignore database status and only check history
        const isCompletedInDB = booking.source === 'ai' ? false : (booking.status === 'completed' || booking.booking_state === 'COMPLETED');
        const isCancelledInDB = booking.source === 'ai' ? false : (booking.status === 'cancelled' || booking.booking_state === 'CANCELLED');
        
        if (isExpired) {
          console.log(`🔍 RoomDetailPage - Hiding expired booking: ${booking.topic} (${booking.time} - ${endTime}) - Ended at ${bookingEndDateTime.toLocaleString()}`);
        }
        
        if (isCompleted) {
          console.log(`🔍 RoomDetailPage - Hiding completed booking: ${booking.topic} (ID: ${booking.id}) Source: ${booking.source}`);
        }
        
        if (isCancelled) {
          console.log(`🔍 RoomDetailPage - Hiding cancelled booking: ${booking.topic} (ID: ${booking.id}) Source: ${booking.source}`);
        }
        
        if (isCompletedInDB) {
          console.log(`🔍 RoomDetailPage - Hiding completed booking (DB): ${booking.topic} (ID: ${booking.id}) Source: ${booking.source}`);
        }
        
        if (isCancelledInDB) {
          console.log(`🔍 RoomDetailPage - Hiding cancelled booking (DB): ${booking.topic} (ID: ${booking.id}) Source: ${booking.source}`);
        }
        
        // For AI bookings, be more lenient with status checking
        if (booking.source === 'ai') {
            const shouldShow = roomMatch && dateMatch && !isExpired && !isCompleted && !isCancelled;
            console.log(`🔍 RoomDetailPage - AI Booking ${booking.topic}: roomMatch=${roomMatch}, dateMatch=${dateMatch}, isExpired=${isExpired}, isCompleted=${isCompleted}, isCancelled=${isCancelled}, shouldShow=${shouldShow}`);
            return shouldShow;
        }
        
        const shouldShow = roomMatch && dateMatch && !isExpired && !isCompleted && !isCancelled && !isCompletedInDB && !isCancelledInDB;
        console.log(`🔍 RoomDetailPage - Booking ${booking.topic}: roomMatch=${roomMatch}, dateMatch=${dateMatch}, isExpired=${isExpired}, isCompleted=${isCompleted}, isCompletedInDB=${isCompletedInDB}, isCancelledInDB=${isCancelledInDB}, shouldShow=${shouldShow}`);
        
        return shouldShow;
      })
      .map(booking => ({
        topic: booking.topic,
        meeting_date: booking.date,
        meeting_time: booking.time,
        end_time: booking.endTime || calculateEndTime(booking.time, 60), // Use database end_time or calculate
        participants: booking.participants,
        pic: booking.pic,
        meeting_type: booking.meetingType,
        facilities: booking.facilities || [],
        user_name: booking.pic
      }));
    
    console.log('🔍 RoomDetailPage - Filtered bookings count:', filteredBookings.length);
    console.log('🔍 RoomDetailPage - Filtered bookings:', filteredBookings);
    
    setRoomBookings(filteredBookings);
  }, [room.name, bookings, selectedDate]);

  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const formatTime = (time: string) => {
    return time ? time.slice(0, 5) : '';
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const getDatesWithBookings = () => {
    const dates = new Set<string>();
    const roomBookings = bookings.filter(booking => booking.roomName === room.name);
    
    roomBookings.forEach(booking => {
      dates.add(booking.date);
    });
    
    return Array.from(dates).sort();
  };

  const isDateInPast = (date: string) => {
    const today = new Date().toISOString().split('T')[0];
    return date < today;
  };

  const normalizeDate = (date: string) => {
    // Pastikan format tanggal konsisten (YYYY-MM-DD)
    if (!date) return '';
    
    // Handle different date formats
    let normalizedDate = date;
    
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    
    // Try to parse and normalize
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return date; // Return as is if invalid
    }
    
    normalizedDate = d.toISOString().split('T')[0];
    return normalizedDate;
  };

  const getQuickDateOptions = () => {
    const today = new Date();
    const options = [];
    
    // Hari ini
    options.push({
      label: t('roomDetail.today'),
      value: today.toISOString().split('T')[0],
      isToday: true
    });
    
    // Besok
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    options.push({
      label: t('roomDetail.tomorrow'),
      value: tomorrow.toISOString().split('T')[0],
      isToday: false
    });
    
    // Minggu depan
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    options.push({
      label: t('roomDetail.nextWeek'),
      value: nextWeek.toISOString().split('T')[0],
      isToday: false
    });
    
    // Bulan depan
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    options.push({
      label: t('roomDetail.nextMonth'),
      value: nextMonth.toISOString().split('T')[0],
      isToday: false
    });
    
    return options;
  };

  const handleTimeSlotClick = (timeSlot: string) => {
    const isPastTime = isDateInPast(selectedDate) || 
      (selectedDate === new Date().toISOString().split('T')[0] && 
       parseInt(timeSlot.split(':')[0]) < new Date().getHours());
    
    // Check if this time slot is already booked
    const isBooked = roomBookings.some(booking => {
      const startTime = booking.meeting_time?.slice(0, 5) || '';
      const endTime = booking.end_time?.slice(0, 5) || '';
      return timeSlot >= startTime && timeSlot < endTime;
    });
    
    // Only allow booking if it's not past time and not already booked
    if (!isPastTime && !isBooked) {
      setSelectedTimeSlot(timeSlot);
      setShowBookingModal(true);
    }
  };

  const handleBookRoom = () => {
    // Set booking data dengan waktu yang dipilih
    const bookingData: Partial<Booking> = {
      date: selectedDate,
      time: selectedTimeSlot,
      roomName: room.name
    };
    
    // Navigate ke halaman booking dengan data yang sudah diisi
    onBookRoom(room, bookingData);
    setShowBookingModal(false);
  };

  const handleDeleteRoom = async () => {
    setDeleting(true);
    try {
      // Panggil API untuk hapus ruangan
      await ApiService.deleteRoom(room.id);
      
      // Panggil callback untuk update UI
      onDeleteRoom(room.id);
      
      // Navigate kembali ke halaman meeting rooms
      onNavigate(Page.MeetingRooms);
      
      // Tampilkan pesan sukses
      alert('Ruangan berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Gagal menghapus ruangan. Silakan coba lagi.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleUpdateRoomStatus = async () => {
    setUpdatingStatus(true);
    try {
      const newStatus = !room.isActive;
      
      console.log('🔄 Updating room status:', {
        roomId: room.id,
        currentStatus: room.isActive,
        newStatus: newStatus
      });
      
      // Panggil API untuk update status ruangan
      const response = await ApiService.updateRoomStatus(room.id, newStatus);
      console.log('✅ API Response:', response);
      
      // Panggil callback untuk update UI jika ada
      if (onUpdateRoomStatus) {
        onUpdateRoomStatus(room.id, newStatus);
      }
      
      // Tampilkan pesan sukses
      const statusText = newStatus ? 'diaktifkan' : 'dinonaktifkan';
      alert(`Ruangan berhasil ${statusText}!`);
      
      // Navigate kembali ke halaman meeting rooms
      onNavigate(Page.MeetingRooms);
    } catch (error) {
      console.error('Error updating room status:', error);
      alert('Gagal mengubah status ruangan. Silakan coba lagi.');
    } finally {
      setUpdatingStatus(false);
      setShowStatusConfirm(false);
    }
  };

  const isRoomBooked = bookings.some(b => b.roomName === room.name);

  // Check if there are any ongoing bookings for this room
  const hasOngoingBookings = () => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
    
    return bookings.some(booking => {
      // Check if booking is for this room
      const roomMatch = booking.roomName === room.name || 
        booking.roomName?.toLowerCase().includes(room.name.toLowerCase()) ||
        room.name.toLowerCase().includes(booking.roomName?.toLowerCase() || '');
      
      if (!roomMatch) return false;
      
      // Check if booking is today
      if (booking.date !== currentDate) return false;
      
      // Check if current time is within booking time range
      const startTime = booking.time;
      const endTime = booking.endTime || calculateEndTime(booking.time, 60);
      const isTimeActive = currentTime >= startTime && currentTime <= endTime;
      
      // Check status from history to determine if it's ongoing
      const history = JSON.parse(localStorage.getItem('booking_history') || '[]');
      const historyEntry = history.find((h: any) => String(h.id) === String(booking.id).replace('ai_', ''));
      
      // If there's history entry, check if it's ongoing
      const isOngoing = historyEntry ? 
        historyEntry.status === 'Sedang Berlangsung' || historyEntry.status === 'ongoing' :
        isTimeActive; // If no history, check based on time
      
      // Also check if booking is not completed or cancelled
      const isCompleted = historyEntry?.status === 'Selesai';
      const isCancelled = historyEntry?.status === 'Dibatalkan';
      
      return isTimeActive && isOngoing && !isCompleted && !isCancelled;
    });
  };

  const canDeactivateRoom = () => {
    // Can't deactivate if room is already inactive
    if (room.isActive === false) return true;
    
    // Can't deactivate if there are ongoing bookings
    return !hasOngoingBookings();
  };

  // Get room status similar to MeetingRoomsPage
  const getRoomStatus = () => {
    // If room is inactive, return 'inactive'
    if (room.isActive === false) return 'inactive';
    
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
    
    // Cari booking untuk ruang ini
    const roomBookings = bookings.filter(booking => {
      const roomMatch = booking.roomName === room.name || 
        booking.roomName?.toLowerCase().includes(room.name.toLowerCase()) ||
        room.name.toLowerCase().includes(booking.roomName?.toLowerCase() || '');
      return roomMatch;
    });
    
    // Cek apakah ada booking yang sedang berlangsung hari ini
    const ongoingBooking = roomBookings.find(booking => {
      // Cek apakah booking hari ini
      if (booking.date !== currentDate) return false;
      
      // Cek apakah waktu saat ini dalam range booking
      const startTime = booking.time;
      const endTime = booking.endTime || calculateEndTime(booking.time, 60);
      const isTimeActive = currentTime >= startTime && currentTime <= endTime;
      
      // Cek status dari history untuk menentukan apakah sedang berlangsung
      const history = JSON.parse(localStorage.getItem('booking_history') || '[]');
      const historyEntry = history.find((h: any) => String(h.id) === String(booking.id).replace('ai_', ''));
      
      // Jika ada di history dan statusnya "Sedang Berlangsung" atau tidak ada status (default ongoing)
      const isOngoing = historyEntry ? 
        historyEntry.status === 'Sedang Berlangsung' || historyEntry.status === 'ongoing' :
        isTimeActive; // Jika tidak ada di history, cek berdasarkan waktu
      
      // Also check if booking is not completed or cancelled
      const isCompleted = historyEntry?.status === 'Selesai';
      const isCancelled = historyEntry?.status === 'Dibatalkan';
      
      return isTimeActive && isOngoing && !isCompleted && !isCancelled;
    });
    
    // Cek apakah ada booking yang akan datang (upcoming)
    const upcomingBooking = roomBookings.find(booking => {
      // Cek apakah booking hari ini
      if (booking.date !== currentDate) return false;
      
      // Cek apakah waktu booking belum dimulai
      const startTime = booking.time;
      const isUpcoming = currentTime < startTime;
      
      // Cek status dari history
      const history = JSON.parse(localStorage.getItem('booking_history') || '[]');
      const historyEntry = history.find((h: any) => String(h.id) === String(booking.id).replace('ai_', ''));
      
      // Jika ada di history dan statusnya "Upcoming" atau tidak ada status (default upcoming)
      const isUpcomingStatus = historyEntry ? 
        historyEntry.status === 'Upcoming' || historyEntry.status === 'upcoming' :
        isUpcoming; // Jika tidak ada di history, cek berdasarkan waktu
      
      // Also check if booking is not completed or cancelled
      const isCompleted = historyEntry?.status === 'Selesai';
      const isCancelled = historyEntry?.status === 'Dibatalkan';
      
      return isUpcoming && isUpcomingStatus && !isCompleted && !isCancelled;
    });
    
    if (ongoingBooking) {
      return 'ongoing'; // Sedang berlangsung
    } else if (upcomingBooking) {
      return 'upcoming'; // Akan datang
    } else {
      return 'available'; // Tersedia
    }
  };

  return (
    <div className={`backdrop-blur-sm p-8 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'}`}>
      <div className="flex items-center mb-6">
        <button 
          onClick={() => onNavigate(Page.MeetingRooms)} 
          className={`mr-4 p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
        >
          <BackArrowIcon />
        </button>
        <div className="flex-1">
          <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{room.name}</h2>
          {room.isActive === false && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                <span>Maintenance</span>
              </div>
              <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Temporarily unavailable
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Room Image and Info */}
        <div>
          <div className="relative h-80 rounded-lg mb-6 overflow-hidden">
            <img 
              src={room.image} 
              alt={room.name}
              className={`w-full h-full object-cover transition-all duration-300 ${
                room.isActive === false ? 'filter grayscale brightness-75' : ''
              }`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/meeting-rooms/default-room.jpg';
              }}
            />
            
            {/* Nonaktif Overlay */}
            {room.isActive === false && (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-gray-800/40 to-slate-700/50 backdrop-blur-sm"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                
                {/* Maintenance Status Banner */}
                <div className="absolute top-4 left-4 right-4">
                  <div className="bg-white/90 backdrop-blur-md text-slate-700 px-3 py-2 rounded-lg shadow-lg border border-white/20">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                      <span className="font-medium text-sm">Under Maintenance</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{t('roomDetail.roomInfo')}</h3>
                {user?.role === 'admin' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (user?.role !== 'admin') {
                          alert('Anda tidak memiliki akses untuk mengedit ruangan. Hanya admin yang dapat melakukan operasi ini.');
                          return;
                        }
                        onEditRoom(room);
                      }}
                      className={`text-white px-4 py-2 rounded-lg transition text-sm font-medium ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => {
                        if (user?.role !== 'admin') {
                          alert('Anda tidak memiliki akses untuk mengubah status ruangan. Hanya admin yang dapat melakukan operasi ini.');
                          return;
                        }
                        if (getRoomStatus() === 'ongoing' && room.isActive === true) {
                          alert('Tidak dapat menonaktifkan ruangan karena ada reservasi yang sedang berlangsung!');
                          return;
                        }
                        setShowStatusConfirm(true);
                      }}
                      disabled={getRoomStatus() === 'ongoing' && room.isActive === true}
                      className={`text-white px-4 py-2 rounded-lg transition text-sm font-medium ${
                        room.isActive === false 
                          ? (isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600')
                          : getRoomStatus() === 'ongoing'
                            ? 'bg-gray-400 cursor-not-allowed'
                            : (isDarkMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600')
                      }`}
                      title={getRoomStatus() === 'ongoing' && room.isActive === true ? 'Tidak dapat menonaktifkan karena ada reservasi yang sedang berlangsung' : ''}
                    >
                      {room.isActive === false ? '✅ Aktifkan' : '⏸️ Nonaktifkan'}
                    </button>
                    <button
                      onClick={() => {
                        if (user?.role !== 'admin') {
                          alert('Anda tidak memiliki akses untuk menghapus ruangan. Hanya admin yang dapat melakukan operasi ini.');
                          return;
                        }
                        setShowDeleteConfirm(true);
                      }}
                      className={`text-white px-4 py-2 rounded-lg transition text-sm font-medium ${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'}`}
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                )}
              </div>
              <div className={`space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <p><span className="font-semibold">{t('roomDetail.capacity')}:</span> {room.capacity} {t('roomDetail.people')}</p>
                <p><span className="font-semibold">{t('roomDetail.floor')}:</span> {room.floor}</p>
                <p><span className="font-semibold">{t('roomDetail.address')}:</span> {room.address}</p>
                <p><span className="font-semibold">{t('roomDetail.facilities')}:</span> {room.facilities.join(', ')}</p>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{t('roomDetail.status')}:</span> 
                  {(() => {
                    const roomStatus = getRoomStatus();
                    
                    if (roomStatus === 'inactive') {
                      return (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200`}>
                          <span className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                            {t('roomDetail.maintenance')}
                          </span>
                        </span>
                      );
                    } else if (roomStatus === 'ongoing') {
                      return (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200`}>
                          <span className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                            {t('roomDetail.ongoing')}
                          </span>
                        </span>
                      );
                    } else if (roomStatus === 'upcoming') {
                      return (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200`}>
                          <span className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                            {t('roomDetail.upcoming')}
                          </span>
                        </span>
                      );
                    } else {
                      return (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200`}>
                          <span className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            {t('roomDetail.available')}
                          </span>
                        </span>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>

            {/* Warning message for ongoing bookings */}
            {getRoomStatus() === 'ongoing' && room.isActive === true && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-orange-700 font-medium">
                    ⚠️ Ruangan tidak dapat dinonaktifkan karena ada reservasi yang sedang berlangsung
                  </p>
                </div>
              </div>
            )}

            <div className="pt-4">
              <button
                onClick={() => onBookRoom(room)}
                disabled={room.isActive === false}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                  room.isActive === false
                    ? 'bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200'
                    : isDarkMode 
                      ? 'bg-cyan-600 hover:bg-cyan-700 shadow-md hover:shadow-lg text-white' 
                      : 'bg-cyan-500 hover:bg-cyan-600 shadow-md hover:shadow-lg text-white'
                }`}
              >
                {room.isActive === false ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    {t('roomDetail.unavailable')}
                  </span>
                ) : (
                  `📅 ${t('roomDetail.bookRoom')}`
                )}
              </button>
              {room.isActive === false && (
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-slate-600 font-medium">
                      This room is currently under maintenance and temporarily unavailable for booking
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Schedule */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{t('roomDetail.bookingSchedule')}</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateDate('prev')}
                className={`p-2 rounded-lg transition ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                disabled={isDateInPast(selectedDate)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className={`px-4 py-2 text-white rounded-lg transition text-sm font-medium ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
              >
                {formatDate(selectedDate)}
              </button>
              <button
                onClick={() => navigateDate('next')}
                className={`p-2 rounded-lg transition ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Calendar Picker */}
          {showCalendar && (
            <div className={`mb-6 p-4 rounded-lg border shadow-sm ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
              <h4 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{t('roomDetail.selectDate')}</h4>
              
              {/* Quick Date Options */}
              <div className="mb-4">
                <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('roomDetail.quickOptions')}:</p>
                <div className="flex flex-wrap gap-2">
                  {getQuickDateOptions().map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedDate(option.value);
                        setShowCalendar(false);
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition ${
                        selectedDate === option.value
                          ? 'bg-blue-500 text-white'
                          : isDarkMode 
                            ? 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates with Bookings */}
              {getDatesWithBookings().length > 0 && (
                <div>
                  <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('roomDetail.datesWithBookings')}:</p>
                  <div className="flex flex-wrap gap-2">
                    {getDatesWithBookings().map((date) => (
                      <button
                        key={date}
                        onClick={() => {
                          setSelectedDate(date);
                          setShowCalendar(false);
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition ${
                          selectedDate === date
                            ? 'bg-red-500 text-white'
                            : isDarkMode 
                              ? 'bg-red-900/20 text-red-300 hover:bg-red-900/30'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {roomBookings.length === 0 ? (
            <div className={`text-center py-8 rounded-lg ${isDarkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>
              <p>{t('roomDetail.noBookings').replace('{date}', formatDate(selectedDate))}</p>
              <p className="text-sm mt-2">{t('roomDetail.roomAvailableAllDay')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`bg-gradient-to-r rounded-xl p-6 mb-6 border ${isDarkMode ? 'from-blue-900/20 to-indigo-900/20 border-blue-800' : 'from-blue-50 to-indigo-50 border-blue-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`text-xl font-bold mb-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                      📅 {t('roomDetail.bookingScheduleTitle').replace('{date}', formatDate(selectedDate))}
                    </h4>
                    <p className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>
                      {t('roomDetail.totalBookings').replace('{count}', roomBookings.length.toString())}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                    {roomBookings.length} Booking
                  </div>
                </div>
              </div>
              
              {/* Horizontal Slider Container */}
              <div className="relative">
                <div className="overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
                    {roomBookings.map((booking, index) => (
                      <div key={index} className={`border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow min-w-[400px] flex-shrink-0 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                        {/* Meeting Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <h5 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                              {booking.topic || t('roomDetail.meeting')}
                            </h5>
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'}`}>
                            {t('roomDetail.booked')}
                          </span>
                        </div>
                        
                        {/* Meeting Details Grid */}
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600">📅</span>
                            <div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('roomDetail.date')}</div>
                              <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                {new Date(booking.meeting_date).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">⏰</span>
                            <div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('roomDetail.time')}</div>
                              <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                {formatTime(booking.meeting_time)}
                                {booking.end_time && (
                                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} ml-1`}>
                                    - {formatTime(booking.end_time)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-purple-600">👤</span>
                            <div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('roomDetail.pic')}</div>
                              <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{booking.pic || '-'}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-orange-600">👥</span>
                            <div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('roomDetail.participants')}</div>
                              <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{booking.participants} {t('roomDetail.people')}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-600">🏢</span>
                            <div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('roomDetail.type')}</div>
                              <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{booking.meeting_type || t('roomDetail.internal')}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-pink-600">🍽️</span>
                            <div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('roomDetail.facilities')}</div>
                              <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{booking.facilities?.join(', ') || t('roomDetail.noFacilities')}</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Duration Footer */}
                        <div className={`bg-gradient-to-r rounded-lg p-3 ${isDarkMode ? 'from-gray-600 to-gray-700' : 'from-gray-50 to-gray-100'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>⏱️ {t('roomDetail.duration')}:</span>
                              <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                {(() => {
                                  const start = new Date(`2000-01-01 ${booking.meeting_time}`);
                                  const end = new Date(`2000-01-01 ${booking.end_time}`);
                                  const diffMs = end.getTime() - start.getTime();
                                  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                                  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                  return `${diffHours} ${t('roomDetail.hours')} ${diffMinutes > 0 ? `${diffMinutes} ${t('roomDetail.minutes')}` : ''}`.trim();
                                })()}
                              </span>
                            </div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {t('roomDetail.slot')}: {formatTime(booking.meeting_time)}
                              {booking.end_time && (
                                <span className="ml-1">
                                  - {formatTime(booking.end_time)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Scroll Indicators */}
                {roomBookings.length > 1 && (
                  <div className="flex justify-center mt-4 gap-2">
                    <div className="text-xs text-gray-500">
                      {t('roomDetail.scrollHint')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Available Time Slots */}
          <div className="mt-6">
            <h4 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {t('roomDetail.availableTimeSlots').replace('{date}', formatDate(selectedDate))}
            </h4>
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 12 }, (_, i) => {
                const hour = 8 + i;
                const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
                const bookingForSlot = roomBookings.find(booking => {
                  const startTime = booking.meeting_time?.slice(0, 5) || '';
                  const endTime = booking.end_time?.slice(0, 5) || '';
                  return timeSlot >= startTime && timeSlot < endTime;
                });
                const isBooked = !!bookingForSlot;
                
                const isPastTime = isDateInPast(selectedDate) || 
                  (selectedDate === new Date().toISOString().split('T')[0] && 
                   parseInt(timeSlot.split(':')[0]) < new Date().getHours());
                
                return (
                  <div
                    key={timeSlot}
                    className={`p-3 text-center text-sm rounded-lg relative group transition-all duration-200 ${
                      isPastTime
                        ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                        : isBooked
                        ? 'bg-red-100 text-red-600 border border-red-200 cursor-not-allowed opacity-75'
                        : 'bg-green-100 text-green-600 border border-green-200 cursor-pointer hover:bg-green-200 hover:shadow-md hover:scale-105'
                    }`}
                    title={isBooked ? `Sudah dipesan: ${bookingForSlot.topic} (${bookingForSlot.pic}) - Tidak bisa dipesan lagi` : isPastTime ? 'Waktu sudah lewat - Tidak bisa dipesan' : 'Klik untuk memesan ruangan'}
                    onClick={() => handleTimeSlotClick(timeSlot)}
                  >
                    <div className="font-semibold text-base">{timeSlot}</div>
                    
                    {isBooked && (
                      <>
                        <div className="text-xs mt-1 font-semibold text-red-700">{t('roomDetail.booked')}</div>
                        <div className="text-xs text-red-500 truncate mt-1">
                          {bookingForSlot.topic}
                        </div>
                        <div className="text-xs text-red-400 mt-1">
                          {bookingForSlot.pic}
                        </div>
                        <div className="text-xs text-red-600 mt-1 font-medium">
                          ❌ {t('roomDetail.notAvailable')}
                        </div>
                      </>
                    )}
                    
                    {isPastTime && (
                      <div className="text-xs mt-1 text-gray-500">{t('roomDetail.past')}</div>
                    )}
                    
                    {!isBooked && !isPastTime && (
                      <div className="text-xs mt-1 text-green-500 font-medium">
                        {t('roomDetail.available')}
                      </div>
                    )}
                    
                    {/* Tooltip untuk detail booking */}
                    {isBooked && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                        <div className="bg-gray-800 text-white text-xs rounded-lg p-3 shadow-lg min-w-64">
                          <div className="font-semibold mb-2">{bookingForSlot.topic}</div>
                          <div className="space-y-1">
                            <div>📅 {formatTime(bookingForSlot.meeting_time)}</div>
                            <div>👤 {t('roomDetail.pic')}: {bookingForSlot.pic}</div>
                            <div>👥 {t('roomDetail.participants')}: {bookingForSlot.participants} {t('roomDetail.people')}</div>
                            <div>🏢 {t('roomDetail.type')}: {bookingForSlot.meeting_type}</div>
                            <div>🔧 {t('roomDetail.facilities')}: {bookingForSlot.facilities?.join(', ') || t('roomDetail.noFacilities')}</div>
                          </div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Legend */}
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                  <span>{t('roomDetail.available')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                  <span>{t('roomDetail.booked')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
                  <span>{t('roomDetail.pastTime')}</span>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-600 font-semibold">💡 {t('roomDetail.tips')}</span>
                </div>
                <ul className="text-blue-700 space-y-1">
                  <li>• <strong>{t('roomDetail.tip1')}</strong></li>
                  <li>• <strong>{t('roomDetail.tip2')}</strong></li>
                  <li>• {t('roomDetail.tip3')}</li>
                  <li>• {t('roomDetail.tip4')}</li>
                  <li>• {t('roomDetail.tip5')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-2xl">📅</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {t('roomDetail.confirmBooking')}
              </h3>
              <p className="text-gray-600">
                {t('roomDetail.bookingConfirmation')}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('roomDetail.room')}:</span>
                  <span className="font-medium text-gray-800">{room.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('roomDetail.date')}:</span>
                  <span className="font-medium text-gray-800">{formatDate(selectedDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('roomDetail.time')}:</span>
                  <span className="font-medium text-gray-800">{selectedTimeSlot}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleBookRoom}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
              >
                Lanjutkan Pemesanan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-500 text-2xl">🗑️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Hapus Ruangan
              </h3>
              <p className="text-gray-600">
                Apakah Anda yakin ingin menghapus ruangan <strong>"{room.name}"</strong>?
              </p>
              <p className="text-sm text-red-600 mt-2">
                ⚠️ Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait ruangan ini.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                disabled={deleting}
              >
                Batal
              </button>
              <button
                onClick={handleDeleteRoom}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={deleting}
              >
                {deleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Menghapus...
                  </span>
                ) : (
                  'Ya, Hapus'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Status */}
      {showStatusConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                room.isActive === false ? 'bg-green-100' : 'bg-orange-100'
              }`}>
                <span className={`text-2xl ${
                  room.isActive === false ? 'text-green-500' : 'text-orange-500'
                }`}>
                  {room.isActive === false ? '✅' : '⏸️'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {room.isActive === false ? 'Aktifkan Ruangan' : 'Nonaktifkan Ruangan'}
              </h3>
              <p className="text-gray-600">
                Apakah Anda yakin ingin {room.isActive === false ? 'mengaktifkan' : 'menonaktifkan'} ruangan <strong>"{room.name}"</strong>?
              </p>
              <p className="text-sm text-orange-600 mt-2">
                {room.isActive === false 
                  ? '✅ Ruangan akan dapat dipesan kembali setelah diaktifkan.'
                  : '⏸️ Ruangan tidak dapat dipesan setelah dinonaktifkan.'
                }
              </p>
              
              {/* Warning for ongoing bookings */}
              {getRoomStatus() === 'ongoing' && room.isActive === true && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-700 font-medium">
                      ⚠️ Ada reservasi yang sedang berlangsung! Ruangan tidak dapat dinonaktifkan.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowStatusConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                disabled={updatingStatus}
              >
                Batal
              </button>
              <button
                onClick={handleUpdateRoomStatus}
                className={`flex-1 px-4 py-3 text-white rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                  room.isActive === false 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : getRoomStatus() === 'ongoing'
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-orange-500 hover:bg-orange-600'
                }`}
                disabled={updatingStatus || (getRoomStatus() === 'ongoing' && room.isActive === true)}
              >
                {updatingStatus ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Memproses...
                  </span>
                ) : (
                  room.isActive === false ? 'Ya, Aktifkan' : 
                  getRoomStatus() === 'ongoing' ? 'Tidak Dapat Dinonaktifkan' : 'Ya, Nonaktifkan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomDetailPage;
