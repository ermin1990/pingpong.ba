import { Plus, ChevronRight, Info, Target, Users, PlayCircle, Zap, Settings2, ExternalLink, Code, Trash2 } from 'lucide-react';

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
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Kategorije / Discipline</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Kliknite na kategoriju da upravljate igračima i mečevima
          </p>
        </div>
        
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map(cat => (
              <div 
                key={cat.id} 
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                }}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selectedCategoryId === cat.id ? 'bg-white dark:bg-slate-800 border-blue-500 ring-2 ring-blue-500/20 shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{cat.name}</h3>
                  <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-950/50 rounded-md border border-slate-100 dark:border-slate-800">
                    {competitionSlug && (
                      <>
                        <a 
                          href={`/p/${competitionSlug}?category=${cat.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 rounded transition-all"
                          title="Otvori javni link"
                        >
                          <ExternalLink size={14} />
                        </a>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const code = `<iframe src="${window.location.origin}/p/${competitionSlug}?category=${cat.id}&embed=true" width="100%" height="800" frameborder="0"></iframe>`;
                            navigator.clipboard.writeText(code);
                            alert('Iframe kod za ugradnju je kopiran!');
                          }}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 rounded transition-all"
                          title="Kopiraj iframe kod"
                        >
                          <Code size={14} />
                        </button>
                      </>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${cat.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                      {cat.status === 'active' ? 'Aktivna' : 'Draft'}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">{cat.format === 'round_robin' ? 'Liga' : 'Grupe + KO'}</span>
                  <span className="font-bold text-blue-600 dark:text-blue-500">{cat.playerIds?.length || 0} igrača</span>
                </div>

                {selectedCategoryId === cat.id && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                      className="px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-md text-xs font-bold flex items-center gap-1.5 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all border border-red-200 dark:border-red-500/20"
                    >
                      <Trash2 size={12} /> Obriši
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveTab('players'); }}
                      className="px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-sm"
                    >
                      Upravljaj <ChevronRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}

            <div className="p-4 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Plus size={16} /> Dodaj Novu Kategoriju
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
