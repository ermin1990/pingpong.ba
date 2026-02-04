import React from 'react';
import { X } from 'lucide-react';

const MatchUpdateModal = ({ 
  showMatchModal, 
  editingMatch, 
  setEditingMatch, 
  setShowMatchModal, 
  saveMatchResult,
  activeCategory
}) => {
  if (!showMatchModal || !editingMatch) return null;

  // Izvuci postavke turnira za pobjedu
  // Podrazumijeva se 2 dobijena seta (Best of 3) ako nije definisano
  const setsToWin = activeCategory?.setsToWin || 2;

  const applyQuickScore = (setScores) => {
    const sets = editingMatch.sets || [];
    const lastIdx = sets.length - 1;
    if (lastIdx >= 0) {
      const newSets = [...sets];
      newSets[lastIdx] = { p1: setScores[0], p2: setScores[1] };
      setEditingMatch({...editingMatch, sets: newSets});
    }
  };

  const validateScore = () => {
    const s1 = parseInt(editingMatch.player1Score) || 0;
    const s2 = parseInt(editingMatch.player2Score) || 0;

    // Ako je mec oznacen kao zavr�en ("Predaja"), dozvoljava se bilo koji rezultat
    if (editingMatch.status === 'completed') {
      return true;
    }

    // Validation: scores must be non-negative
    if (s1 < 0 || s2 < 0) {
      alert("Rezultat ne mo�e biti negativan.");
      return false;
    }

    // Provera da li je neko ostvario potreban broj setova za pobedu
    if (s1 < setsToWin && s2 < setsToWin) {
      // Maknut confirm, dozvoljavamo spremanje meca u toku bez popup-a
    }

    // Validation: knockout can't end in draw
    if (editingMatch.isKnockout && s1 === s2) {
      alert("Knockout mec ne mo�e zavr�iti nerije�eno. Unesite pobjednicki rezultat.");
      return false;
    }

    return true;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-white font-black uppercase italic tracking-tighter text-lg leading-none">Unos Rezultata</h3>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Potrebno setova za pobjedu: <span className="text-blue-500">{setsToWin}</span></p>
          </div>
          <button onClick={() => setShowMatchModal(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
        </div>
        
        <div className="p-8 space-y-8">
          {/* Status Selector (Normalno vs Predaja) */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => setEditingMatch({...editingMatch, status: 'pending'})}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${editingMatch.status !== 'completed' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            >
              U toku
            </button>
            <button 
              onClick={() => setEditingMatch({...editingMatch, status: 'completed'})}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${editingMatch.status === 'completed' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Gotov Mec / Predaja
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className={`flex-1 text-center space-y-2 p-4 rounded-2xl transition-all ${editingMatch.player1Score >= setsToWin ? 'bg-blue-600/10 border border-blue-600/20' : ''}`}>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest truncate">{editingMatch.player1.name}</p>
              <input 
                type="number" 
                min="0"
                max="5"
                className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-center text-3xl font-black text-white focus:border-blue-500 outline-none transition-all"
                value={editingMatch.player1Score || 0}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(5, parseInt(e.target.value) || 0));
                  const currentSets = editingMatch.sets || [];
                  const totalSets = val + (editingMatch.player2Score || 0);
                  const newSets = Array.from({ length: totalSets }, (_, i) => currentSets[i] || { p1: 0, p2: 0 });
                  
                  // Auto-complete status if someone reached setsToWin
                  const newStatus = (val >= setsToWin || (editingMatch.player2Score >= setsToWin)) ? 'completed' : 'pending';
                  
                  setEditingMatch({...editingMatch, player1Score: val, sets: newSets, status: newStatus});
                }}
              />
            </div>
            <div className="text-2xl font-black text-slate-700">:</div>
            <div className={`flex-1 text-center space-y-2 p-4 rounded-2xl transition-all ${editingMatch.player2Score >= setsToWin ? 'bg-blue-600/10 border border-blue-600/20' : ''}`}>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest truncate">{editingMatch.player2.name}</p>
              <input 
                type="number" 
                min="0"
                max="5"
                className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-center text-3xl font-black text-white focus:border-blue-500 outline-none transition-all"
                value={editingMatch.player2Score || 0}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(5, parseInt(e.target.value) || 0));
                  const currentSets = editingMatch.sets || [];
                  const totalSets = (editingMatch.player1Score || 0) + val;
                  const newSets = Array.from({ length: totalSets }, (_, i) => currentSets[i] || { p1: 0, p2: 0 });
                  
                  // Auto-complete status if someone reached setsToWin
                  const newStatus = (val >= setsToWin || (editingMatch.player1Score >= setsToWin)) ? 'completed' : 'pending';
                  
                  setEditingMatch({...editingMatch, player2Score: val, sets: newSets, status: newStatus});
                }}
              />
            </div>
          </div>

          {(editingMatch.player1Score + editingMatch.player2Score) > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Poeni po setovima</h4>
                <div className="flex gap-1">
                  <button onClick={() => applyQuickScore([11, 9])} className="text-[9px] px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-all">11:9</button>
                  <button onClick={() => applyQuickScore([11, 2])} className="text-[9px] px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-all">11:0 (W.O.)</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                {Array.from({ length: (editingMatch.player1Score + editingMatch.player2Score) }).map((_, idx) => (
                  <div key={idx} className="flex flex-col gap-1.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
                    <span className="text-[8px] font-black text-slate-600 uppercase">Set {idx + 1}</span>
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="number"
                        min="0"
                        max="30"
                        placeholder="P1"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 text-center text-xs font-bold text-white outline-none focus:border-blue-500/50"
                        value={editingMatch.sets?.[idx]?.p1 || 0}
                        onChange={(e) => {
                          const newSets = [...(editingMatch.sets || [])];
                          const val = Math.max(0, Math.min(30, parseInt(e.target.value) || 0));
                          newSets[idx] = { ...newSets[idx], p1: val };
                          setEditingMatch({...editingMatch, sets: newSets});
                        }}
                      />
                      <span className="text-slate-800 font-bold text-[10px]">:</span>
                      <input 
                        type="number"
                        min="0"
                        max="30"
                        placeholder="P2"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 text-center text-xs font-bold text-white outline-none focus:border-blue-500/50"
                        value={editingMatch.sets?.[idx]?.p2 || 0}
                        onChange={(e) => {
                          const newSets = [...(editingMatch.sets || [])];
                          const val = Math.max(0, Math.min(30, parseInt(e.target.value) || 0));
                          newSets[idx] = { ...newSets[idx], p2: val };
                          setEditingMatch({...editingMatch, sets: newSets});
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4">
            <button 
              onClick={() => {
                if (validateScore()) {
                  saveMatchResult(editingMatch);
                  setShowMatchModal(false);
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-600/20 active:scale-95"
            >
              Sacuvaj Rezultat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchUpdateModal;
