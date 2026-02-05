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
  planDetails, // Receive planDetails
  isSuperAdmin  // Receive isSuperAdmin
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">Dostupni Igrači</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                Prevuci igrače u grupe desno →
              </p>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Traži po imenu..." 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {allPlayers
                  .filter(p => !showOnlySelected || selectedPlayers.includes(p.id))
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
                      className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg cursor-grab active:cursor-grabbing hover:border-blue-500/50 hover:bg-white dark:hover:bg-slate-900 transition-all"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-bold text-xs truncate">{player.name}</p>
                        {seededPlayerIds.includes(player.id) && (
                          <Star size={12} className="text-amber-500 fill-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-600 truncate mt-0.5">{player.club || 'Bez kluba'}</p>
                    </div>
                ))}
                {allPlayers.filter(p => assignedPlayerIds.includes(p.id)).length === allPlayers.length && (
                  <div className="text-center py-10 opacity-30 text-slate-500">
                    <CheckCircle size={24} className="mx-auto mb-2 text-emerald-500" />
                    <p className="text-xs font-bold">Svi raspoređeni</p>
                  </div>
                )}
              </div>
              <button 
                onClick={handleClearCategory}
                className="w-full mt-4 px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20 hover:bg-orange-100 dark:hover:bg-orange-500/20"
                title="Očistite sve (mečeve, grupe, poretke) ali igrači ostaju"
              >
                <Trash2 size={14} /> Očisti kategoriju
              </button>
            </div>
          </div>
        )}

        {/* Main Schedule Area */}
        <div className={`${activeCategory?.status === 'draft' ? 'lg:col-span-3' : 'w-full'} space-y-12`}>
          {/* Quick status bar above groups */}
          {activeCategory?.status !== 'draft' && (activeCategory?.format === 'groups_knockout' || activeCategory?.format === 'round_robin') && (
            <div className={`mb-6 p-5 rounded-lg border transition-all backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              isGroupsCompleted 
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' 
              : 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  isGroupsCompleted 
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                }`}>
                  {isGroupsCompleted ? <CheckCircle size={24} /> : <Zap size={24} />}
                </div>
                <div>
                  <h4 className={`text-base font-bold ${isGroupsCompleted ? 'text-emerald-900 dark:text-emerald-300' : 'text-blue-900 dark:text-blue-300'}`}>
                    {(activeCategory?.format === 'round_robin' ? 'Liga' : 'Grupna faza')} {isGroupsCompleted ? 'je završena' : 'u toku'}
                  </h4>
                  <p className={`text-xs mt-1 ${isGroupsCompleted ? 'text-emerald-600/80 dark:text-emerald-500/80' : 'text-blue-600/80 dark:text-blue-400/80'}`}>
                    {isGroupsCompleted 
                      ? (activeCategory?.format === 'round_robin' ? 'Rezultati su zaključani. Možete resetovati ako treba.' : 'Možete generisati knockout žrijeb u tabu "Eliminacije".')
                      : 'Nakon svih mečeva, kliknite "Završi" da zaključate rezultate.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <button 
                  onClick={handleReturnToDraft}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                    isGroupsCompleted 
                      ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20' 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <RotateCcw size={14} /> Resetuj
                </button>
                <button 
                  onClick={handleClearCategory}
                  className="px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20 hover:bg-orange-100 dark:hover:bg-orange-500/20"
                  title="Očistite sve (mečeve, grupe, poretke) ali igrači ostaju"
                >
                  <Trash2 size={14} /> Očisti
                </button>
                <button 
                  onClick={() => handleToggleStage('groups', !isGroupsCompleted)}
                  className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    isGroupsCompleted 
                    ? 'bg-slate-700 dark:bg-slate-600 text-slate-300 hover:bg-slate-600 dark:hover:bg-slate-500 border border-slate-600' 
                    : 'bg-amber-400 text-black hover:bg-amber-500 shadow-md'
                  }`}
                >
                  {isGroupsCompleted ? (activeCategory?.format === 'round_robin' ? 'Otvori ligu' : 'Ponovo otvori') : (activeCategory?.format === 'round_robin' ? 'Završi ligu' : 'Završi grupu')}
                </button>
              </div>
            </div>
          )}

          {(activeCategory?.format === 'groups_knockout' || activeCategory?.format === 'round_robin') && groups.length > 0 ? (
            <div className="space-y-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{activeCategory?.format === 'round_robin' ? 'Liga - Tabela & Mečevi' : 'Grupe - Tabele & Raspored'}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {activeCategory?.status === 'draft' ? 'Prevucite igrače sa lijeve strane u grupe' : 'Kliknite na meč da unesete rezultat'}
                  </p>
                </div>
                
                {activeCategory?.status === 'draft' && (
                   <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium pl-2">Grupe: {groups.length}</span>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => setGroups(prev => prev.length > 1 ? prev.slice(0, -1) : prev)} 
                            className="w-7 h-7 rounded-md flex items-center justify-center bg-white dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-500/20 text-slate-900 dark:text-white font-bold transition-all border border-slate-200 dark:border-slate-600"
                          >
                            -
                          </button>
                          <button 
                            onClick={() => {
                              if (!isSuperAdmin) {
                                if (!planDetails) {
                                   alert("Podaci o planu se učitavaju. Molimo pričekajte.");
                                   return;
                                }
                                if (groups.length >= (planDetails.groupsLimit || 1)) {
                                  alert(`Limit vašeg plana je ${planDetails.groupsLimit} grupa po kategoriji.`);
                                  return;
                                }
                              }
                              setGroups(prev => [...prev, []]);
                            }} 
                            className="w-7 h-7 rounded-md flex items-center justify-center bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 text-slate-900 dark:text-white font-bold transition-all border border-slate-200 dark:border-slate-600"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button 
                        onClick={handleAutoAssignGroups}
                        className="bg-amber-400 hover:bg-amber-500 text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 border border-amber-500/20"
                        title="Automatski rasporedi preostale igrače"
                      >
                        <Zap size={14} /> Auto popuni
                      </button>

                      <button 
                        onClick={() => {
                          if(confirm("Obrisati sve igrače iz grupa?")) {
                            setGroups(groups.map(() => []));
                          }
                        }}
                        className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all hover:bg-red-100 dark:hover:bg-red-500/20"
                      >
                        <Trash2 size={14} /> Isprazni
                      </button>

                      <button 
                        onClick={handleGenerateMatches}
                        disabled={generating || selectedPlayers.length < 2}
                        className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PlayCircle size={14} /> Spremi i Generiši
                      </button>
                   </div>
                )}
              </div>
              
              {/* Render helper for brackets */}
              <div className={activeCategory?.format === 'groups_knockout' && groups.length === 2 ? 'grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12' : 'space-y-8'}>
                {(activeCategory?.format === 'round_robin' ? 
                  [{ title: "Tabela i mečevi", color: "bg-blue-600", groups: groups, offset: 0 }] : 
                  [
                    { title: "Gornji Žrijeb", color: "bg-blue-500", groups: groups.slice(0, Math.ceil(groups.length / 2)), offset: 0 },
                    { title: "Donji Žrijeb", color: "bg-indigo-500", groups: groups.slice(Math.ceil(groups.length / 2)), offset: Math.ceil(groups.length / 2) }
                  ]
                ).map((bracket, bIdx) => (
                  <div key={bIdx} className={`space-y-6 ${bIdx > 0 ? (activeCategory?.format === 'groups_knockout' && groups.length === 2 ? 'pt-10 lg:pt-0 lg:border-l lg:pl-8 lg:border-t-0 border-t border-slate-200 dark:border-slate-800/50' : 'pt-10 border-t border-slate-200 dark:border-slate-800/50') : ''}`}>
                     <div className="flex items-center gap-2 px-1">
                        <div className={`h-6 w-1 ${bracket.color} rounded-full`}></div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em]">{bracket.title}</h4>
                     </div>

                     <div className={`grid grid-cols-1 ${
                       groups.length === 1 
                         ? 'w-full max-w-6xl mx-auto' 
                         : 'md:grid-cols-2'
                     } gap-4 md:gap-6`}>
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
                            className={`bg-white dark:bg-slate-800/40 backdrop-blur-xl rounded-lg ${isCompact ? 'p-3 md:p-4' : 'p-4 md:p-5'} border shadow-md flex flex-col transition-all duration-300 ${hasSameClub && activeCategory?.status === 'draft' && activeCategory?.format !== 'round_robin' ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200 dark:border-slate-700'}`}
                          >
                            <div className={`flex justify-between items-center ${isCompact ? 'mb-3' : 'mb-4'}`}>
                              <div className="flex items-center gap-3">
                                <h4 className={`${isCompact ? 'text-base' : 'text-lg'} font-bold text-slate-900 dark:text-white`}>
                                   {activeCategory?.format === 'round_robin' ? 'LIGA' : `Grupa ${String.fromCharCode(65 + gIdx)}`}
                                </h4>
                                {hasSameClub && activeCategory?.status === 'draft' && activeCategory?.format !== 'round_robin' && (
                                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-500/20" title="Igrači iz istog kluba su u ovoj grupi!">
                                    <AlertTriangle size={isCompact ? 10 : 12} />
                                    <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-bold`}>Isti klub</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                 <button 
                                   onClick={() => toggleManual(gIdx)}
                                   className={`p-1.5 rounded-lg transition-all ${isManualEdit ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                   title="Ručno poredaj"
                                 >
                                   <ListOrdered size={isCompact ? 12 : 14} />
                                 </button>
                                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{group.length} Igrača</span>
                              </div>
                            </div>

                            {activeCategory?.status === 'draft' && (
                              <div className={`${isCompact ? 'mb-4' : 'mb-5'} space-y-2`}>
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2">
                                  Igrači u grupi ({group.length}):
                                </p>
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
                                    <div key={p.id} className={`${isCompact ? 'p-2' : 'p-2.5'} bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg flex justify-between items-center group/p hover:border-blue-400 dark:hover:border-blue-500 transition-all`}>
                                      <div className="truncate flex-1">
                                        <div className="flex items-center gap-2">
                                          <p className={`font-bold text-slate-900 dark:text-white ${isCompact ? 'text-xs' : 'text-sm'} truncate`}>{p.name}</p>
                                          {seededPlayerIds.includes(p.id) && (
                                            <Star size={isCompact ? 10 : 12} className="text-amber-500 fill-amber-500" />
                                          )}
                                          {isDuplicateClub && <AlertTriangle size={isCompact ? 10 : 12} className="text-amber-500 shrink-0" />}
                                        </div>
                                        <p className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-slate-500 dark:text-slate-400 truncate`}>{p.club || 'Bez kluba'}</p>
                                      </div>
                                      <button onClick={() => removePlayerFromGroups(p.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded opacity-0 group-hover/p:opacity-100 transition-all"><X size={isCompact ? 12 : 14} /></button>
                                    </div>
                                  );
                                })}
                                {group.length === 0 && (
                                  <div className={`${isCompact ? 'py-4' : 'py-8'} border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-50/50 dark:bg-slate-900/20`}>
                                    <span className="text-xs font-bold">Prevucite igrače ovdje</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Tabela Section - Samo ako nije draft */}
                            {activeCategory?.status !== 'draft' && (
                              <div className={isCompact ? 'mb-4' : 'mb-6'}>
                                <div className="flex justify-between items-center mb-3">
                                  <h5 className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2`}>
                                    <LayoutGrid size={isCompact ? 12 : 14} /> Tabela
                                  </h5>
                                  {isManualEdit && (
                                    <span className={`${isCompact ? 'text-[9px]' : 'text-xs'} font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-500/20`}>Ručno Poredaj</span>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <div className={`grid grid-cols-12 gap-2 mb-1 ${isCompact ? 'text-[9px]' : 'text-xs'} font-bold text-slate-500 dark:text-slate-500 px-2 uppercase tracking-widest`}>
                                    <div className="col-span-6"></div>
                                    <div className="col-span-1 text-center">P</div>
                                    <div className="col-span-1 text-center">I</div>
                                    <div className="col-span-1 text-center text-blue-500/80">S±</div>
                                    <div className="col-span-1 text-center text-emerald-500/80">P±</div>
                                    <div className={`col-span-2 text-center text-blue-600 dark:text-blue-400`}>B</div>
                                  </div>
                                  {groupStandings.map((p, idx) => {
                                    const isAdvancing = idx < (activeCategory?.advancingPlayers ?? 2);
                                    
                                    const clubName = (p.club || '').trim();
                                    const isDuplicateClub = clubName && 
                                                           clubName.toLowerCase() !== 'individual' && 
                                                           clubName.toLowerCase() !== 'bez kluba' && 
                                                           clubsInGroup.filter(c => c === clubName.toLowerCase()).length > 1;

                                    return (
                                      <div key={p.id} className={`grid grid-cols-12 gap-1 items-center py-1.5 px-2 rounded-md ${isCompact ? 'text-[10px]' : 'text-[11px]'} transition-all duration-200 border-b border-slate-100 dark:border-slate-800 last:border-b-0 ${
                                      isAdvancing 
                                        ? 'bg-emerald-500/10 dark:bg-emerald-500/20' 
                                        : 'bg-slate-50/40 dark:bg-slate-900/40'
                                    } hover:bg-white dark:hover:bg-slate-800/60`}>
                                      <div className="col-span-6 flex items-center space-x-1.5 truncate">
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
                                          <span className={`font-black w-3 text-center text-[10px] ${isAdvancing ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-400 dark:text-slate-700'}`}>{idx + 1}</span>
                                        )}
                                        <div className="truncate flex-1">
                                          <div className="flex items-center gap-1 leading-tight">
                                            <div className="text-slate-900 dark:text-white font-bold uppercase truncate">{p.name}</div>
                                            {seededPlayerIds.includes(p.id) && (
                                              <Star size={isCompact ? 8 : 9} className="text-amber-500 fill-amber-500" />
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="col-span-1 text-center text-slate-500 dark:text-slate-400 font-medium">{p.won}</div>
                                      <div className="col-span-1 text-center text-slate-500 dark:text-slate-400 font-medium">{p.lost}</div>
                                      <div className={`col-span-1 text-center font-bold ${(p.setsWon - p.setsLost) >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-500'}`}>
                                        {(p.setsWon - p.setsLost) > 0 ? `+${p.setsWon - p.setsLost}` : p.setsWon - p.setsLost}
                                      </div>
                                      <div className={`col-span-1 text-center font-medium ${p.pointDiff >= 0 ? 'text-green-500/80 dark:text-green-400' : 'text-rose-500/80'}`}>
                                        {p.pointDiff > 0 ? `+${p.pointDiff}` : p.pointDiff}
                                      </div>
                                      <div className={`col-span-2 text-center font-bold text-blue-600 dark:text-blue-500`}>{p.points}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            )}

                            {/* Mečevi Section - Samo ako nije draft */}
                            {activeCategory?.status !== 'draft' && (
                              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <h5 className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2 uppercase tracking-widest`}>
                                    <PlayCircle size={isCompact ? 12 : 14} className="text-blue-500" /> Mečevi ({groupMatches.length})
                                </h5>
                                <div className="space-y-2">
                                    {groupMatches.map((match) => {
                                      const p1Winner = match.status === 'completed' && match.player1Score > match.player2Score;
                                      const p2Winner = match.status === 'completed' && match.player2Score > match.player1Score;
                                      
                                      return (
                                        <div 
                                          key={match.id} 
                                          className="group relative bg-white dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 transition-all duration-200 cursor-pointer flex flex-col overflow-hidden shadow-sm"
                                          onClick={() => { setEditingMatch(match); setShowMatchModal(true); }}
                                        >
                                            {/* Player 1 Row */}
                                            <div className={`flex items-center justify-between ${isCompact ? 'px-2 py-1.5' : 'px-3 py-2'} flex-1`}>
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <div className={`text-[12px] font-black truncate ${p1Winner ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                                        {match.player1.name}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-2">
                                                    {match.status === 'completed' && match.sets && match.sets.length > 0 && (
                                                        <div className="flex gap-0.5 items-center opacity-40">
                                                            {match.sets.map((set, sIdx) => (
                                                                <span key={sIdx} className={`text-[8px] font-bold min-w-[8px] text-center ${set.p1 > set.p2 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
                                                                    {set.p1}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className={`${isCompact ? 'w-6 h-6 text-[10px]' : 'w-7 h-7 text-xs'} flex items-center justify-center rounded font-bold transition-all ${p1Winner ? 'bg-green-600/20 text-green-600 dark:bg-green-900/80 dark:text-green-300' : 'bg-slate-200 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400'}`}>
                                                        {match.player1Score ?? 0}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Player 2 Row */}
                                            <div className={`flex items-center justify-between ${isCompact ? 'px-2 py-1.5' : 'px-3 py-2'} flex-1`}>
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <div className={`text-[12px] font-black truncate ${p2Winner ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                                        {match.player2.name}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-2">
                                                    {match.status === 'completed' && match.sets && match.sets.length > 0 && (
                                                        <div className="flex gap-0.5 items-center opacity-40">
                                                            {match.sets.map((set, sIdx) => (
                                                                <span key={sIdx} className={`text-[8px] font-bold min-w-[8px] text-center ${set.p2 > set.p1 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
                                                                    {set.p2}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className={`${isCompact ? 'w-6 h-6 text-[10px]' : 'w-7 h-7 text-xs'} flex items-center justify-center rounded font-bold transition-all ${p2Winner ? 'bg-green-600/20 text-green-600 dark:bg-green-900/80 dark:text-green-300' : 'bg-slate-200 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400'}`}>
                                                        {match.player2Score ?? 0}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Menu (Floating) */}
                                            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible flex items-center justify-center transition-all duration-200 z-40">
                                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-xl p-0.5 flex items-center gap-1 backdrop-blur-md">
                                                    <button 
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all"
                                                        onClick={(e) => { 
                                                            e.stopPropagation();
                                                            setEditingMatch(match); 
                                                            setShowMatchModal(true); 
                                                        }}
                                                    >
                                                        Unos
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteMatch(match.id); }} 
                                                        className="p-1 text-slate-400 hover:text-red-500 transition-all" 
                                                        title="Obriši"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                      );
                                    })}
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

              <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-lg overflow-hidden shadow-lg dark:shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-950 border-b border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider">
                        <th className="px-6 py-4">Kolo</th>
                        <th className="px-6 py-4">Igrač 1</th>
                        <th className="px-6 py-4 text-center">Rezultat</th>
                        <th className="px-6 py-4">Igrač 2</th>
                        <th className="px-6 py-4 text-right">Akcija</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {matches.map((match) => (
                        <tr key={match.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-5">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">Kolo {match.round}</span>
                          </td>
                          <td className="px-6 py-5 font-semibold text-slate-900 dark:text-white">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span>{match.player1.name}</span>
                                {seededPlayerIds.includes(match.player1.id) && (
                                  <Star size={10} className="text-amber-500 fill-amber-500" />
                                )}
                              </div>
                              <span className="text-[8px] text-slate-500 font-bold uppercase truncate">{allPlayers.find(p => p.id === match.player1.id)?.club || 'Individual'}</span>
                              {match.sets?.length > 0 && (
                                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">
                                  ({match.sets.map(s => s.p1).join(', ')})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-center gap-2">
                              <input 
                                type="number" 
                                className="w-12 h-12 text-center bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl font-bold text-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm dark:shadow-none" 
                                value={match.player1Score || 0}
                                onChange={(e) => handleScoreChange(match.id, 'player1', e.target.value)}
                              />
                              <span className="text-slate-500 dark:text-slate-600 font-bold">:</span>
                              <input 
                                type="number" 
                                className="w-12 h-12 text-center bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl font-bold text-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm dark:shadow-none" 
                                value={match.player2Score || 0}
                                onChange={(e) => handleScoreChange(match.id, 'player2', e.target.value)}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-5 font-semibold text-slate-900 dark:text-white">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span>{match.player2.name}</span>
                                {seededPlayerIds.includes(match.player2.id) && (
                                  <Star size={10} className="text-amber-500 fill-amber-500" />
                                )}
                              </div>
                              <span className="text-[8px] text-slate-500 font-bold uppercase truncate">{allPlayers.find(p => p.id === match.player2.id)?.club || 'Individual'}</span>
                              {match.sets?.length > 0 && (
                                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">
                                  ({match.sets.map(s => s.p2).join(', ')})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <button 
                              onClick={() => saveMatchResult(match)}
                              disabled={savingMatchId === match.id}
                              className={`text-[11px] font-bold uppercase tracking-wider py-2.5 px-5 rounded-lg transition-all ${match.status === 'completed' ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-default' : 'bg-amber-400 text-black hover:bg-amber-500 active:scale-95 shadow-md shadow-amber-600/20'}`}
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
