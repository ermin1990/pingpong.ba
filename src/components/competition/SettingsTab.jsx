import { Trophy, X, Save, Settings2, CheckCircle, Clock, Plus } from 'lucide-react';

const SettingsTab = ({ 
  activeCategory, 
  handleUpdateSettings,
  handleToggleStage
}) => {
  const isGroupsCompleted = activeCategory?.stages?.groups?.completed || false;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Dugme za status faze */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isGroupsCompleted ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
              {isGroupsCompleted ? <CheckCircle size={20} /> : <Clock size={20} />}
            </div>
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-tighter">Grupna faza je {isGroupsCompleted ? 'završena' : 'u toku'}</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Markiranje završetka omogućava prelazak u knockout</p>
            </div>
          </div>
          <button 
            onClick={() => handleToggleStage('groups', !isGroupsCompleted)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              isGroupsCompleted 
              ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' 
              : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20'
            }`}
          >
            {isGroupsCompleted ? 'Ponovo otvori' : 'Završi grupe'}
          </button>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
            <Settings2 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Postavke Bodovanja</h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Definišite sistem bodovanja za {activeCategory?.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Bodovi za pobjedu</label>
            <div className="relative">
              <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input 
                type="number"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white font-black text-lg focus:border-blue-500 outline-none transition-all"
                defaultValue={activeCategory?.winPoints ?? 2}
                id="winPointsInput"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Bodovi za poraz</label>
            <div className="relative">
              <X className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input 
                type="number"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white font-black text-lg focus:border-blue-500 outline-none transition-all"
                defaultValue={activeCategory?.lossPoints ?? 0}
                id="lossPointsInput"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Prolazi igrača dalje</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
                <Settings2 size={16} />
              </div>
              <input 
                type="number"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white font-black text-lg focus:border-blue-500 outline-none transition-all text-emerald-500"
                defaultValue={activeCategory?.advancingPlayers ?? 2}
                placeholder="2"
                id="advancingPlayersInput"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800">
          <button 
            onClick={() => {
              const win = document.getElementById('winPointsInput').value;
              const loss = document.getElementById('lossPointsInput').value;
              const advancing = document.getElementById('advancingPlayersInput').value;
              handleUpdateSettings(win, loss, advancing);
            }}
            className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-500 hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95 flex items-center justify-center gap-2"
          >
            <Save size={16} /> Sačuvaj Postavke
          </button>
          <p className="text-center text-[9px] text-slate-600 mt-4 uppercase font-bold tracking-tighter">
            Promjena bodova će automatski ažurirati sve tabele u realnom vremenu.
          </p>
        </div>
      </div>

      <div className="bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-3xl p-12 text-center opacity-40">
        <Plus size={32} className="mx-auto text-slate-700 mb-4" />
        <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Dodatne postavke uskoro...</p>
      </div>
    </div>
  );
};

export default SettingsTab;
