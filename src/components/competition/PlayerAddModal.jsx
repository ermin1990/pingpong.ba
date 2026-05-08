import React from 'react';
import { UserPlus, FileText, X } from 'lucide-react';

const PlayerAddModal = ({ 
  show, 
  onClose, 
  mode, 
  setMode, 
  newPlayerName, 
  setNewPlayerName, 
  newPlayerClub, 
  setNewPlayerClub, 
  bulkPlayerText, 
  setBulkPlayerText, 
  onSingleAdd, 
  onBulkAdd 
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-white uppercase italic tracking-tight">Novi Igrač(i)</h3>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wide mt-1">Dodajte direktno u sistem</p>
          </div>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => setMode('single')}
              className={`p-2 rounded-lg transition-all ${mode === 'single' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white'}`}
            >
              <UserPlus size={18} />
            </button>
            <button 
              onClick={() => setMode('bulk')}
              className={`p-2 rounded-lg transition-all ${mode === 'bulk' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white'}`}
            >
              <FileText size={18} />
            </button>
          </div>
        </div>
        
        <div className="p-8">
          {mode === 'single' ? (
            <form onSubmit={onSingleAdd} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide ml-1">Ime i Prezime</label>
                <input 
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-5 py-4 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-700"
                  placeholder="npr. Edin Džeko"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide ml-1">Klub (opciono)</label>
                <input 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-5 py-4 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-700"
                  placeholder="npr. STK Spin"
                  value={newPlayerClub}
                  onChange={(e) => setNewPlayerClub(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 text-slate-500 font-medium text-xs uppercase tracking-wide hover:text-white transition-all"
                >
                  Otkaži
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-lg font-semibold text-xs uppercase tracking-wide transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                  Dodaj Igrača
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={onBulkAdd} className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Lista igrača</label>
                  <span className="text-[10px] text-blue-500 font-medium uppercase">Format: Ime, Klub;</span>
                </div>
                <textarea 
                  required
                  rows={6}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-5 py-4 text-white font-mono text-xs focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-800 resize-none"
                  placeholder="Haris Tabaković, STK Spin;&#10;Ermin H., STK Sarajevo;"
                  value={bulkPlayerText}
                  onChange={(e) => setBulkPlayerText(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 text-slate-500 font-medium text-xs uppercase tracking-wide hover:text-white transition-all"
                >
                  Otkaži
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold text-xs uppercase tracking-wide transition-all shadow-lg shadow-blue-600/25 italic"
                >
                  Dodaj Listu Igrača
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerAddModal;
