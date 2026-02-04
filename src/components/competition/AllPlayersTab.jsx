import { useState, useMemo } from 'react';
import { Search, Trash2, AlertTriangle, X, UserX } from 'lucide-react';

const AllPlayersTab = ({ 
  allPlayers, 
  handleDeletePlayer,
  handleDeleteAllPlayers
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return allPlayers;
    
    const lower = searchQuery.toLowerCase();
    return allPlayers.filter(p => 
      p.name?.toLowerCase().includes(lower) || 
      p.club?.toLowerCase().includes(lower)
    );
  }, [allPlayers, searchQuery]);

  const handleDeleteAllConfirmed = async () => {
    if (filteredPlayers.length === 0) return;
    
    const confirmed = window.confirm(
      `Sigurno želite obrisati ${filteredPlayers.length} igrača? Ova akcija se ne može poništiti!`
    );
    
    if (confirmed) {
      await handleDeleteAllPlayers(filteredPlayers.map(p => p.id));
      setShowDeleteAllConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Svi Igrači</h2>
          <p className="text-slate-500 text-sm mt-1">
            Ukupno {allPlayers.length} igrača • Prikazano {filteredPlayers.length}
          </p>
        </div>
        
        {filteredPlayers.length > 0 && (
          <button
            onClick={() => setShowDeleteAllConfirm(true)}
            className="bg-red-50 dark:bg-red-600/10 hover:bg-red-100 dark:hover:bg-red-600/20 border border-red-200 dark:border-red-600/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
          >
            <Trash2 size={16} />
            Obriši Sve Filtrirane ({filteredPlayers.length})
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-xl">
        <input 
          type="text"
          placeholder="Pretraži po imenu ili klubu..."
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 pl-10 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none shadow-sm dark:shadow-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Delete All Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 dark:bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-red-600 dark:text-red-500" size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Potvrda brisanja</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
              Sigurno želite obrisati <span className="font-bold text-slate-900 dark:text-white">{filteredPlayers.length}</span> filtriranih igrača? 
              Ova akcija je trajna i ne može se poništiti.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white py-2.5 rounded-lg font-bold text-sm transition-all"
              >
                Otkaži
              </button>
              <button
                onClick={handleDeleteAllConfirmed}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg shadow-red-600/20"
              >
                Obriši Sve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Players List */}
      {filteredPlayers.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
          <UserX className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {searchQuery ? 'Nema rezultata' : 'Nema igrača'}
          </h3>
          <p className="text-slate-500 text-sm">
            {searchQuery 
              ? 'Pokušajte promijeniti pretragu.' 
              : 'Igrači će se pojaviti ovdje kada ih dodate.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPlayers.map(player => (
            <div
              key={player.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-blue-500 dark:hover:border-slate-700 transition-all group shadow-sm dark:shadow-none"
            >
              {/* Player Info */}
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 truncate">
                  {player.name}
                </h3>
                {player.club && (
                  <p className="text-xs text-slate-500 truncate font-medium">
                    {player.club}
                  </p>
                )}
              </div>

              {/* Stats (if available) */}
              {player.rating && (
                <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Rejting</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{player.rating}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <button
                onClick={() => handleDeletePlayer(player.id)}
                className="w-full bg-red-50 dark:bg-red-600/10 hover:bg-red-100 dark:hover:bg-red-600/20 text-red-600 dark:text-red-400 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={12} />
                Obriši Igrača
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllPlayersTab;
