import { Trophy, X, Save, Settings2, CheckCircle, Clock, Plus, Trash2, AlertTriangle, Layers, ChevronDown } from 'lucide-react';

const SettingsTab = ({ 
  activeCategory, 
  handleUpdateSettings,
  handleToggleStage,
  handleDeleteCompetition,
  isSuperAdmin,
  isOwner,
  seasonCategories = []
}) => {
  const isGroupsCompleted = activeCategory?.stages?.groups?.completed || false;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Dugme za status faze */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-[32px] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isGroupsCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'}`}>
              {isGroupsCompleted ? <CheckCircle size={28} /> : <Clock size={28} />}
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest italic">
                Grupna faza je {isGroupsCompleted ? 'završena' : 'u toku'}
              </h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                Markiranje završetka omogućava prelazak u knockout fazu
              </p>
            </div>
          </div>
          <button 
            onClick={() => handleToggleStage('groups', !isGroupsCompleted)}
            className={`w-full sm:w-auto px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              isGroupsCompleted 
              ? 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800' 
              : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 hover:scale-105 active:scale-95'
            }`}
          >
            {isGroupsCompleted ? 'Ponovo otvori grupe' : 'Završi grupnu fazu'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-[32px] p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <Settings2 size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Postavke Kategorije</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Definišite sistem bodovanja i pravila za {activeCategory?.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">Bodovi za pobjedu</label>
            <div className="relative">
              <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" size={18} />
              <input 
                type="number"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-4 pl-12 pr-4 text-slate-900 dark:text-white font-bold text-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                defaultValue={activeCategory?.winPoints ?? 2}
                id="winPointsInput"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">Bodovi za poraz</label>
            <div className="relative">
              <X className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" size={18} />
              <input 
                type="number"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-4 pl-12 pr-4 text-slate-900 dark:text-white font-bold text-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                defaultValue={activeCategory?.lossPoints ?? 0}
                id="lossPointsInput"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">Prolazi igrača dalje</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600">
                <Settings2 size={18} />
              </div>
              <input 
                type="number"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-4 pl-12 pr-4 text-blue-600 dark:text-blue-400 font-bold text-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                defaultValue={activeCategory?.advancingPlayers ?? 2}
                placeholder="2"
                id="advancingPlayersInput"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">Setova za pobjedu</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600">
                <Trophy size={18} />
              </div>
              <input 
                type="number"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-4 pl-12 pr-4 text-slate-900 dark:text-white font-bold text-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                defaultValue={activeCategory?.setsToWin ?? 2}
                id="setsToWinInput"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">Sezonski Tag (Podgrupa)</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600">
                <Layers size={18} />
              </div>
              {seasonCategories.length > 0 ? (
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-4 pl-12 pr-4 text-slate-900 dark:text-white font-bold text-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                  defaultValue={activeCategory?.seasonalTag || ''}
                  id="seasonalTagInput"
                >
                  <option value="">Izaberite kategoriju sezone</option>
                  {seasonCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              ) : (
                <input 
                  type="text"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-4 pl-12 pr-4 text-slate-900 dark:text-white font-bold text-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  defaultValue={activeCategory?.seasonalTag || (activeCategory?.name?.includes('Amater') ? 'Amateri-2026' : (activeCategory?.name || ''))}
                  placeholder="Npr. Muskarci-2026"
                  id="seasonalTagInput"
                />
              )}
              {seasonCategories.length > 0 && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown size={18} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-3 mb-6">
                <Trophy className="text-amber-500" size={20} />
                <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest italic">Bodovanje po pozicijama (Sezonska Tabela)</h4>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(pos => (
                   <div key={pos} className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Poz #{pos}</label>
                      <input 
                        type="number"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center text-slate-900 dark:text-white font-black text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all border-b-2 border-b-blue-500"
                        defaultValue={activeCategory?.positionPoints?.[pos] || (pos === 1 ? 50 : pos === 2 ? 40 : pos === 3 ? 35 : pos === 4 ? 30 : pos === 5 ? 25 : pos === 6 ? 20 : pos === 7 ? 15 : 10)}
                        id={`posPoints-${pos}`}
                      />
                   </div>
                ))}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">9. mjesto i dalje</label>
                  <input 
                    type="number"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center text-slate-900 dark:text-white font-black text-sm outline-none focus:ring-2 focus:ring-amber-500/20 transition-all border-b-2 border-b-amber-500"
                    defaultValue={activeCategory?.positionPoints?.['others'] || 5}
                    id="posPoints-others"
                  />
                </div>
             </div>
             <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-4 italic">
                * Svaka pobjeda donosi {activeCategory?.winPoints || 5} bodova, a ovi dodatni bodovi se dodjeljuju na osnovu konačnog ranga (1-8 po tabeli, 9+ dobijaju fiksno).
             </p>
          </div>

          <button 
            onClick={() => {
              const posPoints = {};
              [1, 2, 3, 4, 5, 6, 7, 8].forEach(pos => {
                posPoints[pos] = Number(document.getElementById(`posPoints-${pos}`).value);
              });
              posPoints['others'] = Number(document.getElementById('posPoints-others').value);

              handleUpdateSettings({
                winPoints: Number(document.getElementById('winPointsInput').value),
                lossPoints: Number(document.getElementById('lossPointsInput').value),
                advancingPlayers: Number(document.getElementById('advancingPlayersInput').value),
                setsToWin: Number(document.getElementById('setsToWinInput').value),
                seasonalTag: document.getElementById('seasonalTagInput').value,
                positionPoints: posPoints
              });
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95"
          >
            <Save size={20} /> Sačuvaj sve izmjene
          </button>
        </div>
      </div>

      {(isSuperAdmin || isOwner) && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-lg p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center text-red-600 dark:text-red-500">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-red-700 dark:text-red-500">Opasna Zona</h3>
              <p className="text-red-600/70 dark:text-red-500/50 text-xs font-medium">Ove akcije su trajne i ne mogu se poništiti</p>
            </div>
          </div>
          
          <button 
            onClick={handleDeleteCompetition}
            className="w-full bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/30 text-red-600 hover:bg-red-600 hover:text-white py-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-lg hover:shadow-red-600/20"
          >
            <Trash2 size={20} /> Obriši cijelo takmičenje
          </button>
        </div>
      )}
    </div>
  );
};

export default SettingsTab;
