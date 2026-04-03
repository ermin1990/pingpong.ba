import { useState } from 'react';
import { 
  Users, Search, CheckCircle, PlayCircle, X, LayoutGrid, Edit2, 
  ChevronDown, ArrowUp, ArrowDown, ListOrdered, Zap, RotateCcw, Trash2,
  AlertTriangle, Star
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
  tables
}) => {
  const [manualEditingGroups, setManualEditingGroups] = useState({});
  const seededPlayerIds = activeCategory?.seededPlayerIds || [];
  const isGroupsCompleted = activeCategory?.stages?.groups?.completed || false;

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
    <div className="space-y-6">
      <div className={`grid grid-cols-1 ${activeCategory?.status === 'draft' ? 'lg:grid-cols-4' : ''} gap-6`}>
        
        {/* Draft Sidebar */}
        {activeCategory?.status === 'draft' && (
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-24 self-start">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Users size={16} />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">Igrači na Čekanju</span>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-0.5">Dodaj u grupe ispod</p>
                </div>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="TRAŽI PO IMENU..." 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white outline-none focus:border-blue-500/50 transition-all" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {allPlayers
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
                      className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl cursor-grab active:cursor-grabbing hover:border-blue-500/50 hover:bg-white dark:hover:bg-slate-900 transition-all shadow-sm group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button 
                          onClick={() => togglePlayerSeed(player.id)}
                          className="flex items-center gap-2 group/btn"
                          title={seededPlayerIds.includes(player.id) ? "Ukloni nosioca" : "Postavi za nosioca"}
                        >
                          <Star 
                            size={12} 
                            className={seededPlayerIds.includes(player.id) ? "text-amber-500 fill-amber-500" : "text-slate-300 dark:text-slate-600 group-hover/btn:text-amber-500/50"} 
                          />
                          <p className="font-black text-[11px] uppercase tracking-tight text-slate-700 dark:text-slate-200 truncate">{player.name}</p>
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest truncate mt-1">{player.club || 'Individualac'}</p>
                    </div>
                ))}
                {allPlayers.filter(p => assignedPlayerIds.includes(p.id)).length === allPlayers.length && (
                  <div className="text-center py-10 opacity-30">
                    <CheckCircle size={32} className="mx-auto mb-3 text-emerald-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Svi su raspoređeni</p>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-4">
                <button 
                  onClick={handleClearCategory}
                  className="w-full px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 hover:bg-red-500 hover:text-white hover:border-red-500"
                  title="Očistite sve (mečeve, grupe, poretke) ali igrači ostaju"
                >
                  <Trash2 size={14} /> Resetuj kategoriju
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Schedule Area */}
        <div className={`${activeCategory?.status === 'draft' ? 'lg:col-span-3' : 'w-full'} space-y-12`}>
          {/* Quick status bar above groups */}
          {activeCategory?.status !== 'draft' && (activeCategory?.format === 'groups_knockout' || activeCategory?.format === 'round_robin') && (
            <div className={`mb-8 p-6 rounded-[32px] border transition-all backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
              isGroupsCompleted 
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 shadow-lg shadow-emerald-500/5' 
              : 'bg-amber-400 border-amber-500 text-black shadow-xl shadow-amber-500/20'
            }`}>
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                  isGroupsCompleted 
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-black/10 text-black'
                }`}>
                  {isGroupsCompleted ? <CheckCircle size={28} /> : <Zap size={28} />}
                </div>
                <div>
                  <h4 className={`text-lg font-black uppercase tracking-tighter ${isGroupsCompleted ? 'text-emerald-900 dark:text-emerald-300' : 'text-black'}`}>
                    {(activeCategory?.format === 'round_robin' ? 'Liga' : 'Grupna faza')} {isGroupsCompleted ? 'Završena' : 'u Toku'}
                  </h4>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isGroupsCompleted ? 'text-emerald-600/80 dark:text-emerald-500/80' : 'text-black/70'}`}>
                    {isGroupsCompleted 
                      ? (activeCategory?.format === 'round_robin' ? 'Rezultati su zaključani i spremni za finalnu tabelu.' : 'Svi mečevi su završeni. Generišite eliminacije.')
                      : 'Unesite sve rezultate da biste mogli formalno završiti fazu.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <button 
                  onClick={handleReturnToDraft}
                  className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${
                    isGroupsCompleted 
                      ? 'bg-white dark:bg-slate-900 text-red-600 border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm' 
                      : 'bg-white/20 text-black border-black/10 hover:bg-white/40'
                  }`}
                >
                  <RotateCcw size={14} /> Resetuj u Draft
                </button>
                <button 
                  onClick={() => handleToggleStage('groups', !isGroupsCompleted)}
                  className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl ${
                    isGroupsCompleted 
                    ? 'bg-slate-900 text-white hover:bg-slate-800' 
                    : 'bg-white text-black hover:bg-slate-100'
                  }`}
                >
                  {isGroupsCompleted ? 'Ponovo Otvori' : 'Završi Fazu'}
                </button>
              </div>
            </div>
          )}

          {(activeCategory?.format === 'groups_knockout' || activeCategory?.format === 'round_robin') && groups.length > 0 ? (
            <div className="space-y-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <div>
                   <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                    {activeCategory?.format === 'round_robin' ? 'Ligaška Tabela' : 'Grupni Poredak'}
                   </h3>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                    {activeCategory?.status === 'draft' ? 'PRIPREMA ŽRIJEBA' : 'PRAĆENJE REZULTATA U REALNOM VREMENU'}
                  </p>
                </div>

                {activeCategory?.status !== 'draft' && (
                    <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 w-full lg:w-auto">
                        <select 
                            className="bg-transparent border-none py-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 outline-none cursor-pointer w-full"
                            onChange={(e) => {
                                if(confirm(`Rasporediti SVE mečeve ove kategorije na stol ${tables?.find(t => t.id === e.target.value)?.name}?`)) {
                                    handleAssignTableToCategory(e.target.value);
                                }
                            }}
                            value=""
                        >
                            <option value="" disabled>RASPOREDI NA STOL...</option>
                             {tables?.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                
                {activeCategory?.status === 'draft' && (
                   <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                      <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-950 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-2">Grupe: {groups.length}</span>
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => setGroups(prev => prev.length > 1 ? prev.slice(0, -1) : prev)} 
                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 hover:bg-red-500 hover:text-white text-slate-900 dark:text-white font-black transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
                          >
                            -
                          </button>
                          <button 
                            onClick={() => {
                              if (!isSuperAdmin) {
                                if (!planDetails) return;
                                if (groups.length >= (planDetails.groupsLimit || 1)) return;
                              }
                              setGroups(prev => [...prev, []]);
                            }} 
                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 hover:bg-emerald-500 hover:text-white text-slate-900 dark:text-white font-black transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button 
                        onClick={handleAutoAssignGroups}
                        className="flex-1 lg:flex-none bg-amber-400 hover:bg-amber-500 text-black px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                      >
                        <Zap size={14} /> Auto popuni
                      </button>

                      <button 
                        onClick={handleGenerateMatches}
                        disabled={generating || selectedPlayers.length < 2}
                        className="flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                      >
                        <PlayCircle size={14} /> Generiši
                      </button>
                   </div>
                )}
              </div>
              
              {/* Render helper for brackets */}
              <div className="space-y-16">
                {(activeCategory?.format === 'round_robin' ? 
                  [{ title: "Tabela i mečevi", color: "bg-blue-600", groups: groups, offset: 0 }] : 
                  [
                    { title: "Gornji Žrijeb", color: "bg-blue-500", groups: groups.slice(0, Math.ceil(groups.length / 2)), offset: 0 },
                    { title: "Donji Žrijeb", color: "bg-indigo-500", groups: groups.slice(Math.ceil(groups.length / 2)), offset: Math.ceil(groups.length / 2) }
                  ]
                ).map((bracket, bIdx) => (
                  <div key={bIdx} className={`space-y-6 ${bIdx > 0 ? 'pt-10 border-t border-slate-200 dark:border-slate-800/10' : ''}`}>
                     <div className="flex items-center gap-2 px-1">
                        <div className={`h-6 w-1 ${bracket.color} rounded-full`}></div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em]">{bracket.title}</h4>
                     </div>

                     <div className={`grid grid-cols-1 ${bracket.groups.length > 1 ? 'lg:grid-cols-2' : 'max-w-4xl'} gap-6`}>
                      {bracket.groups.map((group, localIdx) => {
                        const gIdx = localIdx + bracket.offset;
                        const isCompact = groups.length >= 3;
                        const groupMatches = matches.filter(m => {
                           if (m.groupId === gIdx) return true;
                           // Fallback za stare zapise lige (Round Robin)
                           if (activeCategory?.format === 'round_robin' && gIdx === 0 && (m.groupId === undefined || m.groupId === null)) return true;
                           return false;
                        });
                        const autoStandings = calculateStandings(gIdx);
                        
                        // Handle Manual Order
                        const manualOrder = activeCategory?.manualOrders?.[gIdx];
                        let groupStandings = [...autoStandings];
                        
                        if (manualOrder && Array.isArray(manualOrder) && manualOrder.length === autoStandings.length) {
                          groupStandings.sort((a, b) => {
                            const indexA = manualOrder.indexOf(a.id);
                            const indexB = manualOrder.indexOf(b.id);
                            return indexA - indexB;
                          });
                        }

                        const isManualEdit = manualEditingGroups[gIdx];

                        // Provjera istih klubova u grupi
                        const clubsInGroup = group.map(p => p.club?.trim().toLowerCase()).filter(c => c && c !== 'individual' && c !== 'bez kluba' && c !== '');
                        const hasSameClub = clubsInGroup.some((club, index) => clubsInGroup.indexOf(club) !== index);

                        return (
                          <div 
                            key={gIdx} 
                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-blue-500/50'); }}
                            onDragLeave={(e) => { e.currentTarget.classList.remove('border-blue-500/50'); }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.remove('border-blue-500/50');
                              const playerId = e.dataTransfer.getData('playerId');
                              if (playerId) movePlayerToGroup(playerId, gIdx);
                            }}
                            className={`bg-white dark:bg-slate-900 border shadow-sm flex flex-col transition-all duration-300 rounded-3xl ${hasSameClub && activeCategory?.status === 'draft' && activeCategory?.format !== 'round_robin' ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200 dark:border-slate-800'}`}
                          >
                            <div className={`flex justify-between items-center ${isCompact ? 'mb-3' : 'mb-4'} p-4 pb-0`}>
                              <div className="flex items-center gap-3">
                                <h4 className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-black text-slate-900 dark:text-white uppercase tracking-widest`}>
                                   {activeCategory?.format === 'round_robin' ? 'LIGA' : `Grupa ${String.fromCharCode(65 + gIdx)}`}
                                </h4>
                                
                                {activeCategory?.status !== 'draft' && (
                                    <div className="relative">
                                        <select 
                                            className="appearance-none bg-slate-100 dark:bg-slate-950 border-none rounded-xl px-3 py-1 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors pr-6 w-24"
                                            onChange={(e) => handleAssignTableToGroup(gIdx, e.target.value)}
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Stol...</option>
                                            <option value="">-- Bez stola --</option>
                                            {tables?.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                )}

                                {hasSameClub && activeCategory?.status === 'draft' && activeCategory?.format !== 'round_robin' && (
                                  <div className="flex items-center gap-1 bg-amber-400 text-black px-2 py-1 rounded-lg" title="Igrači iz istog kluba su u ovoj grupi!">
                                    <AlertTriangle size={10} />
                                    <span className="text-[10px] font-black uppercase tracking-tight italic">Isti klub</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                 <button 
                                   onClick={() => toggleManual(gIdx)}
                                   className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${isManualEdit ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                   title="Ručno poredaj"
                                 >
                                   <ListOrdered size={14} />
                                 </button>
                                 <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{group.length} Igrača</span>
                              </div>
                            </div>

                            <div className="p-4">
                            {activeCategory?.status === 'draft' && (
                              <div className={`${isCompact ? 'mb-4' : 'mb-5'} space-y-2`}>
                                {[...group]
                                  .sort((a, b) => {
                                    const aSeeded = seededPlayerIds.includes(a.id);
                                    const bSeeded = seededPlayerIds.includes(b.id);
                                    if (aSeeded && !bSeeded) return -1;
                                    if (!aSeeded && bSeeded) return 1;
                                    return 0;
                                  })
                                  .map(p => {
                                  const clubName = (p.club || '').trim();
                                  const isDuplicateClub = clubName && 
                                                         clubName.toLowerCase() !== 'individual' && 
                                                         clubName.toLowerCase() !== 'bez kluba' && 
                                                         clubsInGroup.filter(c => c === clubName.toLowerCase()).length > 1;

                                  return (
                                    <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-center group/p hover:border-blue-500 transition-all">
                                      <div className="truncate flex-1">
                                        <div className="flex items-center gap-2">
                                          <button 
                                            onClick={() => togglePlayerSeed(p.id)}
                                            className="p-1 hover:bg-amber-500/10 rounded-lg transition-all"
                                            title={seededPlayerIds.includes(p.id) ? "Ukloni nosioca" : "Postavi za nosioca"}
                                          >
                                            <Star 
                                              size={12} 
                                              className={seededPlayerIds.includes(p.id) ? "text-amber-500 fill-amber-500" : "text-slate-400 dark:text-slate-600"} 
                                            />
                                          </button>
                                          <p className="font-black text-slate-900 dark:text-white text-[11px] uppercase tracking-wider truncate">{p.name}</p>
                                          {isDuplicateClub && <AlertTriangle size={10} className="text-amber-500 shrink-0" />}
                                        </div>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest truncate">{p.club || 'Bez kluba'}</p>
                                      </div>
                                      <button onClick={() => removePlayerFromGroups(p.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><X size={14} /></button>
                                    </div>
                                  );
                                })}
                                {group.length === 0 && (
                                  <div className="py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-950/50">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Prevucite igrače ovdje</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Tabela Section - Samo ako nije draft */}
                            {activeCategory?.status !== 'draft' && (
                              <div className={isCompact ? 'mb-6' : 'mb-8'}>
                                <div className="flex justify-between items-center mb-4">
                                  <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <LayoutGrid size={12} /> Tabela
                                  </h5>
                                  {isManualEdit && (
                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded-lg">Ručno Poredaj</span>
                                  )}
                                </div>
                                <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
                                  <div className="grid grid-cols-12 gap-2 mb-2 text-[8px] font-black text-slate-400 px-2 uppercase tracking-widest">
                                    <div className="col-span-6">IGRAČ</div>
                                    <div className="col-span-1 text-center">P</div>
                                    <div className="col-span-1 text-center">I</div>
                                    <div className="col-span-1 text-center">S±</div>
                                    <div className="col-span-1 text-center">P±</div>
                                    <div className="col-span-2 text-right">B</div>
                                  </div>
                                  {groupStandings.map((p, idx) => {
                                    const isAdvancing = idx < (activeCategory?.advancingPlayers ?? 2);
                                    
                                    return (
                                      <div key={p.id} className={`grid grid-cols-12 gap-1 items-center py-2 px-2 rounded-xl text-[10px] transition-all border-b border-white/5 last:border-b-0 ${
                                      isAdvancing 
                                        ? 'bg-emerald-500/10 dark:bg-emerald-500/20' 
                                        : ''
                                    }`}>
                                      <div className="col-span-6 flex items-center space-x-2 truncate">
                                        {isManualEdit ? (
                                          <div className="flex flex-col gap-0.5 shrink-0">
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); moveManual(gIdx, idx, 'up', groupStandings); }}
                                              disabled={idx === 0}
                                              className="text-slate-400 hover:text-blue-500 disabled:opacity-0 transition-colors"
                                            >
                                              <ArrowUp size={8} />
                                            </button>
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); moveManual(gIdx, idx, 'down', groupStandings); }}
                                              disabled={idx === groupStandings.length - 1}
                                              className="text-slate-400 hover:text-blue-500 disabled:opacity-0 transition-colors"
                                            >
                                              <ArrowDown size={8} />
                                            </button>
                                          </div>
                                        ) : (
                                          <span className="font-black w-4 text-center text-[9px] text-slate-500">{idx + 1}.</span>
                                        )}
                                        <div className="truncate flex-1">
                                          <div className="flex items-center gap-1 leading-tight">
                                            <div className="text-slate-900 dark:text-white font-black uppercase truncate tracking-wider">{p.name}</div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="col-span-1 text-center text-slate-500 font-bold">{p.won}</div>
                                      <div className="col-span-1 text-center text-slate-400">{p.lost}</div>
                                      <div className={`col-span-1 text-center font-black ${(p.setsWon - p.setsLost) >= 0 ? 'text-blue-500' : 'text-rose-500'}`}>
                                        {(p.setsWon - p.setsLost) > 0 ? `+${p.setsWon - p.setsLost}` : p.setsWon - p.setsLost}
                                      </div>
                                      <div className={`col-span-1 text-center font-bold ${p.pointDiff >= 0 ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                                        {p.pointDiff > 0 ? `+${p.pointDiff}` : p.pointDiff}
                                      </div>
                                      <div className="col-span-2 text-right font-black text-slate-900 dark:text-white">{p.points}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            )}

                            {/* Mečevi Section - Samo ako nije draft */}
                            {activeCategory?.status !== 'draft' && (
                              <div className="mt-2">
                                <h5 className="text-[9px] font-black text-slate-400 mb-3 flex items-center gap-2 uppercase tracking-widest">
                                    <PlayCircle size={10} className="text-blue-500" /> Mečevi ({groupMatches.length})
                                </h5>
                                <div className="space-y-1.5">
                                    {groupMatches.map((match) => {
                                      const p1Winner = match.status === 'completed' && match.player1Score > match.player2Score;
                                      const p2Winner = match.status === 'completed' && match.player2Score > match.player1Score;
                                      
                                      return (
                                        <div 
                                          key={match.id} 
                                          className="group relative bg-white dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all duration-200 cursor-pointer flex flex-col overflow-hidden shadow-sm"
                                          onClick={() => { setEditingMatch(match); setShowMatchModal(true); }}
                                        >
                                            <div className="flex items-center justify-between px-3 py-2 flex-1">
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <div className={`text-[11px] font-black uppercase tracking-wider truncate ${p1Winner ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-500/50'}`}>
                                                        {match.player1.name}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-2">
                                                    <div className={`w-8 h-8 flex items-center justify-center rounded-xl font-black text-[11px] transition-all ${p1Winner ? 'bg-green-500 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}>
                                                        {match.player1Score ?? 0}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between px-3 py-2 pt-0 flex-1">
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <div className={`text-[11px] font-black uppercase tracking-wider truncate ${p2Winner ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-500/50'}`}>
                                                        {match.player2.name}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-2">
                                                    <div className={`w-8 h-8 flex items-center justify-center rounded-xl font-black text-[11px] transition-all ${p2Winner ? 'bg-green-500 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}>
                                                        {match.player2Score ?? 0}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Menu (Floating Overlay) */}
                                            <div className="absolute inset-0 bg-blue-600/20 items-center justify-center hidden group-hover:flex z-10">
                                                <button className="text-white text-xs font-medium uppercase tracking-wide px-4 py-2.5 bg-blue-600 border-2 border-white/20 rounded-full hover:bg-blue-700 transition-all shadow-lg">
                                                    Unos rezultata
                                                </button>
                                            </div>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            )}
                            </div>
                          </div>
                        );
                      })}
                   </div>
                </div>
              ))}
              </div>
            </div>
          ) : matches.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-1 dark:border-stone-800 pb-4 border-b border-slate-200">
                <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                  <PlayCircle className="text-blue-600 dark:text-blue-500" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Rezultati Mečeva</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Pregled i unos rezultata</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                        <th className="px-6 py-4 italic">Kolo</th>
                        <th className="px-6 py-4">Igrač 1</th>
                        <th className="px-6 py-4 text-center">Rezultat</th>
                        <th className="px-6 py-4">Igrač 2</th>
                        <th className="px-6 py-4 text-right">Akcija</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {matches.map((match) => (
                        <tr key={match.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-5">
                            <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Kolo {match.round}</span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">{match.player1.name}</span>
                              </div>
                              <span className="text-[9px] text-slate-400 font-bold uppercase truncate">{allPlayers.find(p => p.id === match.player1.id)?.club || 'Individual'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-center gap-2">
                              <input 
                                type="number" 
                                className="w-10 h-10 text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-black text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm" 
                                value={match.player1Score || 0}
                                onChange={(e) => handleScoreChange(match.id, 'player1', e.target.value)}
                              />
                              <span className="text-slate-300 dark:text-slate-700 font-bold">:</span>
                              <input 
                                type="number" 
                                className="w-10 h-10 text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-black text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm" 
                                value={match.player2Score || 0}
                                onChange={(e) => handleScoreChange(match.id, 'player2', e.target.value)}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">{match.player2.name}</span>
                              </div>
                              <span className="text-[9px] text-slate-400 font-bold uppercase truncate">{allPlayers.find(p => p.id === match.player2.id)?.club || 'Individual'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <button 
                              onClick={() => saveMatchResult(match)}
                              disabled={savingMatchId === match.id}
                              className={`text-[9px] font-black uppercase tracking-widest py-2 px-4 rounded-xl transition-all ${match.status === 'completed' ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-amber-400 text-black hover:bg-amber-500 active:scale-95 shadow-sm shadow-amber-600/20'}`}
                            >
                              {savingMatchId === match.id ? '...' : (match.status === 'completed' ? 'ZAVRŠENO' : 'SAČUVAJ')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-slate-900/20 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
              <PlayCircle size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
              <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs">Raspored još nije generisan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchesTab;
