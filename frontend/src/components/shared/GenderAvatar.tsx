import React, { useState } from 'react';

interface GenderAvatarProps {
  gender?: 'Nam' | 'Nữ' | string;
  className?: string;
}

export const GenderAvatar: React.FC<GenderAvatarProps> = ({
  gender = 'Nam',
  className = 'w-10 h-10 rounded-full',
}) => {
  const isFemale = gender?.toLowerCase() === 'nữ' || gender?.toLowerCase() === 'female';
  const [imgError, setImgError] = useState(false);

  const avatarSrc = isFemale ? '/avatars/girl.jpg' : '/avatars/boy.jpg';
  const avatarAlt = isFemale ? 'Avatar Học Sinh / GLV Nữ' : 'Avatar Học Sinh / GLV Nam';

  if (imgError) {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 select-none overflow-hidden font-bold text-xs ${
          isFemale
            ? 'bg-rose-100 text-rose-700 border border-rose-200'
            : 'bg-sky-100 text-sky-700 border border-sky-200'
        } ${className}`}
      >
        {isFemale ? '👧' : '👦'}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 select-none overflow-hidden bg-surface-container-low shadow-xs border border-outline-variant/30 ${className}`}
    >
      <img
        src={avatarSrc}
        alt={avatarAlt}
        onError={() => setImgError(true)}
        className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-200"
        loading="lazy"
      />
    </div>
  );
};
