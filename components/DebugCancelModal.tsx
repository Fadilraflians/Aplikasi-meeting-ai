import React, { useState } from 'react';

interface DebugCancelModalProps {
  isVisible: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  bookingTopic: string;
}

const DebugCancelModal: React.FC<DebugCancelModalProps> = ({
  isVisible,
  onConfirm,
  onCancel,
  bookingTopic
}) => {
  const [reason, setReason] = useState('');

  console.log('🚨 DebugCancelModal rendered with isVisible:', isVisible);
  console.log('🚨 DebugCancelModal bookingTopic:', bookingTopic);

  if (!isVisible) {
    console.log('🚨 DebugCancelModal not visible, returning null');
    return null;
  }

  console.log('🚨 DebugCancelModal should render modal now!');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚨 DebugCancelModal handleSubmit called with reason:', reason);
    if (reason.trim()) {
      onConfirm(reason.trim());
      setReason('');
    }
  };

  const handleClose = () => {
    console.log('🚨 DebugCancelModal handleClose called');
    setReason('');
    onCancel();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 0, 0, 0.8)', // Red background for visibility
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '20px'
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '15px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          border: '3px solid #ef4444'
        }}
      >
        <h2 style={{ margin: '0 0 20px 0', color: '#ef4444', fontSize: '24px' }}>
          🚨 DEBUG MODAL - Batalkan Reservasi
        </h2>
        
        <p style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#666' }}>
          Reservasi: <strong style={{ color: '#333' }}>{bookingTopic}</strong>
        </p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '16px' }}>
              Alasan Pembatalan *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Jelaskan alasan pembatalan..."
              required
              style={{
                width: '100%',
                padding: '15px',
                border: '2px solid #ccc',
                borderRadius: '8px',
                resize: 'vertical',
                minHeight: '100px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '15px' }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                flex: 1,
                padding: '15px',
                border: '2px solid #ccc',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!reason.trim()}
              style={{
                flex: 1,
                padding: '15px',
                border: 'none',
                backgroundColor: reason.trim() ? '#ef4444' : '#ccc',
                color: 'white',
                borderRadius: '8px',
                cursor: reason.trim() ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Konfirmasi Pembatalan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DebugCancelModal;
