import { Clock } from 'lucide-react';

const PublicGroupMatches = ({ matches, onMatchClick }) => {
  return (
    <div>
      <h5 className="text-sm md:text-base font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
        Mečevi
      </h5>
      <div className="space-y-1 md:space-y-3">
        {matches.map((match) => {
            const p1Score = match.player1Score || 0;
            const p2Score = match.player2Score || 0;
            const isCompleted = match.status === 'completed';
            const p1Wins = isCompleted && p1Score > p2Score;
            const p2Wins = isCompleted && p2Score > p1Score;
            
            // Generate exact 5 sets for display columns
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
                    className="block cursor-pointer bg-slate-50/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-800/60 rounded-md transition-all duration-200 hover:scale-[1.01] border-b md:border border-slate-100 dark:border-slate-800 last:border-b-0"
                >
                    
                    {/* Mobile Layout */}
                    <div className="block md:hidden py-3 px-2">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`text-sm font-semibold ${p1Wins ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {match.player1.name}
                                </div>
                            </div>
                            <div className="flex-shrink-0 ml-2">
                                <div className={`w-7 h-7 rounded flex items-center justify-center ${p1Wins ? 'bg-green-600/20 text-green-600 dark:bg-green-900/80 dark:text-green-300' : 'bg-slate-200 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400'}`}>
                                    <div className="text-xs font-bold">
                                        {p1Score}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`text-sm font-semibold ${p2Wins ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {match.player2.name}
                                </div>
                            </div>
                            <div className="flex-shrink-0 ml-2">
                                <div className={`w-7 h-7 rounded flex items-center justify-center ${p2Wins ? 'bg-green-600/20 text-green-600 dark:bg-green-900/80 dark:text-green-300' : 'bg-slate-200 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400'}`}>
                                    <div className="text-xs font-bold">
                                        {p2Score}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Set Display */}
                        {isCompleted && (
                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/50">
                                <details className="group">
                                    <summary className="flex items-center justify-center gap-2 cursor-pointer text-[10px] uppercase font-bold text-slate-400 hover:text-blue-500 transition-colors py-1">
                                        <span>Po setovima</span>
                                        <svg className="w-3 h-3 transform transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </summary>
                                    <div className="pt-2">
                                        <div className="grid grid-cols-5 gap-1">
                                            {sets.map((set, idx) => (
                                                <div key={idx} className="flex flex-col items-center">
                                                    <div className="text-[9px] text-slate-400 mb-1 font-bold">{idx + 1}</div>
                                                    <div className="flex flex-col gap-0.5 w-full">
                                                        <span className={`text-xs p-1 rounded text-center ${set.played ? (set.p1 > set.p2 ? 'bg-green-600/10 text-green-600 dark:bg-green-900/60 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400') : 'text-slate-300 dark:text-slate-700'}`}>
                                                            {set.p1}
                                                        </span>
                                                        <span className={`text-xs p-1 rounded text-center ${set.played ? (set.p2 > set.p1 ? 'bg-green-600/10 text-green-600 dark:bg-green-900/60 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400') : 'text-slate-300 dark:text-slate-700'}`}>
                                                            {set.p2}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </details>
                            </div>
                        )}
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:block p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 space-y-4">
                                {/* Home Player */}
                                <div className="flex items-center gap-3">
                                    <div className={`text-sm font-bold flex-1 min-w-0 ${p1Wins ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {match.player1.name}
                                    </div>
                                </div>

                                {/* Away Player */}
                                <div className="flex items-center gap-3">
                                    <div className={`text-sm font-bold flex-1 min-w-0 ${p2Wins ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {match.player2.name}
                                    </div>
                                </div>
                            </div>

                            {/* Final score boxes */}
                            <div className="flex flex-col items-center justify-center gap-2 ml-8 border-l border-slate-100 dark:border-slate-800 pl-8">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${p1Wins ? 'bg-green-600 dark:bg-green-900 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                    <span className="text-base font-black">{p1Score}</span>
                                </div>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${p2Wins ? 'bg-green-600 dark:bg-green-900 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                    <span className="text-base font-black">{p2Score}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default PublicGroupMatches;
