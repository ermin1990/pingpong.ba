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
  newCategoryType,
  setNewCategoryType,
  handleAddCategory,
  handleDeleteCategory,
  competitionSlug
}) => {
  const activeCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.75fr)_minmax(280px,0.95fr)] gap-5">
      <div className="space-y-5">
        <div className="bg-slate-950/90 border border-slate-800 rounded-[24px] p-5 sm:p-6 shadow-lg">
          <h2 className="text-lg font-black text-white uppercase italic tracking-tight mb-1.5 flex items-center gap-3">
             <Trophy size={20} className="text-sky-400" /> KATEGORIJE / DISCIPLINE
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            KLIKNITE NA KATEGORIJU DA UPRAVLJATE IGRAČIMA I MEČEVIMA
          </p>
        </div>
        
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {categories.map(cat => (
              <div 
                key={cat.id} 
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                }}
                className={`p-5 sm:p-6 rounded-[24px] border transition-all cursor-pointer group relative overflow-hidden h-full flex flex-col justify-between min-h-[180px] ${selectedCategoryId === cat.id ? 'bg-sky-500/10 border-sky-400/40 shadow-lg shadow-sky-950/20' : 'bg-slate-950/90 border-slate-800 hover:border-slate-700 shadow-md'}`}
              >
                <div className="relative z-10 flex justify-between items-start gap-4 mb-6">
                  <h3 className={`font-black uppercase italic tracking-tight text-xl leading-tight ${selectedCategoryId === cat.id ? 'text-white' : 'text-slate-100'}`}>{cat.name}</h3>
                  <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border ${selectedCategoryId === cat.id ? 'bg-sky-400/10 border-sky-300/20' : 'bg-slate-950/50 border-slate-800'}`}>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${selectedCategoryId === cat.id ? 'text-sky-200' : 'text-slate-400'}`}>
                      {cat.status === 'active' ? 'AKTIVAN' : 'DRAFT'}
                    </span>
                  </div>
                </div>
                
                <div className="relative z-10 flex justify-between items-end mt-auto">
                  <div className="flex flex-col gap-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${selectedCategoryId === cat.id ? 'text-slate-300' : 'text-slate-400'}`}>
                      {cat.type === 'doubles' ? 'DUBL' : 'SINGL'} • {cat.format === 'round_robin' ? 'LIGA' : 'GRUPE + KO'}
                    </span>
                    <span className={`text-[11px] font-black uppercase tracking-widest ${selectedCategoryId === cat.id ? 'text-sky-200' : 'text-sky-400'}`}>{cat.playerIds?.length || 0} IGRAČA</span>
                  </div>
                  
                  {selectedCategoryId === cat.id && (
                    <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                        className="p-2.5 bg-slate-900/70 text-slate-200 hover:bg-slate-950 rounded-xl transition-all border border-slate-700"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveTab('players'); }}
                        className="bg-sky-600 text-white rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <span>UPRAVLJAJ</span> <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className={`absolute inset-0 -z-0 ${selectedCategoryId === cat.id ? 'bg-gradient-to-br from-sky-500/8 to-cyan-400/5' : 'bg-slate-950/80'}`}></div>
              </div>
            ))}

            <div className="p-5 sm:p-6 rounded-[24px] border border-dashed border-slate-800 bg-slate-950/40 flex flex-col justify-center min-h-[220px]">
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center justify-center gap-3">
                <Plus size={18} className="text-sky-400" /> NOVA KATEGORIJA
              </h3>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Naziv kategorije</label>
                  <input 
                    placeholder="npr. Seniori, Veterani..." 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest text-white focus:border-sky-500 outline-none transition-all placeholder:text-slate-800"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Format igre</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewCategoryType('singles')}
                      className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        newCategoryType === 'singles' 
                          ? 'bg-sky-500/15 border-sky-400/40 text-sky-100 shadow-md shadow-sky-950/20' 
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-white'
                      }`}
                    >
                      SINGL
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCategoryType('doubles')}
                      className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        newCategoryType === 'doubles' 
                          ? 'bg-sky-500/15 border-sky-400/40 text-sky-100 shadow-md shadow-sky-950/20' 
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-white'
                      }`}
                    >
                      DUBL
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Tip takmičenja</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest text-white focus:border-sky-500 outline-none transition-all cursor-pointer appearance-none"
                    value={newCategoryFormat}
                    onChange={(e) => setNewCategoryFormat(e.target.value)}
                  >
                    <option value="round_robin">LIGA (ROUND ROBIN)</option>
                    <option value="groups_knockout">GRUPE + ELIMINACIJE</option>
                    <option value="direct_knockout">DIREKTNE ELIMINACIJE</option>
                  </select>
                </div>
                <button className="w-full bg-sky-600 hover:bg-sky-500 text-white font-black py-3 rounded-xl text-[11px] uppercase tracking-widest transition-all shadow-md shadow-sky-950/20 mt-2">
                  Dodaj Kategoriju
                </button>
              </form>
            </div>
          </div>
      </div>

      <div className="space-y-4">
          <div className="bg-slate-950/90 border border-slate-800 p-5 sm:p-6 rounded-[24px] shadow-lg">
            <div className="flex gap-4 mb-6">
               <div className="p-3 bg-sky-500/10 rounded-2xl text-sky-400 h-fit border border-sky-500/20">
                  <Info size={24} />
               </div>
               <div>
                  <h3 className="font-black text-white uppercase italic tracking-tighter text-lg mb-1">Strukturiranje turnira</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-bold uppercase tracking-tight">
                    Svaki turnir može imati više kategorija (npr. Muškarci, Žene, Dubl). Za svaku kategoriju nezavisno unosite igrače i generišete mečeve.
                  </p>
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-start gap-4 p-4 bg-slate-950 border border-slate-800 rounded-2xl group transition-all hover:border-sky-500/30">
                  <PlayCircle className="text-sky-400 mt-1" size={20} />
                  <div>
                    <h4 className="font-black text-white uppercase tracking-widest text-xs mb-1">Liga (Round Robin)</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-black uppercase tracking-tight">Svako sa svakim u okviru kategorije. Najbolji na tabeli je pobjednik.</p>
                  </div>
               </div>
               <div className="flex items-start gap-4 p-4 bg-slate-950 border border-slate-800 rounded-2xl group transition-all hover:border-sky-500/30">
                  <Zap className="text-sky-400 mt-1" size={20} />
                  <div>
                    <h4 className="font-black text-white uppercase tracking-widest text-xs mb-1">Grupe + Eliminacije</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-black uppercase tracking-tight">Igrači se prvo takmiče u grupama, a zatim najbolji idu u nokaut fazu.</p>
                  </div>
               </div>
               <div className="flex items-start gap-4 p-4 bg-slate-950 border border-slate-800 rounded-2xl group transition-all hover:border-sky-500/30">
                  <Settings2 className="text-sky-400 mt-1" size={20} />
                  <div>
                    <h4 className="font-black text-white uppercase tracking-widest text-xs mb-1">Dodatne Opcije</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-black uppercase tracking-tight">Kliknite na dugme "Upravljaj" da biste podesili žrijeb i pravila bodovanja.</p>
                  </div>
               </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default CategoriesTab;
