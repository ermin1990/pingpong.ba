import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ChevronLeft, ChevronRight, MonitorPlay, Trophy } from 'lucide-react';

import { useCompetitionData } from '../components/public/PublicCompetition/useCompetitionData';
import PublicGroupStandings from '../components/public/PublicGroupStandings';
import KnockoutTab from '../components/competition/KnockoutTab';
import KnockoutMatchCard from '../components/public/PublicCompetition/UI/KnockoutMatchCard';

const GROUP_ZOOM_STORAGE_KEY = 'semafor-group-zoom-map';

const toNumericGroupIds = (groupConfig = {}) =>
  Object.keys(groupConfig)
    .map((key) => Number(key))
    .filter((key) => !Number.isNaN(key))
    .sort((a, b) => a - b);

const buildGroupsForCategory = (category, allPlayers) => {
  if (!category?.groupConfig) {
    if (category?.format !== 'round_robin') return [];

    const leaguePlayers = (category.playerIds || []).map((playerId) => {
      const player = allPlayers.find((candidate) => candidate.id === playerId) || {};
      return {
        id: playerId,
        name: player.name || 'Nepoznat',
        club: player.club || null,
      };
    });

    return [leaguePlayers];
  }

  return toNumericGroupIds(category.groupConfig).map((groupId) =>
    (category.groupConfig[groupId] || []).map((playerId) => {
      const player = allPlayers.find((candidate) => candidate.id === playerId) || {};
      return {
        id: playerId,
        name: player.name || 'Nepoznat',
        club: player.club || null,
      };
    })
  );
};

const calculateStandingsForGroup = (category, allMatches, groups, groupIdx, manualOrders = {}) => {
  const winPoints = Number.isFinite(Number(category?.winPoints)) ? Number(category.winPoints) : 2;
  const lossPoints = Number.isFinite(Number(category?.lossPoints)) ? Number(category.lossPoints) : 0;
  const groupPlayers = groups[groupIdx] || [];
  const groupMatches = allMatches.filter((match) => {
    if (match.categoryId && match.categoryId !== category?.id) return false;
    if (match.isKnockout) return false;
    if (match.status !== 'completed') return false;
    if (match.groupId === groupIdx) return true;
    if (category?.format === 'round_robin' && groupIdx === 0 && (match.groupId === undefined || match.groupId === null)) {
      return true;
    }
    return false;
  });

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
    const p1 = stats.find((player) => player.id === (match.player1?.id || match.player1Id));
    const p2 = stats.find((player) => player.id === (match.player2?.id || match.player2Id));

    if (!p1 || !p2) return;

    p1.played += 1;
    p2.played += 1;
    p1.setsWon += match.player1Score || 0;
    p1.setsLost += match.player2Score || 0;
    p2.setsWon += match.player2Score || 0;
    p2.setsLost += match.player1Score || 0;

    if (Array.isArray(match.sets) && match.sets.length > 0) {
      match.sets.forEach((set) => {
        const s1 = set.p1 || 0;
        const s2 = set.p2 || 0;
        p1.pointDiff += s1 - s2;
        p2.pointDiff += s2 - s1;
      });
    }

    if (match.player1Score > match.player2Score) {
      p1.won += 1;
      p2.lost += 1;
      p1.points += winPoints;
      p2.points += lossPoints;
    } else if (match.player2Score > match.player1Score) {
      p2.won += 1;
      p1.lost += 1;
      p2.points += winPoints;
      p1.points += lossPoints;
    }
  });

  const groupOrder = manualOrders[String(groupIdx)] || [];
  if (groupOrder.length > 0) {
    return [...stats].sort((a, b) => {
      const idxA = groupOrder.indexOf(a.id);
      const idxB = groupOrder.indexOf(b.id);

      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  }

  return [...stats].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aDiff = a.setsWon - a.setsLost;
    const bDiff = b.setsWon - b.setsLost;
    if (bDiff !== aDiff) return bDiff - aDiff;
    return b.pointDiff - a.pointDiff;
  });
};

