import React from 'react';
import { LayoutGrid } from 'lucide-react';

const PublicGroupStandings = ({ standings = [], advancingCount = 0 }) => {
  if (!standings || !Array.isArray(standings) || standings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-[#0a0f1d]/40 rounded-[32px] border border-slate-800/50">
        <div className="w-16 h-16 bg-slate-900/50 rounded-2xl flex items-center justify-center mb-6 border border-slate-800/50">
          <LayoutGrid size={32} className="text-slate-700" />
        </div>
        <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tight italic">Grupe još nisu formirane</h3>
        <p className="text-slate-500 text-sm max-w-[240px] font-medium leading-relaxed">
          Organizator trenutno priprema žrijeb i sastave grupa za ovu kategoriju.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4 overflow-x-auto -mx-2 px-2 md:mx-0 md:px-0">
      <div className="min-w-[420px]">
        <div className="flex items-center justify-between px-1 mb-2">
          <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">
            Poredak u Grupi
          </h5>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-1 mb-1.5 text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-tighter px-2.5">
          <div className="col-span-6 flex items-center gap-2">
            <span className="w-5 text-center">#</span>
            <span>Igrač</span>
          </div>
          <div className="col-span-1 text-center">M</div>
          <div className="col-span-1 text-center">P</div>
          <div className="col-span-1 text-center">I</div>
          <div className="col-span-1 text-center">S</div>
          <div className="col-span-1 text-center">G</div>
          <div className="col-span-1 text-center text-blue-400">Bod</div>
        </div>

        {/* Table Rows */}
        <div className="space-y-1.5">
          {standings.map((p, idx) => {
            const isAdvancing = idx < advancingCount;
            
            return (
              <div 
                key={idx} 
                className={`grid grid-cols-12 gap-1 items-center py-2 px-2.5 rounded-lg transition-all duration-300 border ${
                  isAdvancing 
                  ? 'bg-emerald-500/10 border-emerald-500/20' 
                  : 'bg-slate-900/40 border-slate-800/80'
                } hover:bg-slate-800/60 group`}
              >
                <div className="col-span-6 flex items-center gap-2 overflow-hidden">
                  <span className={`w-5 text-center text-[10px] font-black ${isAdvancing ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {idx + 1}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-white font-bold text-[12px] truncate">
                        {p.name}
                    </span>
                    {p.club && p.club !== 'Individual' && p.club !== 'Individualno' && (
                        <span className="text-slate-500 text-[9px] lowercase italic truncate leading-none mt-0.5">
                            {p.club}
                        </span>
                    )}
                  </div>
                </div>
                
                <div className="col-span-1 text-center text-slate-300 font-bold text-[11px]">{p.played}</div>
                <div className="col-span-1 text-center text-emerald-300 font-bold text-[11px]">{p.won}</div>
                <div className="col-span-1 text-center text-rose-300 text-[11px] font-bold">{p.lost}</div>
                
                <div className={`col-span-1 text-center font-black text-[11px] ${(p.setsWon - p.setsLost) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                   {(p.setsWon - p.setsLost) > 0 ? `+${p.setsWon - p.setsLost}` : p.setsWon - p.setsLost}
                </div>
                
                <div className={`col-span-1 text-center text-[10px] font-bold ${p.pointDiff >= 0 ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                   {p.pointDiff > 0 ? `+${p.pointDiff}` : p.pointDiff}
                </div>
                
                <div className="col-span-1 text-center">
                    <span className="bg-blue-500/15 text-blue-300 px-2 py-0.5 rounded-md text-[11px] font-black ring-1 ring-inset ring-blue-500/20">
                      {p.points}
                    </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PublicGroupStandings;
