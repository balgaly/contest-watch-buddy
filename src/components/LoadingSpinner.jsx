import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative">
        {/* Outer glow effect */}
        <div className="absolute inset-0 rounded-full bg-cyan-400 opacity-20 blur-xl animate-pulse"></div>
        {/* Spinner ring */}
        <div className="relative w-12 h-12 rounded-full">
          <div className="absolute w-full h-full border-4 border-cyan-200 rounded-full"></div>
          <div className="absolute w-full h-full border-4 border-transparent border-t-cyan-500 rounded-full animate-spin"></div>
          {/* Inner pulse */}
          <div className="absolute inset-2 rounded-full bg-cyan-500/20 animate-ping"></div>
        </div>
      </div>
      {/* Loading text with fade animation */}
      <div className="mt-4 text-cyan-600 font-medium animate-pulse">
        Loading scores...
      </div>
    </div>
  );
};

export default LoadingSpinner;
