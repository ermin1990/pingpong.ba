import { Search, X, Edit2 } from 'lucide-react';

const GlobalMatchSearch = ({ 
  matchSearchQuery, 
  setMatchSearchQuery, 
  filteredGlobalMatches, 
  categories, 
  setEditingMatch, 
  setShowMatchModal 
}) => {
  return (
    <div className="mb-10 max-w-3xl mx-auto space-y-4">
      <div className="relative group">
        <input 
          type="text" 
          placeholder="Pretraži BILO KOJI meč u takmičenju (po imenu igrača)..." 
          className="w-full bg-slate-950 border border-slate-800 rounded-3xl py-4 pl-14 pr-6 text-sm text-white font-bold outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-600 shadow-2xl"
          value={matchSearchQuery}
          onChange={(e) => setMatchSearchQuery(e.target.value)}
        />
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={20} />
        {matchSearchQuery && (
          <button 
            onClick={() => setMatchSearchQuery('')}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {matchSearchQuery && (
        <div className="bg-slate-900 border border-blue-500/20 rounded-[2rem] p-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 z-[60] relative">
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Rezultati Pretrage ({filteredGlobalMatches.length})</h4>
            </div>
            <button onClick={() => setMatchSearchQuery('')} className="text-[10px] text-slate-500 font-bold uppercase hover:text-white tracking-widest">Zatvori</button>
          </div>
          
          {filteredGlobalMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredGlobalMatches.map(match => {
                const catName = categories.find(c => c.id === match.categoryId)?.name || 'Kategorija';
                return (
                  <div 
                    key={match.id}
                    onClick={() => {
                      setEditingMatch(match);
                      setShowMatchModal(true);
                      setMatchSearchQuery('');
                    }}
                    className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl hover:border-blue-500/40 cursor-pointer transition-all flex flex-col gap-3 group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                        {catName}
                      </span>
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                        {match.isKnockout ? (match.roundName || `Runda ${match.round}`) : `Grupa ${String.fromCharCode(65 + (match.groupId || 0))}`}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-bold ${match.status === 'completed' && match.player1Score > match.player2Score ? 'text-white' : 'text-slate-500'}`}>{match.player1.name}</span>
                        <span className="text-sm font-black text-white">{match.player1Score || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-bold ${match.status === 'completed' && match.player2Score > match.player1Score ? 'text-white' : 'text-slate-500'}`}>{match.player2.name}</span>
                        <span className="text-sm font-black text-white">{match.player2Score || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-end pt-2 border-t border-slate-900 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit2 size={12} className="text-blue-500" />
                      <span className="text-[9px] font-black uppercase text-blue-500 tracking-widest">Uredi rezultat</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 opacity-30 italic text-sm text-slate-500 font-bold uppercase tracking-widest">Nije pronađen nijedan meč za "{matchSearchQuery}"</div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalMatchSearch;
