import { Trophy, X, Save, Settings2, CheckCircle, Clock, Plus, Trash2, AlertTriangle } from 'lucide-react';

const SettingsTab = ({ 
  activeCategory, 
  handleUpdateSettings,
  handleUpdateFormat,
  handleToggleStage,
  handleDeleteCompetition,
  isSuperAdmin,
  isOwner
}) => {
  const isGroupsCompleted = activeCategory?.stages?.groups?.completed || false;
  const isDirectKnockout = activeCategory?.format === 'direct_knockout';

  return (
    <div className="max-w-4xl mx-auto space-y-5 p-5 sm:p-6">
      {/* Dugme za status faze */}
      {!isDirectKnockout && (
      <div className="bg-slate-950/90 border border-slate-800 rounded-[24px] p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isGroupsCompleted ? 'bg-emerald-500 text-white shadow-md shadow-emerald-950/20' : 'bg-sky-600 text-white shadow-md shadow-sky-950/20'}`}>
              {isGroupsCompleted ? <CheckCircle size={28} /> : <Clock size={28} />}
            </div>
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-widest italic">
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
              ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800' 
              : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-950/20'
            }`}
          >
            {isGroupsCompleted ? 'Ponovo otvori grupe' : 'Završi grupnu fazu'}
          </button>
        </div>
      </div>
      )}

      <div className="bg-slate-950/90 border border-slate-800 rounded-[24px] p-5 sm:p-6 shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-11 h-11 bg-sky-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-sky-950/20">
            <Settings2 size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Postavke Kategorije</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Definišite sistem bodovanja i pravila za {activeCategory?.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Format Kategorije</label>
            <select
              value={activeCategory?.format || 'round_robin'}
              onChange={(e) => handleUpdateFormat && handleUpdateFormat(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white font-bold text-sm focus:border-sky-500 outline-none transition-all"
            >
              <option value="round_robin">Liga (Round Robin)</option>
              <option value="groups_knockout">Grupe + Eliminacije</option>
              <option value="direct_knockout">Direktne Eliminacije</option>
            </select>
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Tip Kategorije</label>
            <div className="flex bg-slate-900/50 p-1 rounded-xl gap-1 border border-slate-800">
              <button 
                onClick={() => {
                  const newType = 'singles';
                  const winPoints = Number(document.getElementById('winPointsInput').value);
                  const lossPoints = Number(document.getElementById('lossPointsInput').value);
                  const advancingPlayers = Number(document.getElementById('advancingPlayersInput').value);
                  const setsToWin = Number(document.getElementById('setsToWinInput').value);
                  handleUpdateSettings({ type: newType, winPoints, lossPoints, advancingPlayers, setsToWin });
                }}
                className={`flex-1 py-3 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory?.type !== 'doubles' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}
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
                className={`flex-1 py-3 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory?.type === 'doubles' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}
              >
                Dubl
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Bodovi za pobjedu</label>
            <div className="relative">
              <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="number"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white font-bold text-xl focus:border-sky-500 outline-none transition-all"
                defaultValue={activeCategory?.winPoints ?? 2}
                id="winPointsInput"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Bodovi za poraz</label>
            <div className="relative">
              <X className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="number"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white font-bold text-xl focus:border-sky-500 outline-none transition-all"
                defaultValue={activeCategory?.lossPoints ?? 0}
                id="lossPointsInput"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Prolazi igrača dalje</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <Settings2 size={18} />
              </div>
              <input 
                type="number"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sky-400 font-bold text-xl focus:border-sky-500 outline-none transition-all"
                defaultValue={activeCategory?.advancingPlayers ?? 2}
                placeholder="2"
                id="advancingPlayersInput"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Setova za pobjedu</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <Trophy size={18} />
              </div>
              <input 
                type="number"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white font-bold text-xl focus:border-sky-500 outline-none transition-all"
                defaultValue={activeCategory?.setsToWin ?? 2}
                id="setsToWinInput"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-4">
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
            className="flex-1 bg-sky-600 hover:bg-sky-500 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-sky-950/20 flex items-center justify-center gap-3"
          >
            <Save size={20} /> Sačuvaj sve izmjene
          </button>
        </div>
      </div>

      {(isSuperAdmin || isOwner) && (
        <div className="bg-red-500/5 border border-red-500/15 rounded-[20px] p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-11 h-11 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-red-400">Opasna Zona</h3>
              <p className="text-red-400/60 text-xs font-medium">Ove akcije su trajne i ne mogu se poništiti</p>
            </div>
          </div>
          
          <button 
            onClick={handleDeleteCompetition}
            className="w-full bg-slate-950 border border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-lg hover:shadow-red-600/20"
          >
            <Trash2 size={20} /> Obriši cijelo takmičenje
          </button>
        </div>
      )}
    </div>
  );
};

export default SettingsTab;
