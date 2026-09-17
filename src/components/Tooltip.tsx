import React, { ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function Tooltip({ content, children, position = 'top', className = '' }: TooltipProps) {
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  };

  const arrows = {
    top: 'bottom-[-4px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-slate-800',
    right: 'left-[-4px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-slate-800',
    bottom: 'top-[-4px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-slate-800',
    left: 'right-[-4px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-slate-800',
  };

  return (
    <div className={`group relative inline-flex items-center justify-center ${className}`}>
      {children}
      <div className={`absolute z-[100] scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 pointer-events-none ${positions[position]}`}>
        <div className="bg-slate-800 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-white/10 flex flex-col items-center">
          {content}
          <div className={`absolute w-0 h-0 border-[5px] ${arrows[position]}`}></div>
        </div>
      </div>
    </div>
  );
}
