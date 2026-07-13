import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Trophy, LogOut, Radio, Edit2, Calendar, Swords, Loader2, ChevronRight } from 'lucide-react';
import { initPlayerStats, updateStatsFromMatch, calculateStandings } from '../utils/standings';
import MatchUpdateModal from '../components/competition/MatchUpdateModal';

// Self-service portal for a player: every league/tournament they're linked
// to (via players.authUid, set at login or by an organizer on approval),
// their standing in each, their next match, and full history with the same
// score-entry / live-scoring modal organizers use - just scoped to matches
// they're actually in (enforced in firestore.rules, see `matches` update).
const PlayerDashboard = () => {
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState(undefined); // undefined = not checked yet
  const [playerDocs, setPlayerDocs] = useState([]);
  const [competitions, setCompetitions] = useState({}); // id -> { ...competition, allMatches, myMatches }
  const [loading, setLoading] = useState(true);
  const [editingMatch, setEditingMatch] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setAuthUser(u || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (authUser === undefined) return; // still checking
    if (authUser === null) { navigate('/moj-nalog'); return; }

    const load = async () => {
      setLoading(true);
      try {
        const playersQ = query(collection(db, 'players'), where('authUid', '==', authUser.uid));
        const playersSnap = await getDocs(playersQ);
        const players = playersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPlayerDocs(players);

        if (players.length === 0) { setCompetitions({}); return; }

        const playerIds = players.map(p => p.id);
        const [byP1, byP2] = await Promise.all([
          getDocs(query(collection(db, 'matches'), where('player1.id', 'in', playerIds.slice(0, 30)))),
          getDocs(query(collection(db, 'matches'), where('player2.id', 'in', playerIds.slice(0, 30))))
        ]);
        const myMatchesById = {};
        [...byP1.docs, ...byP2.docs].forEach(d => { myMatchesById[d.id] = { id: d.id, ...d.data() }; });
        const myMatches = Object.values(myMatchesById);

        const competitionIds = [...new Set(myMatches.map(m => m.competitionId).filter(Boolean))];
        const result = {};

        for (const compId of competitionIds) {
          const compSnap = await getDoc(doc(db, 'competitions', compId));
          if (!compSnap.exists()) continue;
          const competition = { id: compSnap.id, ...compSnap.data() };
          const myMatchesForComp = myMatches.filter(m => m.competitionId === compId);

          let allMatches = myMatchesForComp;
          if (competition.type === 'League') {
            const allSnap = await getDocs(query(collection(db, 'matches'), where('competitionId', '==', compId)));
            allMatches = allSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          }

          result[compId] = { competition, allMatches, myMatches: myMatchesForComp };
        }

        setCompetitions(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authUser, navigate]);

  const saveMatchResult = async (matchData) => {
    try {
      const { id, ...result } = matchData;
      await updateDoc(doc(db, 'matches', id), { ...result, updatedAt: serverTimestamp() });
      setShowMatchModal(false);
      setEditingMatch(null);
    } catch (err) {
      console.error(err);
      alert('Greška pri spašavanju rezultata.');
    }
  };

  const handleLogout = () => signOut(auth).then(() => navigate('/moj-nalog'));

  if (authUser === undefined || loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <Loader2 className="animate-spin text-lime-400" size={32} />
      </div>
    );
  }

  const myPlayerIds = new Set(playerDocs.map(p => p.id));
  const entries = Object.values(competitions);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200">
      <header className="border-b border-white/5 px-5 py-4 flex items-center justify-between sticky top-0 bg-[#070b14]/95 backdrop-blur-sm z-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-lime-400">Moj Nalog</p>
          <h1 className="text-lg font-black text-white tracking-tight">{playerDocs[0]?.name || 'Igrač'}</h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
        >
          <LogOut size={14} /> Odjava
        </button>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
        {entries.length === 0 ? (
          <div className="text-center py-24">
            <Swords className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">Još niste dio nijedne lige ili turnira.</p>
            <p className="text-slate-600 text-sm mt-1">Kada organizator odobri vašu prijavu, ovdje će se pojaviti vaši mečevi.</p>
          </div>
        ) : (
          entries.map(({ competition, allMatches, myMatches }) => (
            <CompetitionCard
              key={competition.id}
              competition={competition}
              allMatches={allMatches}
              myMatches={myMatches}
              myPlayerIds={myPlayerIds}
              onOpenMatch={(m) => { setEditingMatch(m); setShowMatchModal(true); }}
            />
          ))
        )}
      </main>

      <MatchUpdateModal
        showMatchModal={showMatchModal}
        editingMatch={editingMatch}
        setEditingMatch={setEditingMatch}
        setShowMatchModal={setShowMatchModal}
        saveMatchResult={saveMatchResult}
        activeCategory={{ setsToWin: editingMatch?.__setsToWin || 2 }}
      />
    </div>
  );
};

