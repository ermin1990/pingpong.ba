import { useState, useMemo } from 'react';
import { Search, Trash2, AlertTriangle, X, UserX, Users } from 'lucide-react';

const AllPlayersTab = ({
  allPlayers,
  handleDeletePlayer,
  handleDeleteAllPlayers
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return allPlayers;

    const lower = searchQuery.toLowerCase();
    return allPlayers.filter((player) =>
      player.name?.toLowerCase().includes(lower) ||
      player.club?.toLowerCase().includes(lower)
    );
  }, [allPlayers, searchQuery]);

  const handleDeleteAllConfirmed = async () => {
    if (filteredPlayers.length === 0) return;

    const confirmed = window.confirm(
      `Sigurno želite obrisati ${filteredPlayers.length} igrača? Ova akcija se ne može poništiti!`
    );

    if (confirmed) {
      await handleDeleteAllPlayers(filteredPlayers.map((player) => player.id));
      setShowDeleteAllConfirm(false);
    }
  };

  return (
    <div className="space-y-5 p-5 sm:p-6">
      <div className="bg-slate-950/90 border border-slate-800 rounded-[24px] p-5 sm:p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-sky-500/12 rounded-2xl flex items-center justify-center text-sky-300 border border-sky-500/15 shadow-md shadow-sky-950/20">
              <Users size={22} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white uppercase italic tracking-tight leading-none mb-1.5">
                SVI IGRAČI
              </h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                UKUPNO {allPlayers.length} • PRIKAZANO {filteredPlayers.length}
              </p>
            </div>
          </div>

          {filteredPlayers.length > 0 && (
            <button
              onClick={() => setShowDeleteAllConfirm(true)}
              className="w-full sm:w-auto bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-400 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={14} />
              OBRIŠI FILTRIRANE
            </button>
          )}
        </div>
      </div>

      <div className="relative max-w-xl">
        <input
          type="text"
          placeholder="PRETRAŽI PO IMENU ILI KLUBU..."
          className="w-full bg-slate-950 border border-slate-800 rounded-[18px] px-4 py-3 pl-11 text-[11px] font-black uppercase tracking-widest text-white focus:border-sky-500 outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 dark:bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-red-600 dark:text-red-500" size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Potvrda brisanja</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
              Sigurno želite obrisati <span className="font-bold text-slate-900 dark:text-white">{filteredPlayers.length}</span> filtriranih igrača?
              Ova akcija je trajna i ne može se poništiti.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white py-2.5 rounded-lg font-bold text-sm transition-all"
              >
                Otkaži
              </button>
              <button
                onClick={handleDeleteAllConfirmed}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg shadow-red-600/20"
              >
                Obriši Sve
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredPlayers.length === 0 ? (
        <div className="text-center py-20 bg-slate-950/50 rounded-[24px] border border-dashed border-slate-800">
          <UserX className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h3 className="text-lg font-black text-white uppercase italic tracking-tight mb-2">
            {searchQuery ? 'Nema rezultata' : 'Nema igrača'}
          </h3>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
            {searchQuery ? 'Pokušajte promijeniti pretragu' : 'Igrači će se pojaviti ovdje kada ih dodate'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredPlayers.map((player) => (
            <div
              key={player.id}
              className="bg-slate-950/95 border border-slate-800 rounded-[20px] p-4 hover:border-slate-700 transition-all group shadow-sm"
            >
              <div className="mb-4">
                <h3 className="text-sm font-black text-white uppercase italic tracking-tight truncate">
                  {player.name}
                </h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 truncate">
                  {player.club || 'Individualac'}
                </p>
              </div>

              {player.rating && (
                <div className="mb-4 pb-4 border-b border-slate-800/70 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Rejting</span>
                  <span className="text-sm font-black text-sky-400">{player.rating}</span>
                </div>
              )}

              <button
                onClick={() => handleDeletePlayer(player.id)}
                className="w-full bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-red-500/20"
              >
                <Trash2 size={12} />
                Obriši Igrača
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllPlayersTab;
