import { Clock } from 'lucide-react';

const PublicGroupMatches = ({ matches }) => {
  return (
    <div>
      <h5 className="text-sm md:text-base font-semibold text-slate-400 mb-2 uppercase tracking-wide flex items-center gap-2">
        <Clock size={16} className="text-emerald-500" /> Mečevi
      </h5>
      <div className="space-y-1 md:space-y-3">
        {matches.map((match) => {
            const p1Score = match.player1Score || 0;
            const p2Score = match.player2Score || 0;
            const isCompleted = match.status === 'completed';
            
            // Generate exact 5 sets for display columns
            const sets = Array.from({ length: 5 }).map((_, i) => {
                if (match.sets && match.sets[i]) {
                    return { p1: match.sets[i].p1 || 0, p2: match.sets[i].p2 || 0, played: true };
                }
                return { p1: '-', p2: '-', played: false };
            });

            return (
                <div key={match.id} className="block bg-slate-800/40 hover:bg-slate-800/60 rounded-md border border-slate-700/50 transition-all duration-200 hover:scale-[1.01]">
                    
                    {/* Mobile Layout */}
                    <div className="block md:hidden p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`text-sm font-semibold truncate ${p1Score > p2Score ? 'text-white' : 'text-slate-400'}`}>
                                    {match.player1.name}
                                </div>
                            </div>
                            <div className="flex-shrink-0 ml-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p1Score > p2Score ? 'bg-green-900/80 text-green-300' : 'bg-slate-700/50 text-slate-400'}`}>
                                    <div className="text-sm font-bold">
                                        {p1Score}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`text-sm font-semibold truncate ${p2Score > p1Score ? 'text-white' : 'text-slate-400'}`}>
                                    {match.player2.name}
                                </div>
                            </div>
                            <div className="flex-shrink-0 ml-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p2Score > p1Score ? 'bg-green-900/80 text-green-300' : 'bg-slate-700/50 text-slate-400'}`}>
                                    <div className="text-sm font-bold">
                                        {p2Score}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Set Display (Accordion) */}
                        {isCompleted && (
                            <div className="mt-3 pt-3 border-t border-slate-700/50 md:hidden">
                                <details className="group">
                                    <summary className="flex items-center justify-center gap-2 cursor-pointer text-xs text-slate-500 hover:text-white transition-colors py-2">
                                        <span>Prikaži po setovima</span>
                                        <svg className="w-3 h-3 transform transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </summary>
                                    <div className="pt-2">
                                        <div className="grid grid-cols-5 gap-1">
                                            {sets.map((set, idx) => (
                                                <div key={idx} className="flex flex-col items-center">
                                                    <div className="text-xs text-slate-500 mb-1 font-medium">{idx + 1}</div>
                                                    <div className="flex flex-col gap-0.5 w-full">
                                                        <span className={`text-xs px-1 py-0.5 rounded text-center ${set.played ? (set.p1 > set.p2 ? 'bg-green-900/60 text-white font-bold' : 'text-slate-400') : 'text-slate-600'}`}>
                                                            {set.p1}
                                                        </span>
                                                        <span className={`text-xs px-1 py-0.5 rounded text-center ${set.played ? (set.p2 > set.p1 ? 'bg-green-900/60 text-white font-bold' : 'text-slate-400') : 'text-slate-600'}`}>
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
                            {/* Left side: Players and sets */}
                            <div className="flex-1 space-y-4">
                                {/* Home Player */}
                                <div className="flex items-center gap-3">
                                    <div className={`text-xs md:text-sm font-bold truncate flex-1 min-w-0 ${p1Score > p2Score ? 'text-white' : 'text-slate-400'}`}>
                                        {match.player1.name}
                                    </div>
                                    {/* Sets */}
                                    <div className="flex gap-1 ml-4">
                                        {sets.map((set, idx) => (
                                            <div key={idx} className={`w-6 text-center ${idx < 4 ? 'border-r border-slate-700/50' : ''}`}>
                                                <span className={`text-xs px-1 py-0.5 rounded ${set.played ? (set.p1 > set.p2 ? 'bg-green-900 text-white font-bold' : 'text-slate-400') : 'text-slate-700'}`}>
                                                    {set.p1}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Away Player */}
                                <div className="flex items-center gap-3">
                                    <div className={`text-xs md:text-sm font-bold truncate flex-1 min-w-0 ${p2Score > p1Score ? 'text-white' : 'text-slate-400'}`}>
                                        {match.player2.name}
                                    </div>
                                    {/* Sets */}
                                    <div className="flex gap-1 ml-4">
                                        {sets.map((set, idx) => (
                                            <div key={idx} className={`w-6 text-center ${idx < 4 ? 'border-r border-slate-700/50' : ''}`}>
                                                <span className={`text-xs px-1 py-0.5 rounded ${set.played ? (set.p2 > set.p1 ? 'bg-green-900 text-white font-bold' : 'text-slate-400') : 'text-slate-700'}`}>
                                                    {set.p2}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right side: Final scores */}
                            <div className="flex flex-col items-center justify-center space-y-2 ml-4">
                                <div className="flex flex-col items-center space-y-2">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p1Score > p2Score ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'bg-slate-700/30'}`}>
                                        <div className={`text-xs font-black ${p1Score > p2Score ? 'text-white' : 'text-slate-400'}`}>
                                            {p1Score}
                                        </div>
                                    </div>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p2Score > p1Score ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'bg-slate-700/30'}`}>
                                        <div className={`text-xs font-black ${p2Score > p1Score ? 'text-white' : 'text-slate-400'}`}>
                                            {p2Score}
                                        </div>
                                    </div>
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