const CompetitionCard = ({ competition, allMatches, myMatches, myPlayerIds, onOpenMatch }) => {
  const setsToWin = competition.settings?.setsToWin ?? 2;

  const standings = useMemo(() => {
    if (competition.type !== 'League') return null;
    const participants = competition.participants || [];
    if (participants.length === 0) return null;

    const winPts = competition.settings?.pointsWin ?? 2;
    const lossPts = competition.settings?.pointsLoss ?? 0;
    const statsById = {};
    participants.forEach(p => { statsById[p.id] = initPlayerStats(p); });

    allMatches.filter(m => m.status === 'completed').forEach(m => {
      const s1 = statsById[m.player1?.id];
      const s2 = statsById[m.player2?.id];
      if (s1) updateStatsFromMatch(s1, m, true, winPts, lossPts);
      if (s2) updateStatsFromMatch(s2, m, false, winPts, lossPts);
    });

    return calculateStandings(Object.values(statsById), allMatches.filter(m => m.status === 'completed'));
  }, [competition, allMatches]);

  const myRank = standings ? standings.findIndex(s => myPlayerIds.has(s.id)) + 1 : null;

  const nextMatch = myMatches
    .filter(m => m.status !== 'completed')
    .sort((a, b) => (a.round || 0) - (b.round || 0))[0];

  const pastMatches = myMatches
    .filter(m => m.status === 'completed')
    .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));

  const opponentOf = (m) => (myPlayerIds.has(m.player1?.id) ? m.player2 : m.player1);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden">
      <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{competition.type === 'League' ? 'Liga' : 'Turnir'}</p>
          <h2 className="text-white font-black text-lg tracking-tight truncate">{competition.name}</h2>
        </div>
        {myRank && (
          <div className="shrink-0 text-center bg-lime-400/10 border border-lime-400/20 rounded-2xl px-4 py-2">
            <p className="text-lime-300 font-black text-xl leading-none">#{myRank}</p>
            <p className="text-[8px] font-bold uppercase tracking-widest text-lime-400/70">Pozicija</p>
          </div>
        )}
      </div>

      {nextMatch && (
        <div className="p-5 bg-lime-500/[0.04] border-b border-slate-800">
          <p className="text-[10px] font-black uppercase tracking-widest text-lime-400 mb-2 flex items-center gap-1.5">
            <Calendar size={11} /> Slijedeći meč
          </p>
          <div className="flex items-center justify-between">
            <p className="text-white font-bold">protiv {opponentOf(nextMatch)?.name || 'TBD'}</p>
            <button
              onClick={() => onOpenMatch({ ...nextMatch, __setsToWin: setsToWin })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-black text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <Radio size={12} /> Unesi rezultat
            </button>
          </div>
        </div>
      )}

      <div className="p-5 space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Historija mečeva</p>
        {pastMatches.length === 0 ? (
          <p className="text-slate-600 text-sm italic">Još nema odigranih mečeva.</p>
        ) : (
          pastMatches.map(m => {
            const won = myPlayerIds.has(m.player1?.id) ? m.player1Score > m.player2Score : m.player2Score > m.player1Score;
            return (
              <button
                key={m.id}
                onClick={() => onOpenMatch({ ...m, __setsToWin: setsToWin })}
                className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800/60 transition-all text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-1.5 h-6 rounded-full shrink-0 ${won ? 'bg-emerald-500' : 'bg-red-500/60'}`} />
                  <span className="text-slate-200 text-sm font-medium truncate">vs {opponentOf(m)?.name || 'TBD'}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-white font-black tabular-nums text-sm">{m.player1Score}:{m.player2Score}</span>
                  <Edit2 size={12} className="text-slate-600" />
                </div>
              </button>
            );
          })
        )}
      </div>

      {standings && (
        <details className="border-t border-slate-800">
          <summary className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer flex items-center gap-1.5 hover:text-white transition-colors">
            <Trophy size={12} /> Cijela tabela <ChevronRight size={12} />
          </summary>
          <div className="px-4 pb-4 space-y-1">
            {standings.map((s, idx) => (
              <div key={s.id} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${myPlayerIds.has(s.id) ? 'bg-lime-400/10 text-lime-200 font-bold' : 'text-slate-400'}`}>
                <span>#{idx + 1} {s.name}</span>
                <span className="tabular-nums">{s.points} b.</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

export default PlayerDashboard;
