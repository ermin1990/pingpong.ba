import React from 'react';
import { ArrowUp, X } from 'lucide-react';
import { sanitizeMatchSets } from '../../../../utils/matchSets';

const GlobalUIElements = ({ showAtTop, selectedMatch, setSelectedMatch }) => {
  const selectedMatchSets = sanitizeMatchSets(
    selectedMatch?.sets,
    selectedMatch?.player1Score,
    selectedMatch?.player2Score
  );

  return (
    <>
      {/* Back to Top Button */}
      {showAtTop && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 z-[90] w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:bg-blue-700 transition-all transform hover:-translate-y-2 active:scale-95 border-b-4 border-blue-800"
        >
          <ArrowUp size={24} />
        </button>
      )}

      {/* Match Details Overlay (for deep results) */}
      {selectedMatch && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" onClick={() => setSelectedMatch(null)}></div>
          <div className="relative bg-slate-900 border-2 border-slate-800 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-[0_32px_128px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Detalji Meča</h3>
              </div>
              <button onClick={() => setSelectedMatch(null)} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-10 space-y-10">
              <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Igrač 1</p>
                  <p className="text-xl font-black text-white uppercase italic truncate">{selectedMatch.player1?.name}</p>
                </div>
                <div className="bg-slate-800 px-6 py-4 rounded-3xl border border-slate-700 font-black text-2xl text-blue-500 italic">
                  {selectedMatch.player1Score} : {selectedMatch.player2Score}
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Igrač 2</p>
                  <p className="text-xl font-black text-white uppercase italic truncate">{selectedMatch.player2?.name}</p>
                </div>
              </div>

              {selectedMatchSets.length > 0 && (
                <div className="space-y-6 bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50">
                  <p className="text-center text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Rezultati po setovima</p>
                  <div className="flex justify-center gap-3">
                    {selectedMatchSets.map((set, idx) => (
                      <div key={idx} className="flex flex-col gap-2">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg border-2 ${set.p1 > set.p2 ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                          {set.p1}
                        </div>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg border-2 ${set.p2 > set.p1 ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                          {set.p2}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalUIElements;
