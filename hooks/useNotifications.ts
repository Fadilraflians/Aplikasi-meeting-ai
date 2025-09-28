import { useState, useEffect, useCallback } from 'react';
import { ApiService } from '../src/config/api';

interface CancelRequest {
  id: number;
  booking_id: string;
  booking_type: 'ai' | 'form';
  requester_name: string;
  owner_name: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface UseNotificationsReturn {
  requests: CancelRequest[];
  pendingCount: number;
  loading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
}

export const useNotifications = (currentUser: string): UseNotificationsReturn => {
  const [requests, setRequests] = useState<CancelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCancelRequests = useCallback(async () => {
    try {
      setError(null);
      const result = await ApiService.getCancelRequestsByOwner(currentUser);
      if (result.success) {
        // Only show pending requests
        const pendingRequests = (result.data || []).filter((req: CancelRequest) => req.status === 'pending');
        setRequests(pendingRequests);
      } else {
        setError(result.message || 'Failed to load notifications');
      }
    } catch (err) {
      console.error('Error loading cancel requests:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const refreshNotifications = useCallback(async () => {
    setLoading(true);
    await loadCancelRequests();
  }, [loadCancelRequests]);

  useEffect(() => {
    loadCancelRequests();
    
    // Poll for new requests every 30 seconds
    const interval = setInterval(loadCancelRequests, 30000);
    
    return () => clearInterval(interval);
  }, [loadCancelRequests]);

  const pendingCount = requests.length;

  return {
    requests,
    pendingCount,
    loading,
    error,
    refreshNotifications
  };
};
