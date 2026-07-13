const PublicGroupMatches = ({ matches, onMatchClick }) => {
    const matchesByRound = matches.reduce((acc, match) => {
        const key = match.round || 1;
        if (!acc[key]) acc[key] = [];
        acc[key].push(match);
        return acc;
    }, {});

    const sortedRounds = Object.keys(matchesByRound)
        .map(Number)
        .sort((a, b) => a - b);

  return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1 mb-1">
                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">
            Raspored i Rezultati
        </h5>
      </div>

            <div className="space-y-3">
                {sortedRounds.map((round) => (
                    <div key={round} className="space-y-2">
                        <div className="px-2 py-1 rounded-md bg-slate-900/60 border border-slate-800 text-[9px] text-slate-400 font-black uppercase tracking-[0.14em]">
                            Kolo {round}
                        </div>

                        {matchesByRound[round].map((match) => {
            const p1Score = match.player1Score || 0;
            const p2Score = match.player2Score || 0;
            const isCompleted = match.status === 'completed';
            const p1Wins = isCompleted && p1Score > p2Score;
            const p2Wins = isCompleted && p2Score > p1Score;
                        const p1Name = match.player1?.name || 'TBD';
                        const p2Name = match.player2?.name || 'TBD';
            
            const sets = Array.from({ length: 5 }).map((_, i) => {
                if (match.sets && match.sets[i]) {
                    return { p1: match.sets[i].p1, p2: match.sets[i].p2, played: true };
                }
                return { p1: '-', p2: '-', played: false };
            });

            return (
                <div 
                    key={match.id} 
                    onClick={() => onMatchClick && onMatchClick(match)}
                    className="relative overflow-hidden bg-[#10192d] border border-slate-800 hover:border-slate-600 rounded-lg transition-all duration-300 group active:scale-[0.99] cursor-pointer"
                >
                    {/* Background accent */}
                    {isCompleted && (
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${p1Wins || p2Wins ? 'bg-emerald-500/60' : 'bg-slate-700'}`} />
                    )}

                    <div className="p-2.5 md:p-3">
                        <div className="flex items-stretch gap-3">
                            {/* Players Column */}
                            <div className="flex-1 flex flex-col justify-between gap-2 min-w-0">
                                {/* Player 1 Row */}
                                <div className="flex items-center justify-between gap-2 min-w-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${p1Wins ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-transparent'}`} />
                                        <div className="min-w-0">
                                            <div className={`text-[12px] md:text-[13px] font-bold truncate ${p1Wins ? 'text-white' : isCompleted ? 'text-slate-500' : 'text-slate-300'}`}>
                                                {p1Name}
                                                {match.player1?.club && match.player1.club !== 'Individual' && match.player1.club !== 'Individualno' && (
                                                    <span className="ml-1.5 text-[10px] text-slate-600 font-medium italic lowercase">
                                                        {match.player1.club}
                                                    </span>
                                                )}
                                            </div>
                                            {match.lineup1?.length > 0 && (
                                                <div className="text-[9px] text-slate-500 font-medium truncate">
                                                    {match.lineup1.map(p => p.name).join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Set Breakdown P1 */}
                                    <div className="flex items-center gap-1 ml-auto">
                                        {sets.map((set, idx) => (
                                            <div key={idx} className="w-4.5 text-center">
                                                {set.played ? (
                                                    <span className={`text-[9px] font-black ${set.p1 > set.p2 ? 'text-emerald-400' : 'text-slate-600'}`}>
                                                        {set.p1}
                                                    </span>
                                                ) : (
                                                  <span className="text-[9px] text-slate-800 opacity-20">-</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Player 2 Row */}
                                <div className="flex items-center justify-between gap-2 min-w-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${p2Wins ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-transparent'}`} />
                                        <div className="min-w-0">
                                            <div className={`text-[12px] md:text-[13px] font-bold truncate ${p2Wins ? 'text-white' : isCompleted ? 'text-slate-500' : 'text-slate-300'}`}>
                                                {p2Name}
                                                {match.player2?.club && match.player2.club !== 'Individual' && match.player2.club !== 'Individualno' && (
                                                    <span className="ml-1.5 text-[10px] text-slate-600 font-medium italic lowercase">
                                                        {match.player2.club}
                                                    </span>
                                                )}
                                            </div>
                                            {match.lineup2?.length > 0 && (
                                                <div className="text-[9px] text-slate-500 font-medium truncate">
                                                    {match.lineup2.map(p => p.name).join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Set Breakdown P2 */}
                                    <div className="flex items-center gap-1 ml-auto">
                                        {sets.map((set, idx) => (
                                            <div key={idx} className="w-4.5 text-center">
                                                {set.played ? (
                                                    <span className={`text-[9px] font-black ${set.p2 > set.p1 ? 'text-emerald-400' : 'text-slate-600'}`}>
                                                        {set.p2}
                                                    </span>
                                                ) : (
                                                  <span className="text-[9px] text-slate-800 opacity-20">-</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Final Score Block */}
                            <div className="flex flex-col items-center justify-center gap-1.5 pl-2.5 border-l border-slate-800 min-w-[36px]">
                                <div className={`w-7 h-7 rounded-md flex items-center justify-center transition-all duration-300 ${p1Wins ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.25)]' : isCompleted ? 'bg-slate-800 text-slate-500 shadow-inner' : 'bg-slate-800/50 text-slate-600'}`}>
                                    <span className="text-[13px] font-black italic">{p1Score}</span>
                                </div>
                                <div className={`w-7 h-7 rounded-md flex items-center justify-center transition-all duration-300 ${p2Wins ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.25)]' : isCompleted ? 'bg-slate-800 text-slate-500 shadow-inner' : 'bg-slate-800/50 text-slate-600'}`}>
                                    <span className="text-[13px] font-black italic">{p2Score}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PublicGroupMatches;
