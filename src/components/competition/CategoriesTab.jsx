import { Plus, ChevronRight, Info, Target, Users, PlayCircle, Zap, Settings2, ExternalLink, Code, Trash2, Trophy } from 'lucide-react';

const CategoriesTab = ({ 
  categories, 
  selectedCategoryId, 
  setSelectedCategoryId, 
  setActiveTab, 
  newCategoryName, 
  setNewCategoryName, 
  newCategoryFormat, 
  setNewCategoryFormat, 
  handleAddCategory,
  handleDeleteCategory,
  competitionSlug
}) => {
  const activeCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-blue-600/5 dark:bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 mb-4">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1 flex items-center gap-2">
             <Trophy size={16} className="text-blue-500" /> Kategorije / Discipline
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
            Kliknite na kategoriju da upravljate igračima i mečevima
          </p>
        </div>
        
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map(cat => (
              <div 
                key={cat.id} 
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer group ${selectedCategoryId === cat.id ? 'bg-blue-600 border-blue-400 shadow-xl shadow-blue-500/20 z-10' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-slate-700'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className={`font-black uppercase tracking-tighter text-lg ${selectedCategoryId === cat.id ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{cat.name}</h3>
                  <div className={`flex items-center gap-1.5 p-1 rounded-lg border ${selectedCategoryId === cat.id ? 'bg-white/10 border-white/20' : 'bg-slate-50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800'}`}>
                    {competitionSlug && (
                      <a 
                        href={`/p/${competitionSlug}?category=${cat.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={`p-1.5 rounded transition-all ${selectedCategoryId === cat.id ? 'text-blue-100 hover:bg-white/20 hover:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800'}`}
                        title="Otvori javni link"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${selectedCategoryId === cat.id ? 'bg-white/30 text-white' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                      {cat.status === 'active' ? 'Aktivan' : 'Draft'}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${selectedCategoryId === cat.id ? 'text-blue-50' : 'text-slate-500'}`}>{cat.format === 'round_robin' ? 'LIga' : 'Grupe + KO'}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${selectedCategoryId === cat.id ? 'text-white' : 'text-blue-600 whitespace-nowrap'}`}>{cat.playerIds?.length || 0} Igrača</span>
                </div>

                {selectedCategoryId === cat.id && (
                  <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                      className="px-3 py-1.5 bg-white/10 text-white hover:bg-red-500/80 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 group/del"
                    >
                      <Trash2 size={12} className="group-hover/del:scale-110 transition-transform" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveTab('players'); }}
                      className="flex-1 bg-white text-blue-600 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg flex items-center justify-center gap-2 group/manage"
                    >
                      <span>Upravljaj</span> <ChevronRight size={12} className="group-hover/manage:translate-x-1 transition-transform" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-center">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
                <Plus size={14} /> Nova Kategorija
              </h3>
              <form onSubmit={handleAddCategory} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">Naziv kategorije</label>
                  <input 
                    placeholder="npr. Seniori, Veterani..." 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">Tip takmičenja</label>
                  <select 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    value={newCategoryFormat}
                    onChange={(e) => setNewCategoryFormat(e.target.value)}
                  >
                    <option value="round_robin">Liga (Round Robin)</option>
                    <option value="groups_knockout">Grupe + Eliminacije</option>
                    <option value="direct_knockout">Direktne Eliminacije</option>
                  </select>
                </div>
                <button className="w-full bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold py-2.5 rounded-lg text-sm transition-all shadow-md">
                  Dodaj Kategoriju
                </button>
              </form>
            </div>
          </div>
      </div>

      <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Pomoć i Upute</h2>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 rounded-lg">
            <div className="flex gap-3 mb-5">
               <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400 h-fit">
                  <Info size={20} />
               </div>
               <div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-1">Strukturiranje turnira</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    Svaki turnir može imati više kategorija (npr. Muškarci, Žene, Dubl). 
                    Za svaku kategoriju nezavisno unosite igrače i generišete mečeve.
                  </p>
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 group">
                  <PlayCircle className="text-blue-600 dark:text-blue-500 mt-1" size={20} />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Liga (Round Robin)</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Svako sa svakim u okviru kategorije. Najbolji na tabeli je pobjednik.</p>
                  </div>
               </div>
               <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 group">
                  <Zap className="text-yellow-600 dark:text-yellow-500 mt-1" size={20} />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Grupe + Eliminacije</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Igrači se prvo takmiče u grupama, a zatim najbolji idu u nokaut fazu.</p>
                  </div>
               </div>
               <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 group">
                  <Settings2 className="text-emerald-600 dark:text-emerald-500 mt-1" size={20} />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Dodatne Opcije</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Kliknite na dugme "Upravljaj" da biste podesili žrijeb i pravila bodovanja.</p>
                  </div>
               </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default CategoriesTab;
