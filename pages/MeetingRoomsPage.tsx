
import React from 'react';
import { Page, type MeetingRoom, type Booking } from '../types';
import { BackArrowIcon } from '../components/icons';
import { ApiService } from '../src/config/api';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useLanguage } from '../contexts/LanguageContext';

const MeetingRoomCard: React.FC<{ room: MeetingRoom, onBook: (room: MeetingRoom) => void, onRoomDetail: (room: MeetingRoom) => void }> = ({ room, onBook, onRoomDetail }) => {
    const { isDarkMode } = useDarkMode();
    const { t } = useLanguage();
    
    const handleCardClick = () => {
        onRoomDetail(room);
    }

    const handleBookClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onBook(room);
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'}`}>
                            {t('meetingRooms.available')}
                        </div>
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
                            className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${isDarkMode ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-cyan-500 hover:bg-cyan-600'} text-white shadow-md hover:shadow-lg`}
                        >
                            📅 {t('meetingRooms.book')}
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
}
const MeetingRoomsPage: React.FC<MeetingRoomsPageProps> = ({ onNavigate, onBookRoom, onRoomDetail, onAddRoom, bookings = [] }) => {
    const [rooms, setRooms] = React.useState<MeetingRoom[]>([]);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState<string | null>(null);
    const { isDarkMode } = useDarkMode();
    const { t } = useLanguage();
    
    // Calculate rooms currently in use based on current time
    const getRoomsInUse = () => {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
        
        const activeBookings = bookings.filter(booking => {
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
                String(h.id) === String(booking.id) && h.status === 'Selesai'
            );
            
            return isTimeActive && !isCompleted;
        });
        
        const uniqueRooms = new Set(activeBookings.map(booking => booking.roomName));
        
        console.log('🔍 MeetingRoomsPage - Room stats calculation:', {
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
    }, []);

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
                                    {t('meetingRooms.title')}
                                </h1>
                                <p className="text-white/80 text-lg font-medium">
                                    {t('meetingRooms.subtitle')}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-6">
                            <button 
                                onClick={onAddRoom}
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
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                
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
                                <p className="text-gray-600 text-sm font-medium">Rooms Used</p>
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
                                        onClick={onAddRoom}
                                        className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-3 px-8 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                    >
                                        {t('meetingRooms.addFirstRoom')}
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {rooms.map(room => (
                                        <MeetingRoomCard 
                                            key={room.id} 
                                            room={room} 
                                            onBook={onBookRoom}
                                            onRoomDetail={onRoomDetail}
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