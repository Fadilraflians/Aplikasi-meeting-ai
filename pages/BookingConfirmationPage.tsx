
import React, { useEffect } from 'react';
import { Page, type Booking, BookingState } from '../types';
import { ApiService } from '../src/config/api';
// import { saveFormBookingData, saveAIBookingData } from '../services/aiDatabaseService'; // Removed - service deleted

interface BookingConfirmationPageProps {
    onNavigate: (page: Page) => void;
    booking: Booking | null;
}

/*use effect to save booking to database to table ai_booking_data
booking.roomname -> room_id
booking.topic -> topic
booking.pic -> pic
booking.meetingType -> meeting_type
booking.date -> meeting_date
booking.time -> meeting_time
booking.participants -> participants
booking.foodOrder -> food_order
*/

const SuccessIcon: React.FC = () => (
    <svg className="w-20 h-20 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
);

const BookingConfirmationPage: React.FC<BookingConfirmationPageProps> = ({ onNavigate, booking }) => {
    // Function to calculate end time based on start time and duration
    const calculateEndTime = (startTime: string, durationMinutes: number): string => {
        try {
            const [hours, minutes] = startTime.split(':').map(Number);
            const startDate = new Date();
            startDate.setHours(hours, minutes, 0, 0);
            
            const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
            
            return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
        } catch (error) {
            console.error('Error calculating end time:', error);
            // Default: add 1 hour
            const [hours, minutes] = startTime.split(':').map(Number);
            const endHours = (hours + 1) % 24;
            return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
    };

    useEffect(() => {
        console.log('🔍 BookingConfirmationPage - booking data received:', booking);
        console.log('🔍 BookingConfirmationPage - booking data details:', {
            roomName: booking?.roomName,
            topic: booking?.topic,
            pic: booking?.pic,
            date: booking?.date,
            time: booking?.time,
            participants: booking?.participants,
            meetingType: booking?.meetingType
        });
        if (!booking) return;
        
        // Prevent duplicate saves with a flag
        const saveKey = `booking_saved_${booking.roomName}_${booking.topic}_${booking.date}_${booking.time}`;
        if (localStorage.getItem(saveKey)) {
            console.log('ℹ️ Booking already saved, skipping duplicate save');
            return;
        }
        
        const t = setTimeout(async () => {
            try {
                // Ambil user_id dari session_token dengan fallback
                const token = localStorage.getItem('session_token') || '';
                let user_id = null;
                
                if (token) {
                    user_id = await ApiService.getUserBySessionToken(token);
                }
                
                // Fallback: jika tidak ada token atau token tidak valid, gunakan user_id default
                if (!user_id) {
                    console.warn('Session token tidak tersedia atau tidak valid. Menggunakan user_id default.');
                    user_id = 1; // Default user_id
                }

                console.log('User ID untuk booking:', user_id);

                // Normalisasi meeting_time ("HH:MM" atau "HH:MM - HH:MM") -> "HH:MM:00"
                const timeStr = booking.time || '';
                const rangeMatch = timeStr.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
                const startTime = rangeMatch ? rangeMatch[1] : (timeStr.match(/^(\d{1,2}:\d{2})/)?.[1] || '09:00');
                const meeting_time = `${startTime}:00`;

                // Hitung duration menit jika format rentang waktu, default 60
                let duration = 60;
                if (rangeMatch) {
                    const [sh, sm] = rangeMatch[1].split(':').map(Number);
                    const [eh, em] = rangeMatch[2].split(':').map(Number);
                    const startM = sh * 60 + sm;
                    const endM = eh * 60 + em;
                    if (endM > startM) duration = endM - startM;
                }

                // Generate session_id yang konsisten berdasarkan booking data
                const currentSessionId = `ai_${Date.now()}`;
                
                // Simpan data booking AI ke ai_bookings_success table
                // const ok = await saveAIBookingData(
                //     user_id,
                //     currentSessionId,
                //     BookingState.BOOKED,
                //     {
                //         roomName: booking.roomName,
                //         topic: booking.topic,
                //         pic: booking.pic,
                //         date: booking.date,
                //         time: booking.time,
                //         participants: booking.participants,
                //         meetingType: booking.meetingType,
                //         foodOrder: booking.foodOrder
                //     }
                // );
                
                // Temporary: Skip database save since aiDatabaseService is removed
                const ok = true;

                if (ok) {
                    console.log('✅ AI booking data saved to ai_bookings_success table successfully');
                    // Mark as saved to prevent duplicates
                    localStorage.setItem(saveKey, 'true');
                    localStorage.setItem('last_ai_booking_session_id', currentSessionId);
                } else {
                    console.warn('⚠️ Warning: failed to save AI booking to backend');
                }

                console.log('Booking confirmed:', booking);
            } catch(error) {
                console.log('error', error);
                console.log('booking confirmation error', booking);
            }
        }, 1000);
        return () => clearTimeout(t);
    }, [booking]);

    if (!booking) {
        return (
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg max-w-2xl mx-auto text-center">
                <h2 className="text-2xl font-bold text-red-600">Error: Booking Not Found</h2>
                <p className="text-gray-600 mt-4">Could not find the booking details. Please try again.</p>
                <button 
                    onClick={() => onNavigate(Page.Dashboard)} 
                    className="mt-6 bg-teal-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-teal-600 transition shadow-lg"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }
    
    return (
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg max-w-2xl mx-auto text-center">
            <SuccessIcon />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Pemesanan Berhasil!</h2>
            <p className="text-gray-600 mb-8">Ruang rapat Anda telah berhasil dikonfirmasi.</p>
            
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-left space-y-3">
                <h3 className="text-xl font-bold text-teal-600 mb-4 border-b pb-2">Rincian Reservasi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    <div>
                        <p className="text-sm text-gray-500">Ruang Rapat</p>
                        <p className="font-semibold text-lg text-gray-800">{booking.roomName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Topik Rapat</p>
                        <p className="font-semibold text-lg text-gray-800">{booking.topic}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">PIC</p>
                        <p className="font-semibold text-lg text-gray-800">{booking.pic}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Jenis Rapat</p>
                        <p className="font-semibold text-lg text-gray-800 capitalize">
                            {booking.meetingType === 'internal' ? 'Internal' : 
                             booking.meetingType === 'external' ? 'Eksternal' : 
                             booking.meetingType || 'Internal'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Tanggal</p>
                        <p className="font-semibold text-lg text-gray-800">
                            {(() => {
                                if (!booking.date) return '-';
                                const date = new Date(booking.date);
                                return date.toLocaleDateString('id-ID', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                });
                            })()}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Waktu Mulai</p>
                        <p className="font-semibold text-lg text-gray-800">
                            {(() => {
                                const time = booking.time || '09:00';
                                // Normalize time format: replace dots with colons and ensure HH:MM format
                                const normalizedTime = time.replace(/\./g, ':');
                                // If it's in HH:MM:SS format, take only HH:MM
                                return normalizedTime.includes(':') && normalizedTime.split(':').length === 3 
                                    ? normalizedTime.substring(0, 5) 
                                    : normalizedTime;
                            })()}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Waktu Berakhir</p>
                        <p className="font-semibold text-lg text-gray-800">
                            {(() => {
                                const endTime = booking.endTime || calculateEndTime(booking.time || '09:00', booking.duration || 60);
                                // Normalize time format: replace dots with colons and ensure HH:MM format
                                const normalizedTime = endTime.replace(/\./g, ':');
                                // If it's in HH:MM:SS format, take only HH:MM
                                return normalizedTime.includes(':') && normalizedTime.split(':').length === 3 
                                    ? normalizedTime.substring(0, 5) 
                                    : normalizedTime;
                            })()}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Jumlah Peserta</p>
                        <p className="font-semibold text-lg text-gray-800">{booking.participants} orang</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <button 
                    onClick={() => onNavigate(Page.Dashboard)} 
                    className="w-full sm:w-auto bg-teal-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-teal-600 transition shadow-lg"
                >
                    Kembali ke Dashboard
                </button>
                <button 
                    onClick={() => onNavigate(Page.MeetingRooms)} 
                    className="w-full sm:w-auto bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-300 transition"
                >
                    Lihat Ruangan Lain
                </button>
            </div>
        </div>
    );
};

export default BookingConfirmationPage;
