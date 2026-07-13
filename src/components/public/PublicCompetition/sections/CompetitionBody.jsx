import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, ChevronRight, Layers3, Swords } from 'lucide-react';
import PublicGroupMatches from "../../PublicGroupMatches";
import PublicGroupStandings from "../../PublicGroupStandings";
import PublicLeagueView from "../../PublicLeagueView";
import KnockoutTab from "../../../competition/KnockoutTab";
import PlayersTab from "../../../competition/PlayersTab";
import SeasonList from "../../../../pages/SeasonList";
import KnockoutMatchCard from '../UI/KnockoutMatchCard';
import { generateSlug } from '../utils';

import { useMemo } from 'react';

const CompetitionBody = ({ competition, slug, categorySlug, categories, activeTab, setActiveTab, competitionId, isEmbed, activeCategory, allMatches, allPlayers }) => {
  const totalCompletedMatches = (allMatches || []).filter(m => m.status === 'completed').length;

  // Leagues have no categories subcollection at all - everything lives
  // directly on the competition doc - so they need their own view instead
  // of the categories-grid/groups flow below, which would otherwise render
  // completely empty for them.
  if (competition?.type === 'League') {
    return (
      <main className="container mx-auto px-4 py-6 md:py-8">
        <PublicLeagueView competition={competition} allMatches={allMatches} />
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6 md:py-8">
      {!categorySlug ? (
        <div className="space-y-8 md:space-y-10">
          <OverviewBanner categoriesCount={categories.length} playersCount={allPlayers.length} completedMatches={totalCompletedMatches} />
          <CategoryGrid categories={categories} slug={slug} isEmbed={isEmbed} />
        </div>
      ) : (
        <div className="space-y-5 md:space-y-6">
          <TabsNav activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabContent 
            activeTab={activeTab} 
            competitionId={competitionId} 
            categorySlug={categorySlug} 
            activeCategory={activeCategory}
            allMatches={allMatches}
            allPlayers={allPlayers}
          />
        </div>
      )}
    </main>
  );
};

const OverviewBanner = ({ categoriesCount, playersCount, completedMatches }) => (
  <div className="rounded-3xl border border-slate-800 bg-slate-900/70 shadow-xl p-5 md:p-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
      <div>
        <p className="text-[10px] font-black text-blue-300 uppercase tracking-[0.18em] mb-2">Pregled turnira</p>
        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Sve kategorije i rezultati na jednom mjestu</h2>
      </div>
      <div className="grid grid-cols-3 gap-2 md:gap-3 min-w-full md:min-w-[420px]">
        <MetricTile icon={<Layers3 size={14} />} label="Kategorije" value={categoriesCount} />
        <MetricTile icon={<Users size={14} />} label="Igrači" value={playersCount} />
        <MetricTile icon={<Swords size={14} />} label="Mečevi" value={completedMatches} />
      </div>
    </div>
  </div>
);

const MetricTile = ({ icon, label, value }) => (
  <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-center">
    <div className="w-6 h-6 mx-auto mb-2 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-300">
      {icon}
    </div>
    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{label}</p>
    <p className="text-lg font-black text-white leading-tight">{value}</p>
  </div>
);

const CategoryGrid = ({ categories, slug, isEmbed }) => (
  <div className="space-y-4">
    <div className="flex items-end justify-between border-b border-slate-800 pb-3">
      <h3 className="text-xl font-black text-white tracking-tight">Kategorije</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {categories.map((cat, idx) => (
        <Link
          key={cat.id}
          to={`/p/${slug}/${generateSlug(cat.name)}${isEmbed ? '?embed=true' : ''}`}
          className="group relative bg-slate-900/70 border border-slate-800 rounded-2xl p-4 transition-all hover:border-blue-500/40 shadow-lg"
        >
          <h4 className="text-base md:text-lg font-black text-white tracking-tight mb-1.5 group-hover:text-blue-300 transition-colors">{cat.name}</h4>
          <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-200 transition-colors">
            <ChevronRight size={14} /> <span className="text-[10px] font-bold uppercase tracking-[0.12em]">Pogledaj rezultate</span>
          </div>
        </Link>
      ))}
    </div>
  </div>
);

const TabsNav = ({ activeTab, setActiveTab }) => (
  <div className="bg-slate-900/70 p-1.5 rounded-2xl border border-slate-800 flex flex-wrap gap-1.5 shadow-lg">
    {[
      { id: 'groups', name: 'Grupe i rezultati', icon: <Users size={15} /> },
      { id: 'knockout', name: 'Završnica', icon: <Trophy size={15} /> }
    ].map(tab => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.12em] transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:text-white hover:bg-slate-800/90'}`}
      >
        {tab.icon} {tab.name}
      </button>
    ))}
  </div>
);

