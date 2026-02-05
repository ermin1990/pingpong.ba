import { Trophy, X, Save, Settings2, CheckCircle, Clock, Plus, Trash2, AlertTriangle } from 'lucide-react';

const SettingsTab = ({ 
  activeCategory, 
  handleUpdateSettings,
  handleToggleStage,
  handleDeleteCompetition,
  isSuperAdmin,
  isOwner
}) => {
  const isGroupsCompleted = activeCategory?.stages?.groups?.completed || false;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Dugme za status faze */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isGroupsCompleted ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500'}`}>
              {isGroupsCompleted ? <CheckCircle size={24} /> : <Clock size={24} />}
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Grupna faza je {isGroupsCompleted ? 'završena' : 'u toku'}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Markiranje završetka omogućava prelazak u knockout fazu</p>
            </div>
          </div>
          <button 
            onClick={() => handleToggleStage('groups', !isGroupsCompleted)}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              isGroupsCompleted 
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700' 
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'
            }`}
          >
            {isGroupsCompleted ? 'Ponovo otvori grupe' : 'Završi grupnu fazu'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <Settings2 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Postavke Kategorije</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Definišite sistem bodovanja i pravila za {activeCategory?.name}</p>
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
        </div>

        <div className="mt-12 flex items-center gap-4">
          <button 
            onClick={() => handleUpdateSettings({
              winPoints: Number(document.getElementById('winPointsInput').value),
              lossPoints: Number(document.getElementById('lossPointsInput').value),
              advancingPlayers: Number(document.getElementById('advancingPlayersInput').value),
              setsToWin: Number(document.getElementById('setsToWinInput').value)
            })}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3"
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
