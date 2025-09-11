import React, { useState, useEffect } from 'react';
import { Page, type MeetingRoom, type Booking } from '../types';
import { BackArrowIcon } from '../components/icons';
import { ApiService } from '../src/config/api';
import { useDarkMode } from '../contexts/DarkModeContext';

interface RoomDetailPageProps {
  onNavigate: (page: Page) => void;
  onBookRoom: (room: MeetingRoom, bookingData?: Partial<Booking>) => void;
  room: MeetingRoom;
  bookings: Booking[];
  onEditRoom: (room: MeetingRoom) => void;
  onDeleteRoom: (roomId: number) => void;
}

const RoomDetailPage: React.FC<RoomDetailPageProps> = ({ onNavigate, onBookRoom, room, bookings, onEditRoom, onDeleteRoom }) => {
  const [roomBookings, setRoomBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    // Filter bookings untuk ruangan ini dari props bookings (yang sudah dikonfirmasi)
    const filteredBookings = bookings
      .filter(booking => {
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
        
        return roomMatch && dateMatch;
      })
      .map(booking => ({
        topic: booking.topic,
        meeting_date: booking.date,
        meeting_time: booking.time,
        end_time: calculateEndTime(booking.time, 60), // Default 1 hour duration
        participants: booking.participants,
        pic: booking.pic,
        meeting_type: booking.meetingType,
        food_order: booking.foodOrder,
        user_name: booking.pic
      }));
    
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
      label: 'Hari Ini',
      value: today.toISOString().split('T')[0],
      isToday: true
    });
    
    // Besok
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    options.push({
      label: 'Besok',
      value: tomorrow.toISOString().split('T')[0],
      isToday: false
    });
    
    // Minggu depan
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    options.push({
      label: 'Minggu Depan',
      value: nextWeek.toISOString().split('T')[0],
      isToday: false
    });
    
    // Bulan depan
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    options.push({
      label: 'Bulan Depan',
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

  const isRoomBooked = bookings.some(b => b.roomName === room.name);

  return (
    <div className={`backdrop-blur-sm p-8 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'}`}>
      <div className="flex items-center mb-6">
        <button 
          onClick={() => onNavigate(Page.MeetingRooms)} 
          className={`mr-4 p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
        >
          <BackArrowIcon />
        </button>
        <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{room.name}</h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Room Image and Info */}
        <div>
          <div className="h-80 rounded-lg mb-6 overflow-hidden">
            <img 
              src={room.image} 
              alt={room.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/meeting-rooms/default-room.jpg';
              }}
            />
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Informasi Ruangan</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEditRoom(room)}
                    className={`text-white px-4 py-2 rounded-lg transition text-sm font-medium ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className={`text-white px-4 py-2 rounded-lg transition text-sm font-medium ${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'}`}
                  >
                    🗑️ Hapus
                  </button>
                </div>
              </div>
              <div className={`space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <p><span className="font-semibold">Kapasitas:</span> {room.capacity} orang</p>
                <p><span className="font-semibold">Lantai:</span> {room.floor}</p>
                <p><span className="font-semibold">Alamat:</span> {room.address}</p>
                <p><span className="font-semibold">Fasilitas:</span> {room.facilities.join(', ')}</p>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => onBookRoom(room)}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition text-white ${isDarkMode ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-cyan-500 hover:bg-cyan-600'}`}
              >
                Pesan Ruangan
              </button>
            </div>
          </div>
        </div>

        {/* Booking Schedule */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Jadwal Booking</h3>
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
              <h4 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Pilih Tanggal</h4>
              
              {/* Quick Date Options */}
              <div className="mb-4">
                <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Pilihan Cepat:</p>
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
                  <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Tanggal dengan Booking:</p>
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
              <p>Tidak ada booking untuk {formatDate(selectedDate)}</p>
              <p className="text-sm mt-2">Ruangan tersedia sepanjang hari</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`bg-gradient-to-r rounded-xl p-6 mb-6 border ${isDarkMode ? 'from-blue-900/20 to-indigo-900/20 border-blue-800' : 'from-blue-50 to-indigo-50 border-blue-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`text-xl font-bold mb-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                      📅 Jadwal Booking - {formatDate(selectedDate)}
                    </h4>
                    <p className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>
                      Total {roomBookings.length} pemesanan untuk hari ini
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
                              {booking.topic || 'Meeting'}
                            </h5>
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'}`}>
                            BOOKED
                          </span>
                        </div>
                        
                        {/* Meeting Details Grid */}
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600">📅</span>
                            <div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tanggal</div>
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
                              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Waktu</div>
                              <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                {formatTime(booking.meeting_time)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-purple-600">👤</span>
                            <div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>PIC</div>
                              <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{booking.pic || '-'}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-orange-600">👥</span>
                            <div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Peserta</div>
                              <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{booking.participants} orang</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-600">🏢</span>
                            <div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Jenis</div>
                              <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{booking.meeting_type || 'internal'}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-pink-600">🍽️</span>
                            <div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Makanan</div>
                              <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{booking.food_order || 'tidak'}</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Duration Footer */}
                        <div className={`bg-gradient-to-r rounded-lg p-3 ${isDarkMode ? 'from-gray-600 to-gray-700' : 'from-gray-50 to-gray-100'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>⏱️ Durasi:</span>
                              <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                {(() => {
                                  const start = new Date(`2000-01-01 ${booking.meeting_time}`);
                                  const end = new Date(`2000-01-01 ${booking.end_time}`);
                                  const diffMs = end.getTime() - start.getTime();
                                  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                                  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                  return `${diffHours} jam ${diffMinutes > 0 ? `${diffMinutes} menit` : ''}`.trim();
                                })()}
                              </span>
                            </div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Slot: {formatTime(booking.meeting_time)}
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
                      ← Geser untuk melihat booking lainnya →
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Available Time Slots */}
          <div className="mt-6">
            <h4 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Slot Waktu Tersedia - {formatDate(selectedDate)}
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
                        <div className="text-xs mt-1 font-semibold text-red-700">BOOKED</div>
                        <div className="text-xs text-red-500 truncate mt-1">
                          {bookingForSlot.topic}
                        </div>
                        <div className="text-xs text-red-400 mt-1">
                          {bookingForSlot.pic}
                        </div>
                        <div className="text-xs text-red-600 mt-1 font-medium">
                          ❌ Tidak tersedia
                        </div>
                      </>
                    )}
                    
                    {isPastTime && (
                      <div className="text-xs mt-1 text-gray-500">PAST</div>
                    )}
                    
                    {!isBooked && !isPastTime && (
                      <div className="text-xs mt-1 text-green-500 font-medium">
                        Tersedia
                      </div>
                    )}
                    
                    {/* Tooltip untuk detail booking */}
                    {isBooked && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                        <div className="bg-gray-800 text-white text-xs rounded-lg p-3 shadow-lg min-w-64">
                          <div className="font-semibold mb-2">{bookingForSlot.topic}</div>
                          <div className="space-y-1">
                            <div>📅 {formatTime(bookingForSlot.meeting_time)}</div>
                            <div>👤 PIC: {bookingForSlot.pic}</div>
                            <div>👥 Peserta: {bookingForSlot.participants} orang</div>
                            <div>🏢 Jenis: {bookingForSlot.meeting_type}</div>
                            <div>🍽️ Makanan: {bookingForSlot.food_order}</div>
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
                  <span>Tersedia</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                  <span>Sudah Dipesan</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
                  <span>Waktu Lalu</span>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-600 font-semibold">💡 Tips:</span>
                </div>
                <ul className="text-blue-700 space-y-1">
                  <li>• <strong>Klik slot hijau</strong> untuk memesan ruangan pada waktu tersebut</li>
                  <li>• <strong>Slot merah tidak bisa diklik</strong> karena sudah dipesan</li>
                  <li>• Hover pada slot merah untuk melihat detail pemesanan yang sudah ada</li>
                  <li>• Slot abu-abu menunjukkan waktu yang sudah lewat</li>
                  <li>• Gunakan navigasi tanggal untuk melihat booking di hari lain</li>
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
                Konfirmasi Pemesanan
              </h3>
              <p className="text-gray-600">
                Anda akan memesan ruangan untuk waktu yang dipilih
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ruangan:</span>
                  <span className="font-medium text-gray-800">{room.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tanggal:</span>
                  <span className="font-medium text-gray-800">{formatDate(selectedDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Waktu:</span>
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
    </div>
  );
};

export default RoomDetailPage;
