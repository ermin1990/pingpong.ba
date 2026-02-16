import React from 'react';
import { Trophy, Zap, PlayCircle, AlertTriangle, Users, ChevronRight, Clock, Plus, X, Trash2, CheckCircle, GripVertical, ChevronDown, Layout, ChevronLeft, PanelsTopLeft, LayoutGrid, Star, Edit2, Settings, Minus } from 'lucide-react';

const KnockoutTab = ({ 
  activeCategory, 
  matches, 
  groups, 
  allPlayers,
  calculateStandings,
  setEditingMatch,
  setShowMatchModal,
  handleToggleStage,
  handleGenerateKnockout,
  handleResetKnockout,
  handleUpdateMatchPlayer,
  handleAddManualMatch,
  handleGenerateTemplate,
  generating,
  saveMatchResult,
  handleDeleteMatch,
  handleDeleteAllMatches,
  tables
}) => {
  const seededPlayerIds = activeCategory?.seededPlayerIds || [];
  const [showManualModal, setShowManualModal] = React.useState(false);
  const [showSetupModal, setShowSetupModal] = React.useState(false);
  const [editingPlayerSlot, setEditingPlayerSlot] = React.useState(null); // { matchId, playerSlot }
  const [scale, setScale] = React.useState(1);
  const [showQualifiersSidebar, setShowQualifiersSidebar] = React.useState(true);
  const [manualMatch, setManualMatch] = React.useState({
    player1Id: '',
    player2Id: '',
    roundName: 'Polufinale',
    round: 1
  });

  const isGroupsCompleted = activeCategory?.stages?.groups?.completed || false;
  const isKnockoutCompleted = activeCategory?.stages?.knockout?.completed || false;

  // Izračunaj bazen igrača koji su prošli
  const advancingPool = [];
  if (groups && groups.length > 0) {
    groups.forEach((group, idx) => {
      const standings = calculateStandings(idx);
      const advancingCount = activeCategory.advancingPlayers || 2;
      standings.slice(0, advancingCount).forEach((p, rank) => {
        advancingPool.push({ 
          ...p, 
          fromGroup: String.fromCharCode(64 + (idx + 1)), 
          rank: rank + 1 
        });
      });
    });
  }

  const knockoutMatches = matches.filter(m => m.isKnockout || (m.roundName && !m.groupId));

  // Identifikuj igrače koji su već ubačeni u žrijeb
  const placedPlayerIds = React.useMemo(() => {
    const ids = new Set();
    knockoutMatches.forEach(m => {
      if (m.player1?.id && m.player1.id !== 'tbd') ids.add(m.player1.id);
      if (m.player2?.id && m.player2.id !== 'tbd') ids.add(m.player2.id);
    });
    return ids;
  }, [knockoutMatches]);

  // Alias za kompatibilnost sa starim kodom
  const assignedPlayerIdsInKO = placedPlayerIds;

  const rounds = {};
  knockoutMatches.forEach(m => {
    const rName = m.roundName || `Runda ${m.round}`;
    if (!rounds[rName]) rounds[rName] = [];
    rounds[rName].push(m);
  });

  // Sort rounds internally by bracketIndex to ensure visual flow
  Object.keys(rounds).forEach(rName => {
    rounds[rName].sort((a, b) => (a.bracketIndex || 0) - (b.bracketIndex || 0));
  });

  const roundKeys = Object.keys(rounds).sort((a, b) => {
    // Definisanje ranga rundi za sortiranje (od prve do finala)
    const getRoundWeight = (name) => {
      // Prioritet dajemo broju runde iz samih mečeva ako su isti nazivi
      const rNum = rounds[name][0]?.round || 0;
      
      if (name.includes('Finale') && !name.includes('1/')) return 1000 + rNum;
      if (name.includes('Polufinale')) return 500 + rNum;
      if (name.includes('1/4')) return 250 + rNum;
      if (name.includes('1/8')) return 120 + rNum;
      if (name.includes('Baraž')) return -10 + rNum;
      
      return rNum;
    };
    return getRoundWeight(a) - getRoundWeight(b);
  });

  const knockoutMatchesCount = knockoutMatches.length;

  const suggestedMatches = React.useMemo(() => {
    if (!groups || groups.length < 2) return [];
    const suggestions = [];
    const advancing = [];
    groups.forEach((g, i) => {
        const s = calculateStandings(i);
        const count = activeCategory.advancingPlayers || 2;
        advancing.push(s.slice(0, count));
    });

    // Pairing: Group i Rank 1 vs Group i+1 Rank 2, and Group i+1 Rank 1 vs Group i Rank 2
    // For odd number of groups, last group remains unselected in this simple logic
    for(let i = 0; i < advancing.length - 1; i += 2) {
        const groupA = advancing[i];
        const groupB = advancing[i+1];
        const charA = String.fromCharCode(65 + i);
        const charB = String.fromCharCode(65 + i + 1);

        if (groupA[0] && groupB[1]) {
            suggestions.push({
                p1: groupA[0], p2: groupB[1],
                label: `${charA}1 - ${charB}2`,
                desc: `${groupA[0].name} vs ${groupB[1].name}`
            });
        }
        if (groupB[0] && groupA[1]) {
            suggestions.push({
                p1: groupB[0], p2: groupA[1],
                label: `${charB}1 - ${charA}2`,
                desc: `${groupB[0].name} vs ${groupA[1].name}`
            });
        }
    }
    return suggestions;
  }, [groups, calculateStandings, activeCategory.advancingPlayers]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));

  const onDragStart = (e, player) => {
    e.dataTransfer.setData('player', JSON.stringify(player));
  };

  const onDrop = async (e, matchId, playerSlot) => {
    e.preventDefault();
    try {
      const playerData = e.dataTransfer.getData('player');
      if (!playerData) return;
      
      const player = JSON.parse(playerData);
      if (!player.id || !player.name) return;

      await handleUpdateMatchPlayer(matchId, playerSlot, {
        id: player.id,
        name: player.name
      });
    } catch (err) {
      console.error("Drop error:", err);
    }
  };

  const isSlotReserved = (match, slot) => {
    const prevRound = Number(match.round) - 1;
    if (prevRound < 0) return false;
    
    // Pronađi meč iz prethodne runde koji se "ulijeva" u ovaj slot
    // Slot 1 (player1) dolazi iz bracketIndex * 2
    // Slot 2 (player2) dolazi iz bracketIndex * 2 + 1
    const sourceIndex = (slot === 1) ? match.bracketIndex * 2 : match.bracketIndex * 2 + 1;
    
    return knockoutMatches.some(m => 
      Number(m.round) === prevRound && 
      Number(m.bracketIndex) === sourceIndex
    );
  };

  const onAddManual = async () => {
    // Validacija runda naziva
    if (!manualMatch.roundName) {
      alert('Molimo unesite naziv runde.');
      return;
    }

    const p1 = allPlayers.find(p => p.id === manualMatch.player1Id);
    const p2 = allPlayers.find(p => p.id === manualMatch.player2Id);

    // Ako igrač nije izabran (TBD), kreiramo objekat sa id: 'tbd'
    const player1 = p1 ? { id: p1.id, name: p1.name } : { id: 'tbd', name: 'TBD' };
    const player2 = p2 ? { id: p2.id, name: p2.name } : { id: 'tbd', name: 'TBD' };

    await handleAddManualMatch({
      player1,
      player2,
      roundName: manualMatch.roundName,
      round: parseInt(manualMatch.round) || 1,
      player1Score: 0,
      player2Score: 0,
      status: 'pending',
      isKnockout: true,
      bracketIndex: rounds[manualMatch.roundName]?.length || 0
    });

    setShowManualModal(false);
    setManualMatch({
      player1Id: '',
      player2Id: '',
      roundName: manualMatch.roundName,
      round: manualMatch.round
    });
  };

  const onSelectPlayerForSlot = async (player) => {
    if (!editingPlayerSlot || !player) return;
    try {
      await handleUpdateMatchPlayer(editingPlayerSlot.matchId, editingPlayerSlot.playerSlot, {
        id: player.id,
        name: player.name
      });
      setEditingPlayerSlot(null);
    } catch (err) {
      console.error("Selection error:", err);
    }
  };

  // Pobjednici iz prethodnih rundi za lakši ručni odabir
  const roundWinners = React.useMemo(() => {
    const winners = [];
    knockoutMatches.forEach(m => {
      if (m.status === 'completed') {
        const winner = m.player1Score > m.player2Score ? m.player1 : m.player2;
        if (winner && winner.id && winner.id !== 'tbd') {
          winners.push({
            ...winner,
            fromRound: m.roundName || `Runda ${m.round}`,
            matchId: m.id
          });
        }
      }
    });
    return winners;
  }, [knockoutMatches]);

  // Logika za prevenciju "Praznog Ekrana" - Debug ispis
  console.log("🏆 Knockout Tab Render:", {
    hasCategory: !!activeCategory,
    format: activeCategory?.format,
    matchesCount: knockoutMatchesCount,
    roundsCount: roundKeys.length,
    roundNames: roundKeys
  });

  // NIKADA ne vraćaj null - uvijek prikaži nešto
  if (!activeCategory) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 rounded-lg flex items-center justify-center mx-auto mb-6 text-amber-500 border border-amber-100 dark:border-amber-500/20">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Kategorija nije učitana</h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium max-w-sm mx-auto">
          Provjerite da li ste odabrali kategoriju iz liste. Ako problem i dalje postoji, osvježite stranicu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Eliminaciona Faza - Knockout</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Upravljajte žrijebom, generišite šeme i pratite put do finala
            </p>
          </div>
          <div className="flex gap-2">
            {!isKnockoutCompleted && knockoutMatches.length > 0 && (
              <button 
                onClick={() => handleToggleStage('knockout', true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <CheckCircle size={14} /> Završi Turnir
              </button>
            )}
            {isKnockoutCompleted && (
              <button 
                onClick={() => handleToggleStage('knockout', false)}
                className="bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95"
              >
                Ponovo otvori
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 pb-20">
        {/* Pool of Players Sidebar - FIKSNI (kontrolisan preko dugeta) */}
        {advancingPool.length > 0 && knockoutMatches.length > 0 && showQualifiersSidebar && (
          <div className="w-full lg:w-72 space-y-4 shrink-0">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sticky top-24 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                  <Users size={14} className="text-blue-500" /> Kvalifikovani
                </h4>
                <button 
                  onClick={() => setShowQualifiersSidebar(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-400 hover:text-red-500 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Fill Remaining Button */}
              {advancingPool.some(p => !placedPlayerIds.has(p.id)) && (
                <button 
                  onClick={async () => {
                    const unassigned = advancingPool.filter(p => !placedPlayerIds.has(p.id));
                    const firstRoundMatches = knockoutMatches.filter(m => m.round === 1).sort((a,b) => a.bracketIndex - b.bracketIndex);
                    
                    let pIdx = 0;
                    for (const m of firstRoundMatches) {
                      if (pIdx >= unassigned.length) break;
                      if (m.player1?.id === 'tbd' || !m.player1) {
                        await handleUpdateMatchPlayer(m.id, 1, unassigned[pIdx++]);
                      }
                      if (pIdx < unassigned.length && (m.player2?.id === 'tbd' || !m.player2)) {
                        await handleUpdateMatchPlayer(m.id, 2, unassigned[pIdx++]);
                      }
                    }
                  }}
                  className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                  <Zap size={12} /> Popuni Prazna Polja
                </button>
              )}

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {advancingPool.map(player => {
                const isAssigned = assignedPlayerIdsInKO.has(player.id);
                return (
                  <div 
                    key={player.id}
                    draggable={!isAssigned}
                    onDragStart={(e) => onDragStart(e, player)}
                    className={`p-3 rounded-2xl border transition-all ${isAssigned ? 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-900 opacity-40 grayscale pointer-events-none' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-blue-500 shadow-sm cursor-grab active:cursor-grabbing'}`}
                  >
                    <div className="flex items-center justify-between pointer-events-none">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider truncate">{player.name}</p>
                          {seededPlayerIds.includes(player.id) && (
                            <Star size={10} className="text-amber-500 fill-amber-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest underline decoration-2 underline-offset-2">Grupa {player.fromGroup}</span>
                           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">#{player.rank} mjesto</span>
                        </div>
                      </div>
                      {isAssigned && <CheckCircle size={14} className="text-emerald-500 shrink-0 ml-2" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 space-y-6 min-w-0">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-slate-950 rounded-xl text-blue-500">
              <Trophy size={20} />
            </div>
            <div>
              <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Knockout Šema</h3>
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest leading-none">{knockoutMatchesCount} mečeva u žrijebu</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {knockoutMatchesCount > 0 && (
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 mr-2">
                <button onClick={handleZoomOut} className="w-8 h-8 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all text-slate-600 dark:text-slate-400"><ChevronLeft size={16} /></button>
                <div className="px-3 py-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 border-x border-slate-200 dark:border-slate-800 uppercase tracking-widest">{Math.round(scale * 100)}%</div>
                <button onClick={handleZoomIn} className="w-8 h-8 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all text-slate-600 dark:text-slate-400"><ChevronRight size={16} /></button>
              </div>
            )}
            
            {!showQualifiersSidebar && advancingPool.length > 0 && (
              <button 
                onClick={() => setShowQualifiersSidebar(true)}
                className="bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-blue-500 transition-all flex items-center gap-2 shadow-sm active:scale-95"
              >
                <Users size={14} /> Igrači
              </button>
            )}
            
            <button 
              onClick={() => setShowSetupModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <Plus size={14} /> Kreiraj Žrijeb
            </button>
            
            {knockoutMatchesCount > 0 && (
              <button 
                onClick={handleResetKnockout}
                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95"
              >
                <Trash2 size={14} /> Resetuj
              </button>
            )}
          </div>
        </div>

        {activeCategory.format !== 'groups_knockout' ? (
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center backdrop-blur-xl shadow-sm dark:shadow-none">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-6 text-slate-400 dark:text-slate-600 border border-slate-100 dark:border-transparent">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">Format nije podržan</h3>
            <p className="text-slate-500 dark:text-slate-500 text-xs font-bold uppercase tracking-widest max-w-sm mx-auto">
              Eliminaciona faza je dostupna samo za "Grupe + Knockout" format takmičenja. Trenutni format: <span className="text-blue-600 dark:text-blue-400 font-black">{activeCategory.format}</span>
            </p>
          </div>
        ) : knockoutMatchesCount === 0 ? (
          <div className="space-y-6">
            {!isGroupsCompleted ? (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-lg p-8 flex items-center gap-6 shadow-sm dark:shadow-none">
                <div className="w-12 h-12 bg-amber-500/10 dark:bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-500 shrink-0 border border-amber-200 dark:border-transparent">
                  <Clock size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="text-slate-900 dark:text-white font-black uppercase italic tracking-tighter text-sm">Grupna faza još traje</h4>
                  <p className="text-slate-500 dark:text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-1">
                    Morate označiti grupnu fazu kao završenu u postavkama kako biste generisali knockout žrijeb.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-6 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                  <Zap size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Grupna faza završena!</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium max-w-sm mx-auto mb-6">
                  Izaberite način formiranja eliminacione faze. Sistem može automatski generisati parove ili ih možete dodati ručno.
                </p>

                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4 mb-8 max-w-md mx-auto">
                    <div className="flex items-center justify-around gap-4">
                        <div className="text-center flex-1">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Kvalifikovanih</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{advancingPool.length}</p>
                        </div>
                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800"></div>
                        <div className="text-center flex-1">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Preporuka</p>
                            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase leading-none">
                                {(() => {
                                    const count = advancingPool.length;
                                    if (count <= 2) return "Finale";
                                    if (count <= 4) return "1/2 Finale";
                                    if (count <= 8) return "1/4 Finale";
                                    if (count <= 16) return "1/8 Finale";
                                    if (count <= 32) return "1/16 Finale";
                                    return "1/32 Finale";
                                })()}
                            </p>
                        </div>
                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800"></div>
                        <div className="text-center flex-1">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Status</p>
                            <div className="flex flex-col items-center">
                                <p className={`text-[10px] font-bold uppercase leading-none ${advancingPool.length % 2 === 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-amber-600 dark:text-amber-500'}`}>
                                    {advancingPool.length % 2 === 0 ? 'Paran Broj' : 'Neparan Broj'}
                                </p>
                                {(() => {
                                    const count = advancingPool.length;
                                    let p2 = 2;
                                    while(p2 * 2 <= count) p2 *= 2;
                                    if (count > 2 && count !== p2) {
                                        return <span className="text-[8px] bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-500 px-1.5 py-0.5 rounded mt-1 font-bold border border-amber-200 dark:border-amber-500/30">Preporučen Baraž</span>
                                    }
                                    return null;
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm mx-auto">
                  <button 
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    onClick={handleGenerateKnockout}
                    disabled={generating}
                  >
                    <Zap size={16} /> {generating ? 'Generisanje...' : 'Automatski'}
                  </button>
                  
                  <button 
                    className="w-full bg-white dark:bg-slate-800 text-slate-700 dark:text-white px-6 py-3 rounded-lg font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
                    onClick={() => setShowSetupModal(true)}
                  >
                    <Plus size={16} /> Manuelno
                  </button>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group, idx) => {
                const standings = calculateStandings(idx);
                const advancingCount = activeCategory.advancingPlayers || 2;
                const advancing = standings.slice(0, advancingCount);
                
                return (
                  <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Grupa {String.fromCharCode(65 + idx)}</h4>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-500/20">Prolaze {advancingCount}</span>
                    </div>
                    <div className="space-y-2">
                        {advancing.map((p, pIdx) => (
                          <div 
                            key={p.id} 
                            draggable
                            onDragStart={(e) => onDragStart(e, p)}
                            className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 cursor-grab active:cursor-grabbing hover:border-blue-500/50 transition-colors group"
                          >
                            <span className="text-xs font-bold text-slate-400 w-4">{pIdx + 1}.</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</p>
                                {seededPlayerIds.includes(p.id) && (
                                  <Star size={12} className="text-amber-500 fill-amber-500" />
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase">{p.club || 'Bez kluba'}</p>
                            </div>
                            <GripVertical size={14} className="text-slate-300 dark:text-slate-700 group-hover:text-blue-500/50 transition-colors" />
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
              <div className="overflow-x-auto custom-scrollbar pt-10 pb-8 px-4">
                <div 
                  className="w-full flex justify-start gap-8 py-6"
                >
                  {roundKeys.map((rName) => (
                    <div key={rName} className="flex flex-col min-w-[280px] flex-1">
                      <div className="text-left mb-6 flex flex-col items-start gap-1 pl-4">
                        <h4 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-[0.15em] border-l-4 border-blue-600 pl-3 py-1 bg-slate-50 dark:bg-slate-800/50 pr-6 rounded-r-lg">
                          {rName}
                        </h4>
                        <button
                          onClick={() => {
                            if (window.confirm(`Da li ste sigurni da želite obrisati SVE mečeve iz faze: ${rName}?`)) {
                              const matchIds = rounds[rName].map(m => m.id);
                              handleDeleteAllMatches(matchIds);
                            }
                          }}
                          className="text-[8px] font-black text-red-500/30 hover:text-red-600 uppercase tracking-widest flex items-center gap-1 transition-colors pl-3"
                          title={`Obriši sve mečeve iz faze ${rName}`}
                        >
                          <Trash2 size={9} /> Resetuj
                        </button>
                      </div>
                      
                      <div className="flex flex-col justify-around gap-4 flex-1">
                        {rounds[rName].map((match) => {
                          const p1Winner = match.status === 'completed' && match.player1Score > match.player2Score;
                          const p2Winner = match.status === 'completed' && match.player2Score > match.player1Score;

                          const isMatchReady = match.player1?.id && match.player2?.id && match.player1.id !== 'tbd' && match.player2.id !== 'tbd';
                          const isP1Real = match.player1?.id && match.player1.id !== 'tbd';
                          const isP2Real = match.player2?.id && match.player2.id !== 'tbd';
                          // Dozlovi walkover ako imamo jednog pravog igrača a drugi je TBD ili undefined, a meč nije završen
                          const isWalkoverPossible = match.status !== 'completed' && ((isP1Real && !isP2Real) || (!isP1Real && isP2Real));

                          return (
                            <div 
                              key={match.id} 
                              className={`group/card relative bg-white dark:bg-slate-950 border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 w-64 flex flex-col ${match.status === 'in_progress' ? 'border-blue-600 ring-4 ring-blue-500/10' : 'border-slate-200 dark:border-slate-800'}`}
                            >
                              {/* Live indicator for admin view */}
                              {match.status === 'in_progress' && (
                                <div className="absolute top-0 right-0 z-10">
                                   <div className="bg-blue-600 text-[8px] font-black text-white px-2 py-0.5 rounded-bl-xl shadow-lg animate-pulse flex items-center gap-1">
                                      <div className="w-1 h-1 rounded-full bg-white"></div>
                                      UŽIVO
                                   </div>
                                </div>
                              )}

                              {/* Player 1 Row */}
                              <div 
                                className={`flex items-center justify-between px-3 py-3 flex-1 group/p1 transition-colors border-b border-white/5 ${p1Winner ? 'bg-emerald-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.dataTransfer.dropEffect = 'copy';
                                }}
                                onDrop={(e) => onDrop(e, match.id, 1)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPlayerSlot({ matchId: match.id, playerSlot: 1 });
                                }}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className={`w-1.5 h-1.5 rounded-full ${p1Winner ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-400 dark:bg-slate-800'}`}></div>
                                  <div className="flex flex-col truncate group/name relative flex-1">
                                    <div className={`text-[11px] font-black truncate transition-colors flex items-center gap-1.5 uppercase tracking-wider ${p1Winner ? 'text-emerald-500' : 'text-slate-900 dark:text-slate-200'}`}>
                                      {match.player1?.name || (
                                        isSlotReserved(match, 1) ? (
                                          <span className="text-slate-500 text-[9px] italic font-bold">Pobjednik...</span>
                                        ) : (
                                          <span className="text-slate-600 dark:text-slate-700 text-[9px]">Prazno...</span>
                                        )
                                      )}
                                      {match.player1?.id && seededPlayerIds.includes(match.player1.id) && (
                                        <Star size={10} className="text-amber-500 fill-amber-500" />
                                      )}
                                    </div>
                                    {match.player1?.id && match.player1.id !== 'tbd' && (
                                       <span className="text-[8px] text-slate-500 dark:text-slate-400 font-bold uppercase truncate leading-tight tracking-widest mt-0.5">
                                          {allPlayers.find(p => p.id === match.player1.id)?.club || 'Individual' }
                                       </span>
                                    )}
                                  </div>
                                </div>

                                {/* Player 1 Score & Sets */}
                                <div className="flex items-center gap-2 ml-4">
                                  <div className={`w-8 h-8 flex items-center justify-center rounded-xl text-[11px] font-black transition-all ${p1Winner ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-slate-50 dark:bg-slate-950 text-slate-400'}`}>
                                    {match.player1Score ?? 0}
                                  </div>
                                </div>
                              </div>

                              {/* Player 2 Row */}
                              <div 
                                className={`flex items-center justify-between px-3 py-3 flex-1 group/p2 transition-colors ${p2Winner ? 'bg-emerald-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.dataTransfer.dropEffect = 'copy';
                                }}
                                onDrop={(e) => onDrop(e, match.id, 2)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPlayerSlot({ matchId: match.id, playerSlot: 2 });
                                }}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div className={`w-2 h-2 rounded-full ${p2Winner ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                                  <div className="flex flex-col truncate group/name relative flex-1">
                                    <div className={`text-[11px] font-black truncate transition-colors flex items-center gap-1.5 uppercase tracking-wider ${p2Winner ? 'text-emerald-500' : 'text-slate-900 dark:text-slate-200'}`}>
                                      {match.player2?.name || (
                                        isSlotReserved(match, 2) ? (
                                          <span className="text-slate-500 text-[9px] italic font-bold">Pobjednik...</span>
                                        ) : (
                                          <span className="text-slate-600 dark:text-slate-700 text-[9px]">Prazno...</span>
                                        )
                                      )}
                                      {match.player2?.id && seededPlayerIds.includes(match.player2.id) && (
                                        <Star size={11} className="text-amber-500 fill-amber-500" />
                                      )}
                                    </div>
                                    {match.player2?.id && match.player2.id !== 'tbd' && (
                                       <span className="text-[8px] text-slate-500 dark:text-slate-400 font-bold uppercase truncate leading-tight tracking-widest mt-0.5">
                                          {allPlayers.find(p => p.id === match.player2.id)?.club || 'Individual' }
                                       </span>
                                    )}
                                  </div>
                                </div>

                                {/* Player 2 Score & Sets */}
                                <div className="flex items-center gap-2 ml-4">
                                  <div className={`w-8 h-8 flex items-center justify-center rounded-xl text-[11px] font-black transition-all ${p2Winner ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-slate-50 dark:bg-slate-950 text-slate-400'}`}>
                                    {match.player2Score ?? 0}
                                  </div>
                                </div>
                              </div>

                              {/* Floating Actions Overlay */}
                              <div className="absolute inset-0 bg-blue-600/25 items-center justify-center hidden group-hover/card:flex z-10 transition-all rounded-3xl">
                                 <button 
                                    className="bg-white text-blue-600 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                                    onClick={(e) => { 
                                        e.stopPropagation();
                                        setEditingMatch(match); 
                                        setShowMatchModal(true); 
                                    }}
                                  >
                                    Unesi rezultat
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if(confirm("Obrisati ovaj meč iz žrijeba?")) {
                                        handleDeleteMatch(match.id);
                                      }
                                    }}
                                    className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-lg"
                                    title="Obriši"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          </div>
        )}
      </div>

      {/* Manual Match Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 dark:bg-black/90 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900/50">
              <h3 className="text-slate-900 dark:text-white font-bold text-lg">Ručno kreiranje meča</h3>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {suggestedMatches.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Prijedlozi na osnovu grupa</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {suggestedMatches.map((s, idx) => {
                      const isUsed = placedPlayerIds.has(s.p1.id) || placedPlayerIds.has(s.p2.id);
                      return (
                        <button 
                          key={idx}
                          disabled={isUsed}
                          onClick={() => {
                            setManualMatch({
                              ...manualMatch,
                              player1Id: s.p1.id,
                              player2Id: s.p2.id
                            });
                          }}
                          className={`flex flex-col p-3 rounded-lg border text-left transition-all ${isUsed ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 opacity-20' : 'bg-blue-50 dark:bg-blue-500/5 border-blue-100 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/10'}`}
                        >
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">{s.label}</span>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium uppercase truncate">{s.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                {/* Player 1 Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Igrač 1</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                    value={manualMatch.player1Id}
                    onChange={(e) => setManualMatch({...manualMatch, player1Id: e.target.value})}
                  >
                    <option value="">Izaberi igrača</option>
                    {allPlayers.map(p => (
                      <option key={p.id} value={p.id} className="dark:bg-slate-950 font-bold">{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Player 2 Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Igrač 2</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                    value={manualMatch.player2Id}
                    onChange={(e) => setManualMatch({...manualMatch, player2Id: e.target.value})}
                  >
                    <option value="">Izaberi igrača</option>
                    {allPlayers.map(p => (
                      <option key={p.id} value={p.id} className="dark:bg-slate-950 font-bold">{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Naziv runde</label>
                  <input 
                    type="text" 
                    placeholder="Npr. Polufinale"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                    value={manualMatch.roundName}
                    onChange={(e) => setManualMatch({...manualMatch, roundName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Redni broj runde</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                    value={manualMatch.round}
                    onChange={(e) => setManualMatch({...manualMatch, round: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={onAddManual}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30"
                >
                  Kreiraj Meč
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingPlayerSlot && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 dark:bg-black/90 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-lg overflow-hidden shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900/50">
              <div>
                <h3 className="text-slate-900 dark:text-white font-bold text-lg">Izaberi Igrača</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Izaberi učesnika za poziciju {editingPlayerSlot.playerSlot}</p>
              </div>
              <button onClick={() => setEditingPlayerSlot(null)} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-4 overflow-y-auto">
              <div className="mb-4">
                  {(() => {
                    const match = matches.find(m => m.id === editingPlayerSlot.matchId);
                    const currentPlayer = match?.[editingPlayerSlot.playerSlot === 1 ? 'player1' : 'player2'];
                    const hasPlayer = currentPlayer && currentPlayer.id && currentPlayer.id !== 'tbd';

                    if (hasPlayer) {
                      return (
                        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 mb-4 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mb-1">Trenutni igrač</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{currentPlayer.name}</p>
                            </div>
                            <button 
                                onClick={() => onSelectPlayerForSlot({ id: 'tbd', name: 'TBD' })}
                                className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg transition-colors shadow-sm shadow-red-600/20"
                                title="Ukloni igrača (Resetuj na TBD)"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                      );
                    }
                    return null;
                  })()}
              </div>

               <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => onSelectPlayerForSlot({ id: 'tbd', name: 'TBD' })}
                    className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-800 transition-all text-left group"
                  >
                    <div className="w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-400">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">TBD</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Pozicija će biti naknadno određena</p>
                    </div>
                  </button>

                  {roundWinners.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 mt-4 mb-2">
                        <Trophy size={14} className="text-amber-500" />
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pobjednici prošlih mečeva</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {roundWinners.map(player => (
                          <button 
                            key={`winner-${player.id}-${player.matchId}`}
                            onClick={() => onSelectPlayerForSlot(player)}
                            className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all text-left group"
                          >
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                              {player.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{player.name}</p>
                              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium uppercase">Pobjednik iz: {player.fromRound}</p>
                            </div>
                            <ChevronRight size={16} className="text-blue-300 group-hover:text-blue-600 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Kvalifikovani iz grupa - za Runda 1 ili Baraž (0) */}
                  {(() => {
                    const currentMatch = matches.find(m => m.id === editingPlayerSlot.matchId);
                    if (currentMatch?.round === 1 || currentMatch?.round === 0) {
                        const advancingFromGroups = [];
                        groups.forEach((group, idx) => {
                          const standings = calculateStandings(idx);
                          const advancingCount = activeCategory.advancingPlayers || 2;
                          standings.slice(0, advancingCount).forEach(p => {
                            advancingFromGroups.push({...p, fromGroup: String.fromCharCode(65 + idx)});
                          });
                        });
                        
                        if (advancingFromGroups.length > 0) {
                          return (
                            <>
                              <div className="flex items-center gap-2 mt-6 mb-2">
                                <Zap size={14} className="text-emerald-500" />
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Kvalifikovani iz grupa</span>
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                {advancingFromGroups.map(player => (
                                  <button 
                                    key={`group-${player.id}`}
                                    onClick={() => onSelectPlayerForSlot(player)}
                                    className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 p-3 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-all text-left"
                                  >
                                    <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                                      {player.fromGroup}
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-bold text-slate-900 dark:text-white">{player.name}</p>
                                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium uppercase">Grupa {player.fromGroup}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </>
                          );
                        }
                    }
                    return null;
                  })()}

                  <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <details className="group">
                      <summary className="flex items-center justify-between cursor-pointer list-none">
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Svi registrovani igrači (Napredno)</span>
                        </div>
                        <ChevronDown size={14} className="text-slate-400 group-open:rotate-180 transition-transform" />
                      </summary>
                      <div className="grid grid-cols-1 gap-2 mt-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {allPlayers.map(player => (
                          <button 
                            key={player.id}
                            onClick={() => onSelectPlayerForSlot(player)}
                            className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg hover:border-blue-400 transition-all text-left shadow-sm"
                          >
                            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                              {player.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{player.name}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase">{player.club || 'Bez kluba'}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </details>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default KnockoutTab;
