
import React from 'react';
import { Page, type MeetingRoom, type Booking, type User } from '../types';
import { BackArrowIcon } from '../components/icons';
import { ApiService } from '../src/config/api';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useLanguage } from '../contexts/LanguageContext';
import KotakPattern from '../components/KotakPattern';

const MeetingRoomCard: React.FC<{ room: MeetingRoom, onBook: (room: MeetingRoom) => void, onRoomDetail: (room: MeetingRoom) => void, bookings: Booking[] }> = ({ room, onBook, onRoomDetail, bookings }) => {
    const { isDarkMode } = useDarkMode();
    const { t } = useLanguage();
    
    const handleCardClick = () => {
        onRoomDetail(room);
    }

    const handleBookClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onBook(room);
    }

    // Cek status individual ruang ini berdasarkan status reservasi
    const getRoomStatus = () => {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
        
        console.log('🔍 getRoomStatus - Checking room:', room.name, 'Current time:', { currentDate, currentTime });
        
        // Cari booking untuk ruang ini
        const roomBookings = bookings.filter(booking => booking.roomName === room.name);
        
        console.log('🔍 getRoomStatus - Room bookings found:', roomBookings.length, roomBookings.map(b => ({
            id: b.id,
            topic: b.topic,
            date: b.date,
            time: b.time,
            endTime: b.endTime
        })));
        
        // Use same logic as ReservationsPage getActiveReservations
        const activeBooking = roomBookings.find(booking => {
            // Check if booking is today
            if (booking.date !== currentDate) return false;
            
            // Check if current time is within booking time range
            const startTime = booking.time;
            const endTime = booking.endTime || booking.time; // fallback to start time if no end time
            
            // Check if booking is currently active (time-wise)
            const isTimeActive = currentTime >= startTime && currentTime <= endTime;
            
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
            // This will help us see all active reservations (same as ReservationsPage)
            const isActive = !isCancelled; // Simplified logic for debugging
            
            console.log('🔍 getRoomStatus - Booking check (same as ReservationsPage):', {
                topic: booking.topic,
                isTimeActive,
                isCompleted,
                isCancelled,
                isActive
            });
            
            return isActive;
        });
        
        // Return status berdasarkan booking yang ditemukan
        let status = 'available';
        if (activeBooking) {
            // Check if it's ongoing or upcoming based on time
            const startTime = activeBooking.time;
            const endTime = activeBooking.endTime || activeBooking.time;
            const isTimeActive = currentTime >= startTime && currentTime <= endTime;
            const isUpcoming = currentTime < startTime;
            
            if (isTimeActive) {
                status = 'ongoing';
            } else if (isUpcoming) {
                status = 'upcoming';
        } else {
                status = 'ongoing'; // Default to ongoing if we have a booking
            }
        }
        
        console.log('🔍 getRoomStatus - Final status for room', room.name, ':', status);
        return status;
    }

    return (
        <div className={`group relative overflow-hidden rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`} onClick={handleCardClick}>
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative">
                {/* Image Section */}
                <div className="relative h-48 overflow-hidden">
                    <img 
                        src={room.image} 
                        alt={room.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/meeting-rooms/default-room.jpg';
                        }}
                    />
                    {/* Overlay gradient */}
                    <div className={`absolute inset-0 ${room.isActive === false ? 'bg-gradient-to-t from-red-900/40 to-red-500/20' : 'bg-gradient-to-t from-black/20 to-transparent'}`}></div>
                    
                    {/* Nonaktif Overlay */}
                    {room.isActive === false && (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-gray-800/30 to-slate-700/40 backdrop-blur-sm"></div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                        {(() => {
                            // Check if room is inactive first
                            if (room.isActive === false) {
                                return (
                                    <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/90 backdrop-blur-md text-slate-700 shadow-lg border border-white/20">
                                        <span className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                            <span>Maintenance</span>
                                        </span>
                                    </div>
                                );
                            }
                            
                            const roomStatus = getRoomStatus();
                            
                            if (roomStatus === 'ongoing') {
                                return (
                                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'}`}>
                                        {t('meetingRooms.ongoing')}
                                    </div>
                                );
                            } else if (roomStatus === 'upcoming') {
                                return (
                                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${isDarkMode ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-800'}`}>
                                        {t('meetingRooms.upcoming')}
                                    </div>
                                );
                            } else {
                                return (
                                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'}`}>
                                        {t('meetingRooms.available')}
                                    </div>
                                );
                            }
                        })()}
                    </div>
                </div>
                
                {/* Content Section */}
                <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                        <h3 className={`text-xl font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-800'}`} title={room.name}>
                            {room.name}
                        </h3>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                            <span className="text-blue-600 text-sm">🏢</span>
                        </div>
                    </div>
                    
                    {/* Details Grid */}
                    <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                                <span className="text-orange-600 text-xs">👥</span>
                            </div>
                            <div>
                                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('meetingRooms.capacity')}</div>
                                <div className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                    {room.capacity} {t('meetingRooms.people')}
                                </div>
                            </div>
                        </div>
                        
                        {/* Nonaktif Status Message */}
                        {room.isActive === false && (
                            <div className={`relative overflow-hidden p-3 rounded-lg border ${
                                isDarkMode 
                                    ? 'bg-slate-800/50 border-slate-600/30 backdrop-blur-sm' 
                                    : 'bg-slate-50/80 border-slate-200/50 backdrop-blur-sm'
                            }`}>
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                        isDarkMode ? 'bg-orange-500/20' : 'bg-orange-100'
                                    }`}>
                                        <svg className={`w-3 h-3 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Under Maintenance</div>
                                        <div className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                            Temporarily unavailable
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                                <span className="text-purple-600 text-xs">📍</span>
                            </div>
                            <div>
                                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('meetingRooms.address')}</div>
                                <div className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                    {room.address}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                            <div className={`w-6 h-6 rounded flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                                <span className="text-green-600 text-xs">⚡</span>
                            </div>
                            <div className="flex-1">
                                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('meetingRooms.facilities')}</div>
                                <div className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                    {room.facilities.slice(0, 2).join(', ')}
                                    {room.facilities.length > 2 && '...'}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleBookClick}
                            disabled={room.isActive === false}
                            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                                room.isActive === false
                                    ? 'bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200'
                                    : isDarkMode 
                                        ? 'bg-cyan-600 hover:bg-cyan-700 shadow-md hover:shadow-lg' 
                                        : 'bg-cyan-500 hover:bg-cyan-600 shadow-md hover:shadow-lg'
                            } text-white`}
                        >
                            {room.isActive === false ? (
                                <span className="flex items-center justify-center gap-1.5">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    Unavailable
                                </span>
                            ) : (
                                `📅 ${t('meetingRooms.book')}`
                            )}
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRoomDetail(room);
                            }}
                            className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${isDarkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            👁️
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface MeetingRoomsPageProps {
    onNavigate: (page: Page) => void;
    onBookRoom: (room: MeetingRoom) => void;
    onRoomDetail: (room: MeetingRoom) => void;
    onAddRoom: () => void;
    bookings?: Booking[];
    onUpdateRoomStatus?: (roomId: number, isActive: boolean) => void;
    user?: User;
}
const MeetingRoomsPage: React.FC<MeetingRoomsPageProps> = ({ onNavigate, onBookRoom, onRoomDetail, onAddRoom, bookings = [], onUpdateRoomStatus, user }) => {
    const [rooms, setRooms] = React.useState<MeetingRoom[]>([]);
    const [filteredRooms, setFilteredRooms] = React.useState<MeetingRoom[]>([]);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState<string | null>(null);
    const [searchTerm, setSearchTerm] = React.useState<string>('');
    const [selectedCapacity, setSelectedCapacity] = React.useState<string>('');
    const [selectedStatus, setSelectedStatus] = React.useState<string>('');
    const { isDarkMode } = useDarkMode();
    const { t } = useLanguage();
    
    // Calculate rooms currently in use based on current time (ONLY ONGOING)
    const getRoomsInUse = () => {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
        
        console.log('🔍 MeetingRoomsPage - Current time:', { currentDate, currentTime });
        console.log('🔍 MeetingRoomsPage - Total bookings received:', bookings.length);
        console.log('🔍 MeetingRoomsPage - All bookings:', bookings.map(b => ({
            id: b.id,
            topic: b.topic,
            roomName: b.roomName,
            date: b.date,
            time: b.time,
            endTime: b.endTime,
            status: b.status,
            booking_state: b.booking_state,
            source: b.source
        })));
        
        // Use same logic as ReservationsPage getActiveReservations
        const activeBookings = bookings.filter(booking => {
            console.log('🔍 MeetingRoomsPage - Checking booking:', {
                id: booking.id,
                topic: booking.topic,
                roomName: booking.roomName,
                date: booking.date,
                time: booking.time,
                endTime: booking.endTime,
                currentDate,
                currentTime,
                status: booking.status,
                booking_state: booking.booking_state,
                source: booking.source
            });
            
            // Check if booking is today
            if (booking.date !== currentDate) {
                console.log('🔍 MeetingRoomsPage - Not today:', booking.topic);
                return false;
            }
            
            // Check if current time is within booking time range
            const startTime = booking.time;
            const endTime = booking.endTime || booking.time; // fallback to start time if no end time
            
            // Check if booking is currently active (time-wise)
            const isTimeActive = currentTime >= startTime && currentTime <= endTime;
            
            console.log('🔍 MeetingRoomsPage - Time check:', {
                startTime,
                endTime,
                currentTime,
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
            // This will help us see all active reservations (same as ReservationsPage)
            const isActive = !isCancelled; // Simplified logic for debugging
            
            console.log('🔍 MeetingRoomsPage - Final result (simplified):', {
                topic: booking.topic,
                isTimeActive,
                isCompleted,
                isCancelled,
                isActive
            });
            
            return isActive;
        });
        
        const uniqueRooms = new Set(activeBookings.map(booking => booking.roomName));
        
        console.log('🔍 MeetingRoomsPage - Room stats calculation (same as ReservationsPage):', {
            currentDate,
            currentTime,
            totalBookings: bookings.length,
            activeBookings: activeBookings.length,
            activeBookingsDetails: activeBookings.map(b => ({
                id: b.id,
                topic: b.topic,
                roomName: b.roomName,
                date: b.date,
                time: b.time,
                endTime: b.endTime
            })),
            uniqueRooms: Array.from(uniqueRooms),
            roomsInUse: uniqueRooms.size
        });
        
        return uniqueRooms.size;
    };
    
    // Calculate available rooms (total - in use)
    const getAvailableRooms = () => {
        const roomsInUse = getRoomsInUse();
        const availableRooms = rooms.length - roomsInUse;
        
        console.log('🔍 MeetingRoomsPage - Available rooms calculation:', {
            totalRooms: rooms.length,
            roomsInUse,
            availableRooms
        });
        
        return availableRooms;
    };

    // Filter rooms based on search criteria
    const filterRooms = () => {
        let filtered = rooms;

        // Filter by search term (name, address, facilities)
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(room => 
                room.name.toLowerCase().includes(term) ||
                room.address.toLowerCase().includes(term) ||
                room.facilities.some(facility => facility.toLowerCase().includes(term))
            );
        }

        // Filter by capacity
        if (selectedCapacity) {
            const capacity = parseInt(selectedCapacity);
            filtered = filtered.filter(room => room.capacity >= capacity);
        }

        // Filter by status
        if (selectedStatus) {
            filtered = filtered.filter(room => {
                if (selectedStatus === 'available') {
                    return room.isActive !== false;
                } else if (selectedStatus === 'maintenance') {
                    return room.isActive === false;
                }
                return true;
            });
        }

        setFilteredRooms(filtered);
    };

    // Update filtered rooms when search criteria change
    React.useEffect(() => {
        filterRooms();
    }, [rooms, searchTerm, selectedCapacity, selectedStatus]);

    // Clear search
    const clearSearch = () => {
        setSearchTerm('');
        setSelectedCapacity('');
        setSelectedStatus('');
    };

    React.useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                console.log('Loading meeting rooms...');
                const res = await ApiService.getAllRooms();
                console.log('API Response:', res);
                
                const raw = (res && (res as any).data) ? (res as any).data : res;
                console.log('Raw data:', raw);
                
                if (!raw || !Array.isArray(raw)) {
                    throw new Error('Invalid data format from API');
                }
                
                console.log('🔍 MeetingRoomsPage - Raw rooms data:', raw);
                console.log('🔍 MeetingRoomsPage - Total rooms from API:', raw.length);
                
                const mapped: MeetingRoom[] = (raw || []).map((r: any) => ({
                    id: r.id ?? r.room_id,
                    name: r.name ?? r.room_name,
                    floor: r.floor || '-',
                    capacity: Number(r.capacity || 0),
                    address: r.building || r.description || '-',
                    facilities: (() => {
                        const f = r.features;
                        if (Array.isArray(f)) return f as string[];
                        if (typeof f === 'string') {
                            try { const j = JSON.parse(f); if (Array.isArray(j)) return j; } catch {}
                            return f.split(',').map((s: string) => s.trim()).filter(Boolean);
                        }
                        return [] as string[];
                    })(),
                    image: r.image_url || '/images/meeting-rooms/default-room.jpg',
                    isActive: r.is_active !== undefined ? Boolean(r.is_active) : (r.is_available !== undefined ? Boolean(r.is_available) : true), // Use is_active or fallback to is_available
                }));
                
                console.log('Mapped rooms:', mapped);
                console.log('🔍 MeetingRoomsPage - Setting rooms:', mapped.length);
                setRooms(mapped);
            } catch (e) {
                console.error('Failed to load rooms:', e);
                setError(`Failed to load data: ${e instanceof Error ? e.message : 'Unknown error'}`);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [bookings]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 relative">
            {/* Kotak Pattern Background dengan warna teal - hanya untuk bagian ruangan */}
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
                                    {t('meetingRooms.title')}
                                </h1>
                                <p className="text-white/80 text-lg font-medium">
                                    {t('meetingRooms.subtitle')}
                                </p>
                                </div>
                            </div>
                        </div>
                        
                        {user?.role === 'admin' && (
                            <div className="flex items-center space-x-6">
                                <button 
                                    onClick={() => {
                                        if (user?.role !== 'admin') {
                                            alert('Anda tidak memiliki akses untuk menambah ruangan. Hanya admin yang dapat melakukan operasi ini.');
                                            return;
                                        }
                                        onAddRoom();
                                    }}
                                    className="group relative px-8 py-4 bg-gradient-to-r from-white to-blue-50 text-gray-800 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden border border-white/40"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <span className="relative flex items-center space-x-3 group-hover:text-white">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        <span>{t('meetingRooms.addRoom')}</span>
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                
                {/* Search and Filter Section */}
                <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search Input */}
                        <div className="flex-1">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder={t('meetingRooms.searchPlaceholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Capacity Filter */}
                        <div className="lg:w-48">
                            <select
                                value={selectedCapacity}
                                onChange={(e) => setSelectedCapacity(e.target.value)}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                            >
                                <option value="">{t('meetingRooms.allCapacities')}</option>
                                <option value="2">{t('meetingRooms.capacity2')}</option>
                                <option value="4">{t('meetingRooms.capacity4')}</option>
                                <option value="6">{t('meetingRooms.capacity6')}</option>
                                <option value="8">{t('meetingRooms.capacity8')}</option>
                                <option value="10">{t('meetingRooms.capacity10')}</option>
                                <option value="15">{t('meetingRooms.capacity15')}</option>
                                <option value="20">{t('meetingRooms.capacity20')}</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="lg:w-48">
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                            >
                                <option value="">{t('meetingRooms.allStatus')}</option>
                                <option value="available">{t('meetingRooms.available')}</option>
                                <option value="maintenance">{t('meetingRooms.maintenance')}</option>
                            </select>
                        </div>

                        {/* Clear Filters Button */}
                        {(searchTerm || selectedCapacity || selectedStatus) && (
                            <button
                                onClick={clearSearch}
                                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium flex items-center gap-2"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                {t('meetingRooms.reset')}
                            </button>
                        )}
                    </div>

                    {/* Search Results Info */}
                    {(searchTerm || selectedCapacity || selectedStatus) && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600">
                                    {t('meetingRooms.showingResults').replace('{filtered}', filteredRooms.length.toString()).replace('{total}', rooms.length.toString())}
                                </p>
                                {filteredRooms.length === 0 && (
                                    <p className="text-sm text-red-600 font-medium">
                                        {t('meetingRooms.noSearchResults')}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Stats Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">{t('meetingRooms.totalRooms')}</p>
                                <p className="text-3xl font-bold text-gray-800">{rooms.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <span className="text-blue-600 text-xl">🏢</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">{t('meetingRooms.availableRooms')}</p>
                                <p className="text-3xl font-bold text-green-600">{getAvailableRooms()}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <span className="text-green-600 text-xl">✅</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">{t('meetingRooms.roomsUsed')}</p>
                                <p className="text-3xl font-bold text-purple-600">{getRoomsInUse()}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <span className="text-purple-600 text-xl">🏢</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                    {loading && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                            <p className="text-gray-600">{t('meetingRooms.loading')}</p>
                        </div>
                    )}
                    
                    {error && !loading && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-red-600 text-2xl">⚠️</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">{t('meetingRooms.error')}</h3>
                            <p className="text-gray-600 mb-4">{error}</p>
                            <button 
                                onClick={() => window.location.reload()}
                                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
                            >
                                {t('meetingRooms.retry')}
                            </button>
                        </div>
                    )}

                    {!loading && !error && (
                        <>
                            {rooms.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <span className="text-gray-400 text-4xl">🏢</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-3">{t('meetingRooms.noRooms')}</h3>
                                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                        {t('meetingRooms.noRoomsDesc')}
                                    </p>
                                    <button 
                                        onClick={() => {
                                            if (user?.role !== 'admin') {
                                                alert('Anda tidak memiliki akses untuk menambah ruangan. Hanya admin yang dapat melakukan operasi ini.');
                                                return;
                                            }
                                            onAddRoom();
                                        }}
                                        className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-3 px-8 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                    >
                                        {t('meetingRooms.addFirstRoom')}
                                    </button>
                                </div>
                            ) : filteredRooms.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <span className="text-gray-400 text-4xl">🔍</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-3">Tidak Ada Hasil Pencarian</h3>
                                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                        Tidak ada ruangan yang sesuai dengan kriteria pencarian Anda. Coba ubah kata kunci atau filter pencarian.
                                    </p>
                                    <button 
                                        onClick={clearSearch}
                                        className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-3 px-8 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                    >
                                        Reset Pencarian
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredRooms.map(room => (
                                        <MeetingRoomCard 
                                            key={room.id} 
                                            room={room} 
                                            onBook={onBookRoom}
                                            onRoomDetail={onRoomDetail}
                                            bookings={bookings}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MeetingRoomsPage;