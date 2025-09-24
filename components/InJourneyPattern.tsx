import React from 'react';

interface InJourneyPatternProps {
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

const InJourneyPattern: React.FC<InJourneyPatternProps> = ({ className, excludeAreas = [], color = 'rgba(34, 197, 94, 0.1)' }) => {
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
      
      {/* Floating geometric shapes untuk efek tambahan */}
      <div className="absolute top-10 left-10 w-16 h-16 bg-green-200 rounded-lg rotate-12 opacity-30 animate-pulse" />
      <div className="absolute top-32 right-20 w-12 h-12 bg-blue-200 rounded-full opacity-25 animate-bounce" />
      <div className="absolute bottom-40 left-20 w-20 h-20 bg-cyan-200 rounded-lg rotate-45 opacity-20" />
      <div className="absolute bottom-20 right-10 w-14 h-14 bg-emerald-200 rounded-full opacity-30 animate-pulse" />
      <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-teal-200 rounded-lg rotate-12 opacity-25" />
      <div className="absolute top-1/3 right-1/3 w-10 h-10 bg-green-300 rounded-full opacity-20 animate-bounce" />
      
      {/* Additional decorative elements */}
      <div className="absolute top-20 left-1/2 w-6 h-6 bg-blue-300 rounded-full opacity-30 animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-8 h-8 bg-cyan-300 rounded-lg rotate-45 opacity-25" />
      <div className="absolute top-2/3 left-1/3 w-12 h-12 bg-emerald-300 rounded-full opacity-20 animate-bounce" />
      
      {/* Overlay gradient untuk memberikan efek depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5" />
    </div>
  );
};

export default InJourneyPattern;
