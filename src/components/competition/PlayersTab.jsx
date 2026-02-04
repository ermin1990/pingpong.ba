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
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm dark:shadow-none transition-colors">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-500 border border-blue-100 dark:border-blue-500/20">
            <Users size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Roster: {activeCategory?.name}</h2>
            <div className="flex items-center gap-3 mt-1 font-bold">
              <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                {selectedPlayers.length} Igrača
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                {seededPlayers.length} Nosioca
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          <button 
            onClick={() => setShowAddPlayer(true)}
            className="flex-1 xl:flex-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <Plus size={16} /> Dodaj Novog
          </button>
          <button 
            onClick={saveSelectedPlayers}
            className="flex-1 xl:flex-none bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 active:scale-95"
          >
            <Target size={16} /> Sačuvaj Roster
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Pretraži igrače po imenu ili klubu..." 
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm dark:shadow-none font-medium" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 min-w-[280px]">
            <button 
              onClick={() => setShowOnlySelected(false)}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!showOnlySelected ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-md dark:shadow-xl' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
            >
              Svi Igrači ({allPlayers.length})
            </button>
            <button 
              onClick={() => setShowOnlySelected(true)}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showOnlySelected ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
            >
              Učesnici ({selectedPlayers.length})
            </button>
          </div>
        </div>

        {/* Players Grid */}
        <div className="min-h-[400px]">
          {allPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-950/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm dark:shadow-none">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-700 mb-4">
                <Users size={32} />
              </div>
              <p className="text-lg font-bold text-slate-400">Nema registrovanih igrača</p>
              <p className="text-sm text-slate-500 mt-2 max-w-xs text-center font-medium">Prvo dodajte igrače u sistem putem stranice "Igrači" ili kliknite na dugme iznad.</p>
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm dark:shadow-none">
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
                    className={`group relative p-5 rounded-3xl border-2 transition-all cursor-pointer overflow-hidden ${
                      isSelected 
                        ? 'bg-blue-50/50 dark:bg-blue-600/5 border-blue-500 ring-4 ring-blue-500/5 shadow-md shadow-blue-500/5 hover:border-blue-400' 
                        : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 shadow-sm dark:shadow-none'
                    }`}
                  >
                    {/* Background Pattern for Selected */}
                    {isSelected && (
                      <div className="absolute top-0 right-0 p-1">
                         <div className="bg-blue-500 text-white rounded-full p-1 shadow-lg">
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
                          className="p-2 -mr-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 md:opacity-0 md:group-hover:opacity-100 transition-all rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm md:shadow-none"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>

                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/50">
                        <div className="flex flex-wrap gap-1.5">
                          {isAssigned && (
                            <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                              U žrijebu
                            </span>
                          )}
                          {isSeeded && (
                            <span className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-500/20 flex items-center gap-1 shadow-sm">
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
                            className={`p-2 rounded-xl transition-all shadow-sm ${
                              isSeeded 
                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 active:scale-90 scale-105' 
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
