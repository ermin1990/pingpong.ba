import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, setDoc, addDoc, serverTimestamp, writeBatch, onSnapshot, deleteDoc, limit, orderBy } from 'firebase/firestore';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  Users, Trophy, Play, CheckCircle, Clock, Save, Plus, Layers, 
  ChevronRight, ChevronDown, LayoutGrid, FileText, Info, UserPlus, Search, 
  Target, Settings2, PlayCircle, Zap, X, AlertTriangle, Edit2, Code, List
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
import AllMatchesTab from '../components/competition/AllMatchesTab';
import AllPlayersTab from '../components/competition/AllPlayersTab';
import RefereesTab from '../components/competition/RefereesTab';
import TablesTab from '../components/competition/TablesTab';
import DoublesManager from '../components/competition/DoublesManager';
import CompetitionExport from '../components/competition/CompetitionExport';
import { useCompetitionData } from '../hooks/useCompetitionData';
import { useReferees } from '../hooks/useReferees';
import PlayerAddModal from '../components/competition/PlayerAddModal';

const CompetitionDetails = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userData, planDetails, isSuperAdmin } = useAuth();
  
  // Custom Hooks
  const { 
    competition: dbCompetition, 
    categories: dbCategories, 
    matches: dbMatches, 
    loading: dbLoading 
  } = useCompetitionData(id);

  const { referees: dbReferees } = useReferees(id);

  // Sync state with hooks
  useEffect(() => {
    if (dbCompetition) {
      setCompetition(dbCompetition);
      // Sync all other detail states here...
      setCompName(dbCompetition.name || '');
      setCompSlug(dbCompetition.slug || '');
      setCompStartDate(dbCompetition.startDate || '');
      setCompEndDate(dbCompetition.endDate || '');
      setCompLocation(dbCompetition.location || '');
      setCompDescription(dbCompetition.description || '');
      setCompRules(dbCompetition.rules || '');
      setCompContactPhone(dbCompetition.contact?.phone || '');
      setCompContactEmail(dbCompetition.contact?.email || '');
      setCompContactAddress(dbCompetition.contact?.address || '');
      setCompOrganizer(dbCompetition.organizer || '');
      setCompDirector(dbCompetition.director || '');
      setCompReferee(dbCompetition.referee || '');
      setCompEntryFee(dbCompetition.entryFee || '');
      setCompPrizes(dbCompetition.prizes || '');
      setCompSchedule(dbCompetition.schedule || '');
      setRegIsOpen(dbCompetition.registration?.isOpen || false);
      setRegLink(dbCompetition.registration?.link || '');
      setRegDeadline(dbCompetition.registration?.deadline || '');
      setCompSetsToWin(dbCompetition.defaultSettings?.setsToWin || 2);
      setCompWinPoints(dbCompetition.defaultSettings?.winPoints || 2);
      setCompLossPoints(dbCompetition.defaultSettings?.lossPoints || 0);
      setCompAdvancingPlayers(dbCompetition.defaultSettings?.advancingPlayers || 2);
      setCollaborators(dbCompetition.collaborators || []);
      setIsPublic(dbCompetition.isPublic || false);
    }
    if (dbCategories.length > 0) setCategories(dbCategories);
    if (dbMatches.length > 0) setMatches(dbMatches);
    if (dbReferees) setReferees(dbReferees);
    setLoading(dbLoading);
  }, [dbCompetition, dbCategories, dbMatches, dbReferees, dbLoading]);

  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allPlayers, setAllPlayers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  
  // URL state management
  const selectedCategoryId = searchParams.get('category') || '';
  const activeTab = searchParams.get('tab') || 'categories';

  const setSelectedCategoryId = (newId) => {
    const newParams = new URLSearchParams(searchParams);
    if (newId) {
      newParams.set('category', newId);
      
      // Determine target tab based on category state
      if (activeTab === 'categories') {
        const targetCategory = categories.find(c => c.id === newId);
        // If there are players, we might go to matches, otherwise go to players tab to add some
        if (targetCategory && targetCategory.playerIds && targetCategory.playerIds.length > 0) {
           newParams.set('tab', 'matches');
        } else {
           newParams.set('tab', 'players');
        }
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
  const [seededPlayers, setSeededPlayers] = useState([]);
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
  const [newCategoryType, setNewCategoryType] = useState('singles'); // 'singles' | 'doubles'
  const [editingFormat, setEditingFormat] = useState(false);
  const [showOnlySelected, setShowOnlySelected] = useState(true);
  const [editingMatch, setEditingMatch] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [allMatchesForSearch, setAllMatchesForSearch] = useState([]);
  const [matchSearchQuery, setMatchSearchQuery] = useState('');
  const [searchTableId, setSearchTableId] = useState('');
  
  const [compName, setCompName] = useState('');
  const [compSlug, setCompSlug] = useState('');
  const [compStartDate, setCompStartDate] = useState('');
  const [compEndDate, setCompEndDate] = useState('');
  const [compLocation, setCompLocation] = useState('');
  const [compDescription, setCompDescription] = useState('');
  const [compRules, setCompRules] = useState('');
  const [compContactPhone, setCompContactPhone] = useState('');
  const [compContactEmail, setCompContactEmail] = useState('');
  const [compContactAddress, setCompContactAddress] = useState('');
  const [compOrganizer, setCompOrganizer] = useState('');
  const [compDirector, setCompDirector] = useState('');
  const [compReferee, setCompReferee] = useState('');
  const [compEntryFee, setCompEntryFee] = useState('');
  const [compPrizes, setCompPrizes] = useState('');
  const [compSchedule, setCompSchedule] = useState('');
  const [regIsOpen, setRegIsOpen] = useState(false);
  const [regLink, setRegLink] = useState('');
  const [regDeadline, setRegDeadline] = useState('');
  const [compSetsToWin, setCompSetsToWin] = useState(2);
  const [compWinPoints, setCompWinPoints] = useState(2);
  const [compLossPoints, setCompLossPoints] = useState(0);
  const [compAdvancingPlayers, setCompAdvancingPlayers] = useState(2);
  const [collaborators, setCollaborators] = useState([]);
  const [isPublic, setIsPublic] = useState(false);
  const [savingComp, setSavingComp] = useState(false);
  const [referees, setReferees] = useState([]);
  
  // Grouping state
  const [groups, setGroups] = useState([]); // Array of arrays of player objects
  const [groupTabs, setGroupTabs] = useState({}); // { groupIdx: 'players' | 'table' | 'matches' }
  const [manualOrders, setManualOrders] = useState({}); // Ručni poredak igrača po grupama
  const lastCategoryIdRef = useRef('');

  // State za uređivanje igrača
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editPlayerName, setEditPlayerName] = useState('');
  const [editPlayerClub, setEditPlayerClub] = useState('');
  const [updatingPlayer, setUpdatingPlayer] = useState(false);

  const getSortedKnockoutRoundKeys = (knockoutMatches) => {
    const roundMap = {};

    knockoutMatches.forEach((match) => {
      const key = match.roundName || `Runda ${match.round}`;
      if (!roundMap[key]) roundMap[key] = [];
      roundMap[key].push(match);
    });

    return Object.keys(roundMap).sort((a, b) => {
      const getRoundWeight = (name) => {
        const sample = roundMap[name]?.[0];
        const numericRound = Number(sample?.round);

        if (!Number.isNaN(numericRound)) return numericRound;
        if (name.includes('Baraž')) return 0;
        if (name.includes('1/32')) return 1;
        if (name.includes('1/16')) return 2;
        if (name.includes('1/8')) return 3;
        if (name.includes('1/4')) return 4;
        if (name.includes('Polufinale')) return 5;
        if (name.includes('Finale') && !name.includes('1/')) return 6;

        const fallback = name.match(/\d+/);
        return fallback ? Number(fallback[0]) : 999;
      };

      return getRoundWeight(a) - getRoundWeight(b);
    });
  };

  const findNextKnockoutSlot = (allMatches, currentMatch) => {
    const knockoutOnly = allMatches.filter((match) => match.isKnockout);
    const currentIndex = Number(currentMatch?.bracketIndex ?? 0);
    const nextIndex = Math.floor(currentIndex / 2);
    const nextSlot = currentIndex % 2 === 0 ? 'player1' : 'player2';
    const currentRound = Number(currentMatch?.round);

    if (!Number.isNaN(currentRound)) {
      const numericNext = knockoutOnly.find(
        (match) => Number(match.round) === currentRound + 1 && Number(match.bracketIndex ?? 0) === nextIndex
      );

      if (numericNext) {
        return { nextMatch: numericNext, nextSlot };
      }
    }

    const roundKeys = getSortedKnockoutRoundKeys(knockoutOnly);
    const currentRoundKey = currentMatch?.roundName || `Runda ${currentMatch?.round}`;
    const currentRoundIdx = roundKeys.findIndex((key) => key === currentRoundKey);

    if (currentRoundIdx === -1 || currentRoundIdx >= roundKeys.length - 1) {
      return { nextMatch: null, nextSlot };
    }

    const nextRoundKey = roundKeys[currentRoundIdx + 1];
    const namedNext = knockoutOnly.find(
      (match) => (match.roundName || `Runda ${match.round}`) === nextRoundKey && Number(match.bracketIndex ?? 0) === nextIndex
    );

    return { nextMatch: namedNext || null, nextSlot };
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !userData || !user) return;

      try {
        // 1. Dohvati detalje takmičenja
        const compRef = doc(db, "competitions", id);
        const compSnap = await getDoc(compRef);
        
        if (compSnap.exists()) {
          const compData = { id: compSnap.id, ...compSnap.data() };
          setCompetition(compData);
          setCompName(compData.name || '');
          setCompSlug(compData.slug || '');
          setCompStartDate(compData.startDate || '');
          setCompEndDate(compData.endDate || '');
          setCompLocation(compData.location || '');
          setCompDescription(compData.description || '');
          setCompRules(compData.rules || '');
          setCompContactPhone(compData.contact?.phone || '');
          setCompContactEmail(compData.contact?.email || '');
          setCompContactAddress(compData.contact?.address || '');
          setCompOrganizer(compData.organizer || '');
          setCompDirector(compData.director || '');
          setCompReferee(compData.referee || '');
          setCompEntryFee(compData.entryFee || '');
          setCompPrizes(compData.prizes || '');
          setCompSchedule(compData.schedule || '');
          setRegIsOpen(compData.registration?.isOpen || false);
          setRegLink(compData.registration?.link || '');
          setRegDeadline(compData.registration?.deadline || '');
          setCompSetsToWin(compData.defaultSettings?.setsToWin || 2);
          setCompWinPoints(compData.defaultSettings?.winPoints || 2);
          setCompLossPoints(compData.defaultSettings?.lossPoints || 0);
          setCompAdvancingPlayers(compData.defaultSettings?.advancingPlayers || 2);
          setCollaborators(compData.collaborators || []);
          setIsPublic(compData.isPublic || false);
          
          // Set default category format based on competition type
          if (compData.type === 'Groups') {
            setNewCategoryFormat('groups_knockout');
          } else if (compData.type === 'Knockout') {
             // Ako je čisti knockout, možemo defaultati na groups_knockout jer često imaju grupe prije, 
             // ili ako dodamo clean knockout opciju kasnije. Za sada neka bude groups_knockout jer je bliže tome.
             // Ali zapravo, trenutni select ima samo 'round_robin' i 'groups_knockout'.
             setNewCategoryFormat('groups_knockout'); 
          }
          
          // 2. Dohvati igrače
          let playersQ;
          const isCollaborator = compData.collaborators?.includes(user.email);
          const isOwner = compData.ownerUid === user.uid;
          const userIsSuperAdmin = userData.role === 'super_admin';

          if (userIsSuperAdmin) {
            playersQ = query(collection(db, "players"));
          } else if (isOwner || isCollaborator) {
            playersQ = query(
              collection(db, "players"), 
              where("ownerUid", "==", compData.ownerUid)
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

  // Globalni listener za sve mečeve (za search) - Limitiran na 50 najnovijih
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
    // Ako nema ni upita ni filtera za stol, ne prikazujemo ništa (da ne zakrčimo ekran svim mečevima)
    if (!matchSearchQuery.trim() && !searchTableId) return [];
    
    const lower = matchSearchQuery.toLowerCase();
    
    return allMatchesForSearch.filter(m => {
      // Provjera imena (ako je uneseno)
      const nameMatch = !matchSearchQuery.trim() || 
        m.player1?.name?.toLowerCase().includes(lower) || 
        m.player2?.name?.toLowerCase().includes(lower);
        
      // Provjera stola (ako je odabran)
      const tableMatch = !searchTableId || m.tableId === searchTableId;
      
      return nameMatch && tableMatch;
    }).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [allMatchesForSearch, matchSearchQuery, searchTableId]);

  // Sinhronizacija grupa iz baze ili inicijalizacija
  useEffect(() => {
    if (activeCategory?.groupConfig && allPlayers.length > 0) {
      try {
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
      if (groups.length === 0) {
         // Respect plan limits for initial groups count
         let initialGroupsCount = 2;
         if (!isSuperAdmin && planDetails && planDetails.groupsLimit) {
            if (planDetails.groupsLimit < 2) initialGroupsCount = planDetails.groupsLimit;
         }
         // Ensure we create distinct arrays for each group
         setGroups(Array.from({ length: initialGroupsCount }, () => []));
      }
    } else if (activeCategory?.format === 'round_robin') {
      // Za ligu (Round Robin) - u draftu automatski sinhronizuj sve selektovane igrače u jednu grupu
      if (activeCategory.status === 'draft') {
        const participants = allPlayers.filter(p => selectedPlayers.includes(p.id));
        setGroups([participants]);
      } else {
        if (groups.length === 0) setGroups([[]]);
      }
    } else {
      if (groups.length > 0) setGroups([]);
    }
  }, [selectedCategoryId, activeCategory?.groupConfig, activeCategory?.format, allPlayers.length, activeCategory?.status, (activeCategory?.format === 'round_robin' && activeCategory.status === 'draft' ? selectedPlayers.length : null)]);

  // Kada se promijeni kategorija, resetuj selekciju igrača na one koji su već u kategoriji
  useEffect(() => {
    if (selectedCategoryId && activeCategory) {
      // Only reset the local state if specifically switching to a NEW category
      if (lastCategoryIdRef.current !== selectedCategoryId) {
        setSelectedPlayers(activeCategory.playerIds || []);
        setSeededPlayers(activeCategory.seededPlayerIds || []);
        lastCategoryIdRef.current = selectedCategoryId;
      }
    } else if (!selectedCategoryId) {
      lastCategoryIdRef.current = '';
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
      console.log("Dodajem kategoriju u takmičenje:", id);
      const catData = {
        name: newCategoryName.trim(),
        format: newCategoryFormat,
        type: newCategoryType,
        status: 'draft',
        ownerUid: competition?.ownerUid || null,
        createdAt: serverTimestamp(),
        playerIds: [],
        seededPlayerIds: [],
        advancingPlayers: competition?.defaultSettings?.advancingPlayers ?? 2,
        setsToWin: competition?.defaultSettings?.setsToWin ?? 2,
        winPoints: competition?.defaultSettings?.winPoints ?? 2,
        lossPoints: competition?.defaultSettings?.lossPoints ?? 0
      };

      await addDoc(collection(db, "competitions", id, "categories"), catData);
      setNewCategoryName('');
      setNewCategoryType('singles');
      console.log("Kategorija uspješno dodana");
    } catch (err) {
      console.error("Greška pri kreiranju kategorije:", err);
      alert(`Greška pri kreiranju kategorije: ${err.message}`);
    }
  };

  const togglePlayerSelection = async (playerId) => {
    if (activeCategory?.status !== 'draft') return;

    let newSelected;
    let newSeeding = seededPlayers;
    // Check if adding a player (not removing)
    if (!selectedPlayers.includes(playerId)) {
      if (!isSuperAdmin && planDetails?.playersLimit) {
         if (selectedPlayers.length >= planDetails.playersLimit) {
            alert(`Vaš plan dozvoljava maksimalno ${planDetails.playersLimit} igrača po kategoriji.`);
            return;
         }
      }
      newSelected = [...selectedPlayers, playerId];
    } else {
      newSelected = selectedPlayers.filter(pid => pid !== playerId);
      newSeeding = seededPlayers.filter(pid => pid !== playerId);
    }
    
    setSelectedPlayers(newSelected);
    if (newSeeding !== seededPlayers) {
      setSeededPlayers(newSeeding);
    }

    // Auto-save to Firestore
    try {
      const catRef = doc(db, "competitions", id, "categories", selectedCategoryId);
      await updateDoc(catRef, {
        playerIds: newSelected,
        seededPlayerIds: newSeeding,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Greška pri spašavanju selekcije:", err);
    }
  };

  const togglePlayerSeed = async (playerId) => {
    if (activeCategory?.status !== 'draft') return;
    if (!selectedPlayers.includes(playerId)) return;
    
    const newSeeding = seededPlayers.includes(playerId) 
      ? seededPlayers.filter(pid => pid !== playerId) 
      : [...seededPlayers, playerId];
      
    setSeededPlayers(newSeeding);

    // Auto-save to Firestore
    try {
      const catRef = doc(db, "competitions", id, "categories", selectedCategoryId);
      await updateDoc(catRef, {
        seededPlayerIds: newSeeding,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Greška pri spašavanju nosioca:", err);
    }
  };

  const startEditingPlayer = (player) => {
    setEditingPlayer(player);
    setEditPlayerName(player.name || '');
    setEditPlayerClub(player.club || '');
  };

  const handleUpdatePlayer = async (e) => {
    e.preventDefault();
    if (!editingPlayer || !editPlayerName.trim()) return;

    setUpdatingPlayer(true);
    try {
      const playerRef = doc(db, "players", editingPlayer.id);
      await updateDoc(playerRef, {
        name: editPlayerName.trim(),
        club: editPlayerClub.trim(),
        updatedAt: serverTimestamp()
      });

      // Update local state
      setAllPlayers(prev => prev.map(p => 
        p.id === editingPlayer.id 
          ? { ...p, name: editPlayerName.trim(), club: editPlayerClub.trim() } 
          : p
      ));

      setEditingPlayer(null);
      alert("Igrač uspešno ažuriran!");
    } catch (err) {
      console.error("Greška pri ažuriranju igrača:", err);
      alert("Greška pri ažuriranju igrača.");
    } finally {
      setUpdatingPlayer(false);
    }
  };

  const saveSelectedPlayers = async () => {
    if (!selectedCategoryId) return;
    try {
      const catRef = doc(db, "competitions", id, "categories", selectedCategoryId);
      await updateDoc(catRef, {
        playerIds: selectedPlayers,
        seededPlayerIds: seededPlayers,
        updatedAt: serverTimestamp()
      });
      // Maknut alert za spašavanje igrača
    } catch (err) {
      alert("Greška pri spašavanju igrača.");
    }
  };

  const handleUpdateSettings = async (settings) => {
    if (!selectedCategoryId) return;
    try {
      const { winPoints, lossPoints, advancingPlayers, setsToWin, type } = settings;
      const catRef = doc(db, "competitions", id, "categories", selectedCategoryId);
      
      const updateData = {
        winPoints: Number(winPoints),
        lossPoints: Number(lossPoints),
        advancingPlayers: Number(advancingPlayers),
        setsToWin: Number(setsToWin || 2),
        updatedAt: serverTimestamp()
      };

      if (type) {
        updateData.type = type;
      }

      await updateDoc(catRef, updateData);
      // Maknut alert za postavke
    } catch (err) {
      console.error("Greška pri spašavanju postavki:", err);
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
      window.location.reload();
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
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Greška pri brisanju knockout faze.");
    } finally {
      setGenerating(false);
    }
  };

  const handleClearCategory = async () => {
    if (!selectedCategoryId) return;
    
    const confirmMessage = 
      "PAŽNJA: Ova akcija će OČISTITI kategoriju:\n\n" +
      "1. ✓ Obrisati SVE mečeve\n" +
      "2. ✓ Obrisati sve grupe i žrijeb\n" +
      "3. ✓ Obrisati sve sortirane poretke\n" +
      "4. ✓ Vratiti status na DRAFT\n\n" +
      "❌ Igrači će biti SAČUVANI!\n\n" +
      "Da li želite nastaviti?";
    
    if (!window.confirm(confirmMessage)) return;
    
    setGenerating(true);
    try {
      const batch = writeBatch(db);
      
      // 1. Obriši sve mečeve ove kategorije
      const allCategoryMatches = matches.filter(m => m.categoryId === selectedCategoryId);
      allCategoryMatches.forEach(m => {
        batch.delete(doc(db, "matches", m.id));
      });

      // 2. Resetuj kategoriju - obriši sve osim igrača
      const catRef = doc(db, "competitions", id, "categories", selectedCategoryId);
      batch.update(catRef, {
        status: 'draft',
        groupConfig: null,
        stages: null,
        [`stages.groups.completed`]: false,
        [`stages.knockout.completed`]: false,
        updatedAt: serverTimestamp()
      });

      // 3. Obriši sve ručne poretke (manualOrders) ako postoje
      const ordersRef = collection(db, "competitions", id, "categories", selectedCategoryId, "manualOrders");
      const ordersSnap = await getDocs(ordersRef);
      ordersSnap.docs.forEach(d => {
        batch.delete(d.ref);
      });

      await batch.commit();
      
      // Resetuj lokalni state
      setMatches(prev => prev.filter(m => m.categoryId !== selectedCategoryId));
      alert("Kategorija je očišćena! Igrači su sačuvani.");
      window.location.reload();
      
    } catch (err) {
      console.error("Greška pri čišćenju kategorije:", err);
      alert("Greška pri čišćenju kategorije: " + err.message);
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
        ownerUid: competition.ownerUid,
        createdAt: new Date(),
        matchesPlayed: 0,
        wins: 0
      });
      
      // Automatski dodaj novog igrača u selekciju ove kategorije
      setSelectedPlayers(prev => [...prev, playerRef.id]);
      
      const newPlayerObj = { 
        id: playerRef.id, 
        name: newPlayerName.trim(), 
        club: newPlayerClub.trim(),
        ownerUid: competition?.ownerUid || user?.uid,
        createdAt: { seconds: Date.now() / 1000 } // Mock timestamp
      };

      setAllPlayers(prev => [...prev, newPlayerObj]);
      
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
            ownerUid: competition?.ownerUid || user?.uid,
            createdAt: new Date(),
            matchesPlayed: 0,
            wins: 0
          };
          batch.set(playerRef, pData);
          newIds.push(playerRef.id);
          // Ensure consistent object structure for local state
          newObjects.push({ 
            id: playerRef.id, 
            ...pData,
            createdAt: { seconds: Date.now() / 1000 } // Mock timestamp for local state safety
          });
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
      const rank1 = [];
      const rank2 = [];
      const others = [];

      groups.forEach((group, idx) => {
        const standings = calculateStandings(idx);
        const winners = standings.slice(0, advancingCount).map(p => ({
          ...p,
          fromGroup: String.fromCharCode(65 + idx),
          rankInGroup: standings.indexOf(p) + 1,
          isStarred: seededPlayers.includes(p.id)
        }));
        
        winners.forEach(p => {
          if (p.rankInGroup === 1) rank1.push(p);
          else if (p.rankInGroup === 2) rank2.push(p);
          else others.push(p);
        });
      });

      // Seeding: Prvo rasporedi zvjezdice (nosioce) među prvoplasirane
      const seededRank1 = rank1.filter(p => p.isStarred).sort(() => Math.random() - 0.5);
      const regularRank1 = rank1.filter(p => !p.isStarred).sort(() => Math.random() - 0.5);
      
      // Rasporedi nosioce na suprotne krajeve SortedRank1 (0, last, mid...)
      const sortedRank1 = new Array(rank1.length);
      let seededIdx = 0;
      
      // Dinamičke prioritetne pozicije za teniski žrijeb
      // FIX: Seed 1 na indeks 0 (Gornja polovina), Seed 2 na indeks rank1.length-1 (Donja polovina)
      const getPriorityPositions = (len) => {
        if (len <= 1) return [0];
        
        const result = [0, len - 1]; // Uvijek prvi i zadnji su top prioriteti (suprotne strane)
        
        if (len > 2) {
          const mid = Math.floor(len / 2);
          result.push(mid); // Treći nosilac u sredinu donjeg dijela gornje polovine ili početak donje
          if (len > 3) {
            result.push(Math.floor(len * 0.75)); // Četvrti
          }
        }

        // Dodaj ostale pozicije koje nisu već u listi
        for (let i = 0; i < len; i++) {
          if (!result.includes(i)) result.push(i);
        }
        return result;
      };
      
      const priorityPositions = getPriorityPositions(rank1.length);
      
      priorityPositions.forEach(pos => {
        if (pos < sortedRank1.length && seededIdx < seededRank1.length && !sortedRank1[pos]) {
          sortedRank1[pos] = seededRank1[seededIdx++];
        }
      });
      
      // Popuni ostala mjesta u rank1
      let regularIdx = 0;
      for (let i = 0; i < sortedRank1.length; i++) {
        if (!sortedRank1[i]) {
          if (regularIdx < regularRank1.length) {
            sortedRank1[i] = regularRank1[regularIdx++];
          } else if (seededIdx < seededRank1.length) {
            sortedRank1[i] = seededRank1[seededIdx++];
          }
        }
      }

      // Za drugoplasirane: cilj je da ne sretnu igrača iz svoje grupe odmah
      // Rotiramo drugoplasirane za pola
      const shiftedRank2 = [...rank2];
      if (shiftedRank2.length > 1) {
        const half = Math.ceil(shiftedRank2.length / 2);
        for(let j=0; j<half; j++) shiftedRank2.push(shiftedRank2.shift());
      }

      // Spajamo u finalnu listu: [Rank1..., Others..., Rank2_Reversed...]
      // Tako će Match 0 biti Rank1[0] vs Rank2_Reversed[0] (što je Rank2[last nakon rotacije])
      allAdvancing.push(...sortedRank1.filter(Boolean));
      allAdvancing.push(...others);
      allAdvancing.push(...[...shiftedRank2].reverse());

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

      // Unaprijeđen raspored igrača u prvoj rundi da se nosioci ne sretnu do finala
      // Koristimo bit-reversal/teniski raspored za prvu rundu
      const getBracketPosition = (index, totalMatches) => {
        if (totalMatches === 1) return 0;
        if (totalMatches === 2) return [0, 1][index];
        if (totalMatches === 4) return [0, 3, 1, 2][index];
        if (totalMatches === 8) return [0, 7, 3, 4, 1, 6, 2, 5][index];
        if (totalMatches === 16) return [0, 15, 7, 8, 3, 12, 4, 11, 1, 14, 6, 9, 2, 13, 5, 10][index];
        return index; // fallback
      };
      
      const firstRoundPairs = new Array(matchesInFirstRound).fill(null).map(() => ({ p1: null, p2: null }));
      
      // Rasporedi igrače (Rank 1, Nosioce, itd) u Match P1 slotove koristeći bracket pozicije
      allAdvancing.forEach((player, idx) => {
        if (idx < matchesInFirstRound) {
            // Prvih N igrača (uglavnom Rank 1) idu u P1 slotove raznih mečeva
            const matchIdx = getBracketPosition(idx, matchesInFirstRound);
            firstRoundPairs[matchIdx].p1 = player;
        } else {
            // Ostali igrači (uglavnom Rank 2) idu u P2 slotove u obrnutom redoslijedu/balansirano
            // Radi jednostavnosti i spajanja Rank 1 vs Rank 2:
            // Rank 1 na poziciji K igra protiv Rank 2 na poziciji K
            const matchIdx = getBracketPosition((matchesInFirstRound * 2) - 1 - idx, matchesInFirstRound);
            firstRoundPairs[matchIdx].p2 = player;
        }
      });
      
      // Definišemo runde i broj mečeva u svakoj
      const tournamentRounds = [];
      let currentMatchCount = matchesInFirstRound;
      
      for (let r = 1; r <= roundsCount; r++) {
        let name = `Runda ${r}`;
        if (currentMatchCount === 32) name = '1/32 Finale';
        if (currentMatchCount === 16) name = '1/16 Finale';
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
        for (let i = 0; i < r.count; i++) {
          const matchRef = doc(collection(db, "matches"));
          
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
            ownerUid: competition?.ownerUid || userData?.uid || '',
            ownerEmail: competition?.ownerEmail || userData?.email || '',
            createdAt: serverTimestamp()
          };

          if (r.round === 1) {
            // Koristimo unaprijed pripremljene parove
            const pair = firstRoundPairs[i];
            if (pair) {
                if (pair.p1) matchData.player1 = pair.p1;
                if (pair.p2) matchData.player2 = pair.p2;
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

  const handleGenerateTemplate = async (count, preserveBaraz = false) => {
    if (!selectedCategoryId) return;
    
    const confirmMsg = preserveBaraz 
      ? "Ovim ćete pobrisati postojeći glavni žrijeb (baraž će ostati). Nastaviti?"
      : "Ovim ćete pobrisati postojeći žrijeb i rezultate eliminacija za ovu kategoriju (uključujući baraž). Nastaviti?";

    if (!window.confirm(confirmMsg)) return;

    setGenerating(true);
    try {
      // 0. Prvo obriši stare knockout mečeve za ovu kategoriju
      const matchesRef = collection(db, "matches");
      const oldMatchesQ = query(
        matchesRef,
        where("competitionId", "==", id),
        where("categoryId", "==", selectedCategoryId),
        where("isKnockout", "==", true)
      );
      
      const oldSnap = await getDocs(oldMatchesQ);
      const batch = writeBatch(db);
      
      oldSnap.forEach(d => {
        const data = d.data();
        // Ako čuvamo baraž, preskoči brisanje mečeva koji su u baražu
        if (preserveBaraz && data.roundName === "Baraž") {
          return;
        }
        batch.delete(d.ref);
      });
      
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
            ownerUid: competition?.ownerUid || userData?.uid || '',
            ownerEmail: competition?.ownerEmail || userData?.email || '',
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
        ownerUid: competition?.ownerUid || userData?.uid || '',
        ownerEmail: competition?.ownerEmail || userData?.email || '',
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

      setMatches((prev) => prev.map((match) => (
        match.id === matchId
          ? {
              ...match,
              [updateKey]: {
                id: playerData.id,
                name: playerData.name
              }
            }
          : match
      )));

      setAllMatchesForSearch((prev) => prev.map((match) => (
        match.id === matchId
          ? {
              ...match,
              [updateKey]: {
                id: playerData.id,
                name: playerData.name
              }
            }
          : match
      )));
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

    if (!isSuperAdmin && !planDetails) {
      alert("Podaci o planu se još učitavaju. Molimo pokušajte ponovo za nekoliko sekundi.");
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
                ownerUid: competition?.ownerUid || userData?.uid || '',
                ownerEmail: competition?.ownerEmail || userData?.email || '',
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
              groupId: 0, // Za ligu stavljamo pod grupu 0
              groupName: 'Liga',
              ownerUid: competition?.ownerUid || userData?.uid || '',
              ownerEmail: competition?.ownerEmail || userData?.email || '',
              createdAt: serverTimestamp()
            });
          });
        });
      }

      // 2. Ažuriraj kategoriju
      const catRef = doc(db, "competitions", id, "categories", selectedCategoryId);
      
      // OVDJE PROVJERI LIMITE GRUPA PRIJE ZAPISIVANJA U BAZU
      if (!isSuperAdmin && planDetails) {
        const groupsLimit = planDetails.groupsLimit || 1; // Default to 1 group if not specified
        if (activeCategory.format === 'groups_knockout' && groups.length > groupsLimit) {
            alert(`Vaš plan dozvoljava maksimalno ${groupsLimit} grupu/e. Pokušavate kreirati ${groups.length}. Molimo smanjite broj grupa.`);
            setGenerating(false);
            return;
        }
      }

      // Firestore ne dozvoljava ugniježdene nizove (arrays within arrays).
      // Pretvaramo grupe u objekat/mapu gdje su ključevi indeksi grupa.
      const groupConfigObj = {};
      groups.forEach((g, idx) => {
        groupConfigObj[idx] = g.map(p => p.id);
      });

      batch.update(catRef, {
        status: 'active',
        playerIds: selectedPlayers,
        seededPlayerIds: seededPlayers,
        groupConfig: groupConfigObj,
        updatedAt: serverTimestamp()
      });

      await batch.commit();
      setActiveTab('matches');
      // Maknut alert
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
      
      // 1. Spasi trenutni meč - respektujemo status koji je poslan iz modala + nove meta podatke
      await updateDoc(matchRef, {
        player1: match.player1,
        player2: match.player2,
        player1Score: match.player1Score || 0,
        player2Score: match.player2Score || 0,
        sets: match.sets || [],
        status: match.status || 'completed',
        round: match.round !== undefined ? match.round : 1,
        roundName: match.roundName || '',
        bracketIndex: match.bracketIndex || 0,
        tableId: match.tableId || null,
        table: match.table || null,
        refereeId: match.refereeId || null,
        refereeName: match.refereeName || null,
        updatedAt: serverTimestamp()
      });

      // 2. AUTOMATSKO NAPREDOVANJE - samo ako je meč stvarno GOTOV i ako nismo mijenjali postavke runde (da ne pobrkamo indexe)
      if (match.status === 'completed' && match.isKnockout && match.roundName !== 'Finale') {
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

          let nextMatch = null;
          let nextSlot = null;

          // Ako je Baraž (Round 0), traži prvi TBD slot u Rundi 1 prema bracketIndex-u
          if (currentRound === 0) {
             // Uzmi sve mečeve iz Round 1, sortirane po bracketIndex
             const round1Matches = matches
                .filter(m => m.isKnockout && Number(m.round) === 1)
                .sort((a,b) => (a.bracketIndex || 0) - (b.bracketIndex || 0));
             
             // Napravi listu svih TBD slotova u Round 1
             const availableSlots = [];
             for (const m of round1Matches) {
                 if (!m.player1 || m.player1.id === 'tbd') {
                     availableSlots.push({ match: m, slot: 'player1', bracketIndex: m.bracketIndex || 0 });
                 }
                 if (!m.player2 || m.player2.id === 'tbd') {
                     availableSlots.push({ match: m, slot: 'player2', bracketIndex: m.bracketIndex || 0 });
                 }
             }
             
             // Mapiranje: Baraž meč sa bracketIndex X ide u X-ti slot u listi TBD slotova
             if (currentIndex < availableSlots.length) {
                 const targetSlot = availableSlots[currentIndex];
                 nextMatch = targetSlot.match;
                 nextSlot = targetSlot.slot;
             }
          } else {
             const resolvedNext = findNextKnockoutSlot(matches, match);
             nextMatch = resolvedNext.nextMatch;
             nextSlot = resolvedNext.nextSlot;
          }

          if (nextMatch && nextSlot) {
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
            console.log("Nije pronađen naredni meč/slot za round:", currentRound + 1);
          }
        }
      }
      // Maknuti alerti za uspješno spašavanje meča
    } catch (err) {
      console.error(err);
      alert("Greška pri spašavanju rezultata.");
    } finally {
      setSavingMatchId(null);
    }
  };

  const handleAssignTableToGroup = async (groupIdx, tableId) => {
    const groupMatches = matches.filter(m => m.groupId === groupIdx);
    if (!groupMatches.length) return;
    const tableName = competition?.tables?.find(t => t.id === tableId)?.name || '';
    const batch = writeBatch(db);
    groupMatches.forEach(m => batch.update(doc(db, 'matches', m.id), { tableId, table: tableName, updatedAt: serverTimestamp() }));
    try { await batch.commit(); } catch (err) { console.error("Error group table:", err); alert("Greška pri dodjeli stola."); }
  };

  const handleAssignTableToCategory = async (tableId) => {
    if (!matches.length) return;
    const tableName = competition?.tables?.find(t => t.id === tableId)?.name || '';
    const batch = writeBatch(db);
    matches.forEach(m => batch.update(doc(db, 'matches', m.id), { tableId, table: tableName, updatedAt: serverTimestamp() }));
    try { await batch.commit(); } catch (err) { console.error("Error category table:", err); alert("Greška pri dodjeli stola."); }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!confirm("Da li ste sigurni da želite obrisati ovaj meč? Ova akcija se ne može poništiti.")) return;
    
    try {
      await deleteDoc(doc(db, "matches", matchId));
      setMatches(prev => prev.filter(m => m.id !== matchId));
      alert("Meč je uspješno obrisan.");
    } catch (err) {
      console.error("Error deleting match:", err);
      alert("Greška pri brisanju meča.");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm("Da li ste sigurni da želite obrisati ovu kategoriju? Biće obrisani SVI mečevi u ovoj kategoriji. Ova akcija se ne može poništiti.")) return;
    
    try {
      // 1. Delete all matches in this category (from the subcollection)
      const categoryMatches = matches.filter(m => m.categoryId === categoryId);
      const batch = writeBatch(db);
      
      categoryMatches.forEach(match => {
        batch.delete(doc(db, "competitions", id, "matches", match.id));
      });
      
      // 2. Delete the category document (from the subcollection)
      batch.delete(doc(db, "competitions", id, "categories", categoryId));
      
      await batch.commit();
      
      // Update local state
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      setMatches(prev => prev.filter(m => m.categoryId !== categoryId));
      
      // Reset selected category if deleted
      if (selectedCategoryId === categoryId) {
        const remainingCategories = categories.filter(c => c.id !== categoryId);
        setSelectedCategoryId(remainingCategories[0]?.id || null);
      }
      
      alert("Kategorija je uspješno obrisana.");
    } catch (err) {
      console.error("Error deleting category:", err);
      alert("Greška pri brisanju kategorije: " + err.message);
    }
  };

  const handleDeleteCompetition = async () => {
    if (!confirm("UPOZORENJE: Ova akcija će trajno obrisati cijelo takmičenje, SVE kategorije i SVE mečeve. Ova akcija se NE MOŽE poništiti. Da li ste apsolutno sigurni?")) return;
    
    // Double confirmation for critical action
    const confirmText = prompt('Unesite "OBRIŠI" da potvrdite brisanje takmičenja:');
    if (confirmText !== "OBRIŠI") {
      alert("Brisanje otkazano.");
      return;
    }
    
    try {
      const batch = writeBatch(db);
      
      // Delete all matches
      matches.forEach(match => {
        batch.delete(doc(db, "matches", match.id));
      });
      
      // Delete all categories
      categories.forEach(category => {
        batch.delete(doc(db, "categories", category.id));
      });
      
      // Delete the competition
      batch.delete(doc(db, "competitions", competition.id));
      
      await batch.commit();
      
      alert("Takmičenje je uspješno obrisano.");
      navigate('/admin/competitions');
    } catch (err) {
      console.error("Error deleting competition:", err);
      alert("Greška pri brisanju takmičenja.");
    }
  };

  const handleDeleteAllMatches = async (matchIds) => {
    try {
      const batch = writeBatch(db);
      matchIds.forEach(matchId => {
        batch.delete(doc(db, "matches", matchId));
      });
      await batch.commit();
      // Maknut alert
    } catch (err) {
      console.error("Error deleting matches:", err);
      alert("Greška pri brisanju mečeva.");
    }
  };

  const handleDeletePlayer = async (playerId) => {
    if (!confirm("Sigurno želite obrisati ovog igrača?")) return;
    
    try {
      await deleteDoc(doc(db, "players", playerId));
      setAllPlayers(prev => prev.filter(p => p.id !== playerId));
      // Maknut alert
    } catch (err) {
      console.error("Error deleting player:", err);
      alert("Greška pri brisanju igrača.");
    }
  };

  const handleDeleteAllPlayers = async (playerIds) => {
    try {
      const batch = writeBatch(db);
      playerIds.forEach(playerId => {
        batch.delete(doc(db, "players", playerId));
      });
      await batch.commit();
      setAllPlayers(prev => prev.filter(p => !playerIds.includes(p.id)));
      alert(`Uspješno obrisano ${playerIds.length} igrača.`);
    } catch (err) {
      console.error("Error deleting players:", err);
      alert("Greška pri brisanju igrača.");
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

  const saveGroupConfig = async (currentGroups) => {
    if (!selectedCategoryId || !currentGroups) return;
    try {
      const groupConfigObj = {};
      currentGroups.forEach((g, idx) => {
        groupConfigObj[idx] = g.map(p => p.id);
      });

      const catRef = doc(db, "competitions", id, "categories", selectedCategoryId);
      await updateDoc(catRef, {
        groupConfig: groupConfigObj,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error saving group config:", err);
    }
  };

  const movePlayerToGroup = (playerId, targetGroupIdx) => {
    // Check players per group limit
    if (!isSuperAdmin && planDetails) {
      const targetGroup = groups[targetGroupIdx];
      const limit = planDetails.playersPerGroupLimit || 16;
      const alreadyInGroup = targetGroup?.some(p => p.id === playerId);
      if (!alreadyInGroup && targetGroup?.length >= limit) {
        alert(`Dostigli ste limit od ${limit} igrača po grupi za vaš plan.`);
        return;
      }
    }

    // 1. Pronađi igrača
    const player = allPlayers.find(p => p.id === playerId);
    if (!player) return;

    // 2. Napravi nove grupe i ukloni igrača iz svih trenutnih grupa
    const newGroups = groups.map(g => g.filter(p => p.id !== playerId));
    
    // 3. Dodaj ga u ciljanu grupu
    if (newGroups[targetGroupIdx]) {
      newGroups[targetGroupIdx].push(player);
    }
    
    setGroups(newGroups);
    saveGroupConfig(newGroups);

    // 4. Auto-selekcija ako nije bio selektovan
    if (!selectedPlayers.includes(playerId)) {
      const newSelected = [...selectedPlayers, playerId];
      setSelectedPlayers(newSelected);
      // Save selection too
      const catRef = doc(db, "competitions", id, "categories", selectedCategoryId);
      updateDoc(catRef, { playerIds: newSelected });
    }
  };

  const removePlayerFromGroups = (playerId) => {
    const cleanedGroups = groups.map(g => g.filter(p => p.id !== playerId));
    setGroups(cleanedGroups);
    saveGroupConfig(cleanedGroups);
  };

  const handleAutoAssignGroups = () => {
    if (!activeCategory || groups.length === 0) return;
    
    // Check if auto-assign might hit per-group limits
    const limit = planDetails?.playersPerGroupLimit || 16;
    if (!isSuperAdmin && planDetails) {
       const totalToAssign = allPlayers.filter(p => selectedPlayers.includes(p.id)).length;
       if (totalToAssign > groups.length * limit) {
         alert(`Vaš plan dopušta maksimalno ${limit} igrača po grupi. Sa trenutnim brojem grupa (${groups.length}), možete rasporediti najviše ${groups.length * limit} igrača. Molimo dodajte još grupa ili nadogradite plan.`);
         return;
       }
    }

    // Uzmi sve selektovane igrače za ovu kategoriju
    const playersToAssign = allPlayers.filter(p => selectedPlayers.includes(p.id));
    
    if (playersToAssign.length === 0) {
      alert("Prvo izaberite igrače u tabu 'Igrači'.");
      return;
    }

    // Identifikuj već raspoređene
    const assignedIds = groups.flat().map(p => p.id);
    const unassignedPlayers = playersToAssign.filter(p => !assignedIds.includes(p.id));

    if (unassignedPlayers.length === 0) {
      alert("Svi izabrani igrači su već raspoređeni u grupe.");
      return;
    }

    // Razdvoji nosioce (seeded) i ostale
    const seededUnassigned = unassignedPlayers.filter(p => seededPlayers.includes(p.id));
    const regularUnassigned = unassignedPlayers.filter(p => !seededPlayers.includes(p.id));

    const newGroups = groups.map(g => [...g]);

    // 1. Prvo rasporedi nosioce (seeded) u različite grupe
    seededUnassigned.forEach(player => {
      let bestGroupIdx = -1;
      let minSeedsInGroup = Infinity;
      let minTotalInGroup = Infinity;

      // Randomize redoslijed grupa
      const groupIndices = Array.from({length: newGroups.length}, (_, i) => i).sort(() => Math.random() - 0.5);

      groupIndices.forEach(idx => {
        const group = newGroups[idx];
        
        // Skip if group is at plan limit
        if (!isSuperAdmin && planDetails && group.length >= limit) return;

        const seedsCount = group.filter(p => seededPlayers.includes(p.id)).length;
        
        if (seedsCount < minSeedsInGroup) {
          minSeedsInGroup = seedsCount;
          minTotalInGroup = group.length;
          bestGroupIdx = idx;
        } else if (seedsCount === minSeedsInGroup) {
          if (group.length < minTotalInGroup) {
            minTotalInGroup = group.length;
            bestGroupIdx = idx;
          }
        }
      });
      if (bestGroupIdx !== -1) {
        newGroups[bestGroupIdx].push(player);
      }
    });

    // 2. Rasporedi ostale igrače po klubovima (postojeća logika)
    const byClub = {};
    regularUnassigned.forEach(p => {
      const club = (p.club || 'Individual').trim().toLowerCase();
      const normalizedClub = (club === 'bez kluba' || club === '') ? 'individual' : club;
      if (!byClub[normalizedClub]) byClub[normalizedClub] = [];
      byClub[normalizedClub].push(p);
    });

    // Sortiraj klubove po veličini
    const sortedClubs = Object.keys(byClub).sort((a, b) => {
      if (a === 'individual') return 1;
      if (b === 'individual') return -1;
      return byClub[b].length - byClub[a].length;
    });

    sortedClubs.forEach(clubName => {
      const clubPlayers = byClub[clubName];
      // Randomize unutar kluba
      const shuffledClubPlayers = [...clubPlayers].sort(() => Math.random() - 0.5);

      shuffledClubPlayers.forEach(player => {
        let bestGroupIdx = -1;
        let minSameClubInGroup = Infinity;
        let minTotalInGroup = Infinity;

        // Randomize redoslijed provjere grupa za fer raspored
        const groupIndices = Array.from({length: newGroups.length}, (_, i) => i).sort(() => Math.random() - 0.5);

        groupIndices.forEach(idx => {
          const group = newGroups[idx];
          
          // Skip if group is at plan limit
          if (!isSuperAdmin && planDetails && group.length >= limit) return;

          const sameClubCount = clubName === 'individual' 
            ? 0 
            : group.filter(p => {
                const pc = (p.club || '').trim().toLowerCase();
                return pc === clubName;
              }).length;
          
          if (sameClubCount < minSameClubInGroup) {
            minSameClubInGroup = sameClubCount;
            minTotalInGroup = group.length;
            bestGroupIdx = idx;
          } else if (sameClubCount === minSameClubInGroup) {
            if (group.length < minTotalInGroup) {
              minTotalInGroup = group.length;
              bestGroupIdx = idx;
            }
          }
        });

        if (bestGroupIdx !== -1) {
          newGroups[bestGroupIdx].push(player);
        }
      });
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
        if (m.sets && Array.isArray(m.sets) && m.sets.length > 0) {
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
      const updateData = {
        name: compName.trim(),
        slug: slugVal,
        collaborators: collaborators,
        startDate: compStartDate || null,
        endDate: compEndDate || null,
        location: compLocation || '',
        description: compDescription || '',
        rules: compRules || '',
        contact: {
          phone: compContactPhone || '',
          email: compContactEmail || '',
          address: compContactAddress || ''
        },
        organizer: compOrganizer || '',
        director: compDirector || '',
        referee: compReferee || '',
        entryFee: compEntryFee || '',
        prizes: compPrizes || '',
        schedule: compSchedule || '',
        registration: {
          isOpen: regIsOpen,
          link: regLink || '',
          deadline: regDeadline || ''
        },
        defaultSettings: {
          setsToWin: Number(compSetsToWin),
          winPoints: Number(compWinPoints),
          lossPoints: Number(compLossPoints),
          advancingPlayers: Number(compAdvancingPlayers)
        },
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, "competitions", id), updateData);
      
      setCompetition(prev => ({ 
        ...prev, 
        ...updateData
      }));
      setShowCompSettings(false);
      alert("Takmičenje ažurirano!");
    } catch (err) {
      alert("Greška pri ažuriranju takmičenja.");
    } finally {
      setSavingComp(false);
    }
  };

  const handleTogglePublic = async (newState) => {
      setIsPublic(newState);
      // Optimistic update locally
      setCompetition(prev => ({ ...prev, isPublic: newState }));
      
      try {
          await updateDoc(doc(db, "competitions", id), {
              isPublic: newState
          });
      } catch (err) {
          console.error("Failed to toggle public status", err);
          // Revert on error
          setIsPublic(!newState);
          setCompetition(prev => ({ ...prev, isPublic: !newState }));
          alert("Greška pri promjeni statusa.");
      }
  };

  const activeCategoryId = selectedCategoryId;
  const assignedPlayerIds = groups.flat().filter(p => p && p.id).map(p => p.id);

  if (loading) return <DashboardLayout title="Učitavanje..."><div className="p-8">Dohvaćam podatke...</div></DashboardLayout>;
  if (!competition) return <DashboardLayout title="Greška"><div className="p-8 text-red-500 text-lg">Takmičenje nije pronađeno.</div></DashboardLayout>;

  if (categories.length === 0 && !categoriesLoading) {
    // Ako nema kategorija, osiguraj da smo na 'categories' tabu da bi se prikazala forma
    if (activeTab !== 'categories') {
       // setActiveTab('categories'); -> Ovo ne možemo zvati u renderu, ali layout će svakako renderovati CategoriesTab ako je activeTab 'categories'
       // Umjesto blokiranja rendera, pustimo ga dalje
    }
  }

  return (
    <DashboardLayout title={competition?.name || 'Takmičenje'}>
      <div className="max-w-6xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6">
        <GlobalMatchSearch 
          matchSearchQuery={matchSearchQuery}
          setMatchSearchQuery={setMatchSearchQuery}
          searchTableId={searchTableId}
          setSearchTableId={setSearchTableId}
          tables={competition.tables || []}
          filteredGlobalMatches={filteredGlobalMatches}
          categories={categories}
          setEditingMatch={setEditingMatch}
          setShowMatchModal={setShowMatchModal}
        />

        <CompetitionHeader 
          competition={competition}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          categoriesLoading={categoriesLoading}
          activeCategory={activeCategory}
          categories={categories}
          onShowExport={() => setShowExport(true)}
        />

        {showExport && (
          <CompetitionExport 
            competition={competition}
            categories={categories}
            matches={allMatchesForSearch}
            allPlayers={allPlayers}
            initialCategoryId="all"
            onClose={() => setShowExport(false)}
          />
        )}

        <div className="mt-6">
          <div className="bg-slate-900/70 backdrop-blur-xl rounded-[24px] border border-slate-800/80 overflow-hidden shadow-lg">
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
                newCategoryType={newCategoryType}
                setNewCategoryType={setNewCategoryType}
                handleAddCategory={handleAddCategory}
                handleDeleteCategory={handleDeleteCategory}
                competitionSlug={competition?.slug}
              />
            )}

            {activeTab === 'players' && activeCategory && (
              <div className="p-5 sm:p-6">
                {activeCategory.type === 'doubles' && (
                  <DoublesManager 
                    activeCategory={activeCategory}
                    allPlayers={allPlayers}
                    selectedPlayers={selectedPlayers}
                    onSavePairs={(newPairs) => {
                      const catRef = doc(db, "competitions", id, "categories", selectedCategoryId);
                      updateDoc(catRef, { doublesPairs: newPairs });
                    }}
                  />
                )}
                
                <PlayersTab 
                  activeCategory={activeCategory}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  showOnlySelected={showOnlySelected}
                  setShowOnlySelected={setShowOnlySelected}
                  allPlayers={allPlayers}
                  selectedPlayers={selectedPlayers}
                  seededPlayers={seededPlayers}
                  togglePlayerSelection={togglePlayerSelection}
                  togglePlayerSeed={togglePlayerSeed}
                  onEditPlayer={startEditingPlayer}
                  assignedPlayerIds={assignedPlayerIds}
                  saveSelectedPlayers={saveSelectedPlayers}
                  setShowAddPlayer={setShowAddPlayer}
                />
              </div>
            )}
            
            {activeTab === 'referees' && (
              <RefereesTab 
                competitionId={id} 
                tables={competition?.tables || []} 
                categories={categories || []}
              />
            )}

            {activeTab === 'tables' && (
              <TablesTab 
                competition={competition} 
                id={id} 
                matches={matches}
                referees={referees}
                setEditingMatch={setEditingMatch}
                setShowMatchModal={setShowMatchModal}
                saveMatchResult={saveMatchResult}
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
                handleDeleteMatch={handleDeleteMatch}
                handleToggleStage={handleToggleStage}
                handleReturnToDraft={handleReturnToDraft}
                handleClearCategory={handleClearCategory}
                handleAutoAssignGroups={handleAutoAssignGroups}
                togglePlayerSeed={togglePlayerSeed}
                seededPlayers={seededPlayers}
                planDetails={planDetails}
                isSuperAdmin={isSuperAdmin}
                handleAssignTableToGroup={handleAssignTableToGroup}
                handleAssignTableToCategory={handleAssignTableToCategory}
                tables={competition?.tables || []}
              />
            )}

            {activeTab === 'knockout' && (
              <div className="min-h-[500px]">
                {!activeCategory ? (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-12 text-center backdrop-blur-xl">
                    <div className="w-16 h-16 bg-red-500/20 rounded-lg flex items-center justify-center mx-auto mb-6 text-red-500">
                      <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-semibold text-white uppercase italic tracking-tight mb-2">Kategorija nije pronađena</h3>
                    <button 
                      onClick={() => setActiveTab('categories')} 
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl text-xs font-semibold uppercase"
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
                    saveMatchResult={saveMatchResult}
                    handleDeleteMatch={handleDeleteMatch}
                    tables={competition?.tables || []}
                    handleDeleteAllMatches={handleDeleteAllMatches}
                  />
                )}
              </div>
            )}

            {activeTab === 'settings' && activeCategory && (
                <SettingsTab 
                  activeCategory={activeCategory}
                  handleUpdateSettings={handleUpdateSettings}
                  handleToggleStage={handleToggleStage}
                  handleDeleteCompetition={handleDeleteCompetition}
                  isSuperAdmin={userData?.role === 'super_admin'}
                  isOwner={competition?.ownerUid === userData?.uid}
                />
            )}

            {activeTab === 'all-matches' && (
              <AllMatchesTab
                allMatches={allMatchesForSearch}
                categories={categories}
                allPlayers={allPlayers}
                setEditingMatch={setEditingMatch}
                setShowMatchModal={setShowMatchModal}
                handleDeleteMatch={handleDeleteMatch}
                handleDeleteAllMatches={handleDeleteAllMatches}
              />
            )}

            {activeTab === 'all-players' && (
              <AllPlayersTab
                allPlayers={allPlayers}
                handleDeletePlayer={handleDeletePlayer}
                handleDeleteAllPlayers={handleDeleteAllPlayers}
              />
            )}
          </div>
        </div>
      </div>

      <MatchUpdateModal 
        showMatchModal={showMatchModal}
        editingMatch={editingMatch}
        setEditingMatch={setEditingMatch}
        setShowMatchModal={setShowMatchModal}
        saveMatchResult={saveMatchResult}
        activeCategory={activeCategory}
        tables={competition?.tables || []}
        referees={referees || []}
      />

      {/* Edit Player Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-blue-600/10 to-transparent">
              <h3 className="text-xl font-semibold text-white uppercase tracking-tight">Uredi Igrača</h3>
              <button onClick={() => setEditingPlayer(null)} className="text-slate-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdatePlayer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 px-1">Ime i prezime</label>
                <input
                  type="text"
                  required
                  value={editPlayerName}
                  onChange={(e) => setEditPlayerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 px-1">Klub / Grad</label>
                <input
                  type="text"
                  value={editPlayerClub}
                  onChange={(e) => setEditPlayerClub(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Opciono"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingPlayer(null)}
                  className="flex-1 px-6 py-4 rounded-lg text-xs font-medium uppercase tracking-wide text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700"
                >
                  Odustani
                </button>
                <button
                  type="submit"
                  disabled={updatingPlayer}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all shadow-lg shadow-blue-600/20"
                >
                  {updatingPlayer ? 'Spašavam...' : 'Sačuvaj izmjene'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Player Modal */}
      {showAddPlayer && (
        <PlayerAddModal 
          show={showAddPlayer}
          onClose={() => setShowAddPlayer(false)}
          mode={playerFormMode}
          setMode={setPlayerFormMode}
          newPlayerName={newPlayerName}
          setNewPlayerName={setNewPlayerName}
          newPlayerClub={newPlayerClub}
          setNewPlayerClub={setNewPlayerClub}
          bulkPlayerText={bulkPlayerText}
          setBulkPlayerText={setBulkPlayerText}
          onSingleAdd={handleQuickAddPlayer}
          onBulkAdd={handleQuickBulkAdd}
        />
      )}
    </DashboardLayout>
  );
};

export default CompetitionDetails;