const buildGroupMatches = (category, allMatches, groupIdx) =>
  allMatches
    .filter((match) => {
      if (match.categoryId && match.categoryId !== category?.id) return false;
      if (match.isKnockout) return false;
      if (match.groupId === groupIdx) return true;
      if (category?.format === 'round_robin' && groupIdx === 0 && (match.groupId === undefined || match.groupId === null)) {
        return true;
      }
      return false;
    })
    .sort((a, b) => (a.round || 0) - (b.round || 0) || (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

const SimpleGroupResults = ({ matches = [], fontScale = 'normal' }) => {
  if (!matches.length) {
    return (
      <div className="h-full rounded-2xl border border-white/10 bg-[#0b1222] flex items-center justify-center text-center px-4">
        <p className="text-sm text-slate-400">Nema upisanih mečeva za ovu grupu.</p>
      </div>
    );
  }

  const matchesByRound = matches.reduce((acc, match) => {
    const roundKey = match.round || 1;
    if (!acc[roundKey]) acc[roundKey] = [];
    acc[roundKey].push(match);
    return acc;
  }, {});

  const sortedRounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  const totalMatches = matches.length;
  const roundCount = sortedRounds.length;
  const maxMatchesInRound = sortedRounds.reduce(
    (max, round) => Math.max(max, matchesByRound[round]?.length || 0),
    0
  );

  const forcedSmall = fontScale === 'small' || fontScale === 'xsmall';
  const forcedVerySmall = fontScale === 'xsmall';
  const isDense = forcedSmall || totalMatches >= 12 || maxMatchesInRound >= 6;
  const isVeryDense = forcedVerySmall || totalMatches >= 18 || maxMatchesInRound >= 9;

  const roundsGridClass =
    roundCount <= 1
      ? 'grid-cols-1'
      : 'grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4';

  return (
    <div className={`h-full overflow-y-auto pr-1 grid gap-2 ${roundsGridClass}`}>
      {sortedRounds.map((round) => (
        <div key={`round-${round}`} className="rounded-xl border border-slate-800 bg-[#0b1222] p-2 min-h-0 flex flex-col">
          <div className="px-2 py-1 rounded-md bg-slate-900/70 border border-slate-800 text-[9px] text-slate-400 font-black uppercase tracking-[0.14em] mb-2 shrink-0">
            Kolo {round}
          </div>

          <div className={`grid gap-1.5 min-h-0 ${matchesByRound[round].length > 5 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {matchesByRound[round].map((match) => {
              const p1Name = match.player1?.name || 'TBD';
              const p2Name = match.player2?.name || 'TBD';
              const p1Score = Number(match.player1Score) || 0;
              const p2Score = Number(match.player2Score) || 0;
              const isCompleted = match.status === 'completed';
              const p1Wins = isCompleted && p1Score > p2Score;
              const p2Wins = isCompleted && p2Score > p1Score;

              return (
                <div
                  key={match.id}
                  className={`rounded-lg border border-slate-800 bg-[#0e172a] ${isVeryDense ? 'p-1.5' : isDense ? 'p-2' : 'p-2.5'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className={`truncate font-bold ${isVeryDense ? 'text-[11px]' : 'text-xs'} ${p1Wins ? 'text-emerald-300' : 'text-slate-200'}`}>{p1Name}</div>
                      <div className={`truncate font-bold ${isVeryDense ? 'text-[11px]' : 'text-xs'} ${p2Wins ? 'text-emerald-300' : 'text-slate-200'}`}>{p2Name}</div>
                    </div>
                    <div className="shrink-0 flex flex-col gap-1">
                      <div className={`min-w-8 rounded px-1.5 py-0.5 text-center font-black ${isVeryDense ? 'text-[11px]' : 'text-xs'} ${p1Wins ? 'bg-emerald-500 text-emerald-950' : 'bg-slate-800 text-slate-300'}`}>
                        {p1Score}
                      </div>
                      <div className={`min-w-8 rounded px-1.5 py-0.5 text-center font-black ${isVeryDense ? 'text-[11px]' : 'text-xs'} ${p2Wins ? 'bg-emerald-500 text-emerald-950' : 'bg-slate-800 text-slate-300'}`}>
                        {p2Score}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const PublicSemafor = () => {
  const {
    competition,
    loading,
    error,
    categories,
    allMatches,
    allPlayers,
    manualOrders,
  } = useCompetitionData();

  const semaforSettings = competition?.semaforSettings || {};
  const isSemaforEnabled = semaforSettings.enabled !== false;
  const showPublicQr = semaforSettings.showPublicQr === true;
  const qrSlideInterval = Math.max(2, Number(semaforSettings.qrSlideInterval) || 5);
  const phases = semaforSettings.phases || { groups: true, knockout: true };
  const selectedCategoryIds = semaforSettings.selectedCategoryIds || [];
  const selectedGroupsByCategory = semaforSettings.selectedGroupsByCategory || {};
  const slideDurationSec = Math.max(5, Number(semaforSettings.slideDurationSec) || 12);
  const publicCompetitionLink = `${window.location.origin}/p/${competition?.slug || competition?.id || ''}`;
  const publicCompetitionQrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(publicCompetitionLink)}`;

  const baseSlides = useMemo(() => {
    if (!categories || categories.length === 0) return [];

    const prepared = [];

    categories.forEach((category) => {
      if (selectedCategoryIds.length > 0 && !selectedCategoryIds.includes(category.id)) return;

      const groups = buildGroupsForCategory(category, allPlayers);
      const availableGroupIds = groups.map((_, idx) => idx);
      const configuredGroupIds = Array.isArray(selectedGroupsByCategory[category.id])
        ? selectedGroupsByCategory[category.id].map((value) => Number(value)).filter((value) => !Number.isNaN(value))
        : availableGroupIds;
      const selectedGroupIds = configuredGroupIds.filter((groupId) => availableGroupIds.includes(groupId));
      const isKnockoutCapable = category.format === 'groups_knockout' || category.format === 'direct_knockout' || category.format === 'knockout';

      if (phases.groups !== false && selectedGroupIds.length > 0) {
        selectedGroupIds.forEach((groupIdx) => {
          const standings = calculateStandingsForGroup(
            category,
            allMatches,
            groups,
            groupIdx,
            manualOrders?.[category.id] || {}
          );
          const matches = buildGroupMatches(category, allMatches, groupIdx);

          prepared.push({
            id: `${category.id}-group-${groupIdx}`,
            type: 'group',
            category,
            groupIdx,
            groups,
            standings,
            matches,
          });
        });
      }

      if (phases.knockout !== false && isKnockoutCapable) {
        prepared.push({
          id: `${category.id}-knockout`,
          type: 'knockout',
          category,
          groups,
        });
      }
    });

    return prepared;
  }, [
    categories,
    allMatches,
    allPlayers,
    manualOrders,
    phases.groups,
    phases.knockout,
    selectedCategoryIds,
    selectedGroupsByCategory,
  ]);

  const slides = useMemo(() => {
    if (!showPublicQr || !(competition?.slug || competition?.id)) {
      return baseSlides;
    }

    const qrSlideTemplate = {
      type: 'qr',
      qrLink: publicCompetitionLink,
      qrSrc: publicCompetitionQrSrc,
    };

    if (baseSlides.length === 0) {
      return [{ ...qrSlideTemplate, id: 'qr-only-0' }];
    }

    const chunkSize = Math.max(1, qrSlideInterval - 1);
    const result = [];

    for (let index = 0, block = 0; index < baseSlides.length; index += chunkSize, block += 1) {
      result.push({ ...qrSlideTemplate, id: `qr-${block}` });
      result.push(...baseSlides.slice(index, index + chunkSize));
    }

    return result;
  }, [
    baseSlides,
    showPublicQr,
    qrSlideInterval,
    competition?.slug,
    competition?.id,
    publicCompetitionLink,
    publicCompetitionQrSrc,
  ]);

  const [activeSlide, setActiveSlide] = useState(0);
  const currentSlide = slides[activeSlide];
  const [fontScale, setFontScale] = useState(() => {
    try {
      const saved = window.localStorage.getItem('semafor-font-scale');
      return saved || 'normal';
    } catch {
      return 'normal';
    }
  });
  const [groupZoomBySlide, setGroupZoomBySlide] = useState(() => {
    try {
      const saved = window.localStorage.getItem(GROUP_ZOOM_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  });
  const groupOuterRef = useRef(null);
  const groupInnerRef = useRef(null);
  const groupFitScaleBySlideRef = useRef({});
  const [groupFitScale, setGroupFitScale] = useState(1);

  useEffect(() => {
    try {
      window.localStorage.setItem('semafor-font-scale', fontScale);
    } catch {}
  }, [fontScale]);

  useEffect(() => {
    try {
      window.localStorage.setItem(GROUP_ZOOM_STORAGE_KEY, JSON.stringify(groupZoomBySlide));
    } catch {}
  }, [groupZoomBySlide]);

  useEffect(() => {
    if (!slides.length) {
      setActiveSlide(0);
      return;
    }

    const safeIndex = Math.min(activeSlide, slides.length - 1);
    if (safeIndex !== activeSlide) {
      setActiveSlide(safeIndex);
    }
  }, [slides, activeSlide]);

  useEffect(() => {
    if (slides.length <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, slideDurationSec * 1000);

    return () => window.clearInterval(intervalId);
  }, [slides.length, slideDurationSec]);

  const nextSlide = () => {
    if (!slides.length) return;
    setActiveSlide((current) => (current + 1) % slides.length);
  };

  const prevSlide = () => {
    if (!slides.length) return;
    setActiveSlide((current) => (current - 1 + slides.length) % slides.length);
  };

  const fontOrder = ['normal', 'small', 'xsmall'];
  const fontIndex = Math.max(0, fontOrder.indexOf(fontScale));

  const makeFontSmaller = () => {
    const next = Math.min(fontOrder.length - 1, fontIndex + 1);
    setFontScale(fontOrder[next]);
  };

  const makeFontLarger = () => {
    const next = Math.max(0, fontIndex - 1);
    setFontScale(fontOrder[next]);
  };

  const isCrowdedGroupSlide =
    currentSlide?.type === 'group' &&
    ((currentSlide?.standings?.length || 0) > 5 || (currentSlide?.matches?.length || 0) > 12);
  const currentSlideZoom = currentSlide?.type === 'group' ? Number(groupZoomBySlide[currentSlide.id] || 1) : 1;
  const maxSlideZoom = isCrowdedGroupSlide ? 1 : 1.25;
  const appliedGroupScale = currentSlide?.type === 'group'
    ? Math.max(0.72, Math.min(maxSlideZoom, groupFitScale * currentSlideZoom))
    : 1;

  const zoomInCurrentGroup = () => {
    if (!currentSlide || currentSlide.type !== 'group') return;
    setGroupZoomBySlide((prev) => {
      const current = Number(prev[currentSlide.id] || 1);
      const next = Math.min(1.25, Number((current + 0.05).toFixed(2)));
      return { ...prev, [currentSlide.id]: next };
    });
  };

  const zoomOutCurrentGroup = () => {
    if (!currentSlide || currentSlide.type !== 'group') return;
    setGroupZoomBySlide((prev) => {
      const current = Number(prev[currentSlide.id] || 1);
      const next = Math.max(0.8, Number((current - 0.05).toFixed(2)));
      return { ...prev, [currentSlide.id]: next };
    });
  };

  useEffect(() => {
    if (currentSlide?.type !== 'group') {
      return undefined;
    }

    const slideId = currentSlide.id;
    const cachedScale = groupFitScaleBySlideRef.current[slideId];
    if (typeof cachedScale === 'number') {
      setGroupFitScale(cachedScale);
      return undefined;
    }

    let isCancelled = false;

    const calculateFit = () => {
      if (isCancelled) return false;

      const outer = groupOuterRef.current;
      const inner = groupInnerRef.current;
      if (!outer || !inner) return false;

      const availableWidth = outer.clientWidth;
      const availableHeight = outer.clientHeight;
      const neededWidth = inner.scrollWidth;
      const neededHeight = inner.scrollHeight;

      if (!availableWidth || !availableHeight || !neededWidth || !neededHeight) {
        return false;
      }

      const widthScale = availableWidth / neededWidth;
      const heightScale = availableHeight / neededHeight;
      const nextScale = Math.min(1, widthScale, heightScale);
      const resolvedScale = Math.max(0.72, Number.isFinite(nextScale) ? nextScale : 1);

      // Cache per-slide fit so returning to same slide does not trigger new auto-adjustments.
      groupFitScaleBySlideRef.current[slideId] = resolvedScale;
      setGroupFitScale(resolvedScale);
      return true;
    };

    const tryMeasureUntilReady = () => {
      if (isCancelled) return;
      const measured = calculateFit();
      if (!measured) window.requestAnimationFrame(tryMeasureUntilReady);
    };

    tryMeasureUntilReady();

    const resizeObserver = new ResizeObserver(() => {
      if (typeof groupFitScaleBySlideRef.current[slideId] === 'number') return;
      calculateFit();
    });
    if (groupOuterRef.current) resizeObserver.observe(groupOuterRef.current);
    if (groupInnerRef.current) resizeObserver.observe(groupInnerRef.current);

    const handleResize = () => {
      if (typeof groupFitScaleBySlideRef.current[slideId] === 'number') return;
      calculateFit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isCancelled = true;
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [currentSlide?.id, currentSlide?.type]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center gap-4 text-white">
        <div className="h-16 w-16 rounded-full border-4 border-white/20 border-t-emerald-300 animate-spin" />
        <p className="text-xs font-black tracking-[0.2em] uppercase text-slate-300">Učitavanje semafora</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center px-5">
        <div className="max-w-lg w-full rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <p className="text-xl font-black text-white">Greška</p>
          <p className="mt-2 text-sm text-red-200">{error}</p>
          <Link to="/" className="inline-flex mt-5 rounded-xl border border-white/20 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white">
            Nazad
          </Link>
        </div>
      </div>
    );
  }

  if (!competition?.isPublic || !isSemaforEnabled) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center px-5">
        <div className="max-w-lg w-full rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center">
          <p className="text-xl font-black text-white">Semafor nije dostupan</p>
          <p className="mt-2 text-sm text-slate-300">Organizator nije objavio takmičenje ili je semafor isključen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#070b14] text-slate-100 overflow-hidden flex flex-col">
      <style>{`
        @keyframes semaforFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(34,197,94,0.18),transparent_30%),radial-gradient(circle_at_80%_8%,rgba(59,130,246,0.16),transparent_34%),linear-gradient(160deg,#060b15_0%,#070b14_38%,#0b1932_100%)]" />
      </div>

      <header className="border-b border-white/10 bg-[#070b14]/75 backdrop-blur-xl shrink-0">
        <div className="mx-auto max-w-[1800px] px-3 sm:px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-2xl bg-emerald-400 text-slate-950 flex items-center justify-center shadow-[0_16px_36px_-16px_rgba(16,185,129,1)]">
              <MonitorPlay size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] font-black text-emerald-200">Semafor</p>
              <h1 className="text-sm sm:text-lg font-black text-white truncate">{competition?.name || 'Takmičenje'}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={makeFontLarger}
              className="min-h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-white text-xs font-black hover:bg-white/10 transition"
              aria-label="Povećaj font"
            >
              A+
            </button>
            <button
              onClick={makeFontSmaller}
              className="min-h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-white text-xs font-black hover:bg-white/10 transition"
              aria-label="Smanji font"
            >
              A-
            </button>
            {currentSlide?.type === 'group' && (
              <>
                <button
                  onClick={zoomOutCurrentGroup}
                  className="min-h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-white text-xs font-black hover:bg-white/10 transition"
                  aria-label="Smanji grupu"
                >
                  T-
                </button>
                <button
                  onClick={zoomInCurrentGroup}
                  disabled={isCrowdedGroupSlide}
                  className="min-h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-white text-xs font-black hover:bg-white/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Povećaj grupu"
                >
                  T+
                </button>
              </>
            )}
            <button onClick={prevSlide} className="min-h-11 min-w-11 rounded-xl border border-white/20 bg-white/5 text-white flex items-center justify-center hover:bg-white/10 transition" aria-label="Prethodni slide">
              <ChevronLeft size={18} />
            </button>
            <button onClick={nextSlide} className="min-h-11 min-w-11 rounded-xl border border-white/20 bg-white/5 text-white flex items-center justify-center hover:bg-white/10 transition" aria-label="Sljedeći slide">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1800px] w-full px-3 sm:px-5 py-3 sm:py-4 flex-1 min-h-0 overflow-hidden">
        {!slides.length ? (
          <div className="h-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-center text-center px-5">
            <div>
              <Activity size={46} className="mx-auto text-slate-500 mb-4" />
              <p className="text-2xl font-black text-white">Nema sadržaja za semafor</p>
              <p className="mt-2 text-sm text-slate-300">U postavkama uključite faze i odaberite grupe za prikaz.</p>
            </div>
          </div>
        ) : (
          <section
            key={currentSlide.id}
            style={{ animation: 'semaforFadeIn 520ms ease both' }}
            className="h-full rounded-3xl border border-white/10 bg-[#0c1529]/85 backdrop-blur-xl p-3 sm:p-4 lg:p-5 flex flex-col min-h-0"
          >
            <div className="mb-3 sm:mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] font-black text-slate-400">
                  {currentSlide.type === 'group'
                    ? 'Grupna faza'
                    : currentSlide.type === 'knockout'
                      ? 'Knockout faza'
                      : 'Javni profil'}
                </p>
                <h2 className="text-[clamp(1.25rem,2.5vw,2.2rem)] leading-tight font-black text-white">
                  {currentSlide.type === 'qr' ? 'Skeniraj i prati turnir uživo' : currentSlide.category.name}
                  {currentSlide.type === 'group' && (
                    <span className="text-emerald-300 ml-2">
                      {currentSlide.category.format === 'round_robin'
                        ? 'Tabela lige'
                        : `Grupa ${String.fromCharCode(65 + currentSlide.groupIdx)}`}
                    </span>
                  )}
                </h2>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-200">
                <Trophy size={12} className="text-amber-300" />
                Slide {activeSlide + 1}/{slides.length}
              </div>
            </div>

            {currentSlide.type === 'qr' ? (
              <div className="flex-1 min-h-0 flex items-center justify-center">
                <div className="w-full max-w-4xl rounded-3xl border border-cyan-400/30 bg-cyan-500/10 p-6 sm:p-8 lg:p-10">
                  <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-6 lg:gap-8 items-center">
                    <a href={currentSlide.qrLink} target="_blank" rel="noopener noreferrer" className="mx-auto">
                      <img
                        src={currentSlide.qrSrc}
                        alt="QR kod za javni profil turnira"
                        className="h-56 w-56 sm:h-64 sm:w-64 rounded-2xl border border-white/20 bg-white p-2"
                        loading="lazy"
                      />
                    </a>
                    <div className="text-center lg:text-left">
                      <p className="text-[11px] uppercase tracking-[0.2em] font-black text-cyan-200">Prati rezultate na svom uređaju</p>
                      <p className="mt-3 text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight">
                        Skeniraj QR kod i otvori javnu stranicu turnira.
                      </p>
                      <a
                        href={currentSlide.qrLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 inline-block text-sm sm:text-base text-cyan-100 font-bold break-all hover:text-cyan-200"
                      >
                        {currentSlide.qrLink}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : currentSlide.type === 'group' ? (
              <div ref={groupOuterRef} className="flex-1 min-h-0 overflow-hidden">
                <div
                  ref={groupInnerRef}
                  className="grid gap-4 items-start grid-cols-1"
                  style={{
                    transform: `scale(${appliedGroupScale})`,
                    transformOrigin: 'top left',
                    width: `${100 / appliedGroupScale}%`,
                    transition: 'none',
                  }}
                >
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 min-h-0 overflow-y-auto">
                    <div className="mx-auto w-full max-w-[1200px]">
                      <PublicGroupStandings
                        standings={currentSlide.standings}
                        advancingCount={currentSlide.category.advancingPlayers || 2}
                      />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 min-h-0 overflow-y-auto">
                    <SimpleGroupResults matches={currentSlide.matches} fontScale={fontScale} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-2 sm:p-3 overflow-hidden flex-1 min-h-0">
                <KnockoutTab
                  publicView={true}
                  MatchCardComponent={KnockoutMatchCard}
                  activeCategory={currentSlide.category}
                  matches={allMatches}
                  groups={currentSlide.groups}
                  allPlayers={allPlayers}
                  calculateStandings={(groupIdx) =>
                    calculateStandingsForGroup(
                      currentSlide.category,
                      allMatches,
                      currentSlide.groups,
                      groupIdx,
                      manualOrders?.[currentSlide.category.id] || {}
                    )
                  }
                  setEditingMatch={() => {}}
                  setShowMatchModal={() => {}}
                  handleToggleStage={() => {}}
                  handleGenerateKnockout={() => {}}
                  handleResetKnockout={() => {}}
                  handleUpdateMatchPlayer={() => {}}
                  handleAddManualMatch={() => {}}
                  handleGenerateTemplate={() => {}}
                  saveMatchResult={() => {}}
                  handleDeleteMatch={() => {}}
                  handleDeleteAllMatches={() => {}}
                />
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default PublicSemafor;
