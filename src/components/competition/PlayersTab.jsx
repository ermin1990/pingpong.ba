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
    <div className="space-y-5">
      {/* Enhanced Header with Stats */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-[24px] p-5 sm:p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-sky-500/12 rounded-2xl flex items-center justify-center text-sky-300 border border-sky-500/15 shadow-md shadow-sky-950/20">
              <Users size={22} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white uppercase italic tracking-tight leading-none mb-1.5">{activeCategory?.name}</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-sky-400 tracking-widest leading-none">
                  {selectedPlayers.length} / {allPlayers.length} Igrača
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-800" />
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none">
                  {seededPlayers.length} Nosioca
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setShowAddPlayer(true)}
              className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-700"
            >
              Dodaj Igrača
            </button>
            <button 
              onClick={saveSelectedPlayers}
              className="flex-1 sm:flex-none bg-sky-600 hover:bg-sky-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-sky-950/20"
            >
              Sačuvaj Promjene
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Search and Filter Bar */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-[20px] p-2">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input 
                type="text" 
                placeholder="Traži po imenu ili klubu..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-[10px] font-black uppercase tracking-widest text-white focus:border-sky-500 outline-none transition-all placeholder:text-slate-700" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex bg-slate-900 p-1 rounded-xl gap-1">
              <button 
                onClick={() => setShowOnlySelected(false)}
                className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!showOnlySelected ? 'bg-sky-600 text-white shadow-md shadow-sky-950/20' : 'text-slate-500 hover:text-white'}`}
              >
                Svi Lista ({allPlayers.length})
              </button>
              <button 
                onClick={() => setShowOnlySelected(true)}
                className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${showOnlySelected ? 'bg-sky-600 text-white shadow-md shadow-sky-950/20' : 'text-slate-500 hover:text-white'}`}
              >
                Prijavljeni ({selectedPlayers.length})
              </button>
            </div>
          </div>
        </div>

        {/* Players Grid */}
        <div className="min-h-[400px]">
          {allPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-[#0f172a] border-2 border-dashed border-slate-800 rounded-[32px]">
              <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-slate-800 mb-6">
                <Users size={32} />
              </div>
              <p className="text-xl font-black text-white uppercase italic tracking-tighter">Nema igrača</p>
              <p className="text-[10px] text-slate-500 mt-2 font-black uppercase tracking-widest">Dodajte prve učesnike u sistem</p>
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[#0f172a] border border-slate-800 rounded-[32px]">
              <Search className="w-12 h-12 text-slate-800 mb-4" />
              <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Nema rezultata za pretragu</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredPlayers.map(player => {
                const isSelected = selectedPlayers.includes(player.id);
                const isSeeded = seededPlayers.includes(player.id);
                const isAssigned = assignedPlayerIds.includes(player.id);
                
                return (
                  <div 
                    key={player.id}
                    onClick={() => togglePlayerSelection(player.id)}
                    className={`group relative p-4 rounded-[18px] border transition-all cursor-pointer overflow-hidden min-h-[156px] ${
                      isSelected 
                        ? 'bg-sky-500/8 border-sky-400/35 shadow-md shadow-sky-950/20' 
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5">
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlayerSeed(player.id);
                          }}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                            isSeeded
                              ? 'border-amber-400/50 bg-amber-400 text-slate-950 shadow-sm shadow-amber-950/30'
                              : 'border-slate-700 bg-slate-950/90 text-slate-500 hover:border-sky-400/40 hover:text-sky-300'
                          }`}
                          title={isSeeded ? "Ukloni nosioca" : "Postavi nosioca"}
                          aria-label={isSeeded ? `Ukloni ${player.name} iz nosioca` : `Postavi ${player.name} za nosioca`}
                        >
                          <Star size={14} fill={isSeeded ? "currentColor" : "none"} />
                        </button>
                        <div className="bg-sky-500 text-white rounded-lg p-1.5 shadow-md shadow-sky-950/20">
                          <CheckCircle size={14} />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 mr-8">
                          <h3 className={`font-black text-[13px] uppercase italic tracking-tight leading-tight transition-colors ${isSelected ? 'text-sky-300' : 'text-white'}`}>
                            {player.name}
                          </h3>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1.5 truncate">
                            {player.club || 'Individualac'}
                          </p>
                        </div>
                        
                        {!isSelected && (
                          <button
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditPlayer(player);
                            }}
                            className="p-2 -mr-2 text-slate-600 hover:text-white transition-all rounded-lg opacity-0 group-hover:opacity-100"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-800/60">
                        <div className="flex flex-wrap gap-2">
                          {isAssigned && (
                            <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase px-2 py-0.5 rounded-md border border-emerald-500/20">
                              U Žrijebu
                            </span>
                          )}
                          {isSeeded && (
                            <span className="bg-sky-500/10 text-sky-300 text-[8px] font-black uppercase px-2 py-0.5 rounded-md border border-sky-500/20 flex items-center gap-1">
                              <Star size={8} fill="currentColor" /> Nosilac
                            </span>
                          )}
                        </div>
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
