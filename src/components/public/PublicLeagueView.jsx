import { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import PublicGroupStandings from './PublicGroupStandings';
import PublicGroupMatches from './PublicGroupMatches';
import { calculateStandings, initPlayerStats, updateStatsFromMatch } from '../../utils/standings';

// Leagues have no categories subcollection (everything - participants,
// pairs/teams, matches - lives directly on the competition doc), so the
// category-driven public page (CompetitionBody) renders nothing for them.
// This is the dedicated public view for that case: one standings table +
// one match list for the whole league, built from `competition.participants`
// (the { id, name } list written once when the Berger schedule is
// generated - the same shape regardless of singles/doubles/teams mode).
const PublicLeagueView = ({ competition, allMatches }) => {
  const standings = useMemo(() => {
    const participants = competition?.participants || [];
    if (participants.length === 0) return [];

    const winPts = competition?.settings?.pointsWin ?? 2;
    const lossPts = competition?.settings?.pointsLoss ?? 0;

    const statsById = {};
    participants.forEach(p => { statsById[p.id] = initPlayerStats(p); });

    const completed = (allMatches || []).filter(m => m.status === 'completed');
    completed.forEach(m => {
      const s1 = statsById[m.player1?.id];
      const s2 = statsById[m.player2?.id];
      if (s1) updateStatsFromMatch(s1, m, true, winPts, lossPts);
      if (s2) updateStatsFromMatch(s2, m, false, winPts, lossPts);
    });

    return calculateStandings(Object.values(statsById), completed);
  }, [competition, allMatches]);

  const sortedMatches = useMemo(
    () => [...(allMatches || [])].sort((a, b) => (a.round || 0) - (b.round || 0)),
    [allMatches]
  );

  if (!competition?.participants || competition.participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-[#0a0f1d]/40 rounded-[32px] border border-slate-800/50">
        <div className="w-16 h-16 bg-slate-900/50 rounded-2xl flex items-center justify-center mb-6 border border-slate-800/50">
          <Trophy size={32} className="text-slate-700" />
        </div>
        <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tight italic">Liga uskoro počinje</h3>
        <p className="text-slate-500 text-sm max-w-[280px] font-medium leading-relaxed">
          Organizator još uvijek priprema raspored. Rezultati će se pojaviti ovdje čim počne prvo kolo.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#0d1527] rounded-2xl p-3.5 md:p-5 border border-slate-800">
      <PublicGroupStandings standings={standings} advancingCount={0} />
      <div className="pt-3 border-t border-slate-800/80">
        <PublicGroupMatches matches={sortedMatches} />
      </div>
    </div>
  );
};

export default PublicLeagueView;
