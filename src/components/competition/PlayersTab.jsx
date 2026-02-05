import { Search, Plus, Target, CheckCircle, Users, Star, Edit2 } from 'lucide-react';

const PlayersTab = ({ 
  activeCategory, 
  searchTerm, 
  setSearchTerm, 
  showOnlySelected, 
  setShowOnlySelected, 
  allPlayers = [], 
  selectedPlayers = [], 
  seededPlayers = [],
  togglePlayerSelection, 
  togglePlayerSeed,
  onEditPlayer,
  assignedPlayerIds = [], 
  saveSelectedPlayers, 
  setShowAddPlayer 
}) => {
  const filteredPlayers = allPlayers
    .filter(p => !showOnlySelected || selectedPlayers.includes(p.id))
    .filter(p => !searchTerm || (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) || (p.club && p.club.toLowerCase().includes(searchTerm.toLowerCase())))
    .sort((a, b) => {
      const aSeeded = seededPlayers.includes(a.id);
      const bSeeded = seededPlayers.includes(b.id);
      if (aSeeded && !bSeeded) return -1;
      if (!aSeeded && bSeeded) return 1;
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-5">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Roster: {activeCategory?.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {selectedPlayers.length} izabrano • {seededPlayers.length} nosilaca
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full xl:w-auto">
            <button 
              onClick={() => setShowAddPlayer(true)}
              className="flex-1 xl:flex-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
            >
              <Plus size={16} /> Dodaj Igrača
            </button>
            <button 
              onClick={saveSelectedPlayers}
              className="flex-1 xl:flex-none bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <Target size={16} /> Sačuvaj Roster
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 font-medium">
            Pretraži i filtriraj igrače:
          </p>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Traži po imenu ili klubu..." 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-700 min-w-[260px]">
              <button 
                onClick={() => setShowOnlySelected(false)}
                className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${!showOnlySelected ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
              >
                Svi ({allPlayers.length})
              </button>
              <button 
                onClick={() => setShowOnlySelected(true)}
                className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${showOnlySelected ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
              >
                Učesnici ({selectedPlayers.length})
              </button>
            </div>
          </div>
        </div>

        {/* Players Grid */}
        <div className="min-h-[400px]">
          {allPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-950/20 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
              <div className="w-14 h-14 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-center text-slate-300 dark:text-slate-700 mb-4">
                <Users size={28} />
              </div>
              <p className="text-lg font-bold text-slate-400">Nema registrovanih igrača</p>
              <p className="text-sm text-slate-500 mt-2 max-w-xs text-center font-medium">Prvo dodajte igrače u sistem putem stranice "Igrači" ili kliknite na dugme iznad.</p>
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm dark:shadow-none">
              <Search className="w-12 h-12 text-slate-200 dark:text-slate-800 mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Nema rezultata pretrage</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filteredPlayers.map(player => {
                const isSelected = selectedPlayers.includes(player.id);
                const isSeeded = seededPlayers.includes(player.id);
                const isAssigned = assignedPlayerIds.includes(player.id);
                
                return (
                  <div 
                    key={player.id}
                    onClick={() => togglePlayerSelection(player.id)}
                    className={`group relative p-5 rounded-lg border-2 transition-all cursor-pointer overflow-hidden ${
                      isSelected 
                        ? 'bg-blue-50/50 dark:bg-blue-600/5 border-blue-500 ring-4 ring-blue-500/5 shadow-md shadow-blue-500/5 hover:border-blue-400' 
                        : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 shadow-sm dark:shadow-none'
                    }`}
                  >
                    {/* Background Pattern for Selected */}
                    {isSelected && (
                      <div className="absolute top-0 right-0 p-1">
                         <div className="bg-blue-500 text-white rounded-lg p-1 shadow-lg">
                            <CheckCircle size={16} />
                         </div>
                      </div>
                    )}

                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className={`font-black text-sm uppercase tracking-tight truncate leading-tight transition-colors ${isSelected ? 'text-blue-700 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                            {player.name}
                          </h3>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 truncate">
                            {player.club || 'Individualac'}
                          </p>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditPlayer(player);
                          }}
                          className="p-2 -mr-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 md:opacity-0 md:group-hover:opacity-100 transition-all rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm md:shadow-none"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>

                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/50">
                        <div className="flex flex-wrap gap-1.5">
                          {isAssigned && (
                            <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 text-[8px] font-black uppercase px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-500/20">
                              U žrijebu
                            </span>
                          )}
                          {isSeeded && (
                            <span className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[8px] font-black uppercase px-2 py-0.5 rounded-md border border-amber-100 dark:border-amber-500/20 flex items-center gap-1 shadow-sm">
                              <Star size={8} fill="currentColor" /> Nosilac
                            </span>
                          )}
                        </div>

                        {isSelected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePlayerSeed(player.id);
                            }}
                            className={`p-2 rounded-lg transition-all shadow-sm ${
                              isSeeded 
                                ? 'bg-amber-400 text-black shadow-lg shadow-amber-500/30 active:scale-90 scale-105' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-500 hover:bg-white dark:hover:bg-slate-700 active:scale-90 shadow-sm border border-slate-200 dark:border-slate-700'
                            }`}
                            title={isSeeded ? "Ukloni status nosioca" : "Postavi za nosioca"}
                          >
                            <Star size={14} fill={isSeeded ? "currentColor" : "none"} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayersTab;
