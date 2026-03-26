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

const CompetitionDetails = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userData, planDetails, isSuperAdmin } = useAuth();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allPlayers, setAllPlayers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  // URL state management
  const selectedCategoryId = searchParams.get('category') || '';
  const activeTab = searchParams.get('tab') || 'categories';
  const isAmater = window.location.pathname.includes('/seasons/');
  const competitionCollectionPath = 'competitions';

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

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, "referees"), where("competitionId", "==", id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReferees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !userData || !user) return;

      try {
        // 1. Probaj u standardnoj kolekciji
        let compRef = doc(db, "competitions", id);
        let compSnap = await getDoc(compRef);
        
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
          if (compData.type === 'Groups' || compData.type === 'league_season') {
            setNewCategoryFormat('groups_knockout');
          } else if (compData.type === 'Knockout') {
             // Ako je čisti knockout, možemo defaultati na groups_knockout jer često imaju grupe prije, 
             // ili ako dodamo clean knockout opciju kasnije. Za sada neka bude groups_knockout jer je bliže tome.
             // Ali zapravo, trenutni select ima samo 'round_robin' i 'groups_knockout'.
             setNewCategoryFormat('groups_knockout'); 
          }
          
          // 2. Provjera prava pristupa
          const isSuperAdmin = userData?.role === 'super_admin';
          let canAccess = compData.ownerUid === user?.uid || 
                         compData.collaborators?.includes(user?.email) || 
                         isSuperAdmin;

          if (!canAccess && compData.parentLeagueId) {
             const parentCollection = competitionCollectionPath;
             const parentSnap = await getDoc(doc(db, parentCollection, compData.parentLeagueId));
             if (parentSnap.exists()) {
                const parentData = parentSnap.data();
                if (parentData.ownerUid === user?.uid || parentData.collaborators?.includes(user?.email)) {
                   canAccess = true;
                }
             }
          }

          if (!canAccess) {
            console.error("Nemate dozvolu za pristup ovom takmičenju.");
            setLoading(false);
            setCompetition(null);
            return;
          }

          // 3. Dohvati igrače
          let playersQ;
          if (isSuperAdmin) {
            playersQ = query(collection(db, "players"));
          } else if (compData.ownerUid) {
            playersQ = query(
              collection(db, "players"), 
              where("ownerUid", "==", compData.ownerUid)
            );
          } else if (compData.parentLeagueId) {
             // Ako turnir nema ownerUid (jer je kreiran iz sezone), koristimo ownerUid od sezone
             const parentCollection = competitionCollectionPath;
             const parentSnap = await getDoc(doc(db, parentCollection, compData.parentLeagueId));
             if (parentSnap.exists()) {
                playersQ = query(
                  collection(db, "players"), 
                  where("ownerUid", "==", parentSnap.data().ownerUid)
                );
             }
          }

          if (playersQ) {
            const playersSnap = await getDocs(playersQ);
            setAllPlayers(playersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }
        } else {
           setCompetition(null);
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
    
    const collectionPath = competitionCollectionPath;
    
    const q = query(collection(db, collectionPath, id, "categories"));
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
    if (activeCategory?.groupConfig) {
      try {
        const configData = Array.isArray(activeCategory.groupConfig) 
          ? activeCategory.groupConfig 
          : Object.values(activeCategory.groupConfig);

        const restoredGroups = configData.map(idList => 
          idList.map(pid => allPlayers.find(p => p.id === pid)).filter(Boolean)
        );
        
        // Only set groups if we actually found members or if it's explicitly configured as empty groups
        if (restoredGroups.length > 0) {
          setGroups(restoredGroups);
          return;
        }
      } catch (err) {
        console.error("Greška pri učitavanju grupa:", err);
      }
    }

    // Default initialization if no config exists
    if (activeCategory?.format === 'groups_knockout') {
      // Respect plan limits for initial groups count
      let initialGroupsCount = 2;
      if (!isSuperAdmin && planDetails?.groupsLimit) {
        initialGroupsCount = Math.min(2, planDetails.groupsLimit);
      }
      setGroups(Array.from({ length: initialGroupsCount }, () => []));
    } else if (activeCategory?.format === 'round_robin') {
      const participants = allPlayers.filter(p => (activeCategory.playerIds || []).includes(p.id));
      setGroups([participants]);
    } else {
      setGroups([]);
    }
  }, [selectedCategoryId, activeCategory?.groupConfig, activeCategory?.format, allPlayers.length, activeCategory?.status]);

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
      const collectionPath = competitionCollectionPath;
      
      const q = collection(db, collectionPath, id, "categories", selectedCategoryId, "manualOrders");
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
      const collectionPath = competitionCollectionPath;
      
      const catData = {
        name: newCategoryName.trim(),
        format: newCategoryFormat,
        status: 'draft',
        createdAt: serverTimestamp(),
        playerIds: [],
        seededPlayerIds: [],
        advancingPlayers: competition?.defaultSettings?.advancingPlayers ?? 2,
        setsToWin: competition?.defaultSettings?.setsToWin ?? 2,
        winPoints: competition?.defaultSettings?.winPoints ?? 2,
        lossPoints: competition?.defaultSettings?.lossPoints ?? 0
      };

      await addDoc(collection(db, collectionPath, id, "categories"), catData);
      setNewCategoryName('');
    } catch (err) {
      console.error("Greška pri kreiranju kategorije:", err);
      alert(`Greška pri kreiranju kategorije: ${err.message}`);
    }
  };

  const togglePlayerSelection = async (playerId) => {
    if (activeCategory?.status !== 'draft') return;

    let newSelected;
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
    }
    
    setSelectedPlayers(newSelected);

    try {
      const collectionPath = competitionCollectionPath;
      
      const catRef = doc(db, collectionPath, id, "categories", selectedCategoryId);
      await updateDoc(catRef, {
        playerIds: newSelected,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Greška pri spašavanju selekcije:", err);
    }
  };

  const togglePlayerSeed = async (playerId) => {
    if (activeCategory?.status !== 'draft') return;
    
    const newSeeding = seededPlayers.includes(playerId) 
      ? seededPlayers.filter(pid => pid !== playerId) 
      : [...seededPlayers, playerId];
      
    setSeededPlayers(newSeeding);

    try {
      const collectionPath = competitionCollectionPath;
      
      const catRef = doc(db, collectionPath, id, "categories", selectedCategoryId);
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
      const collectionPath = competitionCollectionPath;
      const catRef = doc(db, collectionPath, id, "categories", selectedCategoryId);
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
      const collectionPath = competitionCollectionPath;
      const { winPoints, lossPoints, advancingPlayers, setsToWin } = settings;
      const catRef = doc(db, collectionPath, id, "categories", selectedCategoryId);
      await updateDoc(catRef, {
        winPoints: Number(winPoints),
        lossPoints: Number(lossPoints),
        advancingPlayers: Number(advancingPlayers),
        setsToWin: Number(setsToWin || 2),
        updatedAt: serverTimestamp()
      });
      // Maknut alert za postavke
    } catch (err) {
      alert("Greška pri spašavanju postavki.");
    }
  };

  const handleToggleStage = async (stage, status) => {
    if (!selectedCategoryId) return;
    try {
      const collectionPath = competitionCollectionPath;
      const catRef = doc(db, collectionPath, id, "categories", selectedCategoryId);
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
      const collectionPath = competitionCollectionPath;
      const catRef = doc(db, collectionPath, id, "categories", selectedCategoryId);
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
      const collectionPath = competitionCollectionPath;
      const catRef = doc(db, collectionPath, id, "categories", selectedCategoryId);
      batch.update(catRef, {
        status: 'draft',
        groupConfig: null,
        stages: null,
        [`stages.groups.completed`]: false,
        [`stages.knockout.completed`]: false,
        updatedAt: serverTimestamp()
      });

      // 3. Obriši sve ručne poretke (manualOrders) ako postoje
      const ordersRef = collection(db, collectionPath, id, "categories", selectedCategoryId, "manualOrders");
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
      const collectionPath = competitionCollectionPath;
      const orderRef = doc(db, collectionPath, id, "categories", selectedCategoryId, "manualOrders", groupIdx.toString());
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
      const isSeasonType = competition?.type === 'league_season';

      tournamentRounds.forEach(r => {
        for (let i = 0; i < r.count; i++) {
          const matchRef = doc(collection(db, "matches"));
          
          let side = 'lijevi';
          if (r.count > 1) {
            side = i < (r.count / 2) ? 'lijevi' : 'desni';
          } else {
            side = 'center';
          }

          // Rule: Rose Pharm uses Best of 5 (setsToWin: 3) from 1/4 Final, and Best of 3 (setsToWin: 2) before that.
          let setsToWin = activeCategory?.setsToWin || 3; // default
          if (isSeasonType) {
            const isLateStage = ['1/4 Finale', 'Polufinale', 'Finale'].includes(r.name);
            setsToWin = isLateStage ? 3 : 2;
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
            setsToWin: setsToWin,
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

  return (
    <DashboardLayout>
      {/* ...existing code... */}
    </DashboardLayout>
  );
};

export default CompetitionDetails;
