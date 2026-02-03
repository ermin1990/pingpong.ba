import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, setDoc, addDoc, serverTimestamp, writeBatch, onSnapshot } from 'firebase/firestore';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  Users, Trophy, Play, CheckCircle, Clock, Save, Plus, Layers, 
  ChevronRight, ChevronDown, LayoutGrid, FileText, Info, UserPlus, Search, 
  Target, Settings2, PlayCircle, Zap, X, AlertTriangle, Edit2, Code 
} from 'lucide-react';
import { generateBergerMatches } from '../utils/berger';

// Sub-components
import CategoriesTab from '../components/competition/CategoriesTab';
import PlayersTab from '../components/competition/PlayersTab';
import MatchesTab from '../components/competition/MatchesTab';
import KnockoutTab from '../components/competition/KnockoutTab';
import SettingsTab from '../components/competition/SettingsTab';
import GlobalMatchSearch from '../components/competition/GlobalMatchSearch';
import CompetitionHeader from '../components/competition/CompetitionHeader';
import MatchUpdateModal from '../components/competition/MatchUpdateModal';
import CompetitionSettingsModal from '../components/competition/CompetitionSettingsModal';

const CompetitionDetails = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userData } = useAuth();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allPlayers, setAllPlayers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  // URL state management
  const selectedCategoryId = searchParams.get('category') || '';
  const activeTab = searchParams.get('tab') || 'categories';

  const setSelectedCategoryId = (newId) => {
    const newParams = new URLSearchParams(searchParams);
    if (newId) {
      newParams.set('category', newId);
      // Ako mijenjamo kategoriju, prebaci na raspored (po želji korisnika)
      if (activeTab === 'categories') {
          newParams.set('tab', 'matches');
      }
    } else {
      newParams.delete('category');
      newParams.set('tab', 'categories');
    }
    setSearchParams(newParams);
  };

  const setActiveTab = (newTab) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', newTab);
    // Ne brišemo 'cat' parametar da bi tabovi ostali vidljivi
    setSearchParams(newParams);
  };

  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [playerFormMode, setPlayerFormMode] = useState('single');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerClub, setNewPlayerClub] = useState('');
  const [bulkPlayerText, setBulkPlayerText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [matches, setMatches] = useState([]);
  const [savingMatchId, setSavingMatchId] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryFormat, setNewCategoryFormat] = useState('round_robin'); // 'round_robin' | 'groups_knockout'
  const [editingFormat, setEditingFormat] = useState(false);
  const [showOnlySelected, setShowOnlySelected] = useState(true);
  const [editingMatch, setEditingMatch] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [allMatchesForSearch, setAllMatchesForSearch] = useState([]);
  const [matchSearchQuery, setMatchSearchQuery] = useState('');
  
  // Competition settings state
  const [showCompSettings, setShowCompSettings] = useState(false);
  const [compName, setCompName] = useState('');
  const [compSlug, setCompSlug] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [savingComp, setSavingComp] = useState(false);
  
  // Grouping state
  const [groups, setGroups] = useState([]); // Array of arrays of player objects
  const [groupTabs, setGroupTabs] = useState({}); // { groupIdx: 'players' | 'table' | 'matches' }
  const [manualOrders, setManualOrders] = useState({}); // Ručni poredak igrača po grupama

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !userData) return;

      try {
        // 1. Dohvati detalje takmičenja
        const compRef = doc(db, "competitions", id);
        const compSnap = await getDoc(compRef);
        
        if (compSnap.exists()) {
          const compData = { id: compSnap.id, ...compSnap.data() };
          setCompetition(compData);
          setCompName(compData.name || '');
          setCompSlug(compData.slug || '');
          setCollaborators(compData.collaborators || []);
          
          // 2. Dohvati igrače
          let playersQ;
          const isCollaborator = compData.collaborators?.includes(userData.email);
          const isOwner = compData.organizationId === userData.organizationId;
          const isSuperAdmin = userData.role === 'super_admin';

          if (isSuperAdmin) {
            playersQ = query(collection(db, "players"));
          } else if (isOwner || isCollaborator) {
            playersQ = query(
              collection(db, "players"), 
              where("organizationId", "==", compData.organizationId)
            );
          } else {
            // Korisnik nema pristup ovom takmičenju
            setLoading(false);
            setCompetition(null);
            return;
          }

          const playersSnap = await getDocs(playersQ);
          setAllPlayers(playersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      } catch (err) {
        console.error("Greška pri učitavanju:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, userData]);

  // Real-time kategorije
  useEffect(() => {
    if (!id) return;
    setCategoriesLoading(true);
    const q = query(collection(db, "competitions", id, "categories"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(list);
      setCategoriesLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  // Real-time mečevi za aktivnu kategoriju
  useEffect(() => {
    if (id && selectedCategoryId) {
      const q = query(
        collection(db, "matches"), 
        where("competitionId", "==", id),
        where("categoryId", "==", selectedCategoryId)
      );
      
      const unsubscribe = onSnapshot(q, (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort po rundi, pa po grupi ako postoji
        setMatches(list.sort((a, b) => {
          if (a.round !== b.round) return a.round - b.round;
          if (a.groupId !== b.groupId) return (a.groupId || 0) - (b.groupId || 0);
          return 0;
        }));
      });
      return () => unsubscribe();
    }
  }, [id, selectedCategoryId]);

  // Globalni listener za sve mečeve (za search)
  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, "matches"), 
      where("competitionId", "==", id)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setAllMatchesForSearch(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [id]);

  const activeCategory = categories.find(c => c.id === selectedCategoryId);

  const filteredGlobalMatches = useMemo(() => {
    if (!matchSearchQuery.trim()) return [];
    const lower = matchSearchQuery.toLowerCase();
    return allMatchesForSearch.filter(m => 
      m.player1?.name?.toLowerCase().includes(lower) || 
      m.player2?.name?.toLowerCase().includes(lower)
    ).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [allMatchesForSearch, matchSearchQuery]);

  // Sinhronizacija grupa iz baze ili inicijalizacija
  useEffect(() => {
    if (activeCategory?.groupConfig && allPlayers.length > 0) {
      try {
        // Podržavamo i stari format (niz) i novi format (objekat/mapa)
        const configData = Array.isArray(activeCategory.groupConfig) 
          ? activeCategory.groupConfig 
          : Object.values(activeCategory.groupConfig);

        const restoredGroups = configData.map(idList => 
          idList.map(pid => allPlayers.find(p => p.id === pid)).filter(Boolean)
        );
        setGroups(restoredGroups);
      } catch (err) {
        console.error("Greška pri učitavanju grupa:", err);
      }
    } else if (activeCategory?.format === 'groups_knockout') {
      // Inicijalizuj prazne grupe ako nema konfiguracije
      if (groups.length === 0) {
        setGroups([[], []]); // Podrazumijevano 2 grupe
      }
    } else {
      setGroups([]);
    }
  }, [selectedCategoryId, activeCategory?.groupConfig, allPlayers.length]);

  // Kada se promijeni kategorija, resetuj selekciju igrača na one koji su već u kategoriji
  useEffect(() => {
    if (selectedCategoryId && activeCategory) {
      setSelectedPlayers(activeCategory.playerIds || []);
    }
  }, [selectedCategoryId, activeCategory]);

  // Sinhronizacija ručnog poretka
  useEffect(() => {
    if (selectedCategoryId && id) {
      const q = collection(db, "competitions", id, "categories", selectedCategoryId, "manualOrders");
      const unsubscribe = onSnapshot(q, (snap) => {
        const orders = {};
        snap.docs.forEach(doc => {
          orders[doc.id] = doc.data().order || [];
        });
        setManualOrders(orders);
      });
      return () => unsubscribe();
    }
  }, [selectedCategoryId, id]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      await addDoc(collection(db, "competitions", id, "categories"), {
        name: newCategoryName.trim(),
        format: newCategoryFormat,
        status: 'draft',
        createdAt: serverTimestamp(),
        playerIds: []
      });
      setNewCategoryName('');
    } catch (err) {
      alert("Greška pri kreiranju kategorije.");
    }
  };

  const togglePlayerSelection = (playerId) => {
    if (activeCategory?.status !== 'draft') return;
    
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(pid => pid !== playerId) 
        : [...prev, playerId]
    );
  };

  const saveSelectedPlayers = async () => {
    if (!selectedCategoryId) return;
    try {
      const catRef = doc(db, "competitions", id, "categories", selectedCategoryId);
      await updateDoc(catRef, {
        playerIds: selectedPlayers,
        updatedAt: serverTimestamp()
      });
      alert("Lista igrača sačuvana.");
    } catch (err) {
      alert("Greška pri spašavanju igrača.");
    }
  };

  const handleUpdateSettings = async (winPts, lossPts, advancingPlayers = 2) => {
    if (!selectedCategoryId) return;
    try {
      const catRef = doc(db, "competitions", id, "categories", selectedCategoryId);
      await updateDoc(catRef, {
        winPoints: Number(winPts),
        lossPoints: Number(lossPts),
        advancingPlayers: Number(advancingPlayers),
        updatedAt: serverTimestamp()
      });
      alert("Postavke sačuvane.");
    } catch (err) {
      alert("Greška pri spašavanju postavki.");
    }
  };

  const handleToggleStage = async (stage, status) => {
    if (!selectedCategoryId) return;
    try {
      const catRef = doc(db, "competitions", id, "categories", selectedCategoryId);
      await updateDoc(catRef, {
        [`stages.${stage}.completed`]: status,
        updatedAt: serverTimestamp()
      });

      // Ako ponovo otvaramo grupe, automatski obriši knockout mečeve te kategorije
      if (stage === 'groups' && status === false) {
        const koMatches = matches.filter(m => m.isKnockout);
        if (koMatches.length > 0) {
          const batch = writeBatch(db);
          koMatches.forEach(m => {
            batch.delete(doc(db, "matches", m.id));
          });
          await batch.commit();
        }
      }
    } catch (err) {
      alert("Greška pri promjeni statusa faze.");
    }
  };

  const handleReturnToDraft = async () => {
    if (!selectedCategoryId) return;
    if (!window.confirm("PAŽNJA: Povratak u Draft će OBRISATI SVE MEČEVE i rezultate u ovoj kategoriji! Da li ste sigurni?")) return;
    
    setGenerating(true);
    try {
      const batch = writeBatch(db);
      
      // Obriši sve mečeve ove kategorije
      matches.forEach(m => {
        batch.delete(doc(db, "matches", m.id));
      });

      // Vrati status na draft
      const catRef = doc(db, "competitions", id, "categories", selectedCategoryId);
      batch.update(catRef, {
        status: 'draft',
        [`stages.groups.completed`]: false,
        [`stages.knockout.completed`]: false,
        updatedAt: serverTimestamp()
      });

      await batch.commit();
      alert("Kategorija vraćena u Draft. Svi mečevi su obrisani.");
    } catch (err) {
      console.error(err);
      alert("Greška pri resetovanju kategorije.");
    } finally {
      setGenerating(false);
    }
  };

  const handleResetKnockout = async () => {
    if (!selectedCategoryId) return;
    if (!window.confirm("Da li ste sigurni da želite obrisati sve mečeve u knockout fazi?")) return;
    
    setGenerating(true);
    try {
      const koMatches = matches.filter(m => m.isKnockout);
      if (koMatches.length > 0) {
        const batch = writeBatch(db);
        koMatches.forEach(m => {
          batch.delete(doc(db, "matches", m.id));
        });
        await batch.commit();
      }
      alert("Knockout faza je resetovana.");
    } catch (err) {
      console.error(err);
      alert("Greška pri brisanju knockout faze.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveManualOrder = async (groupIdx, orderedPlayerIds) => {
    if (!selectedCategoryId) return;
    try {
      const orderRef = doc(db, "competitions", id, "categories", selectedCategoryId, "manualOrders", groupIdx.toString());
      await setDoc(orderRef, {
        order: orderedPlayerIds,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error saving manual order:", err);
      alert("Greška pri spašavanju ručnog poretka.");
    }
  };

  const handleQuickAddPlayer = async (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    try {
      const playerRef = await addDoc(collection(db, "players"), {
        name: newPlayerName.trim(),
        club: newPlayerClub.trim(),
        organizationId: competition.organizationId,
        createdAt: new Date(),
        matchesPlayed: 0,
        wins: 0
      });
      
      // Automatski dodaj novog igrača u selekciju ove kategorije
      setSelectedPlayers(prev => [...prev, playerRef.id]);
      setAllPlayers(prev => [...prev, { id: playerRef.id, name: newPlayerName.trim(), club: newPlayerClub.trim() }]);
      
      setNewPlayerName('');
      setNewPlayerClub('');
      setShowAddPlayer(false);
    } catch (err) {
      alert("Greška pri dodavanju igrača.");
    }
  };

  const handleQuickBulkAdd = async (e) => {
    e.preventDefault();
    if (!bulkPlayerText.trim()) return;

    setGenerating(true);
    try {
      const batch = writeBatch(db);
      const entries = bulkPlayerText.split(/[;\n]/).filter(entry => entry.trim());
      const newIds = [];
      const newObjects = [];

      entries.forEach(entry => {
        const [pName, pClub] = entry.split(',').map(s => s.trim());
        if (pName) {
          const playerRef = doc(collection(db, "players"));
          const pData = {
            name: pName,
            club: pClub || '',
            organizationId: competition.organizationId,
            createdAt: new Date(),
            matchesPlayed: 0,
            wins: 0
          };
          batch.set(playerRef, pData);
          newIds.push(playerRef.id);
          newObjects.push({ id: playerRef.id, ...pData });
        }
      });

      await batch.commit();
      setSelectedPlayers(prev => [...prev, ...newIds]);
      setAllPlayers(prev => [...prev, ...newObjects]);
      setBulkPlayerText('');
      setShowAddPlayer(false);
      alert(`Dodano ${entries.length} novih igrača.`);
    } catch (err) {
      alert("Greška pri bulk dodavanju.");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateKnockout = async () => {
    if (!activeCategory || groups.length === 0) return;
    if (!window.confirm("Ovim ćete pobrisati postojeći žrijeb i rezultate eliminacija za ovu kategoriju. Nastaviti?")) return;
    
    setGenerating(true);
    try {
      // 0. Prvo obriši stare knockout mečeve za ovu kategoriju
      const oldMatchesQ = query(
        collection(db, "matches"),
        where("competitionId", "==", id),
        where("categoryId", "==", selectedCategoryId),
        where("isKnockout", "==", true)
      );
      const oldSnap = await getDocs(oldMatchesQ);
      
      const batch = writeBatch(db);
      oldSnap.forEach(d => batch.delete(d.ref));
      
      const advancingCount = activeCategory.advancingPlayers || 2;
      const allAdvancing = [];

      // 1. Prikupi pobjednike iz svih grupa
      groups.forEach((group, idx) => {
        const standings = calculateStandings(idx);
        const winners = standings.slice(0, advancingCount).map(p => ({
          ...p,
          fromGroup: String.fromCharCode(65 + idx),
          rank: standings.indexOf(p) + 1
        }));
        allAdvancing.push(...winners);
      });

      if (allAdvancing.length < 2) {
        alert("Nema dovoljno igrača za knockout fazu.");
        setGenerating(false);
        return;
      }

      // 2. Kreiraj mečeve
      const totalAdvancing = allAdvancing.length;
      let nextPowerOf2 = 1;
      while (nextPowerOf2 < totalAdvancing) nextPowerOf2 *= 2;
      
      const roundsCount = Math.log2(nextPowerOf2);
      const matchesInFirstRound = nextPowerOf2 / 2;
      
      // Definišemo runde i broj mečeva u svakoj
      const tournamentRounds = [];
      let currentMatchCount = matchesInFirstRound;
      
      for (let r = 1; r <= roundsCount; r++) {
        let name = `Runda ${r}`;
        if (currentMatchCount === 8) name = '1/8 Finale';
        if (currentMatchCount === 4) name = '1/4 Finale';
        if (currentMatchCount === 2) name = 'Polufinale';
        if (currentMatchCount === 1) name = 'Finale';
        
        tournamentRounds.push({
          round: r,
          count: currentMatchCount,
          name: name
        });
        currentMatchCount /= 2;
      }

      // Generišemo sve mečeve za sve runde
      tournamentRounds.forEach(r => {
        // Izračunaj parove tako da se gornji i donji dio žrijeba sreću tek u finalu
        // Za r=1, i=0 i i=1 idu u gornji dio, i=2 i i=3 u donji itd.
        for (let i = 0; i < r.count; i++) {
          const matchRef = doc(collection(db, "matches"));
          
          // Logika za gornji/donji dio (bracketSide)
          // Na nivou 1: pola mečeva je gornji/lijevi, pola donji/desni
          // U finalu (count=1) je centar
          let side = 'lijevi';
          if (r.count > 1) {
            side = i < (r.count / 2) ? 'lijevi' : 'desni';
          } else {
            side = 'center';
          }
          
          const matchData = {
            player1: { id: 'tbd', name: 'TBD' },
            player2: { id: 'tbd', name: 'TBD' },
            roundName: r.name,
            round: r.round,
            bracketIndex: i,
            bracketSide: side,
            isKnockout: true,
            status: 'pending',
            competitionId: id,
            categoryId: selectedCategoryId,
            createdAt: serverTimestamp()
          };

          // Popunjavamo samo prvu rundu sa igračima iz grupa
          if (r.round === 1) {
            // Specijalni seeding za 4 igrača (A1 vs B2, B1 vs A2)
            if (groups.length === 2 && advancingCount === 2) {
              if (i === 0) {
                matchData.player1 = allAdvancing.find(p => p.fromGroup === 'A' && p.rank === 1) || { id: 'tbd', name: 'TBD' };
                matchData.player2 = allAdvancing.find(p => p.fromGroup === 'B' && p.rank === 2) || { id: 'tbd', name: 'TBD' };
              } else {
                matchData.player1 = allAdvancing.find(p => p.fromGroup === 'B' && p.rank === 1) || { id: 'tbd', name: 'TBD' };
                matchData.player2 = allAdvancing.find(p => p.fromGroup === 'A' && p.rank === 2) || { id: 'tbd', name: 'TBD' };
              }
            } else {
              // Standardni seeding (1. vs zadnji, 2. vs predzadnji...)
              if (allAdvancing[i]) matchData.player1 = allAdvancing[i];
              const oppIdx = totalAdvancing - 1 - i;
              if (allAdvancing[oppIdx] && oppIdx > i) {
                matchData.player2 = allAdvancing[oppIdx];
              }
            }
          }
          
          batch.set(matchRef, matchData);
        }
      });

      await batch.commit();
      alert("Knockout žrijeb uspješno generisan!");
    } catch (err) {
      console.error(err);
      alert("Greška pri generisanju knockout žrijeba.");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateTemplate = async (count) => {
    if (!selectedCategoryId) return;
    if (!window.confirm("Ovim ćete pobrisati postojeći žrijeb i rezultate eliminacija za ovu kategoriju. Nastaviti?")) return;

    setGenerating(true);
    try {
      // 0. Prvo obriši stare knockout mečeve za ovu kategoriju
      const oldMatchesQ = query(
        collection(db, "matches"),
        where("competitionId", "==", id),
        where("categoryId", "==", selectedCategoryId),
        where("isKnockout", "==", true)
      );
      const oldSnap = await getDocs(oldMatchesQ);
      
      const batch = writeBatch(db);
      oldSnap.forEach(d => batch.delete(d.ref));
      
      const roundsCount = Math.log2(count);
      let currentMatchCount = count / 2;
      
      for (let r = 1; r <= roundsCount; r++) {
        let name = `Runda ${r}`;
        if (currentMatchCount === 32) name = '1/32 Finale';
        if (currentMatchCount === 16) name = '1/16 Finale';
        if (currentMatchCount === 8) name = '1/8 Finale';
        if (currentMatchCount === 4) name = '1/4 Finale';
        if (currentMatchCount === 2) name = 'Polufinale';
        if (currentMatchCount === 1) name = 'Finale';
        
        for (let i = 0; i < currentMatchCount; i++) {
          const matchRef = doc(collection(db, "matches"));
          const side = i < (currentMatchCount / 2) ? 'lijevi' : 'desni';
          
          batch.set(matchRef, {
            player1: { id: 'tbd', name: 'TBD' },
            player2: { id: 'tbd', name: 'TBD' },
            roundName: name,
            round: r,
            bracketIndex: i,
            bracketSide: currentMatchCount > 1 ? side : 'center',
            isKnockout: true,
            status: 'pending',
            competitionId: id,
            categoryId: selectedCategoryId,
            createdAt: serverTimestamp()
          });
        }
        currentMatchCount /= 2;
      }

      await batch.commit();
      alert("Prazan žrijeb generisan. Sada možete rasporediti igrače.");
    } catch (err) {
      console.error(err);
      alert("Greška pri generisanju šeme.");
    } finally {
      setGenerating(false);
    }
  };

  const handleAddManualMatch = async (matchData) => {
    if (!selectedCategoryId) return;
    try {
      await addDoc(collection(db, "matches"), {
        ...matchData,
        competitionId: id,
        categoryId: selectedCategoryId,
        status: 'pending',
        isKnockout: true,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      alert("Greška pri dodavanju meča.");
    }
  };

  const handleUpdateMatchPlayer = async (matchId, playerSlot, playerData) => {
    if (!matchId) return;
    try {
      const matchRef = doc(db, "matches", matchId);
      const updateKey = (playerSlot === 1 || playerSlot === '1') ? "player1" : 
                        (playerSlot === 2 || playerSlot === '2') ? "player2" : 
                        playerSlot;

      await updateDoc(matchRef, {
        [updateKey]: {
          id: playerData.id,
          name: playerData.name
        },
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Match Update Error:", err);
      alert("Greška pri ažuriranju igrača u meču: " + err.message);
    }
  };

  const handleGenerateMatches = async () => {
    if (selectedPlayers.length < 2) {
      alert("Morate izabrati barem 2 igrača.");
      return;
    }

    setGenerating(true);
    try {
      const batch = writeBatch(db);
      
      if (activeCategory.format === 'groups_knockout') {
        // GENERISANJE PO GRUPAMA
        if (groups.length === 0) {
          alert("Prvo morate kreirati grupe.");
          setGenerating(false);
          return;
        }

        groups.forEach((groupPlayers, groupIdx) => {
          const groupRounds = generateBergerMatches(groupPlayers);
          groupRounds.forEach(round => {
            round.matches.forEach(match => {
              const matchRef = doc(collection(db, "matches"));
              batch.set(matchRef, {
                ...match,
                competitionId: id,
                categoryId: selectedCategoryId,
                groupId: groupIdx, // Dodajemo ID grupe
                groupName: `Grupa ${String.fromCharCode(65 + groupIdx)}`,
                organizationId: userData.organizationId,
                createdAt: serverTimestamp()
              });
            });
          });
        });
      } else {
        // STANDARDNI ROUND ROBIN
        const participants = allPlayers.filter(p => selectedPlayers.includes(p.id));
        const rounds = generateBergerMatches(participants);

        rounds.forEach(round => {
          round.matches.forEach(match => {
            const matchRef = doc(collection(db, "matches"));
            batch.set(matchRef, {
              ...match,
              competitionId: id,
              categoryId: selectedCategoryId,
              organizationId: userData.organizationId,
              createdAt: serverTimestamp()
            });
          });
        });
      }

      // 2. Ažuriraj kategoriju
      const catRef = doc(db, "competitions", id, "categories", selectedCategoryId);
      
      // Firestore ne dozvoljava ugniježdene nizove (arrays within arrays).
      // Pretvaramo grupe u objekat/mapu gdje su ključevi indeksi grupa.
      const groupConfigObj = {};
      if (activeCategory.format === 'groups_knockout') {
        groups.forEach((g, idx) => {
          groupConfigObj[idx] = g.map(p => p.id);
        });
      }

      batch.update(catRef, {
        status: 'active',
        playerIds: selectedPlayers,
        groupConfig: activeCategory.format === 'groups_knockout' ? groupConfigObj : null,
        updatedAt: serverTimestamp()
      });

      await batch.commit();
      setActiveTab('matches');
      alert("Raspored za kategoriju uspješno generisan!");
    } catch (err) {
      console.error(err);
      alert("Greška pri generisanju mečeva.");
    } finally {
      setGenerating(false);
    }
  };

  const handleScoreChange = (matchId, playerKey, val) => {
    setMatches(prev => prev.map(m => 
      m.id === matchId 
        ? { ...m, [playerKey + 'Score']: parseInt(val) || 0 }
        : m
    ));
  };

  const saveMatchResult = async (match) => {
    setSavingMatchId(match.id);
    try {
      const matchRef = doc(db, "matches", match.id);
      
      // 1. Spasi trenutni meč
      await updateDoc(matchRef, {
        player1Score: match.player1Score || 0,
        player2Score: match.player2Score || 0,
        sets: match.sets || [],
        status: 'completed',
        updatedAt: serverTimestamp()
      });

      // 2. AUTOMATSKO NAPREDOVANJE
      if (match.isKnockout && match.roundName !== 'Finale') {
        const s1 = Number(match.player1Score || 0);
        const s2 = Number(match.player2Score || 0);
        
        if (s1 === s2) {
          console.log("Neriješen rezultat, preskačem automatsko napredovanje.");
          return;
        }

        const winner = s1 > s2 ? match.player1 : match.player2;
        
        if (winner && winner.id && winner.id !== 'tbd') {
          const currentRound = Number(match.round);
          const currentIndex = Number(match.bracketIndex ?? 0);
          
          const nextRound = currentRound + 1;
          
          // Formula koja osigurava da pobjednici iz gornjeg dijela (lijevi) ostaju u gornjem, 
          // a iz donjeg (desni) u donjem dijelu žrijeba.
          const nextIndex = Math.floor(currentIndex / 2);
          const nextSlot = (currentIndex % 2 === 0) ? 'player1' : 'player2';

          // Nađi meč u idućoj rundi - otpornija pretraga
          const nextMatch = matches.find(m => 
            m.isKnockout && 
            Number(m.round) === nextRound && 
            Number(m.bracketIndex ?? 0) === nextIndex
          );

          if (nextMatch) {
            const nextMatchRef = doc(db, "matches", nextMatch.id);
            const winnerData = { id: winner.id, name: winner.name };
            
            await updateDoc(nextMatchRef, {
              [nextSlot]: winnerData,
              updatedAt: serverTimestamp()
            });

            // Odmah ažuriraj lokalni prikaz bez čekanja baze
            setMatches(prev => prev.map(m => {
              if (m.id === nextMatch.id) {
                return { ...m, [nextSlot]: winnerData };
              }
              return m;
            }));
          } else {
            console.log("Nije pronađen naredni meč za round:", nextRound, "indeks:", nextIndex);
          }
        }
      }

      alert("Rezultat sačuvan! Pobjednik je prošao dalje.");
    } catch (err) {
      console.error(err);
      alert("Greška pri spašavanju rezultata.");
    } finally {
      setSavingMatchId(null);
    }
  };

  const handleUpdateFormat = async (newFormat) => {
    if (!selectedCategoryId) return;
    try {
      const catRef = doc(db, "competitions", id, "categories", selectedCategoryId);
      await updateDoc(catRef, {
        format: newFormat,
        updatedAt: serverTimestamp()
      });
      setEditingFormat(false);
      // Resetuj grupe ako prelazimo na format bez grupa
      if (newFormat !== 'groups_knockout') setGroups([]);
    } catch (err) {
      alert("Greška pri ažuriranju formata.");
    }
  };

  const movePlayerToGroup = (playerId, targetGroupIdx) => {
    setGroups(prev => {
      // 1. Ukloni igrača iz svih trenutnih grupa
      const newGroups = prev.map(g => g.filter(p => p.id !== playerId));
      
      // 2. Pronađi igrača
      const player = allPlayers.find(p => p.id === playerId);
      if (player) {
        // 3. Dodaj ga u ciljanu grupu
        newGroups[targetGroupIdx].push(player);
        
        // 4. Auto-selekcija ako nije bio selektovan
        if (!selectedPlayers.includes(playerId)) {
          setSelectedPlayers(prevS => [...prevS, playerId]);
        }
      }
      return newGroups;
    });
  };

  const removePlayerFromGroups = (playerId) => {
    setGroups(prev => prev.map(g => g.filter(p => p.id !== playerId)));
  };

  const handleAutoAssignGroups = () => {
    if (!activeCategory || groups.length === 0) return;
    
    // Uzmi sve selektovane igrače za ovu kategoriju
    const playersToAssign = allPlayers.filter(p => selectedPlayers.includes(p.id));
    
    if (playersToAssign.length === 0) {
      alert("Prvo izaberite igrače u tabu 'Igrači'.");
      return;
    }

    // Shuffle players
    const shuffled = [...playersToAssign].sort(() => Math.random() - 0.5);
    
    // Rasporedi u grupe
    const newGroups = groups.map(() => []);
    shuffled.forEach((player, index) => {
      const groupIndex = index % groups.length;
      newGroups[groupIndex].push(player);
    });
    
    setGroups(newGroups);
  };

  const calculateStandings = (groupIdx) => {
    const groupMatches = matches.filter(m => m.groupId === groupIdx && m.status === 'completed');
    const groupPlayers = groups[groupIdx] || [];
    
    const stats = groupPlayers.map(player => ({
      ...player,
      played: 0,
      won: 0,
      lost: 0,
      setsWon: 0,
      setsLost: 0,
      points: 0,
      pointDiff: 0 // "Gem±"
    }));

    groupMatches.forEach(m => {
      const p1 = stats.find(p => p.id === m.player1.id);
      const p2 = stats.find(p => p.id === m.player2.id);

      const winPts = activeCategory?.winPoints ?? 2;
      const lossPts = activeCategory?.lossPoints ?? 0;

      if (p1 && p2) {
        p1.played++;
        p2.played++;
        p1.setsWon += (m.player1Score || 0);
        p1.setsLost += (m.player2Score || 0);
        p2.setsWon += (m.player2Score || 0);
        p2.setsLost += (m.player1Score || 0);

        // Izračunaj poene (Gem±) iz setova
        if (m.sets && m.sets.length > 0) {
          m.sets.forEach(s => {
            p1.pointDiff += (s.p1 || 0) - (s.p2 || 0);
            p2.pointDiff += (s.p2 || 0) - (s.p1 || 0);
          });
        }

        if (m.player1Score > m.player2Score) {
          p1.won++;
          p1.points += winPts;
          p2.lost++;
          p2.points += lossPts;
        } else if (m.player2Score > m.player1Score) {
          p2.won++;
          p2.points += winPts;
          p1.lost++;
          p1.points += lossPts;
        }
      }
    });

    // Ako postoji ručni poredak za ovu grupu, koristi ga
    if (manualOrders[groupIdx] && manualOrders[groupIdx].length > 0) {
      const order = manualOrders[groupIdx];
      return stats.sort((a, b) => {
        const idxA = order.indexOf(a.id);
        const idxB = order.indexOf(b.id);
        
        // Ako su oba u nizu za poredak, sortiraj po indeksu
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        
        // Ako je samo jedan u nizu (ne bi se trebalo desiti), stavi ga ispred
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        
        return 0;
      });
    }

    return stats.sort((a, b) => {
      // 1. Poeni (Win/Loss)
      if (b.points !== a.points) return b.points - a.points;
      
      // 2. Set razlika (setsWon - setsLost)
      const aSetDiff = a.setsWon - a.setsLost;
      const bSetDiff = b.setsWon - b.setsLost;
      if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;

      // 3. Poen razlika (Gem±)
      if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;

      // 4. Ukupno dobijenih setova
      if (b.setsWon !== a.setsWon) return b.setsWon - a.setsWon;

      // 5. Ukupno dobijenih mečeva
      if (b.won !== a.won) return b.won - a.won;

      return 0;
    });
  };

  const handleUpdateCompetition = async () => {
    if (!compName.trim()) return;
    setSavingComp(true);
    try {
      const slugVal = compSlug.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
      await updateDoc(doc(db, "competitions", id), {
        name: compName.trim(),
        slug: slugVal,
        collaborators: collaborators,
        updatedAt: serverTimestamp()
      });
      setCompetition(prev => ({ 
        ...prev, 
        name: compName.trim(), 
        slug: slugVal,
        collaborators: collaborators 
      }));
      setShowCompSettings(false);
      alert("Takmičenje ažurirano!");
    } catch (err) {
      alert("Greška pri ažuriranju takmičenja.");
    } finally {
      setSavingComp(false);
    }
  };

  const activeCategoryId = selectedCategoryId;
  const assignedPlayerIds = groups.flat().map(p => p.id);

  if (loading) return <DashboardLayout title="Učitavanje..."><div className="p-8">Dohvaćam podatke...</div></DashboardLayout>;
  if (!competition) return <DashboardLayout title="Greška"><div className="p-8 text-red-500 text-lg">Takmičenje nije pronađeno.</div></DashboardLayout>;

  return (
    <DashboardLayout title={competition.name}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GlobalMatchSearch 
          matchSearchQuery={matchSearchQuery}
          setMatchSearchQuery={setMatchSearchQuery}
          filteredGlobalMatches={filteredGlobalMatches}
          categories={categories}
          setEditingMatch={setEditingMatch}
          setShowMatchModal={setShowMatchModal}
        />

        <CompetitionHeader 
          competition={competition}
          setShowCompSettings={setShowCompSettings}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          categoriesLoading={categoriesLoading}
          activeCategory={activeCategory}
          categories={categories}
        />

        {activeTab === 'categories' && (
          <CategoriesTab 
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
            setActiveTab={setActiveTab}
            newCategoryName={newCategoryName}
            setNewCategoryName={setNewCategoryName}
            newCategoryFormat={newCategoryFormat}
            setNewCategoryFormat={setNewCategoryFormat}
            handleAddCategory={handleAddCategory}
            competitionSlug={competition?.slug}
          />
        )}

        {activeTab === 'players' && activeCategory && (
          <PlayersTab 
            activeCategory={activeCategory}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            showOnlySelected={showOnlySelected}
            setShowOnlySelected={setShowOnlySelected}
            allPlayers={allPlayers}
            selectedPlayers={selectedPlayers}
            togglePlayerSelection={togglePlayerSelection}
            assignedPlayerIds={assignedPlayerIds}
            saveSelectedPlayers={saveSelectedPlayers}
            setShowAddPlayer={setShowAddPlayer}
          />
        )}

        {activeTab === 'matches' && (
          <MatchesTab 
            activeCategory={activeCategory}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            allPlayers={allPlayers}
            showOnlySelected={showOnlySelected}
            selectedPlayers={selectedPlayers}
            assignedPlayerIds={assignedPlayerIds}
            groups={groups}
            setGroups={setGroups}
            handleGenerateMatches={handleGenerateMatches}
            generating={generating}
            calculateStandings={calculateStandings}
            matches={matches}
            movePlayerToGroup={movePlayerToGroup}
            removePlayerFromGroups={removePlayerFromGroups}
            setEditingMatch={setEditingMatch}
            setShowMatchModal={setShowMatchModal}
            saveMatchResult={saveMatchResult}
            savingMatchId={savingMatchId}
            handleScoreChange={handleScoreChange}
            handleSaveManualOrder={handleSaveManualOrder}
            handleToggleStage={handleToggleStage}
            handleReturnToDraft={handleReturnToDraft}
            handleAutoAssignGroups={handleAutoAssignGroups}
          />
        )}

        {activeTab === 'knockout' && (
          <div className="min-h-[500px]">
            {!activeCategory ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-12 text-center backdrop-blur-xl">
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">Kategorija nije pronađena</h3>
                <button 
                  onClick={() => setActiveTab('categories')} 
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase"
                >
                  Nazad na kategorije
                </button>
              </div>
            ) : (
              <KnockoutTab 
                activeCategory={activeCategory}
                matches={matches}
                groups={groups}
                allPlayers={allPlayers}
                calculateStandings={calculateStandings}
                setEditingMatch={setEditingMatch}
                setShowMatchModal={setShowMatchModal}
                handleToggleStage={handleToggleStage}
                handleGenerateKnockout={handleGenerateKnockout}
                handleResetKnockout={handleResetKnockout}
                handleUpdateMatchPlayer={handleUpdateMatchPlayer}
                handleAddManualMatch={handleAddManualMatch}
                handleGenerateTemplate={handleGenerateTemplate}
                generating={generating}
              />
            )}
          </div>
        )}

        {activeTab === 'settings' && activeCategory && (
            <SettingsTab 
              activeCategory={activeCategory}
              handleUpdateSettings={handleUpdateSettings}
              handleToggleStage={handleToggleStage}
            />
        )}
      </div>

      <MatchUpdateModal 
        showMatchModal={showMatchModal}
        editingMatch={editingMatch}
        setEditingMatch={setEditingMatch}
        setShowMatchModal={setShowMatchModal}
        saveMatchResult={saveMatchResult}
      />

      <CompetitionSettingsModal 
        showCompSettings={showCompSettings}
        setShowCompSettings={setShowCompSettings}
        compName={compName}
        setCompName={setCompName}
        compSlug={compSlug}
        setCompSlug={setCompSlug}
        collaborators={collaborators}
        setCollaborators={setCollaborators}
        competition={competition}
        handleUpdateCompetition={handleUpdateCompetition}
        savingComp={savingComp}
      />
    </DashboardLayout>
  );
};

export default CompetitionDetails;
