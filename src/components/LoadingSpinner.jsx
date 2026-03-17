import React from 'react';

const LoadingSpinner = ({ text }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: 'var(--border)' }} />
        <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: 'var(--pink)' }} />
      </div>
      {text !== false && (
        <div className="mt-3 text-sm" style={{ color: 'var(--text2)' }}>
          {text || 'Loading...'}
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
