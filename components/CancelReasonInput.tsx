import React, { useState } from 'react';

interface CancelReasonInputProps {
  isVisible: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  bookingTopic: string;
}

const CancelReasonInput: React.FC<CancelReasonInputProps> = ({
  isVisible,
  onConfirm,
  onCancel,
  bookingTopic
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log('🚨 CancelReasonInput rendered with:', {
    isVisible,
    bookingTopic,
    reason
  });

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🚨 CancelReasonInput handleSubmit called with reason:', reason.trim());
    e.preventDefault();
    if (!reason.trim()) {
      console.log('🚨 Reason is empty, not submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('🚨 Calling onConfirm with reason:', reason.trim());
      await onConfirm(reason.trim());
      setReason('');
      console.log('🚨 Submit successful');
    } catch (error) {
      console.error('🚨 Error submitting cancel reason:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    console.log('🚨 CancelReasonInput handleClose called');
    setReason('');
    onCancel();
  };

  if (!isVisible) {
    console.log('🚨 CancelReasonInput not visible, returning null');
    return null;
  }

  console.log('🚨 CancelReasonInput rendering modal with isVisible:', isVisible);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-gray-200">
        {/* Header */}
        <div className="bg-red-500 rounded-t-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg">Batalkan Reservasi</h3>
                <p className="text-red-100 text-sm">Berikan alasan pembatalan</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-white hover:text-red-200 transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Booking Info */}
          <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-semibold text-blue-800">Reservasi yang akan dibatalkan:</span>
            </div>
            <p className="text-blue-700 font-medium">{bookingTopic}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="reason" className="block text-sm font-semibold text-gray-700 mb-2">
                Alasan Pembatalan *
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => {
                  if (e.target.value.length <= 200) {
                    setReason(e.target.value);
                  }
                }}
                placeholder="Contoh: Meeting dibatalkan karena konflik jadwal dengan rapat penting..."
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none text-sm"
                rows={3}
                required
                disabled={isSubmitting}
                maxLength={200}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {reason.length}/200 karakter
              </div>
            </div>

            {/* Tips */}
            <div className="mb-6 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600 text-lg">💡</span>
                <div>
                  <p className="text-sm font-semibold text-yellow-800 mb-1">Tips:</p>
                  <p className="text-xs text-yellow-700">
                    Jelaskan alasan yang spesifik dan jelas. Hindari kata-kata seperti "tidak jadi" atau "batal saja".
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-xl font-semibold transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!reason.trim() || isSubmitting}
                className="flex-1 py-2.5 px-4 bg-red-500 text-white rounded-xl font-semibold transition-colors hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Membatalkan...</span>
                  </div>
                ) : (
                  'Konfirmasi Pembatalan'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CancelReasonInput;
