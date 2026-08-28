import React from 'react';
import chungsucLogoImg from '../assets/chungsuc-logo.png';

export interface ChungSucLogoProps {
  variant?: 'icon' | 'badge' | 'full' | 'tv-bug';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  className?: string;
  showSubtitle?: boolean;
  animated?: boolean;
  alt?: string;
}

/**
 * Biểu tượng & Logo Gameshow Chung Sức chính thức (HTV / Family Feud Vietnam)
 * Sử dụng hình ảnh logo gốc với hiệu ứng đổ bóng phát sáng 3D chân thực.
 */
export const ChungSucLogo: React.FC<ChungSucLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  showSubtitle = true,
  animated = false,
  alt = 'Chung Sức Logo',
}) => {
  // Height map for the official logo image
  const heightMap = {
    xs: 'h-6',
    sm: 'h-9',
    md: 'h-12 md:h-14',
    lg: 'h-16 md:h-20',
    xl: 'h-24 md:h-28',
    '2xl': 'h-32 md:h-40',
    custom: '',
  };

  // Icon container dimension map
  const iconBoxMap = {
    xs: 'w-7 h-7',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32',
    custom: '',
  };

  // Image element with official branding
  const renderLogoImage = (extraClasses = '') => (
    <img
      src={chungsucLogoImg}
      alt={alt}
      className={`object-contain select-none filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)] ${
        animated ? 'hover:scale-105 transition-transform duration-300' : ''
      } ${extraClasses}`}
      draggable={false}
    />
  );

  // Variant 1: Full Logo (Default - Official 3D Graphic)
  if (variant === 'full') {
    return (
      <div
        className={`inline-flex items-center justify-center ${heightMap[size]} ${className}`}
      >
        {renderLogoImage('w-auto h-full max-h-full')}
      </div>
    );
  }

  // Variant 2: Icon Box (Compact badge with subtle studio glow)
  if (variant === 'icon') {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 p-1 rounded-xl bg-gradient-to-tr from-slate-900/90 to-blue-950/80 border border-amber-500/40 shadow-lg shadow-amber-500/10 ${
          iconBoxMap[size]
        } ${animated ? 'hover:scale-105 transition-transform duration-300' : ''} ${className}`}
      >
        {renderLogoImage('w-full h-full object-contain')}
      </div>
    );
  }

  // Variant 3: TV Bug / Broadcast Station Watermark
  if (variant === 'tv-bug') {
    return (
      <div
        className={`flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-amber-500/40 shadow-xl glow-gold select-none ${className}`}
      >
        <div className="h-7 w-auto shrink-0 flex items-center justify-center">
          {renderLogoImage('h-7 w-auto object-contain')}
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[10px] text-amber-300 font-extrabold uppercase tracking-widest leading-tight">
            Family Feud
          </span>
          <span className="text-[9px] text-slate-400 font-medium leading-none">
            Vietnam Edition
          </span>
        </div>
      </div>
    );
  }

  // Variant 4: Horizontal Badge (Logo Image + Subtitle text)
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div className={`${heightMap[size === 'custom' ? 'md' : size]} flex items-center shrink-0`}>
        {renderLogoImage('w-auto h-full max-h-full')}
      </div>
      {showSubtitle && (
        <div className="flex flex-col text-left border-l border-slate-700/60 pl-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold tracking-wider uppercase">
              Family Feud
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
            Gameshow Night Host & Interactive Display
          </p>
        </div>
      )}
    </div>
  );
};

export default ChungSucLogo;
