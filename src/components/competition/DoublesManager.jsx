import { Users, Trash2, Plus, UserPlus, Info } from 'lucide-react';
import { useState } from 'react';

const DoublesManager = ({ 
  activeCategory, 
  allPlayers, 
  selectedPlayers, 
  onSavePairs 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pairs are stored in activeCategory.pairs = [{id: 'pair1', playerIds: [uid1, uid2], name: 'Player 1 / Player 2'}]
  const pairs = activeCategory?.doublesPairs || [];
  
  // Get players who are part of this category but not yet in a pair
  const pairedPlayerIds = pairs.flatMap(p => p.playerIds);
  const availablePlayers = allPlayers
    .filter(p => selectedPlayers.includes(p.id))
    .filter(p => !pairedPlayerIds.includes(p.id))
    .filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const [selectedForPair, setSelectedForPair] = useState([]);

  const togglePlayerForPair = (playerId) => {
    if (selectedForPair.includes(playerId)) {
      setSelectedForPair(prev => prev.filter(id => id !== playerId));
    } else {
      if (selectedForPair.length < 2) {
        setSelectedForPair(prev => [...prev, playerId]);
      }
    }
  };

  const handleCreatePair = () => {
    if (selectedForPair.length !== 2) return;
    
    const p1 = allPlayers.find(p => p.id === selectedForPair[0]);
    const p2 = allPlayers.find(p => p.id === selectedForPair[1]);
    
    const newPair = {
      id: `pair_${Date.now()}`,
      playerIds: selectedForPair,
      name: `${p1.name} / ${p2.name}`,
      createdAt: new Date()
    };
    
    onSavePairs([...pairs, newPair]);
    setSelectedForPair([]);
  };

  const handleDeletePair = (pairId) => {
    onSavePairs(pairs.filter(p => p.id !== pairId));
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 flex gap-3 text-amber-800 dark:text-amber-400">
        <Info size={20} className="shrink-0" />
        <p className="text-xs font-bold leading-relaxed uppercase tracking-tight">
          Ovo je kategorija za dublove. Prvo kreirajte parove od igrača koje ste odabrali kao učesnike. 
          Tek nakon kreiranja parova možete generisati mečeve u tabu "Mečevi".
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Create Pairs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <UserPlus size={16} className="text-blue-600" /> Dostupni Igrači
            </h3>
            <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg uppercase tracking-widest">
              {availablePlayers.length} Slobodnih
            </span>
          </div>

          <div className="relative">
            <input 
              type="text" 
              placeholder="Traži slobodne igrače..." 
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-tight outline-none focus:border-blue-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {availablePlayers.map(player => (
              <div 
                key={player.id}
                onClick={() => togglePlayerForPair(player.id)}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center ${
                  selectedForPair.includes(player.id)
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-[1.02]' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300'
                }`}
              >
                <div>
                  <p className={`text-[11px] font-black uppercase tracking-tight ${selectedForPair.includes(player.id) ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {player.name}
                  </p>
                  <p className={`text-[9px] font-bold uppercase tracking-widest ${selectedForPair.includes(player.id) ? 'text-blue-100' : 'text-slate-500'}`}>
                    {player.club || 'Individualac'}
                  </p>
                </div>
                {selectedForPair.includes(player.id) && <Plus size={14} />}
              </div>
            ))}
            {availablePlayers.length === 0 && (
              <div className="text-center py-10 opacity-30">
                <Users size={32} className="mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest">Nema slobodnih igrača</p>
              </div>
            )}
          </div>

          {selectedForPair.length === 2 && (
            <button 
              onClick={handleCreatePair}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all animate-in zoom-in-95 duration-200"
            >
              Napravi Par
            </button>
          )}
        </div>

        {/* Right: Existing Pairs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <Users size={16} className="text-emerald-600" /> Kreirani Parovi
            </h3>
            <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-lg uppercase tracking-widest">
              {pairs.length} Parova
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {pairs.map((pair, idx) => (
              <div key={pair.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm group hover:border-blue-500/30 transition-all">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl mb-3">
                   <p className="text-xs font-black text-blue-600 dark:text-blue-400 flex items-center gap-2 uppercase tracking-tighter">
                     <span className="bg-blue-600 text-white w-5 h-5 flex items-center justify-center rounded-lg text-[10px]">{idx + 1}</span>
                      {pair.name}
                   </p>
                   <button 
                    onClick={() => handleDeletePair(pair.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                   >
                     <Trash2 size={14} />
                   </button>
                </div>
                <div className="grid grid-cols-2 gap-4 divide-x divide-slate-100 dark:divide-slate-800">
                  {pair.playerIds.map(pid => {
                    const p = allPlayers.find(pl => pl.id === pid);
                    return (
                      <div key={pid} className="px-2">
                        <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{p?.name}</p>
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest truncate">{p?.club}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {pairs.length === 0 && (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-950/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Users size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nema kreiranih parova</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoublesManager;
