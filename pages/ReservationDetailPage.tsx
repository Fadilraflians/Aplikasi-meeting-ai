import React, { useState, useEffect } from 'react';
import { Page, type Booking } from '../types';
import { BackArrowIcon } from '../components/icons';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useLanguage } from '../contexts/LanguageContext';
import RispatService, { RispatFile } from '../services/rispatService';

interface Props {
  onNavigate: (page: Page) => void;
  booking: Booking | null;
}

const InfoRow: React.FC<{ label: string; value?: string | number }> = ({ label, value }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <span className="text-gray-600 font-medium">{label}</span>
      <span className="font-bold text-gray-800 text-right">{String(value ?? '—')}</span>
    </div>
  );
};

const ClickableInfoRow: React.FC<{ 
  label: string; 
  value?: string | number; 
  onClick: () => void;
  icon: string;
  color: string;
}> = ({ label, value, onClick, icon, color }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <span className="text-gray-600 font-medium">{label}</span>
      <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-1 rounded-lg ${color} text-white text-sm font-medium hover:opacity-90 transition-opacity`}
      >
        <span>{icon}</span>
        <span>{value || 'Lihat'}</span>
      </button>
    </div>
  );
};


const ReservationDetailPage: React.FC<Props> = ({ onNavigate, booking }) => {
  const { isDarkMode } = useDarkMode();
  const { t } = useLanguage();
  const [showInvitationCard, setShowInvitationCard] = useState(false);
  const [rispatFiles, setRispatFiles] = useState<RispatFile[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRispatModal, setShowRispatModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Fungsi untuk menentukan status booking
  const getBookingStatus = (date: string, startTime: string, endTime?: string) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Jika bukan hari ini, tentukan status berdasarkan tanggal
    if (date !== today) {
      const bookingDate = new Date(date);
      const todayDate = new Date(today);
      
      if (bookingDate < todayDate) {
        return 'expired';
      } else {
        return 'upcoming';
      }
    }
    
    // Jika hari ini, cek waktu
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    const formatTime = (timeStr: string) => {
      if (!timeStr) return '';
      return timeStr.slice(0, 5); // Ambil hanya HH:MM
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
    
    // Jika tidak ada end time, cek berdasarkan start time saja
    if (!endMinutes) {
      if (currentMinutes > startMinutes) {
        return 'expired';
      } else {
        return 'upcoming';
      }
    }
    
    // Jika ada end time, cek status lengkap
    if (currentMinutes < startMinutes) {
      return 'upcoming';
    } else if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
      return 'ongoing';
    } else {
      return 'expired';
    }
  };

  // Tentukan status booking saat ini
  const bookingStatus = getBookingStatus(booking.date, booking.time, booking.endTime);
  const canUploadRispat = bookingStatus === 'ongoing';

  // Debug logging untuk fasilitas
  useEffect(() => {
    if (booking) {
      console.log('🔍 ReservationDetailPage - booking data:', booking);
      console.log('🔍 ReservationDetailPage - facilities:', booking.facilities);
      console.log('🔍 ReservationDetailPage - facilities type:', typeof booking.facilities);
      console.log('🔍 ReservationDetailPage - facilities is array:', Array.isArray(booking.facilities));
    }
  }, [booking]);


  
  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-cyan-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-6">
            <button onClick={() => onNavigate(Page.Reservations)} className="mr-4 p-2 rounded-full hover:bg-white/50 transition-colors">
              <BackArrowIcon />
            </button>
            <h2 className="text-3xl font-bold text-gray-800">Detail Reservasi</h2>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <p className="text-gray-600">Data reservasi tidak ditemukan.</p>
          </div>
        </div>
      </div>
    );
  }

  const displayTime = (booking.time || '').slice(0,5);
  const displayEndTime = (booking.endTime || '').slice(0,5);

  // Load risalah rapat saat component mount
  useEffect(() => {
    if (booking?.id) {
      loadRispatFiles();
    }
  }, [booking?.id]);

  // Fungsi untuk load risalah rapat
  const loadRispatFiles = async () => {
    if (!booking?.id) return;
    
    try {
      // Debug: Log booking data
      console.log('🔍 Debug loadRispatFiles - booking object:', booking);
      console.log('🔍 Debug loadRispatFiles - booking.id:', booking.id, 'type:', typeof booking.id);
      console.log('🔍 Debug loadRispatFiles - booking.roomName:', booking.roomName);
      console.log('🔍 Debug loadRispatFiles - booking.topic:', booking.topic);
      
      // Handle AI bookings (id dengan prefix 'ai_')
      let bookingId: number;
      if (typeof booking.id === 'string' && booking.id.startsWith('ai_')) {
        // Untuk AI bookings, gunakan ID numerik dari database
        const numericId = booking.id.replace('ai_', '');
        bookingId = parseInt(numericId, 10);
        console.log('Debug loadRispatFiles - AI booking, original ID:', booking.id);
        console.log('Debug loadRispatFiles - AI booking, numeric ID:', numericId);
        console.log('Debug loadRispatFiles - AI booking, converted ID:', bookingId);
      } else {
        // Untuk regular bookings
        bookingId = typeof booking.id === 'string' ? parseInt(booking.id, 10) : booking.id;
        console.log('Debug loadRispatFiles - Regular booking, original ID:', booking.id);
        console.log('Debug loadRispatFiles - Regular booking, converted ID:', bookingId);
      }
      
      if (isNaN(bookingId) || bookingId <= 0) {
        console.error('Invalid booking ID:', booking.id);
        return;
      }
      
      console.log('🔍 Debug loadRispatFiles - Calling API with bookingId:', bookingId);
      console.log('🔍 Debug loadRispatFiles - API URL will be:', `/api/rispat.php?booking_id=${bookingId}`);
      
      const files = await RispatService.getRispatByBookingId(bookingId);
      console.log('🔍 Debug loadRispatFiles - API returned files:', files);
      console.log('🔍 Debug loadRispatFiles - Files count:', files.length);
      console.log('🔍 Debug loadRispatFiles - Files type:', typeof files);
      console.log('🔍 Debug loadRispatFiles - Files is array:', Array.isArray(files));
      
      if (files && files.length > 0) {
        console.log('🔍 Debug loadRispatFiles - First file:', files[0]);
      }
      
      setRispatFiles(files);
    } catch (error) {
      console.error('Error loading rispat files:', error);
    }
  };

  // Fungsi untuk membuat undangan
  const handleCreateInvitation = () => {
    setShowInvitationCard(true);
  };

  // Fungsi untuk handle upload file
  const handleFileUpload = async () => {
    if (!selectedFile || !booking?.id) return;

    // Debug: Log booking data
    console.log('Debug - booking object:', booking);
    console.log('Debug - booking.id:', booking.id, 'type:', typeof booking.id);

    // Handle AI bookings (id dengan prefix 'ai_')
    let bookingId: number;
    if (typeof booking.id === 'string' && booking.id.startsWith('ai_')) {
      // Untuk AI bookings, gunakan ID numerik dari database
      const numericId = booking.id.replace('ai_', '');
      bookingId = parseInt(numericId, 10);
      console.log('Debug - AI booking detected, numeric ID:', bookingId);
    } else {
      // Untuk regular bookings
      bookingId = typeof booking.id === 'string' ? parseInt(booking.id, 10) : booking.id;
    }
    
    console.log('Debug - final bookingId:', bookingId, 'isNaN:', isNaN(bookingId));
    
    if (isNaN(bookingId) || bookingId <= 0) {
      console.error('Invalid booking ID:', booking.id);
      alert(`ID reservasi tidak valid: "${booking.id}". Silakan refresh halaman dan coba lagi.`);
      return;
    }

    // Validasi file
    if (!RispatService.validateFileType(selectedFile)) {
      alert('Tipe file tidak didukung. Hanya PDF, Word, dan JPG yang diperbolehkan.');
      return;
    }

    if (!RispatService.validateFileSize(selectedFile)) {
      alert('Ukuran file terlalu besar. Maksimal 10MB.');
      return;
    }

    setUploading(true);
    try {
      const result = await RispatService.uploadRispat(
        bookingId,
        selectedFile,
        booking.pic || 'Unknown'
      );

      if (result.success) {
        alert('Risalah rapat berhasil diupload!');
        setShowUploadModal(false);
        setSelectedFile(null);
        loadRispatFiles(); // Reload data
        
        // Notify ReservationsPage to refresh rispat status
        const refreshEvent = new CustomEvent('rispatUploaded', {
          detail: { bookingId: bookingId }
        });
        window.dispatchEvent(refreshEvent);
      } else {
        // Handle specific database errors
        let errorMessage = result.message || 'Gagal mengupload file';
        if (errorMessage.includes('Data too long for column')) {
          errorMessage = 'File type tidak didukung atau terlalu besar. Silakan gunakan file yang lebih kecil atau format yang berbeda.';
        }
        alert('Gagal mengupload file: ' + errorMessage);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Terjadi kesalahan saat mengupload file');
    } finally {
      setUploading(false);
    }
  };

  // Fungsi untuk handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Validasi file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
      } else {
        alert('Format file tidak didukung. Silakan pilih file PDF, Word, atau gambar.');
      }
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header dengan gradient background */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 mb-8 shadow-xl">
          <div className="flex items-center">
            <button 
              onClick={() => onNavigate(Page.Reservations)} 
              className="mr-4 p-3 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 backdrop-blur-sm"
            >
              <BackArrowIcon />
            </button>
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">{t('reservationDetail.title')}</h2>
              <p className="text-teal-100">{t('reservationDetail.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Card Detail Utama */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl overflow-hidden">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{booking.roomName}</h3>
                  <p className="text-cyan-100">{booking.topic || t('reservationDetail.meeting')}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Content Card */}
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <InfoRow label={`📅 ${t('reservationDetail.date')}`} value={booking.date} />
                  <InfoRow label={`🕐 ${t('reservationDetail.startTime')}`} value={displayTime} />
                  <InfoRow label={`🕐 ${t('reservationDetail.endTime')}`} value={displayEndTime || '—'} />
                  <InfoRow label={`👤 ${t('reservationDetail.pic')}`} value={booking.pic || '—'} />
                </div>
                <div className="space-y-4">
                  <InfoRow label={`👥 ${t('reservationDetail.participants')}`} value={`${booking.participants} ${t('reservationDetail.people')}`} />
                  <InfoRow label={`📋 ${t('reservationDetail.meetingType')}`} value={booking.meetingType} />
                  <InfoRow label={`⚙️ ${t('reservationDetail.facilities')}`} value={(() => {
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
                    return t('reservationDetail.noSpecialFacilities');
                  })()} />
                  
                  {/* Kolom Risalah Rapat */}
                  <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-600 font-medium flex items-center">
                        <span className="mr-2">📋</span>
                        {t('reservationDetail.meetingMinutes')}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (canUploadRispat) {
                              setShowUploadModal(true);
                            } else {
                              alert(`${t('reservationDetail.uploadOnlyDuringMeetingAlert')}\n\n${t('reservationDetail.currentStatus').replace('{status}', bookingStatus === 'upcoming' ? t('reservationDetail.notStarted') : bookingStatus === 'expired' ? t('reservationDetail.finished') : t('reservationDetail.unknown'))}`);
                            }
                          }}
                          disabled={!canUploadRispat}
                          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                            canUploadRispat 
                              ? 'bg-blue-500 text-white hover:bg-blue-600' 
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                          title={canUploadRispat ? t('reservationDetail.uploadMinutes') : t('reservationDetail.uploadOnlyDuringMeeting')}
                        >
                          📤 {t('reservationDetail.upload')}
                        </button>
                        <button
                          onClick={() => {
                            console.log('Debug - Tombol Lihat diklik');
                            console.log('Debug - rispatFiles state:', rispatFiles);
                            console.log('Debug - rispatFiles length:', rispatFiles.length);
                            setShowRispatModal(true);
                          }}
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                        >
                          👁️ {t('reservationDetail.view')}
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {rispatFiles.length > 0 ? (
                        <span className="text-green-600 font-semibold">
                          {t('reservationDetail.filesAvailable').replace('{count}', rispatFiles.length.toString())}
                        </span>
                      ) : (
                        <span className="text-gray-500">{t('reservationDetail.noMinutesFile')}</span>
                      )}
                    </div>
                    {/* Status indicator */}
                    <div className="mt-2 text-xs">
                      {bookingStatus === 'ongoing' && (
                        <span className="text-green-600 font-semibold">✅ {t('reservationDetail.meetingOngoing')}</span>
                      )}
                      {bookingStatus === 'upcoming' && (
                        <span className="text-orange-600 font-semibold">⏳ {t('reservationDetail.meetingNotStarted')}</span>
                      )}
                      {bookingStatus === 'expired' && (
                        <span className="text-gray-600 font-semibold">🔒 {t('reservationDetail.meetingFinished')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Ringkasan */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
              <h3 className="text-xl font-bold mb-2">📊 {t('reservationDetail.summary')}</h3>
              <p className="text-emerald-100 text-sm">{t('reservationDetail.summarySubtitle')}</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{booking.roomName}</p>
                    <p className="text-sm text-gray-600">{t('reservationDetail.meetingRoom')}</p>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{booking.date} {displayTime}</p>
                    {displayEndTime && (
                      <p className="text-sm text-gray-600">{t('reservationDetail.until')} {displayEndTime}</p>
                    )}
                    <p className="text-sm text-gray-600">{t('reservationDetail.meetingSchedule')}</p>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{booking.participants} {t('reservationDetail.people')}</p>
                    <p className="text-sm text-gray-600">{t('reservationDetail.participantCount')}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={handleCreateInvitation} 
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  🎉 {t('reservationDetail.meetingInvitation')}
                </button>
                
                <button 
                  onClick={() => onNavigate(Page.Reservations)} 
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  ← {t('reservationDetail.backToReservations')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Kartu Undangan yang Bagus */}
      {showInvitationCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header Kartu Undangan */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white rounded-t-3xl relative overflow-hidden">
              <div className="absolute inset-0 bg-black opacity-10"></div>
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <span className="text-4xl">🎉</span>
                </div>
                <h2 className="text-3xl font-bold mb-2">Anda Diundang</h2>
                <h3 className="text-xl font-semibold text-indigo-100">untuk mengikuti rapat</h3>
                <div className="w-24 h-1 bg-white bg-opacity-50 rounded-full mx-auto mt-4"></div>
              </div>
              
              {/* Dekorasi Background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full translate-y-12 -translate-x-12"></div>
            </div>
            
            {/* Detail Rapat */}
            <div className="p-8">
              <div className="text-center mb-8">
                <h4 className="text-2xl font-bold text-gray-800 mb-2">{booking.topic}</h4>
                <p className="text-gray-600">Rapat penting yang membutuhkan kehadiran Anda</p>
              </div>

              {/* Informasi Rapat dalam Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white text-xl">🏢</span>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-800">Lokasi</h5>
                      <p className="text-gray-600 text-sm">Ruangan Rapat</p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-blue-700">{booking.roomName}</p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white text-xl">📅</span>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-800">Tanggal</h5>
                      <p className="text-gray-600 text-sm">Hari Rapat</p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-green-700">{booking.date}</p>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-2xl border border-orange-200">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white text-xl">🕐</span>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-800">Waktu</h5>
                      <p className="text-gray-600 text-sm">Jadwal Rapat</p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-orange-700">
                    {displayTime}{displayEndTime ? ` - ${displayEndTime}` : ''}
                  </p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white text-xl">👥</span>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-800">Peserta</h5>
                      <p className="text-gray-600 text-sm">Jumlah Orang</p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-purple-700">{booking.participants} orang</p>
                </div>
              </div>

              {/* Informasi Tambahan */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">ℹ️</span>
                  Informasi Tambahan
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">PIC Rapat:</span>
                    <p className="font-semibold text-gray-800">{booking.pic}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Jenis Rapat:</span>
                    <p className="font-semibold text-gray-800">{booking.meetingType}</p>
                  </div>
                  {booking.facilities && booking.facilities.length > 0 && (
                    <div className="md:col-span-2">
                      <span className="text-gray-600">Fasilitas:</span>
                      <p className="font-semibold text-gray-800">{booking.facilities.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pesan Undangan */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white text-center mb-8">
                <h5 className="text-lg font-semibold mb-2">Kami Menunggu Kehadiran Anda!</h5>
                <p className="text-indigo-100">
                  Rapat ini sangat penting dan membutuhkan partisipasi aktif dari semua peserta. 
                  Harap hadir tepat waktu dan siap dengan materi yang diperlukan.
                </p>
              </div>

              {/* Tombol Aksi */}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowInvitationCard(false)}
                  className="flex-1 bg-gray-500 text-white font-semibold py-4 px-6 rounded-xl hover:bg-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    // Simulasi konfirmasi kehadiran
                    alert('Terima kasih! Kehadiran Anda telah dikonfirmasi.');
                    setShowInvitationCard(false);
                  }}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-4 px-6 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Konfirmasi Kehadiran
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload Risalah Rapat */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header dengan gradient yang lebih menarik */}
            <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 p-6 text-white relative overflow-hidden flex-shrink-0">
              <div className="absolute inset-0 bg-black bg-opacity-10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-white bg-opacity-20 p-3 rounded-2xl mr-4">
                      <span className="text-2xl">📤</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">Upload file risalah rapat (PDF, Word, JPG)</h3>
                      <p className="text-blue-100 text-sm">Pilih file risalah rapat untuk diupload</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedFile(null);
                    }}
                    className="text-white hover:text-blue-200 transition-colors text-2xl p-2 hover:bg-white hover:bg-opacity-10 rounded-full"
                  >
                    ×
                  </button>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-white bg-opacity-10 rounded-full -translate-y-12 translate-x-12"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-white bg-opacity-10 rounded-full translate-y-10 -translate-x-10"></div>
            </div>
            
            {/* Content Area */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Drag and Drop Area */}
              <div className="mb-6">
                <label className="block text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">📁</span>
                  Pilih File Risalah
                </label>
                
                <div
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                    isDragOver
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                      <span className="text-3xl">📄</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      {isDragOver ? 'Lepaskan file di sini' : 'Drag & Drop file atau klik untuk memilih'}
                    </h4>
                    <p className="text-gray-600 text-sm mb-1">
                      Format yang didukung: PDF, Word, JPG, PNG
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      Maksimal ukuran file: 10MB
                    </p>
                    
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer flex items-center"
                    >
                      <span className="mr-2">📂</span>
                      Pilih File
                    </label>
                  </div>
                </div>
              </div>

              {/* File Preview */}
              {selectedFile && (
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">📋</span>
                    Preview File
                  </h4>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 shadow-lg">
                    <div className="flex items-start">
                      <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-3 rounded-xl mr-3 flex-shrink-0">
                        <span className="text-2xl">
                          {RispatService.getFileIcon(selectedFile.type)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 w-full">
                        <div className="mb-2">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-bold text-gray-800 text-lg break-all pr-4 flex-1 leading-tight" style={{wordBreak: 'break-all', overflowWrap: 'break-word'}}>{selectedFile.name}</h5>
                            <button
                              onClick={() => setSelectedFile(null)}
                              className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded-full flex-shrink-0 ml-2"
                            >
                              <span className="text-lg">❌</span>
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium text-sm flex items-center">
                            <span className="mr-1">📏</span>
                            {RispatService.formatFileSize(selectedFile.size)}
                          </span>
                          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium text-sm flex items-center">
                            <span className="mr-1">📄</span>
                            {selectedFile.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading Indicator */}
              {uploading && (
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
                      <div>
                        <h5 className="font-bold text-gray-800 mb-1">⏳ Sedang Upload...</h5>
                        <p className="text-gray-600 text-sm">Mohon tunggu, file sedang diupload ke server</p>
                      </div>
                    </div>
                    <div className="mt-4 bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                    </div>
                  </div>
                </div>
              )}

            </div>
            
            {/* Footer dengan tombol aksi */}
            <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0">
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                  }}
                  className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={uploading}
                >
                  Batal
                </button>
                <button
                  onClick={handleFileUpload}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-2 px-4 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">📤</span>
                      Kirim Permintaan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lihat Risalah Rapat */}
      {showRispatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header dengan gradient yang lebih menarik */}
            <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 p-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black bg-opacity-10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-white bg-opacity-20 p-3 rounded-2xl mr-4">
                      <span className="text-2xl">📋</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-1">Risalah Rapat</h3>
                      <p className="text-green-100 text-sm">Daftar file risalah rapat yang tersedia</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRispatModal(false)}
                    className="text-white hover:text-green-200 transition-colors text-3xl p-3 hover:bg-white hover:bg-opacity-10 rounded-full"
                  >
                    ×
                  </button>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white bg-opacity-10 rounded-full -translate-y-20 translate-x-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white bg-opacity-10 rounded-full translate-y-16 -translate-x-16"></div>
              <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white bg-opacity-5 rounded-full"></div>
            </div>
            
            {/* Content Area dengan scroll */}
            <div className="flex-1 overflow-y-auto p-6">
              {rispatFiles.length > 0 ? (
                <div className="space-y-6">
                  {/* Header dengan statistik */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xl font-bold text-gray-800 mb-2">📊 Statistik File</h4>
                        <p className="text-gray-600 text-base">Total {rispatFiles.length} file risalah rapat tersedia</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">{rispatFiles.length}</div>
                        <div className="text-base text-gray-500">File tersedia</div>
                      </div>
                    </div>
                  </div>

                  {/* Daftar file dengan desain card yang lebih menarik */}
                  {rispatFiles.map((file, index) => (
                    <div key={file.id} className="bg-white rounded-2xl border border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group backdrop-blur-sm">
                      <div className="p-6">
                        {/* Header dengan nama file dan tombol action */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start flex-1 min-w-0">
                            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-4 rounded-xl mr-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                              <span className="text-3xl">
                                {RispatService.getFileIcon(file.file_type)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-800 text-lg mb-2 break-words group-hover:text-blue-600 transition-colors duration-300">{file.original_name}</h4>
                              <div className="text-sm text-gray-500">File #{index + 1} dari {rispatFiles.length}</div>
                            </div>
                          </div>
                          {/* Tombol action dengan desain yang lebih menarik */}
                          <div className="flex gap-2 flex-shrink-0 ml-4">
                            <a
                              href={RispatService.getDownloadUrl(file.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center border-2 border-green-400 text-sm"
                              onClick={(e) => {
                                console.log('Download URL:', RispatService.getDownloadUrl(file.id));
                              }}
                            >
                              <span className="mr-1">📥</span>
                              Download
                            </a>
                            <button
                              onClick={async () => {
                                if (confirm('Apakah Anda yakin ingin menghapus file ini?')) {
                                  console.log('Attempting to delete file ID:', file.id);
                                  try {
                                    const result = await RispatService.deleteRispat(file.id);
                                    console.log('Delete result:', result);
                                    if (result.success) {
                                      alert('✅ File berhasil dihapus!');
                                      loadRispatFiles(); // Reload data
                                    } else {
                                      alert('❌ Gagal menghapus file: ' + result.message);
                                    }
                                  } catch (error) {
                                    console.error('Delete error:', error);
                                    
                                    // Handle different types of errors
                                    let errorMessage = 'Terjadi kesalahan saat menghapus file';
                                    
                                    if (error instanceof Error) {
                                      if (error.message.includes('Failed to fetch')) {
                                        errorMessage = 'Tidak dapat terhubung ke server. Pastikan server berjalan dan koneksi internet stabil.';
                                      } else if (error.message.includes('timeout')) {
                                        errorMessage = 'Request timeout. Silakan coba lagi.';
                                      } else {
                                        errorMessage = error.message;
                                      }
                                    } else if (typeof error === 'string') {
                                      errorMessage = error;
                                    } else if (error && typeof error === 'object' && 'message' in error) {
                                      errorMessage = (error as any).message;
                                    }
                                    
                                    alert('❌ ' + errorMessage);
                                  }
                                }
                              }}
                              className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-4 py-2 rounded-xl font-bold hover:from-red-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center border-2 border-red-400 text-sm"
                            >
                              <span className="mr-1">🗑️</span>
                              Hapus
                            </button>
                          </div>
                        </div>
                        
                        {/* Informasi detail file dengan desain yang lebih menarik */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200">
                            <div className="flex items-center">
                              <div className="bg-blue-500 p-2 rounded-lg mr-3">
                                <span className="text-white text-base">📏</span>
                              </div>
                              <div>
                                <div className="text-xs text-blue-600 font-medium">Ukuran File</div>
                                <div className="text-base font-bold text-blue-800">{RispatService.formatFileSize(file.file_size)}</div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-3 border border-green-200">
                            <div className="flex items-center">
                              <div className="bg-green-500 p-2 rounded-lg mr-3">
                                <span className="text-white text-base">📅</span>
                              </div>
                              <div>
                                <div className="text-xs text-green-600 font-medium">Tanggal Upload</div>
                                <div className="text-base font-bold text-green-800">{new Date(file.uploaded_at).toLocaleDateString('id-ID')}</div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-3 border border-purple-200">
                            <div className="flex items-center">
                              <div className="bg-purple-500 p-2 rounded-lg mr-3">
                                <span className="text-white text-base">👤</span>
                              </div>
                              <div>
                                <div className="text-xs text-purple-600 font-medium">Diupload Oleh</div>
                                <div className="text-base font-bold text-purple-800">{file.uploaded_by}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-12 border border-gray-200 shadow-xl">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <span className="text-4xl">📄</span>
                    </div>
                    <h4 className="text-2xl font-bold text-gray-800 mb-3">Belum Ada File Risalah</h4>
                    <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                      Belum ada file risalah rapat yang diupload untuk rapat ini. Mulai upload file pertama Anda!
                    </p>
                    <button
                      onClick={() => {
                        setShowRispatModal(false);
                        setShowUploadModal(true);
                      }}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-3 rounded-xl font-bold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <span className="mr-2 text-lg">📤</span>
                      Upload File Pertama
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer dengan tombol tutup yang lebih modern */}
            <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex justify-center">
                <button
                  onClick={() => setShowRispatModal(false)}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold py-3 px-12 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <span className="mr-2">❌</span>
                  Tutup Rispat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReservationDetailPage;



