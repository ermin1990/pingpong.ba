import { useState } from 'react';
import { 
  Users, Search, CheckCircle, PlayCircle, X, LayoutGrid, Edit2, 
  ChevronDown, ArrowUp, ArrowDown, ListOrdered, Zap, RotateCcw, Trash2,
  AlertTriangle, Star, Trophy, CheckCircle2, Shuffle, Plus, PlayCircle as Play, Eraser
} from 'lucide-react';

const MatchesTab = ({ 
  activeCategory, 
  searchTerm, 
  setSearchTerm, 
  allPlayers, 
  showOnlySelected, 
  selectedPlayers, 
  assignedPlayerIds, 
  groups, 
  setGroups, 
  handleGenerateMatches, 
  generating, 
  calculateStandings, 
  matches, 
  movePlayerToGroup, 
  removePlayerFromGroups, 
  setEditingMatch, 
  setShowMatchModal, 
  saveMatchResult, 
  savingMatchId,
  handleScoreChange,
  handleSaveManualOrder,
  handleToggleStage,
  handleReturnToDraft,
  handleClearCategory,
  handleDeleteMatch,
  handleAutoAssignGroups,
  togglePlayerSeed,
  seededPlayers,
  planDetails, // Receive planDetails
  isSuperAdmin,  // Receive isSuperAdmin
  handleAssignTableToGroup,
  handleAssignTableToCategory,
  tables,
  addGroup,
  removeGroup,
  clearAllGroups
}) => {
  const [manualEditingGroups, setManualEditingGroups] = useState({});
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [dragOverGroup, setDragOverGroup] = useState(null);
  const seededPlayerIds = activeCategory?.seededPlayerIds || [];
  const isGroupsCompleted = activeCategory?.stages?.groups?.completed || false;
  const isDraft = activeCategory?.status === 'draft';
  const isGroupsKO = activeCategory?.format === 'groups_knockout';

  const handleDropOnGroup = (e, groupIdx) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverGroup(null);
    const playerId = e.dataTransfer.getData('playerId');
    if (playerId && typeof movePlayerToGroup === 'function') {
      movePlayerToGroup(playerId, groupIdx);
    }
  };

  const handleDragOverGroup = (e, groupIdx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverGroup !== groupIdx) setDragOverGroup(groupIdx);
  };

  const handleDragLeaveGroup = () => {
    setDragOverGroup(null);
  };

  const getStandings = (groupIdx) => {
    if (typeof calculateStandings !== 'function') return [];
    try {
      return calculateStandings(groupIdx) || [];
    } catch (err) {
      console.error('Greška pri računanju tabele grupe:', err);
      return [];
    }
  };

  const getPlayerLabel = (playerLike) => {
    if (!playerLike) return 'Nepoznat';
    if (typeof playerLike === 'string') return playerLike;
    return playerLike.name || playerLike.playerName || allPlayers.find(ap => ap.id === playerLike.id)?.name || 'Nepoznat';
  };

  const getPlayerClub = (playerLike) => {
    if (!playerLike) return '';
    return playerLike.club || allPlayers.find(ap => ap.id === playerLike.id)?.club || '';
  };

  const getMatchPlayerName = (match, slot) => {
    if (!match) return 'TBD';
    const key = slot === 1 ? 'player1' : 'player2';
    const keyName = slot === 1 ? 'player1Name' : 'player2Name';
    return match[keyName] || getPlayerLabel(match[key]) || 'TBD';
  };

  const getPlayerInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() || '')
      .join('');
  };

  const moveManual = (groupIdx, playerIdx, direction, currentStandings) => {
    const newOrder = currentStandings.map(p => p.id);
    const targetIdx = direction === 'up' ? playerIdx - 1 : playerIdx + 1;
    
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;
    
    // Swap IDs in order array
    const temp = newOrder[playerIdx];
    newOrder[playerIdx] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;
    
    handleSaveManualOrder(groupIdx, newOrder);
  };

  const toggleManual = (groupIdx) => {
    setManualEditingGroups(prev => ({
      ...prev,
      [groupIdx]: !prev[groupIdx]
    }));
  };

  return (
    <div className="space-y-5">
      <div className={`grid grid-cols-1 ${activeCategory?.status === 'draft' ? 'xl:grid-cols-[320px_minmax(0,1fr)]' : ''} gap-5`}>
        
        {/* Draft Sidebar */}
        {activeCategory?.status === 'draft' && (
          <div className="space-y-4 xl:sticky xl:top-24 self-start">
            <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded-[24px] p-5 shadow-lg">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-sky-500/12 rounded-xl flex items-center justify-center text-sky-300 border border-sky-500/15">
                  <Users size={18} />
                </div>
                <div>
                  <span className="text-xs font-black text-white uppercase tracking-tight italic block">Igrači na Čekanju</span>
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none mt-1">Dovuci u grupe</p>
                </div>
              </div>

              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input 
                  type="text" 
                  placeholder="TRAŽI PO IMENU..." 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-sky-500/50 transition-all" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {activeCategory?.type === 'doubles' ? (
                  // Doubles Logic: Show teams/pairs instead of single players
                  (activeCategory.doublesPairs || [])
                    .filter(p => !assignedPlayerIds.includes(p.id))
                    .filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(pair => (
                      <div 
                        key={pair.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('playerId', pair.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        className="bg-slate-950 border border-slate-800 p-3.5 rounded-[18px] cursor-grab active:cursor-grabbing hover:border-sky-500/30 hover:bg-slate-900 transition-all shadow-sm group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Users size={12} className="text-blue-500" />
                          <p className="font-black text-[10px] uppercase tracking-tight text-slate-200 truncate">{pair.name}</p>
                        </div>
                        <div className="flex gap-2">
                          {pair.playerIds.map(pid => {
                            const p = allPlayers.find(pl => pl.id === pid);
                            return (
                              <span key={pid} className="text-[8px] font-bold text-slate-500 uppercase truncate">
                                {p?.name.split(' ').pop()}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))
                ) : (
                  // Singles Logic (Original)
                  allPlayers
                    .filter(p => activeCategory?.playerIds?.includes(p.id))
                    .filter(p => !assignedPlayerIds.includes(p.id))
                    .filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .sort((a, b) => {
                      const aSeeded = seededPlayerIds.includes(a.id);
                      const bSeeded = seededPlayerIds.includes(b.id);
                      if (aSeeded && !bSeeded) return -1;
                      if (!aSeeded && bSeeded) return 1;
                      return 0;
                    })
                    .map(player => (
                      <div 
                        key={player.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('playerId', player.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        className="bg-slate-950 border border-slate-800 p-3.5 rounded-[18px] cursor-grab active:cursor-grabbing hover:border-sky-500/30 hover:bg-slate-900 transition-all shadow-sm group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <button 
                            onClick={() => togglePlayerSeed(player.id)}
                            className="flex items-center gap-2 group/btn"
                            title={seededPlayerIds.includes(player.id) ? "Ukloni nosioca" : "Postavi za nosioca"}
                          >
                            <Star 
                              size={12} 
                              className={seededPlayerIds.includes(player.id) ? "text-amber-500 fill-amber-500" : "text-slate-700 group-hover/btn:text-sky-300"} 
                            />
                            <p className="font-black text-[11px] uppercase tracking-tighter italic text-slate-200 truncate">{player.name}</p>
                          </button>
                        </div>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest truncate mt-1.5">{player.club || 'Individualac'}</p>
                      </div>
                    ))
                )}
                {/* Check if everything is assigned */}
                {((activeCategory?.type === 'doubles' 
                    ? (activeCategory.doublesPairs || []).length 
                    : allPlayers.filter(p => activeCategory?.playerIds?.includes(p.id)).length
                  ) === assignedPlayerIds.length) && assignedPlayerIds.length > 0 && (
                  <div className="text-center py-8 opacity-30">
                    <CheckCircle size={28} className="mx-auto mb-3 text-sky-400" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Svi raspoređeni</p>
                  </div>
                )}
              </div>
              
              <div className="pt-6 border-t border-slate-800 mt-6">
                <button 
                  onClick={handleClearCategory}
                  className="w-full px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white"
                  title="Očistite sve"
                >
                  <Trash2 size={14} /> Resetuj Kategoriju
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Schedule Area */}
        <div className="space-y-8">
           {/* Quick status bar inside MatchesTab */}
           {activeCategory?.status !== 'draft' && (activeCategory?.format === 'groups_knockout' || activeCategory?.format === 'round_robin') && (
            <div className={`mb-6 p-4 sm:p-5 rounded-[24px] border transition-all backdrop-blur-xl flex flex-col lg:flex-row items-center justify-between gap-5 relative overflow-hidden shadow-lg ${
              isGroupsCompleted 
              ? 'bg-emerald-500/10 border-emerald-500/30' 
              : 'bg-gray-800/50 border-gray-700/50 text-white'
            }`}>
              {/* Background accent icon */}
              <div className={`absolute -right-10 -bottom-10 opacity-10 pointer-events-none scale-150 ${isGroupsCompleted ? 'text-emerald-500' : 'text-gray-400'}`}>
                {isGroupsCompleted ? <CheckCircle size={200} /> : <Zap size={200} />}
              </div>

              <div className="flex items-center gap-6 relative z-10 w-full lg:w-auto">
                <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center shadow-2xl shrink-0 ${
                  isGroupsCompleted 
                    ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' 
                    : 'bg-slate-900 text-sky-300 border border-slate-800 shadow-inner'
                }`}>
                  {isGroupsCompleted ? <CheckCircle size={36} strokeWidth={2.5} /> : <Zap size={36} strokeWidth={2.5} />}
                </div>
                <div>
                  <h4 className={`text-xl font-black uppercase tracking-tight italic leading-none mb-2 ${isGroupsCompleted ? 'text-emerald-400' : 'text-white'}`}>
                    {(activeCategory?.format === 'round_robin' ? 'Liga' : 'Grupna faza')} {isGroupsCompleted ? 'Završena' : 'u Toku'}
                  </h4>
                  <p className={`text-[10px] font-black uppercase tracking-widest max-w-md leading-relaxed ${isGroupsCompleted ? 'text-emerald-300/70' : 'text-slate-300'}`}>
                    {isGroupsCompleted 
                      ? (activeCategory?.format === 'round_robin' ? 'Rezultati su zaključani i spremni za finalnu tabelu.' : 'Svi mečevi su završeni. Generišite eliminacije.')
                      : 'Unesite sve rezultate da biste mogli formalno završiti fazu i generisati eliminacije.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto relative z-10">
                <button 
                  onClick={handleReturnToDraft}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 border ${
                    isGroupsCompleted 
                      ? 'bg-slate-950 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white hover:border-red-500 shadow-lg' 
                      : 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600'
                  }`}
                >
                  <RotateCcw size={16} strokeWidth={3} /> Vrati u Draft
                </button>
                <button 
                  onClick={() => handleToggleStage('groups', !isGroupsCompleted)}
                  className={`px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md ${
                    isGroupsCompleted 
                    ? 'bg-sky-600 text-white hover:bg-sky-500' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                  }`}
                >
                  {isGroupsCompleted ? 'Ponovo Otvori Fazu' : 'Završi Fazu'}
                </button>
              </div>
            </div>
          )}

          {/* Draft Controls Bar (Auto-assign, Add group, Clear, Generate) */}
          {isDraft && (activeCategory?.format === 'groups_knockout' || activeCategory?.format === 'round_robin') && (
            <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded-[24px] p-4 sm:p-5 shadow-lg mb-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/12 rounded-xl flex items-center justify-center text-amber-300 border border-amber-500/15">
                      <LayoutGrid size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-black text-white uppercase tracking-tight italic block">
                        {isGroupsKO ? 'Raspored Grupa' : 'Liga (Round Robin)'}
                      </span>
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none mt-1">
                        {isGroupsKO 
                          ? `${groups.length} grupa · ${groups.flat().length} igrača raspoređeno · ${(selectedPlayers?.length || 0) - groups.flat().length} na čekanju`
                          : `${selectedPlayers?.length || 0} igrača selektovano`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateMatches}
                    disabled={generating || (selectedPlayers?.length || 0) < 2}
                    className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
                    title="Generiši mečeve i pokreni kategoriju"
                  >
                    <Play size={14} strokeWidth={3} fill="currentColor" />
                    {generating ? 'Generišem...' : 'Generiši Mečeve'}
                  </button>
                </div>

                {isGroupsKO && (
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800">
                    <button
                      onClick={handleAutoAssignGroups}
                      disabled={generating}
                      className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 bg-sky-500/10 text-sky-300 border border-sky-500/20 hover:bg-sky-500 hover:text-white"
                      title="Automatski rasporedi neraspoređene igrače balansirano po klubovima i nosiocima"
                    >
                      <Shuffle size={13} strokeWidth={2.5} /> Auto Raspored
                    </button>
                    <button
                      onClick={addGroup}
                      disabled={generating}
                      className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white"
                      title="Dodaj novu grupu"
                    >
                      <Plus size={13} strokeWidth={2.5} /> Dodaj Grupu
                    </button>
                    <button
                      onClick={clearAllGroups}
                      disabled={generating || groups.flat().length === 0}
                      className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-500/10 disabled:hover:text-amber-300"
                      title="Vrati sve igrače iz grupa nazad u 'Igrači na Čekanju'"
                    >
                      <Eraser size={13} strokeWidth={2.5} /> Očisti Grupe
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {(activeCategory?.format === 'groups_knockout' || activeCategory?.format === 'round_robin') && groups.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                {groups
                  .map((groupPlayerIds, idx) => ({ groupPlayerIds, idx }))
                  .filter(({ idx }) => selectedGroup === 'all' || selectedGroup === idx)
                  .map(({ groupPlayerIds, idx }) => {
                    const groupMatches = matches.filter(m => m.categoryId === activeCategory.id && m.groupId === idx);
                    const isGroupCompleted = groupMatches.length > 0 && groupMatches.every(m => m.status === 'completed');
                    const groupStandings = getStandings(idx);
                    const groupedMatchesByRound = groupMatches
                      .slice()
                      .sort((a, b) => (a.round || 0) - (b.round || 0))
                      .reduce((acc, match) => {
                        const roundKey = match.round || 1;
                        if (!acc[roundKey]) acc[roundKey] = [];
                        acc[roundKey].push(match);
                        return acc;
                      }, {});
                    const roundKeys = Object.keys(groupedMatchesByRound)
                      .map(Number)
                      .sort((a, b) => a - b);

                    const isDropping = dragOverGroup === idx;
                    return (
                      <div 
                        key={idx} 
                        onDragOver={isDraft && isGroupsKO ? (e) => handleDragOverGroup(e, idx) : undefined}
                        onDragLeave={isDraft && isGroupsKO ? handleDragLeaveGroup : undefined}
                        onDrop={isDraft && isGroupsKO ? (e) => handleDropOnGroup(e, idx) : undefined}
                        className={`bg-slate-950/90 backdrop-blur-xl border shadow-lg flex flex-col transition-all duration-300 rounded-[20px] overflow-hidden ${
                          isDropping 
                            ? 'border-sky-500 ring-2 ring-sky-500/40 scale-[1.01]' 
                            : isGroupCompleted ? 'border-emerald-500/20' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Group Header */}
                        <div className="bg-gradient-to-r from-sky-500/10 to-cyan-500/5 px-4 py-3 border-b border-slate-800">
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="text-white font-bold text-base flex items-center space-x-2">
                              <span className="bg-sky-500/15 text-sky-200 border border-sky-500/20 px-3 py-1 rounded-full text-[11px] uppercase tracking-widest">
                                Grupa {String.fromCharCode(65 + idx)}
                              </span>
                              {isDraft && isGroupsKO && (
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                  · {groupPlayerIds.length} {groupPlayerIds.length === 1 ? 'igrač' : 'igrača'}
                                </span>
                              )}
                            </h4>
                            <div className="flex items-center space-x-2">
                              {isDraft && isGroupsKO ? (
                                <button
                                  onClick={() => removeGroup && removeGroup(idx)}
                                  className="text-red-400 hover:text-white hover:bg-red-500 bg-red-500/10 border border-red-500/20 text-[10px] px-3 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1"
                                  title="Obriši grupu"
                                >
                                  <Trash2 size={11} /> Grupu
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => toggleManual(idx)}
                                    className={`text-white text-[10px] px-3 py-1.5 rounded-lg transition-colors font-semibold ${
                                      manualEditingGroups[idx]
                                        ? 'bg-amber-600 hover:bg-amber-500'
                                        : 'bg-slate-800 hover:bg-slate-700'
                                    }`}
                                    title={manualEditingGroups[idx] ? 'Isključi ručno prilagođavanje' : 'Uključi ručno prilagođavanje'}
                                  >
                                    ✏️ Ručno prilagodi
                                  </button>
                                  <span className="text-gray-400 text-xs">
                                    {groupMatches.filter(m => m.status === 'completed').length}/{groupMatches.length} mečeva
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="px-4 py-3 bg-slate-900/30">
                          {/* Draft mode: Player list with remove + drop zone hint */}
                          {isDraft && isGroupsKO && (
                            <div className="mb-3">
                              {groupPlayerIds.length === 0 ? (
                                <div className={`border-2 border-dashed rounded-[16px] py-8 px-4 text-center transition-all ${
                                  isDropping ? 'border-sky-500 bg-sky-500/10' : 'border-slate-700/60 bg-slate-950/40'
                                }`}>
                                  <Users size={24} className={`mx-auto mb-2 ${isDropping ? 'text-sky-400' : 'text-slate-700'}`} />
                                  <p className={`text-[10px] font-black uppercase tracking-widest ${isDropping ? 'text-sky-300' : 'text-slate-600'}`}>
                                    {isDropping ? 'Spusti ovdje' : 'Dovuci igrače ovdje'}
                                  </p>
                                </div>
                              ) : (
                                <div className={`space-y-1.5 p-2 rounded-[16px] transition-all ${
                                  isDropping ? 'bg-sky-500/10 ring-2 ring-sky-500/40' : 'bg-slate-950/40 border border-slate-800/60'
                                }`}>
                                  {groupPlayerIds.map((p) => {
                                    const isSeed = seededPlayerIds.includes(p.id);
                                    return (
                                      <div 
                                        key={p.id}
                                        draggable
                                        onDragStart={(e) => {
                                          e.dataTransfer.setData('playerId', p.id);
                                          e.dataTransfer.effectAllowed = 'move';
                                        }}
                                        className="flex items-center justify-between gap-2 bg-slate-900/70 border border-slate-800 hover:border-sky-500/30 rounded-xl px-3 py-2 cursor-grab active:cursor-grabbing transition-all group/row"
                                      >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          {isSeed && <Star size={11} className="text-amber-500 fill-amber-500 flex-shrink-0" />}
                                          <div className="min-w-0">
                                            <p className="text-[11px] font-bold uppercase tracking-tight text-white truncate">{p.name}</p>
                                            {p.club && (
                                              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 truncate">{p.club}</p>
                                            )}
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => removePlayerFromGroups && removePlayerFromGroups(p.id)}
                                          className="opacity-50 group-hover/row:opacity-100 text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-all flex-shrink-0"
                                          title="Ukloni iz grupe"
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Standings Table - hide in draft */}
                          {!(isDraft && isGroupsKO) && (
                          <div className="bg-slate-950/40 border border-slate-800/60 rounded-[16px] overflow-hidden">
                            <table className="w-full text-xs text-left">
                              <thead>
                                <tr className="text-slate-400 border-b border-slate-800">
                                  <th className="text-left py-1.5 pr-2 pl-3 font-medium">#</th>
                                  <th className="text-left py-1.5 font-medium">Igrač</th>
                                  <th className="text-center py-1.5 px-1 font-medium w-10">M</th>
                                  <th className="text-center py-1.5 px-1 font-medium w-10">P</th>
                                  <th className="text-center py-1.5 px-1 font-medium w-10">I</th>
                                  <th className="text-center py-1.5 px-1 font-medium w-12">S</th>
                                  <th className="text-center py-1.5 px-1 font-medium w-10">G</th>
                                  <th className="text-center py-1.5 px-1 font-medium text-green-400 w-10">Bod</th>
                                  {manualEditingGroups[idx] && (
                                    <th className="text-center py-1.5 px-1 font-medium w-16">Ručno</th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {groupStandings.map((p, pIdx) => {
                                  const isAdvancing = pIdx < (activeCategory.advancingCount || 2);
                                  const label = getPlayerLabel(p);
                                  const club = getPlayerClub(p);
                                  const setsDiff = (p.setsWon || 0) - (p.setsLost || 0);
                                  const setsDiffClass = setsDiff > 0 ? 'text-green-400' : setsDiff < 0 ? 'text-red-400' : 'text-gray-300';
                                  return (
                                    <tr key={p.id || `${label}-${pIdx}`} className={`border-b border-slate-800/60 hover:bg-slate-900/60 transition-colors ${isAdvancing ? 'bg-emerald-500/6' : ''}`}>
                                      <td className="py-2 pr-2 pl-3 text-slate-400 font-mono text-xs">
                                        {pIdx + 1}
                                      </td>
                                      <td className="py-2 max-w-[220px]">
                                        <div className="flex flex-col min-w-0">
                                          <span className="text-white font-medium text-xs truncate">
                                            {label}
                                          </span>
                                          {club && club !== 'Individual' && club !== 'Individualno' && (
                                            <span className="text-gray-400 text-[10px] truncate leading-none mt-0.5">
                                              {club}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-2 px-1 text-center text-slate-300 text-xs">{p.won + p.lost}</td>
                                      <td className="py-2 px-1 text-center text-green-400 text-xs">{p.won}</td>
                                      <td className="py-2 px-1 text-center text-red-400 text-xs">{p.lost}</td>
                                      <td className="py-2 px-1 text-center text-slate-300 text-xs font-medium">
                                        {p.setsWon}:{p.setsLost}
                                      </td>
                                      <td className={`py-2 px-1 text-center text-xs ${setsDiffClass}`}>
                                        {setsDiff > 0 ? `+${setsDiff}` : setsDiff}
                                      </td>
                                      <td className="py-2 px-1 text-center text-green-400 font-bold text-xs">
                                        {p.points}
                                      </td>
                                      {manualEditingGroups[idx] && (
                                        <td className="py-2 px-1 text-center">
                                          <div className="inline-flex items-center gap-0.5 bg-slate-900 border border-slate-700 rounded-md p-0.5">
                                            <button
                                              onClick={() => moveManual(idx, pIdx, 'up', groupStandings)}
                                              disabled={pIdx === 0}
                                              className="w-6 h-6 rounded flex items-center justify-center text-slate-300 enabled:hover:bg-slate-800 enabled:hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                              title="Pomjeri gore"
                                            >
                                              <ArrowUp size={11} />
                                            </button>
                                            <button
                                              onClick={() => moveManual(idx, pIdx, 'down', groupStandings)}
                                              disabled={pIdx === groupStandings.length - 1}
                                              className="w-6 h-6 rounded flex items-center justify-center text-slate-300 enabled:hover:bg-slate-800 enabled:hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                              title="Pomjeri dole"
                                            >
                                              <ArrowDown size={11} />
                                            </button>
                                          </div>
                                        </td>
                                      )}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          )}

                          {/* Matches List - hide in draft (no matches yet) */}
                          {!(isDraft && isGroupsKO) && (
                          <div className="px-0 pt-3 border-t border-gray-700/50 mt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Zap size={10} className="text-sky-400" fill="currentColor" />
                              <span className="text-slate-300 font-semibold text-xs">Mečevi</span>
                            </div>
                            <div className="space-y-3">
                              {roundKeys.map(round => (
                                <div key={`round-${idx}-${round}`} className="space-y-1">
                                  <div className="text-slate-400 text-xs font-medium px-2 py-1 bg-slate-900/60 rounded-lg">
                                    Kolo {round}.
                                  </div>
                                  <div className="space-y-1">
                                    {groupedMatchesByRound[round].map((match) => {
                                      const p1Winner = match.status === 'completed' && parseInt(match.player1Score) > parseInt(match.player2Score);
                                      const p2Winner = match.status === 'completed' && parseInt(match.player2Score) > parseInt(match.player1Score);
                                      const p1Name = getMatchPlayerName(match, 1);
                                      const p2Name = getMatchPlayerName(match, 2);

                                      return (
                                        <div
                                          key={match.id}
                                          className="bg-slate-900/40 rounded-[14px] p-2.5 hover:bg-slate-900/70 hover:border-sky-500/20 cursor-pointer transition-all border border-slate-800 group"
                                          onClick={() => {
                                            setEditingMatch(match);
                                            setShowMatchModal(true);
                                          }}
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                                                  <div className="w-5 h-5 bg-sky-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-white font-bold text-[9px]">{getPlayerInitials(p1Name)}</span>
                                                  </div>
                                                  <span className={`text-xs truncate ${p1Winner ? 'text-green-300 font-semibold' : 'text-white'}`}>
                                                    {p1Name}
                                                  </span>
                                                </div>
                                                  <span className={`text-base font-bold ml-2 flex-shrink-0 ${p1Winner ? 'text-green-400' : 'text-slate-500'}`}>
                                                  {match.player1Score ?? 0}
                                                </span>
                                              </div>

                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                                                  <div className="w-5 h-5 bg-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-white font-bold text-[9px]">{getPlayerInitials(p2Name)}</span>
                                                  </div>
                                                  <span className={`text-xs truncate ${p2Winner ? 'text-green-300 font-semibold' : 'text-white'}`}>
                                                    {p2Name}
                                                  </span>
                                                </div>
                                                  <span className={`text-base font-bold ml-2 flex-shrink-0 ${p2Winner ? 'text-green-400' : 'text-slate-500'}`}>
                                                  {match.player2Score ?? 0}
                                                </span>
                                              </div>
                                            </div>

                                            <div className="flex flex-col gap-1 flex-shrink-0">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditingMatch(match);
                                                  setShowMatchModal(true);
                                                }}
                                                className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded text-center whitespace-nowrap hover:bg-slate-700 hover:text-white transition-colors"
                                              >
                                                👁️ Detalji
                                              </button>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditingMatch(match);
                                                  setShowMatchModal(true);
                                                }}
                                                className="text-sky-400 hover:text-sky-300 text-[10px] text-center whitespace-nowrap"
                                              >
                                                ✏️ Edit
                                              </button>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (window.confirm('Sigurno želite obrisati ovaj meč?')) {
                                                    handleDeleteMatch(match.id);
                                                  }
                                                }}
                                                className="text-gray-500 hover:text-red-500 transition-colors p-1 text-center w-full flex justify-center"
                                                title="Obriši meč"
                                              >
                                                <Trash2 size={12} />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-slate-950/60 rounded-[24px] border border-dashed border-slate-800 shadow-lg">
               <Trophy size={48} className="mx-auto text-slate-800 mb-6 opacity-20" />
               <p className="text-slate-600 font-black uppercase tracking-[0.2em] text-sm italic">Nema generisanih grupa</p>
               <p className="text-slate-700 text-[10px] font-bold uppercase tracking-widest mt-2">Generišite mečeve u tabu "Kategorije"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchesTab;
