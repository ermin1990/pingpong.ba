import { useState, useMemo } from 'react';
import { Search, Trash2, AlertTriangle, Edit2, X, Star, Trophy, ChevronDown, Table2, Clock3, Layers3 } from 'lucide-react';

const getPlayerLabel = (player, fallbackPlayer) => {
  if (player?.name) return player.name;
  if (fallbackPlayer?.name) return fallbackPlayer.name;
  return 'TBD';
};

const getPlayerClub = (player, fallbackPlayer) => player?.club || fallbackPlayer?.club || '';

const normalizeSetValue = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getValidSets = (sets = []) =>
  sets.filter((set) => normalizeSetValue(set?.p1) !== null || normalizeSetValue(set?.p2) !== null);

const getScoreFromSets = (sets = []) => {
  return getValidSets(sets).reduce(
    (acc, set) => {
      const p1 = normalizeSetValue(set?.p1);
      const p2 = normalizeSetValue(set?.p2);

      if (p1 === null || p2 === null || p1 === p2) return acc;
      if (p1 > p2) acc.p1 += 1;
      if (p2 > p1) acc.p2 += 1;

      return acc;
    },
    { p1: 0, p2: 0 }
  );
};

const AllMatchesTab = ({
  allMatches,
  categories,
  allPlayers,
  setEditingMatch,
  setShowMatchModal,
  handleDeleteMatch,
  handleDeleteAllMatches
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  const playerMap = useMemo(
    () => new Map((allPlayers || []).map((player) => [player.id, player])),
    [allPlayers]
  );

  const filteredMatches = useMemo(() => {
    let filtered = [...allMatches];

    if (filterCategory !== 'all') {
      filtered = filtered.filter((match) => match.categoryId === filterCategory);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((match) => match.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      filtered = filtered.filter((match) => {
        const fallbackP1 = playerMap.get(match.player1?.id);
        const fallbackP2 = playerMap.get(match.player2?.id);
        const p1Name = getPlayerLabel(match.player1, fallbackP1).toLowerCase();
        const p2Name = getPlayerLabel(match.player2, fallbackP2).toLowerCase();
        const categoryName = categories.find((cat) => cat.id === match.categoryId)?.name?.toLowerCase() || '';

        return p1Name.includes(lower) || p2Name.includes(lower) || categoryName.includes(lower);
      });
    }

    return filtered.sort((a, b) => {
      const aTime = b.createdAt?.seconds || 0;
      const bTime = a.createdAt?.seconds || 0;
      return aTime - bTime;
    });
  }, [allMatches, categories, filterCategory, filterStatus, playerMap, searchQuery]);

  const handleDeleteAllConfirmed = async () => {
    if (filteredMatches.length === 0) return;

    const confirmed = window.confirm(
      `Sigurno želite obrisati ${filteredMatches.length} mečeva? Ova akcija se ne može poništiti!`
    );

    if (confirmed) {
      await handleDeleteAllMatches(filteredMatches.map((match) => match.id));
      setShowDeleteAllConfirm(false);
    }
  };

  return (
    <div className="space-y-5 p-5 sm:p-6">
      <div className="bg-slate-950/90 border border-slate-800 rounded-[24px] p-5 sm:p-6 shadow-lg overflow-hidden relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-sky-500/12 rounded-2xl flex items-center justify-center text-sky-300 border border-sky-500/15 shadow-md shadow-sky-950/20">
              <Trophy size={22} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight italic leading-none mb-1.5">
                SVI MEČEVI ({filteredMatches.length})
              </h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                GLOBALNI PREGLED SVIH KATEGORIJA, STANJA I REZULTATA PO SETOVIMA
              </p>
            </div>
          </div>

          {filteredMatches.length > 0 && (
            <button
              onClick={() => setShowDeleteAllConfirm(true)}
              className="w-full sm:w-auto bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-400 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={15} />
              OBRIŠI FILTRIRANE
            </button>
          )}
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-3xl -mr-16 -mt-16" />
      </div>

      <div className="bg-slate-950/90 border border-slate-800 rounded-[24px] p-4 sm:p-5 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-center text-sky-400">
            <Search size={18} />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-tight italic">BRZA PRETRAGA</h3>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">IGRAČ, KATEGORIJA ILI FAZA</p>
          </div>
        </div>
        <div className="relative group">
          <input
            type="text"
            placeholder="UPIŠITE IME IGRAČA ILI KATEGORIJU..."
            className="w-full bg-slate-950 border border-slate-800 rounded-[20px] pl-12 pr-5 py-4 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-400 transition-colors" size={18} />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-950/90 border border-slate-800 rounded-[20px] p-4 shadow-sm">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block ml-1">KATEGORIJA</label>
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-sky-500 transition-all cursor-pointer appearance-none"
            >
              <option value="all">SVE KATEGORIJE</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        <div className="bg-slate-950/90 border border-slate-800 rounded-[20px] p-4 shadow-sm">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block ml-1">STATUS MEČA</label>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-sky-500 transition-all cursor-pointer appearance-none"
            >
              <option value="all">SVI STATUSI</option>
              <option value="pending">PREDSTOJEĆI</option>
              <option value="completed">ZAVRŠENI</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>
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
              Sigurno želite obrisati <span className="font-bold text-slate-900 dark:text-white">{filteredMatches.length}</span> filtriranih mečeva?
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

      {filteredMatches.length === 0 ? (
        <div className="text-center py-20 bg-slate-950/50 rounded-[24px] border border-dashed border-slate-800">
          <div className="w-16 h-16 mx-auto mb-6 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800">
            <Search className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-black text-white uppercase italic tracking-tighter mb-2">
            {searchQuery || filterCategory !== 'all' || filterStatus !== 'all' ? 'Nema rezultata' : 'Nema Mečeva'}
          </h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {searchQuery || filterCategory !== 'all' || filterStatus !== 'all' ? 'Pokušajte promijeniti filtere' : 'Generirajte mečeve u kategorijama'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMatches.map((match) => {
            const category = categories.find((cat) => cat.id === match.categoryId);
            const seededIds = category?.seededPlayerIds || [];
            const fallbackP1 = playerMap.get(match.player1?.id);
            const fallbackP2 = playerMap.get(match.player2?.id);
            const p1 = { ...fallbackP1, ...match.player1 };
            const p2 = { ...fallbackP2, ...match.player2 };
            const sets = getValidSets(match.sets || []);
            const scoreFromSets = getScoreFromSets(match.sets || []);
            const s1 = Number.isFinite(Number(match.player1Score)) ? Number(match.player1Score) : scoreFromSets.p1;
            const s2 = Number.isFinite(Number(match.player2Score)) ? Number(match.player2Score) : scoreFromSets.p2;
            const isCompleted = match.status === 'completed';
            const isPending = match.status === 'pending';
            const p1Winner = isCompleted && s1 > s2;
            const p2Winner = isCompleted && s2 > s1;
            const phaseLabel = match.isKnockout
              ? (match.roundName || `Runda ${match.round || 1}`)
              : (match.groupName || `Grupa ${String.fromCharCode(65 + (match.groupId || 0))}`);

            return (
              <div
                key={match.id}
                className="group relative bg-slate-950/95 border border-slate-800 rounded-[24px] p-4 hover:border-sky-500/30 transition-all overflow-hidden shadow-md"
              >
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 z-20">
                  <button
                    onClick={() => {
                      setEditingMatch(match);
                      setShowMatchModal(true);
                    }}
                    className="bg-sky-600 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-sky-500 transition-all shadow-md shadow-sky-950/20"
                  >
                    <div className="flex items-center gap-2">
                      <Edit2 size={14} />
                      <span>Uredi Rezultat</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleDeleteMatch(match.id)}
                    className="bg-red-500/10 text-red-400 p-3 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                    title="Obriši"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                      {category?.name || 'Bez kategorije'}
                    </span>
                    <span className="text-[9px] font-black text-sky-300 uppercase tracking-widest bg-sky-500/10 px-2 py-1 rounded-md border border-sky-500/20">
                      {phaseLabel}
                    </span>
                  </div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    {match.isKnockout ? 'KO' : 'GRUPA'}
                  </span>
                </div>

                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between items-center gap-3">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-sm font-black uppercase tracking-tight truncate ${p1Winner ? 'text-emerald-400' : 'text-white'}`}>
                          {getPlayerLabel(p1, fallbackP1)}
                        </span>
                        {seededIds.includes(p1.id) && <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />}
                      </div>
                      {getPlayerClub(p1, fallbackP1) && (
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider truncate">
                          {getPlayerClub(p1, fallbackP1)}
                        </span>
                      )}
                    </div>
                    <div className={`text-2xl font-black italic tracking-tighter shrink-0 ${p1Winner ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {s1}
                    </div>
                  </div>

                  <div className="h-px bg-slate-800 w-full" />

                  <div className="flex justify-between items-center gap-3">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-sm font-black uppercase tracking-tight truncate ${p2Winner ? 'text-emerald-400' : 'text-white'}`}>
                          {getPlayerLabel(p2, fallbackP2)}
                        </span>
                        {seededIds.includes(p2.id) && <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />}
                      </div>
                      {getPlayerClub(p2, fallbackP2) && (
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider truncate">
                          {getPlayerClub(p2, fallbackP2)}
                        </span>
                      )}
                    </div>
                    <div className={`text-2xl font-black italic tracking-tighter shrink-0 ${p2Winner ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {s2}
                    </div>
                  </div>
                </div>

                {sets.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">SETOVI</p>
                    <div className="flex flex-wrap gap-2">
                      {sets.map((set, idx) => {
                        const p1Set = normalizeSetValue(set?.p1);
                        const p2Set = normalizeSetValue(set?.p2);

                        return (
                          <div
                            key={`${match.id}-set-${idx}`}
                            className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5"
                          >
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{idx + 1}</span>
                            <span className={`text-[11px] font-black ${p1Set !== null && p2Set !== null && p1Set > p2Set ? 'text-emerald-400' : 'text-slate-200'}`}>
                              {p1Set ?? '-'}
                            </span>
                            <span className="text-slate-600 text-[10px] font-black">:</span>
                            <span className={`text-[11px] font-black ${p1Set !== null && p2Set !== null && p2Set > p1Set ? 'text-emerald-400' : 'text-slate-200'}`}>
                              {p2Set ?? '-'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest">
                    <span className={`inline-flex items-center gap-1.5 ${isCompleted ? 'text-emerald-400' : isPending ? 'text-amber-400' : 'text-slate-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-400' : isPending ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`} />
                      {isCompleted ? 'Završeno' : isPending ? 'Predstojeći' : (match.status || 'Nepoznato')}
                    </span>
                    {match.table && (
                      <span className="inline-flex items-center gap-1.5 text-sky-300">
                        <Table2 size={11} />
                        {match.table}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    {typeof match.groupId === 'number' && !match.isKnockout && (
                      <span className="inline-flex items-center gap-1.5">
                        <Layers3 size={11} />
                        {match.groupName || `Grupa ${String.fromCharCode(65 + match.groupId)}`}
                      </span>
                    )}
                    {match.updatedAt?.seconds && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 size={11} />
                        {new Date(match.updatedAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AllMatchesTab;
