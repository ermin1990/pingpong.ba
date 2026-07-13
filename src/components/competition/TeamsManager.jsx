import { useState } from 'react';
import { Plus, Trash2, X, Building2, UserPlus, Search } from 'lucide-react';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

// Teams (e.g. companies/clubs) that play against each other in a league.
// Unlike DoublesManager's fixed pairs, a team's roster can grow/shrink any time
// (new hires, injuries, sick leave) - who actually played is chosen per match instead.
const TeamsManager = ({ league, allPlayers, selectedPlayers, onSaveTeams }) => {
  const teams = league?.teams || [];
  const [newTeamName, setNewTeamName] = useState('');
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [rosterSearch, setRosterSearch] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);

  const pool = allPlayers.filter(p => selectedPlayers.includes(p.id));

  // Matches (or creates) a persistent `companies` record by normalized name,
  // so the same firm playing across multiple seasons/leagues can be tracked
  // as one entity for cross-season leaderboards, even though each league
  // still keeps its own ad-hoc team/roster entry.
  const resolveCompanyId = async (name) => {
    const normalized = name.trim().toLowerCase();
    const q = query(collection(db, 'companies'), where('ownerUid', '==', league.ownerUid));
    const snap = await getDocs(q);
    const existing = snap.docs.find(d => (d.data().name || '').trim().toLowerCase() === normalized);
    if (existing) return existing.id;

    const created = await addDoc(collection(db, 'companies'), {
      name: name.trim(),
      ownerUid: league.ownerUid,
      createdAt: serverTimestamp()
    });
    return created.id;
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim() || creatingTeam) return;
    setCreatingTeam(true);
    try {
      const companyId = await resolveCompanyId(newTeamName);
      const newTeam = {
        id: `team_${Date.now()}`,
        name: newTeamName.trim(),
        companyId,
        roster: []
      };
      onSaveTeams([...teams, newTeam]);
      setNewTeamName('');
      setExpandedTeamId(newTeam.id);
    } catch (err) {
      console.error(err);
      alert('Greška pri kreiranju tima.');
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleDeleteTeam = (teamId) => {
    if (!window.confirm('Obrisati ovaj tim? Ovo ne briše već generisane mečeve.')) return;
    onSaveTeams(teams.filter(t => t.id !== teamId));
  };

  const handleAddPlayerToRoster = (teamId, player) => {
    onSaveTeams(teams.map(t =>
      t.id === teamId && !t.roster.some(r => r.id === player.id)
        ? { ...t, roster: [...t.roster, { id: player.id, name: player.name }] }
        : t
    ));
  };

  const handleRemoveFromRoster = (teamId, playerId) => {
    onSaveTeams(teams.map(t =>
      t.id === teamId ? { ...t, roster: t.roster.filter(r => r.id !== playerId) } : t
    ));
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 flex gap-3 text-amber-800 dark:text-amber-400">
        <Building2 size={20} className="shrink-0" />
        <p className="text-xs font-bold leading-relaxed uppercase tracking-tight">
          Kreirajte timove (npr. firme), dodajte igrače u roster svakog tima. Roster možete mijenjati bilo kad -
          ko je stvarno igrao se bira posebno za svaki meč u tabu "Rezultati".
        </p>
      </div>

      <form onSubmit={handleCreateTeam} className="flex gap-3">
        <input
          type="text"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          placeholder="Naziv tima/firme (npr. STK Tuzla d.o.o.)"
          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
        />
        <button
          type="submit"
          disabled={!newTeamName.trim() || creatingTeam}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shrink-0"
        >
          <Plus size={18} /> {creatingTeam ? 'Kreiranje...' : 'Kreiraj Tim'}
        </button>
      </form>

      {teams.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-2xl">
          <Building2 size={40} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 font-bold text-sm">Nema kreiranih timova još.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map(team => {
            const isExpanded = expandedTeamId === team.id;
            const available = pool
              .filter(p => !team.roster.some(r => r.id === p.id))
              .filter(p => !rosterSearch || p.name.toLowerCase().includes(rosterSearch.toLowerCase()));

            return (
              <div key={team.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <Building2 size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-white font-bold truncate">{team.name}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{team.roster.length} u rosteru</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  {team.roster.length === 0 ? (
                    <p className="text-xs text-slate-600 italic">Roster je prazan.</p>
                  ) : (
                    team.roster.map(player => (
                      <div key={player.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                        <span className="text-sm text-slate-200 font-medium truncate">{player.name}</span>
                        <button
                          onClick={() => handleRemoveFromRoster(team.id, player.id)}
                          className="text-slate-600 hover:text-red-500 transition-colors shrink-0 ml-2"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {isExpanded ? (
                  <div className="border-t border-slate-800 pt-4 space-y-3">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={rosterSearch}
                        onChange={(e) => setRosterSearch(e.target.value)}
                        placeholder="Pretraži igrače..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1.5">
                      {available.length === 0 ? (
                        <p className="text-xs text-slate-600 italic px-1">Nema dostupnih igrača (svi su već dodani, ili ih još nema u listi igrača lige).</p>
                      ) : (
                        available.map(p => (
                          <button
                            key={p.id}
                            onClick={() => handleAddPlayerToRoster(team.id, p)}
                            className="w-full flex items-center justify-between bg-slate-950 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/30 rounded-xl px-3 py-2 text-left transition-all"
                          >
                            <span className="text-sm text-slate-300">{p.name}</span>
                            <Plus size={14} className="text-emerald-400 shrink-0" />
                          </button>
                        ))
                      )}
                    </div>
                    <button
                      onClick={() => { setExpandedTeamId(null); setRosterSearch(''); }}
                      className="w-full py-2 text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-all"
                    >
                      Zatvori
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setExpandedTeamId(team.id)}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                  >
                    <UserPlus size={14} /> Dodaj Igrača u Roster
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamsManager;
