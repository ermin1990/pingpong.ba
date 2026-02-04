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
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Pregled Kategorija</h2>
        
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map(cat => (
              <div 
                key={cat.id} 
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                }}
                className={`p-5 rounded-xl border cursor-pointer transition-all shadow-sm dark:shadow-none ${selectedCategoryId === cat.id ? 'bg-white dark:bg-slate-800 border-blue-500 ring-1 ring-blue-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">{cat.name}</h3>
                  <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-950/50 rounded-lg font-bold border border-slate-100 dark:border-none">
                    {competitionSlug && (
                      <>
                        <a 
                          href={`/p/${competitionSlug}?category=${cat.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-all shadow-sm border border-slate-100 dark:border-none"
                          title="Otvori javni link"
                        >
                          <ExternalLink size={14} />
                        </a>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const code = `<iframe src="${window.location.origin}/p/${competitionSlug}?category=${cat.id}&embed=true" width="100%" height="800" frameborder="0"></iframe>`;
                            navigator.clipboard.writeText(code);
                            alert('Iframe kod za ugradnju je kopiran u međuspremnik!');
                          }}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-all shadow-sm border border-slate-100 dark:border-none"
                          title="Kopiraj iframe kod za blog"
                        >
                          <Code size={14} />
                        </button>
                      </>
                    )}
                    <span className={`text-[10px] px-2 py-1 rounded font-black uppercase tracking-wider ${cat.status === 'active' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                      {cat.status}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">{cat.format === 'round_robin' ? 'Liga' : 'Grupe + KO'}</span>
                  <span className="font-bold text-blue-600 dark:text-blue-500">{cat.playerIds?.length || 0} igrača</span>
                </div>

                {selectedCategoryId === cat.id && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                      className="text-xs font-bold text-red-600 dark:text-red-500 flex items-center gap-1 hover:underline"
                    >
                      <Trash2 size={12} /> Obriši
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveTab('players'); }}
                      className="text-xs font-bold text-blue-600 dark:text-blue-500 flex items-center gap-1 hover:underline"
                    >
                      Upravljaj <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}

            <div className="p-5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
              <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Plus size={16} /> Nova Disciplina
              </h3>
              <form onSubmit={handleAddCategory} className="space-y-3">
                <input 
                  placeholder="Naziv (npr. Seniori)" 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none font-medium placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  required
                />
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none font-medium"
                  value={newCategoryFormat}
                  onChange={(e) => setNewCategoryFormat(e.target.value)}
                >
                  <option value="round_robin">Samo Liga (Round Robin)</option>
                  <option value="groups_knockout">Grupe + Eliminiacije</option>
                  <option value="direct_knockout">Direktne Eliminacije</option>
                </select>
                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs transition-all shadow-md shadow-blue-500/20 active:scale-95">
                  Dodaj Kategoriju
                </button>
              </form>
            </div>
          </div>
      </div>

      <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Pomoć i Upute</h2>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm dark:shadow-none">
            <div className="flex gap-4 mb-6">
               <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-500 h-fit">
                  <Info size={24} />
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
