import React from 'react';
import { Trophy, Zap, PlayCircle, AlertTriangle, Users, ChevronRight, Clock, Plus, X, Trash2, CheckCircle, GripVertical, ChevronDown, Layout, ChevronLeft, PanelsTopLeft, LayoutGrid } from 'lucide-react';

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
  generating
}) => {
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

  const roundKeys = Object.keys(rounds).sort((a, b) => {
    // Definisanje ranga rundi za sortiranje (od prve do finala)
    const getRoundWeight = (name) => {
      // Prioritet dajemo broju runde iz samih mečeva ako su isti nazivi
      const rNum = rounds[name][0]?.round || 0;
      
      if (name.includes('Finale') && !name.includes('1/')) return 1000 + rNum;
      if (name.includes('Polufinale')) return 500 + rNum;
      if (name.includes('1/4')) return 250 + rNum;
      if (name.includes('1/8')) return 120 + rNum;
      
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

  const onAddManual = async () => {
    const p1 = allPlayers.find(p => p.id === manualMatch.player1Id);
    const p2 = allPlayers.find(p => p.id === manualMatch.player2Id);
    
    if (!p1 || !p2) {
      alert("Izaberite oba igrača.");
      return;
    }

    await handleAddManualMatch({
      player1: { id: p1.id, name: p1.name },
      player2: { id: p2.id, name: p2.name },
      roundName: manualMatch.roundName,
      round: Number(manualMatch.round)
    });
    setShowManualModal(false);
    setManualMatch({ player1Id: '', player2Id: '', roundName: 'Polufinale', round: 1 });
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
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center backdrop-blur-xl">
        <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-500">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">Kategorija nije učitana</h3>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-sm mx-auto">
          Provjerite da li ste odabrali kategoriju iz liste. Ako problem i dalje postoji, osvježite stranicu.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-20">
      {/* Pool of Players Sidebar - FIKSNI (kontrolisan preko dugmeta) */}
      {advancingPool.length > 0 && knockoutMatches.length > 0 && showQualifiersSidebar && (
        <div className="w-full lg:w-72 space-y-4 shrink-0">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sticky top-24 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                <Users size={14} className="text-blue-500" /> Kvalifikovani
              </h4>
              <button 
                onClick={() => setShowQualifiersSidebar(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {advancingPool.map(player => {
                const isAssigned = assignedPlayerIdsInKO.has(player.id);
                return (
                  <div 
                    key={player.id}
                    draggable={!isAssigned}
                    onDragStart={(e) => onDragStart(e, player)}
                    className={`p-3 rounded-2xl border transition-all ${isAssigned ? 'bg-slate-900/20 border-slate-800/50 opacity-40 grayscale pointer-events-none' : 'bg-slate-950 border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 shadow-lg cursor-grab active:cursor-grabbing hover:scale-[1.02]'}`}
                  >
                    <div className="flex items-center justify-between pointer-events-none">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black text-white uppercase truncate">{player.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[8px] font-bold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded uppercase">Grupa {player.fromGroup}</span>
                           <span className="text-[8px] font-bold text-slate-500 italic">#{player.rank}</span>
                        </div>
                      </div>
                      {isAssigned && <CheckCircle size={14} className="text-emerald-500 shrink-0 ml-2" />}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-6 leading-relaxed italic border-t border-slate-800/50 pt-4 text-center">
               Kliknite na meč da dodijelite slobodne igrače iz ovog bazena.
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 space-y-8 min-w-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {knockoutMatches.length > 0 && (
              <>
                <button 
                  onClick={() => setShowQualifiersSidebar(!showQualifiersSidebar)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${showQualifiersSidebar ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  title={showQualifiersSidebar ? "Sakrij listu kvalifikovanih" : "Prikaži listu kvalifikovanih"}
                >
                  <Users size={14} /> {showQualifiersSidebar ? 'Sakrij Kvalifikovane' : 'Lista Kvalifikovanih'}
                </button>

                <button 
                  onClick={() => handleToggleStage('knockout', !isKnockoutCompleted)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    isKnockoutCompleted 
                    ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20'
                  }`}
                >
                  {isKnockoutCompleted ? <CheckCircle size={14} /> : <Trophy size={14} />}
                  {isKnockoutCompleted ? 'Takmičenje Završeno' : 'Završi Takmičenje'}
                </button>

                <div className="w-px h-6 bg-slate-800 mx-1 hidden sm:block"></div>

                <button 
                  onClick={handleResetKnockout}
                  className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  <Trash2 size={14} /> Resetuj
                </button>
              </>
            )}
            <button 
              onClick={() => setShowManualModal(true)}
              className="bg-slate-800 text-slate-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center gap-2"
            >
              <Plus size={14} /> Dodaj Meč
            </button>
          </div>
        </div>

        {activeCategory.format !== 'groups_knockout' ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center backdrop-blur-xl">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-600">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">Format nije podržan</h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-sm mx-auto">
              Eliminaciona faza je dostupna samo za "Grupe + Knockout" format takmičenja. Trenutni format: <span className="text-blue-400">{activeCategory.format}</span>
            </p>
          </div>
        ) : knockoutMatchesCount === 0 ? (
          <div className="space-y-6">
            {!isGroupsCompleted ? (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-8 flex items-center gap-6">
                <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
                  <Clock size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-black uppercase italic tracking-tighter text-sm">Grupna faza još traje</h4>
                  <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-1">
                    Morate označiti grupnu fazu kao završenu u postavkama kako biste generisali knockout žrijeb.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center backdrop-blur-xl">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-500">
                  <Zap size={32} />
                </div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">Grupna faza završena!</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-sm mx-auto mb-8">
                  Izaberite način formiranja eliminacione faze. Sistem može automatski generisati parove ili ih možete dodati ručno.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm mx-auto">
                  <button 
                    className="w-full bg-white text-slate-900 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 hover:text-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                    onClick={handleGenerateKnockout}
                    disabled={generating}
                  >
                    <Zap size={16} /> {generating ? 'Generisanje...' : 'Automatski'}
                  </button>
                  
                  <button 
                    className="w-full bg-slate-800 text-slate-300 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-700 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                    onClick={() => setShowSetupModal(true)}
                  >
                    <Plus size={16} /> Manuelno
                  </button>
                </div>
              </div>
            )}
            
            {/* Preview of qualifying players */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group, idx) => {
                const standings = calculateStandings(idx);
                const advancingCount = activeCategory.advancingPlayers || 2;
                const advancing = standings.slice(0, advancingCount);
                
                return (
                  <div key={idx} className="bg-slate-900/20 border border-slate-800/50 rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Grupa {String.fromCharCode(65 + idx)}</h4>
                      <span className="text-[8px] font-bold text-emerald-500 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full">Prolaze {advancingCount}</span>
                    </div>
                    <div className="space-y-2">
                        {advancing.map((p, pIdx) => (
                          <div 
                            key={p.id} 
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('player', JSON.stringify({ id: p.id, name: p.name }));
                            }}
                            className="flex items-center gap-3 bg-slate-950/40 p-2 rounded-xl border border-slate-800/50 cursor-grab active:cursor-grabbing hover:border-emerald-500/30 transition-colors group"
                          >
                            <span className="text-[10px] font-black text-emerald-500 w-4">{pIdx + 1}.</span>
                            <div className="flex-1">
                              <p className="text-[11px] font-bold text-white uppercase">{p.name}</p>
                              <p className="text-[8px] text-slate-600 font-bold uppercase">{p.club || 'Bez kluba'}</p>
                            </div>
                            <GripVertical size={12} className="text-slate-800 group-hover:text-emerald-500/50 transition-colors" />
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-4 md:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
            {/* Zoom Controls Overlay */}
              <div className="absolute right-6 top-6 z-10 flex items-center gap-2">
                <button 
                  onClick={handleZoomOut}
                  className="w-10 h-10 flex items-center justify-center bg-slate-950 border border-slate-800 text-white rounded-xl hover:bg-slate-800 font-bold transition-all shadow-xl"
                  title="Smanji"
                >
                  −
                </button>
                <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 text-[10px] font-black text-slate-500 min-w-[60px] text-center">
                  {Math.round(scale * 100)}%
                </div>
                <button 
                  onClick={handleZoomIn}
                  className="w-10 h-10 flex items-center justify-center bg-slate-950 border border-slate-800 text-white rounded-xl hover:bg-slate-800 font-bold transition-all shadow-xl"
                  title="Povećaj"
                >
                  +
                </button>
              </div>

              <div className="overflow-x-auto custom-scrollbar pb-8 pt-12">
                <div 
                  className="min-w-max transition-transform duration-300 origin-top-left flex justify-center gap-12 px-4"
                  style={{ transform: `scale(${scale})` }}
                >
                  {roundKeys.map((rName) => (
                    <div key={rName} className="flex flex-col min-w-[240px]">
                      <div className="text-center mb-8">
                        <h4 className="text-xs font-black text-white uppercase italic tracking-widest border-b border-blue-500/30 pb-2 inline-block px-4">
                          {rName}
                        </h4>
                      </div>
                      
                      <div className="flex flex-col justify-around gap-6 flex-1">
                        {rounds[rName].map((match) => {
                          const p1Winner = match.status === 'completed' && match.player1Score > match.player2Score;
                          const p2Winner = match.status === 'completed' && match.player2Score > match.player1Score;

                          const isMatchReady = match.player1?.id && match.player2?.id && match.player1.id !== 'tbd' && match.player2.id !== 'tbd';

                          return (
                            <div 
                              key={match.id}
                              className={`group relative bg-slate-950 hover:bg-slate-900/80 rounded-2xl border transition-all duration-300 hover:scale-[1.05] shadow-lg cursor-pointer flex flex-col overflow-hidden ${isMatchReady ? 'border-slate-800 hover:border-blue-500/50' : 'border-dashed border-slate-700 hover:border-slate-500'}`}
                              style={{ minHeight: '100px' }}
                              onClick={() => {
                                if (!isMatchReady) {
                                  // Ako meč nije spreman, klik na bilo koji dio kartice otvara biranje prvog slobodnog slota
                                  const slot = (!match.player1?.id || match.player1.id === 'tbd') ? 1 : 2;
                                  setEditingPlayerSlot({ matchId: match.id, playerSlot: slot });
                                }
                              }}
                            >
                              {/* Player 1 Row */}
                              <div 
                                className="flex items-center justify-between p-3 flex-1 group/p1 border-b border-slate-800/50 hover:bg-blue-500/5 transition-colors"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => onDrop(e, match.id, 1)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPlayerSlot({ matchId: match.id, playerSlot: 1 });
                                }}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className={`w-1.5 h-1.5 rounded-full ${p1Winner ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-800'}`}></div>
                                  <div className={`text-[11px] font-black uppercase truncate transition-colors ${p1Winner ? 'text-emerald-500' : 'text-slate-400 group-hover/p1:text-blue-400'}`}>
                                    {match.player1?.name || (
                                      <span className="text-slate-700 animate-pulse text-[9px]">Prevucite igrača...</span>
                                    )}
                                  </div>
                                </div>
                                <div className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-black transition-all ${p1Winner ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500 group-hover/p1:bg-slate-700'}`}>
                                  {match.player1Score ?? 0}
                                </div>
                              </div>

                              {/* Player 2 Row */}
                              <div 
                                className="flex items-center justify-between p-3 flex-1 group/p2 hover:bg-blue-500/5 transition-colors"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => onDrop(e, match.id, 2)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPlayerSlot({ matchId: match.id, playerSlot: 2 });
                                }}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className={`w-1.5 h-1.5 rounded-full ${p2Winner ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-800'}`}></div>
                                  <div className={`text-[11px] font-black uppercase truncate transition-colors ${p2Winner ? 'text-emerald-500' : 'text-slate-400 group-hover/p2:text-blue-400'}`}>
                                    {match.player2?.name || (
                                      <span className="text-slate-700 animate-pulse text-[9px]">Prevucite igrača...</span>
                                    )}
                                  </div>
                                </div>
                                <div className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-black transition-all ${p2Winner ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500 group-hover/p2:bg-slate-700'}`}>
                                  {match.player2Score ?? 0}
                                </div>
                              </div>

                              {/* Quick View Results Button Overlay - ONLY show if both players are present */}
                              {isMatchReady && (
                                <div 
                                  className="absolute inset-x-0 bottom-0 top-0 opacity-0 group-hover:opacity-100 bg-blue-600/10 flex items-center justify-center transition-opacity z-10"
                                  onClick={(e) => { 
                                    e.stopPropagation();
                                    setEditingMatch(match); 
                                    setShowMatchModal(true); 
                                  }}
                                >
                                  <div className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-tighter shadow-lg translate-y-8 group-hover:translate-y-0 transition-transform flex items-center gap-1.5">
                                    <PlayCircle size={10} /> Unos Rezultata
                                  </div>
                                </div>
                              )}
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-white font-black uppercase italic tracking-tighter text-lg">Ručno kreiranje meča</h3>
              <button onClick={() => setShowManualModal(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {suggestedMatches.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-blue-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Prijedlozi na osnovu grupa</span>
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
                          className={`flex flex-col p-3 rounded-xl border text-left transition-all ${isUsed ? 'bg-slate-900/40 border-slate-800 opacity-20' : 'bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10'}`}
                        >
                          <span className="text-[10px] font-black text-blue-400 uppercase">{s.label}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase truncate">{s.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                {/* Player 1 Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Igrač 1</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500 transition-all cursor-pointer"
                    value={manualMatch.player1Id}
                    onChange={(e) => setManualMatch({...manualMatch, player1Id: e.target.value})}
                  >
                    <option value="">Izaberi igrača</option>
                    {allPlayers.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Player 2 Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Igrač 2</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500 transition-all cursor-pointer"
                    value={manualMatch.player2Id}
                    onChange={(e) => setManualMatch({...manualMatch, player2Id: e.target.value})}
                  >
                    <option value="">Izaberi igrača</option>
                    {allPlayers.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Naziv runde</label>
                  <input 
                    type="text" 
                    placeholder="Npr. Polufinale"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500"
                    value={manualMatch.roundName}
                    onChange={(e) => setManualMatch({...manualMatch, roundName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Redni broj runde</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500"
                    value={manualMatch.round}
                    onChange={(e) => setManualMatch({...manualMatch, round: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={onAddManual}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-500 transition-all active:scale-95 shadow-xl shadow-blue-500/20"
                >
                  Kreiraj Meč
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingPlayerSlot && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div>
                <h3 className="text-white font-black uppercase italic tracking-tighter text-lg">Izaberi Igrača</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Izaberi učesnika za poziciju {editingPlayerSlot.playerSlot}</p>
              </div>
              <button onClick={() => setEditingPlayerSlot(null)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>
            
            <div className="p-4 overflow-y-auto">
               <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => onSelectPlayerForSlot({ id: 'tbd', name: 'TBD' })}
                    className="flex items-center gap-3 bg-slate-800/20 hover:bg-slate-800 p-4 rounded-2xl border border-slate-800/50 transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-slate-500">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-400 uppercase tracking-tight">TBD</p>
                      <p className="text-[10px] text-slate-600 font-bold uppercase">Pozicija će biti naknadno određena</p>
                    </div>
                  </button>

                  {roundWinners.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 mt-4 mb-2">
                        <Trophy size={14} className="text-yellow-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pobjednici prošlih mečeva</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {roundWinners.map(player => (
                          <button 
                            key={`winner-${player.id}-${player.matchId}`}
                            onClick={() => onSelectPlayerForSlot(player)}
                            className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl hover:bg-blue-500/20 transition-all text-left group"
                          >
                            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 font-black">
                              {player.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-white uppercase tracking-tight truncate">{player.name}</p>
                              <p className="text-[9px] text-blue-400 font-bold uppercase">Pobjednik iz: {player.fromRound}</p>
                            </div>
                            <ChevronRight size={16} className="text-blue-500/50 group-hover:text-blue-500 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Kvalifikovani iz grupa - samo za Runda 1 */}
                  {(() => {
                    const currentMatch = matches.find(m => m.id === editingPlayerSlot.matchId);
                    if (currentMatch?.round === 1) {
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
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kvalifikovani iz grupa</span>
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                {advancingFromGroups.map(player => (
                                  <button 
                                    key={`group-${player.id}`}
                                    onClick={() => onSelectPlayerForSlot(player)}
                                    className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl hover:bg-emerald-500/20 transition-all text-left"
                                  >
                                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 font-black">
                                      {player.fromGroup}
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-black text-white uppercase">{player.name}</p>
                                      <p className="text-[9px] text-emerald-400 font-bold uppercase">Grupa {player.fromGroup}</p>
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

                  <div className="mt-8 pt-4 border-t border-slate-800/50">
                    <details className="group">
                      <summary className="flex items-center justify-between cursor-pointer list-none">
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-slate-600" />
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Svi registrovani igrači (Napredno)</span>
                        </div>
                        <ChevronDown size={14} className="text-slate-600 group-open:rotate-180 transition-transform" />
                      </summary>
                      <div className="grid grid-cols-1 gap-2 mt-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {allPlayers.map(player => (
                          <button 
                            key={player.id}
                            onClick={() => onSelectPlayerForSlot(player)}
                            className="flex items-center gap-3 bg-slate-950 border border-slate-800 p-4 rounded-2xl hover:border-blue-500/50 group transition-all text-left"
                          >
                            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 group_hover:bg-blue-600 group-hover:text-white transition-all font-black">
                              {player.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-black text-white uppercase tracking-tight">{player.name}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase">{player.club || 'Bez kluba'}</p>
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

      {showSetupModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div>
                <h3 className="text-white font-black uppercase italic tracking-tighter text-lg">Manuelna Faza</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Izaberite broj učesnika za žrijeb</p>
              </div>
              <button onClick={() => setShowSetupModal(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {[
                { count: 4, name: 'Polufinale (4 igrača)', desc: 'Kreira 2 polufinalna meča i finale' },
                { count: 8, name: '1/4 Finale (8 igrača)', desc: 'Kreira 4 četvrtfinalna meča, polufinale i finale' },
                { count: 16, name: '1/8 Finale (16 igrača)', desc: 'Kreira 8 mečeva osmine finala i cijeli žrijeb do kraja' },
                { count: 32, name: '1/16 Finale (32 igrača)', desc: 'Kreira 16 mečeva šesnaestine finala i cijeli žrijeb do kraja' },
                { count: 64, name: '1/32 Finale (64 igrača)', desc: 'Kreira 32 meča i cijeli žrijeb do kraja' }
              ].map((template) => (
                <button 
                  key={template.count}
                  onClick={() => {
                    handleGenerateTemplate(template.count);
                    setShowSetupModal(false);
                  }}
                  className="w-full bg-slate-950 hover:bg-slate-800 p-6 rounded-2xl border border-slate-800 transition-all text-left flex items-center justify-between group"
                >
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-tight">{template.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{template.desc}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <span className="font-black text-xs">{template.count}</span>
                  </div>
                </button>
              ))}

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <p className="text-[9px] text-amber-500/80 font-bold uppercase tracking-widest leading-relaxed">
                  * Sistem će kreirati prazan žrijeb. Igrače ćete dodijeliti ručno klikom na svaku poziciju u žrijebu.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnockoutTab;
