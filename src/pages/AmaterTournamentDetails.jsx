import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, setDoc, addDoc, serverTimestamp, writeBatch, onSnapshot, deleteDoc } from 'firebase/firestore';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  Users, Trophy, Layers, Settings2, Search, List, Plus, RefreshCw, Calendar, Save, Trash2, Edit2, Zap, PlayCircle, CheckCircle, ChevronLeft, RotateCcw, ListOrdered
} from 'lucide-react';
import { initPlayerStats, updateStatsFromMatch, calculateStandings as sortStandings } from '../utils/standings';
import { generateBergerMatches } from '../utils/berger';

// Sub-components
import AmaterPlayersTab from '../components/amater-league/AmaterPlayersTab';
import FinalStandingsTab from '../components/amater-league/FinalStandingsTab';
import CategoriesTab from '../components/competition/CategoriesTab';
import MatchesTab from '../components/competition/MatchesTab';
import KnockoutTab from '../components/competition/KnockoutTab';
import SettingsTab from '../components/competition/SettingsTab';
import GlobalMatchSearch from '../components/competition/GlobalMatchSearch';
import CompetitionHeader from '../components/competition/CompetitionHeader';
import MatchUpdateModal from '../components/competition/MatchUpdateModal';
import AllMatchesTab from '../components/competition/AllMatchesTab';
import AllPlayersTab from '../components/competition/AllPlayersTab';
import RefereesTab from '../components/competition/RefereesTab';
import TablesTab from '../components/competition/TablesTab';

