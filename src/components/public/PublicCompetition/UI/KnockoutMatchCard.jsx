import React from 'react';

const KnockoutMatchCard = ({ match, isFinal = false, onMatchClick }) => {
  const p1Score = match.player1Score || 0;
  const p2Score = match.player2Score || 0;
  const isCompleted = match.status === 'completed';
  const p1Wins = isCompleted && p1Score > p2Score;
  const p2Wins = isCompleted && p2Score > p1Score;
  const p1Name = match.player1?.name || 'TBD';
  const p2Name = match.player2?.name || 'TBD';
  
  return (
    <div 
      onClick={() => onMatchClick && onMatchClick(match)}
      className="block bg-[#10192d] hover:bg-[#13203a] rounded-lg transition-all duration-200 border border-slate-700/80 overflow-hidden cursor-pointer min-w-[180px] md:min-w-[200px]"
      style={{ marginTop: '4px', marginBottom: '4px' }}
    >
      <div className="px-2.5 py-2">
        {/* Home Player */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`text-[11px] md:text-xs font-bold truncate ${p1Wins ? 'text-emerald-300' : 'text-slate-300'}`}>
              {p1Name}
            </div>
          </div>
          <div className="flex-shrink-0 ml-2">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${p1Wins ? 'bg-emerald-500 shadow-[0_0_10px_rgba(22,163,74,0.4)]' : 'bg-slate-700'}`}>
              <div className="text-[11px] font-black text-white">
                {p1Score}
              </div>
            </div>
          </div>
        </div>

        {/* Away Player */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`text-[11px] md:text-xs font-bold truncate ${p2Wins ? 'text-emerald-300' : 'text-slate-300'}`}>
              {p2Name}
            </div>
          </div>
          <div className="flex-shrink-0 ml-2">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${p2Wins ? 'bg-emerald-500 shadow-[0_0_10px_rgba(22,163,74,0.4)]' : 'bg-slate-700'}`}>
              <div className="text-[11px] font-black text-white">
                {p2Score}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnockoutMatchCard;
