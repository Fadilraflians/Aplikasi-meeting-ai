
import React, { useEffect, useState } from 'react';
import { Page, type Booking, type User } from '../types';
import { ChatIcon } from '../components/icons';
import { getHistory, type HistoryEntry } from '../services/historyService';
import { ApiService } from '../src/config/api';
import { useLanguage } from '../contexts/LanguageContext';
import InJourneyPattern from '../components/InJourneyPattern';

const RobotIllustration: React.FC = () => {
    const [isHovered, setIsHovered] = useState(false);
    const [isClicked, setIsClicked] = useState(false);
    const [showMessage, setShowMessage] = useState(false);
    const { t } = useLanguage();

    const handleClick = () => {
        setIsClicked(true);
        setShowMessage(true);
        setTimeout(() => {
            setIsClicked(false);
            setShowMessage(false);
        }, 3000);
    };

    return (
        <div className="relative cursor-pointer" 
             onMouseEnter={() => setIsHovered(true)}
             onMouseLeave={() => setIsHovered(false)}
             onClick={handleClick}>
            {/* Robot PNG Image with Enhanced Animation */}
        <img 
            src="/images/robot.png" 
            alt="AI Assistant Robot" 
                className={`w-64 h-64 lg:w-80 lg:h-80 object-contain drop-shadow-lg transition-all duration-500 ${
                    isClicked ? 'animate-bounce' : 
                    isHovered ? 'animate-pulse' : 'animate-bounce-slow'
                }`}
                style={{
                    animation: isClicked ? 'bounce 0.6s ease-in-out' : 
                              isHovered ? 'pulse 1s ease-in-out infinite' : 
                              'floatUpDown 3s ease-in-out infinite'
                }}
            />
            
            {/* Enhanced Floating Elements */}
            <div className="absolute -top-4 -left-4 w-4 h-4 bg-blue-300 rounded-full animate-pulse opacity-60 animate-float"></div>
            <div className="absolute -bottom-4 -right-4 w-3 h-3 bg-blue-200 rounded-full animate-pulse delay-1000 opacity-60 animate-float-delayed"></div>
            <div className="absolute top-1/2 -right-8 w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-500 opacity-60 animate-float-slow"></div>
            
            {/* Sparkle Effects */}
            <div className="absolute top-8 left-8 w-1 h-1 bg-yellow-300 rounded-full animate-sparkle"></div>
            <div className="absolute top-16 right-12 w-1 h-1 bg-yellow-400 rounded-full animate-sparkle-delayed"></div>
            <div className="absolute bottom-12 left-12 w-1 h-1 bg-yellow-300 rounded-full animate-sparkle-slow"></div>
            
            {/* Interactive Elements */}
            {isHovered && (
                <>
                    <div className="absolute top-4 right-4 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                    <div className="absolute bottom-4 left-4 w-2 h-2 bg-green-300 rounded-full animate-ping delay-300"></div>
                </>
            )}
            
            {isClicked && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 border-4 border-cyan-400 rounded-full animate-ping opacity-75"></div>
                </div>
            )}

            {/* Click Message - Positioned to the left */}
            {showMessage && (
                <div className="absolute top-1/4 -left-48 lg:-left-48 md:-left-40 sm:-left-36 xs:-left-32 transform -translate-y-1/2 bg-white text-gray-800 px-4 py-3 rounded-xl shadow-lg border-2 border-cyan-400 animate-fadeInOut z-50 min-w-48 max-w-56">
                    <div className="text-center">
                        <div className="text-sm font-bold text-cyan-600 mb-1">{t('ai.clickMessage')}</div>
                    </div>
                    {/* Arrow pointing to robot */}
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-full">
                        <div className="w-0 h-0 border-t-6 border-b-6 border-l-6 border-transparent border-l-white"></div>
                    </div>
                    {/* Arrow border */}
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-full mr-1">
                        <div className="w-0 h-0 border-t-6 border-b-6 border-l-6 border-transparent border-l-cyan-400"></div>
                    </div>
                </div>
            )}
    </div>
);
};

