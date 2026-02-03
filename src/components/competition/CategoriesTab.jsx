import { Plus, ChevronRight, Info, Target, Users, PlayCircle, Zap, Settings2, ExternalLink, Code } from 'lucide-react';

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
  competitionSlug
}) => {
  const activeCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-xl font-bold text-white mb-4">Pregled Kategorija</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map(cat => (
            <div 
              key={cat.id} 
              onClick={() => {
                setSelectedCategoryId(cat.id);
              }}
              className={`p-5 rounded-xl border cursor-pointer transition-all ${selectedCategoryId === cat.id ? 'bg-slate-800 border-blue-500 ring-1 ring-blue-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg text-white">{cat.name}</h3>
                <div className="flex items-center gap-1.5 p-1 bg-slate-950/50 rounded-lg">
                  {competitionSlug && (
                    <>
                      <a 
                        href={`/p/${competitionSlug}?category=${cat.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-md transition-all"
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
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-md transition-all"
                        title="Kopiraj iframe kod za blog"
                      >
                        <Code size={14} />
                      </button>
                    </>
                  )}
                  <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${cat.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                    {cat.status}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-sm text-slate-400">
                <span>{cat.format === 'round_robin' ? 'Liga' : 'Grupe + KO'}</span>
                <span className="font-bold text-blue-500">{cat.playerIds?.length || 0} igrača</span>
              </div>

              {selectedCategoryId === cat.id && (
                <div className="mt-4 pt-4 border-t border-slate-700 flex justify-end">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveTab('players'); }}
                    className="text-xs font-bold text-blue-500 flex items-center gap-1 hover:underline"
                  >
                    Upravljaj <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Nova kategorija */}
          <div className="p-5 rounded-xl border border-dashed border-slate-700 bg-slate-900/50">
            <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
              <Plus size={16} /> Nova Disciplina
            </h3>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <input 
                placeholder="Naziv (npr. Seniori)" 
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <select 
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                value={newCategoryFormat}
                onChange={(e) => setNewCategoryFormat(e.target.value)}
              >
                <option value="round_robin">Round Robin (Liga)</option>
                <option value="groups_knockout">Grupa + Knockout</option>
              </select>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold text-sm transition-all">
                Dodaj
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-800 sticky top-8">
          <h3 className="font-bold text-slate-400 mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Info size={16} /> Informacije
          </h3>
          {selectedCategoryId ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Kategorija</p>
                <p className="font-bold text-xl text-white">{activeCategory?.name}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs text-slate-500 font-bold uppercase">Format Takmičenja</p>
                <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-700">
                  <p className="text-sm font-bold text-blue-400">{activeCategory?.format === 'round_robin' ? 'Round Robin' : 'Grupe + KO'}</p>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                 <button onClick={() => setActiveTab('players')} className="w-full flex items-center justify-between p-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-all text-sm font-bold text-white">
                    Lista Igrača <Users size={16} />
                 </button>
                 <button 
                   onClick={() => setActiveTab('matches')} 
                   className="w-full flex items-center justify-between p-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-all text-sm font-bold text-white"
                 >
                    Vidi Raspored <PlayCircle size={16} />
                 </button>
                 <button 
                   onClick={() => setActiveTab('knockout')} 
                   className="w-full flex items-center justify-between p-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-all text-sm font-bold text-white"
                 >
                    Eliminaciona Faza <Zap size={16} />
                 </button>
                 <button 
                   onClick={() => setActiveTab('settings')} 
                   className="w-full flex items-center justify-between p-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-all text-sm font-bold text-white"
                 >
                    Postavke Kategorije <Settings2 size={16} />
                 </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 opacity-30">
              <Target size={40} className="mx-auto mb-4 text-slate-500" />
              <p className="text-sm italic text-slate-400">Izaberite disciplinu lijevo...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoriesTab;
