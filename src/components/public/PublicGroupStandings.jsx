import { LayoutGrid } from 'lucide-react';

const PublicGroupStandings = ({ standings, advancingCount }) => {
  return (
    <div className="mb-4">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 mb-2 text-xs text-slate-500 font-medium px-2">
        <div className="col-span-6"></div>
        <div className="col-span-1 text-center font-bold">P</div>
        <div className="col-span-1 text-center font-bold">I</div>
        <div className="col-span-1 text-center font-bold text-blue-500/80">S±</div>
        <div className="col-span-1 text-center font-bold text-emerald-500/80">P±</div>
        <div className="col-span-2 text-center text-amber-600 dark:text-amber-500 font-bold uppercase tracking-wider">B</div>
      </div>

      {/* Table Rows */}
      <div className="space-y-1">
        {standings.map((p, idx) => {
          const isAdvancing = idx < advancingCount;
          const bgClass = isAdvancing 
            ? 'bg-emerald-500/10 dark:bg-emerald-500/20' 
            : 'bg-slate-50/30 dark:bg-slate-900/40';

          return (
            <div 
              key={idx} 
              className={`grid grid-cols-12 gap-1 items-center py-2 px-1 ${bgClass} hover:bg-white dark:hover:bg-slate-800/60 rounded text-xs md:text-sm transition-all duration-200 group border-b border-slate-100 dark:border-slate-800 last:border-b-0`}
            >
              <div className="col-span-6 flex items-center space-x-1 overflow-hidden">
                <span className={`font-bold w-5 text-center text-[10px] md:text-xs ${isAdvancing ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    {idx + 1}
                </span>
                <span className={`font-medium text-[11px] md:text-xs ${isAdvancing ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                    {p.name}
                </span>
              </div>
              <div className="col-span-1 text-center text-xs text-slate-500 dark:text-slate-400">{p.won}</div>
              <div className="col-span-1 text-center text-xs text-slate-500 dark:text-slate-400">{p.lost}</div>
              <div className={`col-span-1 text-center text-xs font-bold ${(p.setsWon - p.setsLost) >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-500'}`}>
                 {(p.setsWon - p.setsLost) > 0 ? `+${p.setsWon - p.setsLost}` : p.setsWon - p.setsLost}
              </div>
              <div className={`col-span-1 text-center text-xs ${p.pointDiff >= 0 ? 'text-blue-500/80 dark:text-blue-400' : 'text-rose-500/80'}`}>
                 {p.pointDiff > 0 ? `+${p.pointDiff}` : p.pointDiff}
              </div>
              <div className="col-span-2 text-center text-[13px] md:text-sm font-black text-amber-600 dark:text-amber-500">{p.points}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PublicGroupStandings;
