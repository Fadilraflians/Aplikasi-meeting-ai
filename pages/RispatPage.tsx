import React, { useEffect, useMemo, useState } from 'react';
import { Page, type Booking } from '../types';
import { BackArrowIcon } from '../components/icons';
import { getHistory } from '../services/historyService';
import { useLanguage } from '../contexts/LanguageContext';
import RispatService from '../services/rispatService';

interface Props {
  onNavigate: (page: Page) => void;
}

const RispatPage: React.FC<Props> = ({ onNavigate }) => {
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [rispatFiles, setRispatFiles] = useState<any[]>([]);
  const [showRispatModal, setShowRispatModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | number | null>(null);
  const { t } = useLanguage();

  // Fungsi untuk load rispat files
  const loadRispatFiles = async (bookingId: string | number) => {
    try {
      console.log('Loading rispat files for booking ID:', bookingId);
      
      // Handle AI booking ID (remove 'ai_' prefix if exists)
      let actualBookingId = bookingId;
      if (String(bookingId).startsWith('ai_')) {
        actualBookingId = String(bookingId).replace('ai_', '');
      }
      
      console.log('Actual booking ID for API:', actualBookingId);
      
      const files = await RispatService.getRispatByBookingId(Number(actualBookingId));
      console.log('Rispat files loaded:', files);
      setRispatFiles(files);
    } catch (error) {
      console.error('Error loading rispat files:', error);
      setRispatFiles([]);
    }
  };

  // Tidak perlu load server bookings lagi karena hanya menggunakan AI data

  // Fungsi untuk handle view rispat
  const handleViewRispat = async (bookingId: string | number) => {
    setSelectedBookingId(bookingId);
    setShowRispatModal(true);
    await loadRispatFiles(bookingId);
  };

  const items = useMemo(() => {
    // HANYA gunakan data dari localStorage (AI data)
    const local = getHistory();
    console.log('RispatPage - All history entries:', local);
    console.log('RispatPage - Selected date:', date);
    
    // Filter data lokal dengan status 'Selesai'
    const localFiltered = local.filter(h => h.date === date && h.status === 'Selesai');
    console.log('RispatPage - Local filtered entries:', localFiltered.length, localFiltered);
    
    // Debug: Log setiap item lokal untuk melihat detail
    localFiltered.forEach((item, index) => {
      console.log(`RispatPage - Local item ${index}:`, {
        id: item.id,
        topic: item.topic,
        date: item.date,
        time: item.time,
        roomName: item.roomName,
        pic: item.pic,
        status: item.status
      });
    });
    
    // Remove duplicates dari local data saja
    const uniqueItems = [];
    const seenItems = new Set();
    
    // Tambahkan local items dengan deduplikasi
    localFiltered.forEach((item, index) => {
      // Buat key yang lebih ketat untuk local items
      const key = `${item.topic}-${item.date}-${item.time}-${item.roomName}-${item.pic}-${item.participants}`;
      console.log(`RispatPage - Local key ${index}:`, key);
      
      if (!seenItems.has(key)) {
        seenItems.add(key);
        uniqueItems.push({
          ...item,
          source: 'local'
        });
        console.log(`RispatPage - Added local item ${index}:`, item.topic);
      } else {
        console.log(`RispatPage - Skipped duplicate local item ${index}:`, item.topic);
      }
    });
    
    // Sort by completion timestamp in descending order (newest first)
    const sorted = uniqueItems.sort((a, b) => {
      // Use completedAt if available (most accurate timestamp)
      const timestampA = a.completedAt || a.savedAt || new Date().toISOString();
      const timestampB = b.completedAt || b.savedAt || new Date().toISOString();
      
      const dateA = new Date(timestampA);
      const dateB = new Date(timestampB);
      
      // Sort by timestamp in descending order (newest first)
      return dateB.getTime() - dateA.getTime();
    });
    
    // Debug logging untuk duplikasi
    console.log('RispatPage - Local filtered entries:', localFiltered.length);
    console.log('RispatPage - Unique items after deduplication:', uniqueItems.length);
    console.log('RispatPage - Duplicates removed:', localFiltered.length - uniqueItems.length);
    console.log('RispatPage - Final combined entries:', sorted);
    
    // Log setiap item yang ditampilkan untuk debugging
    sorted.forEach((item, index) => {
      console.log(`RispatPage - Final item ${index}:`, {
        topic: item.topic,
        roomName: item.roomName,
        date: item.date,
        time: item.time,
        participants: item.participants,
        pic: item.pic,
        source: item.source
      });
    });
    
    // Final check untuk memastikan tidak ada duplikasi
    const finalCheck = sorted.filter((item, index, self) => {
      const key = `${item.topic}-${item.date}-${item.time}-${item.roomName}-${item.pic}-${item.participants}`;
      const firstIndex = self.findIndex(t => `${t.topic}-${t.date}-${t.time}-${t.roomName}-${t.pic}-${t.participants}` === key);
      
      if (firstIndex !== index) {
        console.log(`RispatPage - Final check: Found duplicate, keeping first:`, item.topic);
        return false;
      }
      
      return true;
    });
    
    if (finalCheck.length !== sorted.length) {
      console.warn('RispatPage - WARNING: Still found duplicates after deduplication!');
      console.warn('RispatPage - Original length:', sorted.length, 'Final length:', finalCheck.length);
    }
    
    return finalCheck;
  }, [date]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-3xl shadow-xl border border-white/20">
          {/* Header dengan gradient */}
          <div className="flex items-center mb-8">
            <button 
              onClick={() => onNavigate(Page.Dashboard)} 
              className="mr-4 p-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <BackArrowIcon />
            </button>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {t('rispat.title')}
              </h2>
              <p className="text-gray-600 mt-1">{t('rispat.subtitle')}</p>
            </div>
          </div>

          {/* Date picker dengan desain yang lebih menarik */}
          <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {t('rispat.selectDate')}
                  </span>
                </label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e=> setDate(e.target.value)} 
                  className="w-full p-4 bg-white border-2 border-green-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 hover:border-green-300 text-lg font-medium" 
                />
              </div>
              <div className="text-gray-600 text-center md:text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="font-semibold">{t('rispat.meetingMinutes')}</span>
                </div>
                <p className="text-sm">{t('rispat.description')}</p>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="space-y-6">
            {items.length === 0 && (
              <div className="text-center py-16 bg-gradient-to-r from-gray-50 to-green-50 rounded-2xl border border-gray-200">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('rispat.noMinutes')}</h3>
                <p className="text-gray-500">{t('rispat.noMinutesDesc')}</p>
              </div>
            )}
            
            {items.map((h:any)=> {
              console.log('RispatPage - Rendering complete item:', h);
              
              return (
                <div key={`${h.id}-${h.savedAt || ''}`} className="group bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Status Icon */}
                      <div className="w-12 h-12 rounded-full bg-green-50 border-2 border-green-200 text-green-600 flex items-center justify-center">
                        <span className="text-xl">✅</span>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="text-lg font-bold text-gray-800 leading-tight mb-1">
                              {h.topic || '—'}
                            </h4>
                            <p className="text-gray-600 font-medium">{h.roomName}</p>
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700 border border-green-200">
                            {t('rispat.completed')}
                          </span>
                        </div>
                        
                        {/* Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                          {h.pic && h.pic !== '-' && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                              <span className="font-medium">PIC:</span>
                              <span>{h.pic}</span>
                            </div>
                          )}
                          {h.participants && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                              <span className="font-medium">Peserta:</span>
                              <span>{h.participants} orang</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                            <span className="font-medium">Tanggal:</span>
                            <span>{h.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            <span className="font-medium">Waktu:</span>
                            <span>
                              {String(h.time).slice(0,5)}
                              {h.endTime && ` - ${String(h.endTime).slice(0,5)}`}
                            </span>
                          </div>
                        </div>
                        
                        {/* Completed info */}
                        {h.completedAt && (
                          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 text-green-700 text-sm">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                              <span className="font-medium">Selesai:</span>
                              <span>{new Date(h.completedAt).toLocaleString('id-ID')}</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Action Button */}
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleViewRispat(h.id)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                          >
                            📄 View Rispat
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Lihat Risalah Rapat */}
      {showRispatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-800">{t('rispat.modalTitle')}</h3>
              <button
                onClick={() => setShowRispatModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {rispatFiles.length > 0 ? (
                <div className="space-y-4">
                  {rispatFiles.map((file, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            {file.file_type === 'application/pdf' ? (
                              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                              </svg>
                            ) : file.file_type.includes('image') ? (
                              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 text-sm leading-tight mb-2 break-all">
                            {file.original_name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {file.file_type?.toUpperCase() || 'FILE'}
                            </span>
                            <span>{(file.file_size / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span>{new Date(file.uploaded_at).toLocaleDateString('id-ID')}</span>
                          </div>
                          <button
                            onClick={() => {
                              const downloadUrl = RispatService.getDownloadUrl(file.id);
                              console.log('Download URL:', downloadUrl);
                              
                              // Create a temporary link element for download
                              const link = document.createElement('a');
                              link.href = downloadUrl;
                              link.download = file.original_name || file.original_filename || 'rispat_file';
                              link.target = '_blank';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                          >
                            📥 Download
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>Belum ada file risalah rapat</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RispatPage;

