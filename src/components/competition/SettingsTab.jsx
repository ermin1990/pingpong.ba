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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">Tip Kategorije</label>
            <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl gap-1">
              <button 
                onClick={() => {
                  const newType = 'singles';
                  const winPoints = Number(document.getElementById('winPointsInput').value);
                  const lossPoints = Number(document.getElementById('lossPointsInput').value);
                  const advancingPlayers = Number(document.getElementById('advancingPlayersInput').value);
                  const setsToWin = Number(document.getElementById('setsToWinInput').value);
                  handleUpdateSettings({ type: newType, winPoints, lossPoints, advancingPlayers, setsToWin });
                }}
                className={`flex-1 py-3 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory?.type !== 'doubles' ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Singl
              </button>
              <button 
                onClick={() => {
                  const newType = 'doubles';
                  const winPoints = Number(document.getElementById('winPointsInput').value);
                  const lossPoints = Number(document.getElementById('lossPointsInput').value);
                  const advancingPlayers = Number(document.getElementById('advancingPlayersInput').value);
                  const setsToWin = Number(document.getElementById('setsToWinInput').value);
                  handleUpdateSettings({ type: newType, winPoints, lossPoints, advancingPlayers, setsToWin });
                }}
                className={`flex-1 py-3 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory?.type === 'doubles' ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Dubl
              </button>
            </div>
          </div>

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
            onClick={() => {
              const type = activeCategory?.type || 'singles';
              const winPoints = Number(document.getElementById('winPointsInput').value);
              const lossPoints = Number(document.getElementById('lossPointsInput').value);
              const advancingPlayers = Number(document.getElementById('advancingPlayersInput').value);
              const setsToWin = Number(document.getElementById('setsToWinInput').value);
              
              handleUpdateSettings({
                type,
                winPoints,
                lossPoints,
                advancingPlayers,
                setsToWin
              });
            }}
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
