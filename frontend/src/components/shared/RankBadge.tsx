import React from 'react';

interface RankBadgeProps {
  rank: number | null | undefined;
  isCompact?: boolean;
}

export const RankBadge: React.FC<RankBadgeProps> = ({ rank, isCompact = false }) => {
  if (rank === null || rank === undefined) {
    return <span className="text-outline">—</span>;
  }

  switch (rank) {
    case 1:
      return (
        <span className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-amber-950 border border-amber-400 shadow-md shadow-amber-400/40 ring-2 ring-yellow-400">
          <span>🥇</span>
          <span>{isCompact ? '1' : 'Hạng 1'}</span>
        </span>
      );
    case 2:
      return (
        <span className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-slate-200 via-slate-300 to-slate-400 text-slate-950 border border-slate-400 shadow-md shadow-slate-400/30 ring-2 ring-slate-300">
          <span>🥈</span>
          <span>{isCompact ? '2' : 'Hạng 2'}</span>
        </span>
      );
    case 3:
      return (
        <span className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 text-white border border-orange-400 shadow-md shadow-orange-500/40 ring-2 ring-orange-400">
          <span>🥉</span>
          <span>{isCompact ? '3' : 'Hạng 3'}</span>
        </span>
      );
    case 4:
      return (
        <span className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-700 text-white border border-blue-300 shadow-md shadow-blue-500/40 ring-2 ring-blue-400">
          <span>🎖️</span>
          <span>{isCompact ? '4' : 'Hạng 4'}</span>
        </span>
      );
    default:
      return (
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-surface-container-high text-on-surface-variant">
          {isCompact ? rank : `Hạng ${rank}`}
        </span>
      );
  }
};
