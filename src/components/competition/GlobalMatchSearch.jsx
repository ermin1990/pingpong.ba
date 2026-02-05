import { Search, X, Edit2, Star } from 'lucide-react';

const GlobalMatchSearch = ({ 
  matchSearchQuery, 
  setMatchSearchQuery, 
  filteredGlobalMatches, 
  categories, 
  setEditingMatch, 
  setShowMatchModal 
}) => {
  return (
    <div className="mb-8 space-y-4">
      {/* Global Search Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
            <Search size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Brza Pretraga Mečeva</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Pretražite bilo koji meč u takmičenju po imenu igrača - rezultati će se prikazati ispod
            </p>
          </div>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Unesite ime igrača za pretragu..." 
            className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 pl-11 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium"
            value={matchSearchQuery}
            onChange={(e) => setMatchSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors" size={18} />
          {matchSearchQuery && (
            <button 
              onClick={() => setMatchSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {matchSearchQuery && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Rezultati Pretrage ({filteredGlobalMatches.length})
              </h4>
            </div>
            <button 
              onClick={() => setMatchSearchQuery('')} 
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
            >
              Zatvori
            </button>
          </div>
          
          {filteredGlobalMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-2">
              {filteredGlobalMatches.map(match => {
                const category = categories.find(c => c.id === match.categoryId);
                const catName = category?.name || 'Kategorija';
                const seededIds = category?.seededPlayerIds || [];
                return (
                  <div 
                    key={match.id}
                    onClick={() => {
                      setEditingMatch(match);
                      setShowMatchModal(true);
                      setMatchSearchQuery('');
                    }}
                    className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-3.5 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md cursor-pointer transition-all flex flex-col gap-3 group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-500/20">
                        {catName}
                      </span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {match.isKnockout ? (match.roundName || `R${match.round}`) : `Grupa ${String.fromCharCode(65 + (match.groupId || 0))}`}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5 truncate flex-1 mr-2">
                          <span className={`text-sm font-bold truncate ${match.status === 'completed' && match.player1Score > match.player2Score ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                            {match.player1.name}
                          </span>
                          {seededIds.includes(match.player1.id) && <Star size={10} className="text-amber-500 fill-amber-500 shrink-0" />}
                        </div>
                        <span className="text-base font-bold text-slate-900 dark:text-white">{match.player1Score || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5 truncate flex-1 mr-2">
                          <span className={`text-sm font-bold truncate ${match.status === 'completed' && match.player2Score > match.player1Score ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                            {match.player2.name}
                          </span>
                          {seededIds.includes(match.player2.id) && <Star size={10} className="text-amber-500 fill-amber-500 shrink-0" />}
                        </div>
                        <span className="text-base font-bold text-slate-900 dark:text-white">{match.player2Score || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 dark:bg-amber-400 text-slate-900 rounded-md text-xs font-bold hover:bg-amber-500 dark:hover:bg-amber-500 transition-all opacity-0 group-hover:opacity-100">
                        <Edit2 size={12} />
                        <span>Uredi</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700">
              <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Nije pronađen nijedan meč za "<span className="font-bold text-slate-900 dark:text-white">{matchSearchQuery}</span>"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalMatchSearch;
