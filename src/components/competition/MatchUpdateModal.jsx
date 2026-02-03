import React from 'react';
import { X } from 'lucide-react';

const MatchUpdateModal = ({ 
  showMatchModal, 
  editingMatch, 
  setEditingMatch, 
  setShowMatchModal, 
  saveMatchResult 
}) => {
  if (!showMatchModal || !editingMatch) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-white font-black uppercase italic tracking-tighter text-lg">Unos Rezultata</h3>
          <button onClick={() => setShowMatchModal(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
        </div>
        
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center space-y-2">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{editingMatch.player1.name}</p>
              <input 
                type="number" 
                className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-center text-3xl font-black text-white focus:border-blue-500 outline-none transition-all"
                value={editingMatch.player1Score || 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  const currentSets = editingMatch.sets || [];
                  const totalSets = val + (editingMatch.player2Score || 0);
                  const newSets = Array.from({ length: totalSets }, (_, i) => currentSets[i] || { p1: 0, p2: 0 });
                  setEditingMatch({...editingMatch, player1Score: val, sets: newSets});
                }}
              />
            </div>
            <div className="text-2xl font-black text-slate-700">:</div>
            <div className="flex-1 text-center space-y-2">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{editingMatch.player2.name}</p>
              <input 
                type="number" 
                className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-center text-3xl font-black text-white focus:border-blue-500 outline-none transition-all"
                value={editingMatch.player2Score || 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  const currentSets = editingMatch.sets || [];
                  const totalSets = (editingMatch.player1Score || 0) + val;
                  const newSets = Array.from({ length: totalSets }, (_, i) => currentSets[i] || { p1: 0, p2: 0 });
                  setEditingMatch({...editingMatch, player2Score: val, sets: newSets});
                }}
              />
            </div>
          </div>

          {(editingMatch.player1Score + editingMatch.player2Score) > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Poeni po setovima</h4>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                {Array.from({ length: (editingMatch.player1Score + editingMatch.player2Score) }).map((_, idx) => (
                  <div key={idx} className="flex flex-col gap-1.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
                    <span className="text-[8px] font-black text-slate-600 uppercase">Set {idx + 1}</span>
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="number"
                        placeholder="P1"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 text-center text-xs font-bold text-white outline-none focus:border-blue-500/50"
                        value={editingMatch.sets?.[idx]?.p1 || 0}
                        onChange={(e) => {
                          const newSets = [...(editingMatch.sets || [])];
                          newSets[idx] = { ...newSets[idx], p1: parseInt(e.target.value) || 0 };
                          setEditingMatch({...editingMatch, sets: newSets});
                        }}
                      />
                      <span className="text-slate-800 font-bold text-[10px]">:</span>
                      <input 
                        type="number"
                        placeholder="P2"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 text-center text-xs font-bold text-white outline-none focus:border-blue-500/50"
                        value={editingMatch.sets?.[idx]?.p2 || 0}
                        onChange={(e) => {
                          const newSets = [...(editingMatch.sets || [])];
                          newSets[idx] = { ...newSets[idx], p2: parseInt(e.target.value) || 0 };
                          setEditingMatch({...editingMatch, sets: newSets});
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button 
            onClick={async () => {
              if (editingMatch.isKnockout && Number(editingMatch.player1Score || 0) === Number(editingMatch.player2Score || 0)) {
                alert("Knockout meč ne može završiti neriješeno. Unesite pobjednički rezultat.");
                return;
              }
              await saveMatchResult(editingMatch);
              setShowMatchModal(false);
            }}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-500/20"
          >
            Sačuvaj Rezultat
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchUpdateModal;
