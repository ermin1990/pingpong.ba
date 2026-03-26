import { useState, useMemo } from 'react';
import { Search, Trash2, AlertTriangle, Edit2, X, Star } from 'lucide-react';

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
      {/* Header with Info */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-[32px] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Svi Mečevi ({filteredMatches.length})</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              Globalni pregled svih kategorija i faza
            </p>
          </div>
          
          {filteredMatches.length > 0 && (
            <button
              onClick={() => setShowDeleteAllConfirm(true)}
              className="w-full sm:w-auto bg-red-50 dark:bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-100 dark:border-red-500/20 text-red-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={14} />
              Obriši Filtrirane
            </button>
          )}
        </div>
      </div>

      {/* Global Search - Prominent */}
      <div className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-[32px] p-6 shadow-inset">
        <div className="flex items-center gap-3 mb-4">
           <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <Search size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Brza Pretraga</h3>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Pretražite bilo koji meč u takmičenju</p>
          </div>
        </div>
        <div className="relative">
          <input 
            type="text"
            placeholder="IME IGRAČA..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Filter */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-[24px] p-5 shadow-sm">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1">Kategorija</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="all">Sve kategorije</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-[24px] p-5 shadow-sm">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1">Status Meča</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="all">Svi statusi</option>
            <option value="pending">Predstojeći</option>
            <option value="completed">Završeni</option>
          </select>
        </div>
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
              Sigurno želite obrisati <span className="font-bold text-slate-900 dark:text-white">{filteredMatches.length}</span> filtriranih mečeva? 
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

      {/* Matches List */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-20 bg-slate-950/50 rounded-[32px] border border-dashed border-slate-800">
          <div className="w-16 h-16 mx-auto mb-6 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800">
            <Search className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-black text-white uppercase italic tracking-tighter mb-2">
            {searchQuery || filterCategory !== 'all' || filterStatus !== 'all' 
              ? 'Nema rezultata' 
              : 'Nema Mečeva'
            }
          </h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {searchQuery || filterCategory !== 'all' || filterStatus !== 'all'
              ? 'Pokušajte promijeniti filtere'
              : 'Generirajte mečeve u kategorijama'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMatches.map(match => {
            const category = categories.find(c => c.id === match.categoryId);
            const seededIds = category?.seededPlayerIds || [];
            const p1 = match.player1 || { name: 'TBD' };
            const p2 = match.player2 || { name: 'TBD' };
            const s1 = match.player1Score || 0;
            const s2 = match.player2Score || 0;
            const isCompleted = match.status === 'completed';

            // Determination of winner for colorful display
            const p1Winner = isCompleted && s1 > s2;
            const p2Winner = isCompleted && s2 > s1;

            return (
              <div
                key={match.id}
                className="group relative bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-3xl p-5 hover:border-blue-500/50 transition-all overflow-hidden"
              >
                  {/* Floating Action Overlay */}
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 z-20">
                    <button
                      onClick={() => {
                        setEditingMatch(match);
                        setShowMatchModal(true);
                      }}
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:scale-105 transition-all shadow-lg shadow-blue-600/30"
                    >
                      <div className="flex items-center gap-2">
                          <Edit2 size={14} />
                          <span>Uredi Rezultat</span>
                      </div>
                    </button>
                    <button
                        onClick={() => handleDeleteMatch(match.id)}
                        className="bg-red-500/10 text-red-500 p-3 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                        title="Obriši"
                    >
                        <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Context Header */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                            {category?.name || 'N/A'}
                        </span>
                        {match.table && (
                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                                {match.table}
                            </span>
                        )}
                    </div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        {match.isKnockout 
                        ? (match.roundName || `R ${match.round}`) 
                        : `GR ${String.fromCharCode(65 + (match.groupId || 0))}`
                        }
                    </span>
                  </div>

                  {/* Players & Scores */}
                  <div className="space-y-4 relative z-10">
                    {/* Player 1 */}
                    <div className="flex justify-between items-center group/p1">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-black uppercase tracking-tight transition-colors ${p1Winner ? 'text-emerald-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {p1.name}
                                </span>
                                {seededIds.includes(p1.id) && <Star size={10} className="text-amber-500 fill-amber-500" />}
                            </div>
                            {p1.club && <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{p1.club}</span>}
                        </div>
                        <div className={`text-2xl font-black italic tracking-tighter ${p1Winner ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-200'} `}>
                            {s1}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-slate-100 dark:bg-slate-800 w-full"></div>

                    {/* Player 2 */}
                    <div className="flex justify-between items-center group/p2">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-black uppercase tracking-tight transition-colors ${p2Winner ? 'text-emerald-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {p2.name}
                                </span>
                                {seededIds.includes(p2.id) && <Star size={10} className="text-amber-500 fill-amber-500" />}
                            </div>
                            {p2.club && <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{p2.club}</span>}
                        </div>
                        <div className={`text-2xl font-black italic tracking-tighter ${p2Winner ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-200'} `}>
                            {s2}
                        </div>
                    </div>
                  </div>
                  
                  {/* Footer Status */}
                   <div className="mt-6 flex justify-between items-center">
                       <div className="flex items-center gap-2">
                           <div className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                           <span className={`text-[9px] font-black uppercase tracking-widest ${isCompleted ? 'text-emerald-500' : 'text-amber-500'}`}>
                               {isCompleted ? 'Završeno' : 'U Toku'}
                           </span>
                       </div>
                       {match.updatedAt && (
                           <span className="text-[9px] font-bold text-slate-600 dark:text-slate-600 uppercase tracking-widest">
                                {new Date(match.updatedAt?.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </span>
                       )}
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
