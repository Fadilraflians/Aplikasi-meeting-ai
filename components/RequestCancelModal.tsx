import React, { useState } from 'react';
import { Booking } from '../types';

interface RequestCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  currentUser: string;
  onRequestCancel: (bookingId: number, reason: string, requesterName: string) => void;
}

const RequestCancelModal: React.FC<RequestCancelModalProps> = ({
  isOpen,
  onClose,
  booking,
  currentUser,
  onRequestCancel
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!booking || !reason.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onRequestCancel(booking.id, reason.trim(), currentUser);
      setReason('');
      onClose();
    } catch (error) {
      console.error('Error requesting cancel:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Permintaan Pembatalan</h3>
                <p className="text-red-100 text-sm">Minta izin untuk membatalkan reservasi</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Booking Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Detail Reservasi
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Topik:</span>
                <span className="font-medium text-gray-800">{booking.topic}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ruangan:</span>
                <span className="font-medium text-gray-800">{booking.roomName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tanggal:</span>
                <span className="font-medium text-gray-800">{booking.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Waktu:</span>
                <span className="font-medium text-gray-800">{booking.time} - {booking.endTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">PIC:</span>
                <span className="font-medium text-gray-800">{booking.pic}</span>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h5 className="font-semibold text-amber-800 mb-1">Perhatian!</h5>
                <p className="text-amber-700 text-sm">
                  Anda akan mengirim permintaan pembatalan kepada <strong>{booking.pic}</strong> (PIC reservasi ini). 
                  Mereka akan menerima notifikasi dan dapat menyetujui atau menolak permintaan Anda.
                </p>
              </div>
            </div>
          </div>

          {/* Reason Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Alasan Pembatalan *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Jelaskan alasan mengapa reservasi ini perlu dibatalkan..."
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {reason.length}/500 karakter
            </div>
          </div>

        </div>

        {/* Footer - Fixed Action Buttons */}
        <div className="border-t border-gray-200 p-4 sm:p-6 flex-shrink-0 bg-gray-50 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-white transition-colors font-medium"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={!reason.trim() || isSubmitting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Mengirim...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Kirim Permintaan
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestCancelModal;