const TabContent = ({ activeTab, competitionId, categorySlug, activeCategory, allMatches, allPlayers }) => {
  const groups = useMemo(() => {
    if (!activeCategory || !activeCategory.groupConfig) return [];
    const config = activeCategory.groupConfig;
    const gArray = [];
    Object.keys(config)
      .sort((a, b) => Number(a) - Number(b))
      .forEach((key) => {
        gArray.push(
          config[key].map((id) => {
            const player = allPlayers.find((p) => p.id === id) || {};
            return {
              id,
              name: player.name || "Nepoznat",
              club: player.club || null,
            };
          })
        );
      });
    return gArray;
  }, [activeCategory, allPlayers]);

  const calculateStandings = (groupIdx) => {
    const groupMatches = allMatches.filter(
      (m) =>
        (!m.categoryId || m.categoryId === activeCategory?.id) &&
        m.groupId === groupIdx &&
        m.status === "completed"
    );
    const groupPlayers = groups[groupIdx] || [];

    const stats = groupPlayers.map((player) => ({
      ...player,
      played: 0,
      won: 0,
      lost: 0,
      setsWon: 0,
      setsLost: 0,
      points: 0,
      pointDiff: 0,
    }));

    groupMatches.forEach((match) => {
      const p1 = stats.find((p) => p.id === (match.player1?.id || match.player1Id));
      const p2 = stats.find((p) => p.id === (match.player2?.id || match.player2Id));

      if (p1 && p2) {
        p1.played++;
        p2.played++;
        p1.setsWon += match.player1Score || 0;
        p1.setsLost += match.player2Score || 0;
        p2.setsWon += match.player2Score || 0;
        p2.setsLost += match.player1Score || 0;

        // Points (gems) from individual sets
        if (match.sets && match.sets.length > 0) {
          match.sets.forEach((set) => {
            const s1 = set.p1 || 0;
            const s2 = set.p2 || 0;
            p1.pointDiff += s1 - s2;
            p2.pointDiff += s2 - s1;
          });
        }

        if (match.player1Score > match.player2Score) {
          p1.won++;
          p2.lost++;
          p1.points += 2;
          p2.points += 1;
        } else if (match.player2Score > match.player1Score) {
          p2.won++;
          p1.lost++;
          p2.points += 2;
          p1.points += 1;
        }
      }
    });

    return stats.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const aDiff = a.setsWon - a.setsLost;
      const bDiff = b.setsWon - b.setsLost;
      if (bDiff !== aDiff) return bDiff - aDiff;
      return b.pointDiff - a.pointDiff;
    });
  };

  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-2.5 md:p-4 shadow-xl">
      {activeTab === "groups" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
          {groups.map((group, gIdx) => {
            const standings = calculateStandings(gIdx);
            const advancingCount = activeCategory.advancingPlayers || 2;
            const groupMatches = allMatches
              .filter((m) => {
                if (m.categoryId && m.categoryId !== activeCategory.id) return false;
                if (m.isKnockout) return false;
                if (m.groupId === gIdx) return true;
                if (activeCategory.format === "round_robin" && gIdx === 0 && (m.groupId === undefined || m.groupId === null)) return true;
                return false;
              })
              .sort((a, b) => (a.round || 0) - (b.round || 0) || (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

            return (
              <div key={gIdx} className={`relative bg-[#0d1527] rounded-xl p-3.5 md:p-4 border border-slate-800 overflow-hidden transition-all duration-300 hover:border-slate-600 ${activeCategory.format === "round_robin" ? "lg:col-span-2" : ""}`}>
                <div className="relative z-10">
                  <h4 className="flex items-center gap-2 text-base font-black text-white mb-3 uppercase tracking-tight">
                    <span className="w-1.5 h-5 bg-blue-500 rounded-full"></span>
                    {activeCategory.format === "round_robin" ? "Tabela Lige" : `Grupa ${String.fromCharCode(65 + gIdx)}`}
                  </h4>
                  
                  <div className="mb-4">
                    <PublicGroupStandings standings={standings} advancingCount={advancingCount} />
                  </div>

                  <div className="pt-3 border-t border-slate-800/80">
                    <PublicGroupMatches matches={groupMatches} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "knockout" && (
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <KnockoutTab 
            competitionId={competitionId} 
            categorySlug={categorySlug} 
            publicView={true} 
            MatchCardComponent={KnockoutMatchCard}
            activeCategory={activeCategory}
            matches={allMatches}
            groups={groups}
            allPlayers={allPlayers}
            calculateStandings={calculateStandings}
            // Isključivanje admin funkcija
            setEditingMatch={null}
            setShowMatchModal={null}
            handleToggleStage={null}
            handleGenerateKnockout={null}
            handleResetKnockout={null}
            handleUpdateMatchPlayer={null}
            handleAddManualMatch={null}
            handleGenerateTemplate={null}
            saveMatchResult={null}
            handleDeleteMatch={null}
            handleDeleteAllMatches={null}
          />
        </div>
      )}
      {activeTab === "players" && <PlayersTab competitionId={competitionId} categorySlug={categorySlug} publicView={true} />}
      {activeTab === "season" && <SeasonList competitionId={competitionId} isPublic={true} />}
    </div>
  );
};

export default CompetitionBody;
