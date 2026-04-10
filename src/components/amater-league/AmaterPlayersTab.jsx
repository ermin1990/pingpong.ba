import { useState, useEffect } from 'react';
import { Search, Plus, CheckCircle, Users, Star, Edit2 } from 'lucide-react';
import { db } from '../../firebase/config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const AmaterPlayersTab = ({ 
  competitionId,
  categoryId,
  activeCategory,
  allPlayers = [],
  isAmater = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  
  // Local state for immediate UI feedback, synced with props
  const [selectedPlayers, setSelectedPlayers] = useState(activeCategory?.playerIds || []);
  const [seededPlayers, setSeededPlayers] = useState(activeCategory?.seededPlayerIds || []);

  useEffect(() => {
    setSelectedPlayers(activeCategory?.playerIds || []);
    setSeededPlayers(activeCategory?.seededPlayerIds || []);
  }, [activeCategory]);

  const collectionPath = isAmater ? "amater_league_tournaments" : "competitions";

  const togglePlayerSelection = async (playerId) => {
    if (activeCategory?.status !== 'draft') return;

    const newSelected = selectedPlayers.includes(playerId)
      ? selectedPlayers.filter(id => id !== playerId)
      : [...selectedPlayers, playerId];

    setSelectedPlayers(newSelected);
    
    try {
      const catRef = doc(db, collectionPath, competitionId, "categories", categoryId);
      await updateDoc(catRef, {
        playerIds: newSelected,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error updating player selection:", err);
    }
  };

  const togglePlayerSeed = async (e, playerId) => {
    e.stopPropagation();
    if (activeCategory?.status !== 'draft') return;

    const newSeeding = seededPlayers.includes(playerId)
      ? seededPlayers.filter(id => id !== playerId)
      : [...seededPlayers, playerId];

    setSeededPlayers(newSeeding);

    try {
      const catRef = doc(db, collectionPath, competitionId, "categories", categoryId);
      await updateDoc(catRef, {
        seededPlayerIds: newSeeding,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error updating player seeding:", err);
    }
  };

  const filteredPlayers = allPlayers
    .filter(p => !showOnlySelected || selectedPlayers.includes(p.id))
    .filter(p => !searchTerm || 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.club?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aSelected = selectedPlayers.includes(a.id);
      const bSelected = selectedPlayers.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });

  return (
    <div className="p-6 space-y-6 bg-white dark:bg-slate-950">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-900 pb-6">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Igrači Kategorije</h2>
          <div className="flex items-center gap-2">
            <span className="bg-blue-600/10 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
              {selectedPlayers.length} ODABRANIH
            </span>
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
            <input 
              type="text"
              placeholder="PRETRAŽI IGRAČE..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-bold uppercase tracking-wider focus:ring-2 focus:ring-blue-600/20 outline-none text-slate-900 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowOnlySelected(!showOnlySelected)}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              showOnlySelected 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
              : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {showOnlySelected ? 'PRIKAŽI SVE' : 'SAMO ODABRANI'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredPlayers.map(player => {
          const isSelected = selectedPlayers.includes(player.id);
          const isSeeded = seededPlayers.includes(player.id);
          
          return (
            <div 
              key={player.id}
              onClick={() => togglePlayerSelection(player.id)}
              className={`group relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                isSelected 
                ? 'bg-blue-600/5 border-blue-600 shadow-md shadow-blue-600/5' 
                : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-900 hover:border-blue-600/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black italic scale-90 sm:scale-100 ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-400'
                }`}>
                  {player.name?.charAt(0)}
                </div>
                <div>
                  <h3 className={`text-sm font-black uppercase tracking-tight italic ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                    {player.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    {player.club || 'BEZ KLUBA'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isSelected && (
                  <button
                    onClick={(e) => togglePlayerSeed(e, player.id)}
                    className={`p-2 rounded-lg transition-all ${
                      isSeeded 
                      ? 'bg-yellow-400 text-white shadow-lg shadow-yellow-400/20' 
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-400 hover:text-yellow-500'
                    }`}
                  >
                    <Star size={14} fill={isSeeded ? "currentColor" : "none"} />
                  </button>
                )}
                {isSelected ? (
                  <CheckCircle size={20} className="text-blue-600" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-800" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Nema igrača za prikaz.</p>
        </div>
      )}
    </div>
  );
};

export default AmaterPlayersTab;
