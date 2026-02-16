import React from 'react';
import { X, Settings } from 'lucide-react';

const MatchUpdateModal = ({ 
  showMatchModal, 
  editingMatch, 
  setEditingMatch, 
  setShowMatchModal, 
  saveMatchResult,
  activeCategory,
  tables, // New prop
  referees // New prop
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-all overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-[400px] rounded-[40px] shadow-2xl transition-all flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
          <div>
            <h3 className="text-slate-900 dark:text-white font-black uppercase tracking-tighter text-base leading-none">
                {showSettings ? 'Postavke Meča' : 'Unos Rezultata'}
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                {showSettings ? 'PROMJENA FAZE' : <>SET DO: <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded-md font-black">{setsToWin}</span></>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all ${showSettings ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              title="Postavke meča"
            >
              <Settings size={18} />
            </button>
            <button 
              onClick={() => setShowMatchModal(false)} 
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {showSettings ? (
            <div className="space-y-5">
               <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 ml-1">Naziv Runde</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white font-black outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs uppercase tracking-wider"
                  value={editingMatch.roundName || ''}
                  onChange={(e) => setEditingMatch({...editingMatch, roundName: e.target.value})}
                  placeholder="Npr. Polufinale..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 ml-1">Runda</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white font-black outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
                    value={editingMatch.round || 1}
                    onChange={(e) => setEditingMatch({...editingMatch, round: parseInt(e.target.value) || 1})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 ml-1">Index</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white font-black outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
                    value={editingMatch.bracketIndex || 0}
                    onChange={(e) => setEditingMatch({...editingMatch, bracketIndex: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              {/* Table Selection */}
              <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 ml-1">Stol</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white font-black outline-none focus:ring-2 focus:ring-blue-500/20 text-xs uppercase tracking-wider"
                    value={editingMatch.tableId || ''}
                    onChange={(e) => {
                        const tId = e.target.value;
                        const tName = tables?.find(t => t.id === tId)?.name || '';
                        setEditingMatch({...editingMatch, tableId: tId, table: tName}); 
                    }}
                  >
                    <option value="">Nedodijeljen</option>
                    {tables?.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
              </div>
              {/* Referee Selection */}
              <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 ml-1">Sudija</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white font-black outline-none focus:ring-2 focus:ring-blue-500/20 text-xs uppercase tracking-wider"
                    value={editingMatch.refereeId || ''}
                    onChange={(e) => {
                        const rId = e.target.value;
                        const rName = referees?.find(r => r.id === rId)?.name || '';
                        setEditingMatch({...editingMatch, refereeId: rId, refereeName: rName}); 
                    }}
                  >
                    <option value="">Nema sudije</option>
                    {referees?.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
              </div>
               <div className="pt-4">
                <button 
                  onClick={() => {
                    saveMatchResult(editingMatch);
                    setShowMatchModal(false);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                >
                  Sačuvaj Postavke
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status Selector */}
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5 shrink-0">
                <button 
                  onClick={() => setEditingMatch({...editingMatch, status: 'pending'})}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editingMatch.status !== 'completed' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  U toku
                </button>
                <button 
                  onClick={() => setEditingMatch({...editingMatch, status: 'completed'})}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editingMatch.status === 'completed' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Završen
                </button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className={`flex-1 text-center space-y-3 p-4 rounded-3xl transition-all border-2 ${editingMatch.player1Score >= setsToWin ? 'bg-emerald-500/5 border-emerald-500 shadow-lg shadow-emerald-500/10' : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-white/5'}`}>
                  <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">{editingMatch.player1?.name || 'TBD'}</p>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full bg-transparent border-none text-center text-5xl font-black text-slate-900 dark:text-white outline-none"
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
                <div className="text-2xl font-black text-slate-300 dark:text-slate-800">:</div>
                <div className={`flex-1 text-center space-y-3 p-4 rounded-3xl transition-all border-2 ${editingMatch.player2Score >= setsToWin ? 'bg-emerald-500/5 border-emerald-500 shadow-lg shadow-emerald-500/10' : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-white/5'}`}>
                  <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">{editingMatch.player2?.name || 'TBD'}</p>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full bg-transparent border-none text-center text-5xl font-black text-slate-900 dark:text-white outline-none"
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
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-[32px] p-4">
                  <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] mb-4 text-center">Poeni po setovima</p>
                  <div className="space-y-2">
                    {Array.from({ length: (editingMatch.player1Score || 0) + (editingMatch.player2Score || 0) }).map((_, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-white/5">
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 w-10 pl-2">SET {idx + 1}</span>
                        <div className="flex items-center gap-2 flex-1">
                          <input 
                            type="number"
                            className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-xl p-3 text-center font-black text-slate-900 dark:text-white outline-none text-sm"
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
                          <span className="text-slate-200 dark:text-slate-800 font-black">:</span>
                          <input 
                            type="number"
                            className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-xl p-3 text-center font-black text-slate-900 dark:text-white outline-none text-sm"
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
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-3xl font-black uppercase tracking-widest text-xs transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3"
                >
                  SAČUVAJ REZULTAT
                </button>
              </div>

              {(editingMatch.tableId || editingMatch.refereeId) && (
                <div className="pt-2 flex flex-wrap gap-2 justify-center">
                    {editingMatch.tableId && (
                        <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-[8px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                            STOL: {tables?.find(t => t.id === editingMatch.tableId)?.name || editingMatch.tableId}
                        </div>
                    )}
                    {editingMatch.refereeId && (
                        <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-[8px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            SUDIJA: {referees?.find(r => r.id === editingMatch.refereeId)?.name || editingMatch.refereeName}
                        </div>
                    )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchUpdateModal;
