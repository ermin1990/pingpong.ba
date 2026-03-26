import { Search, X, Edit2 } from 'lucide-react';

const GlobalMatchSearch = ({ 
  matchSearchQuery, 
  setMatchSearchQuery, 
  searchTableId,
  setSearchTableId,
  tables = [],
  filteredGlobalMatches = [], 
  categories = [], 
  setEditingMatch, 
  setShowMatchModal 
}) => {
  return (
    <div className="mb-8 space-y-4">
      {/* Global Search Panel */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-[32px] p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-600/20">
            <Search size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-1">Brza Pretraga</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Pretražite meč po imenu igrača ili odaberite konkretan stol
            </p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="UNESITE IME IGRAČA..." 
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 pl-12 text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400"
              value={matchSearchQuery}
              onChange={(e) => setMatchSearchQuery(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            {matchSearchQuery && (
              <button 
                onClick={() => setMatchSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="w-full md:w-64">
            <select
              value={searchTableId}
              onChange={(e) => setSearchTableId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none appearance-none cursor-pointer"
            >
              <option value="">Svi stolovi</option>
              {Array.isArray(tables) && tables.map(table => (
                <option key={table.id} value={table.id}>
                  {table.name}
                </option>
              ))}
            </select>
          </div>

          {(matchSearchQuery || searchTableId) && (
            <button 
              onClick={() => {
                setMatchSearchQuery('');
                setSearchTableId('');
              }}
              className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              Poništi
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {(matchSearchQuery || searchTableId) && (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.5)]"></div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest italic">
                Rezultati Pretrage ({filteredGlobalMatches?.length || 0})
              </h4>
            </div>
            <button 
              onClick={() => {
                setMatchSearchQuery('');
                setSearchTableId('');
              }} 
              className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
            >
              Zatvori
            </button>
          </div>
          
          {(filteredGlobalMatches?.length || 0) > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
              {filteredGlobalMatches.map(match => {
                const category = Array.isArray(categories) ? categories.find(c => c.id === match.categoryId) : null;
                const isCompleted = match.status === 'completed';
                const p1 = match.player1 || { name: 'TBD' };
                const p2 = match.player2 || { name: 'TBD' };
                const s1 = match.player1Score || 0;
                const s2 = match.player2Score || 0;
                
                return (
                  <div 
                    key={match.id}
                    onClick={() => {
                      setEditingMatch(match);
                      setShowMatchModal(true);
                    }}
                    className="group cursor-pointer bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all relative overflow-hidden"
                  >
                     <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="bg-blue-600 text-white p-1.5 rounded-full shadow-lg transform translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform">
                             <Edit2 size={12} />
                         </div>
                     </div>

                    <div className="flex justify-between items-center mb-4">
                         <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                            {category?.name || 'N/A'}
                         </span>
                         {match.table && (
                             <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-100 dark:bg-blue-600/10 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-500/20">
                                 {match.table}
                             </span>
                         )}
                    </div>

                    <div className="space-y-3">
                         <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-black uppercase tracking-tight truncate max-w-[120px] ${isCompleted && s1 > s2 ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {p1.name}
                                </span>
                             </div>
                             <span className={`text-lg font-black italic tracking-tighter ${isCompleted && s1 > s2 ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                                 {s1}
                             </span>
                         </div>
                         
                         <div className="h-px bg-slate-200 dark:bg-slate-800 w-full"></div>

                         <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-black uppercase tracking-tight truncate max-w-[120px] ${isCompleted && s2 > s1 ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {p2.name}
                                </span>
                             </div>
                             <span className={`text-lg font-black italic tracking-tighter ${isCompleted && s2 > s1 ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                                 {s2}
                             </span>
                         </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isCompleted ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {isCompleted ? 'Završeno' : 'U Toku'}
                            </span>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                             {match.isKnockout ? (match.roundName || 'KO') : `GR ${String.fromCharCode(65 + (match.groupId || 0))}`}
                        </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Nije pronađen nijedan meč
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalMatchSearch;
