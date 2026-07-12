import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { 
  doc, getDoc, collection, query, where, getDocs, updateDoc, setDoc, 
  addDoc, serverTimestamp, writeBatch, onSnapshot, deleteDoc, limit, orderBy
} from 'firebase/firestore';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  Users, Trophy, List, Settings, Plus, ChevronRight, 
  Trash2, Edit2, Zap, LayoutGrid, Search, Calendar, RefreshCw, X, ExternalLink
} from 'lucide-react';
import { calculateSeasonStandings } from '../utils/standings';

const SeasonDetails = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  
  const [season, setSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'tournaments');
  const [subTournaments, setSubTournaments] = useState([]);
  const [creatingSub, setCreatingSub] = useState(false);
  const [seasonCategories, setSeasonCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [seasonMatches, setSeasonMatches] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [tournamentCategories, setTournamentCategories] = useState([]); // All categories from all sub-tournaments

  // Load players owned by this season's organizer, for name lookup in standings
  // (all sub-tournaments inherit season.ownerUid - see handleCreateSubTournament below)
  useEffect(() => {
    if (!season?.ownerUid) return;
    const q = query(collection(db, "players"), where("ownerUid", "==", season.ownerUid));
    const unsub = onSnapshot(q, (snap) => {
      setAllPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [season?.ownerUid]);

  // Load Season Data
  useEffect(() => {
    if (!id || !userData) return;
    const unsubscribe = onSnapshot(doc(db, "amater_leagues", id), (snap) => {
      if (snap.exists()) {
        setSeason({ id: snap.id, ...snap.data() });
      } else {
        // Backup check in case it's still in rose_pharm_seasons (migration support)
        getDoc(doc(db, "rose_pharm_seasons", id)).then(s => {
          if (s.exists()) setSeason({ id: s.id, ...s.data() });
        });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id, userData]);

  // Load Sub-Tournaments & Matches
  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, "amater_league_tournaments"), where("parentLeagueId", "==", id));
    const unsubscribe = onSnapshot(q, (snap) => {
      const subs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubTournaments(subs);
      
      if (subs.length > 0) {
        const subIds = subs.map(s => s.id);
        
        // 1. Load all matches for these tournaments
        const matchesQ = query(collection(db, "matches"), where("competitionId", "in", subIds));
        onSnapshot(matchesQ, (mSnap) => {
          setSeasonMatches(mSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // 2. Load all categories of these tournaments to get final rankings
        subIds.forEach(subId => {
          const catsQ = query(collection(db, "amater_league_tournaments", subId, "categories"));
          onSnapshot(catsQ, (cSnap) => {
            const newCats = cSnap.docs.map(d => ({ 
              id: d.id, 
              tournamentId: subId, 
              ...d.data() 
            }));
            
            // Update the pool of category data
            setTournamentCategories(prev => {
              const otherCats = prev.filter(c => c.tournamentId !== subId);
              return [...otherCats, ...newCats];
            });
          });
        });
      }
    });

    // Load Categories from the specialized collection
    const catsQ = query(collection(db, "amater_leagues", id, "categories"));
    onSnapshot(catsQ, (snap) => {
      const cats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSeasonCategories(cats);
      if (cats.length > 0 && !selectedCategoryId) setSelectedCategoryId(cats[0].id);
    });

    return () => unsubscribe();
  }, [id]);

  // Aggregated Standings
  const standings = useMemo(() => {
    if (!selectedCategoryId || !season) return [];
    
    // 1. Filtriraj mečeve koji nose taj sezonski tag
    const relevantMatches = seasonMatches.filter(m => 
      m.seasonalTag === selectedCategoryId
    );
    
    // 2. Izvuci finalRankings (playerId arrays) iz svih kategorija koje imaju taj seasonalTag
    const allTournamentRankings = tournamentCategories
      .filter(cat => cat.seasonalTag === selectedCategoryId && Array.isArray(cat.finalRankings))
      .map(cat => cat.finalRankings.map(r => r.playerId)); // Pretvori u niz ID-ova

    // 3. Uzmi points config za ovu sezonsku kategoriju
    const activeSeasonCat = seasonCategories.find(c => c.id === selectedCategoryId);
    
    const results = calculateSeasonStandings(allTournamentRankings, relevantMatches, activeSeasonCat);

    // Map names from allPlayers if missing (for cases where ranking only has playerIds)
    return results.map(p => {
      if (p.name === 'Igrač' || p.name === 'Nepoznat') {
        const fullPlayer = allPlayers.find(ap => ap.id === p.id);
        if (fullPlayer) return { ...p, name: fullPlayer.name, club: fullPlayer.club || p.club };
      }
      return p;
    });
  }, [seasonMatches, tournamentCategories, selectedCategoryId, seasonCategories, season, allPlayers]);

  const handleCreateSubTournament = async () => {
    const name = window.prompt("Unesite naziv novog turnira (npr. April 2026):");
    if (!name) return;
    setCreatingSub(true);
    
    // Generate a short 5-character ID
    const shortId = Math.random().toString(36).substring(2, 7).toUpperCase();
    
    try {
      const newTourney = {
        name: name,
        parentLeagueId: id,
        type: 'Groups',
        status: 'draft',
        ownerUid: season.ownerUid,
        createdAt: serverTimestamp(),
        isPublic: true,
        startDate: new Date().toISOString().split('T')[0]
      };
      
      // Use setDoc with the shortId instead of addDoc
      await setDoc(doc(db, "amater_league_tournaments", shortId), newTourney);
      alert("Turnir kreiran!");
    } catch (err) {
      alert("Greška pri kreiranju.");
    } finally {
      setCreatingSub(false);
    }
  };

  const handleUpdateSeasonSettings = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "amater_leagues", id), {
        isPublic: season.isPublic,
        slug: season.slug || season.name.trim().toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
        pointsSystem: season.pointsSystem
      });
      alert("Postavke spremljene!");
    } catch (err) {
      alert("Greška pri spremanju.");
    }
  };

  const handleDeleteSubTournament = async (subId, e) => {
    e.stopPropagation();
    if (window.confirm("Obriši ovaj turnir? Svi mečevi i rezultati će biti trajno uklonjeni.")) {
      try {
        await deleteDoc(doc(db, "amater_league_tournaments", subId));
      } catch (err) {
        alert("Greška pri brisanju.");
      }
    }
  };

  const handleCreateCategory = async () => {
    const name = window.prompt("Naziv kategorije (npr. Seniori, Veterani 40-50):");
    if (!name) return;
    try {
      await addDoc(collection(db, "amater_leagues", id, "categories"), {
        name,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      alert("Greška.");
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (window.confirm("Da li ste sigurni da želite obrisati ovu kategoriju?")) {
      try {
        await deleteDoc(doc(db, "amater_leagues", id, "categories", catId));
      } catch (err) {
        alert("Greška pri brisanju.");
      }
    }
  };

  if (loading) return <DashboardLayout><div className="p-20 text-center text-slate-500 font-black uppercase tracking-widest animate-pulse">Učitavanje Sezone...</div></DashboardLayout>;
  if (!season) return <DashboardLayout><div className="p-20 text-center text-red-500 font-black">Sezona nije pronađena.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 mb-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-6 text-white uppercase italic">
                <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20">
                  <Zap className="text-yellow-400 fill-yellow-400" size={32} />
                </div>
                <div>
                   <h1 className="text-3xl font-black tracking-tight">{season.name}</h1>
                   <div className="flex items-center gap-4 mt-1 text-[10px] font-bold tracking-widest text-slate-500">
                     <span className="bg-slate-800 px-3 py-1 rounded-full text-yellow-500 uppercase">Amater League Manager</span>
                     <span>•</span>
                     <span>{subTournaments.length} TURNIRA</span>
                   </div>
                </div>
              </div>
           </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/50 border border-slate-800 rounded-2xl mb-8 w-fit">
          {[
            { id: 'tournaments', label: 'Turniri', icon: List },
            { id: 'standings', label: 'Tabela Sezone', icon: Trophy },
            { id: 'settings', label: 'Pravila Sezone', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchParams({ tab: tab.id }); }}
              className={`flex items-center gap-2 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'tournaments' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white uppercase italic">Dostupni Turniri</h3>
                <button onClick={handleCreateSubTournament} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all">
                  <Plus size={16} /> Novi Turnir
                </button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subTournaments.map(sub => (
                   <div key={sub.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 group hover:border-blue-500/50 transition-all flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-black text-white uppercase italic truncate">{sub.name}</h4>
                        <button 
                          onClick={(e) => handleDeleteSubTournament(sub.id, e)}
                          className="p-2 bg-slate-800 hover:bg-red-600 text-slate-500 hover:text-white rounded-lg transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-6 flex items-center gap-2 flex-grow"><Calendar size={12}/>{sub.startDate}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <a 
                          href={`/public/competition/${sub.id}`} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2"
                        >
                           <ExternalLink size={12} /> Public
                        </a>
                        <button 
                          onClick={() => navigate(`/admin/seasons/${id}/tournaments/${sub.id}`)} 
                          className="py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40"
                        >
                           Upravljaj <ChevronRight size={12} />
                        </button>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'standings' && (
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="p-8 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-xl font-black text-white italic uppercase flex items-center gap-3">
                   <Trophy className="text-blue-500" /> Ukupni Poredak
                </h3>
                <div className="flex gap-2">
                   {seasonCategories.map(cat => (
                      <button 
                        key={cat.id} 
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategoryId === cat.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}
                      >
                         {cat.name}
                      </button>
                   ))}
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-slate-950/50 border-b border-slate-800">
                         <th className="py-5 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Poz</th>
                         <th className="py-5 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Igrač</th>
                         <th className="py-5 px-8 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Pobjede</th>
                         <th className="py-5 px-8 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Bonus</th>
                         <th className="py-5 px-8 text-center text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/5">Ukupno</th>
                      </tr>
                   </thead>
                   <tbody>
                      {standings.map((p, idx) => (
                         <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-all">
                            <td className="py-5 px-8"><span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${idx < 3 ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20' : 'bg-slate-800 text-slate-500'}`}>{idx + 1}</span></td>
                            <td className="py-5 px-8 text-white font-black uppercase text-xs italic">{p.name}<span className="block text-[10px] text-slate-500 font-bold tracking-widest not-italic">{p.club}</span></td>
                            <td className="py-5 px-8 text-center text-sm font-bold text-slate-400">{p.winPoints} pts</td>
                            <td className="py-5 px-8 text-center text-sm font-bold text-emerald-500">+{p.bonusPoints} pts</td>
                            <td className="py-5 px-8 text-center text-lg font-black text-blue-500 italic bg-blue-500/5">{p.totalPoints}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* General Settings */}
             <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 space-y-8">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                   <h3 className="text-xl font-black text-white uppercase italic flex items-center gap-3"><Settings className="text-blue-500" /> Osnovne Postavke</h3>
                   <button onClick={handleUpdateSeasonSettings} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Spremi Izmjene</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Javni Pristup</label>
                      <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                         <input 
                           type="checkbox" 
                           className="w-5 h-5 accent-blue-600"
                           checked={season.isPublic}
                           onChange={(e) => setSeason({...season, isPublic: e.target.checked})}
                         />
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vidljivo na javnom portalu</span>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Slug (URL link)</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-black text-white uppercase focus:border-blue-500 outline-none"
                        value={season.slug || ''}
                        onChange={(e) => setSeason({...season, slug: e.target.value.toLowerCase().replace(/ /g, '-')})}
                      />
                   </div>
                </div>
             </div>

             {/* Categories */}
             <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                   <h3 className="text-xl font-black text-white uppercase italic flex items-center gap-3"><LayoutGrid className="text-emerald-500" /> Kategorije</h3>
                   <button onClick={handleCreateCategory} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">+ Dodaj</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {seasonCategories.map(cat => (
                      <div key={cat.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex justify-between items-center group">
                         <span className="text-xs font-black text-white uppercase italic">{cat.name}</span>
                         <button 
                           onClick={() => handleDeleteCategory(cat.id)}
                           className="text-slate-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                         >
                            <Trash2 size={14} />
                         </button>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SeasonDetails;