const AmaterTournamentDetails = () => {
  const { seasonId, id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userData, planDetails, isSuperAdmin: userIsSuperAdmin } = useAuth();
  
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allPlayers, setAllPlayers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [seasonCategories, setSeasonCategories] = useState([]);
  const [matches, setMatches] = useState([]);
  const [editingMatch, setEditingMatch] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  
  const selectedCategoryId = searchParams.get('category') || '';
  const activeTab = searchParams.get('tab') || 'players';

  // Collection paths for Amater League
  const tournamentCollection = "amater_league_tournaments";
  const parentCollection = "amater_leagues";

  useEffect(() => {
    if (id && selectedCategoryId) {
      const q = query(
        collection(db, "matches"), 
        where("competitionId", "==", id),
        where("categoryId", "==", selectedCategoryId)
      );
      const unsubscribe = onSnapshot(q, (snap) => {
        setMatches(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }
  }, [id, selectedCategoryId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !userData || !user) return;

      try {
        const compRef = doc(db, tournamentCollection, id);
        const compSnap = await getDoc(compRef);

        if (compSnap.exists()) {
          const compData = { id: compSnap.id, ...compSnap.data() };
          setCompetition(compData);
          
          // Permission check
          const isSuperAdminUser = userData?.role === 'super_admin';
          let canAccess = compData.ownerUid === user?.uid || 
                         compData.collaborators?.includes(user?.email) || 
                         isSuperAdminUser;

          if (!canAccess && compData.parentLeagueId) {
             const parentSnap = await getDoc(doc(db, parentCollection, compData.parentLeagueId));
             if (parentSnap.exists()) {
                const parentData = parentSnap.data();
                if (parentData.ownerUid === user?.uid || parentData.collaborators?.includes(user?.email)) {
                   canAccess = true;
                }
             }
          }

          if (!canAccess) {
            console.error("Nemate dozvolu za pristup.");
            setLoading(false);
            return;
          }

          // Fetch players associated with the season owner
          let ownerToUse = compData.ownerUid;
          if (compData.parentLeagueId) {
             const parentSnap = await getDoc(doc(db, parentCollection, compData.parentLeagueId));
             if (parentSnap.exists()) {
                const parentData = parentSnap.data();
                ownerToUse = parentData.ownerUid;
                setCompetition(prev => ({ ...prev, parentLeague: parentData }));
             }
          }

          const playersQ = isSuperAdminUser 
            ? query(collection(db, "players"))
            : query(collection(db, "players"), where("ownerUid", "==", ownerToUse));

          const playersSnap = await getDocs(playersQ);
          const playersList = playersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAllPlayers(playersList);
        }
      } catch (err) {
        console.error("Greška pri učitavanju:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, userData, user]);

  useEffect(() => {
    if (!id) return;
    setCategoriesLoading(true);
    const q = query(collection(db, tournamentCollection, id, "categories"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setCategoriesLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (!competition?.parentLeagueId) return;
    const q = query(collection(db, "amater_leagues", competition.parentLeagueId, "categories"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setSeasonCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [competition?.parentLeagueId]);

  const [generating, setGenerating] = useState(false);
  const [showGenOptions, setShowGenOptions] = useState(false);
  const [isDoubleOption, setIsDoubleOption] = useState(false);

  const activeCategory = categories.find(c => c.id === selectedCategoryId) || categories[0];

  const handleGenerateLeagueMatches = async (type = 'auto', isDouble = false) => {
    if (!activeCategory || activeCategory.playerIds?.length < 2) {
      alert("Potrebno je bar 2 igrača za raspored.");
      return;
    }

    if (matches.length > 0 && !confirm("Ovo će obrisati postojeće mečeve i generisati nove. Nastaviti?")) return;

    setGenerating(true);
    setShowGenOptions(false);
    try {
      const batch = writeBatch(db);
      
      // Delete existing
      matches.forEach(m => {
        batch.delete(doc(db, "matches", m.id));
      });

      if (type === 'auto') {
        const bergerRounds = generateBergerMatches(activeCategory.playerIds.map(id => {
          const p = allPlayers.find(ap => ap.id === id);
          return { id, name: p?.name || 'Nepoznat' };
        }));
        
        const processRounds = (roundsList, roundOffset = 0, isSecondLeg = false) => {
          roundsList.forEach((round, rIdx) => {
            round.matches.forEach((match) => {
              const matchRef = doc(collection(db, "matches"));
              batch.set(matchRef, {
                competitionId: id,
                categoryId: activeCategory.id,
                isAmater: true,
                player1: isSecondLeg ? match.player2 : match.player1,
                player2: isSecondLeg ? match.player1 : match.player2,
                player1Score: 0,
                player2Score: 0,
                status: 'scheduled',
                round: round.roundNumber + roundOffset,
                roundName: `Kolo ${round.roundNumber + roundOffset}`,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            });
          });
        };

        processRounds(bergerRounds);
        if (isDouble) {
          processRounds(bergerRounds, bergerRounds.length, true);
        }
      } else if (type === 'empty_rounds') {
        // Generiše samo jedan krug (jednokružni broj kola) sa TBD
        const playerCount = activeCategory.playerIds.length;
        const numRounds = playerCount % 2 === 0 ? playerCount - 1 : playerCount;
        const matchesPerRound = Math.floor(playerCount / 2);

        for (let r = 1; r <= (isDouble ? numRounds * 2 : numRounds); r++) {
          for (let m = 1; m <= matchesPerRound; m++) {
            const matchRef = doc(collection(db, "matches"));
            batch.set(matchRef, {
              competitionId: id,
              categoryId: activeCategory.id,
              isAmater: true,
              player1: { id: 'tbd', name: 'TBD' },
              player2: { id: 'tbd', name: 'TBD' },
              player1Score: 0,
              player2Score: 0,
              status: 'scheduled',
              round: r,
              roundName: `Kolo ${r}`,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
        }
      }

      await batch.commit();
      
      // Update category status
      await updateDoc(doc(db, tournamentCollection, id, "categories", activeCategory.id), {
        status: 'ongoing',
        format: 'round_robin',
        updatedAt: serverTimestamp()
      });

    } catch (err) {
      console.error("Error generating matches:", err);
      alert("Greška: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleAddRound = async () => {
    if (!selectedCategoryId) return;
    try {
      const currentRounds = matches.filter(m => !m.isKnockout).reduce((acc, m) => {
        return Math.max(acc, m.round || 0);
      }, 0);
      
      const newRound = currentRounds + 1;
      const batch = writeBatch(db);
      
      // Dodajemo jedan prazan meč za novo kolo da bi se ono pojavilo u listi
      const matchRef = doc(collection(db, "matches"));
      batch.set(matchRef, {
        competitionId: id,
        categoryId: selectedCategoryId,
        isAmater: true,
        player1: { id: 'tbd', name: 'TBD' },
        player2: { id: 'tbd', name: 'TBD' },
        player2Score: 0,
        status: 'scheduled',
        round: newRound,
        roundName: `Kolo ${newRound}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      await batch.commit();
    } catch (err) {
      console.error(err);
      alert("Greška pri dodavanju kola.");
    }
  };

  const handleAddManualMatch = async (dataOrRound) => {
    if (!selectedCategoryId) return;
    
    let baseData = {};
    if (typeof dataOrRound === 'number') {
      // Ako je proslijeđen broj, to je round broj iz "+ MEČ" dugmeta
      baseData = {
        player1: { id: 'tbd', name: 'TBD' },
        player2: { id: 'tbd', name: 'TBD' },
        player1Score: 0,
        player2Score: 0,
        round: dataOrRound,
        roundName: `Kolo ${dataOrRound}`,
        isAmater: true
      };
    } else {
      baseData = dataOrRound;
    }

    try {
      const matchRef = doc(collection(db, "matches"));
      await setDoc(matchRef, {
        ...baseData,
        competitionId: id,
        categoryId: selectedCategoryId,
        status: baseData.status || 'pending',
        isKnockout: baseData.isKnockout || baseData.isPlayoff || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ownerUid: competition?.ownerUid || userData?.uid || '',
        ownerEmail: competition?.ownerEmail || userData?.email || ''
      });
    } catch (err) {
      console.error(err);
      alert("Greška pri dodavanju meča.");
    }
  };

  const handleDeleteAllMatches = async (isKnockout = true) => {
    if (!selectedCategoryId) return;
    const type = isKnockout ? "knockout" : "ligaške";
    if (!window.confirm(`Da li ste sigurni da želite obrisati SVE ${type} mečeve?`)) return;

    try {
      const toDelete = matches.filter(m => !!m.isKnockout === isKnockout);
      const batch = writeBatch(db);
      toDelete.forEach(m => batch.delete(doc(db, "matches", m.id)));
      await batch.commit();
      alert("Mečevi obrisani.");
    } catch (err) {
      console.error(err);
      alert("Greška.");
    }
  };

  const handleGenerateTemplate = async (count) => {
    if (!selectedCategoryId) return;
    setGenerating(true);
    try {
      const batch = writeBatch(db);
      const standings = calculateStandings(0);
      const topPlayers = standings.slice(0, count);

      let nextPowerOf2 = 1;
      while (nextPowerOf2 < count) nextPowerOf2 *= 2;
      
      const roundsCount = Math.log2(nextPowerOf2);
      let currentMatchCount = nextPowerOf2 / 2;

      // Professional Bracket Seeding Pattern (1vs16, 2vs15 etc with splitting sides)
      const getSeedOrder = (size) => {
        let seeds = [1, 2];
        while (seeds.length < size) {
          let nextSeeds = [];
          for (let i = 0; i < seeds.length; i++) {
            nextSeeds.push(seeds[i]);
            nextSeeds.push(2 * seeds.length + 1 - seeds[i]);
          }
          seeds = nextSeeds;
        }
        
        // Now reorder to split top 2 on opposite ends of the array
        // Standard bracket: 1 vs 16, 8 vs 9, 5 vs 12, 4 vs 13, 3 vs 14, 6 vs 11, 7 vs 10, 2 vs 15
        if (size === 8) return [1, 8, 4, 5, 3, 6, 2, 7];
        if (size === 16) return [1, 16, 8, 9, 5, 12, 4, 13, 3, 14, 6, 11, 7, 10, 2, 15];
        return seeds;
      };

      const seedOrder = getSeedOrder(nextPowerOf2);

      for (let r = 1; r <= roundsCount; r++) {
        let name = `Runda ${r}`;
        if (currentMatchCount === 32) name = '1/32 Finale';
        if (currentMatchCount === 16) name = '1/16 Finale';
        if (currentMatchCount === 8) name = '1/8 Finale';
        if (currentMatchCount === 4) name = '1/4 Finale';
        if (currentMatchCount === 2) name = 'Polufinale';
        if (currentMatchCount === 1) name = 'Finale';

        for (let i = 0; i < currentMatchCount; i++) {
          let p1 = { id: 'tbd', name: 'TBD' };
          let p2 = { id: 'tbd', name: 'TBD' };

          if (r === 1) {
            const s1 = seedOrder[i * 2];
            const s2 = seedOrder[i * 2 + 1];
            const player1 = topPlayers.find((_, idx) => idx === s1 - 1);
            const player2 = topPlayers.find((_, idx) => idx === s2 - 1);
            if (player1) p1 = { id: player1.id, name: player1.name };
            if (player2) p2 = { id: player2.id, name: player2.name };
          }

          const matchRef = doc(collection(db, "matches"));
          batch.set(matchRef, {
            player1: p1,
            player2: p2,
            roundName: name,
            round: r,
            bracketIndex: i,
            isKnockout: true,
            status: 'pending',
            competitionId: id,
            categoryId: selectedCategoryId,
            setsToWin: activeCategory?.setsToWin || 2,
            createdAt: serverTimestamp()
          });
        }
        currentMatchCount /= 2;
      }
      await batch.commit();
      alert(`Žrijeb generisan za top ${count} igrača!`);
    } catch (err) {
      console.error(err);
      alert("Greška pri generisanju žrijeba.");
    } finally {
      setGenerating(false);
    }
  };

  const handleAddManualKnockoutRound = async () => {
    if (!selectedCategoryId) return;
    const count = prompt("Koliko mečeva želite dodati u novu knockout rundu?", "4");
    if (!count || isNaN(count)) return;

    try {
      const matchCount = parseInt(count);
      const batch = writeBatch(db);
      
      // Find current max round
      const koMatches = matches.filter(m => m.isKnockout);
      const maxRound = koMatches.length > 0 ? Math.max(...koMatches.map(m => m.round || 1)) : 0;
      const nextRound = maxRound + 1;
      
      let name = `Runda ${nextRound}`;
      if (matchCount === 8) name = '1/8 Finale';
      if (matchCount === 4) name = '1/4 Finale';
      if (matchCount === 2) name = 'Polufinale';
      if (matchCount === 1) name = 'Finale';

      for (let i = 0; i < matchCount; i++) {
        const matchRef = doc(collection(db, "matches"));
        batch.set(matchRef, {
          player1: { id: 'tbd', name: 'TBD' },
          player2: { id: 'tbd', name: 'TBD' },
          roundName: name,
          round: nextRound,
          bracketIndex: i,
          isKnockout: true,
          status: 'pending',
          competitionId: id,
          categoryId: selectedCategoryId,
          setsToWin: activeCategory?.setsToWin || 2,
          createdAt: serverTimestamp()
        });
      }
      await batch.commit();
      alert("Runda dodana!");
    } catch (err) {
      console.error(err);
      alert("Greška.");
    }
  };

  const calculateStandings = (groupIdx) => {
    if (!activeCategory) return [];
    
    // For Amater league, players are in playerIds. For regular groups, in groups[groupIdx]
    const groupPlayerIds = activeCategory.playerIds || [];
    const groupMatches = matches.filter(m => m.categoryId === activeCategory.id && !m.isKnockout);
    
    const stats = groupPlayerIds.map(pid => {
      const p = allPlayers.find(ap => ap.id === pid) || { id: pid, name: 'Nepoznat' };
      let s = initPlayerStats(p);
      
      groupMatches.filter(m => m.status === 'completed' && (m.player1?.id === pid || m.player2?.id === pid))
        .forEach(m => {
          s = updateStatsFromMatch(s, m, m.player1?.id === pid, activeCategory.winPoints || 1, activeCategory.lossPoints || 0);
        });
      return s;
    });

    return sortStandings(stats, groupMatches, 0); // Always index 0 for amater league table
  };

  const handleUpdateFinalRankings = async () => {
    if (!activeCategory || activeCategory.status !== 'ongoing') return;
    
    // Calculate standings from league/group phase
    const standings = calculateStandings(0);
    const playerIdsByRank = standings.map(s => s.id);

    try {
      // 1. Update the category within the sub-tournament
      await updateDoc(doc(db, tournamentCollection, id, "categories", activeCategory.id), {
        finalRankings: playerIdsByRank,
        status: 'completed',
        updatedAt: serverTimestamp()
      });

      // 2. IMPORTANT: Also update the parent Season/League rankings field
      // This is what the SeasonDetails page reads for the "Standings" tab
      if (competition.parentLeagueId) {
        const seasonRef = doc(db, "amater_leagues", competition.parentLeagueId);
        const seasonSnap = await getDoc(seasonRef);
        
        if (seasonSnap.exists()) {
          const seasonData = seasonSnap.data();
          const currentRankings = seasonData.finalRankings || {};
          
          // Store rankings for this specific category and this specific tournament
          // Structure: { [categoryId]: { [tournamentId]: [playerIds...] } }
          if (!currentRankings[selectedCategoryId]) {
            currentRankings[selectedCategoryId] = {};
          }
          currentRankings[selectedCategoryId][id] = playerIdsByRank;

          await updateDoc(seasonRef, {
            finalRankings: currentRankings,
            updatedAt: serverTimestamp()
          });
        }
      }

      alert("Turnir je završen! Rezultati su upisani u tabelu sezone.");
    } catch (err) {
      console.error(err);
      alert("Greška pri završavanju turnira: " + err.message);
    }
  };

  const handleGenerateKnockout = async () => {
    if (!activeCategory || !activeCategory.playerIds) return;
    if (!window.confirm("Ovim ćete pobrisati postojeći žrijeb i rezultate eliminacija za ovu kategoriju. Nastaviti?")) return;
    
    setGenerating(true);
    try {
      const batch = writeBatch(db);
      const oldKnockoutMatches = matches.filter((m) =>
        m.categoryId === selectedCategoryId && (m.isKnockout || (m.roundName && !m.groupId))
      );
      oldKnockoutMatches.forEach((m) => batch.delete(doc(db, "matches", m.id)));
      
      // Koristimo sve igrače iz kategorije za amater knockout
      const players = activeCategory.playerIds.map(pid => {
        const p = allPlayers.find(ap => ap.id === pid);
        return { id: pid, name: p?.name || 'Nepoznat', club: p?.club || '' };
      });

      if (players.length < 2) {
        alert("Nema dovoljno igrača za knockout fazu.");
        setGenerating(false);
        return;
      }

      let nextPowerOf2 = 1;
      while (nextPowerOf2 < players.length) nextPowerOf2 *= 2;
      
      const roundsCount = Math.log2(nextPowerOf2);
      const matchesInFirstRound = nextPowerOf2 / 2;
      
      const tournamentRounds = [];
      let currentMatchCount = matchesInFirstRound;
      for (let r = 1; r <= roundsCount; r++) {
        let name = `Runda ${r}`;
        if (currentMatchCount === 64) name = '1/64 Finale';
        if (currentMatchCount === 32) name = '1/32 Finale';
        if (currentMatchCount === 16) name = '1/16 Finale';
        if (currentMatchCount === 8) name = '1/8 Finale';
        if (currentMatchCount === 4) name = '1/4 Finale';
        if (currentMatchCount === 2) name = 'Polufinale';
        if (currentMatchCount === 1) name = 'Finale';
        tournamentRounds.push({ round: r, count: currentMatchCount, name });
        currentMatchCount /= 2;
      }

      tournamentRounds.forEach(r => {
        for (let i = 0; i < r.count; i++) {
          const matchRef = doc(collection(db, "matches"));
          const matchData = {
            player1: { id: 'tbd', name: 'TBD' },
            player2: { id: 'tbd', name: 'TBD' },
            roundName: r.name,
            round: r.round,
            bracketIndex: i,
            bracketSide: i < (r.count / 2) ? 'lijevi' : 'desni',
            isKnockout: true,
            status: 'pending',
            competitionId: id,
            categoryId: selectedCategoryId,
            setsToWin: activeCategory?.setsToWin || 2,
            createdAt: serverTimestamp()
          };
          // U prvoj rundi popunjavamo igrače ako ih ima
          if (r.round === 1) {
            if (players[i * 2]) matchData.player1 = players[i * 2];
            if (players[i * 2 + 1]) matchData.player2 = players[i * 2 + 1];
          }
          batch.set(matchRef, matchData);
        }
      });
      await batch.commit();
      alert("Knockout žrijeb generisan!");
    } catch (err) {
      console.error(err);
      alert("Greška.");
    } finally {
      setGenerating(false);
    }
  };

  const handleResetKnockout = async () => {
    if (!window.confirm("Obrisati knockout fazu?")) return;
    try {
      const koMatches = matches.filter((m) =>
        m.categoryId === selectedCategoryId && (m.isKnockout || (m.roundName && !m.groupId))
      );
      const batch = writeBatch(db);
      koMatches.forEach((m) => batch.delete(doc(db, "matches", m.id)));
      await batch.commit();
    } catch (err) { console.error(err); }
  };

  const handleUpdateMatchPlayer = async (matchId, slot, player) => {
    try {
      if (!player || !player.id) return;
      const slotKey = slot === 1 ? 'player1' : 'player2';
      await updateDoc(doc(db, "matches", matchId), {
        [slotKey]: { 
          id: player.id, 
          name: player.name, 
          club: player.club || '' 
        }
      });
    } catch (err) { 
      console.error(err); 
      alert("Greška pri dodavanju igrača u meč.");
    }
  };

  const handleToggleStage = async (stage, completed) => {
    try {
      await updateDoc(doc(db, tournamentCollection, id, "categories", activeCategory.id), {
        [`stages.${stage}.completed`]: completed
      });
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const checkAndCreateDefaultCategory = async () => {
      if (!categoriesLoading && categories.length === 0 && competition) {
        try {
          const catData = {
            name: "Glavna Kategorija",
            format: 'groups_knockout',
            status: 'draft',
            createdAt: serverTimestamp(),
            playerIds: [],
            seededPlayerIds: [],
            advancingPlayers: 2,
            setsToWin: 2,
            winPoints: 2,
            lossPoints: 0
          };
          await addDoc(collection(db, tournamentCollection, id, "categories"), catData);
        } catch (err) {
          console.error("Greška pri kreiranju podrazumijevane kategorije:", err);
        }
      }
    };
    checkAndCreateDefaultCategory();
  }, [categoriesLoading, categories.length, competition, id]);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('category', categories[0].id);
      if (!searchParams.get('tab')) newParams.set('tab', 'players');
      setSearchParams(newParams);
    }
  }, [categories, selectedCategoryId]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const name = window.prompt("Unesite naziv kategorije (npr. Seniori):");
    if (!name) return;

    try {
      const catData = {
        name: name.trim(),
        format: 'groups_knockout',
        status: 'draft',
        createdAt: serverTimestamp(),
        playerIds: [],
        seededPlayerIds: [],
        advancingPlayers: 2,
        setsToWin: 2,
        winPoints: 2,
        lossPoints: 0
      };

      await addDoc(collection(db, tournamentCollection, id, "categories"), catData);
    } catch (err) {
      console.error("Greška pri kreiranju kategorije:", err);
      alert(`Greška: ${err.message}`);
    }
  };

  if (loading || (categoriesLoading && categories.length === 0)) return <div className="p-8 text-center text-gray-500">Učitavanje...</div>;
  if (!competition) return <div className="p-8 text-center text-red-500">Turnir nije pronađen.</div>;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CompetitionHeader 
          competition={competition} 
          isAmater={true}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            const newParams = new URL(window.location).searchParams;
            newParams.set('tab', tab);
            setSearchParams(newParams);
          }}
          categoriesLoading={categoriesLoading}
          activeCategory={activeCategory}
          categories={categories}
        />

        <div className="mt-8">
            {/* Main content ONLY - No sidebar for choosing anymore */}
            <div className="flex-1 min-w-0">
                {activeCategory ? (
                    <div className="space-y-6">
                        {/* Tabs Navigation */}
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 p-1.5 rounded-[24px] border border-slate-200 dark:border-slate-900 shadow-sm w-fit overflow-x-auto no-scrollbar">
                           {[
                             { id: 'players', label: 'Igrači', icon: Users },
                             { id: 'matches', label: 'Mečevi', icon: List },
                             { id: 'knockout', label: 'Žrijeb', icon: Trophy },
                             { id: 'playoff', label: 'Razigravanje', icon: Layers },
                             { id: 'final', label: 'Konačni Poredak', icon: Trophy },
                             { id: 'settings', label: 'Postavke', icon: Settings2 }
                           ].map(tab => (
                             <button
                               key={tab.id}
                               onClick={() => {
                                   const p = new URLSearchParams(searchParams);
                                   p.set('tab', tab.id);
                                   setSearchParams(p);
                               }}
                               className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
                                 activeTab === tab.id 
                                 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                 : 'text-slate-500 dark:text-gray-500 hover:bg-slate-100 dark:hover:bg-slate-900'
                               }`}
                             >
                               <tab.icon className="w-4 h-4" />
                               {tab.label}
                             </button>
                           ))}
                        </div>

                        {/* Tab Content */}
                        <div className="bg-white dark:bg-slate-950 rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-900 min-h-[500px] overflow-hidden">
                            {activeTab === 'players' && (
                                <AmaterPlayersTab 
                                    competitionId={id} 
                                    categoryId={activeCategory.id} 
                                    activeCategory={activeCategory}
                                    allPlayers={allPlayers}
                                    isAmater={true} 
                                />
                            )}
                            {activeTab === 'matches' && (
                              <div className="space-y-6">
                                {matches.length === 0 && !showGenOptions ? (
                                  <div className="p-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border border-dashed border-slate-200 dark:border-slate-800">
                                    <Calendar className="w-16 h-16 text-blue-600/20 mx-auto mb-6" />
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-2">Raspored nije generisan</h3>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-8 max-w-sm mx-auto">Izabrali ste igrače, sada generišite raspored po Bergerovom sistemu (svako sa svakim).</p>
                                    <button 
                                      onClick={() => setShowGenOptions(true)}
                                      className="bg-blue-600 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"
                                    >
                                      GENERISI MEČEVE
                                    </button>
                                  </div>
                                ) : matches.length === 0 && showGenOptions ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-slate-900 rounded-[32px] border border-slate-800">
                                    {/* Automatski Jednokružni */}
                                    <div className="p-8 bg-slate-800/50 rounded-[24px] border border-slate-700 hover:border-blue-500/50 transition-all group cursor-pointer" onClick={() => handleGenerateLeagueMatches('auto', false)}>
                                      <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
                                        <Zap size={28} />
                                      </div>
                                      <h4 className="text-lg font-black text-white uppercase italic tracking-tighter mb-2">Automatski (1 krug)</h4>
                                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Sistem će sam upariti sve igrače (jednokružni sistem: svako sa svakim jednom).</p>
                                    </div>

                                    {/* Automatski Dvokružni */}
                                    <div className="p-8 bg-slate-800/50 rounded-[24px] border border-slate-700 hover:border-emerald-500/50 transition-all group cursor-pointer" onClick={() => handleGenerateLeagueMatches('auto', true)}>
                                      <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-600/20 group-hover:scale-110 transition-transform">
                                        <RefreshCw size={28} />
                                      </div>
                                      <h4 className="text-lg font-black text-white uppercase italic tracking-tighter mb-2">Automatski (2 kruga)</h4>
                                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Sistem kreira "domaće i gostujuće" mečeve (svako sa svakim dva puta).</p>
                                    </div>

                                    {/* Manuelno */}
                                    <div className="p-8 bg-slate-800/50 rounded-[24px] border border-slate-700 hover:border-indigo-500/50 transition-all group cursor-pointer" onClick={() => handleGenerateLeagueMatches('empty_rounds', false)}>
                                      <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                                        <List size={28} />
                                      </div>
                                      <h4 className="text-lg font-black text-white uppercase italic tracking-tighter mb-2">Prazna Kola (Manuelno)</h4>
                                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Sistem će napraviti prazna kola ("TBD"), a vi ćete sami birati ko igra s kim.</p>
                                    </div>

                                    {/* Prazna Kola Dvokružna */}
                                    <div className="p-8 bg-slate-800/50 rounded-[24px] border border-slate-700 hover:border-indigo-500/50 transition-all group cursor-pointer" onClick={() => handleGenerateLeagueMatches('empty_rounds', true)}>
                                      <div className="w-14 h-14 bg-indigo-900 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                                        <RotateCcw size={28} />
                                      </div>
                                      <h4 className="text-lg font-black text-white uppercase italic tracking-tighter mb-2">Manualno (2 kruga)</h4>
                                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Sistem će napraviti duplo više praznih kola za dvokružni sistem takmičenja.</p>
                                    </div>

                                    <button onClick={() => setShowGenOptions(false)} className="md:col-span-2 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Nazad</button>
                                  </div>
                                ) : (
                                  <div className="space-y-6">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 bg-slate-900 rounded-[20px] border border-slate-800">
                                      <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600 font-black italic">
                                          {matches.length}
                                        </div>
                                        <div>
                                          <h4 className="text-[10px] font-black uppercase text-white tracking-widest italic">Mečevi Lige</h4>
                                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none">Pregled i uređivanje po kolima</p>
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        <button 
                                          onClick={() => handleAddManualMatch(1)}
                                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-[9px] font-black uppercase tracking-widest text-white rounded-lg transition-all flex items-center gap-2"
                                        >
                                          <Plus size={12} /> DODAJ MEČ
                                        </button>
                                        <button 
                                          onClick={handleAddRound}
                                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-[9px] font-black uppercase tracking-widest text-white rounded-lg transition-all flex items-center gap-2"
                                        >
                                          <List size={12} /> DODAJ KOLO
                                        </button>
                                        <button 
                                          onClick={() => setShowGenOptions(true)}
                                          className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-600/20 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all"
                                        >
                                          REGENERISI LIGU
                                        </button>
                                        <button 
                                          onClick={() => {
                                            if(confirm("BRISANJE KOMPLETNOG RASPOREDA?")) {
                                              const batch = writeBatch(db);
                                              matches.forEach(m => batch.delete(doc(db, "matches", m.id)));
                                              batch.commit();
                                            }
                                          }}
                                          className="px-4 py-2 border border-red-500/30 text-red-500 hover:bg-red-600 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all"
                                        >
                                          OBRIŠI SVE
                                        </button>
                                        <button 
                                          onClick={handleUpdateFinalRankings}
                                          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-blue-900/40 flex items-center gap-2"
                                        >
                                          <Trophy size={14} /> ZAVRŠI TURNIR
                                        </button>
                                      </div>
                                    </div>

                                    <MatchesTab 
                                      competitionId={id} 
                                      categoryId={activeCategory.id} 
                                      isAmater={true}
                                      activeCategory={{...activeCategory, format: 'round_robin', status: 'ongoing'}}
                                      matches={matches.filter(m => !m.isPlayoff)}
                                      allPlayers={allPlayers}
                                      selectedPlayers={activeCategory.playerIds || []}
                                      assignedPlayerIds={activeCategory.playerIds || []}
                                      groups={[activeCategory.playerIds || []]} 
                                      calculateStandings={calculateStandings}
                                      handleDeleteMatch={async (matchId) => {
                                        if(confirm("Obrisati ovaj meč?")) {
                                          await deleteDoc(doc(db, "matches", matchId));
                                        }
                                      }}
                                      saveMatchResult={async (match) => {
                                        try {
                                          const resultMatch = {
                                            ...match,
                                            status: 'completed',
                                            updatedAt: serverTimestamp(),
                                            seasonalTag: activeCategory.seasonalTag || '' // Add season reference to match
                                          };
                                          
                                          // Delete helper fields if they exist
                                          delete resultMatch.isAmater;
                                          
                                          await updateDoc(doc(db, "matches", match.id), {
                                            player1Score: match.player1Score || 0,
                                            player2Score: match.player2Score || 0,
                                            sets: match.sets || [],
                                            status: 'completed',
                                            seasonalTag: activeCategory.seasonalTag || '',
                                            updatedAt: serverTimestamp()
                                          });
                                          setShowMatchModal(false);
                                          setEditingMatch(null);
                                        } catch (err) {
                                          console.error("Greška pri spašavanju rezultata:", err);
                                          alert("Nemate dozvolu.");
                                        }
                                      }}
                                      handleScoreChange={async (matchId, player, value) => {
                                          const score = parseInt(value) || 0;
                                          try {
                                            await updateDoc(doc(db, "matches", matchId), {
                                              [`${player}Score`]: score
                                            });
                                          } catch (err) {
                                              console.error(err);
                                          }
                                      }}
                                      onEditMatch={(match) => {
                                        setEditingMatch(match);
                                        setShowMatchModal(true);
                                      }}
                                      handleReturnToDraft={async () => {
                                        if(confirm("Vratiti na pripremu? Izbrisat će sve mečeve.")) {
                                          const batch = writeBatch(db);
                                          matches.forEach(m => batch.delete(doc(db, "matches", m.id)));
                                          batch.update(doc(db, tournamentCollection, id, "categories", activeCategory.id), { status: 'draft' });
                                          await batch.commit();
                                        }
                                      }}
                                      handleToggleStage={async (stage, completed) => {
                                        await updateDoc(doc(db, tournamentCollection, id, "categories", activeCategory.id), {
                                          [`stages.${stage}.completed`]: completed
                                        });
                                      }}
                                      handleSaveManualOrder={() => {}} 
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                            {activeTab === 'playoff' && (
                              <div className="p-6 space-y-8">
                                <KnockoutTab 
                                  competitionId={id} 
                                  categoryId={activeCategory.id} 
                                  isAmater={true} 
                                  activeCategory={activeCategory}
                                  matches={matches.filter(m => m.isPlayoff)}
                                  groups={[activeCategory?.playerIds || []]} 
                                  allPlayers={allPlayers}
                                  calculateStandings={calculateStandings}
                                  setEditingMatch={setEditingMatch}
                                  setShowMatchModal={setShowMatchModal}
                                  handleToggleStage={handleToggleStage}
                                  handleDeleteAllMatches={() => {
                                      if(confirm("Obriši sve mečeve iz razigravanja?")) {
                                          const batch = writeBatch(db);
                                          matches.filter(m => m.isPlayoff).forEach(m => batch.delete(doc(db, "matches", m.id)));
                                          batch.commit();
                                      }
                                  }}
                                  handleAddManualMatch={async (data) => {
                                      const baseData = typeof data === 'number' 
                                          ? { round: data, roundName: `Razigravanje ${data}` } 
                                          : data;
                                      
                                      await handleAddManualMatch({
                                          ...baseData,
                                          isPlayoff: true,
                                          isAmater: true,
                                          status: 'scheduled'
                                      });
                                  }}
                                  handleDeleteMatch={async (matchId) => {
                                    if(confirm("Obrisati ovaj meč iz razigravanja?")) {
                                      await deleteDoc(doc(db, "matches", matchId));
                                    }
                                  }}
                                      saveMatchResult={async (match) => {
                                        try {
                                          await updateDoc(doc(db, "matches", match.id), {
                                            player1Score: parseInt(match.player1Score) || 0,
                                            player2Score: parseInt(match.player2Score) || 0,
                                            sets: match.sets || [],
                                            status: 'completed',
                                            isPlayoff: true,
                                            updatedAt: serverTimestamp(),
                                            seasonalTag: activeCategory.seasonalTag || ''
                                          });
                                          setShowMatchModal(false);
                                          setEditingMatch(null);
                                        } catch (err) {
                                          console.error(err);
                                        }
                                      }}
                                  isPlayoffOnly={true}
                                />
                              </div>
                            )}
                            {activeTab === 'knockout' && (
                              <div className="p-6 space-y-8">
                                <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-slate-900 rounded-[24px] border border-slate-800 shadow-xl">
                                  <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20">
                                        <Trophy className="text-yellow-500" size={24} />
                                     </div>
                                     <div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest italic leading-none">Knockout Faza (Žrijeb)</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                           <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                           UKUPNO: {matches.filter(m => m.isKnockout).length} MEČEVA
                                        </p>
                                     </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <button 
                                      onClick={() => handleDeleteAllMatches(true)}
                                      className="px-6 py-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                                    >
                                      OBRIŠI SVE MEČEVE
                                    </button>
                                  </div>
                                </div>

                                <KnockoutTab 
                                  competitionId={id} 
                                  categoryId={activeCategory.id} 
                                  isAmater={true} 
                                  activeCategory={activeCategory}
                                  matches={matches.filter(m => m.isKnockout)}
                                  groups={[activeCategory?.playerIds || []]} 
                                  allPlayers={allPlayers}
                                  calculateStandings={calculateStandings}
                                  setEditingMatch={setEditingMatch}
                                  setShowMatchModal={setShowMatchModal}
                                  handleToggleStage={handleToggleStage}
                                  handleGenerateKnockout={handleGenerateKnockout}
                                  handleResetKnockout={handleResetKnockout}
                                  handleUpdateMatchPlayer={handleUpdateMatchPlayer}
                                  handleGenerateTemplate={handleGenerateTemplate}
                                  handleDeleteAllMatches={() => handleDeleteAllMatches(true)}
                                  handleAddManualMatch={handleAddManualMatch}
                                  handleAddManualKnockoutRound={handleAddManualKnockoutRound}
                                  handleDeleteMatch={async (matchId) => {
                                    if(confirm("Obrisati ovaj meč?")) {
                                      try {
                                        await deleteDoc(doc(db, "matches", matchId));
                                      } catch (err) {
                                        console.error(err);
                                        alert("Greška pri brisanju.");
                                      }
                                    }
                                  }}
                                  saveMatchResult={async (match) => {
                                    setEditingMatch(match);
                                    setShowMatchModal(true);
                                  }}
                                  generating={generating}
                                />
                              </div>
                            )}
                            {activeTab === 'settings' && (
                              <SettingsTab 
                                competitionId={id} 
                                categoryId={activeCategory.id} 
                                isAmater={true} 
                                activeCategory={activeCategory}
                                seasonCategories={seasonCategories}
                                handleUpdateSettings={async (newSettings) => {
                                  try {
                                    const catRef = doc(db, tournamentCollection, id, "categories", activeCategory.id);
                                    await updateDoc(catRef, {
                                      ...newSettings,
                                      updatedAt: serverTimestamp()
                                    });
                                    alert("Postavke su uspješno sačuvane!");
                                  } catch (err) {
                                    console.error("Greška pri čuvanju postavki:", err);
                                    alert("Greška pri čuvanju: " + err.message);
                                  }
                                }}
                                handleToggleStage={async (stage, completed) => {
                                  try {
                                    const catRef = doc(db, tournamentCollection, id, "categories", activeCategory.id);
                                    await updateDoc(catRef, {
                                      [`stages.${stage}.completed`]: completed,
                                      status: completed ? 'ongoing' : 'draft',
                                      updatedAt: serverTimestamp()
                                    });
                                  } catch (err) {
                                    console.error("Greška pri promjeni statusa:", err);
                                  }
                                }}
                                isOwner={true}
                              />
                            )}
                            {activeTab === 'final' && (
                              <FinalStandingsTab 
                                activeCategory={activeCategory}
                                allPlayers={allPlayers}
                                matches={matches.filter(m => m.categoryId === activeCategory.id)}
                                id={id}
                                tournamentCollection={tournamentCollection}
                              />
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-slate-950 rounded-[32px] border border-slate-200 dark:border-slate-900 text-center">
                        <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Inicijalizacija...</h3>
                    </div>
                )}

                <MatchUpdateModal 
                  showMatchModal={showMatchModal}
                  editingMatch={editingMatch}
                  setEditingMatch={setEditingMatch}
                  setShowMatchModal={setShowMatchModal}
                  saveMatchResult={async (match) => {
                    try {
                      await updateDoc(doc(db, "matches", match.id), {
                        player1Score: parseInt(match.player1Score) || 0,
                        player2Score: parseInt(match.player2Score) || 0,
                        sets: match.sets || [],
                        status: 'completed',
                        updatedAt: serverTimestamp()
                      });
                      setShowMatchModal(false);
                      setEditingMatch(null);
                    } catch (err) {
                      console.error("Greška pri spašavanju rezultata:", err);
                      alert("Greška: " + err.message);
                    }
                  }}
                  activeCategory={activeCategory}
                  tables={[]}
                  referees={[]}
                />
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AmaterTournamentDetails;
