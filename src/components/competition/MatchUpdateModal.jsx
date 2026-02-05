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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-colors overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-[380px] rounded-lg shadow-2xl transition-all flex flex-col max-h-[90vh]">
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900/50 shrink-0">
          <div>
            <h3 className="text-slate-900 dark:text-white font-bold uppercase tracking-tight text-sm leading-none">
                {showSettings ? 'Postavke Meča' : 'Unos Rezultata'}
            </h3>
            <p className="text-[10px] text-slate-500 font-medium mt-1">
                {showSettings ? 'Promjena faze' : <>Setova za pobjedu: <span className="text-blue-600 dark:text-blue-500 font-bold">{setsToWin}</span></>}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-md transition-all ${showSettings ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'}`}
              title="Postavke meča"
            >
              <Settings size={16} />
            </button>
            <button onClick={() => setShowMatchModal(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors p-1"><X size={20} /></button>
          </div>
        </div>
        
        <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
          {showSettings ? (
            <div className="space-y-4">
               <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Naziv Runde</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm"
                  value={editingMatch.roundName || ''}
                  onChange={(e) => setEditingMatch({...editingMatch, roundName: e.target.value})}
                  placeholder="Npr. Polufinale..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Runda</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm"
                    value={editingMatch.round || 1}
                    onChange={(e) => setEditingMatch({...editingMatch, round: parseInt(e.target.value) || 1})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Index</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm"
                    value={editingMatch.bracketIndex || 0}
                    onChange={(e) => setEditingMatch({...editingMatch, bracketIndex: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

               <div className="pt-2">
                <button 
                  onClick={() => {
                    saveMatchResult(editingMatch);
                    setShowMatchModal(false);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  Sačuvaj Postavke
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status Selector */}
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
                <button 
                  onClick={() => setEditingMatch({...editingMatch, status: 'pending'})}
                  className={`flex-1 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${editingMatch.status !== 'completed' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                >
                  U toku
                </button>
                <button 
                  onClick={() => setEditingMatch({...editingMatch, status: 'completed'})}
                  className={`flex-1 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${editingMatch.status === 'completed' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                >
                  Gotov Meč
                </button>
              </div>

              <div className="flex items-center justify-between gap-2.5">
                <div className={`flex-1 text-center space-y-1.5 p-2 rounded-lg transition-all ${editingMatch.player1Score >= setsToWin ? 'bg-blue-50 dark:bg-blue-600/10 border-2 border-blue-500 dark:border-blue-400' : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'}`}>
                  <p className="text-base font-black text-slate-900 dark:text-white truncate px-1">{editingMatch.player1?.name || 'TBD'}</p>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-center text-3xl font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    value={editingMatch.player1Score || 0}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      const currentSets = editingMatch.sets || [];
                      const totalSets = val + (editingMatch.player2Score || 0);
                      const newSets = Array.from({ length: totalSets }, (_, i) => currentSets[i] || { p1: '', p2: '' });
                      const newStatus = (val >= setsToWin || (editingMatch.player2Score >= setsToWin)) ? 'completed' : 'pending';
                      setEditingMatch({...editingMatch, player1Score: val, sets: newSets, status: newStatus});
                    }}
                  />
                </div>
                <div className="text-lg font-black text-slate-300 dark:text-slate-700">:</div>
                <div className={`flex-1 text-center space-y-1.5 p-2 rounded-lg transition-all ${editingMatch.player2Score >= setsToWin ? 'bg-blue-50 dark:bg-blue-600/10 border-2 border-blue-500 dark:border-blue-400' : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'}`}>
                  <p className="text-base font-black text-slate-900 dark:text-white truncate px-1">{editingMatch.player2?.name || 'TBD'}</p>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-center text-3xl font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    value={editingMatch.player2Score || 0}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      const currentSets = editingMatch.sets || [];
                      const totalSets = (editingMatch.player1Score || 0) + val;
                      const newSets = Array.from({ length: totalSets }, (_, i) => currentSets[i] || { p1: '', p2: '' });
                      const newStatus = (val >= setsToWin || (editingMatch.player1Score >= setsToWin)) ? 'completed' : 'pending';
                      setEditingMatch({...editingMatch, player2Score: val, sets: newSets, status: newStatus});
                    }}
                  />
                </div>
              </div>              

              {((editingMatch.player1Score || 0) + (editingMatch.player2Score || 0)) > 0 && (
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5">
                  <p className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-2 text-center">Poeni po setovima</p>
                  <div className="space-y-1.5">
                    {Array.from({ length: (editingMatch.player1Score || 0) + (editingMatch.player2Score || 0) }).map((_, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white dark:bg-slate-950 p-1 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-8 pl-1">Set {idx + 1}</span>
                        <div className="flex items-center gap-1.5 flex-1">
                          <input 
                            type="number"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-1.5 text-center font-black text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all text-xs"
                            value={editingMatch.sets?.[idx]?.p1 ?? ''}
                            onChange={(e) => {
                                const newP1 = e.target.value === '' ? '' : parseInt(e.target.value);
                                const currentSets = [...(editingMatch.sets || [])];
                                if (!currentSets[idx]) currentSets[idx] = { p1: '', p2: '' };
                                currentSets[idx] = { ...currentSets[idx], p1: newP1 };
                                setEditingMatch({ ...editingMatch, sets: currentSets });
                            }}
                            placeholder="0"
                          />
                          <span className="text-slate-300 dark:text-slate-700 font-bold">:</span>
                          <input 
                            type="number"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-1.5 text-center font-black text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all text-xs"
                            value={editingMatch.sets?.[idx]?.p2 ?? ''}
                            onChange={(e) => {
                                const newP2 = e.target.value === '' ? '' : parseInt(e.target.value);
                                const currentSets = [...(editingMatch.sets || [])];
                                if (!currentSets[idx]) currentSets[idx] = { p1: '', p2: '' };
                                currentSets[idx] = { ...currentSets[idx], p2: newP2 };
                                setEditingMatch({ ...editingMatch, sets: currentSets });
                            }}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button 
                  onClick={() => {
                    if (validateScore()) {
                      saveMatchResult(editingMatch);
                      setShowMatchModal(false);
                    }
                  }}
                  className="w-full bg-amber-400 hover:bg-amber-500 text-black py-3 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-amber-600/30 active:scale-95 flex items-center justify-center gap-2"
                >
                  Sačuvaj Rezultat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchUpdateModal;
