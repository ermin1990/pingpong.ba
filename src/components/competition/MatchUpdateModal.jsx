import React from 'react';
import { X, Settings } from 'lucide-react';

const MatchUpdateModal = ({ 
  showMatchModal, 
  editingMatch, 
  setEditingMatch, 
  setShowMatchModal, 
  saveMatchResult,
  activeCategory
}) => {
  const [showSettings, setShowSettings] = React.useState(false);
  
  // Reset showSettings when modal opens/closes
  React.useEffect(() => {
    if (!showMatchModal) setShowSettings(false);
  }, [showMatchModal]);

  if (!showMatchModal || !editingMatch) return null;

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

    if (editingMatch.status === 'completed') return true;
    if (s1 < 0 || s2 < 0) {
      alert("Rezultat ne može biti negativan.");
      return false;
    }
    if (editingMatch.isKnockout && s1 === s2) {
      alert("Knockout mec ne može završiti neriješeno.");
      return false;
    }
    return true;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-white font-black uppercase italic tracking-tighter text-lg leading-none">
                {showSettings ? 'Postavke Meča' : 'Unos Rezultata'}
            </h3>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">
                {showSettings ? 'Promjena faze i pozicije' : <>Potrebno setova za pobjedu: <span className="text-blue-500">{setsToWin}</span></>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-xl transition-all ${showSettings ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-white'}`}
              title="Postavke meča"
            >
              <Settings size={18} />
            </button>
            <button onClick={() => setShowMatchModal(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
          </div>
        </div>
        
        <div className="p-8 space-y-8">
          {showSettings ? (
            <div className="space-y-6">
               <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Naziv Runde / Faza</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500 transition-all"
                  value={editingMatch.roundName || ''}
                  onChange={(e) => setEditingMatch({...editingMatch, roundName: e.target.value})}
                  placeholder="Npr. 1/4 Finale, Polufinale..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Broj Runde</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500 transition-all"
                    value={editingMatch.round || 1}
                    onChange={(e) => setEditingMatch({...editingMatch, round: parseInt(e.target.value) || 1})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Poredak (Index)</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500 transition-all"
                    value={editingMatch.bracketIndex || 0}
                    onChange={(e) => setEditingMatch({...editingMatch, bracketIndex: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

               <div className="pt-4">
                <button 
                  onClick={() => {
                    saveMatchResult(editingMatch);
                    setShowMatchModal(false);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-600/20"
                >
                  Sačuvaj Postavke
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Status Selector */}
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
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest truncate">{editingMatch.player1?.name || 'TBD'}</p>
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
                      const newStatus = (val >= setsToWin || (editingMatch.player2Score >= setsToWin)) ? 'completed' : 'pending';
                      setEditingMatch({...editingMatch, player1Score: val, sets: newSets, status: newStatus});
                    }}
                  />
                </div>
                <div className="text-2xl font-black text-slate-700">:</div>
                <div className={`flex-1 text-center space-y-2 p-4 rounded-2xl transition-all ${editingMatch.player2Score >= setsToWin ? 'bg-blue-600/10 border border-blue-600/20' : ''}`}>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest truncate">{editingMatch.player2?.name || 'TBD'}</p>
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
                      const newStatus = (val >= setsToWin || (editingMatch.player1Score >= setsToWin)) ? 'completed' : 'pending';
                      setEditingMatch({...editingMatch, player2Score: val, sets: newSets, status: newStatus});
                    }}
                  />
                </div>
              </div>

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
                  Sačuvaj Rezultat
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchUpdateModal;
