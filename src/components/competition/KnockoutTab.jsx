import React from 'react';
import { Trophy, Zap, PlayCircle, AlertTriangle, Users, ChevronRight, Clock, Plus, X, Trash2, CheckCircle, GripVertical, ChevronDown, ChevronLeft, PanelsTopLeft, Star } from 'lucide-react';

const KnockoutTab = ({ 
  activeCategory, 
  matches = [], 
  groups = [], 
  allPlayers = [],
  calculateStandings = () => [],
  setEditingMatch,
  setShowMatchModal,
  handleToggleStage,
  handleGenerateKnockout,
  handleResetKnockout,
  handleUpdateMatchPlayer,
  handleAddManualMatch,
  handleGenerateTemplate,
  generating,
  saveMatchResult,
  handleDeleteMatch,
  handleDeleteAllMatches,
  tables,
  publicView = false,
  MatchCardComponent,
  isAmater = false
}) => {
  const seededPlayerIds = activeCategory?.seededPlayerIds || [];
  const [showSetupModal, setShowSetupModal] = React.useState(false);
  const [showManualModal, setShowManualModal] = React.useState(false);
  const [editingPlayerSlot, setEditingPlayerSlot] = React.useState(null); // { matchId, playerSlot }
  const [scale, setScale] = React.useState(1);
  const [showQualifiersSidebar, setShowQualifiersSidebar] = React.useState(false);
  const publicOuterRef = React.useRef(null);
  const publicInnerRef = React.useRef(null);
  const [publicAutoScale, setPublicAutoScale] = React.useState(1);
  const [manualMatch, setManualMatch] = React.useState({
    player1Id: '',
    player2Id: '',
    roundName: 'Polufinale',
    round: 1
  });

  const isGroupsCompleted = activeCategory?.stages?.groups?.completed || false;
  const isKnockoutCompleted = activeCategory?.stages?.knockout?.completed || false;
  const isGroupsKnockout = activeCategory?.format === 'groups_knockout';
  const isDirectKnockout = activeCategory?.format === 'direct_knockout';
  const supportsKnockoutView = isGroupsKnockout || isDirectKnockout;

  // Izračunaj bazen igrača koji su prošli
  const advancingPool = [];
  if (groups && groups.length > 0) {
    groups.forEach((group, idx) => {
      const standings = calculateStandings(idx);
      // For amateur league, if advancingPlayers isn't set, allow everyone to be qualifiers
      const defaultAdvancing = isAmater ? standings.length : 2;
      const advancingCount = activeCategory.advancingPlayers || defaultAdvancing;
      standings.slice(0, advancingCount).forEach((p, rank) => {
        advancingPool.push({ 
          ...p, 
          fromGroup: isAmater ? 'Liga' : String.fromCharCode(64 + (idx + 1)), 
          rank: rank + 1 
        });
      });
    });
  }

  const directKnockoutPool = React.useMemo(() => {
    if (!isDirectKnockout) return [];
    if (activeCategory?.type === 'doubles') return activeCategory?.doublesPairs || [];
    return allPlayers.filter((p) => (activeCategory?.playerIds || []).includes(p.id));
  }, [isDirectKnockout, activeCategory, allPlayers]);

  const categoryParticipantIds = React.useMemo(() => {
    const ids = new Set();

    (activeCategory?.playerIds || []).forEach((id) => {
      if (id) ids.add(id);
    });

    if (activeCategory?.groupConfig && typeof activeCategory.groupConfig === 'object') {
      Object.values(activeCategory.groupConfig).forEach((groupPlayers) => {
        if (!Array.isArray(groupPlayers)) return;
        groupPlayers.forEach((id) => {
          if (id) ids.add(id);
        });
      });
    }

    (activeCategory?.doublesPairs || []).forEach((pair) => {
      if (pair?.id) ids.add(pair.id);
    });

    return ids;
  }, [activeCategory]);

  const categoryPlayers = React.useMemo(() => {
    if (!categoryParticipantIds.size) return [];
    return allPlayers.filter((player) => categoryParticipantIds.has(player.id));
  }, [allPlayers, categoryParticipantIds]);

  const knockoutSeedPool = isDirectKnockout ? directKnockoutPool : advancingPool;

  const knockoutMatches = React.useMemo(() => {
    const strictMatches = matches.filter((m) =>
      (m.isKnockout || (m.roundName && (m.groupId === undefined || m.groupId === null))) &&
      m.categoryId === activeCategory?.id
    );

    // In public semafor view, keep bracket structure (rounds/finale) visible,
    // but hide foreign-category participants by replacing them with TBD.
    if (!publicView || !categoryParticipantIds.size) {
      return strictMatches;
    }

    const sanitizePlayer = (player) => {
      if (!player?.id || player.id === 'tbd') return player;
      return categoryParticipantIds.has(player.id)
        ? player
        : { id: 'tbd', name: 'TBD' };
    };

    return strictMatches.map((m) => ({
      ...m,
      player1: sanitizePlayer(m.player1),
      player2: sanitizePlayer(m.player2)
    }));
  }, [matches, activeCategory?.id, publicView, categoryParticipantIds]);

  const knockoutMatchesForDisplay = React.useMemo(() => {
    if (!publicView) return knockoutMatches;
    if (!knockoutMatches.length) return knockoutMatches;

    const cloned = knockoutMatches.map((match) => ({
      ...match,
      player1: match.player1 ? { ...match.player1 } : match.player1,
      player2: match.player2 ? { ...match.player2 } : match.player2
    }));

    const roundsByNumber = new Map();
    cloned.forEach((match) => {
      const roundNum = Number(match.round);
      if (!Number.isFinite(roundNum)) return;
      if (!roundsByNumber.has(roundNum)) roundsByNumber.set(roundNum, []);
      roundsByNumber.get(roundNum).push(match);
    });

    if (!roundsByNumber.size) return cloned;

    const resolveWinner = (match) => {
      if (!match || match.status !== 'completed') return null;

      const p1 = match.player1;
      const p2 = match.player2;
      const p1Real = p1?.id && p1.id !== 'tbd';
      const p2Real = p2?.id && p2.id !== 'tbd';

      if (p1Real && !p2Real) return p1;
      if (p2Real && !p1Real) return p2;

      const s1 = Number(match.player1Score);
      const s2 = Number(match.player2Score);
      if (Number.isNaN(s1) || Number.isNaN(s2) || s1 === s2) return null;

      return s1 > s2 ? p1 : p2;
    };

    const orderedRounds = [...roundsByNumber.keys()].sort((a, b) => a - b);

    orderedRounds.forEach((roundNum) => {
      const currentRound = roundsByNumber.get(roundNum) || [];
      const nextRound = roundsByNumber.get(roundNum + 1) || [];
      if (!nextRound.length) return;

      currentRound.forEach((match) => {
        const winner = resolveWinner(match);
        if (!winner?.id || winner.id === 'tbd') return;

        const bracket = Number(match.bracketIndex || 0);
        const nextBracket = Math.floor(bracket / 2);
        const targetSlot = bracket % 2 === 0 ? 'player1' : 'player2';

        const nextMatch = nextRound.find((candidate) => Number(candidate.bracketIndex || 0) === nextBracket);
        if (!nextMatch) return;

        const existing = nextMatch[targetSlot];
        if (existing?.id && existing.id !== 'tbd') return;

        nextMatch[targetSlot] = {
          id: winner.id,
          name: winner.name || 'TBD'
        };
      });
    });

    return cloned;
  }, [publicView, knockoutMatches]);

  // Identifikuj igrače koji su već ubačeni u žrijeb
  const placedPlayerIds = React.useMemo(() => {
    const ids = new Set();
    knockoutMatches.forEach(m => {
      if (m.player1?.id && m.player1.id !== 'tbd') ids.add(m.player1.id);
      if (m.player2?.id && m.player2.id !== 'tbd') ids.add(m.player2.id);
    });
    return ids;
  }, [knockoutMatches]);

  // Alias za kompatibilnost sa starim kodom
  const assignedPlayerIdsInKO = placedPlayerIds;

  const rounds = React.useMemo(() => {
    const r = {};
    knockoutMatchesForDisplay.forEach(m => {
      const rName = m.roundName || `Runda ${m.round}`;
      if (!r[rName]) r[rName] = [];
      r[rName].push(m);
    });

    // Sort rounds internally by bracketIndex to ensure visual flow
    Object.keys(r).forEach(rName => {
      r[rName].sort((a, b) => (a.bracketIndex || 0) - (b.bracketIndex || 0));
    });
    return r;
  }, [knockoutMatchesForDisplay]);

  const roundKeys = React.useMemo(() => {
    return Object.keys(rounds).sort((a, b) => {
      // Definisanje ranga rundi za sortiranje (od prve do finala)
      const getRoundWeight = (name) => {
        // Prioritet dajemo broju runde iz samih mečeva ako su isti nazivi
        const rNum = rounds[name][0]?.round || 0;
        
        if (name.includes('Finale') && !name.includes('1/')) return 1000 + rNum;
        if (name.includes('Polufinale')) return 500 + rNum;
        if (name.includes('1/4')) return 250 + rNum;
        if (name.includes('1/8')) return 120 + rNum;
        if (name.includes('Baraž')) return -10 + rNum;
        
        return rNum;
      };
      return getRoundWeight(a) - getRoundWeight(b);
    });
  }, [rounds]);

  const findNextKnockoutMatch = React.useCallback((match) => {
    const currentBracket = Number(match?.bracketIndex || 0);
    const nextBracket = Math.floor(currentBracket / 2);
    const targetSlot = currentBracket % 2 === 0 ? 1 : 2;

    const currentRound = Number(match?.round);
    if (!Number.isNaN(currentRound)) {
      const numericNext = knockoutMatches.find(
        (item) => Number(item.round) === currentRound + 1 && Number(item.bracketIndex || 0) === nextBracket
      );
      if (numericNext) {
        return { nextMatch: numericNext, targetSlot };
      }
    }

    const currentRoundName = match?.roundName || `Runda ${match?.round}`;
    const currentRoundIdx = roundKeys.findIndex((key) => key === currentRoundName);
    if (currentRoundIdx === -1 || currentRoundIdx >= roundKeys.length - 1) {
      return { nextMatch: null, targetSlot };
    }

    const nextRoundName = roundKeys[currentRoundIdx + 1];
    const namedNext = knockoutMatches.find(
      (item) => (item.roundName || `Runda ${item.round}`) === nextRoundName && Number(item.bracketIndex || 0) === nextBracket
    );

    return { nextMatch: namedNext || null, targetSlot };
  }, [knockoutMatches, roundKeys]);

  const knockoutMatchesCount = knockoutMatchesForDisplay.length;
  const hasBarazRound = knockoutMatches.some(m => m.roundName === 'Baraž');

  React.useEffect(() => {
    if (!publicView) return undefined;

    const computePreferredScale = () => {
      if (knockoutMatchesCount <= 2) return 1.55;
      if (knockoutMatchesCount <= 4) return 1.38;
      if (knockoutMatchesCount <= 8) return 1.2;
      if (knockoutMatchesCount <= 12) return 1.05;
      if (knockoutMatchesCount <= 20) return 0.92;
      return 0.82;
    };

    const preferredScale = computePreferredScale();
    let cancelled = false;

    const calculateFitScale = () => {
      if (cancelled) return;

      const outer = publicOuterRef.current;
      const inner = publicInnerRef.current;
      if (!outer || !inner) return;

      const availableWidth = outer.clientWidth;
      const availableHeight = outer.clientHeight;
      const neededWidth = inner.scrollWidth;
      const neededHeight = inner.scrollHeight;

      if (!availableWidth || !availableHeight || !neededWidth || !neededHeight) return;

      const widthScale = availableWidth / neededWidth;
      const heightScale = availableHeight / neededHeight;
      const fitScale = Math.min(widthScale, heightScale);

      // Scale up for small brackets, but always keep the bracket fully visible.
      const resolved = Math.max(0.38, Math.min(preferredScale, Number.isFinite(fitScale) ? fitScale : 1));
      setPublicAutoScale(resolved);
    };

    const measureUntilReady = () => {
      if (cancelled) return;
      const outer = publicOuterRef.current;
      const inner = publicInnerRef.current;
      if (!outer || !inner || !outer.clientWidth || !outer.clientHeight || !inner.scrollWidth || !inner.scrollHeight) {
        window.requestAnimationFrame(measureUntilReady);
        return;
      }
      calculateFitScale();
    };

    measureUntilReady();

    const observer = new ResizeObserver(() => calculateFitScale());
    if (publicOuterRef.current) observer.observe(publicOuterRef.current);
    if (publicInnerRef.current) observer.observe(publicInnerRef.current);
    window.addEventListener('resize', calculateFitScale);

    return () => {
      cancelled = true;
      observer.disconnect();
      window.removeEventListener('resize', calculateFitScale);
    };
  }, [publicView, knockoutMatchesCount, roundKeys.length]);

  const suggestedMatches = React.useMemo(() => {
    if (!groups || groups.length < 2) return [];
    const suggestions = [];
    const advancing = [];
    groups.forEach((g, i) => {
        const s = calculateStandings(i);
        const count = activeCategory.advancingPlayers || 2;
        advancing.push(s.slice(0, count));
    });

    // Pairing: Group i Rank 1 vs Group i+1 Rank 2, and Group i+1 Rank 1 vs Group i Rank 2
    // For odd number of groups, last group remains unselected in this simple logic
    for(let i = 0; i < advancing.length - 1; i += 2) {
        const groupA = advancing[i];
        const groupB = advancing[i+1];
        const charA = String.fromCharCode(65 + i);
        const charB = String.fromCharCode(65 + i + 1);

        if (groupA[0] && groupB[1]) {
            suggestions.push({
                p1: groupA[0], p2: groupB[1],
                label: `${charA}1 - ${charB}2`,
                desc: `${groupA[0].name} vs ${groupB[1].name}`
            });
        }
        if (groupB[0] && groupA[1]) {
            suggestions.push({
                p1: groupB[0], p2: groupA[1],
                label: `${charB}1 - ${charA}2`,
                desc: `${groupB[0].name} vs ${groupA[1].name}`
            });
        }
    }
    return suggestions;
  }, [groups, calculateStandings, activeCategory?.advancingPlayers]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.3));

  const onDragStart = (e, player) => {
    e.dataTransfer.setData('player', JSON.stringify(player));
  };

  const onDrop = async (e, matchId, playerSlot) => {
    e.preventDefault();
    try {
      const playerData = e.dataTransfer.getData('player');
      if (!playerData) return;
      
      const player = JSON.parse(playerData);
      if (!player.id || !player.name) return;
      if (player.id !== 'tbd' && categoryParticipantIds.size && !categoryParticipantIds.has(player.id)) {
        alert('Igrač ne pripada aktivnoj kategoriji.');
        return;
      }

      const targetMatch = knockoutMatches.find(m => m.id === matchId);
      const oppositePlayer = playerSlot === 1 ? targetMatch?.player2 : targetMatch?.player1;
      if (player.id !== 'tbd' && oppositePlayer?.id === player.id) {
        alert('Isti igrač ne može biti na obje pozicije istog meča.');
        return;
      }

      await handleUpdateMatchPlayer(matchId, playerSlot, {
        id: player.id,
        name: player.name
      });
    } catch (err) {
      console.error("Drop error:", err);
    }
  };

  const isSlotReserved = (match, slot) => {
    const prevRound = Number(match.round) - 1;
    if (prevRound < 0) return false;
    
    // Pronađi meč iz prethodne runde koji se "ulijeva" u ovaj slot
    // Slot 1 (player1) dolazi iz bracketIndex * 2
    // Slot 2 (player2) dolazi iz bracketIndex * 2 + 1
    const sourceIndex = (slot === 1) ? match.bracketIndex * 2 : match.bracketIndex * 2 + 1;
    
    return knockoutMatches.some(m => 
      Number(m.round) === prevRound && 
      Number(m.bracketIndex) === sourceIndex
    );
  };

  const onAddManual = async () => {
    if (!manualMatch.roundName?.trim()) {
      alert('Molimo unesite naziv runde.');
      return;
    }

    const p1 = allPlayers.find(p => p.id === manualMatch.player1Id);
    const p2 = allPlayers.find(p => p.id === manualMatch.player2Id);

    const player1 = p1 ? { id: p1.id, name: p1.name } : { id: 'tbd', name: 'TBD' };
    const player2 = p2 ? { id: p2.id, name: p2.name } : { id: 'tbd', name: 'TBD' };

    try {
      await handleAddManualMatch({
        player1,
        player2,
        roundName: manualMatch.roundName.trim(),
        round: Number.parseInt(manualMatch.round, 10) || 1,
        player1Score: 0,
        player2Score: 0,
        status: 'pending',
        isKnockout: true,
        bracketIndex: rounds[manualMatch.roundName]?.length || 0
      });

      setShowManualModal(false);
      setManualMatch(prev => ({
        ...prev,
        player1Id: '',
        player2Id: ''
      }));
    } catch (err) {
      console.error('Manual add error:', err);
      alert('Greška pri dodavanju meča.');
    }
  };

  const onSelectPlayerForSlot = async (player) => {
    if (!editingPlayerSlot || !player) return;
    try {
      if (player.id !== 'tbd' && categoryParticipantIds.size && !categoryParticipantIds.has(player.id)) {
        alert('Igrač ne pripada aktivnoj kategoriji.');
        return;
      }

      const targetMatch = knockoutMatches.find(m => m.id === editingPlayerSlot.matchId);
      const oppositePlayer = editingPlayerSlot.playerSlot === 1 ? targetMatch?.player2 : targetMatch?.player1;

      if (player.id !== 'tbd' && oppositePlayer?.id === player.id) {
        alert('Isti igrač ne može biti na obje pozicije istog meča.');
        return;
      }

      await handleUpdateMatchPlayer(editingPlayerSlot.matchId, editingPlayerSlot.playerSlot, {
        id: player.id,
        name: player.name
      });
      setEditingPlayerSlot(null);
    } catch (err) {
      console.error("Selection error:", err);
    }
  };

  const resolveCompletedMatchWinner = (match) => {
    if (!match || match.status !== 'completed') return null;

    const p1 = match.player1;
    const p2 = match.player2;
    const p1Real = p1?.id && p1.id !== 'tbd';
    const p2Real = p2?.id && p2.id !== 'tbd';

    // Walkover: jedan igrač postoji, drugi ne postoji/TBD
    if (p1Real && !p2Real) return p1;
    if (p2Real && !p1Real) return p2;

    const s1 = Number(match.player1Score);
    const s2 = Number(match.player2Score);
    if (Number.isNaN(s1) || Number.isNaN(s2) || s1 === s2) return null;

    const winner = s1 > s2 ? p1 : p2;
    if (winner?.id && winner.id !== 'tbd' && categoryParticipantIds.size && !categoryParticipantIds.has(winner.id)) {
      return null;
    }

    return winner;
  };

  // Pobjednici iz prethodnih rundi za lakši ručni odabir
  const roundWinners = React.useMemo(() => {
    const winners = [];
    knockoutMatches.forEach(m => {
      const winner = resolveCompletedMatchWinner(m);
      if (winner && winner.id && winner.id !== 'tbd') {
        winners.push({
          ...winner,
          fromRound: m.roundName || `Runda ${m.round}`,
          matchId: m.id
        });
      }
    });
    return winners;
  }, [knockoutMatches]);

  // Auto-prolaz pobjednika u sljedeću rundu (po bracketIndex pravilima)
  React.useEffect(() => {
    if (!knockoutMatches.length) return;

    let cancelled = false;

    const propagateWinners = async () => {
      const updates = [];

      knockoutMatches.forEach((match) => {
        const winner = resolveCompletedMatchWinner(match);
        if (!winner?.id || winner.id === 'tbd') return;

        const { nextMatch, targetSlot } = findNextKnockoutMatch(match);

        if (!nextMatch) return;

        const currentTargetPlayer = targetSlot === 1 ? nextMatch.player1 : nextMatch.player2;
        if (currentTargetPlayer?.id === winner.id) return;

        updates.push({
          matchId: nextMatch.id,
          playerSlot: targetSlot,
          winner: { id: winner.id, name: winner.name }
        });
      });

      for (const update of updates) {
        if (cancelled) break;
        try {
          await handleUpdateMatchPlayer(update.matchId, update.playerSlot, update.winner);
        } catch (err) {
          console.error('Greška pri automatskom prolazu pobjednika:', err);
        }
      }
    };

    propagateWinners();

    return () => {
      cancelled = true;
    };
  }, [findNextKnockoutMatch, knockoutMatches, handleUpdateMatchPlayer]);

  React.useEffect(() => {
    if (!knockoutMatches.length || !categoryParticipantIds.size) return;

    let cancelled = false;

    const removeForeignPlayers = async () => {
      const fixes = [];

      knockoutMatches.forEach((match) => {
        const p1 = match.player1;
        const p2 = match.player2;

        if (p1?.id && p1.id !== 'tbd' && !categoryParticipantIds.has(p1.id)) {
          fixes.push({ matchId: match.id, slot: 1 });
        }
        if (p2?.id && p2.id !== 'tbd' && !categoryParticipantIds.has(p2.id)) {
          fixes.push({ matchId: match.id, slot: 2 });
        }
      });

      for (const fix of fixes) {
        if (cancelled) break;
        try {
          await handleUpdateMatchPlayer(fix.matchId, fix.slot, { id: 'tbd', name: 'TBD' });
        } catch (err) {
          console.error('Greška pri čišćenju igrača iz druge kategorije:', err);
        }
      }
    };

    removeForeignPlayers();

    return () => {
      cancelled = true;
    };
  }, [knockoutMatches, categoryParticipantIds, handleUpdateMatchPlayer]);

  // NIKADA ne vraćaj null - uvijek prikaži nešto
  if (!activeCategory) {
    // ...existing code...
  }

  if (publicView && knockoutMatchesCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-20 h-20 bg-slate-900/50 rounded-full flex items-center justify-center mb-6 border border-slate-800">
          <Trophy size={40} className="text-slate-700" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Knockout faza još nije počela</h3>
        <p className="text-slate-500 max-w-xs mx-auto">
          Organizator još uvijek nije generisao eliminaciono stablo za ovu kategoriju.
        </p>
      </div>
    );
  }

  if (publicView) {
    const effectiveScale = Math.max(0.35, Math.min(2, publicAutoScale));
    const maxMatchesInRound = Math.max(...roundKeys.map((key) => rounds[key]?.length || 0), 1);
    const baseUnit = knockoutMatchesCount <= 2 ? 74 : knockoutMatchesCount <= 4 ? 66 : knockoutMatchesCount <= 8 ? 56 : 46;
    const columnHeight = baseUnit * maxMatchesInRound * 2;

    return (
      <div ref={publicOuterRef} className="w-full h-full min-h-0 overflow-hidden flex items-center justify-center">
        <div className="w-full h-full flex items-center justify-center overflow-hidden">
          <div 
            ref={publicInnerRef}
            className="inline-flex items-start transition-transform duration-200 origin-center"
            style={{ transform: `scale(${effectiveScale})`, gap: '24px', padding: '8px' }}
          >
            {roundKeys.map((rName, rIdx) => (
              <div key={rName} className="flex flex-col" style={{ gap: '8px', minWidth: '250px' }}>
                <div className="text-center mb-2">
                  <h4 className="text-base md:text-lg font-black text-slate-200 uppercase tracking-widest">
                    {rName}
                  </h4>
                </div>

                <div className="relative" style={{ height: `${columnHeight}px` }}>
                  {rounds[rName].map((match, mIdx) => {
                    const center = baseUnit * (Math.pow(2, rIdx) + mIdx * Math.pow(2, rIdx + 1));

                    return (
                      <div
                        key={match.id}
                        className="absolute left-0 right-0 flex justify-center"
                        style={{ top: `${center}px`, transform: 'translateY(-50%)' }}
                      >
                        <div style={{ width: '250px', maxWidth: '250px' }}>
                          <MatchCardComponent
                            match={match}
                            isFinal={rName.toLowerCase().includes('finale') && !rName.toLowerCase().includes('1/')}
                            onMatchClick={null}
                          />
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
    );
  }

  return (
    <div className="space-y-5">
      {/* Info Banner */}
      <div className="bg-slate-950/90 backdrop-blur-xl rounded-[24px] p-4 md:p-5 border border-slate-800 shadow-lg mb-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/12 border border-sky-500/15 text-sky-300 flex items-center justify-center">
              <Trophy size={22} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black italic tracking-tight text-white uppercase">Knockout Faza</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
                {knockoutMatchesCount > 0 ? `${knockoutMatchesCount} mečeva u stablu` : 'Čeka generisanje žrijeba'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
              isKnockoutCompleted
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : 'bg-sky-500/10 text-sky-300 border-sky-500/20'
            }`}>
              {isKnockoutCompleted ? 'Zaključeno' : 'Aktivno'}
            </span>
            {showQualifiersSidebar && (
              <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border bg-slate-900 text-slate-400 border-slate-800">
                Kvalifikovani otvoreni
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 pb-10">
        {/* Pool of Players Sidebar */}
        {knockoutSeedPool.length > 0 && knockoutMatches.length > 0 && showQualifiersSidebar && (
          <div className="w-full lg:w-72 space-y-4 shrink-0 animation-slide-in">
            <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded-[24px] p-5 sticky top-24 shadow-lg">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800/50">
                <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3 italic">
                  <Users size={18} className="text-sky-400" /> Kvalifikovani
                </h4>
                <button 
                  onClick={() => setShowQualifiersSidebar(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-950 text-slate-500 hover:text-red-500 transition-all border border-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Fill Remaining Button */}
              {knockoutSeedPool.some(p => !placedPlayerIds.has(p.id)) && (
                <button 
                  onClick={async () => {
                    const unassigned = knockoutSeedPool.filter(p => !placedPlayerIds.has(p.id));
                    const firstRoundMatches = knockoutMatches.filter(m => m.round === 1).sort((a,b) => a.bracketIndex - b.bracketIndex);
                    
                    let pIdx = 0;
                    for (const m of firstRoundMatches) {
                      if (pIdx >= unassigned.length) break;
                      if (m.player1?.id === 'tbd' || !m.player1) {
                        await handleUpdateMatchPlayer(m.id, 1, unassigned[pIdx++]);
                      }
                      if (pIdx < unassigned.length && (m.player2?.id === 'tbd' || !m.player2)) {
                        await handleUpdateMatchPlayer(m.id, 2, unassigned[pIdx++]);
                      }
                    }
                  }}
                  className="w-full mb-5 bg-sky-600 hover:bg-sky-500 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-md shadow-sky-950/20"
                >
                  <Zap size={14} fill="currentColor" /> Popuni Prazna Polja
                </button>
              )}

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {knockoutSeedPool.map(player => {
                const isAssigned = assignedPlayerIdsInKO.has(player.id);
                return (
                  <div 
                    key={player.id}
                    draggable={!isAssigned}
                    onDragStart={(e) => onDragStart(e, player)}
                    className={`p-3.5 rounded-[18px] border transition-all ${isAssigned ? 'bg-slate-950/50 border-slate-900 opacity-40 grayscale pointer-events-none' : 'bg-slate-950 border-slate-800 hover:border-sky-500/30 shadow-sm cursor-grab active:cursor-grabbing group/player'}`}
                  >
                    <div className="flex items-center justify-between pointer-events-none">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <p className="text-[12px] font-black text-white uppercase tracking-tight truncate group-hover/player:text-sky-300 transition-colors">{player.name}</p>
                          {seededPlayerIds.includes(player.id) && (
                            <Star size={12} className="text-amber-500 fill-amber-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                           <span className="px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-300 text-[9px] font-black uppercase tracking-widest border border-sky-500/20">
                             {isDirectKnockout ? 'Direktni KO' : `Grupa ${player.fromGroup}`}
                           </span>
                           {!isDirectKnockout && (
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">#{player.rank} mjesto</span>
                           )}
                        </div>
                      </div>
                      {isAssigned && <CheckCircle size={16} className="text-emerald-500 shrink-0 ml-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

        <div className="flex-1 space-y-5 min-w-0">
          <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded-[24px] p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-slate-900 rounded-xl text-sky-300 border border-slate-800 shadow-inner">
                <PanelsTopLeft size={18} />
              </div>
              <div>
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] italic mb-1">Pregled Žrijeba</h3>
                <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-widest leading-none">
                  {knockoutMatchesCount} mečeva u stablu
                </p>
              </div>
            </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            {knockoutMatchesCount > 0 && (
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner">
                <button onClick={handleZoomOut} className="w-8 h-8 flex items-center justify-center hover:bg-slate-900 rounded-lg transition-all text-slate-400 border border-transparent hover:border-slate-800"><ChevronLeft size={16} /></button>
                <div className="px-3 flex items-center justify-center text-[10px] font-bold text-sky-300 uppercase tracking-wider min-w-[64px]">{(scale * 100).toFixed(0)}%</div>
                <button onClick={handleZoomIn} className="w-8 h-8 flex items-center justify-center hover:bg-slate-900 rounded-lg transition-all text-slate-400 border border-transparent hover:border-slate-800"><ChevronRight size={16} /></button>
              </div>
            )}
            
            {!showQualifiersSidebar && knockoutSeedPool.length > 0 && (
              <button 
                onClick={() => setShowQualifiersSidebar(true)}
                className="bg-slate-900 text-slate-300 border border-slate-800 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white hover:border-sky-500/30 transition-all flex items-center gap-2 shadow-inner"
              >
                <Users size={15} /> Kvalifikovani
              </button>
            )}

            {!isKnockoutCompleted && knockoutMatches.length > 0 && (
              <button
                onClick={() => handleToggleStage('knockout', true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <CheckCircle size={14} /> Završi
              </button>
            )}

            {isKnockoutCompleted && (
              <button
                onClick={() => handleToggleStage('knockout', false)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <Clock size={14} /> Otvori
              </button>
            )}

            <button 
              onClick={() => setShowSetupModal(true)}
              className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              <Plus size={14} /> Setup Žrijeba
            </button>
            
            {knockoutMatchesCount > 0 && (
              <button 
                onClick={handleResetKnockout}
                className="bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <Trash2 size={14} /> Resetuj
              </button>
            )}
          </div>
        </div>

        {!supportsKnockoutView ? (
          <div className="bg-[#0f172a] border-2 border-dashed border-slate-800 rounded-[40px] p-24 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <AlertTriangle size={200} />
            </div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-slate-950 rounded-[28px] flex items-center justify-center mx-auto mb-8 text-red-500 border border-slate-800 shadow-inner">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Format nije podržan</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] max-w-sm mx-auto leading-relaxed">
                Eliminaciona faza je dostupna za <span className="text-amber-500 font-black italic">"Grupe + Knockout"</span> i <span className="text-amber-500 font-black italic">"Direktne Eliminacije"</span>. <br/>Trenutni format: <span className="text-white font-black">{activeCategory.format}</span>
              </p>
            </div>
          </div>
        ) : knockoutMatchesCount === 0 ? (
          <div className="space-y-5">
            {isGroupsKnockout && !isGroupsCompleted ? (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-lg p-8 flex items-center gap-6 shadow-sm dark:shadow-none">
                <div className="w-12 h-12 bg-amber-500/10 dark:bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-500 shrink-0 border border-amber-200 dark:border-transparent">
                  <Clock size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="text-slate-900 dark:text-white font-black uppercase italic tracking-tighter text-sm">Grupna faza još traje</h4>
                  <p className="text-slate-500 dark:text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-1">
                    Morate označiti grupnu fazu kao završenu u postavkama kako biste generisali knockout žrijeb.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/90 border border-slate-800 rounded-[24px] p-8 text-center shadow-lg">
                <div className="w-16 h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-sky-400 border border-sky-500/20">
                  <Zap size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{isDirectKnockout ? 'Direktne eliminacije' : 'Grupna faza završena'}</h3>
                <p className="text-slate-400 text-xs font-medium max-w-sm mx-auto mb-6">
                  {isDirectKnockout
                    ? 'Pokrenite setup ili automatski generišite direktni knockout žrijeb.'
                    : 'Pokrenite setup ili automatski generišite žrijeb. Dodatne opcije za parove ostaju unutar setup dijaloga.'}
                </p>

                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4 mb-8 max-w-md mx-auto">
                    <div className="flex items-center justify-around gap-4">
                        <div className="text-center flex-1">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Kvalifikovanih</p>
                          <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{knockoutSeedPool.length}</p>
                        </div>
                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800"></div>
                        <div className="text-center flex-1">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Preporuka</p>
                            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase leading-none">
                                {(() => {
                                  const count = knockoutSeedPool.length;
                                    if (count <= 2) return "Finale";
                                    if (count <= 4) return "1/2 Finale";
                                    if (count <= 8) return "1/4 Finale";
                                    if (count <= 16) return "1/8 Finale";
                                    if (count <= 32) return "1/16 Finale";
                                    return "1/32 Finale";
                                })()}
                            </p>
                        </div>
                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800"></div>
                        <div className="text-center flex-1">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Status</p>
                            <div className="flex flex-col items-center">
                                <p className={`text-[10px] font-bold uppercase leading-none ${knockoutSeedPool.length % 2 === 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-amber-600 dark:text-amber-500'}`}>
                                  {knockoutSeedPool.length % 2 === 0 ? 'Paran Broj' : 'Neparan Broj'}
                                </p>
                                {(() => {
                                  const count = knockoutSeedPool.length;
                                    let p2 = 2;
                                    while(p2 * 2 <= count) p2 *= 2;
                                    if (count > 2 && count !== p2) {
                                        return <span className="text-[8px] bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-500 px-1.5 py-0.5 rounded mt-1 font-bold border border-amber-200 dark:border-amber-500/30">Preporučen Baraž</span>
                                    }
                                    return null;
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm mx-auto">
                  <button 
                    className="w-full bg-sky-600 text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-sky-500 transition-all shadow-md shadow-sky-950/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    onClick={handleGenerateKnockout}
                    disabled={generating}
                  >
                    <Zap size={16} /> {generating ? 'Generisanje...' : 'Automatski'}
                  </button>
                  
                  <button 
                    className="w-full bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-slate-800 transition-all shadow-sm flex items-center justify-center gap-2 border border-slate-800"
                    onClick={() => setShowSetupModal(true)}
                  >
                    <Plus size={16} /> Setup
                  </button>
                </div>
              </div>
            )}
            
            {isGroupsKnockout && (
            <details className="group bg-slate-950/80 border border-slate-800 rounded-[20px] p-4">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <div>
                  <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Kvalifikovani Iz Grupa</h4>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Sekundarni pregled za ručnu provjeru</p>
                </div>
                <ChevronDown size={16} className="text-slate-500 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {groups.map((group, idx) => {
                const standings = calculateStandings(idx);
                const advancingCount = activeCategory.advancingPlayers || 2;
                const advancing = standings.slice(0, advancingCount);
                
                return (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-[16px] p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grupa {String.fromCharCode(65 + idx)}</h4>
                      <span className="text-[10px] font-bold text-emerald-300 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Prolaze {advancingCount}</span>
                    </div>
                    <div className="space-y-2">
                        {advancing.map((p, pIdx) => (
                          <div 
                            key={p.id} 
                            draggable
                            onDragStart={(e) => onDragStart(e, p)}
                            className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800 cursor-grab active:cursor-grabbing hover:border-sky-500/30 transition-colors group"
                          >
                            <span className="text-xs font-bold text-slate-400 w-4">{pIdx + 1}.</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-bold text-white">{p.name}</p>
                                {seededPlayerIds.includes(p.id) && (
                                  <Star size={12} className="text-amber-500 fill-amber-500" />
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium uppercase">{p.club || 'Bez kluba'}</p>
                            </div>
                            <GripVertical size={14} className="text-slate-700 group-hover:text-sky-300 transition-colors" />
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
              </div>
            </details>
            )}
          </div>
        ) : (
          <div className="bg-slate-950/90 backdrop-blur-xl rounded-[24px] p-4 md:p-5 border border-slate-800 mb-4 shadow-lg">
              <div className="overflow-x-auto custom-scrollbar pb-4">
                <div
                  className="inline-flex min-w-max items-center p-1 transition-transform duration-200 origin-top-left"
                  style={{ transform: `scale(${scale})`, gap: '16px' }}
                >
                  {roundKeys.map((rName) => (
                    <div key={rName} className="flex flex-col justify-around min-h-[400px] gap-4">
                      <div className="text-center mb-4">
                        <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg px-3 py-2">
                          <div className="text-sky-300 font-semibold text-sm">
                            {rName}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                      <div className="space-y-3">
                        {rounds[rName].map((match) => {
                          const winner = resolveCompletedMatchWinner(match);
                          const p1Winner = !!winner && winner.id === match.player1?.id;
                          const p2Winner = !!winner && winner.id === match.player2?.id;

                          const isMatchReady = match.player1?.id && match.player2?.id && match.player1.id !== 'tbd' && match.player2.id !== 'tbd';
                          const isP1Real = match.player1?.id && match.player1.id !== 'tbd';
                          const isP2Real = match.player2?.id && match.player2.id !== 'tbd';
                          // Dozlovi walkover ako imamo jednog pravog igrača a drugi je TBD ili undefined, a meč nije završen
                          const isWalkoverPossible = match.status !== 'completed' && ((isP1Real && !isP2Real) || (!isP1Real && isP2Real));

                          return (
                            <div 
                              key={match.id} 
                              className="w-56 bg-slate-900/60 rounded-[16px] border border-slate-800 overflow-hidden hover:border-sky-500/30 transition-all"
                            >
                              <div className="bg-slate-950/60 px-3 py-2 border-b border-slate-800 flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-400">Meč {(match.bracketIndex ?? 0) + 1}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs px-2 py-1 rounded-full ${match.status === 'completed' ? 'bg-green-600/20 text-green-400' : match.status === 'in_progress' ? 'bg-sky-600/20 text-sky-300' : 'bg-slate-700/30 text-slate-400'}`}>
                                    {match.status === 'completed' ? '✓' : match.status === 'in_progress' ? '🔴' : '⏳'}
                                  </span>
                                </div>
                              </div>

                              <div className="p-3">

                              {/* Player 1 Row */}
                              <div 
                                className={`flex justify-between items-center mb-2 p-2 rounded-lg ${p1Winner ? 'bg-green-500/10 border-l-4 border-l-green-500' : 'bg-slate-800/70'}`}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.dataTransfer.dropEffect = 'copy';
                                }}
                                onDrop={(e) => onDrop(e, match.id, 1)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPlayerSlot({ matchId: match.id, playerSlot: 1 });
                                }}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-col truncate group/name relative flex-1">
                                    <div className={`text-sm font-medium truncate transition-colors flex items-center gap-1.5 ${p1Winner ? 'text-white' : 'text-white'}`}>
                                      {match.player1?.name || (
                                        isSlotReserved(match, 1) ? (
                                          <span className="text-slate-500 text-[9px] italic font-bold">Pobjednik...</span>
                                        ) : (
                                          <span className="text-slate-600 dark:text-slate-700 text-[9px]">Prazno...</span>
                                        )
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Player 1 Score & Sets */}
                                <div className="flex items-center gap-2 ml-4">
                                  <div className={`text-base font-bold ${p1Winner ? 'text-green-400' : 'text-white'}`}>
                                    {match.player1Score ?? 0}
                                  </div>
                                </div>
                              </div>

                              {/* Player 2 Row */}
                              <div 
                                className={`flex justify-between items-center p-2 rounded-lg ${p2Winner ? 'bg-green-500/10 border-l-4 border-l-green-500' : 'bg-slate-800/70'}`}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.dataTransfer.dropEffect = 'copy';
                                }}
                                onDrop={(e) => onDrop(e, match.id, 2)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPlayerSlot({ matchId: match.id, playerSlot: 2 });
                                }}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-col truncate group/name relative flex-1">
                                    <div className={`text-sm font-medium truncate transition-colors flex items-center gap-1.5 ${p2Winner ? 'text-white' : 'text-white'}`}>
                                      {match.player2?.name || (
                                        isSlotReserved(match, 2) ? (
                                          <span className="text-slate-500 text-[9px] italic font-bold">Pobjednik...</span>
                                        ) : (
                                          <span className="text-slate-600 dark:text-slate-700 text-[9px]">Prazno...</span>
                                        )
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Player 2 Score & Sets */}
                                <div className="flex items-center gap-2 ml-4">
                                  <div className={`text-base font-bold ${p2Winner ? 'text-green-400' : 'text-white'}`}>
                                    {match.player2Score ?? 0}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 flex gap-2 text-xs">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingMatch(match);
                                    setShowMatchModal(true);
                                  }}
                                  className="flex-1 bg-sky-600 hover:bg-sky-500 text-white px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                                  title="Uredi meč"
                                >
                                  Uredi
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if(confirm("Obrisati ovaj meč iz žrijeba?")) {
                                      handleDeleteMatch(match.id);
                                    }
                                  }}
                                  className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                                  title="Obriši meč"
                                >
                                  Obriši
                                </button>
                              </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          </div>
        )}
      </div>

      {/* Setup Knockout Template Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-black/60 dark:bg-black/90 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900/50">
              <div>
                <h3 className="text-slate-900 dark:text-white font-bold text-lg">Kreiraj eliminacioni kostur</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Izaberi veličinu žrijeba ili dodaj meč ručno</p>
              </div>
              <button onClick={() => setShowSetupModal(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Prazan kostur (TBD slotovi)</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[4, 8, 16, 32].map(size => (
                    <button
                      key={size}
                      onClick={async () => {
                        await handleGenerateTemplate(size);
                        setShowSetupModal(false);
                      }}
                      disabled={generating}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                    >
                      {size} Igrača
                    </button>
                  ))}
                </div>
              </div>

              {hasBarazRound && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-amber-700 dark:text-amber-500 uppercase tracking-widest mb-1">Baraž detektovan</p>
                      <p className="text-xs text-amber-800 dark:text-amber-300">Možeš regenerisati glavni kostur i sačuvati postojeće baraž mečeve.</p>
                    </div>
                    <button
                      onClick={async () => {
                        await handleGenerateTemplate(16, true);
                        setShowSetupModal(false);
                      }}
                      disabled={generating}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                      Sačuvaj Baraž
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Napredno</p>
                <button
                  onClick={() => {
                    setShowSetupModal(false);
                    setShowManualModal(true);
                  }}
                  className="w-full bg-white dark:bg-slate-800 text-slate-700 dark:text-white px-5 py-3 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm border border-slate-200 dark:border-slate-700"
                >
                  Ručno dodaj pojedinačni meč
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Match Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 dark:bg-black/90 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900/50">
              <h3 className="text-slate-900 dark:text-white font-bold text-lg">Ručno kreiranje meča</h3>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {suggestedMatches.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Prijedlozi na osnovu grupa</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {suggestedMatches.map((s, idx) => {
                      const isUsed = placedPlayerIds.has(s.p1.id) || placedPlayerIds.has(s.p2.id);
                      return (
                        <button 
                          key={idx}
                          disabled={isUsed}
                          onClick={() => {
                            setManualMatch({
                              ...manualMatch,
                              player1Id: s.p1.id,
                              player2Id: s.p2.id
                            });
                          }}
                          className={`flex flex-col p-3 rounded-lg border text-left transition-all ${isUsed ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 opacity-20' : 'bg-blue-50 dark:bg-blue-500/5 border-blue-100 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/10'}`}
                        >
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">{s.label}</span>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium uppercase truncate">{s.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                {/* Player 1 Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Igrač 1</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                    value={manualMatch.player1Id}
                    onChange={(e) => setManualMatch({...manualMatch, player1Id: e.target.value})}
                  >
                    <option value="">Izaberi igrača</option>
                    {(activeCategory?.playerIds || []).map(pid => {
                      const p = allPlayers.find(p => p.id === pid);
                      if (!p) return null;
                      return <option key={pid} value={pid} className="dark:bg-slate-950 font-bold">{p.name}</option>;
                    })}
                  </select>
                </div>

                {/* Player 2 Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Igrač 2</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                    value={manualMatch.player2Id}
                    onChange={(e) => setManualMatch({...manualMatch, player2Id: e.target.value})}
                  >
                    <option value="">Izaberi igrača</option>
                    {(activeCategory?.playerIds || []).map(pid => {
                      const p = allPlayers.find(p => p.id === pid);
                      if (!p) return null;
                      return <option key={pid} value={pid} className="dark:bg-slate-950 font-bold">{p.name}</option>;
                    })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Naziv runde</label>
                  <input 
                    type="text" 
                    placeholder="Npr. Polufinale"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                    value={manualMatch.roundName}
                    onChange={(e) => setManualMatch({...manualMatch, roundName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Redni broj runde</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                    value={manualMatch.round}
                    onChange={(e) => setManualMatch({...manualMatch, round: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={onAddManual}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30"
                >
                  Kreiraj Meč
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingPlayerSlot && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 dark:bg-black/90 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-xl overflow-hidden shadow-2xl flex flex-col h-[82vh] max-h-[82vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900/50 sticky top-0 z-10">
              <div>
                <h3 className="text-slate-900 dark:text-white font-bold text-lg">Izaberi Igrača</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Izaberi učesnika za poziciju {editingPlayerSlot.playerSlot}</p>
              </div>
              <button onClick={() => setEditingPlayerSlot(null)} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-5 md:p-6 overflow-y-auto h-full custom-scrollbar">
              <div className="mb-4">
                  {(() => {
                    const match = matches.find(m => m.id === editingPlayerSlot.matchId);
                    const currentPlayer = match?.[editingPlayerSlot.playerSlot === 1 ? 'player1' : 'player2'];
                    const hasPlayer = currentPlayer && currentPlayer.id && currentPlayer.id !== 'tbd';

                    const previousWinners = [];
                    if (match && match.round > 1) {
                      const prevRound = match.round - 1;
                      matches.filter(m => m.isKnockout && m.round === prevRound && m.status === 'completed').forEach(m => {
                        const winner = m.player1Score > m.player2Score ? m.player1 : m.player2;
                        if (winner && winner.id !== 'tbd') {
                          previousWinners.push({
                            ...winner,
                            fromRoundName: m.roundName || `Runda ${m.round}`
                          });
                        }
                      });
                    }

                    return (
                      <div className="space-y-4">
                        {hasPlayer && (
                          <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 flex items-center justify-between shadow-sm">
                              <div>
                                  <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mb-1">Trenutni igrač</p>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white italic">{currentPlayer.name}</p>
                              </div>
                              <button 
                                  onClick={() => onSelectPlayerForSlot({ id: 'tbd', name: 'TBD' })}
                                  className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg transition-colors shadow-sm shadow-red-600/20"
                                  title="Ukloni igrača (Resetuj na TBD)"
                              >
                                  <Trash2 size={16} />
                              </button>
                          </div>
                        )}

                        {previousWinners.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 px-1">
                              <Trophy size={14} className="text-yellow-500" />
                              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pobjednici prethodne runde</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {previousWinners.map((winner, idx) => (
                                <button 
                                  key={`prev-${winner.id}-${idx}`}
                                  onClick={() => onSelectPlayerForSlot(winner)}
                                  className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 p-3 rounded-2xl hover:bg-blue-600 hover:text-white transition-all text-left group/winner"
                                >
                                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-600/20 group-hover/winner:bg-white group-hover/winner:text-blue-600 transition-colors">
                                    {winner.name?.[0]?.toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-900 dark:text-white group-hover/winner:text-white truncate">{winner.name}</p>
                                    <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest group-hover/winner:text-blue-100 italic">Pobjednik: {winner.fromRoundName}</p>
                                  </div>
                                  <ChevronRight size={18} className="text-blue-500 group-hover/winner:text-white transition-colors" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
              </div>

               <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => onSelectPlayerForSlot({ id: 'tbd', name: 'TBD' })}
                    className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-800 transition-all text-left group"
                  >
                    <div className="w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-400">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">TBD</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Pozicija će biti naknadno određena</p>
                    </div>
                  </button>

                  {roundWinners.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 mt-4 mb-2">
                        <Trophy size={14} className="text-amber-500" />
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pobjednici prošlih mečeva</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {roundWinners.map(player => (
                          <button 
                            key={`winner-${player.id}-${player.matchId}`}
                            onClick={() => onSelectPlayerForSlot(player)}
                            className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all text-left group"
                          >
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                              {player.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{player.name}</p>
                              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium uppercase">Pobjednik iz: {player.fromRound}</p>
                            </div>
                            <ChevronRight size={16} className="text-blue-300 group-hover:text-blue-600 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Kvalifikovani iz grupa - za Runda 1 ili Baraž (0) ili Amater liga ili Razigravanje */}
                  {(() => {
                    const currentMatch = matches.find(m => m.id === editingPlayerSlot.matchId);
                    if (isAmater || currentMatch?.round === 1 || currentMatch?.round === 0 || currentMatch?.isPlayoff) {
                        const advancingFromGroups = [];
                        // Za Amater ligu i Razigravanje, prikaži SVE igrače koji su u ovoj kategoriji (iz activeCategory.playerIds)
                        if (isAmater || currentMatch?.isPlayoff) {
                          (activeCategory.playerIds || []).forEach(pId => {
                            const p = allPlayers.find(ap => ap.id === pId);
                            if (p) {
                              advancingFromGroups.push({
                                ...p,
                                fromGroup: 'Liga'
                              });
                            }
                          });
                        } else {
                          // Standardna logika za grupe
                          groups.forEach((group, idx) => {
                            const standings = calculateStandings(idx);
                            const advancingCount = activeCategory.advancingPlayers || 2;
                            standings.slice(0, advancingCount).forEach(p => {
                              advancingFromGroups.push({
                                ...p, 
                                fromGroup: String.fromCharCode(65 + idx)
                              });
                            });
                          });
                        }
                        
                        if (advancingFromGroups.length > 0) {
                          return (
                            <>
                              <div className="flex items-center gap-2 mt-6 mb-2">
                                <Zap size={14} className="text-emerald-500" />
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                  {isAmater || currentMatch?.isPlayoff ? 'Učesnici Turnira' : 'Kvalifikovani iz grupa'}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {advancingFromGroups.map(player => (
                                  <button 
                                    key={`group-${player.id}`}
                                    onClick={() => onSelectPlayerForSlot(player)}
                                    className="flex items-center gap-3 bg-emerald-900/25 border border-emerald-700/60 p-3 rounded-lg hover:bg-emerald-800/35 transition-all text-left"
                                  >
                                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                      {player.fromGroup[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-bold text-white truncate">{player.name}</p>
                                      <p className="text-[10px] text-emerald-300 font-medium uppercase">Grupa {player.fromGroup}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </>
                          );
                        }
                    }
                    return null;
                  })()}

                  <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <details className="group">
                      <summary className="flex items-center justify-between cursor-pointer list-none">
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Igrači ove kategorije (Napredno)</span>
                        </div>
                        <ChevronDown size={14} className="text-slate-400 group-open:rotate-180 transition-transform" />
                      </summary>
                      <div className="grid grid-cols-1 gap-2 mt-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {categoryPlayers.map(player => (
                          <button 
                            key={player.id}
                            onClick={() => onSelectPlayerForSlot(player)}
                            className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg hover:border-blue-400 transition-all text-left shadow-sm"
                          >
                            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                              {player.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{player.name}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase">{player.club || 'Bez kluba'}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </details>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default KnockoutTab;
