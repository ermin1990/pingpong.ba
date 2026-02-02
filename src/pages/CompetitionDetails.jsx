import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc, serverTimestamp, writeBatch, onSnapshot } from 'firebase/firestore';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  Users, Trophy, Play, CheckCircle, Clock, Save, Plus, Layers, 
  ChevronRight, ChevronDown, LayoutGrid, FileText, Info, UserPlus, Search, 
  Target, Settings2, PlayCircle, Zap, X, AlertTriangle, Edit2 
} from 'lucide-react';
import { generateBergerMatches } from '../utils/berger';

// Sub-components
import CategoriesTab from '../components/competition/CategoriesTab';
import PlayersTab from '../components/competition/PlayersTab';
import MatchesTab from '../components/competition/MatchesTab';
import SettingsTab from '../components/competition/SettingsTab';

const CompetitionDetails = () => {
  const { id } = useParams();
  const { userData } = useAuth();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allPlayers, setAllPlayers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [activeTab, setActiveTab] = useState('categories');
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
  
  // Grouping state
  const [groups, setGroups] = useState([]); // Array of arrays of player objects
  const [groupTabs, setGroupTabs] = useState({}); // { groupIdx: 'players' | 'table' | 'matches' }

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
          
          // 2. Dohvati igrače
          let playersQ;
          if (userData.role === 'super_admin') {
            playersQ = query(collection(db, "players"));
          } else {
            playersQ = query(
              collection(db, "players"), 
              where("organizationId", "==", userData.organizationId)
            );
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
    const q = query(collection(db, "competitions", id, "categories"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(list);
    });
    return () => unsubscribe();
  }, [id]);

  // Real-time mečevi za aktivnu kategoriju
  useEffect(() => {
    if (activeTab === 'matches' && id && selectedCategoryId) {
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
  }, [activeTab, id, selectedCategoryId]);

  const activeCategory = categories.find(c => c.id === selectedCategoryId);

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

  const handleUpdateSettings = async (winPts, lossPts) => {
    if (!selectedCategoryId) return;
    try {
      const catRef = doc(db, "competitions", id, "categories", selectedCategoryId);
      await updateDoc(catRef, {
        winPoints: Number(winPts),
        lossPoints: Number(lossPts),
        updatedAt: serverTimestamp()
      });
      alert("Postavke bodovanja sačuvane.");
    } catch (err) {
      alert("Greška pri spašavanju postavki.");
    }
  };

  const handleQuickAddPlayer = async (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    try {
      const playerRef = await addDoc(collection(db, "players"), {
        name: newPlayerName.trim(),
        club: newPlayerClub.trim(),
        organizationId: userData.organizationId || "SUPER_ADMIN",
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
            organizationId: userData.organizationId || "SUPER_ADMIN",
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
      await updateDoc(matchRef, {
        player1Score: match.player1Score || 0,
        player2Score: match.player2Score || 0,
        status: 'completed',
        updatedAt: serverTimestamp()
      });
      // Ovdje bi mogli dodati i logiku za ažuriranje tabele ako treba real-time
      alert("Rezultat uspješno ažuriran!");
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
      const lossPts = activeCategory?.lossPoints ?? 1;

      if (p1 && p2) {
        p1.played++;
        p2.played++;
        p1.setsWon += (m.player1Score || 0);
        p1.setsLost += (m.player2Score || 0);
        p2.setsWon += (m.player2Score || 0);
        p2.setsLost += (m.player1Score || 0);

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

    return stats.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const aDiff = a.setsWon - a.setsLost;
      const bDiff = b.setsWon - b.setsLost;
      if (aDiff !== bDiff) return bDiff - aDiff;
      return 0;
    });
  };

  const activeCategoryId = selectedCategoryId;
  const assignedPlayerIds = groups.flat().map(p => p.id);

  if (loading) return <DashboardLayout title="Učitavanje..."><div className="p-8">Dohvaćam podatke...</div></DashboardLayout>;
  if (!competition) return <DashboardLayout title="Greška"><div className="p-8 text-red-500 text-lg">Takmičenje nije pronađeno.</div></DashboardLayout>;

  return (
    <DashboardLayout title={competition.name}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-8 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-sm">
          <button 
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'categories' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
          >
            <LayoutGrid size={14} /> Discipline
          </button>
          
          {selectedCategoryId && (
            <>
              <button 
                onClick={() => setActiveTab('players')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'players' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
              >
                <Users size={14} /> Roster
              </button>
              
              <button 
                onClick={() => setActiveTab('matches')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'matches' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
              >
                <PlayCircle size={14} /> Raspored / Mečevi
              </button>

              <button 
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
              >
                <Settings2 size={14} /> Postavke
              </button>
            </>
          )}
        </div>

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
          />
        )}

        {/* Players Tab */}
        {activeTab === 'players' && (
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

        {/* Matches Tab - Raspored / Mečevi */}
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
          />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <SettingsTab 
            activeCategory={activeCategory}
            handleUpdateSettings={handleUpdateSettings}
          />
        )}
      </div>

      {/* Match Update Modal */}
      {showMatchModal && editingMatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-white font-black uppercase italic tracking-tighter text-lg">Unos Rezultata</h3>
              <button onClick={() => setShowMatchModal(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 text-center space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{editingMatch.player1.name}</p>
                  <input 
                    type="number" 
                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-center text-3xl font-black text-white focus:border-blue-500 outline-none transition-all"
                    value={editingMatch.player1Score || 0}
                    onChange={(e) => setEditingMatch({...editingMatch, player1Score: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="text-2xl font-black text-slate-700">:</div>
                <div className="flex-1 text-center space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{editingMatch.player2.name}</p>
                  <input 
                    type="number" 
                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-center text-3xl font-black text-white focus:border-blue-500 outline-none transition-all"
                    value={editingMatch.player2Score || 0}
                    onChange={(e) => setEditingMatch({...editingMatch, player2Score: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <button 
                onClick={async () => {
                  await saveMatchResult(editingMatch);
                  setShowMatchModal(false);
                }}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-500/20"
              >
                Sačuvaj Rezultat
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CompetitionDetails;
