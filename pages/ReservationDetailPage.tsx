import React, { useState, useEffect } from 'react';
import { Page, type Booking } from '../types';
import { BackArrowIcon } from '../components/icons';
import { useDarkMode } from '../contexts/DarkModeContext';
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
  const [showInvitationCard, setShowInvitationCard] = useState(false);
  const [rispatFiles, setRispatFiles] = useState<RispatFile[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRispatModal, setShowRispatModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
      } else {
        alert('Gagal mengupload file: ' + result.message);
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
              <h2 className="text-3xl font-bold text-white mb-1">Detail Reservasi</h2>
              <p className="text-teal-100">Informasi lengkap reservasi meeting room</p>
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
                  <p className="text-cyan-100">{booking.topic || 'Meeting Room'}</p>
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
                  <InfoRow label="📅 Tanggal" value={booking.date} />
                  <InfoRow label="🕐 Waktu Mulai" value={displayTime} />
                  <InfoRow label="🕐 Waktu Berakhir" value={displayEndTime || '—'} />
                  <InfoRow label="👤 PIC" value={booking.pic || '—'} />
                </div>
                <div className="space-y-4">
                  <InfoRow label="👥 Peserta" value={`${booking.participants} orang`} />
                  <InfoRow label="📋 Jenis Rapat" value={booking.meetingType} />
                  <InfoRow label="⚙️ Fasilitas" value={(() => {
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
                  })()} />
                  
                  {/* Kolom Risalah Rapat */}
                  <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-600 font-medium flex items-center">
                        <span className="mr-2">📋</span>
                        Risalah Rapat
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowUploadModal(true)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          📤 Upload
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
                          👁️ Lihat
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {rispatFiles.length > 0 ? (
                        <span className="text-green-600 font-semibold">
                          {rispatFiles.length} file tersedia
                        </span>
                      ) : (
                        <span className="text-gray-500">Belum ada file risalah</span>
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
              <h3 className="text-xl font-bold mb-2">📊 Ringkasan</h3>
              <p className="text-emerald-100 text-sm">Informasi singkat reservasi</p>
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
                    <p className="text-sm text-gray-600">Ruangan Meeting</p>
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
                      <p className="text-sm text-gray-600">Sampai {displayEndTime}</p>
                    )}
                    <p className="text-sm text-gray-600">Jadwal Meeting</p>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{booking.participants} orang</p>
                    <p className="text-sm text-gray-600">Jumlah Peserta</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={handleCreateInvitation} 
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  🎉 Undangan Rapat
                </button>
                
                <button 
                  onClick={() => onNavigate(Page.Reservations)} 
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  ← Kembali ke Reservasi
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6 text-white rounded-t-2xl">
              <h3 className="text-xl font-bold mb-2">📤 Upload Risalah Rapat</h3>
              <p className="text-blue-100 text-sm">Upload file risalah rapat (PDF, Word, JPG)</p>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pilih File
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format yang didukung: PDF, Word, JPG (Maksimal 10MB)
                </p>
              </div>

              {selectedFile && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">
                      {RispatService.getFileIcon(selectedFile.type)}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{selectedFile.name}</p>
                      <p className="text-sm text-gray-600">
                        {RispatService.formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                  }}
                  className="flex-1 bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
                  disabled={uploading}
                >
                  Batal
                </button>
                <button
                  onClick={handleFileUpload}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? '⏳ Uploading...' : '📤 Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lihat Risalah Rapat */}
      {showRispatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white rounded-t-2xl">
              <h3 className="text-xl font-bold mb-2">📋 Risalah Rapat</h3>
              <p className="text-green-100 text-sm">Daftar file risalah rapat yang tersedia</p>
            </div>
            
            <div className="p-6">
              {(() => {
                console.log('🔍 Debug Modal - rispatFiles:', rispatFiles);
                console.log('🔍 Debug Modal - rispatFiles.length:', rispatFiles.length);
                console.log('🔍 Debug Modal - rispatFiles type:', typeof rispatFiles);
                console.log('🔍 Debug Modal - rispatFiles is array:', Array.isArray(rispatFiles));
                if (rispatFiles.length > 0) {
                  console.log('🔍 Debug Modal - First file:', rispatFiles[0]);
                }
                return null;
              })()}
              {rispatFiles.length > 0 ? (
                <div className="space-y-4">
                  {rispatFiles.map((file) => (
                    <div key={file.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <span className="text-3xl mr-4">
                            {RispatService.getFileIcon(file.file_type)}
                          </span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">{file.original_name}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span>{RispatService.formatFileSize(file.file_size)}</span>
                              <span>•</span>
                              <span>Upload: {new Date(file.uploaded_at).toLocaleDateString('id-ID')}</span>
                              <span>•</span>
                              <span>Oleh: {file.uploaded_by}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={RispatService.getDownloadUrl(file.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                            onClick={(e) => {
                              // Test download URL
                              console.log('Download URL:', RispatService.getDownloadUrl(file.id));
                            }}
                          >
                            📥 Download
                          </a>
                          <button
                            onClick={async () => {
                              if (confirm('Apakah Anda yakin ingin menghapus file ini?')) {
                                console.log('Attempting to delete file ID:', file.id);
                                try {
                                  const result = await RispatService.deleteRispat(file.id);
                                  console.log('Delete result:', result);
                                  if (result.success) {
                                    alert('File berhasil dihapus');
                                    loadRispatFiles(); // Reload data
                                  } else {
                                    alert('Gagal menghapus file: ' + result.message);
                                  }
                                } catch (error) {
                                  console.error('Delete error:', error);
                                  console.error('Error details:', error);
                                  
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
                                  
                                  alert(errorMessage);
                                }
                              }
                            }}
                            className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                          >
                            🗑️ Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  {(() => {
                    console.log('Debug Modal - Menampilkan "Belum ada file risalah"');
                    console.log('Debug Modal - rispatFiles saat ini:', rispatFiles);
                    return null;
                  })()}
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📄</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Belum Ada File Risalah</h4>
                  <p className="text-gray-600 mb-4">
                    Belum ada file risalah rapat yang diupload untuk rapat ini
                  </p>
                  <button
                    onClick={() => {
                      setShowRispatModal(false);
                      setShowUploadModal(true);
                    }}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    📤 Upload File Pertama
                  </button>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowRispatModal(false)}
                  className="flex-1 bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    setShowRispatModal(false);
                    setShowUploadModal(true);
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  📤 Upload File Baru
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



