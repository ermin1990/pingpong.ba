import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import DashboardLayout from '../layouts/DashboardLayout';
import { ArrowLeft, Trophy, Target, TrendingUp, Users, Calendar, Swords } from 'lucide-react';

// Career profile for one player: aggregates every match they were part of -
// as an individual (singles), as half of a fixed doubles pair, or as a named
// player in a team-mode league lineup - across every competition/league
// owned by the same organizer.
//
// Known limitation: doubles pairs formed inside a regular competition's
// categories (competitions/{id}/categories/{catId}.doublesPairs) aren't
// included yet, only league-level pairs/teams (doublesPairs/teams live
// directly on the league document, so they're cheap to scan). Competition
// category pairs would need a subcollection fetch per competition.
const PlayerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [matches, setMatches] = useState([]);
  const [competitionNames, setCompetitionNames] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const playerSnap = await getDoc(doc(db, 'players', id));
      if (!playerSnap.exists()) {
        setLoading(false);
        return;
      }
      const playerData = { id: playerSnap.id, ...playerSnap.data() };
      setPlayer(playerData);

      // Every league owned by this organizer - doublesPairs/teams live
      // directly on the league doc, so one query is enough to find every
      // pair/team this player has ever been part of.
      const leaguesSnap = await getDocs(query(
        collection(db, 'competitions'),
        where('ownerUid', '==', playerData.ownerUid),
        where('type', '==', 'League')
      ));

      const identityIds = new Set([id]);
      const teamLineupContext = {}; // teamId -> true if this player has ever been in that team's roster

      leaguesSnap.docs.forEach(d => {
        const league = d.data();
        (league.doublesPairs || []).forEach(pair => {
          if (pair.playerIds?.includes(id)) identityIds.add(pair.id);
        });
        (league.teams || []).forEach(team => {
          if (team.roster?.some(p => p.id === id)) {
            identityIds.add(team.id);
            teamLineupContext[team.id] = true;
          }
        });
      });

      const idList = Array.from(identityIds);
      // Firestore 'in' supports up to 30 values - identity ids per player stay tiny in practice.
      const [byPlayer1, byPlayer2] = await Promise.all([
        getDocs(query(collection(db, 'matches'), where('player1.id', 'in', idList))),
        getDocs(query(collection(db, 'matches'), where('player2.id', 'in', idList)))
      ]);

      const seen = new Map();
      [...byPlayer1.docs, ...byPlayer2.docs].forEach(d => seen.set(d.id, { id: d.id, ...d.data() }));
      let allMatches = Array.from(seen.values()).filter(m => m.status === 'completed');

      // For team matches, only count it as "played" if this player is in that
      // specific match's recorded lineup (roster membership alone isn't enough -
      // that's the whole point of picking a lineup per match).
      allMatches = allMatches.filter(m => {
        const isTeamMatch = teamLineupContext[m.player1?.id] || teamLineupContext[m.player2?.id];
        if (!isTeamMatch) return true;
        const lineup = teamLineupContext[m.player1?.id] ? m.lineup1 : m.lineup2;
        return lineup?.some(p => p.id === id);
      });

      setMatches(allMatches);

      const compIds = Array.from(new Set(allMatches.map(m => m.competitionId).filter(Boolean)));
      const names = {};
      await Promise.all(compIds.map(async (cid) => {
        const cSnap = await getDoc(doc(db, 'competitions', cid));
        if (cSnap.exists()) names[cid] = cSnap.data().name;
      }));
      setCompetitionNames(names);

      setLoading(false);
    };
    load();
  }, [id]);

  const stats = useMemo(() => {
    const isWin = (m) => {
      const asP1 = m.player1?.id === id || (m.lineup1?.some(p => p.id === id));
      const p1Won = m.player1Score > m.player2Score;
      return asP1 ? p1Won : !p1Won;
    };

    const won = matches.filter(isWin).length;
    const lost = matches.length - won;
    const winRate = matches.length > 0 ? Math.round((won / matches.length) * 100) : 0;

    const headToHead = {};
    matches.forEach(m => {
      const iAmP1 = m.player1?.id === id || m.lineup1?.some(p => p.id === id);
      const opponent = iAmP1 ? m.player2 : m.player1;
      if (!opponent?.id || opponent.id === id) return;
      if (!headToHead[opponent.id]) headToHead[opponent.id] = { name: opponent.name, won: 0, lost: 0 };
      if (isWin(m)) headToHead[opponent.id].won++;
      else headToHead[opponent.id].lost++;
    });

    const competitionsPlayed = new Set(matches.map(m => m.competitionId).filter(Boolean));

    return {
      played: matches.length,
      won,
      lost,
      winRate,
      headToHead: Object.values(headToHead).sort((a, b) => (b.won + b.lost) - (a.won + a.lost)),
      competitionsCount: competitionsPlayed.size,
      recent: [...matches].sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)).slice(0, 10)
    };
  }, [matches, id]);

  if (loading) {
    return <DashboardLayout><div className="p-20 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Učitavanje profila...</div></DashboardLayout>;
  }

  if (!player) {
    return <DashboardLayout><div className="p-20 text-center text-red-500 font-bold">Igrač nije pronađen.</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Nazad
        </button>

        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-amber-500 flex items-center justify-center text-black text-3xl font-black uppercase shrink-0">
            {player.name.charAt(0)}
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tight">{player.name}</h1>
            <p className="text-slate-500 font-bold text-sm mt-1">{player.club || 'Bez kluba'}</p>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <div className="text-3xl font-black text-white">{stats.played}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Mečeva</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-emerald-400">{stats.winRate}%</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Uspješnost</div>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Trophy size={20} />, label: 'Pobjede', value: stats.won, color: 'text-emerald-400' },
            { icon: <Target size={20} />, label: 'Porazi', value: stats.lost, color: 'text-red-400' },
            { icon: <TrendingUp size={20} />, label: 'Uspješnost', value: `${stats.winRate}%`, color: 'text-amber-400' },
            { icon: <Users size={20} />, label: 'Takmičenja', value: stats.competitionsCount, color: 'text-lime-400' }
          ].map((s, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 text-center">
              <div className={`flex justify-center mb-2 ${s.color}`}>{s.icon}</div>
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Head to head */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <Swords size={18} className="text-amber-400" />
            <h3 className="text-white font-black uppercase italic tracking-tight">Međusobni Duel</h3>
          </div>
          {stats.headToHead.length === 0 ? (
            <p className="p-8 text-center text-slate-500 text-sm">Još nema odigranih mečeva.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {stats.headToHead.map((h, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <span className="text-slate-300 font-medium text-sm">{h.name}</span>
                  <span className="text-xs font-black tracking-widest">
                    <span className="text-emerald-400">{h.won}P</span>
                    <span className="text-slate-600 mx-1">-</span>
                    <span className="text-red-400">{h.lost}P</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent matches */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <Calendar size={18} className="text-amber-400" />
            <h3 className="text-white font-black uppercase italic tracking-tight">Historija Mečeva</h3>
          </div>
          {stats.recent.length === 0 ? (
            <p className="p-8 text-center text-slate-500 text-sm">Nema odigranih mečeva.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {stats.recent.map(m => {
                const iAmP1 = m.player1?.id === id || m.lineup1?.some(p => p.id === id);
                const won = iAmP1 ? m.player1Score > m.player2Score : m.player2Score > m.player1Score;
                const opponent = iAmP1 ? m.player2 : m.player1;
                return (
                  <div key={m.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm text-slate-300 font-medium">vs {opponent?.name || 'TBD'}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{competitionNames[m.competitionId] || 'Takmičenje'}</p>
                    </div>
                    <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${won ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {won ? 'Pobjeda' : 'Poraz'} {iAmP1 ? m.player1Score : m.player2Score}:{iAmP1 ? m.player2Score : m.player1Score}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PlayerProfile;
