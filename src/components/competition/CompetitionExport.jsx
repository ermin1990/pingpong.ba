import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Filter, Printer, X } from 'lucide-react';
import { calculateStandings } from '../../utils/standings';
import { sanitizeMatchSets } from '../../utils/matchSets';

const dateFormatter = new Intl.DateTimeFormat('bs-BA', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});

const dateTimeFormatter = new Intl.DateTimeFormat('bs-BA', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

const chunkArray = (items = [], size = 2) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const CompetitionExport = ({
  competition,
  categories = [],
  matches = [],
  allPlayers = [],
  initialCategoryId = 'all',
  onClose
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategoryId || 'all');
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [exportLayout, setExportLayout] = useState('report');
  const exportStageRef = useRef(null);

  const safeNum = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const toDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value?.toDate === 'function') {
      const firestoreDate = value.toDate();
      return Number.isNaN(firestoreDate.getTime()) ? null : firestoreDate;
    }
    if (typeof value?.seconds === 'number') {
      const d = new Date(value.seconds * 1000);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
  };

  const formatDate = (value) => {
    const d = toDate(value);
    return d ? dateFormatter.format(d) : 'N/A';
  };

  const formatDateTime = (value) => {
    const d = toDate(value);
    return d ? dateTimeFormatter.format(d) : '';
  };

  const getRoundLabel = (match) => {
    const roundNumber = safeNum(match?.round) || 1;
    return match?.roundName || `Kolo ${roundNumber}.`;
  };

  const getPlayerName = (match, slot) => {
    if (!match) return 'TBD';
    if (slot === 1) return match.player1Name || match.player1?.name || 'TBD';
    return match.player2Name || match.player2?.name || 'TBD';
  };

  const getSetEntries = (match) => {
    const sets = sanitizeMatchSets(match?.sets, match?.player1Score, match?.player2Score);
    if (!Array.isArray(sets)) return [];
    return sets
      .map((set, setIndex) => {
        const p1 = set?.p1 ?? set?.home;
        const p2 = set?.p2 ?? set?.away;
        if (p1 === undefined || p2 === undefined || p1 === '' || p2 === '') return null;
        return {
          label: `Set ${setIndex + 1}`,
          score: `${p1} : ${p2}`
        };
      })
      .filter(Boolean);
  };

  const getFinalScore = (match) => {
    if (match?.status !== 'completed') return '____ : ____';
    return `${safeNum(match.player1Score)} : ${safeNum(match.player2Score)}`;
  };

  const getWinnerSlot = (match) => {
    if (match?.status !== 'completed') return null;
    const p1 = safeNum(match.player1Score);
    const p2 = safeNum(match.player2Score);
    if (p1 === p2) return null;
    return p1 > p2 ? 'player1' : 'player2';
  };

  const playerMap = useMemo(() => {
    const map = new Map();
    allPlayers.forEach((player) => {
      if (player?.id) map.set(player.id, player);
    });
    return map;
  }, [allPlayers]);

  const getCategoryMatches = (categoryId) =>
    matches
      .filter((match) => match.categoryId === categoryId)
      .map((match) => {
        const category = categories.find((c) => c.id === categoryId);
        if (!category) return match;

        const participantIds = new Set();
        (category.playerIds || []).forEach((id) => id && participantIds.add(id));

        if (category.groupConfig && typeof category.groupConfig === 'object') {
          Object.values(category.groupConfig).forEach((group) => {
            if (!Array.isArray(group)) return;
            group.forEach((id) => id && participantIds.add(id));
          });
        }

        (category.doublesPairs || []).forEach((pair) => {
          if (pair?.id) participantIds.add(pair.id);
        });

        if (!participantIds.size) return match;

        const sanitizePlayer = (player) => {
          if (!player?.id || player.id === 'tbd') return player;
          return participantIds.has(player.id) ? player : { id: 'tbd', name: 'TBD' };
        };

        return {
          ...match,
          player1: sanitizePlayer(match.player1),
          player2: sanitizePlayer(match.player2)
        };
      })
      .sort((a, b) => {
        const groupDiff = safeNum(a.groupId) - safeNum(b.groupId);
        if (groupDiff !== 0) return groupDiff;
        const roundDiff = safeNum(a.round) - safeNum(b.round);
        if (roundDiff !== 0) return roundDiff;
        return safeNum(a.bracketIndex) - safeNum(b.bracketIndex);
      });

  const getGroupIndices = (category) => {
    const set = new Set();
    const categoryMatches = getCategoryMatches(category.id);

    if (Array.isArray(category?.groupConfig)) {
      category.groupConfig.forEach((groupPlayers, idx) => {
        if (Array.isArray(groupPlayers) && groupPlayers.length > 0) {
          set.add(idx);
        }
      });
    } else if (category?.groupConfig && typeof category.groupConfig === 'object') {
      Object.keys(category.groupConfig).forEach((key) => {
        const n = Number(key);
        const groupPlayers = category.groupConfig[key];
        if (Number.isFinite(n) && Array.isArray(groupPlayers) && groupPlayers.length > 0) {
          set.add(n);
        }
      });
    }

    categoryMatches.forEach((match) => {
      const groupId = Number(match?.groupId);
      if (!match?.isKnockout && Number.isFinite(groupId)) set.add(groupId);
    });

    if (set.size === 0 && category?.format === 'round_robin' && categoryMatches.length > 0) {
      set.add(0);
    }

    return [...set].sort((a, b) => a - b);
  };

  const getGroupPlayerIds = (category, groupIdx) => {
    if (Array.isArray(category?.groupConfig)) return category.groupConfig[groupIdx] || [];
    return category?.groupConfig?.[groupIdx] || category?.groupConfig?.[String(groupIdx)] || [];
  };

  const getGroupMatches = (category, groupIdx) =>
    getCategoryMatches(category.id).filter((match) => !match.isKnockout && Number(match.groupId) === Number(groupIdx));

  const getKnockoutRoundGroups = (category) => {
    const getRoundSortWeight = (roundName, sampleMatch) => {
      const normalized = String(roundName || '').toLowerCase();
      const numericRound = Number(sampleMatch?.round);

      if (normalized.includes('baraž') || normalized.includes('baraz')) return -100;

      const fractionMatch = normalized.match(/1\s*\/\s*(\d+)/);
      if (fractionMatch) {
        const denominator = Number(fractionMatch[1]);
        if (Number.isFinite(denominator)) return 1000 - denominator;
      }

      if (normalized.includes('polufinale')) return 2000;
      if (normalized.includes('finale') && !normalized.includes('1/')) return 3000;

      if (!Number.isNaN(numericRound)) return numericRound;

      const fallback = normalized.match(/\d+/);
      return fallback ? Number(fallback[0]) : 999;
    };

    const grouped = getCategoryMatches(category.id)
      .filter((match) => {
        const noGroup = match.groupId === undefined || match.groupId === null;
        return match.isKnockout || (match.roundName && noGroup) || safeNum(match.round) < 0;
      })
      .reduce((acc, match) => {
        const key = match.roundName || `Runda ${safeNum(match.round) || 1}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(match);
        return acc;
      }, {});

    return Object.entries(grouped)
      .map(([roundName, roundMatches]) => ({
        roundName,
        sortWeight: getRoundSortWeight(roundName, roundMatches[0]),
        matches: roundMatches.sort((a, b) => safeNum(a.bracketIndex) - safeNum(b.bracketIndex))
      }))
      .sort((a, b) => a.sortWeight - b.sortWeight);
  };

  const getKnockoutRoundOffset = (roundIdx, rounds) => {
    const firstRoundMatches = rounds?.[0]?.matches?.length || 1;
    const currentMatches = rounds?.[roundIdx]?.matches?.length || 1;
    if (firstRoundMatches <= currentMatches) return 0;
    const ratio = firstRoundMatches / currentMatches;
    return Math.max(0, (ratio - 1) * 2.4);
  };

  const getGroupStandings = (category, groupIdx) => {
    const groupMatches = getGroupMatches(category, groupIdx);
    const groupPlayerIds = getGroupPlayerIds(category, groupIdx);
    const winPoints = Number.isFinite(Number(category?.winPoints)) ? Number(category.winPoints) : 2;
    const lossPoints = Number.isFinite(Number(category?.lossPoints)) ? Number(category.lossPoints) : 0;
    const idsFromMatches = groupMatches.flatMap((match) => [match.player1?.id, match.player2?.id]).filter(Boolean);
    const mergedIds = [...new Set([...groupPlayerIds, ...idsFromMatches])];

    const players = mergedIds
      .map((id) => playerMap.get(id) || { id, name: 'Igrač' })
      .filter((player) => player?.id);

    const stats = players.map((player) => ({
      id: player.id,
      name: player.name || 'Igrač',
      played: 0,
      won: 0,
      lost: 0,
      setsWon: 0,
      setsLost: 0,
      points: 0,
      pointDiff: 0
    }));

    groupMatches.forEach((match) => {
      if (match.status !== 'completed') return;

      const p1 = stats.find((s) => s.id === match.player1?.id);
      const p2 = stats.find((s) => s.id === match.player2?.id);
      if (!p1 || !p2) return;

      const s1 = safeNum(match.player1Score);
      const s2 = safeNum(match.player2Score);

      p1.played += 1;
      p2.played += 1;
      p1.setsWon += s1;
      p1.setsLost += s2;
      p2.setsWon += s2;
      p2.setsLost += s1;

      if (Array.isArray(match.sets) && match.sets.length > 0) {
        match.sets.forEach((set) => {
          const p1SetPoints = safeNum(set?.p1 ?? set?.home);
          const p2SetPoints = safeNum(set?.p2 ?? set?.away);
          p1.pointDiff += p1SetPoints - p2SetPoints;
          p2.pointDiff += p2SetPoints - p1SetPoints;
        });
      }

      if (s1 > s2) {
        p1.won += 1;
        p2.lost += 1;
        p1.points += winPoints;
        p2.points += lossPoints;
      } else if (s2 > s1) {
        p2.won += 1;
        p1.lost += 1;
        p2.points += winPoints;
        p1.points += lossPoints;
      }
    });

    return calculateStandings(stats, groupMatches);
  };

  const visibleCategories = useMemo(() => {
    if (selectedCategoryId === 'all') return categories;
    return categories.filter((category) => category.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    setSelectedGroupId('all');
  }, [selectedCategoryId]);

  useEffect(() => {
    if (selectedStage === 'knockout') setSelectedGroupId('all');
  }, [selectedStage]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );

  const availableGroups = useMemo(() => {
    if (!selectedCategory) return [];
    return getGroupIndices(selectedCategory).map((groupIdx) => ({
      id: String(groupIdx),
      label: `Grupa ${String.fromCharCode(65 + groupIdx)}`
    }));
  }, [selectedCategory, matches, categories]);

  const handlePrintPreview = () => {
    const stage = exportStageRef.current;
    const styleTag = document.getElementById('competition-export-styles');
    if (!stage || !styleTag) {
      window.print();
      return;
    }
    const pageTitle = competition?.name || 'Takmicenje';
    const baseStyles = styleTag.textContent || '';
    const frame = document.createElement('iframe');

    frame.setAttribute('aria-hidden', 'true');
    frame.style.position = 'fixed';
    frame.style.right = '0';
    frame.style.bottom = '0';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = '0';
    frame.style.visibility = 'hidden';

    document.body.appendChild(frame);

    const frameDoc = frame.contentDocument || frame.contentWindow?.document;
    if (!frameDoc || !frame.contentWindow) {
      document.body.removeChild(frame);
      window.print();
      return;
    }

    frameDoc.open();
    frameDoc.write(`
      <!doctype html>
      <html lang="bs">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>${pageTitle} - Print Preview</title>
          <style>
            ${baseStyles}
            html, body { margin: 0; padding: 0; background: #fff; }
            .export-stage { max-width: none !important; padding: 0 !important; margin: 0 !important; display: block !important; }
            .preview-page { margin: 0 !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; }
          </style>
        </head>
        <body>
          <div class="export-stage">${stage.innerHTML}</div>
        </body>
      </html>
    `);
    frameDoc.close();

    const cleanup = () => {
      setTimeout(() => {
        if (frame.parentNode) frame.parentNode.removeChild(frame);
      }, 300);
    };

    frame.onload = () => {
      frame.contentWindow.focus();
      frame.contentWindow.print();
      cleanup();
    };
  };

  return (
    <div className="export-overlay fixed inset-0 z-[100] overflow-y-auto bg-[#f3f5f7] text-slate-900">
      <div className="export-toolbar sticky top-0 z-20 border-b border-slate-200 bg-white/96 px-4 py-4 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-900 text-white shadow-sm">
              <Printer size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-900">Print Preview</h2>
              <p className="text-xs font-medium text-slate-500">Pregled prije štampe za sudije i rezultate.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 shadow-sm">
              <Filter size={14} className="text-slate-500" />
              <label htmlFor="export-category-filter" className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600">
                Kategorija
              </label>
              <select
                id="export-category-filter"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
              >
                <option value="all">Sve</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 shadow-sm">
              <label htmlFor="export-group-filter" className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600">
                Grupa
              </label>
              <select
                id="export-group-filter"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                disabled={selectedCategoryId === 'all' || selectedStage === 'knockout'}
              >
                <option value="all">Sve grupe</option>
                {availableGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 shadow-sm">
              <label htmlFor="export-stage-filter" className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600">
                Faza
              </label>
              <select
                id="export-stage-filter"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                disabled={selectedCategoryId === 'all'}
              >
                <option value="all">Sve faze</option>
                <option value="groups">Grupna faza</option>
                <option value="knockout">Knockout faza</option>
              </select>
            </div>

            <div className="inline-flex items-center rounded-2xl border border-slate-300 bg-white p-1 shadow-sm">
              <button
                onClick={() => setExportLayout('report')}
                className={`rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition-colors ${
                  exportLayout === 'report' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Propozicije / Rezultati
              </button>
              <button
                onClick={() => setExportLayout('propositions')}
                className={`rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition-colors ${
                  exportLayout === 'propositions' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Print za sudije
              </button>
            </div>

            <button
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60"
            >
              <X size={15} />
              Zatvori
            </button>

            <button
              onClick={handlePrintPreview}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-700 bg-emerald-700 px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-sm transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
            >
              <Eye size={15} />
              Otvori Print Preview
            </button>
          </div>
        </div>
      </div>

      <div ref={exportStageRef} className="export-stage mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-8 print:max-w-none print:gap-0 print:p-0">
        {visibleCategories.length === 0 && (
          <div className="w-full max-w-3xl rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <h3 className="mb-2 text-xl font-black tracking-tight text-slate-900">Nema Podataka</h3>
            <p className="text-sm font-medium text-slate-500">Za odabranu kategoriju trenutno nema sadržaja za print pregled.</p>
          </div>
        )}

        {visibleCategories.map((category, categoryIndex) => {
          const rawGroupIndices = getGroupIndices(category);
          const groupIndices =
            selectedCategoryId === category.id && selectedGroupId !== 'all'
              ? rawGroupIndices.filter((groupIdx) => String(groupIdx) === selectedGroupId)
              : rawGroupIndices;
          const knockoutRounds = getKnockoutRoundGroups(category);
          const hasGroups = groupIndices.length > 0;
          const hasKnockout = knockoutRounds.length > 0;
          const advancing = category?.advancingCount || category?.advancingPlayers || 2;
          const groupPages = exportLayout === 'propositions'
            ? groupIndices.map((groupIdx) => [groupIdx])
            : chunkArray(groupIndices, 2);

          return (
            <React.Fragment key={category.id}>
              {!hasGroups && !hasKnockout && (
                <section className="preview-page">
                  {categoryIndex === 0 ? (
                    <header className="tournament-header">
                      <div>
                        <p className="event-label">{competition?.organizer || 'pingpong.ba'}</p>
                        <h1>{competition?.name || 'Takmičenje'}</h1>
                        <p className="event-meta">
                          Kategorija: {category.name} | Datum: {formatDate(competition?.startDate)} | Lokacija: {competition?.location || 'Nije uneseno'}
                        </p>
                      </div>
                    </header>
                  ) : (
                    <div className="section-page-header">
                      <h3>Grupna Faza</h3>
                      <p>{category.name}</p>
                    </div>
                  )}

                  <div className="empty-state">Nema definisanih grupa ili mečeva grupne faze.</div>
                  <footer className="page-footer">
                    <span>Generisano: {formatDateTime(new Date())}</span>
                    <span>pingpong.ba</span>
                  </footer>
                </section>
              )}

              {hasGroups && (selectedStage === 'all' || selectedStage === 'groups') && groupPages.map((groupPage, pageIndex) => {
                const isSingleGroupPage = groupPage.length === 1;
                return (
                  <section key={`${category.id}-groups-${pageIndex}`} className="preview-page">
                    {categoryIndex === 0 && pageIndex === 0 ? (
                      <header className="tournament-header">
                        <div>
                          <p className="event-label">{competition?.organizer || 'pingpong.ba'}</p>
                          <h1>{competition?.name || 'Takmičenje'}</h1>
                          <p className="event-meta">
                            {category.name} | {competition?.location || 'Lokacija nije unesena'} | {formatDate(competition?.startDate)}
                          </p>
                        </div>
                      </header>
                    ) : (
                      <div className="section-page-header">
                        <h3>Grupna Faza</h3>
                        <p>{category.name}</p>
                      </div>
                    )}

                    <div className="section-title-row">
                      <h2>{exportLayout === 'propositions' ? 'Print za sudije' : 'Propozicije / Rezultati'}</h2>
                      <span>{exportLayout === 'propositions' ? category.name : `Prolaze prva ${advancing}`}</span>
                    </div>

                    <div className={`groups-container ${isSingleGroupPage ? 'is-single-group-page' : ''} ${exportLayout === 'propositions' ? 'is-propositions-layout' : ''}`}>
                      {groupPage.map((groupIdx) => {
                        const standings = getGroupStandings(category, groupIdx);
                        const groupMatches = getGroupMatches(category, groupIdx);
                        const roundEntries = Object.entries(
                          groupMatches.reduce((acc, match) => {
                            const roundLabel = getRoundLabel(match);
                            if (!acc[roundLabel]) acc[roundLabel] = [];
                            acc[roundLabel].push(match);
                            return acc;
                          }, {})
                        );

                        if (exportLayout === 'propositions') {
                          return (
                            <article key={`${category.id}-${groupIdx}`} className="group-section proposition-group">
                              <div className="group-section-block">
                                <h3 className="group-title">Grupa {String.fromCharCode(65 + groupIdx)}</h3>
                                <p className="proposition-subtitle">Raspored za upis rezultata</p>
                              </div>

                              <div className="round-stack">
                                {roundEntries.length === 0 && (
                                  <div className="empty-state small">Nema mečeva u ovoj grupi.</div>
                                )}

                                {roundEntries.map(([roundLabel, roundMatches]) => (
                                  <div key={roundLabel} className="round-section">
                                    <h4 className="round-title">{roundLabel}</h4>
                                    <div className="proposition-match-list">
                                      {roundMatches.map((match, matchIndex) => (
                                        <div key={match.id || `${roundLabel}-${matchIndex}`} className="table-shell proposition-match-shell">
                                          <table className="preview-table proposition-match-table">
                                            <thead>
                                              <tr>
                                                <th colSpan={2} className="proposition-match-title">Meč {matchIndex + 1}</th>
                                                <th>S1</th>
                                                <th>S2</th>
                                                <th>S3</th>
                                                <th>S4</th>
                                                <th>S5</th>
                                                <th>K</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              <tr>
                                                <td className="proposition-player-label">A</td>
                                                <td className="proposition-player-name-cell">{getPlayerName(match, 1)}</td>
                                                <td className="blank-cell"></td>
                                                <td className="blank-cell"></td>
                                                <td className="blank-cell"></td>
                                                <td className="blank-cell"></td>
                                                <td className="blank-cell"></td>
                                                <td className="blank-cell final"></td>
                                              </tr>
                                              <tr>
                                                <td className="proposition-player-label">B</td>
                                                <td className="proposition-player-name-cell">{getPlayerName(match, 2)}</td>
                                                <td className="blank-cell"></td>
                                                <td className="blank-cell"></td>
                                                <td className="blank-cell"></td>
                                                <td className="blank-cell"></td>
                                                <td className="blank-cell"></td>
                                                <td className="blank-cell final"></td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </article>
                          );
                        }

                        return (
                          <article key={`${category.id}-${groupIdx}`} className="group-section">
                            <div className="group-section-block">
                              <h3 className="group-title">Grupa {String.fromCharCode(65 + groupIdx)}</h3>
                              <div className="table-shell">
                                <table className="preview-table standings-table">
                                  <thead>
                                    <tr>
                                      <th>#</th>
                                      <th>Igrač</th>
                                      <th>P</th>
                                      <th>I</th>
                                      <th>Set±</th>
                                      <th>Gem±</th>
                                      <th>B</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {standings.length === 0 && (
                                      <tr>
                                        <td colSpan={7} className="empty-cell">Nema tabele za ovu grupu.</td>
                                      </tr>
                                    )}
                                    {standings.map((player, index) => (
                                      <tr key={player.id || index} className={index < advancing ? 'is-advance' : ''}>
                                        <td>{index + 1}</td>
                                        <td>{player.name || 'N/A'}</td>
                                        <td>{player.won}</td>
                                        <td>{player.lost}</td>
                                        <td>{player.setsWon - player.setsLost > 0 ? `+${player.setsWon - player.setsLost}` : player.setsWon - player.setsLost}</td>
                                        <td>{player.pointDiff > 0 ? `+${player.pointDiff}` : player.pointDiff}</td>
                                        <td><strong>{player.points}</strong></td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div className="group-section-block">
                              <h3 className="group-title">Mečevi</h3>
                              <div className="round-stack">
                                {roundEntries.length === 0 && (
                                  <div className="empty-state small">Nema mečeva u ovoj grupi.</div>
                                )}

                                {roundEntries.map(([roundLabel, roundMatches]) => (
                                  <div key={roundLabel} className="round-section">
                                    <h4 className="round-title">{roundLabel}</h4>
                                    <div className="match-stack">
                                      {roundMatches.map((match, matchIndex) => {
                                        const winnerSlot = getWinnerSlot(match);
                                        const setEntries = getSetEntries(match);
                                        return (
                                          <div key={match.id || `${roundLabel}-${matchIndex}`} className="match-card">
                                            <div className="match-row">
                                              <div className="match-players">
                                                <span className={`player-name ${winnerSlot === 'player1' ? 'is-winner' : ''}`}>
                                                  {getPlayerName(match, 1)}
                                                </span>
                                                <span className="versus">vs</span>
                                                <span className={`player-name ${winnerSlot === 'player2' ? 'is-winner' : ''}`}>
                                                  {getPlayerName(match, 2)}
                                                </span>
                                              </div>
                                              <div className="match-final-score">{getFinalScore(match)}</div>
                                            </div>

                                            {setEntries.length > 0 && (
                                              <div className="set-grid">
                                                {setEntries.map((setEntry) => (
                                                  <div key={setEntry.label} className="set-pill">
                                                    <span>{setEntry.label}</span>
                                                    <strong>{setEntry.score}</strong>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    <footer className="page-footer">
                      <span>Generisano: {formatDateTime(new Date())}</span>
                      <span>pingpong.ba</span>
                    </footer>
                  </section>
                );
              })}

              {exportLayout === 'propositions' && hasKnockout && (selectedStage === 'all' || selectedStage === 'knockout') && (
                <section className="preview-page">
                  <div className="section-page-header">
                    <h3>Eliminaciona Faza</h3>
                    <p>{category.name}</p>
                  </div>

                  <div className="section-title-row">
                    <h2>Eliminacioni Raspored za Sudije</h2>
                    <span>{knockoutRounds.reduce((acc, round) => acc + round.matches.length, 0)} mečeva</span>
                  </div>

                  <div className="page-section">
                    {knockoutRounds.map((round) => (
                      <div key={round.roundName} className="round-section">
                        <h4 className="round-title">{round.roundName}</h4>
                        <div className="proposition-match-list">
                          {round.matches.map((match, matchIndex) => (
                            <div key={match.id || `${round.roundName}-${matchIndex}`} className="table-shell proposition-match-shell">
                              <table className="preview-table proposition-match-table">
                                <thead>
                                  <tr>
                                    <th colSpan={2} className="proposition-match-title">Meč {matchIndex + 1}</th>
                                    <th>S1</th>
                                    <th>S2</th>
                                    <th>S3</th>
                                    <th>S4</th>
                                    <th>S5</th>
                                    <th>K</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td className="proposition-player-label">A</td>
                                    <td className="proposition-player-name-cell">{getPlayerName(match, 1)}</td>
                                    <td className="blank-cell"></td>
                                    <td className="blank-cell"></td>
                                    <td className="blank-cell"></td>
                                    <td className="blank-cell"></td>
                                    <td className="blank-cell"></td>
                                    <td className="blank-cell final"></td>
                                  </tr>
                                  <tr>
                                    <td className="proposition-player-label">B</td>
                                    <td className="proposition-player-name-cell">{getPlayerName(match, 2)}</td>
                                    <td className="blank-cell"></td>
                                    <td className="blank-cell"></td>
                                    <td className="blank-cell"></td>
                                    <td className="blank-cell"></td>
                                    <td className="blank-cell"></td>
                                    <td className="blank-cell final"></td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <footer className="page-footer">
                    <span>Generisano: {formatDateTime(new Date())}</span>
                    <span>pingpong.ba</span>
                  </footer>
                </section>
              )}

              {exportLayout === 'report' && hasKnockout && (selectedStage === 'all' || selectedStage === 'knockout') && (
                <section className="preview-page">
                  <div className="section-page-header">
                    <h3>Eliminaciona Faza</h3>
                    <p>{category.name}</p>
                  </div>

                  <div className="page-section knockout-section">
                    <div className="section-title-row">
                      <h2>Eliminacioni Tree</h2>
                      <span>{knockoutRounds.reduce((acc, round) => acc + round.matches.length, 0)} mečeva</span>
                    </div>

                    <div className="knockout-bracket-shell">
                      <div className="knockout-bracket">
                        {knockoutRounds.map((round, roundIdx) => (
                          <div key={round.roundName} className="knockout-round">
                            <div className="knockout-round-title">{round.roundName}</div>
                            <div
                              className="knockout-round-stack"
                              style={{
                                marginTop: `${getKnockoutRoundOffset(roundIdx, knockoutRounds)}mm`,
                                marginBottom: `${getKnockoutRoundOffset(roundIdx, knockoutRounds)}mm`
                              }}
                            >
                              {round.matches.map((match, idx) => {
                                const winnerSlot = getWinnerSlot(match);
                                return (
                                  <div key={match.id || `${round.roundName}-${idx}`} className="knockout-match-card">
                                    {match.status === 'in_progress' && <div className="knockout-live-badge">Live</div>}

                                    <div className={`knockout-player-row ${winnerSlot === 'player1' ? 'is-winner' : ''}`}>
                                      <span className="knockout-player-name">{getPlayerName(match, 1)}</span>
                                      <span className="knockout-player-score">
                                        {match.status === 'completed' || match.status === 'in_progress' ? safeNum(match.player1Score) : ''}
                                      </span>
                                    </div>

                                    <div className={`knockout-player-row ${winnerSlot === 'player2' ? 'is-winner' : ''}`}>
                                      <span className="knockout-player-name">{getPlayerName(match, 2)}</span>
                                      <span className="knockout-player-score">
                                        {match.status === 'completed' || match.status === 'in_progress' ? safeNum(match.player2Score) : ''}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <footer className="page-footer">
                    <span>Generisano: {formatDateTime(new Date())}</span>
                    <span>pingpong.ba</span>
                  </footer>
                </section>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <style
        id="competition-export-styles"
        dangerouslySetInnerHTML={{
          __html: `
            .export-overlay {
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            .preview-page {
              width: 210mm;
              min-height: 297mm;
              box-sizing: border-box;
              background: #ffffff;
              border: 1px solid #d7dee7;
              border-radius: 18px;
              box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
              padding: 10mm 8mm 8mm;
              display: flex;
              flex-direction: column;
              gap: 5mm;
              page-break-after: always;
              break-after: page;
            }
            .preview-page:last-child {
              page-break-after: auto;
              break-after: auto;
            }
            .tournament-header {
              text-align: center;
              padding: 2mm 0 4mm;
              border-bottom: 1px solid #d7dee7;
            }
            .event-label {
              margin: 0 0 1.5mm 0;
              font-size: 4.4mm;
              line-height: 1.1;
              color: #475569;
              font-weight: 500;
            }
            .tournament-header h1 {
              margin: 0 0 2mm 0;
              font-size: 8.6mm;
              line-height: 1.02;
              font-weight: 800;
              letter-spacing: -0.02em;
              color: #0f172a;
            }
            .event-meta {
              margin: 0;
              font-size: 3.4mm;
              line-height: 1.35;
              color: #64748b;
            }
            .section-title-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 4mm;
              margin-top: 1mm;
            }
            .section-page-header {
              display: flex;
              align-items: baseline;
              justify-content: space-between;
              gap: 4mm;
              border-bottom: 1px solid #d7dee7;
              padding-bottom: 2.5mm;
              margin-bottom: 1mm;
            }
            .section-page-header h3 {
              margin: 0;
              font-size: 5mm;
              line-height: 1.1;
              color: #0f172a;
              font-weight: 700;
              letter-spacing: -0.01em;
            }
            .section-page-header p {
              margin: 0;
              font-size: 3.1mm;
              color: #64748b;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.08em;
            }
            .section-title-row h2 {
              margin: 0;
              font-size: 5.1mm;
              line-height: 1.1;
              color: #0f172a;
              font-weight: 700;
              letter-spacing: -0.02em;
            }
            .section-title-row span {
              font-size: 3.2mm;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.16em;
              color: #64748b;
            }
            .page-section {
              display: flex;
              flex-direction: column;
              gap: 3mm;
            }
            .groups-container {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 6mm;
              align-items: start;
            }
            .groups-container.is-single-group-page {
              grid-template-columns: minmax(0, 1fr);
            }
            .groups-container.is-propositions-layout {
              grid-template-columns: minmax(0, 1fr);
            }
            .proposition-group {
              gap: 3.2mm;
            }
            .group-section {
              display: flex;
              flex-direction: column;
              gap: 5mm;
            }
            .group-section-block {
              display: flex;
              flex-direction: column;
              gap: 2.5mm;
            }
            .group-title {
              margin: 0;
              font-size: 4.6mm;
              font-weight: 600;
              color: #475569;
            }
            .table-shell {
              overflow: hidden;
              border: 1px solid #d1d5db;
              border-radius: 4px;
              background: #fff;
            }
            .preview-table {
              width: 100%;
              border-collapse: collapse;
            }
            .preview-table th {
              background: #f1f5f9;
              color: #334155;
              font-size: 2.7mm;
              font-weight: 700;
              padding: 2.5mm 2.7mm;
              border: 1px solid #dbe1e8;
              text-align: left;
            }
            .preview-table td {
              background: #ffffff;
              color: #0f172a;
              font-size: 2.7mm;
              padding: 2.4mm 2.7mm;
              border: 1px solid #e2e8f0;
              vertical-align: middle;
            }
            .standings-table tr.is-advance td {
              background: #ecfdf3;
            }
            .round-stack {
              display: flex;
              flex-direction: column;
              gap: 3.6mm;
            }
            .round-section {
              display: flex;
              flex-direction: column;
              gap: 2mm;
            }
            .round-title {
              margin: 0;
              font-size: 3.6mm;
              font-weight: 600;
              color: #64748b;
            }
            .proposition-subtitle {
              margin: 0;
              font-size: 2.6mm;
              color: #64748b;
              font-weight: 500;
            }
            .proposition-match-list {
              display: flex;
              flex-direction: column;
              gap: 2mm;
            }
            .proposition-match-shell {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .proposition-match-table th {
              text-align: center;
              font-size: 2.5mm;
              padding: 1.6mm 1.8mm;
            }
            .proposition-match-table td {
              font-size: 2.6mm;
              padding: 1.5mm 1.8mm;
            }
            .proposition-match-title {
              text-align: left !important;
              padding-left: 2mm !important;
            }
            .proposition-player-label {
              width: 7mm;
              min-width: 7mm;
              text-align: center;
              font-weight: 700;
              color: #334155;
            }
            .proposition-player-name-cell {
              width: 100%;
              white-space: normal;
              word-break: break-word;
              line-height: 1.26;
              font-weight: 600;
            }
            .proposition-match-table .blank-cell {
              width: 11mm;
              min-width: 11mm;
              height: 7.2mm;
              background: #fff !important;
              padding: 0 !important;
            }
            .proposition-match-table .blank-cell.final {
              width: 15mm;
              min-width: 15mm;
            }
            .match-stack {
              display: flex;
              flex-direction: column;
              gap: 2.4mm;
            }
            .match-card {
              border: 1px solid #d1d5db;
              border-radius: 4px;
              padding: 3mm;
              background: #ffffff;
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .match-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 3mm;
              margin-bottom: 2.5mm;
            }
            .match-players {
              display: flex;
              align-items: center;
              gap: 2mm;
              min-width: 0;
              flex: 1;
            }
            .player-name {
              font-size: 3.05mm;
              font-weight: 600;
              color: #64748b;
              min-width: 0;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .player-name.is-winner {
              color: #0f172a;
              font-weight: 700;
            }
            .versus {
              font-size: 2.9mm;
              color: #64748b;
              flex-shrink: 0;
            }
            .match-final-score {
              font-size: 3.1mm;
              font-weight: 700;
              color: #334155;
              white-space: nowrap;
            }
            .set-grid {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 1.6mm;
            }
            .set-pill {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 1.4mm;
              border: 1px solid #e2e8f0;
              border-radius: 999px;
              padding: 1.4mm 2mm;
              background: #f8fafc;
            }
            .set-pill span {
              font-size: 2.3mm;
              color: #64748b;
            }
            .set-pill strong {
              font-size: 2.45mm;
              color: #0f172a;
            }
            .empty-cell,
            .empty-state {
              text-align: center;
              color: #64748b;
              font-style: italic;
            }
            .empty-state {
              border: 1px dashed #cbd5e1;
              border-radius: 8px;
              background: #f8fafc;
              padding: 6mm;
            }
            .empty-state.small {
              padding: 3mm;
            }
            .knockout-section {
              flex: 1;
            }
            .knockout-bracket-shell {
              overflow: hidden;
              border: 1px solid #d1d5db;
              border-radius: 12px;
              background: #f8fafc;
              padding: 4mm;
            }
            .knockout-bracket {
              display: flex;
              justify-content: center;
              align-items: stretch;
              gap: 2mm;
              width: 100%;
              min-height: 92mm;
            }
            .knockout-round {
              display: flex;
              flex-direction: column;
              justify-content: center;
              gap: 1.5mm;
              min-width: 0;
              flex: 1;
            }
            .knockout-round-title {
              text-align: center;
              font-size: 2.7mm;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.12em;
              color: #0f172a;
            }
            .knockout-round-stack {
              display: flex;
              flex-direction: column;
              gap: 1.8mm;
              justify-content: center;
              flex: 1;
            }
            .knockout-match-card {
              border: 1px solid #d1d5db;
              border-radius: 8px;
              background: #ffffff;
              padding: 1.8mm 2mm;
              break-inside: avoid;
            }
            .knockout-live-badge {
              margin-bottom: 1mm;
              text-align: center;
              font-size: 2.3mm;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.14em;
              color: #dc2626;
            }
            .knockout-player-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 1.2mm;
              margin-bottom: 0.8mm;
            }
            .knockout-player-row:last-child {
              margin-bottom: 0;
            }
            .knockout-player-name {
              min-width: 0;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              font-size: 2.4mm;
              font-weight: 600;
              color: #475569;
            }
            .knockout-player-row.is-winner .knockout-player-name {
              color: #0f172a;
              font-weight: 700;
            }
            .knockout-player-score {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 4.8mm;
              min-width: 4.8mm;
              height: 4.8mm;
              border-radius: 1.4mm;
              background: #16a34a;
              color: #fff;
              font-size: 2.2mm;
              font-weight: 700;
            }
            .page-footer {
              margin-top: auto;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 4mm;
              border-top: 1px solid #d7dee7;
              padding-top: 3mm;
              font-size: 2.8mm;
              color: #64748b;
            }
            @media (max-width: 900px) {
              .groups-container {
                grid-template-columns: 1fr;
              }
              .set-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
            }
            @media print {
              @page {
                size: A4 portrait;
                margin: 9mm 7mm 8mm;
              }
              .preview-page {
                width: auto !important;
                min-height: auto !important;
                margin: 0 !important;
                border: none !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                padding: 3mm 0 3mm !important;
                page-break-after: always !important;
                break-after: page !important;
              }
              .preview-page:last-child {
                page-break-after: auto !important;
                break-after: auto !important;
              }
              .export-toolbar {
                display: none !important;
              }
              .groups-container {
                display: grid !important;
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                gap: 5mm !important;
              }
              .groups-container.is-propositions-layout {
                grid-template-columns: minmax(0, 1fr) !important;
              }
              .match-card,
              .knockout-match-card,
              .table-shell {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
              .round-section {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
              .group-section-block,
              .preview-table {
                break-inside: auto !important;
                page-break-inside: auto !important;
              }
              .knockout-bracket {
                min-height: 86mm !important;
              }
              .set-grid {
                grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              }
            }
          `
        }}
      />
    </div>
  );
};

export default CompetitionExport;
