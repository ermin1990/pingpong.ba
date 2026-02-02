import { Users, Search, CheckCircle, PlayCircle, X, LayoutGrid, Edit2, ChevronDown } from 'lucide-react';

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
  handleScoreChange 
}) => {
  return (
    <div className="space-y-6">
      <div className={`grid grid-cols-1 ${activeCategory?.status === 'draft' ? 'lg:grid-cols-4' : ''} gap-6`}>
        
        {/* Draft Sidebar */}
        {activeCategory?.status === 'draft' && (
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2 mb-2 px-1 text-slate-500">
              <Users size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Preostali Igrači</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
              <input 
                type="text" 
                placeholder="Traži igrača..." 
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-[10px] text-white outline-none" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {allPlayers
                .filter(p => !showOnlySelected || selectedPlayers.includes(p.id))
                .filter(p => !assignedPlayerIds.includes(p.id))
                .filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(player => (
                  <div 
                    key={player.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('playerId', player.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    className="bg-slate-950/40 border border-slate-800 p-2.5 rounded-xl cursor-grab active:cursor-grabbing hover:border-blue-500/30 transition-all text-slate-300"
                  >
                    <p className="font-bold text-[10px] truncate uppercase">{player.name}</p>
                    <p className="text-[8px] text-slate-600 truncate uppercase mt-0.5">{player.club || 'Bez kluba'}</p>
                  </div>
              ))}
              {allPlayers.filter(p => assignedPlayerIds.includes(p.id)).length === allPlayers.length && (
                <div className="text-center py-10 opacity-20 text-white">
                  <CheckCircle size={24} className="mx-auto mb-2 text-green-500" />
                  <p className="text-[8px] font-black uppercase">Svi su raspoređeni</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Schedule Area */}
        <div className={`${activeCategory?.status === 'draft' ? 'lg:col-span-3' : 'w-full'} space-y-12`}>
          {activeCategory?.format === 'groups_knockout' && groups.length > 0 ? (
            <div className="space-y-12">
              <div className="flex items-center justify-between px-1">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Raspored po grupama</h3>
                  <div className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                    {activeCategory?.status === 'draft' ? 'Prevucite igrače u željene grupe' : 'Pregled tabela i rezultata po grupama'}
                  </div>
                </div>
                
                {activeCategory?.status === 'draft' && (
                   <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-500 font-black uppercase pl-2">Grupe: {groups.length}</span>
                        <div className="flex gap-1">
                          <button onClick={() => setGroups(prev => prev.length > 1 ? prev.slice(0, -1) : prev)} className="w-6 h-6 rounded flex items-center justify-center bg-slate-800 hover:bg-red-500/20 text-white font-bold transition-all">-</button>
                          <button onClick={() => setGroups(prev => [...prev, []])} className="w-6 h-6 rounded flex items-center justify-center bg-slate-800 hover:bg-green-500/20 text-white font-bold transition-all">+</button>
                        </div>
                      </div>
                      <button 
                        onClick={handleGenerateMatches}
                        disabled={generating || selectedPlayers.length < 2}
                        className="bg-white text-slate-900 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95"
                      >
                        <PlayCircle size={14} /> Spremi i kreni
                      </button>
                   </div>
                )}
              </div>
              
              {/* Render helper for brackets */}
              {[
                { title: "Gornji Žrijeb", color: "bg-blue-500", groups: groups.slice(0, Math.ceil(groups.length / 2)), offset: 0 },
                { title: "Donji Žrijeb", color: "bg-indigo-500", groups: groups.slice(Math.ceil(groups.length / 2)), offset: Math.ceil(groups.length / 2) }
              ].map((bracket, bIdx) => (
                <div key={bIdx} className={`space-y-6 ${bIdx > 0 ? 'pt-10 border-t border-slate-800/50' : ''}`}>
                   <div className="flex items-center gap-2 px-1">
                      <div className={`h-6 w-1 ${bracket.color} rounded-full`}></div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-[0.2em]">{bracket.title}</h4>
                   </div>

                   <div className={`grid grid-cols-1 ${activeCategory?.status === 'draft' ? 'xl:grid-cols-2' : 'md:grid-cols-2'} gap-4 md:gap-6`}>
                      {bracket.groups.map((group, localIdx) => {
                        const gIdx = localIdx + bracket.offset;
                        const groupStandings = calculateStandings(gIdx);
                        const groupMatches = matches.filter(m => m.groupId === gIdx);

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
                            className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-slate-800 shadow-xl flex flex-col transition-all duration-300"
                          >
                            <div className="flex justify-between items-center mb-4 px-1">
                              <h4 className="text-xl font-black text-white italic">#{String.fromCharCode(65 + gIdx)}</h4>
                              <div className="flex items-center gap-2">
                                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{group.length} Igrača</span>
                              </div>
                            </div>

                            {activeCategory?.status === 'draft' && (
                              <div className="mb-6 space-y-2 text-white">
                                {group.map(p => (
                                  <div key={p.id} className="bg-slate-950/50 border border-slate-800/50 p-2 rounded-xl flex justify-between items-center group/p">
                                    <div className="truncate">
                                      <p className="font-bold text-white text-[10px] truncate uppercase">{p.name}</p>
                                    </div>
                                    <button onClick={() => removePlayerFromGroups(p.id)} className="p-1 text-slate-500 hover:text-red-500 opacity-0 group-hover/p:opacity-100 transition-opacity"><X size={12} /></button>
                                  </div>
                                ))}
                                {group.length === 0 && (
                                  <div className="border border-dashed border-slate-800 rounded-xl py-6 flex flex-col items-center justify-center text-slate-700">
                                    <span className="text-[8px] font-black uppercase tracking-widest">Prazno</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Tabela Section */}
                            <div className="mb-8">
                              <h5 className="text-[10px] font-black text-slate-500 mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
                                <LayoutGrid size={12} /> Tabela
                              </h5>
                              <div className="space-y-1">
                                <div className="grid grid-cols-12 gap-2 mb-2 text-[8px] font-black text-slate-600 uppercase tracking-widest px-2">
                                  <div className="col-span-6">Igrač</div>
                                  <div className="col-span-1 text-center">P</div>
                                  <div className="col-span-1 text-center">I</div>
                                  <div className="col-span-1 text-center">Set±</div>
                                  <div className="col-span-1 text-center">Gem±</div>
                                  <div className="col-span-2 text-center text-blue-500">B</div>
                                </div>
                                {groupStandings.map((p, idx) => (
                                    <div key={p.id} className="grid grid-cols-12 gap-2 items-center py-2 px-2 bg-slate-950/30 hover:bg-slate-800/40 rounded-lg text-[10px] transition-all duration-200 border border-transparent hover:border-slate-800">
                                      <div className="col-span-6 flex items-center space-x-2 truncate">
                                        <span className="font-black text-slate-700 w-4 text-center">{idx + 1}</span>
                                        <div className="truncate text-white font-bold uppercase">{p.name}</div>
                                      </div>
                                      <div className="col-span-1 text-center font-bold text-slate-400">{p.played}</div>
                                      <div className="col-span-1 text-center font-bold text-slate-400">{p.won}</div>
                                      <div className="col-span-1 text-center font-bold text-slate-500">{p.setsWon - p.setsLost}</div>
                                      <div className="col-span-1 text-center font-bold text-slate-600">{p.pointDiff}</div>
                                      <div className="col-span-2 text-center text-blue-400 font-black">{p.points}</div>
                                    </div>
                                ))}
                              </div>
                            </div>

                            {/* Mečevi Section */}
                            <div>
                                <h5 className="text-[10px] font-black text-slate-500 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <PlayCircle size={12} /> Mečevi
                                </h5>
                                <div className="space-y-3">
                                    {groupMatches.map((match) => (
                                        <div key={match.id} className="bg-slate-950/40 border border-slate-800/50 rounded-xl overflow-hidden hover:border-slate-700 transition-all">
                                            {/* Desktop Match Layout */}
                                            <div className="hidden lg:flex items-center justify-between p-4 gap-4">
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[11px] font-bold text-white truncate">{match.player1.name}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[11px] font-bold text-white truncate">{match.player2.name}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-center gap-2 ml-2 pl-4 border-l border-slate-800">
                                                    <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-2 py-1">
                                                        <span className="text-sm font-black text-white">{match.player1Score ?? 0}</span>
                                                        <span className="text-[10px] text-slate-600">:</span>
                                                        <span className="text-sm font-black text-white">{match.player2Score ?? 0}</span>
                                                    </div>
                                                    <button onClick={() => { setEditingMatch(match); setShowMatchModal(true); }} className="text-[9px] font-black uppercase text-blue-500 hover:text-blue-400">Zapiši</button>
                                                </div>
                                            </div>

                                            {/* Mobile Match Layout */}
                                            <div className="lg:hidden p-3 space-y-3">
                                                <div className="flex justify-between items-center bg-black/20 p-2 rounded-xl">
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] font-bold text-white truncate max-w-[100px]">{match.player1.name}</span>
                                                            <span className="text-xs font-black text-white">{match.player1Score ?? 0}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] font-bold text-white truncate max-w-[100px]">{match.player2.name}</span>
                                                            <span className="text-xs font-black text-white">{match.player2Score ?? 0}</span>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => { setEditingMatch(match); setShowMatchModal(true); }} className="ml-4 w-10 h-10 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center">
                                                        <Edit2 size={16} />
                                                    </button>
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
              <div className="flex items-center gap-3 px-1 border-stone-800 pb-4 border-b">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <PlayCircle className="text-blue-500" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight">Rezultati Mečeva</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Pregled i unos rezultata</p>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[11px] font-bold tracking-wider">
                        <th className="px-6 py-4">Kolo</th>
                        <th className="px-6 py-4">Igrač 1</th>
                        <th className="px-6 py-4 text-center">Rezultat</th>
                        <th className="px-6 py-4">Igrač 2</th>
                        <th className="px-6 py-4 text-right">Akcija</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {matches.map((match) => (
                        <tr key={match.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-5">
                            <span className="font-bold text-white text-sm">Kolo {match.round}</span>
                          </td>
                          <td className="px-6 py-5 font-semibold text-white">{match.player1.name}</td>
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-center gap-2">
                              <input 
                                type="number" 
                                className="w-12 h-12 text-center bg-slate-950 border border-slate-800 rounded-xl font-bold text-lg text-white focus:border-blue-500 outline-none transition-all" 
                                value={match.player1Score || 0}
                                onChange={(e) => handleScoreChange(match.id, 'player1', e.target.value)}
                              />
                              <span className="text-slate-600 font-bold">:</span>
                              <input 
                                type="number" 
                                className="w-12 h-12 text-center bg-slate-950 border border-slate-800 rounded-xl font-bold text-lg text-white focus:border-blue-500 outline-none transition-all" 
                                value={match.player2Score || 0}
                                onChange={(e) => handleScoreChange(match.id, 'player2', e.target.value)}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-5 font-semibold text-white">{match.player2.name}</td>
                          <td className="px-6 py-5 text-right">
                            <button 
                              onClick={() => saveMatchResult(match)}
                              disabled={savingMatchId === match.id}
                              className={`text-[11px] font-bold uppercase tracking-wider py-2.5 px-5 rounded-lg transition-all ${match.status === 'completed' ? 'bg-slate-800 text-slate-500 cursor-default' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'}`}
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
            <div className="text-center py-20 bg-slate-900/20 rounded-3xl border-2 border-dashed border-slate-800">
              <PlayCircle size={48} className="mx-auto text-slate-700 mb-4" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Raspored još nije generisan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchesTab;
