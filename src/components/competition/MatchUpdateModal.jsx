import React from 'react';
import { X, Settings, Radio } from 'lucide-react';
import ShareResultCard from '../common/ShareResultCard';
import LiveScoringModal from './LiveScoringModal';

const MatchUpdateModal = ({ 
  showMatchModal, 
  editingMatch, 
  setEditingMatch, 
  setShowMatchModal,
  saveMatchResult,
  activeCategory,
  tables, // New prop
  referees, // New prop
  team1Roster, // Optional: full roster of team playing as player1 (team-mode leagues)
  team2Roster // Optional: full roster of team playing as player2 (team-mode leagues)
}) => {
  const [showSettings, setShowSettings] = React.useState(false);
  const [showLive, setShowLive] = React.useState(false);

  // Reset showSettings when modal opens/closes
  React.useEffect(() => {
    if (!showMatchModal) { setShowSettings(false); setShowLive(false); }
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

    if (s1 < 0 || s2 < 0) {
      alert("Rezultat ne može biti negativan.");
      return false;
    }
    // Tenis se igra na setove (best-of-N) - meč nikad ne može završiti neriješeno.
    if (editingMatch.status === 'completed' && s1 === s2) {
      alert("Meč ne može završiti neriješeno.");
      return false;
    }
    return true;
  };

  return (
    <>
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-all overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full md:w-auto md:min-w-[400px] max-w-md rounded-[24px] shadow-2xl transition-all flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
          <div>
            <h3 className="text-slate-900 dark:text-white font-black uppercase tracking-tighter text-sm leading-none">
                {showSettings ? 'Postavke' : 'Rezultat'}
            </h3>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                {showSettings ? 'OPCIJE' : <>SET: <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-[9px] font-black">{setsToWin}</span></>}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowLive(true)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
              title="Vodi meč uživo, poen po poen"
            >
              <Radio size={14} />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${showSettings ? 'bg-amber-400 text-black shadow-lg shadow-amber-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              title="Postavke meča"
            >
              <Settings size={14} />
            </button>
            <button 
              onClick={() => setShowMatchModal(false)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        
        <div className="p-3 overflow-y-auto custom-scrollbar flex-1">
          {showSettings ? (
            <div className="space-y-3">
               <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 ml-1">Naziv Runde</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white font-black outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[10px] uppercase tracking-wider"
                  value={editingMatch.roundName || ''}
                  onChange={(e) => setEditingMatch({...editingMatch, roundName: e.target.value})}
                  placeholder="Npr. Polufinale..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 ml-1">Runda</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white font-black outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[10px]"
                    value={editingMatch.round || 1}
                    onChange={(e) => setEditingMatch({...editingMatch, round: parseInt(e.target.value) || 1})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 ml-1">Index</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white font-black outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[10px]"
                    value={editingMatch.bracketIndex || 0}
                    onChange={(e) => setEditingMatch({...editingMatch, bracketIndex: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              {/* Table Selection */}
              <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 ml-1">Teren</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white font-black outline-none focus:ring-2 focus:ring-blue-500/20 text-[10px] uppercase tracking-wider"
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
              <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 ml-1">Sudija</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white font-black outline-none focus:ring-2 focus:ring-blue-500/20 text-[10px] uppercase tracking-wider"
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
               <div className="pt-2">
                <button 
                  onClick={() => {
                    saveMatchResult(editingMatch);
                    setShowMatchModal(false);
                  }}
                  className="w-full bg-amber-400 hover:bg-amber-500 text-black py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-amber-500/20 active:scale-95"
                >
                  Sačuvaj
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status Selector */}
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-white/5 shrink-0">
                <button 
                  onClick={() => setEditingMatch({...editingMatch, status: 'pending'})}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${editingMatch.status !== 'completed' ? 'bg-amber-400 text-black shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  U toku
                </button>
                <button 
                  onClick={() => setEditingMatch({...editingMatch, status: 'completed'})}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${editingMatch.status === 'completed' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Završen
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className={`flex-1 text-center space-y-1 p-2 rounded-2xl transition-all border ${editingMatch.player1Score >= setsToWin ? 'bg-emerald-500/5 border-emerald-500' : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-white/5'}`}>
                  <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate max-w-[120px] mx-auto">{editingMatch.player1?.name || 'TBD'}</p>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full bg-transparent border-none text-center text-4xl p-0 font-black text-slate-900 dark:text-white outline-none"
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
                <div className="text-xl font-black text-slate-300 dark:text-slate-800">:</div>
                <div className={`flex-1 text-center space-y-1 p-2 rounded-2xl transition-all border ${editingMatch.player2Score >= setsToWin ? 'bg-emerald-500/5 border-emerald-500' : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-white/5'}`}>
                  <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate max-w-[120px] mx-auto">{editingMatch.player2?.name || 'TBD'}</p>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full bg-transparent border-none text-center text-4xl p-0 font-black text-slate-900 dark:text-white outline-none"
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

              {/* Lineup picker - who actually played this match, for team-mode leagues */}
              {(team1Roster?.length > 0 || team2Roster?.length > 0) && (
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-[24px] p-3">
                  <p className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] mb-2 text-center">Ko Je Igrao</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { roster: team1Roster, lineupKey: 'lineup1', name: editingMatch.player1?.name },
                      { roster: team2Roster, lineupKey: 'lineup2', name: editingMatch.player2?.name }
                    ].map((side, sideIdx) => (
                      <div key={sideIdx} className="space-y-1.5">
                        <p className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">{side.name}</p>
                        {(side.roster || []).length === 0 ? (
                          <p className="text-[9px] text-slate-400 dark:text-slate-600 italic">Roster prazan</p>
                        ) : (
                          side.roster.map(p => {
                            const current = editingMatch[side.lineupKey] || [];
                            const checked = current.some(l => l.id === p.id);
                            return (
                              <label key={p.id} className="flex items-center gap-2 text-[10px] text-slate-700 dark:text-slate-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    const next = checked
                                      ? current.filter(l => l.id !== p.id)
                                      : [...current, { id: p.id, name: p.name }];
                                    setEditingMatch({ ...editingMatch, [side.lineupKey]: next });
                                  }}
                                  className="accent-blue-600"
                                />
                                <span className="truncate">{p.name}</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {((editingMatch.player1Score || 0) + (editingMatch.player2Score || 0)) > 0 && (
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-[24px] p-2.5">
                  <p className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] mb-2 text-center">Setovi</p>
                  <div className="space-y-1.5">
                    {Array.from({ length: (editingMatch.player1Score || 0) + (editingMatch.player2Score || 0) }).map((_, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-100 dark:border-white/5">
                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 w-6 pl-1">{idx + 1}</span>
                        <div className="flex items-center gap-1.5 flex-1">
                          <input 
                            type="number"
                            className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-lg p-1.5 text-center font-black text-slate-900 dark:text-white outline-none text-xs"
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
                          <span className="text-slate-200 dark:text-slate-800 font-black text-[10px]">:</span>
                          <input 
                            type="number"
                            className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-lg p-1.5 text-center font-black text-slate-900 dark:text-white outline-none text-xs"
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

              <div className="pt-1">
                <button 
                  onClick={() => {
                    if (validateScore()) {
                      saveMatchResult(editingMatch);
                      setShowMatchModal(false);
                    }
                  }}
                  className="w-full bg-amber-400 hover:bg-amber-500 text-black py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  SAČUVAJ
                </button>
              </div>

              {editingMatch.status === 'completed' && (
                <div className="pt-1 flex justify-center">
                  <ShareResultCard match={editingMatch} />
                </div>
              )}

              {(editingMatch.tableId || editingMatch.refereeId) && (
                <div className="pt-2 flex flex-wrap gap-2 justify-center">
                    {editingMatch.tableId && (
                        <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-[8px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                            TEREN: {tables?.find(t => t.id === editingMatch.tableId)?.name || editingMatch.tableId}
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
    <LiveScoringModal
      show={showLive}
      match={editingMatch}
      onClose={() => setShowLive(false)}
      onScoreUpdate={(fields) => setEditingMatch(prev => ({ ...prev, ...fields }))}
      setsToWin={setsToWin}
    />
    </>
  );
};

export default MatchUpdateModal;
