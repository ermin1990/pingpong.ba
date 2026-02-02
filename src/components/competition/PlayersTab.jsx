import { Search, Plus, Target, CheckCircle } from 'lucide-react';

const PlayersTab = ({ 
  activeCategory, 
  searchTerm, 
  setSearchTerm, 
  showOnlySelected, 
  setShowOnlySelected, 
  allPlayers, 
  selectedPlayers, 
  togglePlayerSelection, 
  assignedPlayerIds, 
  saveSelectedPlayers, 
  setShowAddPlayer 
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Roster: {activeCategory?.name}</h2>
          <p className="text-slate-500 text-sm font-medium">Upravljajte listom igrača za ovu disciplinu.</p>
        </div>
        <div className="flex gap-2 text-white">
          <button 
            onClick={() => setShowAddPlayer(true)}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Dodaj Nove
          </button>
          <button 
            onClick={saveSelectedPlayers}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
          >
            <Target size={16} /> Sačuvaj Listu
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="flex bg-slate-950 p-1 rounded-lg">
            <button 
              onClick={() => setShowOnlySelected(true)}
              className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${showOnlySelected ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Učesnici ({selectedPlayers.length})
            </button>
            <button 
              onClick={() => setShowOnlySelected(false)}
              className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${!showOnlySelected ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Svi Igrači
            </button>
          </div>

          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
             <input 
              type="text" 
              placeholder="Filtriraj..." 
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-blue-500 outline-none" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 gap-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {allPlayers
              .filter(p => !showOnlySelected || selectedPlayers.includes(p.id))
              .filter(p => !assignedPlayerIds.includes(p.id))
              .filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.club && p.club.toLowerCase().includes(searchTerm.toLowerCase())))
              .map(player => (
              <div 
                key={player.id}
                onClick={() => togglePlayerSelection(player.id)}
                className={`p-2.5 rounded-lg border-2 cursor-pointer transition-all ${selectedPlayers.includes(player.id) ? 'bg-blue-600/10 border-blue-500 text-white shadow-sm shadow-blue-500/10' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="truncate">
                    <p className={`font-bold text-[11px] truncate ${selectedPlayers.includes(player.id) ? 'text-white' : 'text-slate-200'}`}>{player.name}</p>
                    <p className="text-[9px] text-slate-500 truncate">{player.club || 'Individual'}</p>
                  </div>
                  {selectedPlayers.includes(player.id) && (
                    <CheckCircle size={14} className="text-blue-500 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayersTab;
