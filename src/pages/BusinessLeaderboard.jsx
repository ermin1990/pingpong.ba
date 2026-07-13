import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import DashboardLayout from '../layouts/DashboardLayout';
import { Building2, Trophy, ArrowLeft, Calendar } from 'lucide-react';

// Aggregates a company's (team's) record across every team-mode league/season
// owned by this organizer, keyed by the persistent `companyId` created in
// TeamsManager - so "Firma X" keeps one running record across seasons even
// though each league still creates its own ad-hoc team entry underneath.
const BusinessLeaderboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);

      const leaguesSnap = await getDocs(query(
        collection(db, 'competitions'),
        where('ownerUid', '==', user.uid),
        where('type', '==', 'League')
      ));
      const teamLeagues = leaguesSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(l => l.participantMode === 'teams' && (l.teams || []).length > 0);

      const companies = {}; // companyId -> { name, played, won, lost, points, seasons: Set }

      await Promise.all(teamLeagues.map(async (league) => {
        const matchesSnap = await getDocs(query(
          collection(db, 'matches'),
          where('competitionId', '==', league.id)
        ));
        const matches = matchesSnap.docs.map(d => d.data()).filter(m => m.status === 'completed');
        const winPts = league.settings?.pointsWin ?? 2;
        const lossPts = league.settings?.pointsLoss ?? 0;

        const teamById = {};
        (league.teams || []).forEach(t => { teamById[t.id] = t; });

        // Tenis matches are always best-of-N sets, so a tie is never possible -
        // no draw case here.
        matches.forEach(m => {
          const t1 = teamById[m.player1?.id];
          const t2 = teamById[m.player2?.id];
          if (!t1 || !t2) return; // not a team-vs-team match (shouldn't happen for team leagues)

          [{ team: t1, score: m.player1Score, oppScore: m.player2Score },
           { team: t2, score: m.player2Score, oppScore: m.player1Score }].forEach(({ team, score, oppScore }) => {
            const key = team.companyId || team.id;
            if (!companies[key]) {
              companies[key] = { name: team.name, played: 0, won: 0, lost: 0, points: 0, seasons: new Set() };
            }
            const c = companies[key];
            c.played++;
            c.seasons.add(league.id);
            if (score > oppScore) { c.won++; c.points += winPts; }
            else if (score < oppScore) { c.lost++; c.points += lossPts; }
          });
        });
      }));

      const list = Object.values(companies)
        .map(c => ({ ...c, seasonsCount: c.seasons.size }))
        .sort((a, b) => b.points - a.points);

      setRows(list);
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Link to="/admin/leagues" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors w-fit">
          <ArrowLeft size={16} /> Nazad na Lige
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Building2 size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase italic tracking-tight">Poslovna Rang Lista</h1>
            <p className="text-slate-500 text-sm font-medium">Ukupan učinak firmi kroz sve sezone poslovnih liga.</p>
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Učitavanje...</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-24 bg-slate-950/20 border-2 border-dashed border-slate-800 rounded-2xl">
            <Building2 size={40} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-bold text-sm">Još nema odigranih mečeva u ligama sa timovima.</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="py-4 px-6">#</th>
                  <th className="py-4 px-6">Firma</th>
                  <th className="py-4 px-6 text-center">Sezona</th>
                  <th className="py-4 px-6 text-center">Odigrano</th>
                  <th className="py-4 px-6 text-center">Pob / Por</th>
                  <th className="py-4 px-6 text-center text-amber-400">Bodovi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rows.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-800/20 transition-all">
                    <td className="py-4 px-6">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${i < 3 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-500'}`}>
                        {i === 0 ? <Trophy size={13} /> : i + 1}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-white font-bold">{c.name}</td>
                    <td className="py-4 px-6 text-center text-slate-400 text-sm flex items-center justify-center gap-1.5">
                      <Calendar size={12} /> {c.seasonsCount}
                    </td>
                    <td className="py-4 px-6 text-center text-slate-300 text-sm">{c.played}</td>
                    <td className="py-4 px-6 text-center text-sm">
                      <span className="text-emerald-400 font-bold">{c.won}</span>
                      <span className="text-slate-600 mx-1">/</span>
                      <span className="text-red-400 font-bold">{c.lost}</span>
                    </td>
                    <td className="py-4 px-6 text-center text-lg font-black text-amber-400">{c.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BusinessLeaderboard;
