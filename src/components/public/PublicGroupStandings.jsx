import { LayoutGrid } from 'lucide-react';

const PublicGroupStandings = ({ standings, advancingCount }) => {
  return (
    <div className="mb-4">
      <h5 className="text-sm md:text-base font-semibold text-slate-400 mb-2 uppercase tracking-wide flex items-center gap-2">
        <LayoutGrid size={16} className="text-blue-500" /> Tabela
      </h5>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-1 mb-2 text-[9px] text-slate-500 font-black uppercase tracking-widest px-2">
        <div className="col-span-6">Igrač</div>
        <div className="col-span-1 text-center">P</div>
        <div className="col-span-1 text-center">I</div>
        <div className="col-span-1 text-center">S±</div>
        <div className="col-span-1 text-center">G±</div>
        <div className="col-span-2 text-center">B</div>
      </div>

      {/* Table Rows */}
      <div className="space-y-0.5">
        {standings.map((p, idx) => {
          const isAdvancing = idx < advancingCount;
          const bgClass = isAdvancing 
            ? 'bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30' 
            : 'bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800/50';

          return (
            <div 
              key={idx} 
              className={`${bgClass} rounded-lg p-2 grid grid-cols-12 gap-1 items-center transition-all duration-200 group`}
            >
              <div className="col-span-6 flex items-center gap-2 overflow-hidden">
                <span className={`text-[10px] font-black italic ${isAdvancing ? 'text-blue-400' : 'text-slate-600'}`}>
                    {idx + 1}.
                </span>
                <span className={`text-[10px] font-black uppercase truncate ${isAdvancing ? 'text-white' : 'text-slate-400'}`}>
                    {p.name}
                </span>
              </div>
              <div className="col-span-1 text-center text-[10px] font-bold text-slate-400">{p.won}</div>
              <div className="col-span-1 text-center text-[10px] font-bold text-slate-400">{p.lost}</div>
              <div className={`col-span-1 text-center text-[10px] font-bold ${(p.setsWon - p.setsLost) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                 {(p.setsWon - p.setsLost) > 0 ? `+${p.setsWon - p.setsLost}` : p.setsWon - p.setsLost}
              </div>
              <div className={`col-span-1 text-center text-[10px] font-bold ${p.pointDiff >= 0 ? 'text-blue-500/50' : 'text-slate-600'}`}>
                 {p.pointDiff > 0 ? `+${p.pointDiff}` : p.pointDiff}
              </div>
              <div className="col-span-2 text-center text-xs font-black text-blue-500">{p.points}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PublicGroupStandings;
