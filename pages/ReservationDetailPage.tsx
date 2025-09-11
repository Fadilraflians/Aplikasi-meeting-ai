import React, { useState, useEffect } from 'react';
import { Page, type Booking } from '../types';
import { BackArrowIcon } from '../components/icons';
import { useDarkMode } from '../contexts/DarkModeContext';

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
                  <InfoRow label="🕐 Waktu" value={displayTime} />
                  <InfoRow label="👤 PIC" value={booking.pic || '—'} />
                </div>
                <div className="space-y-4">
                  <InfoRow label="👥 Peserta" value={`${booking.participants} orang`} />
                  <InfoRow label="📋 Jenis Rapat" value={booking.meetingType} />
                  <InfoRow label="⚙️ Fasilitas" value={booking.facilities ? booking.facilities.join(', ') : '—'} />
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
  );
};

export default ReservationDetailPage;



