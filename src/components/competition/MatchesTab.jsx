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
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2 mb-2 px-1 text-slate-500 dark:text-slate-400">
              <Users size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Preostali Igrači</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={12} />
              <input 
                type="text" 
                placeholder="Traži igrača..." 
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-[10px] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm dark:shadow-none" 
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
                    className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl cursor-grab active:cursor-grabbing hover:border-blue-500/30 transition-all text-slate-700 dark:text-slate-300 shadow-sm dark:shadow-none"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-bold text-[10px] truncate uppercase">{player.name}</p>
                      {seededPlayerIds.includes(player.id) && (
                        <Star size={10} className="text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[8px] text-slate-500 dark:text-slate-600 truncate uppercase mt-0.5">{player.club || 'Bez kluba'}</p>
                  </div>
              ))}
              {allPlayers.filter(p => assignedPlayerIds.includes(p.id)).length === allPlayers.length && (
                <div className="text-center py-10 opacity-30 dark:opacity-20 text-slate-900 dark:text-white">
                  <CheckCircle size={24} className="mx-auto mb-2 text-emerald-500" />
                  <p className="text-[8px] font-black uppercase">Svi su raspoređeni</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Schedule Area */}
        <div className={`${activeCategory?.status === 'draft' ? 'lg:col-span-3' : 'w-full'} space-y-12`}>
          {/* Quick status bar above groups */}
          {activeCategory?.status !== 'draft' && (activeCategory?.format === 'groups_knockout' || activeCategory?.format === 'round_robin') && (
            <div className={`mb-8 p-6 rounded-3xl border transition-all duration-500 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6 ${
              isGroupsCompleted 
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 shadow-sm dark:shadow-[0_0_30px_rgba(16,185,129,0.05)]' 
              : 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-600/20'
            }`}>
              <div className="flex items-center gap-5 text-center md:text-left">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                  isGroupsCompleted 
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500' 
                    : 'bg-white/20 text-white'
                }`}>
                  {isGroupsCompleted ? <CheckCircle size={30} /> : <Zap size={30} className="animate-pulse" />}
                </div>
                <div>
                  <h4 className={`text-xl font-black uppercase italic tracking-tighter ${isGroupsCompleted ? 'text-emerald-900 dark:text-white' : 'text-white'}`}>
                    {(activeCategory?.format === 'round_robin' ? 'Liga' : 'Grupna faza')} {isGroupsCompleted ? 'je uspješno završena' : 'je u toku'}
                  </h4>
                  <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mt-1 ${isGroupsCompleted ? 'text-emerald-600/70 dark:text-emerald-500/70' : 'text-indigo-100'}`}>
                    {isGroupsCompleted 
                      ? (activeCategory?.format === 'round_robin' ? 'Liga je završena. Konačan poredak je dostupan.' : 'Rezultati su zaključani. Možete generisati knockout žrijeb u sljedećem tabu.')
                      : 'Nakon što svi mečevi budu gotovi, kliknite na dugme za potvrdu završetka.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <button 
                  onClick={handleReturnToDraft}
                  className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-2 border ${
                    isGroupsCompleted 
                      ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 border-red-100 dark:border-red-500/20 hover:bg-red-600 hover:text-white' 
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  }`}
                >
                  <RotateCcw size={14} /> Resetuj u Draft
                </button>
                <button 
                  onClick={() => handleToggleStage('groups', !isGroupsCompleted)}
                  className={`px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl ${
                    isGroupsCompleted 
                    ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700' 
                    : 'bg-white text-indigo-600 hover:bg-indigo-50 shadow-white/10'
                  }`}
                >
                  {isGroupsCompleted ? (activeCategory?.format === 'round_robin' ? 'Otvori ligu' : 'Ponovo otvori grupe') : (activeCategory?.format === 'round_robin' ? 'Završi ligu' : 'Završi grupnu fazu')}
                </button>
              </div>
            </div>
          )}

          {(activeCategory?.format === 'groups_knockout' || activeCategory?.format === 'round_robin') && groups.length > 0 ? (
            <div className="space-y-12">
              <div className="flex items-center justify-between px-1">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">{activeCategory?.format === 'round_robin' ? 'Raspored Lige' : 'Raspored po grupama'}</h3>
                  <div className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                    {activeCategory?.status === 'draft' ? 'Prevucite igrače u željene grupe' : (activeCategory?.format === 'round_robin' ? 'Pregled tabele i rezultata' : 'Pregled tabela i rezultata po grupama')}
                  </div>
                </div>
                
                {activeCategory?.status === 'draft' && (
                   <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3 bg-white dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <span className="text-[10px] text-slate-500 font-black uppercase pl-2">Grupe: {groups.length}</span>
                        <div className="flex gap-1">
                          <button onClick={() => setGroups(prev => prev.length > 1 ? prev.slice(0, -1) : prev)} className="w-6 h-6 rounded flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-red-500/20 text-slate-900 dark:text-white font-bold transition-all border border-slate-200 dark:border-slate-700">-</button>
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
                            className="w-6 h-6 rounded flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-green-500/20 text-slate-900 dark:text-white font-bold transition-all border border-slate-200 dark:border-slate-700"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button 
                        onClick={handleAutoAssignGroups}
                        className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 border border-slate-200 dark:border-slate-700 shadow-sm"
                        title="Automatski rasporedi preostale igrače u grupe pazeći na klubove"
                      >
                        <Zap size={14} className="text-amber-500" /> Popuni ostale
                      </button>

                      <button 
                        onClick={() => {
                          if(confirm("Da li želite obrisati sve trenutno raspoređene igrače iz grupa?")) {
                            setGroups(groups.map(() => []));
                          }
                        }}
                        className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 border border-red-100 dark:border-red-500/20 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-red-600 hover:text-white active:scale-95 shadow-sm"
                        title="Isprazni sve grupe"
                      >
                        <Trash2 size={14} /> Resetuj
                      </button>

                      <button 
                        onClick={handleGenerateMatches}
                        disabled={generating || selectedPlayers.length < 2}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                      >
                        <PlayCircle size={14} /> Spremi i kreni
                      </button>
                   </div>
                )}
              </div>
              
              {/* Render helper for brackets */}
              {(activeCategory?.format === 'round_robin' ? 
                [{ title: "Tabela i mečevi", color: "bg-blue-600", groups: groups, offset: 0 }] : 
                [
                  { title: "Gornji Žrijeb", color: "bg-blue-500", groups: groups.slice(0, Math.ceil(groups.length / 2)), offset: 0 },
                  { title: "Donji Žrijeb", color: "bg-indigo-500", groups: groups.slice(Math.ceil(groups.length / 2)), offset: Math.ceil(groups.length / 2) }
                ]
              ).map((bracket, bIdx) => (
                <div key={bIdx} className={`space-y-6 ${bIdx > 0 ? 'pt-10 border-t border-slate-200 dark:border-slate-800/50' : ''}`}>
                   <div className="flex items-center gap-2 px-1">
                      <div className={`h-6 w-1 ${bracket.color} rounded-full`}></div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em]">{bracket.title}</h4>
                   </div>

                   <div className={`grid grid-cols-1 ${activeCategory?.status === 'draft' || activeCategory?.format === 'round_robin' ? 'xl:grid-cols-1' : 'md:grid-cols-2'} gap-4 md:gap-6`}>
                      {bracket.groups.map((group, localIdx) => {
                        const gIdx = localIdx + bracket.offset;
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
                            className={`bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl p-4 md:p-6 border shadow-sm dark:shadow-xl flex flex-col transition-all duration-300 ${hasSameClub && activeCategory?.status === 'draft' && activeCategory?.format !== 'round_robin' ? 'border-amber-500/30 ring-4 ring-amber-500/5' : 'border-slate-200 dark:border-slate-800'}`}
                          >
                            <div className="flex justify-between items-center mb-4 px-1">
                              <div className="flex items-center gap-3">
                                <h4 className="text-xl font-black text-slate-900 dark:text-white italic">
                                   {activeCategory?.format === 'round_robin' ? 'LIGA' : `#${String.fromCharCode(65 + gIdx)}`}
                                </h4>
                                {hasSameClub && activeCategory?.status === 'draft' && activeCategory?.format !== 'round_robin' && (
                                  <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20 animate-pulse" title="Igrači iz istog kluba su u ovoj grupi!">
                                    <AlertTriangle size={10} />
                                    <span className="text-[7px] font-black uppercase tracking-tighter">Isti Klub</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                 <button 
                                   onClick={() => toggleManual(gIdx)}
                                   className={`p-1.5 rounded-lg transition-all ${isManualEdit ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                   title="Ručno poredaj"
                                 >
                                   <ListOrdered size={14} />
                                 </button>
                                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{group.length} Igrača</span>
                              </div>
                            </div>

                            {activeCategory?.status === 'draft' && (
                              <div className="mb-6 space-y-2">
                                {group.map(p => {
                                  const clubName = (p.club || '').trim();
                                  const isDuplicateClub = clubName && 
                                                         clubName.toLowerCase() !== 'individual' && 
                                                         clubName.toLowerCase() !== 'bez kluba' && 
                                                         clubsInGroup.filter(c => c === clubName.toLowerCase()).length > 1;

                                  return (
                                    <div key={p.id} className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/50 p-2 rounded-xl flex justify-between items-center group/p shadow-sm dark:shadow-none">
                                      <div className="truncate flex-1">
                                        <div className="flex items-center gap-2">
                                          <p className="font-bold text-slate-900 dark:text-white text-[10px] truncate uppercase">{p.name}</p>
                                          {seededPlayerIds.includes(p.id) && (
                                            <Star size={10} className="text-amber-500 fill-amber-500" />
                                          )}
                                          {isDuplicateClub && <AlertTriangle size={10} className="text-amber-500 shrink-0" />}
                                        </div>
                                        <p className="text-[8px] text-slate-500 font-bold uppercase truncate">{p.club || 'Bez kluba'}</p>
                                      </div>
                                      <button onClick={() => removePlayerFromGroups(p.id)} className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover/p:opacity-100 transition-opacity"><X size={12} /></button>
                                    </div>
                                  );
                                })}
                                {group.length === 0 && (
                                  <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl py-6 flex flex-col items-center justify-center text-slate-400 dark:text-slate-700 bg-slate-50/50 dark:bg-transparent">
                                    <span className="text-[8px] font-black uppercase tracking-widest">Prazno</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Tabela Section */}
                            <div className="mb-8">
                              <div className="flex justify-between items-center mb-3 px-1">
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                  <LayoutGrid size={12} /> Tabela
                                </h5>
                                {isManualEdit && (
                                  <span className="text-[7px] font-black text-blue-600 dark:text-blue-400 uppercase bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-500/20 animate-pulse">Ručno Poredaj</span>
                                )}
                              </div>
                              <div className="space-y-1">
                                <div className="grid grid-cols-12 gap-2 mb-2 text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest px-2">
                                  <div className="col-span-6">Igrač</div>
                                  <div className="col-span-1 text-center">P</div>
                                  <div className="col-span-1 text-center">I</div>
                                  <div className="col-span-1 text-center">Set±</div>
                                  <div className="col-span-1 text-center">Poen±</div>
                                  <div className="col-span-2 text-center text-blue-600 dark:text-blue-500">B</div>
                                </div>
                                {groupStandings.map((p, idx) => {
                                  const isAdvancing = idx < (activeCategory?.advancingPlayers ?? 2);
                                  
                                  const clubName = (p.club || '').trim();
                                  const isDuplicateClub = clubName && 
                                                         clubName.toLowerCase() !== 'individual' && 
                                                         clubName.toLowerCase() !== 'bez kluba' && 
                                                         clubsInGroup.filter(c => c === clubName.toLowerCase()).length > 1;

                                  return (
                                    <div key={p.id} className={`grid grid-cols-12 gap-2 items-center py-2 px-2 rounded-lg text-[10px] transition-all duration-200 border ${
                                      isAdvancing 
                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20' 
                                        : 'bg-slate-50/50 dark:bg-slate-950/30 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:border-slate-200 dark:hover:border-slate-800'
                                    }`}>
                                      <div className="col-span-6 flex items-center space-x-2 truncate">
                                        {isManualEdit ? (
                                          <div className="flex flex-col gap-0.5">
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); moveManual(gIdx, idx, 'up', groupStandings); }}
                                              disabled={idx === 0}
                                              className="text-slate-400 hover:text-blue-500 disabled:opacity-0 transition-colors"
                                            >
                                              <ArrowUp size={10} />
                                            </button>
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); moveManual(gIdx, idx, 'down', groupStandings); }}
                                              disabled={idx === groupStandings.length - 1}
                                              className="text-slate-400 hover:text-blue-500 disabled:opacity-0 transition-colors"
                                            >
                                              <ArrowDown size={10} />
                                            </button>
                                          </div>
                                        ) : (
                                          <span className={`font-black w-4 text-center ${isAdvancing ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-400 dark:text-slate-700'}`}>{idx + 1}</span>
                                        )}
                                        <div className="truncate">
                                          <div className="flex items-center gap-1.5 leading-tight">
                                            <div className="text-slate-900 dark:text-white font-bold uppercase truncate">{p.name}</div>
                                            {seededPlayerIds.includes(p.id) && (
                                              <Star size={9} className="text-amber-500 fill-amber-500" />
                                            )}
                                            {isDuplicateClub && activeCategory?.status === 'draft' && (
                                              <AlertTriangle size={9} className="text-amber-500 shrink-0" />
                                            )}
                                          </div>
                                          <div className="text-[7px] text-slate-500 font-bold uppercase truncate">{p.club || 'Bez kluba'}</div>
                                        </div>
                                      </div>
                                      <div className="col-span-1 text-center font-bold text-slate-400 dark:text-slate-500">{p.played}</div>
                                      <div className="col-span-1 text-center font-bold text-slate-400 dark:text-slate-500">{p.won}</div>
                                      <div className="col-span-1 text-center font-bold text-slate-500">{p.setsWon - p.setsLost}</div>
                                      <div className="col-span-1 text-center font-bold text-slate-400 dark:text-slate-600">{p.pointDiff}</div>
                                      <div className={`col-span-2 text-center font-black ${isAdvancing ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>{p.points}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Mečevi Section */}
                            <div>
                                <h5 className="text-[10px] font-black text-slate-500 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <PlayCircle size={12} /> Mečevi
                                </h5>
                                <div className="space-y-3">
                                    {groupMatches.map((match) => (
                                        <div key={match.id} className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/50 rounded-xl overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm dark:shadow-none">
                                            {/* Desktop Match Layout */}
                                            <div className="hidden lg:flex items-center justify-between p-4 gap-4">
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex flex-col truncate pr-2">
                                                          <div className="flex items-center gap-1.5">
                                                            <span className={`text-[11px] font-bold truncate ${match.status === 'completed' && match.player1Score > match.player2Score ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                                                                {match.player1.name}
                                                            </span>
                                                            {seededPlayerIds.includes(match.player1.id) && (
                                                              <Star size={9} className="text-amber-500 fill-amber-500" />
                                                            )}
                                                          </div>
                                                          <span className="text-[7px] text-slate-400 dark:text-slate-600 font-bold uppercase truncate">
                                                              {allPlayers.find(p => p.id === match.player1.id)?.club || 'Individual'}
                                                          </span>
                                                        </div>
                                                        {match.sets?.length > 0 && (
                                                            <div className="flex gap-1 ml-4 ring-1 ring-slate-200 dark:ring-slate-800 rounded px-1 py-0.5 bg-white dark:bg-black/20">
                                                                {match.sets.map((set, sIdx) => (
                                                                    <div key={sIdx} className="w-5 text-center border-r last:border-0 border-slate-200 dark:border-slate-800/50">
                                                                        <span className={`text-[10px] font-bold ${match.status === 'completed' && set.p1 > set.p2 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-600'}`}>
                                                                            {set.p1 ?? '-'}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex flex-col truncate pr-2">
                                                          <div className="flex items-center gap-1.5">
                                                            <span className={`text-[11px] font-bold truncate ${match.status === 'completed' && match.player2Score > match.player1Score ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                                                                {match.player2.name}
                                                            </span>
                                                            {seededPlayerIds.includes(match.player2.id) && (
                                                              <Star size={9} className="text-amber-500 fill-amber-500" />
                                                            )}
                                                          </div>
                                                          <span className="text-[7px] text-slate-400 dark:text-slate-600 font-bold uppercase truncate">
                                                              {allPlayers.find(p => p.id === match.player2.id)?.club || 'Individual'}
                                                          </span>
                                                        </div>
                                                        {match.sets?.length > 0 && (
                                                            <div className="flex gap-1 ml-4 ring-1 ring-slate-200 dark:ring-slate-800 rounded px-1 py-0.5 bg-white dark:bg-black/20">
                                                                {match.sets.map((set, sIdx) => (
                                                                    <div key={sIdx} className="w-5 text-center border-r last:border-0 border-slate-200 dark:border-slate-800/50">
                                                                        <span className={`text-[10px] font-bold ${match.status === 'completed' && set.p2 > set.p1 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-600'}`}>
                                                                            {set.p2 ?? '-'}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-center gap-2 ml-2 pl-4 border-l border-slate-200 dark:border-slate-800">
                                                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg px-2 py-1">
                                                        <span className="text-sm font-black text-slate-900 dark:text-white">{match.player1Score ?? 0}</span>
                                                        <span className="text-[10px] text-slate-400 dark:text-slate-600">:</span>
                                                        <span className="text-sm font-black text-slate-900 dark:text-white">{match.player2Score ?? 0}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => { setEditingMatch(match); setShowMatchModal(true); }} className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400">Zapiši</button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteMatch(match.id); }} className="text-[9px] font-black uppercase text-red-500 hover:text-red-700 dark:hover:text-red-400" title="Obriši meč">
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mobile Match Layout */}
                                            <div className="lg:hidden p-3 space-y-3">
                                                <div className="flex justify-between items-center bg-white dark:bg-black/20 p-2 rounded-xl border border-slate-100 dark:border-transparent">
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex flex-col truncate pr-2">
                                                              <span className="text-[10px] font-bold text-slate-900 dark:text-white truncate max-w-[100px]">{match.player1.name}</span>
                                                              <span className="text-[7px] text-slate-500 font-bold uppercase truncate">{allPlayers.find(p => p.id === match.player1.id)?.club || 'Individual'}</span>
                                                            </div>
                                                            <span className="text-xs font-black text-slate-900 dark:text-white">{match.player1Score ?? 0}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex flex-col truncate pr-2">
                                                              <span className="text-[10px] font-bold text-slate-900 dark:text-white truncate max-w-[100px]">{match.player2.name}</span>
                                                              <span className="text-[7px] text-slate-500 font-bold uppercase truncate">{allPlayers.find(p => p.id === match.player2.id)?.club || 'Individual'}</span>
                                                            </div>
                                                            <span className="text-xs font-black text-slate-900 dark:text-white">{match.player2Score ?? 0}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => { setEditingMatch(match); setShowMatchModal(true); }} className="w-10 h-10 bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center border border-blue-100 dark:border-transparent">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteMatch(match.id); }} className="w-10 h-10 bg-red-50 dark:bg-red-600/20 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center border border-red-100 dark:border-transparent" title="Obriši meč">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                          </div>
                        );
                      })}
                   </div>
                </div>
              ))}
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

              <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider">
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
                              <span>{match.player1.name}</span>
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
                                className="w-12 h-12 text-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm dark:shadow-none" 
                                value={match.player1Score || 0}
                                onChange={(e) => handleScoreChange(match.id, 'player1', e.target.value)}
                              />
                              <span className="text-slate-300 dark:text-slate-600 font-bold">:</span>
                              <input 
                                type="number" 
                                className="w-12 h-12 text-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm dark:shadow-none" 
                                value={match.player2Score || 0}
                                onChange={(e) => handleScoreChange(match.id, 'player2', e.target.value)}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-5 font-semibold text-slate-900 dark:text-white">
                            <div className="flex flex-col">
                              <span>{match.player2.name}</span>
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
                              className={`text-[11px] font-bold uppercase tracking-wider py-2.5 px-5 rounded-lg transition-all ${match.status === 'completed' ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-default' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-600/20'}`}
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
            <div className="text-center py-20 bg-white dark:bg-slate-900/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
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
