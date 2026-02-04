import { useState, useMemo } from 'react';
import { Search, Trash2, AlertTriangle, Edit2, X } from 'lucide-react';

const AllMatchesTab = ({ 
  allMatches, 
  categories, 
  allPlayers,
  setEditingMatch, 
  setShowMatchModal,
  handleDeleteMatch,
  handleDeleteAllMatches
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  const filteredMatches = useMemo(() => {
    let filtered = [...allMatches];

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(m => m.categoryId === filterCategory);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(m => m.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.player1?.name?.toLowerCase().includes(lower) || 
        m.player2?.name?.toLowerCase().includes(lower)
      );
    }

    // Sort by creation date (newest first)
    return filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [allMatches, filterCategory, filterStatus, searchQuery]);

  const handleDeleteAllConfirmed = async () => {
    if (filteredMatches.length === 0) return;
    
    const confirmed = window.confirm(
      `Sigurno želite obrisati ${filteredMatches.length} mečeva? Ova akcija se ne može poništiti!`
    );
    
    if (confirmed) {
      await handleDeleteAllMatches(filteredMatches.map(m => m.id));
      setShowDeleteAllConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Svi Mečevi</h2>
          <p className="text-slate-500 text-sm mt-1">
            Ukupno {allMatches.length} mečeva • Prikazano {filteredMatches.length}
          </p>
        </div>
        
        {filteredMatches.length > 0 && (
          <button
            onClick={() => setShowDeleteAllConfirm(true)}
            className="bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-400 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
          >
            <Trash2 size={16} />
            Obriši Sve Filtrirane ({filteredMatches.length})
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <input 
            type="text"
            placeholder="Pretraži po imenu igrača..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 pl-10 text-sm text-white focus:border-blue-500 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
        >
          <option value="all">Sve kategorije</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
        >
          <option value="all">Svi statusi</option>
          <option value="pending">Predstojći</option>
          <option value="completed">Završeni</option>
        </select>
      </div>

      {/* Delete All Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-red-500" size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Potvrda brisanja</h3>
            </div>
            <p className="text-slate-400 text-sm mb-6">
              Sigurno želite obrisati <span className="font-bold text-white">{filteredMatches.length}</span> filtriranih mečeva? 
              Ova akcija je trajna i ne može se poništiti.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg font-bold text-sm transition-all"
              >
                Otkaži
              </button>
              <button
                onClick={handleDeleteAllConfirmed}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-bold text-sm transition-all"
              >
                Obriši Sve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Matches List */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 rounded-xl border border-slate-800">
          <Search className="w-12 h-12 mx-auto mb-3 text-slate-700" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {searchQuery || filterCategory !== 'all' || filterStatus !== 'all' 
              ? 'Nema rezultata' 
              : 'Nema mečeva'
            }
          </h3>
          <p className="text-slate-500 text-sm">
            {searchQuery || filterCategory !== 'all' || filterStatus !== 'all'
              ? 'Pokušajte promijeniti filtere pretrage.'
              : 'Mečevi će se pojaviti ovdje kada ih generirate u kategorijama.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMatches.map(match => {
            const category = categories.find(c => c.id === match.categoryId);
            const p1Win = match.status === 'completed' && match.player1Score > match.player2Score;
            const p2Win = match.status === 'completed' && match.player2Score > match.player1Score;

            return (
              <div
                key={match.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all group"
              >
                {/* Category Badge */}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider bg-blue-500/10 px-2 py-1 rounded-md">
                    {category?.name || 'N/A'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {match.isKnockout 
                      ? (match.roundName || `Runda ${match.round}`) 
                      : `Grupa ${String.fromCharCode(65 + (match.groupId || 0))}`
                    }
                  </span>
                </div>

                {/* Players & Scores */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-bold truncate ${p1Win ? 'text-green-400' : 'text-slate-400'}`}>
                      {match.player1?.name || 'TBD'}
                    </span>
                    <span className={`text-lg font-bold ml-2 ${p1Win ? 'text-white' : 'text-slate-600'}`}>
                      {match.player1Score || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-bold truncate ${p2Win ? 'text-green-400' : 'text-slate-400'}`}>
                      {match.player2?.name || 'TBD'}
                    </span>
                    <span className={`text-lg font-bold ml-2 ${p2Win ? 'text-white' : 'text-slate-600'}`}>
                      {match.player2Score || 0}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-3">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${
                    match.status === 'completed' 
                      ? 'bg-green-500/10 text-green-400' 
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {match.status === 'completed' ? 'Završeno' : 'Predstojći'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setEditingMatch(match);
                      setShowMatchModal(true);
                    }}
                    className="flex-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Edit2 size={12} />
                    Uredi
                  </button>
                  <button
                    onClick={() => handleDeleteMatch(match.id)}
                    className="bg-red-600/10 hover:bg-red-600/20 text-red-400 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AllMatchesTab;
