import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import { BackArrowIcon } from '../components/icons';
import { ApiService } from '../src/config/api';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useLanguage } from '../contexts/LanguageContext';

interface CancelRequest {
  id: number;
  booking_id: string;
  booking_type: 'ai' | 'form';
  requester_name: string;
  requester_full_name?: string;
  requester_email?: string;
  owner_name: string;
  owner_full_name?: string;
  owner_email?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  response_message?: string;
  created_at: string;
  updated_at: string;
}

const CancelRequestsPage: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
  const [requests, setRequests] = useState<CancelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const { isDarkMode } = useDarkMode();
  const { t } = useLanguage();

  useEffect(() => {
    loadAllRequests();
  }, []);

  const loadAllRequests = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const userDataStr = localStorage.getItem('user_data');
      const currentUser = userDataStr ? JSON.parse(userDataStr).full_name : 'Unknown User';
      
      // Get requests where current user is owner
      const ownerResult = await ApiService.getCancelRequestsByOwner(currentUser);
      const ownerRequests = ownerResult.success ? ownerResult.data || [] : [];
      
      // Get requests made by current user
      const requesterResult = await ApiService.getCancelRequestsByRequester(currentUser);
      const requesterRequests = requesterResult.success ? requesterResult.data || [] : [];
      
      // Combine and deduplicate
      const allRequests = [...ownerRequests, ...requesterRequests];
      const uniqueRequests = allRequests.filter((request, index, self) => 
        index === self.findIndex(r => r.id === request.id)
      );
      
      setRequests(uniqueRequests);
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
        await loadAllRequests();
        
        const statusText = status === 'approved' ? 'disetujui' : 'ditolak';
        alert(`Permintaan pembatalan telah ${statusText}.`);
        
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

  const getCurrentUser = () => {
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      return userData.full_name || userData.username || 'Unknown User';
    }
    return 'Unknown User';
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return t('cancelRequests.waitingResponse');
      case 'approved': return t('cancelRequests.approved');
      case 'rejected': return t('cancelRequests.rejected');
      default: return status;
    }
  };

  const getRequestTypeText = (type: string) => {
    return type === 'ai' ? t('cancelRequests.aiBooking') : t('cancelRequests.formBooking');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('cancelRequests.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-teal-500"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-teal-600"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-teal-300/30 to-transparent rounded-full -translate-y-36 translate-x-36"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-tr from-teal-400/25 to-transparent rounded-full translate-y-28 -translate-x-28"></div>
        
        <div className="relative max-w-7xl mx-auto px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <button 
                onClick={() => onNavigate(Page.Dashboard)} 
                className="group p-4 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 hover:border-white/40 transition-all duration-300 hover:scale-105 shadow-xl"
              >
                <BackArrowIcon />
              </button>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{t('cancelRequests.title')}</h1>
                <p className="text-teal-100 text-lg">{t('cancelRequests.subtitle')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="bg-white rounded-xl p-2 shadow-md">
            <div className="flex space-x-2">
              {[
                { key: 'all', label: t('cancelRequests.all'), count: requests.length },
                { key: 'pending', label: t('cancelRequests.pending'), count: requests.filter(r => r.status === 'pending').length },
                { key: 'approved', label: t('cancelRequests.approved'), count: requests.filter(r => r.status === 'approved').length },
                { key: 'rejected', label: t('cancelRequests.rejected'), count: requests.filter(r => r.status === 'rejected').length }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                    filter === tab.key
                      ? 'bg-teal-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-6">
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-md">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">{t('cancelRequests.noRequests')}</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? t('cancelRequests.noRequestsDesc')
                  : t('cancelRequests.noRequestsFilter').replace('{status}', getStatusText(filter))
                }
              </p>
            </div>
          ) : (
            filteredRequests.map((request) => {
              const isOwner = getCurrentUser() === request.owner_name;
              const isRequester = getCurrentUser() === request.requester_name;
              
              return (
                <div key={request.id} className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {t('cancelRequests.requestId').replace('{id}', request.id.toString())}
                        </h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <span className="font-medium">{t('cancelRequests.from')}:</span> {request.requester_full_name || request.requester_name}
                          </p>
                          <p>
                            <span className="font-medium">{t('cancelRequests.to')}:</span> {request.owner_full_name || request.owner_name}
                          </p>
                          <p>
                            <span className="font-medium">{t('cancelRequests.reservation')}:</span> {request.booking_id} ({getRequestTypeText(request.booking_type)})
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(request.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 mb-2">{t('cancelRequests.cancellationReason')}:</h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">{request.reason}</p>
                    </div>
                  </div>

                  {/* Response Message */}
                  {request.response_message && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-800 mb-2">{t('cancelRequests.responseMessage')}:</h4>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">{request.response_message}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons (only for owners of pending requests) */}
                  {isOwner && request.status === 'pending' && (
                    <div className="border-t pt-4">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('cancelRequests.replyMessage')}
                        </label>
                        <textarea
                          value={responseMessage}
                          onChange={(e) => setResponseMessage(e.target.value)}
                          placeholder={t('cancelRequests.replyPlaceholder')}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                          rows={3}
                          maxLength={500}
                        />
                        <div className="text-right text-xs text-gray-500 mt-1">
                          {responseMessage.length}/500 {t('cancelRequests.characters')}
                        </div>
                      </div>

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
                              {t('cancelRequests.processing')}
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              {t('cancelRequests.reject')}
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
                              {t('cancelRequests.processing')}
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {t('cancelRequests.approve')}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Status Info for non-owners */}
                  {!isOwner && request.status !== 'pending' && (
                    <div className="border-t pt-4">
                      <div className="text-center text-sm text-gray-600">
                        {request.status === 'approved' 
                          ? t('cancelRequests.requestApproved')
                          : t('cancelRequests.requestRejected')
                        }
                        {request.response_message && (
                          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                            <strong>{t('cancelRequests.message')}:</strong> {request.response_message}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CancelRequestsPage;
