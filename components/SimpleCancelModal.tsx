import React, { useState } from 'react';

interface SimpleCancelModalProps {
  isVisible: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  bookingTopic: string;
}

const SimpleCancelModal: React.FC<SimpleCancelModalProps> = ({
  isVisible,
  onConfirm,
  onCancel,
  bookingTopic
}) => {
  const [reason, setReason] = useState('');

  console.log('🚨 SimpleCancelModal rendered with isVisible:', isVisible);
  console.log('🚨 SimpleCancelModal bookingTopic:', bookingTopic);

  if (!isVisible) {
    console.log('🚨 SimpleCancelModal not visible, returning null');
    return null;
  }

  console.log('🚨 SimpleCancelModal should render modal now!');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚨 SimpleCancelModal handleSubmit called with reason:', reason);
    if (reason.trim()) {
      onConfirm(reason.trim());
      setReason('');
    }
  };

  const handleClose = () => {
    console.log('🚨 SimpleCancelModal handleClose called');
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '10px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}
      >
        <h3 style={{ margin: '0 0 15px 0', color: '#dc2626' }}>Batalkan Reservasi</h3>
        <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>
          Reservasi: <strong>{bookingTopic}</strong>
        </p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Alasan Pembatalan *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Jelaskan alasan pembatalan..."
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '5px',
                resize: 'vertical',
                minHeight: '80px'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #ccc',
                backgroundColor: '#f5f5f5',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!reason.trim()}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                backgroundColor: reason.trim() ? '#dc2626' : '#ccc',
                color: 'white',
                borderRadius: '5px',
                cursor: reason.trim() ? 'pointer' : 'not-allowed'
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

export default SimpleCancelModal;
