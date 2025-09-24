import React from 'react';

interface KotakPatternProps {
  className?: string;
  excludeAreas?: Array<{
    top?: string;
    left?: string;
    width?: string;
    height?: string;
    borderRadius?: string;
  }>;
  color?: string; // Untuk mengatur warna overlay
}

const KotakPattern: React.FC<KotakPatternProps> = ({ className, excludeAreas = [], color = 'rgba(6, 182, 212, 0.1)' }) => {
  return (
    <div
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{
        backgroundImage: `url('/images/meeting-rooms/kotak-removebg-preview.png')`,
        backgroundRepeat: 'repeat',
        backgroundSize: '80px 80px', // Ukuran diperbesar sedikit
        opacity: 0.08, // Opacity sedikit dinaikkan
        zIndex: 0,
      }}
    >
      {/* Color overlay untuk menyesuaikan warna */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundColor: color,
          zIndex: 1,
        }}
      />
      
      {/* Area yang dikecualikan dari pola kotak - tanpa background putih */}
      {excludeAreas.map((area, index) => (
        <div
          key={index}
          className="absolute"
          style={{
            top: area.top || '0',
            left: area.left || '0',
            width: area.width || '100%',
            height: area.height || '100%',
            borderRadius: area.borderRadius || '0',
            backgroundImage: 'none',
            zIndex: 10,
          }}
        />
      ))}
    </div>
  );
};

export default KotakPattern;