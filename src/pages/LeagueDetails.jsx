import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { 
  doc, getDoc, collection, query, where, getDocs, updateDoc, 
  onSnapshot, serverTimestamp, writeBatch, deleteDoc, addDoc 
} from 'firebase/firestore';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  Users, Trophy, List, Settings, Save, Plus, ChevronRight, 
  Trash2, Play, CheckCircle, Info, Edit2, Zap, LayoutGrid, Search, Target,
  FileText, UserPlus, RefreshCw, X
} from 'lucide-react';
import { generateBergerMatches } from '../utils/berger';

// Sub-components
import PlayersTab from '../components/competition/PlayersTab';
import PublicGroupStandings from '../components/public/PublicGroupStandings';
import MatchUpdateModal from '../components/competition/MatchUpdateModal';
import GlobalMatchSearch from '../components/competition/GlobalMatchSearch';

const LeagueDetails = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userData, planDetails, isSuperAdmin } = useAuth(); // Import planDetails and isSuperAdmin
  
  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'players');
  const [allPlayers, setAllPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [seededPlayers, setSeededPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [matchSearchQuery, setMatchSearchQuery] = useState('');
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  // State za uređivanje igrača
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editPlayerName, setEditPlayerName] = useState('');
  const [editPlayerClub, setEditPlayerClub] = useState('');
  const [updatingPlayer, setUpdatingPlayer] = useState(false);

  // Filter for global search
  const filteredGlobalMatches = useMemo(() => {
    if (!matchSearchQuery.trim()) return [];
    const lower = matchSearchQuery.toLowerCase();
    return matches.filter(m => 
      m.player1?.name?.toLowerCase().includes(lower) || 
      m.player2?.name?.toLowerCase().includes(lower)
    ).sort((a,b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
  }, [matches, matchSearchQuery]);
  const [playerFormMode, setPlayerFormMode] = useState('single');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerClub, setNewPlayerClub] = useState('');
  const [bulkPlayerText, setBulkPlayerText] = useState('');

  // Load League Data
  useEffect(() => {
    if (!id || !userData) return;

    const unsubscribe = onSnapshot(doc(db, "competitions", id), (snap) => {
      if (snap.exists()) {
        const data = snap.id ? { id: snap.id, ...snap.data() } : null;
        setLeague(data);
        if (data && data.playerIds) {
            setSelectedPlayers(data.playerIds || []);
            setSeededPlayers(data.seededPlayerIds || []);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, userData]);

  // Load All Players for the owner
  useEffect(() => {
    if (!league || !userData) return;
    const q = query(
      collection(db, "players"), 
      where("ownerUid", "==", league.ownerUid)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setAllPlayers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [league, userData]);

  // Load Matches
  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, "matches"), 
      where("competitionId", "==", id)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMatches(list.sort((a, b) => (a.round || 0) - (b.round || 0) || (a.matchOrder || 0) - (b.matchOrder || 0)));
    });
    return () => unsubscribe();
  }, [id]);

  const togglePlayerSelection = (playerId) => {
    if (league?.status !== 'draft') return;
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(pid => pid !== playerId) 
        : [...prev, playerId]
    );
  };

  const togglePlayerSeed = (playerId) => {
    if (league?.status !== 'draft') return;
    setSeededPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(pid => pid !== playerId) 
        : [...prev, playerId]
    );
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

      setEditingPlayer(null);
      alert("Igrač uspešno ažuriran!");
    } catch (err) {
      console.error("Greška pri ažuriranju igrača:", err);
      alert("Greška pri ažuriranju igrača.");
    } finally {
      setUpdatingPlayer(false);
    }
  };

  const handleQuickAddPlayer = async (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    try {
      const playerRef = await addDoc(collection(db, "players"), {
        name: newPlayerName.trim(),
        club: newPlayerClub.trim(),
        ownerUid: league.ownerUid,
        createdAt: new Date(),
        matchesPlayed: 0,
        wins: 0
      });
      
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
          const playerId = doc(collection(db, "players")).id;
          const playerRef = doc(db, "players", playerId);
          const pData = {
            name: pName,
            club: pClub || '',
            ownerUid: league.ownerUid,
            createdAt: new Date(),
            matchesPlayed: 0,
            wins: 0
          };
          batch.set(playerRef, pData);
          newIds.push(playerId);
          newObjects.push({ id: playerId, ...pData });
        }
      });

      await batch.commit();
      setSelectedPlayers(prev => [...prev, ...newIds]);
      setAllPlayers(prev => [...prev, ...newObjects]);
      setBulkPlayerText('');
      setShowAddPlayer(false);
      alert(`Dodano ${entries.length} novih igrača.`);
    } catch (err) {
      console.error(err);
      alert("Greška pri bulk dodavanju.");
    } finally {
      setGenerating(false);
    }
  };

  const saveSelectedPlayers = async () => {
    // Check players per group limit (a league is one group)
    if (!isSuperAdmin && planDetails) {
      const limit = planDetails.playersPerGroupLimit || 16;
      if (selectedPlayers.length > limit) {
        alert(`Dostigli ste limit od ${limit} igrača po grupi (ligi) za vaš plan.`);
        return;
      }
    }

    try {
      await updateDoc(doc(db, "competitions", id), {
        playerIds: selectedPlayers,
        seededPlayerIds: seededPlayers,
        participantsCount: selectedPlayers.length
      });
      alert("Lista igrača je sačuvana.");
    } catch (err) {
      alert("Greška pri spašavanju.");
    }
  };

  const standings = useMemo(() => {
    if (!league || !matches) return [];

    const stats = (league.participants || []).map(player => ({
      ...player,
      played: 0,
      won: 0,
      lost: 0,
      draws: 0,
      setsWon: 0,
      setsLost: 0,
      points: 0,
      pointDiff: 0
    }));

    const winPts = league.settings?.pointsWin ?? 2;
    const drawPts = league.settings?.pointsDraw ?? 1;
    const lossPts = league.settings?.pointsLoss ?? 0;

    matches.filter(m => m.status === 'completed').forEach(m => {
      const p1 = stats.find(p => p.id === m.player1.id);
      const p2 = stats.find(p => p.id === m.player2.id);

      if (p1 && p2) {
        p1.played++;
        p2.played++;
        const s1 = m.player1Score || 0;
        const s2 = m.player2Score || 0;
        
        p1.setsWon += s1;
        p1.setsLost += s2;
        p2.setsWon += s2;
        p2.setsLost += s1;

        if (s1 > s2) {
          p1.won++;
          p1.points += winPts;
          p2.lost++;
          p2.points += lossPts;
        } else if (s2 > s1) {
          p2.won++;
          p2.points += winPts;
          p1.lost++;
          p1.points += lossPts;
        } else {
          p1.draws++;
          p1.points += drawPts;
          p2.draws++;
          p2.points += drawPts;
        }
      }
    });

    return stats.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const aDiff = a.setsWon - a.setsLost;
      const bDiff = b.setsWon - b.setsLost;
      return bDiff - aDiff;
    });
  }, [league, matches]);

  const saveMatchResult = async (matchData) => {
    try {
      const { id, ...result } = matchData;
      const matchRef = doc(db, "matches", id);
      await updateDoc(matchRef, {
        ...result,
        updatedAt: serverTimestamp()
      });
      setShowMatchModal(false);
      setEditingMatch(null);
    } catch (err) {
      console.error(err);
      alert("Greška pri spašavanju rezultata.");
    }
  };

  const handleGenerateLeague = async () => {
    if (selectedPlayers.length < 2) {
      alert("Dodajte barem 2 igrača.");
      return;
    }

    if (matches.length > 0 && !window.confirm("Ovo će obrisati sve postojeće mečeve i generisati nove. Da li ste sigurni?")) {
      return;
    }

    setGenerating(true);
    try {
      const batch = writeBatch(db);
      
      // 1. Delete old matches
      const oldMatchesSnap = await getDocs(query(collection(db, "matches"), where("competitionId", "==", id)));
      oldMatchesSnap.docs.forEach(d => batch.delete(d.ref));

      // 2. Map current selected player objects
      const participants = allPlayers.filter(p => selectedPlayers.includes(p.id));

      // 3. Generate Berger
      let bergerRounds = generateBergerMatches(participants);

      // Handle Double Robin
      if (league.settings?.format === 'double') {
        const secondLeg = bergerRounds.map(round => ({
          roundNumber: round.roundNumber + bergerRounds.length,
          matches: round.matches.map(m => ({
            ...m,
            player1: m.player2,
            player2: m.player1,
            round: round.roundNumber + bergerRounds.length
          }))
        }));
        bergerRounds = [...bergerRounds, ...secondLeg];
      }

      bergerRounds.forEach(round => {
        round.matches.forEach((m, idx) => {
          const matchRef = doc(collection(db, "matches"));
          batch.set(matchRef, {
            competitionId: id,
            categoryId: 'league_default',
            round: round.roundNumber,
            matchOrder: idx,
            player1: m.player1,
            player2: m.player2,
            status: 'pending',
            player1Score: 0,
            player2Score: 0,
            createdAt: serverTimestamp(),
            groupId: 0
          });
        });
      });

      batch.update(doc(db, "competitions", id), { 
        status: 'active',
        participants: participants.map(p => ({ id: p.id, name: p.name })),
        lastGenerated: serverTimestamp() 
      });

      await batch.commit();
      setActiveTab('matches');
    } catch (err) {
      console.error(err);
      alert("Greška!");
    } finally {
      setGenerating(false);
    }
  };

  const handleResetLeague = async () => {
    if (!window.confirm("Ovo će obrisati SVE rezultate i mečeve i vratiti ligu u fazu pripreme (draft). Da li ste sigurni?")) {
      return;
    }

    setGenerating(true);
    try {
      const batch = writeBatch(db);
      const oldMatchesSnap = await getDocs(query(collection(db, "matches"), where("competitionId", "==", id)));
      oldMatchesSnap.docs.forEach(d => batch.delete(d.ref));

      batch.update(doc(db, "competitions", id), { 
        status: 'draft',
        lastReset: serverTimestamp() 
      });

      await batch.commit();
      setActiveTab('players');
    } catch (err) {
      console.error(err);
      alert("Greška pri resetovanju.");
    } finally {
      setGenerating(false);
    }
  };

  const assignedPlayerIds = useMemo(() => {
    const ids = new Set();
    matches.forEach(m => {
      if (m.player1?.id) ids.add(m.player1.id);
      if (m.player2?.id) ids.add(m.player2.id);
    });
    return Array.from(ids);
  }, [matches]);

  if (loading) return <div className="p-10 text-center text-slate-500">Učitavanje lige...</div>;
  if (!league) return <div className="p-10 text-center text-red-500">Liga nije pronađena.</div>;

  return (
    <DashboardLayout title={`Liga: ${league.name}`}>
      <div className="max-w-6xl mx-auto pb-20 px-4">
        <GlobalMatchSearch 
          matchSearchQuery={matchSearchQuery}
          setMatchSearchQuery={setMatchSearchQuery}
          filteredGlobalMatches={filteredGlobalMatches}
          categories={[]}
          setEditingMatch={setEditingMatch}
          setShowMatchModal={setShowMatchModal}
        />
        
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                <Trophy className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white tracking-tight">{league.name}</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    league.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {league.status === 'active' ? 'Aktivo' : 'U pripremi'}
                  </span>
                </div>
                <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                   {league.sport} • {selectedPlayers.length} igrača • Bergerov Sistem
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => window.open(`/public/${league.id}`, '_blank')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
                >
                  Javni Profil <ChevronRight className="w-4 h-4" />
                </button>
                {league.status === 'draft' && (
                  <button 
                    onClick={handleGenerateLeague}
                    disabled={generating}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                  >
                    {generating ? 'Generisanje...' : 'Generiši Raspored'}
                  </button>
                )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/50 border border-slate-800 rounded-2xl mb-8 w-fit">
          {[
            { id: 'players', label: 'Igrači', icon: Users },
            { id: 'matches', label: 'Rezultati', icon: List },
            { id: 'standings', label: 'Tabela', icon: LayoutGrid },
            { id: 'settings', label: 'Postavke', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                ? 'bg-emerald-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'players' && (
            <PlayersTab 
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
              saveSelectedPlayers={saveSelectedPlayers}
              setShowAddPlayer={setShowAddPlayer}
              activeCategory={{ status: league?.status || 'draft', name: 'Lista Igrača' }}
            />
          )}

          {activeTab === 'matches' && (
            <div className="space-y-10">
               {matches.length === 0 ? (
                 <div className="text-center py-24 bg-slate-950/20 border-2 border-dashed border-slate-800 rounded-3xl">
                    <List size={48} className="text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Nema generisanih mečeva</h3>
                    <p className="text-slate-500 mb-8 max-w-sm mx-auto">Nakon što odaberete igrače, generišite raspored po kolima.</p>
                    <button 
                        onClick={handleGenerateLeague}
                        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all"
                    >
                        Generiši Raspored Odmah
                    </button>
                 </div>
               ) : (
                 <div className="space-y-12">
                   {Array.from(new Set(matches.map(m => m.round))).sort((a,b) => a-b).map(roundNum => {
                      const roundMatches = matches.filter(m => m.round === roundNum);
                      const filteredRoundMatches = roundMatches.filter(m => 
                        !matchSearchQuery || 
                        m.player1?.name.toLowerCase().includes(matchSearchQuery.toLowerCase()) || 
                        m.player2?.name.toLowerCase().includes(matchSearchQuery.toLowerCase())
                      );

                      if (matchSearchQuery && filteredRoundMatches.length === 0) return null;

                      return (
                        <div key={roundNum} className="space-y-6">
                          <div className="flex items-center gap-4">
                             <div className="h-px flex-1 bg-slate-800"></div>
                             <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] px-4 py-1.5 border border-slate-800 rounded-full">Kolo {roundNum}</h3>
                             <div className="h-px flex-1 bg-slate-800"></div>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {filteredRoundMatches.map(match => (
                                  <div 
                                      key={match.id}
                                      onClick={() => { setEditingMatch(match); setShowMatchModal(true); }}
                                      className="bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/30 p-5 rounded-2xl transition-all cursor-pointer group flex items-center justify-between"
                                  >
                                      <div className="flex-1 space-y-3">
                                          <div className="flex items-center justify-between">
                                              <span className={`font-medium ${match.player1Score > match.player2Score ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                                                  {match.player1?.name}
                                              </span>
                                              <span className="text-xl font-mono text-white bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">{match.player1Score || 0}</span>
                                          </div>
                                          <div className="flex items-center justify-between">
                                              <span className={`font-medium ${match.player2Score > match.player1Score ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                                                  {match.player2?.name}
                                              </span>
                                              <span className="text-xl font-mono text-white bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">{match.player2Score || 0}</span>
                                          </div>
                                      </div>
                                      <div className="ml-6 pl-6 border-l border-slate-800 flex items-center">
                                         <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                            <Edit2 size={16} />
                                         </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                        </div>
                      );
                   })}

                   {matchSearchQuery && matches.some(m => m.player1?.name.toLowerCase().includes(matchSearchQuery.toLowerCase()) || m.player2?.name.toLowerCase().includes(matchSearchQuery.toLowerCase())) === false && (
                      <div className="text-center py-20 bg-slate-900/20 border border-slate-800 rounded-3xl">
                        <Search className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest">Nema rezultata pretrage za "{matchSearchQuery}"</p>
                      </div>
                   )}
                 </div>
               )}
            </div>
          )}

          {activeTab === 'standings' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
               <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                  <h3 className="text-xl font-black text-white flex items-center gap-3">
                    <Trophy className="text-amber-500" /> Tabela Lige
                  </h3>
               </div>
               <div className="p-0">
                  <PublicGroupStandings 
                    standings={standings} 
                  />
               </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-8">
               <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                  <h3 className="text-xl font-bold text-white mb-8 border-b border-slate-800 pb-4">Opšte Postavke</h3>
                  <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Naziv Lige</label>
                        <input 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                            value={league.name}
                            onChange={(e) => updateDoc(doc(db, "competitions", id), { name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Bodovi (Pobjeda / Neriješeno / Poraz)</label>
                        <div className="grid grid-cols-3 gap-4">
                            <input 
                                type="number" 
                                className="bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-white"
                                value={league.settings?.pointsWin || 2}
                                onChange={(e) => updateDoc(doc(db, "competitions", id), { "settings.pointsWin": Number(e.target.value) })}
                            />
                            <input 
                                type="number" 
                                className="bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-white"
                                value={league.settings?.pointsDraw || 1}
                                onChange={(e) => updateDoc(doc(db, "competitions", id), { "settings.pointsDraw": Number(e.target.value) })}
                            />
                            <input 
                                type="number" 
                                className="bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-white"
                                value={league.settings?.pointsLoss || 0}
                                onChange={(e) => updateDoc(doc(db, "competitions", id), { "settings.pointsLoss": Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Setova za pobjedu (npr. 2 ili 3)</label>
                        <input 
                            type="number" 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                            value={league.settings?.setsToWin || 2}
                            onChange={(e) => updateDoc(doc(db, "competitions", id), { "settings.setsToWin": Number(e.target.value) })}
                            min="1"
                            max="5"
                        />
                        <p className="text-[10px] text-slate-600 mt-2 italic px-1">* 2 seta = Best of 3, 3 seta = Best of 5</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Format Takmičenja</label>
                        <div className="flex gap-4">
                           <button 
                             onClick={() => updateDoc(doc(db, "competitions", id), { "settings.format": 'single' })}
                             className={`flex-1 py-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${(!league.settings?.format || league.settings?.format === 'single') ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                           >
                             Jednokružni (Single Robin)
                           </button>
                           <button 
                             onClick={() => updateDoc(doc(db, "competitions", id), { "settings.format": 'double' })}
                             className={`flex-1 py-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${league.settings?.format === 'double' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                           >
                             Dvokružni (Double Robin)
                           </button>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-800">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Javna Vidljivost & Link</label>
                        <div className="flex flex-col gap-4">
                           <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800">
                              <div>
                                 <p className="text-white font-bold text-sm">Javna stranica</p>
                                 <p className="text-[10px] text-slate-500">Omogući svima da vide tabelu i rezultate</p>
                              </div>
                              <button 
                                onClick={() => updateDoc(doc(db, "competitions", id), { isPublic: !league.isPublic })}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${league.isPublic ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}
                              >
                                {league.isPublic ? 'Javno Vidljivo' : 'Privatno'}
                              </button>
                           </div>

                           {league.isPublic && (
                             <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">Unikatni Link Takmičenja (Slug)</label>
                                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 group focus-within:border-emerald-500 transition-all">
                                   <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest mr-2 border-r border-slate-800 pr-3 pointer-events-none">pingpong.ba/p/</span>
                                   <input 
                                     placeholder="npr. moja-stonoteniska-liga"
                                     className="bg-transparent text-white text-sm font-bold outline-none flex-1 lowercase placeholder:text-slate-700"
                                     value={league.slug || ''}
                                     onChange={(e) => updateDoc(doc(db, "competitions", id), { slug: e.target.value.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-') })}
                                   />
                                </div>
                                {league.slug && (
                                  <Link 
                                    to={`/p/${league.slug}`} 
                                    target="_blank"
                                    className="inline-flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:text-emerald-400 transition-colors ml-1"
                                  >
                                    Otvori javnu stranicu <ChevronRight size={12} />
                                  </Link>
                                )}
                             </div>
                           )}
                        </div>
                    </div>
                    
                    <div className="pt-8 border-t border-slate-800 mt-8 flex flex-wrap gap-4">
                        <button 
                            onClick={handleResetLeague}
                            disabled={generating}
                            className="bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white border border-amber-500/20 px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                        >
                            <RefreshCw size={18} className={generating ? 'animate-spin' : ''} /> Resetuj Ligu (Draft)
                        </button>

                        <button 
                            onClick={async () => {
                                if (window.confirm("Trajno obrisati cijelu ligu?")) {
                                    await deleteDoc(doc(db, "competitions", id));
                                    navigate('/admin/leagues');
                                }
                            }}
                            className="bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                        >
                            <Trash2 size={18} /> Obriši Ligu
                        </button>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <MatchUpdateModal
          showMatchModal={showMatchModal}
          editingMatch={editingMatch}
          setEditingMatch={setEditingMatch}
          setShowMatchModal={setShowMatchModal}
          saveMatchResult={saveMatchResult}
          activeCategory={{
            setsToWin: league.settings?.setsToWin || 2,
            winPoints: league.settings?.pointsWin,
            lossPoints: league.settings?.pointsLoss
          }}
        />

        {/* Add Player Modal */}
        {showAddPlayer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-800 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Novi Igrač(i)</h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Dodajte direktno u sistem</p>
                </div>
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button 
                    onClick={() => setPlayerFormMode('single')}
                    className={`p-2 rounded-lg transition-all ${playerFormMode === 'single' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white'}`}
                  >
                    <UserPlus size={18} />
                  </button>
                  <button 
                    onClick={() => setPlayerFormMode('bulk')}
                    className={`p-2 rounded-lg transition-all ${playerFormMode === 'bulk' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white'}`}
                  >
                    <FileText size={18} />
                  </button>
                </div>
              </div>
              
              <div className="p-8">
                {playerFormMode === 'single' ? (
                  <form onSubmit={handleQuickAddPlayer} className="space-y-5">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ime i Prezime</label>
                       <input 
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-700"
                        placeholder="npr. Edin Džeko"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Klub (opciono)</label>
                       <input 
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-700"
                        placeholder="npr. STK Spin"
                        value={newPlayerClub}
                        onChange={(e) => setNewPlayerClub(e.target.value)}
                       />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button 
                        type="button"
                        onClick={() => setShowAddPlayer(false)}
                        className="flex-1 py-4 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-white transition-all"
                      >
                        Otkaži
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                      >
                        Dodaj Igrača
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleQuickBulkAdd} className="space-y-5">
                    <div className="space-y-2">
                       <div className="flex justify-between items-center ml-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lista igrača</label>
                          <span className="text-[9px] text-blue-500 font-bold uppercase">Format: Ime, Klub;</span>
                       </div>
                       <textarea 
                        required
                        rows={6}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-mono text-xs focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-800 resize-none"
                        placeholder="Haris Tabaković, STK Spin;&#10;Ermin H., STK Sarajevo;"
                        value={bulkPlayerText}
                        onChange={(e) => setBulkPlayerText(e.target.value)}
                       />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button 
                        type="button"
                        onClick={() => setShowAddPlayer(false)}
                        className="flex-1 py-4 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-white transition-all"
                      >
                        Otkaži
                      </button>
                      <button 
                        type="submit"
                        disabled={generating}
                        className={`flex-1 ${generating ? 'bg-slate-800' : 'bg-white text-slate-900 hover:bg-blue-500 hover:text-white'} py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95`}
                      >
                        {generating ? 'Procesiranje...' : 'Uvezi Listu'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Player Modal */}
        {editingPlayer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-blue-600/10 to-transparent">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Uredi Igrača</h3>
                <button onClick={() => setEditingPlayer(null)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleUpdatePlayer} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Ime i prezime</label>
                  <input
                    type="text"
                    required
                    value={editPlayerName}
                    onChange={(e) => setEditPlayerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Klub / Grad</label>
                  <input
                    type="text"
                    value={editPlayerClub}
                    onChange={(e) => setEditPlayerClub(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Opciono"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingPlayer(null)}
                    className="flex-1 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700"
                  >
                    Odustani
                  </button>
                  <button
                    type="submit"
                    disabled={updatingPlayer}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
                  >
                    {updatingPlayer ? 'Spašavam...' : 'Sačuvaj izmjene'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LeagueDetails;
