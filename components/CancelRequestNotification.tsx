import React, { useState, useEffect } from 'react';
import { ApiService } from '../src/config/api';

interface CancelRequest {
  id: number;
  booking_id: string;
  booking_type: 'ai' | 'form';
  requester_name: string;
  requester_full_name?: string;
  requester_email?: string;
  owner_name: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  response_message?: string;
  created_at: string;
}

interface CancelRequestNotificationProps {
  currentUser: string;
  onRequestResponded?: () => void;
}

const CancelRequestNotification: React.FC<CancelRequestNotificationProps> = ({
  currentUser,
  onRequestResponded
}) => {
  const [requests, setRequests] = useState<CancelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [responseMessage, setResponseMessage] = useState('');

  useEffect(() => {
    loadCancelRequests();
  }, [currentUser]);

  const loadCancelRequests = async () => {
    try {
      setLoading(true);
      const result = await ApiService.getCancelRequestsByOwner(currentUser);
      if (result.success) {
        setRequests(result.data || []);
      }
    } catch (error) {
      console.error('Error loading cancel requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId: number, status: 'approved' | 'rejected') => {
    try {
      setRespondingTo(requestId);
      
      const result = await ApiService.respondToCancelRequest(
        requestId, 
        status, 
        responseMessage.trim() || undefined
      );
      
      if (result.success) {
        // Reload requests
        await loadCancelRequests();
        
        // Call callback if provided
        onRequestResponded?.();
        
        // Show success message
        const statusText = status === 'approved' ? 'disetujui' : 'ditolak';
        alert(`Permintaan pembatalan telah ${statusText}.`);
        
        // Reset form
        setResponseMessage('');
      } else {
        throw new Error(result.message || 'Failed to respond to request');
      }
    } catch (error) {
      console.error('Error responding to request:', error);
      alert('Gagal merespons permintaan. Silakan coba lagi.');
    } finally {
      setRespondingTo(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-md">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return null; // Don't show anything if no requests
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request.id} className="bg-white rounded-xl p-6 shadow-md border border-orange-200">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Permintaan Pembatalan</h4>
                <p className="text-sm text-gray-600">
                  Dari: <span className="font-medium">{request.requester_full_name || request.requester_name}</span>
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
              Menunggu Respon
            </span>
          </div>

          {/* Booking Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h5 className="font-medium text-gray-800 mb-2">Detail Reservasi:</h5>
            <div className="text-sm text-gray-600 space-y-1">
              <div><span className="font-medium">ID Reservasi:</span> {request.booking_id}</div>
              <div><span className="font-medium">Tipe:</span> {request.booking_type === 'ai' ? 'AI Booking' : 'Form Booking'}</div>
              <div><span className="font-medium">Waktu Permintaan:</span> {new Date(request.created_at).toLocaleString('id-ID')}</div>
            </div>
          </div>

          {/* Reason */}
          <div className="mb-4">
            <h5 className="font-medium text-gray-800 mb-2">Alasan Pembatalan:</h5>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{request.reason}</p>
            </div>
          </div>

          {/* Response Form */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pesan Balasan (Opsional)
            </label>
            <textarea
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              placeholder="Berikan pesan balasan untuk peminta..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {responseMessage.length}/500 karakter
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => handleRespond(request.id, 'rejected')}
              disabled={respondingTo === request.id}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {respondingTo === request.id ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Tolak
                </>
              )}
            </button>
            <button
              onClick={() => handleRespond(request.id, 'approved')}
              disabled={respondingTo === request.id}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {respondingTo === request.id ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Setujui
                </>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CancelRequestNotification;