const FeatureCard: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode; color: string }> = ({ title, children, icon, color }) => (
    <div className="group relative overflow-hidden bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg text-center h-full border border-slate-200/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        {/* Gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-r from-${color}-500/5 via-${color}-500/5 to-${color}-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
        
        <div className="relative">
            {/* Icon */}
            <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${color === 'blue' ? 'bg-blue-100' : color === 'green' ? 'bg-green-100' : 'bg-purple-100'}`}>
                {icon}
            </div>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-4">{title}</h3>
            <p className="text-gray-600 leading-relaxed">{children}</p>
        </div>
    </div>
);

const SiteFooter: React.FC = () => {
    const { t } = useLanguage();
    
    return (
    <footer className="mt-10 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-gradient-to-b from-cyan-500 via-sky-600 to-blue-700 text-white min-h-[240px] mb-[-2rem]">
        <div className="w-full px-6 md:px-10 py-12 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div>
                <h4 className="text-xl font-semibold mb-4">{t('footer.aboutUs')}</h4>
                <ul className="space-y-2 text-blue-50/90">
                    <li><a href="#" className="hover:underline">{t('footer.ourProfile')}</a></li>
                    <li><a href="#" className="hover:underline">{t('footer.contactUs')}</a></li>
                </ul>
            </div>
            <div>
                <h4 className="text-xl font-semibold mb-4">{t('footer.investorRelations')}</h4>
                <ul className="space-y-2 text-blue-50/90">
                    <li><a href="#" className="hover:underline">{t('footer.annualReport')}</a></li>
                </ul>
                <h4 className="text-xl font-semibold mt-6 mb-4">{t('footer.publications')}</h4>
                <ul className="space-y-2 text-teal-100">
                    <li><a href="#" className="hover:underline">{t('footer.news')}</a></li>
                </ul>
            </div>
            <div>
                <h4 className="text-xl font-semibold mb-4">{t('footer.airportInfo')}</h4>
                <div className="mt-6">
                    <p className="text-sm uppercase tracking-wider text-teal-200">{t('footer.memberOf')}</p>
                    <div className="mt-3 flex items-center">
                        <img src="/images/injourney-logo.png" alt="InJourney" className="h-10 object-contain" onError={(e:any)=>{e.currentTarget.style.display='none';}} />
                        {!false && <span className="ml-2 font-semibold">InJourney</span>}
                    </div>
                    <div className="mt-4 text-blue-50/90 text-sm leading-relaxed">
                        <p>{t('footer.airportsCenter')}</p>
                        <p>{t('footer.airportName')}</p>
                        <p>{t('footer.address')}</p>
                    </div>
                </div>
            </div>
            <div className="lg:text-right">
                <div className="flex lg:justify-end items-center">
                    <img src="/images/injourney-airports-logo.png" alt="InJourney Airports" className="h-10 object-contain" onError={(e:any)=>{e.currentTarget.style.display='none';}} />
                </div>
                <p className="mt-2 text-sm text-blue-50/90">{t('footer.companyName')}</p>
                <a href="https://www.injourneyairports.id" target="_blank" rel="noreferrer" className="mt-1 inline-block text-blue-50/90 underline">www.injourneyairports.id</a>
            </div>
        </div>
        <div className="border-t border-white/10">
            <div className="w-full px-6 md:px-10 py-4 text-center text-sm text-blue-50/90">
                {t('footer.copyright')}
            </div>
        </div>
    </footer>
    );
};

const ReservationCard: React.FC<{ booking: Booking, showUserInfo?: boolean }> = ({ booking, showUserInfo = false }) => {
  console.log('🔍 ReservationCard received booking:', booking);
  
  // Function to get room image
  const getRoomImage = (roomName?: string, imageUrl?: string) => {
    console.log('🔍 Dashboard getRoomImage called with:', { roomName, imageUrl });
    
    // Jika ada image_url dari database, gunakan itu
    if (imageUrl && imageUrl !== '/images/meeting-rooms/default-room.jpg' && imageUrl !== '') {
      console.log('🔍 Dashboard Using imageUrl from database:', imageUrl);
      return imageUrl;
    }
    
    // Fallback ke mapping berdasarkan nama ruangan untuk ruangan lama
    if (!roomName) return '/images/meeting-rooms/default-room.jpg';
    const name = roomName.toLowerCase();
    
    console.log('🔍 Dashboard Room name for mapping:', name);
    
    // Gunakan file JPEG yang sesuai dengan halaman meeting room
    if (name.includes('samudrantha')) return '/images/meeting-rooms/r1.jpeg';
    if (name.includes('nusantara')) return '/images/meeting-rooms/r2.jpeg';
    if (name.includes('garuda')) return '/images/meeting-rooms/r3.jpeg';
    if (name.includes('jawadwipa 1') || name.includes('jawadwipa1')) return '/images/meeting-rooms/r4.jpeg';
    if (name.includes('jawadwipa 2') || name.includes('jawadwipa2') || name.includes('auditorium jawadwipa 2')) return '/images/meeting-rooms/r5.jpeg';
    if (name.includes('kalamant') || name.includes('kalamanthana')) return '/images/meeting-rooms/r6.jpeg';
    if (name.includes('cedaya')) return '/images/meeting-rooms/r7.jpeg';
    if (name.includes('celebes')) return '/images/meeting-rooms/r8.jpeg';
    if (name.includes('nusanipa')) return '/images/meeting-rooms/r9.jpeg';
    if (name.includes('balidwipa')) return '/images/meeting-rooms/r10.jpeg';
    if (name.includes('swarnadwipa')) return '/images/meeting-rooms/r11.jpeg';
    if (name.includes('borobudur')) return '/images/meeting-rooms/r12.jpeg';
    if (name.includes('komodo')) return '/images/meeting-rooms/r13.jpeg';
    
    // Fallback ke gambar default
    console.log('🔍 Dashboard Using default room image for:', roomName);
    return '/images/meeting-rooms/default-room.jpg';
  };
  // Hitung apakah reservasi sudah lewat atau akan datang
  const normalizeTime = (t: string) => {
    if (!t) return '00:00';
    
    // Handle time range format "HH:MM - HH:MM"
    if (t.includes(' - ')) {
      const [startTime] = t.split(' - ');
      const v = String(startTime).replace(/\./g, ':');
      const m = v.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
      if (!m) return v;
      const hh = String(Math.min(23, Math.max(0, parseInt(m[1], 10)))).padStart(2, '0');
      const mm = String(Math.min(59, Math.max(0, parseInt(m[2], 10)))).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    
    // Handle single time format "HH:MM" or "HH:MM:SS"
    const v = String(t).replace(/\./g, ':');
    const m = v.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!m) return v;
    const hh = String(Math.min(23, Math.max(0, parseInt(m[1], 10)))).padStart(2, '0');
    const mm = String(Math.min(59, Math.max(0, parseInt(m[2], 10)))).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const toTs = (b: Booking, useEndTime = false) => {
    // Use end time if requested, otherwise use start time
    const time = useEndTime ? 
      (b.endTime ? normalizeTime(b.endTime) : normalizeTime(b.time)) : 
      normalizeTime(b.time);
    
    let dateStr = b.date;
    
    if (dateStr.includes(',')) {
      const parts = dateStr.split(', ');
      if (parts.length === 2) {
        const dayMonth = parts[1].split(' ');
        if (dayMonth.length === 3) {
          const day = dayMonth[0];
          const month = dayMonth[1];
          const year = dayMonth[2];
          
          const monthMap: { [key: string]: string } = {
            'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04',
            'Mei': '05', 'Juni': '06', 'Juli': '07', 'Agustus': '08',
            'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12'
          };
          
          const monthNum = monthMap[month] || '01';
          dateStr = `${year}-${monthNum}-${day.padStart(2, '0')}`;
        }
      }
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [dd, mm, yy] = dateStr.split('/');
      dateStr = `${yy}-${mm}-${dd}`;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      // Already in YYYY-MM-DD format
      dateStr = dateStr;
    } else {
      // Fallback: try to parse as is, or use current date
      console.warn('Unknown date format:', dateStr);
      dateStr = new Date().toISOString().split('T')[0];
    }
    
    const dateTime = new Date(`${dateStr}T${time}`);
    
    // Check if date is valid
    if (isNaN(dateTime.getTime())) {
      console.warn('Invalid date created:', `${dateStr}T${time}`);
      return Date.now(); // Return current time as fallback
    }
    
    return dateTime.getTime();
  };

  const startTs = toTs(booking, false); // Start time
  const endTs = toTs(booking, true);    // End time
  const nowTs = Date.now(); // Browser time (WIB)
  
  // Determine booking status
  const isStarted = nowTs >= startTs;
  const isEnded = nowTs >= endTs;
  const isOngoing = isStarted && !isEnded;
  
  console.log('🔍 ReservationCard Status Check:', {
    booking: booking.topic,
    startTime: booking.time,
    endTime: booking.endTime,
    startTs: new Date(startTs).toLocaleString(),
    endTs: new Date(endTs).toLocaleString(),
    nowTs: new Date(nowTs).toLocaleString(),
    isStarted,
    isEnded,
    isOngoing
  });
  
  let statusText = '';
  let statusColor = '';
  
  if (isEnded) {
    // Booking has ended
    const timeDiff = nowTs - endTs;
    const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60)) || 0;
    const minutesDiff = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60)) || 0;
    
    if (hoursDiff === 0) {
      statusText = `${minutesDiff} menit yang lalu`;
    } else {
      statusText = `${hoursDiff} jam yang lalu`;
    }
    statusColor = 'text-gray-600 bg-gray-100 border-gray-200';
  } else if (isOngoing) {
    // Booking is currently ongoing
    statusText = 'Sedang Berlangsung';
    statusColor = 'text-green-600 bg-green-100 border-green-200';
  } else {
    // Booking hasn't started yet
    const timeDiff = startTs - nowTs;
    const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60)) || 0;
    const minutesDiff = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60)) || 0;
    
    if (hoursDiff === 0) {
      if (minutesDiff <= 5) {
        statusText = 'Segera dimulai';
        statusColor = 'text-red-600 bg-red-100 border-red-200';
      } else {
        statusText = `Dalam ${minutesDiff} menit`;
        statusColor = 'text-orange-600 bg-orange-100 border-orange-200';
      }
    } else if (hoursDiff < 24) {
      statusText = `Dalam ${hoursDiff} jam`;
      statusColor = 'text-blue-600 bg-blue-100 border-blue-200';
    } else {
      statusText = 'Akan Datang';
      statusColor = 'text-green-600 bg-green-100 border-green-200';
    }
  }

  return (
    <div className="group relative overflow-hidden bg-white p-6 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-xl mr-3 overflow-hidden border-2 border-gray-200 shadow-md">
              <img
                src={(() => {
                  const imageSrc = getRoomImage(booking.roomName, booking.imageUrl);
                  console.log('🔍 Dashboard Image src for booking:', {
                    roomName: booking.roomName,
                    imageUrl: booking.imageUrl,
                    finalSrc: imageSrc
                  });
                  return imageSrc;
                })()}
                alt={booking.roomName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  console.log('🔍 Dashboard Image failed to load, using default:', target.src);
                  target.src = '/images/meeting-rooms/default-room.jpg';
                }}
              />
            </div>
            <div>
              <h4 className="font-bold text-xl text-gray-800">{booking.topic}</h4>
              <p className="text-gray-600 font-medium">{booking.roomName}</p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${statusColor}`}>
          {statusText}
        </span>
      </div>
        
        {/* Details Grid */}
        <div className={`grid gap-4 ${showUserInfo ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="flex items-center mb-2">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs font-medium text-gray-500">PIC</span>
            </div>
            <p className="font-semibold text-gray-800">{booking.pic}</p>
          </div>
          
          {showUserInfo && (
            <div className="p-3 rounded-lg bg-blue-50">
              <div className="flex items-center mb-2">
                <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs font-medium text-blue-500">User</span>
              </div>
              <p className="font-semibold text-blue-800">{booking.userName || 'Unknown User'}</p>
            </div>
          )}
          
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="flex items-center mb-2">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs font-medium text-gray-500">Peserta</span>
            </div>
            <p className="font-semibold text-gray-800">{booking.participants} orang</p>
          </div>
          
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="flex items-center mb-2">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium text-gray-500">Tanggal</span>
            </div>
            <p className="font-semibold text-gray-800">{booking.date}</p>
          </div>
          
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="flex items-center mb-2">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium text-gray-500">Waktu</span>
            </div>
            <p className="font-semibold text-gray-800">
              {(() => {
                const startTime = booking.time || '00:00';
                const endTime = booking.endTime || '';
                
                // Normalize time format: replace dots with colons and ensure HH:MM format
                const normalizeDisplayTime = (time: string) => {
                  const normalizedTime = time.replace(/\./g, ':');
                  // If it's in HH:MM:SS format, take only HH:MM
                  return normalizedTime.includes(':') && normalizedTime.split(':').length === 3 
                    ? normalizedTime.substring(0, 5) 
                    : normalizedTime;
                };
                
                const formattedStartTime = normalizeDisplayTime(startTime);
                const formattedEndTime = endTime ? normalizeDisplayTime(endTime) : '';
                
                return formattedStartTime + (formattedEndTime ? ` - ${formattedEndTime}` : '');
              })()}
              {!booking.endTime && (
                <span className="text-red-500 text-xs ml-1">(No endTime)</span>
              )}
            </p>
          </div>
        </div>
        
        {/* Additional Info */}
        <div className="mt-4 p-3 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-sm font-medium text-gray-500">Jenis Meeting</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${booking.meetingType === 'external' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
              {booking.meetingType === 'external' ? 'External' : 'Internal'}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-500">Fasilitas</span>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
              {(() => {
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
                return 'Tidak ada';
              })()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const HistoryListPreview: React.FC = () => {
  const [items, setItems] = React.useState<HistoryEntry[]>([]);
  const { t } = useLanguage();
  React.useEffect(() => {
    // Filter hanya status 'Selesai' dan 'Dibatalkan', bukan 'expired'
    const filteredHistory = getHistory().filter(h => 
      h.status === 'Selesai' || h.status === 'Dibatalkan'
    );
    setItems(filteredHistory.slice(0, 3));
  }, []);
  if (items.length === 0) return <div className="text-center text-gray-500 bg-gray-50 p-8 rounded-xl border">{t('dashboard.noReservations')}</div>;
  return (
    <div className="space-y-4">
      {items.map((h) => (
        <div key={`${h.id}-${h.savedAt}`} className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v3H3V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1ZM3 10h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8Zm4 3a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2H7Z"/></svg>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 leading-tight">{h.topic || '—'}</h4>
              <p className="text-gray-600 text-sm">{h.roomName}</p>
            </div>
          </div>
          <div className="text-right text-sm">
            <span className={`inline-block px-3 py-1 rounded-full font-semibold ${h.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{h.status}</span>
            <div className="text-gray-500 mt-1">{h.date} {String(h.time).slice(0,5)}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const DashboardPage: React.FC<{ onNavigate: (page: Page) => void, bookings: Booking[], user?: User }> = ({ onNavigate, bookings, user }) => {
    const { t } = useLanguage();
    const [refreshKey, setRefreshKey] = useState(0);

    // Use bookings from props directly - no need to fetch separately
    console.log('🔍 Dashboard received bookings from props:', bookings);
    console.log('🔍 Bookings count:', bookings.length);
    console.log('🔍 Sample booking:', bookings[0]);
    console.log('🔍 All bookings details:', bookings.map(b => ({
        id: b.id,
        topic: b.topic,
        date: b.date,
        time: b.time,
        endTime: b.endTime,
        roomName: b.roomName
    })));
    
    // Force refresh when component mounts or bookings change
    useEffect(() => {
        console.log('🔍 Dashboard useEffect triggered, bookings:', bookings);
    }, [bookings]);

    // Listen for refresh events to update data
    useEffect(() => {
        const handleRefreshBookings = () => {
            console.log('🔍 Dashboard received refreshBookings event');
            console.log('🔍 Current refreshKey:', refreshKey);
            // Force re-render by updating refresh key
            setRefreshKey(prev => {
                const newKey = prev + 1;
                console.log('🔍 Updated refreshKey from', prev, 'to', newKey);
                return newKey;
            });
        };

        console.log('🔍 Dashboard setting up refreshBookings event listener');
        window.addEventListener('refreshBookings', handleRefreshBookings);
        
        return () => {
            console.log('🔍 Dashboard removing refreshBookings event listener');
            window.removeEventListener('refreshBookings', handleRefreshBookings);
        };
    }, []);

    // Pilih reservasi mendatang terdekat dari gabungan DB + lokal
    const normalizeTime = (t: string) => {
        if (!t) return '00:00:00';
        const v = String(t).replace(/\./g, ':');
        const m = v.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (!m) return v;
        const hh = String(Math.min(23, Math.max(0, parseInt(m[1], 10)))).padStart(2, '0');
        const mm = String(Math.min(59, Math.max(0, parseInt(m[2], 10)))).padStart(2, '0');
        const ss = m[3] ? String(Math.min(59, Math.max(0, parseInt(m[3], 10)))).padStart(2, '0') : '00';
        return `${hh}:${mm}:${ss}`;
    };

    const toTs = (b: Booking) => {
        // Use end time if available, otherwise use start time + 1 hour
        const endTime = b.endTime || calculateEndTime(b.time, 60);
        const time = normalizeTime(endTime);
        
        // date bisa YYYY-MM-DD atau DD/MM/YYYY; coba parse keduanya
        let dateStr = b.date;
        
        // Handle format "Jumat, 5 September 2025" -> "2025-09-05"
        if (dateStr.includes(',')) {
            const parts = dateStr.split(', ');
            if (parts.length === 2) {
                const dayMonth = parts[1].split(' ');
                if (dayMonth.length === 3) {
                    const day = dayMonth[0];
                    const month = dayMonth[1];
                    const year = dayMonth[2];
                    
                    // Convert month name to number
                    const monthMap: { [key: string]: string } = {
                        'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04',
                        'Mei': '05', 'Juni': '06', 'Juli': '07', 'Agustus': '08',
                        'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12'
                    };
                    
                    const monthNum = monthMap[month] || '01';
                    dateStr = `${year}-${monthNum}-${day.padStart(2, '0')}`;
                }
            }
        } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
            const [dd, mm, yy] = dateStr.split('/');
            dateStr = `${yy}-${mm}-${dd}`;
        }
        
        return new Date(`${dateStr}T${time}`).getTime();
    };

    const calculateEndTime = (startTime: string, durationMinutes: number) => {
        if (!startTime) return '';
        const [hours, minutes] = startTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + durationMinutes;
        const endHours = Math.floor(totalMinutes / 60);
        const endMinutes = totalMinutes % 60;
        return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    };

    // Use bookings from props directly
    const unified: Booking[] = bookings || [];
    console.log('🔍 Using bookings from props:', unified);
    console.log('🔍 Unified bookings length:', unified.length);
    
    // If no bookings, show empty state
    if (unified.length === 0) {
        console.log('🔍 No bookings available, showing empty state');
    }

    const nowTs = Date.now();
    
    // Gunakan logika status yang sama dengan ReservationsPage
    const getBookingStatus = (date: string, startTime: string, endTime?: string) => {
        const now = new Date();
        // Format waktu dalam WIB (browser timezone)
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        const today = `${year}-${month}-${day}`;
        const currentTime = `${hours}:${minutes}`;
        
        console.log('🔍 Dashboard Status Check:', {
            bookingDate: date,
            today: today,
            bookingTime: startTime,
            currentTime: currentTime,
            endTime: endTime
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
        if (currentMinutes < startMinutes) {
            return 'upcoming';
        } else if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
            return 'ongoing';
        } else {
            return 'expired';
        }
    };
    
    // Filter booking berdasarkan status yang sama dengan ReservationsPage
    const upcomingBookings = React.useMemo(() => {
        console.log('🔍 Dashboard useMemo triggered, unified length:', unified.length, 'refreshKey:', refreshKey);
        return unified.filter(booking => {
        const status = getBookingStatus(booking.date, booking.time, booking.endTime);
        console.log(`🔍 Dashboard Booking ${booking.topic} (${booking.date} ${booking.time}): Status = ${status}`);
        
        // Filter out expired bookings (same logic as ReservationsPage)
        const isExpired = status === 'expired';
        if (isExpired) {
            console.log('🔍 Dashboard Filtering out expired booking:', booking.topic, 'Status:', status);
            return false;
        }
        
        const isUpcoming = status === 'upcoming' || status === 'ongoing';
        console.log(`🔍 Dashboard Is upcoming: ${isUpcoming}`);
        
        // Filter out cancelled bookings
        const history = JSON.parse(localStorage.getItem('booking_history') || '[]');
        const isCancelled = history.some((h: any) => 
            String(h.id) === String(booking.id).replace('ai_', '') && h.status === 'Dibatalkan'
        );
        
        if (isCancelled) {
            console.log('🔍 Dashboard Filtering out cancelled booking:', booking.topic, 'ID:', booking.id);
            return false;
        }
        
        return isUpcoming;
        });
    }, [unified, refreshKey]);
    
    const pastBookings = unified.filter(booking => {
        const status = getBookingStatus(booking.date, booking.time, booking.endTime);
        return status === 'expired';
    });
    
    console.log('🔍 Final Results:', {
        totalBookings: unified.length,
        upcomingCount: upcomingBookings.length,
        pastCount: pastBookings.length,
        upcomingBookings: upcomingBookings.map(b => ({ 
            id: b.id,
            topic: b.topic, 
            date: b.date, 
            time: b.time,
            endTime: b.endTime
        }))
    });
    
    console.log('🔍 All bookings details:', unified.map(b => ({
        id: b.id,
        topic: b.topic,
        date: b.date,
        time: b.time,
        endTime: b.endTime
    })));
    
    // Gunakan logika filtering yang benar untuk upcoming bookings
    const finalUpcomingBookings = upcomingBookings;
    
    // Auto-complete booking yang sudah lewat
    if (pastBookings.length > 0) {
        console.log(`Found ${pastBookings.length} past bookings - auto-completing...`);
        // Panggil API untuk auto-complete
        ApiService.autoCompleteExpiredBookings()
            .then(response => {
                if (response.status === 'success') {
                    console.log('✅ Auto-completed expired bookings:', response.message);
                    // Data akan di-refresh otomatis oleh auto-refresh timer
                }
            })
            .catch(error => {
                console.error('❌ Error auto-completing bookings:', error);
            });
    }
    
    console.log('🔍 Past bookings count:', pastBookings.length);
    console.log('🔍 Upcoming bookings count:', upcomingBookings.length);
    console.log('🔍 Final upcoming bookings count:', finalUpcomingBookings.length);
    
    // Urutkan booking yang akan datang berdasarkan waktu terdekat
    const sortedUpcoming = finalUpcomingBookings.sort((a, b) => {
        const aTs = toTs(a);
        const bTs = toTs(b);
        return aTs - bTs; // Urutkan dari yang paling dekat
    });
    
    // Pilih booking yang paling dekat dengan waktu sekarang
    const upcomingBooking = sortedUpcoming[0] || null;
    
    console.log('🔍 Sorted upcoming bookings:', sortedUpcoming);
    console.log('🔍 Selected upcoming booking:', upcomingBooking);
    

    
    // Tampilkan booking terdekat yang akan dilaksanakan
    const bookingToShow = upcomingBooking;
    console.log('🔍 Booking to show:', bookingToShow);

    return (
        <div className="relative">
            {/* InJourney Pattern Background */}
            <InJourneyPattern />
            
            {/* Hero Section */}
            <div className="relative z-10 -mt-16 text-white font-['Poppins']">
                <div className="container mx-auto px-4 md:px-8 py-10">
                    <div className="grid lg:grid-cols-12 items-center gap-8">
                        <div className="lg:col-span-7 text-left">
                            {/* Logo Section */}
                            <div className="flex items-center mb-6">
                                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-4 border border-white/20">
                                    <img 
                                        src="/images/meeting-rooms/kotak-removebg-preview.png" 
                                        alt="Spacio Logo" 
                                        className="w-12 h-12 object-contain"
                                    />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">Spacio</h1>
                                    <p className="text-white/80 text-sm">Meeting Room Booking System</p>
                                </div>
                            </div>
                            
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                               {t('dashboard.heroTitle')}
                            </h2>
                            <p className="mt-3 text-base md:text-lg text-white/90 max-w-2xl">
                                {t('dashboard.heroSubtitle')}
                            </p>
                            
                        </div>
                        <div className="lg:col-span-5 flex justify-center lg:justify-end lg:mr-16">
                            <RobotIllustration />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-20">
                {/* Button bridging between hero and white section */}
                <div className="pointer-events-none">
                    <div className="container mx-auto px-4 md:px-8 -mt-6 md:-mt-8">
                        <div className="flex">
                            <button onClick={() => onNavigate(Page.RBA)} className="pointer-events-auto inline-flex items-center bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg px-12 py-4 rounded-2xl shadow-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                                <div className="w-8 h-8 mr-3 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                    <img src="/images/robot.png" alt="AI" className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-medium opacity-90">Asisten AI</div>
                                    <div className="text-lg font-bold">Spacio</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            
            <div className="bg-slate-50 rounded-t-3xl mt-6 pt-12 pb-12 shadow-2xl shadow-slate-300/30">
                {/* Upcoming + History side-by-side */}
                <div className="mb-16 px-4">
                    <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
                        {/* Left: Closest Reservation */}
                        <div className="bg-white p-6 rounded-2xl shadow-md border">
                            <h3 className="text-3xl font-bold text-gray-700 mb-6 text-center lg:text-left">{t('dashboard.upcomingReservations')}</h3>
                            <div>
                                {finalUpcomingBookings.length > 0 ? (
                                    <div className="space-y-4">
                                        {/* Tampilkan hanya 1 reservasi upcoming yang paling dekat */}
                                        <ReservationCard key={finalUpcomingBookings[0].id} booking={finalUpcomingBookings[0]} showUserInfo={user?.role === 'admin'} />
                                        {finalUpcomingBookings.length > 1 && (
                                            <div className="text-center text-gray-500 text-sm">
                                                Dan {finalUpcomingBookings.length - 1} reservasi lainnya...
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 bg-gray-50 p-8 rounded-2xl border">
                                        <p>{t('dashboard.noReservations')}</p>
                                        <p className="text-sm mt-2">{t('dashboard.noReservationsDesc')}</p>
                                    </div>
                                )}
                                <div className="text-center lg:text-left mt-6">
                                    <button 
                                        onClick={() => onNavigate(Page.Reservations)} 
                                        className="bg-cyan-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-cyan-600 transition shadow-lg text-lg"
                                    >
                                        {t('dashboard.viewAllReservations')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right: History Preview */}
                        <div className="bg-white p-6 rounded-2xl shadow-md border">
                            <h3 className="text-3xl font-bold text-gray-700 mb-6 text-center lg:text-left">{t('dashboard.bookingHistory')}</h3>
                            <p className="text-gray-600 mb-4">{t('dashboard.historyDesc')}</p>
                            <HistoryListPreview />
                            <div className="text-center lg:text-left mt-6 flex gap-4 justify-center lg:justify-start">
                                <button 
                                    onClick={() => onNavigate(Page.History)} 
                                    className="bg-white text-cyan-600 border border-cyan-500 font-bold py-3 px-8 rounded-xl hover:bg-gray-50 transition shadow text-lg"
                                >
                                    {t('dashboard.viewHistory')}
                                </button>
                                <button 
                                    onClick={() => onNavigate(Page.Rispat)} 
                                    className="bg-blue-500 text-white border border-blue-500 font-bold py-3 px-8 rounded-xl hover:bg-blue-600 transition shadow text-lg"
                                >
                                    {t('dashboard.viewRispat')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cancel Requests Section */}
                <div className="mb-8 px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-white rounded-xl p-6 shadow-md border">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-800">{t('dashboard.cancelRequests')}</h3>
                                        <p className="text-gray-600">{t('dashboard.cancelRequestsDesc')}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => onNavigate(Page.CancelRequests)} 
                                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 px-6 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg text-lg flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    {t('dashboard.manageRequests')}
                                </button>
                            </div>
                            <div className="text-center text-gray-500 py-4">
                                <p>{t('dashboard.cancelRequestsInstruction')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature Cards Section */}
                <div className="px-4">
                    <h3 className="text-3xl font-bold text-gray-700 mb-8 text-center">{t('dashboard.featuredFeatures')}</h3>
                    <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        <FeatureCard 
                            title={t('dashboard.smartRecommendations')}
                            color="blue"
                            icon={
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            }
                        >
                            {t('dashboard.smartRecommendationsDesc')}
                        </FeatureCard>
                        <FeatureCard 
                            title={t('dashboard.automaticScheduling')}
                            color="green"
                            icon={
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                        >
                            {t('dashboard.automaticSchedulingDesc')}
                        </FeatureCard>
                        <FeatureCard 
                            title={t('dashboard.naturalLanguage')}
                            color="purple"
                            icon={
                                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            }
                        >
                            {t('dashboard.naturalLanguageDesc')}
                        </FeatureCard>
                    </div>
                </div>

                {/* Feature Cards remains below */}
            </div>
            </div>
            <SiteFooter />
        </div>
    );
};

export default DashboardPage;