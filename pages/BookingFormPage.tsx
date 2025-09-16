
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Page, type MeetingRoom, type Booking } from '../types';
import { ApiService } from '../src/config/api';
import { BackArrowIcon } from '../components/icons';

interface BookingFormPageProps {
    onNavigate: (page: Page) => void;
    room: MeetingRoom | null;
    onBookingConfirmed: (booking: Booking) => void;
    bookingData?: Partial<Booking>;
}

const BookingFormPage: React.FC<BookingFormPageProps> = ({ onNavigate, room, onBookingConfirmed, bookingData }) => {
    const [selectedRoom, setSelectedRoom] = useState<MeetingRoom | null>(room);
    const [availableRooms, setAvailableRooms] = useState<MeetingRoom[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [topic, setTopic] = useState(bookingData?.topic || '');
    const [date, setDate] = useState(bookingData?.date || '');
    const [time, setTime] = useState(bookingData?.time || '');
    const [endTime, setEndTime] = useState(bookingData?.endTime || '');
    const [participants, setParticipants] = useState(bookingData?.participants || 1);
    const [pic, setPic] = useState(bookingData?.pic || '');
    const [meetingType, setMeetingType] = useState<'internal' | 'external'>(bookingData?.meetingType || 'internal');
    const [selectedFacilities, setSelectedFacilities] = useState<string[]>(bookingData?.facilities || []);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get facilities based on selected room
    const getRoomFacilities = (room: MeetingRoom | null): string[] => {
        if (!room) return [];
        return room.facilities || [];
    };

    // Available facilities based on selected room
    const availableFacilities = getRoomFacilities(selectedRoom);

    // Auto-fill end time when start time changes
    useEffect(() => {
        if (time && !endTime) {
            const [startHour, startMin] = time.split(':').map(Number);
            const endMinutes = startHour * 60 + startMin + 60; // Add 1 hour
            const endHour = Math.floor(endMinutes / 60);
            const endMin = endMinutes % 60;
            const autoEndTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
            setEndTime(autoEndTime);
        }
    }, [time, endTime]);

    // Auto-fill PIC with logged in user's name
    useEffect(() => {
        if (!pic) { // Only auto-fill if PIC is empty
            const userDataStr = localStorage.getItem('user_data');
            if (userDataStr) {
                try {
                    const userData = JSON.parse(userDataStr);
                    const userName = userData.full_name || userData.username || userData.email?.split('@')[0];
                    if (userName) {
                        setPic(userName);
                    }
                } catch (e) {
                    console.log('Failed to parse user data for PIC auto-fill');
                }
            }
        }
    }, [pic]);

    // Auto-fill PIC when component mounts (for AI bookings)
    useEffect(() => {
        if (!pic && bookingData?.pic) {
            setPic(bookingData.pic);
        } else if (!pic) {
            // If no PIC from booking data, use logged in user
            const userDataStr = localStorage.getItem('user_data');
            if (userDataStr) {
                try {
                    const userData = JSON.parse(userDataStr);
                    const userName = userData.full_name || userData.username || userData.email?.split('@')[0];
                    if (userName) {
                        setPic(userName);
                    }
                } catch (e) {
                    console.log('Failed to parse user data for PIC auto-fill');
                }
            }
        }
    }, [bookingData?.pic]);

    // Load available rooms from database
    useEffect(() => {
        const loadRooms = async () => {
            try {
                setLoadingRooms(true);
                
                // Load rooms from API
                const response = await fetch('/api/meeting_rooms.php?action=get_all');
                const result = await response.json();
                
                if (result.success && result.data) {
                    const roomsFromDB: MeetingRoom[] = result.data.map((room: any) => ({
                        id: room.id,
                        name: room.room_name || room.name,
                        floor: room.floor || '-',
                        capacity: Number(room.capacity || 0),
                        address: room.building || room.description || '-',
                        facilities: (() => {
                            const f = room.features;
                            if (Array.isArray(f)) return f as string[];
                            if (typeof f === 'string') {
                                try { 
                                    const j = JSON.parse(f); 
                                    if (Array.isArray(j)) return j; 
                                } catch {}
                                return f.split(',').map((s: string) => s.trim()).filter(Boolean);
                            }
                            return [] as string[];
                        })(),
                        image: room.image_url || '/images/meeting-rooms/default-room.jpg',
                        available: room.is_available === 1 || room.is_available === true
                    }));
                    
                    setAvailableRooms(roomsFromDB);
                    
                    // If no room is selected, select the first one
                    if (!selectedRoom && roomsFromDB.length > 0) {
                        setSelectedRoom(roomsFromDB[0]);
                    }
                } else {
                    console.error('Failed to load rooms from API:', result.message);
                    // Fallback to empty array if API fails
                    setAvailableRooms([]);
                }
            } catch (error) {
                console.error('Error loading rooms:', error);
                // Fallback to empty array if error occurs
                setAvailableRooms([]);
            } finally {
                setLoadingRooms(false);
            }
        };

        loadRooms();
    }, [selectedRoom]);

    // Optimized handlers to prevent re-renders
    const handleTopicChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setTopic(e.target.value);
    }, []);

    const handlePicChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setPic(e.target.value);
    }, []);

    const handleTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        // Normalisasi segera: ganti titik menjadi titik dua (beberapa locale menuliskan 15.34)
        const val = (e.target.value || '').replace(/\./g, ':');
        setTime(val);
    }, []);

    const handleEndTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = (e.target.value || '').replace(/\./g, ':');
        setEndTime(val);
    }, []);

    const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setDate(e.target.value);
    }, []);

    const handleParticipantsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setParticipants(parseInt(e.target.value, 10));
    }, []);

    const handleMeetingTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setMeetingType(e.target.value as 'internal' | 'external');
    }, []);

    const handleFacilityChange = useCallback((facility: string) => {
        setSelectedFacilities(prev => {
            if (prev.includes(facility)) {
                return prev.filter(f => f !== facility);
            } else {
                return [...prev, facility];
            }
        });
    }, []);

    const handleRoomChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const roomId = parseInt(e.target.value, 10);
        const room = availableRooms.find(r => r.id === roomId) || null;
        setSelectedRoom(room);
        
        // Reset selected facilities when room changes
        setSelectedFacilities([]);
    }, [availableRooms]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Prevent double submission
        if (isSubmitting) {
            console.log('Form is already being submitted, ignoring duplicate submission');
            return;
        }
        
        if (!selectedRoom) {
            alert('Error: No room selected. Please select a room.');
            return;
        }

        if (participants > selectedRoom.capacity) {
            alert(`Jumlah peserta melebihi kapasitas ruangan. Kapasitas maksimal: ${selectedRoom.capacity} orang.`);
            return;
        }

        // 1) Ambil user_id dari localStorage (hasil login)
        const userDataStr = localStorage.getItem('user_data');
        const userData = userDataStr ? JSON.parse(userDataStr) : null;
        const userId = userData?.id || 1; // fallback ke user_id 1 (admin) yang pasti ada
        
        console.log('User data from localStorage:', userData);
        console.log('Using userId:', userId);

        // 2) Siapkan payload sesuai backend (POST /bookings)
        // Use start time and end time separately
        const times = {
            start: time,
            end: endTime
        };

        // Helper: normalize HH:MM to HH:MM:00
        const normalizeTime = (t?: string) => {
            if (!t) return '';
            const val = t.replace(/\./g, ':');
            const m = val.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
            if (m) {
                const hh = String(Math.min(23, Math.max(0, parseInt(m[1], 10)))).padStart(2, '0');
                const mm = String(Math.min(59, Math.max(0, parseInt(m[2], 10)))).padStart(2, '0');
                return `${hh}:${mm}:00`;
            }
            return val;
        };
        const durationMinutes = (() => {
            if (times.start && times.end) {
                const [sH, sM] = times.start.split(':').map(Number);
                const [eH, eM] = times.end.split(':').map(Number);
                const diff = eH * 60 + eM - (sH * 60 + sM);
                return diff > 0 ? diff : 60;
            }
            return 60;
        })();

        // 3) Cocokkan room_id dengan data di database (fallback ke null jika belum ada)
        let resolvedRoomId: number | null = selectedRoom.id;
        try {
            const roomsResp = await ApiService.getAllRooms();
            const rooms = roomsResp?.data || [];
            const found = rooms.find((r: any) => {
                const a = (r.name || r.room_name || '').toLowerCase();
                const b = selectedRoom.name.toLowerCase();
                return a.includes(b) || b.includes(a);
            });
            resolvedRoomId = found ? found.id : null;
        } catch {}

        // Final guards - validate required fields
        if (!topic.trim()) {
            alert('Topik rapat wajib diisi.');
            return;
        }
        
        if (!date) {
            alert('Tanggal rapat wajib diisi.');
            return;
        }
        
        if (!pic.trim()) {
            alert('PIC (Penanggung Jawab) wajib diisi.');
            return;
        }
        
        if (!times.start) {
            alert('Waktu mulai rapat wajib diisi.');
            return;
        }
        
        // Auto-fill end time if not provided (default to 1 hour after start time)
        if (!times.end && times.start) {
            const [startHour, startMin] = times.start.split(':').map(Number);
            const endMinutes = startHour * 60 + startMin + 60; // Add 1 hour
            const endHour = Math.floor(endMinutes / 60);
            const endMin = endMinutes % 60;
            times.end = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
        }
        
        if (!times.end) {
            alert('Waktu berakhir rapat wajib diisi.');
            return;
        }
        
        // Validate that end time is after start time
        if (times.start && times.end) {
            const [startHour, startMin] = times.start.split(':').map(Number);
            const [endHour, endMin] = times.end.split(':').map(Number);
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;
            
            if (endMinutes <= startMinutes) {
                alert('Waktu berakhir harus setelah waktu mulai.');
                return;
            }
        }

        if (!resolvedRoomId) {
            alert('Ruangan tidak valid. Mohon pilih ruangan yang tersedia.');
            return;
        }

        const payload = {
            user_id: userId,
            room_id: resolvedRoomId,
            topic,
            meeting_date: date,
            meeting_time: normalizeTime(times.start || time),
            duration: durationMinutes,
            participants,
            pic, // kirim PIC yang diinput user ke backend
            meeting_type: meetingType || 'internal',
            facilities: selectedFacilities,
            booking_state: 'BOOKED'
        } as any;

        try {
            setIsSubmitting(true);
            console.log('Sending booking payload:', payload);
            const res = await ApiService.createBooking(payload);
            console.log('Booking response:', res);
            
            // 3) Konversi response ke tipe Booking frontend untuk halaman konfirmasi
            const newBooking: Booking = {
                id: res?.data?.id || Date.now(),
                roomId: resolvedRoomId || 0,
                roomName: selectedRoom.name,
                topic,
                date,
                time: times.start,
                participants,
                pic,
                meetingType,
                facilities: selectedFacilities,
            };
            
            console.log('🔍 BookingFormPage - Created booking object:', newBooking);
            console.log('🔍 BookingFormPage - Field details:', {
                roomName: newBooking.roomName,
                topic: newBooking.topic,
                pic: newBooking.pic,
                date: newBooking.date,
                time: newBooking.time,
                participants: newBooking.participants,
                meetingType: newBooking.meetingType
            });
            onBookingConfirmed(newBooking);
        } catch (err: any) {
            console.error('Gagal menyimpan booking ke backend:', err);
            console.error('Error details:', err.message, err.response);
            
            let errorMessage = 'Gagal menyimpan booking ke server. Mohon coba lagi.';
            if (err.message && err.message.includes('Room is not available')) {
                errorMessage = 'Ruangan tidak tersedia pada waktu yang dipilih. Silakan pilih waktu atau ruangan lain.';
            } else if (err.message && err.message.includes('required')) {
                errorMessage = 'Data tidak lengkap. Mohon isi semua field yang diperlukan.';
            }
            
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    }

    const FormInput: React.FC<{ label: string; id: string; type?: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean; min?: number; placeholder?: string }> = 
        ({ label, id, type = "text", value, onChange, required = true, min, placeholder }) => (
            <div>
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}:</label>
                <input 
                    type={type} 
                    id={id} 
                    name={id} 
                    value={value} 
                    onChange={onChange} 
                    required={required}
                    min={min}
                    placeholder={placeholder}
                    autoComplete="off"
                    spellCheck="false"
                    className="w-full p-3 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none transition-colors" 
                />
            </div>
        );

    const FormSelect: React.FC<{ label: string; id: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: { value: string; label: string }[]; required?: boolean }> = 
        ({ label, id, value, onChange, options, required = true }) => (
            <div>
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}:</label>
                <select 
                    id={id} 
                    name={id} 
                    value={value} 
                    onChange={onChange} 
                    required={required}
                    className="w-full p-3 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none transition-colors cursor-pointer" 
                >
                    {options.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        );

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50">
            {/* Header Section */}
            <div className="bg-white shadow-lg border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <button 
                                onClick={() => onNavigate(Page.MeetingRooms)} 
                                className="mr-6 p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                            >
                                <BackArrowIcon />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Formulir Pemesanan</h1>
                                <p className="text-gray-600 text-sm mt-1">Isi formulir untuk memesan ruangan meeting</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Form Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="room" className="block text-sm font-semibold text-gray-700 mb-3">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                            Pilih Ruangan *
                                        </span>
                                    </label>
                                    <select 
                                        id="room" 
                                        name="room" 
                                        value={selectedRoom?.id || ''} 
                                        onChange={handleRoomChange} 
                                        required
                                        disabled={loadingRooms}
                                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
                                    >
                                        <option value="" disabled>
                                            {loadingRooms ? 'Memuat ruangan...' : 'Pilih ruangan meeting'}
                                        </option>
                                        {availableRooms.map(room => (
                                            <option key={room.id} value={room.id}>
                                                {room.name} ({room.capacity} orang)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="topic" className="block text-sm font-semibold text-gray-700 mb-3">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                            Topik / Nama Rapat *
                                        </span>
                                    </label>
                                    <input 
                                        type="text" 
                                        id="topic" 
                                        name="topic" 
                                        value={topic}
                                        onChange={handleTopicChange}
                                        placeholder="Masukkan topik atau nama rapat"
                                        autoComplete="off"
                                        spellCheck="false"
                                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-300" 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="pic" className="block text-sm font-semibold text-gray-700 mb-3">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                            PIC (Person in Charge) *
                                        </span>
                                    </label>
                                    <input 
                                        type="text" 
                                        id="pic" 
                                        name="pic" 
                                        value={pic}
                                        onChange={handlePicChange}
                                        placeholder="Masukkan nama PIC"
                                        autoComplete="off"
                                        spellCheck="false"
                                        required
                                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-300" 
                                    />
                                </div>
                                <div>
                                    <label htmlFor="participants" className="block text-sm font-semibold text-gray-700 mb-3">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                            Jumlah Peserta *
                                        </span>
                                    </label>
                                    <input 
                                        type="number" 
                                        id="participants" 
                                        name="participants" 
                                        min={1}
                                        value={participants} 
                                        onChange={handleParticipantsChange}
                                        placeholder="Jumlah peserta"
                                        autoComplete="off"
                                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-300" 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-3">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                                            Tanggal Rapat *
                                        </span>
                                    </label>
                                    <input 
                                        type="date" 
                                        id="date" 
                                        name="date" 
                                        value={date} 
                                        onChange={handleDateChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-300" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                                            Waktu Rapat *
                                        </span>
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label htmlFor="time" className="block text-xs text-gray-500 mb-1">Mulai:</label>
                                            <input 
                                                type="time" 
                                                id="time" 
                                                name="time" 
                                                value={time}
                                                onChange={handleTimeChange}
                                                placeholder="e.g., 14:00"
                                                autoComplete="off"
                                                spellCheck="false"
                                                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-300" 
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label htmlFor="endTime" className="block text-xs text-gray-500 mb-1">Berakhir:</label>
                                            <input 
                                                type="time" 
                                                id="endTime" 
                                                name="endTime" 
                                                value={endTime}
                                                onChange={handleEndTimeChange}
                                                placeholder="e.g., 15:00"
                                                autoComplete="off"
                                                spellCheck="false"
                                                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-300" 
                                            />
                                        </div>
                                    </div>
                                    {time && endTime && (
                                        <div className="mt-2 text-sm text-gray-600">
                                            <span className="font-medium">Durasi:</span> {
                                                (() => {
                                                    const [startHour, startMin] = time.split(':').map(Number);
                                                    const [endHour, endMin] = endTime.split(':').map(Number);
                                                    const startMinutes = startHour * 60 + startMin;
                                                    const endMinutes = endHour * 60 + endMin;
                                                    const durationMinutes = endMinutes - startMinutes;
                                                    
                                                    if (durationMinutes <= 0) return 'Waktu tidak valid';
                                                    
                                                    const hours = Math.floor(durationMinutes / 60);
                                                    const minutes = durationMinutes % 60;
                                                    
                                                    if (hours > 0 && minutes > 0) {
                                                        return `${hours} jam ${minutes} menit`;
                                                    } else if (hours > 0) {
                                                        return `${hours} jam`;
                                                    } else {
                                                        return `${minutes} menit`;
                                                    }
                                                })()
                                            }
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="meetingType" className="block text-sm font-semibold text-gray-700 mb-3">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                            Jenis Rapat *
                                        </span>
                                    </label>
                                    <select 
                                        id="meetingType" 
                                        name="meetingType" 
                                        value={meetingType} 
                                        onChange={handleMeetingTypeChange}
                                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-300 cursor-pointer"
                                    >
                                        <option value="internal">Internal</option>
                                        <option value="external">Eksternal</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                            Fasilitas
                                        </span>
                                    </label>
                                    <div className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                                        <span className="text-green-600">✓</span>
                                        Pilih fasilitas yang tersedia di {selectedRoom?.name || 'ruangan meeting ini'}
                                    </div>
                                    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm">
                                        {availableFacilities.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {availableFacilities.map((facility) => (
                                                    <label key={facility} className="flex items-center gap-3 cursor-pointer hover:bg-blue-50 p-3 rounded-lg transition-all duration-200 border border-gray-100 hover:border-blue-200 hover:shadow-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedFacilities.includes(facility)}
                                                            onChange={() => handleFacilityChange(facility)}
                                                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700">{facility}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                <div className="text-4xl mb-2">🏢</div>
                                                <p>Pilih ruangan terlebih dahulu untuk melihat fasilitas yang tersedia</p>
                                            </div>
                                        )}
                                        
                                        {selectedFacilities.length > 0 && (
                                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                <div className="text-sm font-medium text-blue-800 mb-2">
                                                    Fasilitas yang dipilih ({selectedFacilities.length}):
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedFacilities.map((facility) => (
                                                        <span key={facility} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                            {facility}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleFacilityChange(facility)}
                                                                className="ml-1 text-blue-600 hover:text-blue-800"
                                                            >
                                                                ×
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => onNavigate(Page.MeetingRooms)}
                                    className="flex-1 bg-gray-100 text-gray-700 font-semibold py-4 px-6 rounded-xl hover:bg-gray-200 transition-all duration-200 border-2 border-gray-200 hover:border-gray-300"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <span>↩️</span>
                                        Batal
                                    </span>
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`flex-1 font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg ${
                                        isSubmitting 
                                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                                            : 'bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 hover:shadow-xl transform hover:-translate-y-0.5'
                                    }`}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Memproses...
                                            </>
                                        ) : (
                                            <>
                                                <span>✅</span>
                                                Konfirmasi Pemesanan
                                            </>
                                        )}
                                    </span>
                                </button>
                            </div>

                            {/* Room Details Section */}
                            {selectedRoom && (
                                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 rounded-2xl border-2 border-blue-200 shadow-lg mt-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm font-bold">🏢</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800">Detail Ruangan</h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-blue-100 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                                    <span className="text-green-600 text-xs">👥</span>
                                                </div>
                                                <span className="font-semibold text-gray-700 text-sm">Kapasitas</span>
                                            </div>
                                            <p className="text-lg font-bold text-gray-800">{selectedRoom.capacity} orang</p>
                                        </div>
                                        
                                        <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-blue-100 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-blue-600 text-xs">📍</span>
                                                </div>
                                                <span className="font-semibold text-gray-700 text-sm">Lokasi</span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-800">{selectedRoom.floor}, {selectedRoom.address}</p>
                                        </div>
                                        
                                        <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-blue-100 shadow-sm md:col-span-1 col-span-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                                                    <span className="text-purple-600 text-xs">⚙️</span>
                                                </div>
                                                <span className="font-semibold text-gray-700 text-sm">Fasilitas</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {selectedRoom.facilities.map((facility, index) => (
                                                    <span 
                                                        key={index}
                                                        className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium"
                                                    >
                                                        {facility}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Room Image Preview */}
                                    {selectedRoom.image && (
                                        <div className="mt-6">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                                                    <span className="text-orange-600 text-xs">📷</span>
                                                </div>
                                                <span className="font-semibold text-gray-700 text-sm">Preview Ruangan</span>
                                            </div>
                                            <div className="relative">
                                                <img 
                                                    src={selectedRoom.image} 
                                                    alt={selectedRoom.name}
                                                    className="w-full h-48 object-cover rounded-xl border-2 border-blue-200 shadow-md"
                                                />
                                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
                                                    <span className="text-xs font-medium text-gray-700">{selectedRoom.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingFormPage;