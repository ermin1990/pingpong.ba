import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore';
import PublicGroupStandings from '../components/public/PublicGroupStandings';
import PublicGroupMatches from '../components/public/PublicGroupMatches';
import { Trophy, Clock, Zap, Users, LayoutGrid, AlertTriangle, ChevronRight, CheckCircle, ArrowUp, ArrowDown, Share2, Code, Search } from 'lucide-react';

const KnockoutMatchCard = ({ match, isFinal = false }) => {
  const p1Win = match.status === 'completed' && match.player1Score > match.player2Score;
  const p2Win = match.status === 'completed' && match.player2Score > match.player1Score;
  
  return (
    <div 
      className={`block bg-gray-800/40 backdrop-blur-md rounded-lg border border-gray-700/50 shadow-xl transition-all duration-200 hover:scale-[1.02] knockout-match relative pt-[3px] my-[3px] ${isFinal ? 'ring-2 ring-amber-500/20' : ''}`}
    >
      {match.status !== 'completed' && match.player1?.name && match.player2?.name && (
        <div className="absolute -top-1 -right-1 z-20">
          <div className="bg-blue-600 text-[6px] font-black uppercase px-1.5 py-0.5 rounded shadow-lg animate-pulse border border-blue-400">
            UŽIVO
          </div>
        </div>
      )}
      
      <div className="px-3 md:px-4 pb-[3px]">
          {/* Home Player */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`player-name font-semibold truncate text-[11px] ${p1Win ? 'text-green-500 font-bold' : 'text-gray-300'}`}>
                  {match.player1?.name || "TBD"}
                </div>
            </div>
            <div className="flex-shrink-0 ml-2">
                <div className={`w-6 h-6 rounded flex items-center justify-center border border-white/5 badge-box ${p1Win ? 'bg-green-900/80' : 'bg-gray-800'}`}>
                    <div className="text-xs font-bold text-white badge-number">
                      {match.player1Score || 0}
                    </div>
                </div>
            </div>
          </div>

          {/* Away Player */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`player-name font-semibold truncate text-[11px] ${p2Win ? 'text-green-500 font-bold' : 'text-gray-300'}`}>
                  {match.player2?.name || "TBD"}
                </div>
            </div>
            <div className="flex-shrink-0 ml-2">
                <div className={`w-6 h-6 rounded flex items-center justify-center border border-white/5 badge-box ${p2Win ? 'bg-green-900/80' : 'bg-gray-800'}`}>
                    <div className="text-xs font-bold text-white badge-number">
                      {match.player2Score || 0}
                    </div>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};

const PublicCompetition = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  
  const selectedCategoryId = searchParams.get('category') || '';
  const activeTab = searchParams.get('tab') || 'groups';
  const isEmbed = searchParams.get('embed') === 'true';

  const activeCategory = useMemo(() => 
    categories.find(c => c.id === selectedCategoryId), 
    [categories, selectedCategoryId]
  );

  const [allMatches, setAllMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [manualOrders, setManualOrders] = useState({});
  const [playerNames, setPlayerNames] = useState({});
  const [allPlayers, setAllPlayers] = useState([]);
  const [knockoutZoom, setKnockoutZoom] = useState(1);

  useEffect(() => {
    let unsubscribeCats = null;

    const fetchBySlug = async () => {
      try {
        const q = query(collection(db, "competitions"), where("slug", "==", slug));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const compDoc = snap.docs[0];
          const compData = { id: compDoc.id, ...compDoc.data() };
          setCompetition(compData);

          // Fetch full player data for this organization
          if (compData.organizationId) {
            const pQ = query(collection(db, "players"), where("organizationId", "==", compData.organizationId));
            getDocs(pQ).then(pSnap => {
              const playersList = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
              setAllPlayers(playersList);
              
              const names = {};
              playersList.forEach(p => {
                names[p.id] = p.name;
              });
              setPlayerNames(names);
            });
          }
          
          // Fetch categories
          const catQ = query(collection(db, "competitions", compDoc.id, "categories"));
          unsubscribeCats = onSnapshot(catQ, (catSnap) => {
            const cats = catSnap.docs.map(d => ({ id: d.id, ...d.data() }))
              .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setCategories(cats);

            // Fetch manual orders for all categories
            cats.forEach(async (cat) => {
              const ordersQ = query(collection(db, "competitions", compDoc.id, "categories", cat.id, "manualOrders"));
              const ordersSnap = await getDocs(ordersQ);
              const orders = {};
              ordersSnap.docs.forEach(d => {
                orders[d.id] = d.data().order;
              });
              setManualOrders(prev => ({ ...prev, [cat.id]: orders }));
            });
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBySlug();

    return () => {
      if (unsubscribeCats) unsubscribeCats();
    };
  }, [slug]);

  useEffect(() => {
    if (competition) {
      const q = query(
        collection(db, "matches"), 
        where("competitionId", "==", competition.id)
      );
      
      const unsubscribe = onSnapshot(q, (snap) => {
        setAllMatches(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }
  }, [competition]);

  const matches = useMemo(() => {
    if (!selectedCategoryId) return [];
    return allMatches.filter(m => m.categoryId === selectedCategoryId);
  }, [allMatches, selectedCategoryId]);

  const handleCategorySelect = (catId) => {
    const cat = categories.find(c => c.id === catId);
    // Ako nema grupa, prebaci odmah na knockout
    const hasGroups = cat?.groupConfig && Object.keys(cat.groupConfig).length > 0;
    
    setSearchParams({ 
      category: catId, 
      tab: hasGroups ? 'groups' : 'knockout' 
    });
    setSearchTerm('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setActiveTab = (tab) => {
    setSearchParams({ category: selectedCategoryId, tab });
  };

  const setSelectedCategoryId = (catId) => {
    if (!catId) {
      setSearchParams({});
    } else {
      handleCategorySelect(catId);
    }
  };
  
  const groups = useMemo(() => {
    if (!activeCategory || !activeCategory.groupConfig) return [];
    const config = activeCategory.groupConfig;
    const gArray = [];
    Object.keys(config).sort((a, b) => Number(a) - Number(b)).forEach(key => {
      gArray.push(config[key].map(id => ({ 
        id, 
        name: playerNames[id] || "Nepoznat" 
      })));
    });
    return gArray;
  }, [activeCategory, playerNames]);

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
      pointDiff: 0
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

        // Gem difference (pointDiff)
        if (m.sets && Array.isArray(m.sets)) {
          m.sets.forEach(set => {
            p1.pointDiff += (set.player1 || set.p1 || 0) - (set.player2 || set.p2 || 0);
            p2.pointDiff += (set.player2 || set.p2 || 0) - (set.player1 || set.p1 || 0);
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

    // Handle Manual Order
    const catOrders = manualOrders[selectedCategoryId] || {};
    if (catOrders[groupIdx]) {
      const order = catOrders[groupIdx];
      return stats.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    }

    return stats.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const setDiffA = a.setsWon - a.setsLost;
      const setDiffB = b.setsWon - b.setsLost;
      if (setDiffB !== setDiffA) return setDiffB - setDiffA;
      return b.pointDiff - a.pointDiff;
    });
  };

  const knockoutRounds = useMemo(() => {
    const ko = matches.filter(m => m.isKnockout);
    const rounds = {};
    ko.forEach(m => {
      const rName = m.roundName || `Runda ${m.round}`;
      if (!rounds[rName]) rounds[rName] = [];
      rounds[rName].push(m);
    });

    const sortedNames = Object.keys(rounds).sort((a, b) => {
      const getRoundWeight = (name) => {
        const rNum = rounds[name][0]?.round || 0;
        const n = name.toLowerCase();
        if ((n === 'finale' || n === 'final') || (n.includes('finale') && !n.includes('polu') && !n.includes('1/'))) return 2000;
        if (n.includes('polufinale')) return 1000;
        if (n.includes('1/4')) return 500;
        if (n.includes('1/8')) return 250;
        if (n.includes('1/16')) return 125;
        if (n.includes('1/32')) return 60;
        return rNum;
      };
      return getRoundWeight(a) - getRoundWeight(b);
    });

    return sortedNames.map(name => ({ 
      name, 
      matches: rounds[name].sort((a, b) => {
        // Logičko slaganje mečeva odozgo prema dole
        if (a.bracketSide !== b.bracketSide) {
           return a.bracketSide === 'lijevi' ? -1 : 1;
        }
        return (a.bracketIndex || 0) - (b.bracketIndex || 0);
      })
    }));
  }, [matches]);

  if (loading) return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
      <div className="text-blue-500 animate-pulse font-black uppercase tracking-widest text-xl italic flex items-center gap-3">
         <Trophy className="animate-bounce" /> Učitavanje...
      </div>
    </div>
  );

  if (!competition) return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-8 text-center">
      <AlertTriangle size={48} className="text-red-500 mb-4" />
      <h1 className="text-2xl font-black text-white uppercase italic mb-2">Takmičenje nije pronađeno</h1>
      <p className="text-slate-500 text-sm max-w-sm">Provjerite da li je link ispravan ili je takmičenje možda uklonjeno.</p>
      <Link to="/" className="mt-8 text-blue-500 font-bold uppercase text-xs hover:underline">Nazad na početnu</Link>
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#070b14] text-slate-200 font-sans ${!isEmbed ? 'pb-20' : 'pb-4'}`}>
      {/* Header */}
      {!isEmbed && (
        <header className="bg-slate-950/50 backdrop-blur-xl border-b border-slate-900 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
            <div 
               className="flex items-center gap-4 cursor-pointer group"
               onClick={() => setSelectedCategoryId('')}
            >
               <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/40 group-hover:scale-110 transition-transform">
                  <Trophy size={24} className="text-white" />
               </div>
               <div>
                  <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{competition.name}</h1>
                  <div className="flex items-center gap-2 mt-2">
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                     <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest leading-none">Public Portal</p>
                  </div>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
              {selectedCategoryId && (
                <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link kategorije kopiran!');
                    }}
                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-all"
                    title="Kopiraj link"
                  >
                    <Share2 size={16} />
                  </button>
                  <button 
                    onClick={() => setShowEmbedCode(true)}
                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-all"
                    title="Prikaži kod za ugradnju (iframe)"
                  >
                    <Code size={16} />
                  </button>
                </div>
              )}
              {selectedCategoryId && (
                <button 
                  onClick={() => setSelectedCategoryId('')}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-slate-700 transition-all flex items-center gap-2"
                >
                  <LayoutGrid size={14} /> Sve Kategorije
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      <main className={`max-w-7xl mx-auto px-6 ${!isEmbed ? 'py-10' : 'py-4'}`}>
        {/* Category Quick Switch (Horizontal Scroll when one is selected) */}
        {!isEmbed && selectedCategoryId && (
          <div className="flex overflow-x-auto pb-4 mb-10 gap-2 custom-scrollbar no-scrollbar">
            <button 
                onClick={() => setSelectedCategoryId('')}
                className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap hover:text-white transition-all flex items-center gap-2"
            >
                <LayoutGrid size={12} /> Sve
            </button>
            {categories.map(cat => (
                <button 
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${selectedCategoryId === cat.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 box-border border border-blue-500' : 'bg-slate-900/50 border border-slate-800 text-slate-500 hover:text-slate-300'}`}
                >
                    <Trophy size={12} /> {cat.name}
                    {allMatches.filter(m => m.categoryId === cat.id && m.status !== 'completed' && m.player1?.name && m.player2?.name).length > 0 && (
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" title="Mečevi u toku"></div>
                    )}
                </button>
            ))}
          </div>
        )}

        {!selectedCategoryId ? (
          <div className="space-y-12">
            {/* CATEGORY SELECT GRID */}
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                    <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Takmičarske Kategorije</h2>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] max-w-sm mx-auto">Izaberite željenu kategoriju da biste vidjeli trenutne rezultate, tabelu i eliminacije</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {categories.map(cat => {
                        const liveMatches = allMatches.filter(m => m.categoryId === cat.id && m.status !== 'completed' && m.player1?.name && m.player2?.name).length;
                        const totalMatches = allMatches.filter(m => m.categoryId === cat.id).length;
                        const completedMatches = allMatches.filter(m => m.categoryId === cat.id && m.status === 'completed').length;
                        
                        return (
                            <div 
                                key={cat.id}
                                onClick={() => handleCategorySelect(cat.id)}
                                className="bg-slate-900/40 border border-slate-800 p-6 md:p-8 rounded-[2rem] hover:border-blue-500/40 hover:bg-slate-900/80 transition-all cursor-pointer group relative overflow-hidden shadow-2xl flex flex-col gap-6"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                                    <Trophy size={80} />
                                </div>
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-xl shadow-blue-600/20">
                                                <Zap size={20} className="text-white" />
                                            </div>
                                            {liveMatches > 0 && (
                                                <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full border border-red-500 shadow-lg shadow-red-600/20">
                                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                                    <span className="text-[9px] font-black text-white uppercase tracking-widest">LIVE</span>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter group-hover:text-blue-500 transition-colors">{cat.name}</h3>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-70">
                                                {cat.format === 'round_robin' ? 'Round Robin Liga' : 'Grupna faza i eliminacije'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-8 pt-6 border-t border-slate-800/50">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-slate-600 font-bold uppercase tracking-[0.2em] mb-1">Napredak</span>
                                                <span className="text-xs font-black text-white uppercase">
                                                    {totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0}%
                                                </span>
                                            </div>
                                            <div className="flex flex-col text-right">
                                                <span className="text-[8px] text-slate-600 font-bold uppercase tracking-[0.2em] mb-1">Učesnici</span>
                                                <span className="text-xs font-black text-blue-500 uppercase">{cat.playerIds?.length || 0} igrača</span>
                                            </div>
                                        </div>
                                        
                                        <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                                                style={{ width: `${totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0}%` }}
                                            />
                                        </div>

                                        <div className="flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase tracking-widest pt-6 group-hover:gap-4 transition-all opacity-80 group-hover:opacity-100 group-hover:text-blue-400">
                                            Otvori rezultate <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {categories.length === 0 && (
                    <div className="text-center py-32 border-2 border-dashed border-slate-900 rounded-[3rem]">
                        <LayoutGrid size={64} className="mx-auto text-slate-900 mb-6" />
                        <h3 className="text-xl font-black text-slate-700 uppercase italic tracking-tighter">Nema aktivnih kategorija</h3>
                        <p className="text-[10px] text-slate-800 font-bold uppercase tracking-widest mt-2">Trenutno ne postoje otvorene kategorije za ovo takmičenje.</p>
                    </div>
                )}
            </div>

            {/* SEARCH BAR (Global na dnu naslovne strane ili za pretragu igrača kroz sve kategorije) */}
            <div className="max-w-2xl mx-auto space-y-6 pt-10 border-t border-slate-900/50">
                <div className="text-center">
                    <h3 className="text-xs font-black text-slate-600 uppercase tracking-[0.3em] mb-4 text-center">Ili pretraži igrača direktno</h3>
                </div>
                <div className="relative group">
                    <input 
                        type="text" 
                        placeholder="Upiši ime igrača..." 
                        className="w-full bg-slate-950 border-2 border-slate-900 rounded-[2rem] py-5 pl-16 pr-8 text-sm text-white font-bold outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700 shadow-2xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors" size={24} />
                </div>
            </div>

            {searchTerm.length > 0 && (
                // SEARCH RESULTS VIEW
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-600 pt-10">
                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-6 px-4">
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Rezultati Pretrage</h2>
                        <button onClick={() => setSearchTerm('')} className="text-[10px] text-slate-600 font-black uppercase tracking-widest hover:text-white transition-colors">Poništi</button>
                    </div>

                    {(() => {
                        const searchLower = searchTerm.toLowerCase();
                        const results = allMatches.filter(m => 
                            m.player1?.name?.toLowerCase().includes(searchLower) || 
                            m.player2?.name?.toLowerCase().includes(searchLower)
                        );
                        
                        if (results.length === 0) {
                            return (
                                <div className="text-center py-24 bg-slate-950/30 rounded-[3rem] border border-slate-900/50">
                                    <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-800">
                                        <Search size={32} />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-700 uppercase italic tracking-tighter mb-2">Nema rezultata</h3>
                                    <p className="text-[10px] text-slate-800 font-bold uppercase tracking-widest px-8">Nažalost, nismo pronašli nijedan meč za igrača "{searchTerm}"</p>
                                </div>
                            );
                        }

                        // Group by category
                        const matchesByCat = {};
                        results.forEach(m => {
                            if (!matchesByCat[m.categoryId]) matchesByCat[m.categoryId] = [];
                            matchesByCat[m.categoryId].push(m);
                        });

                        return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Object.keys(matchesByCat).map(catId => {
                                    const catName = categories.find(c => c.id === catId)?.name || 'Kategorija';
                                    const catMatches = matchesByCat[catId].sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

                                    return (
                                        <div key={catId} className="bg-slate-900/60 border border-blue-500/10 rounded-[2.5rem] p-8 backdrop-blur-sm hover:border-blue-500/20 transition-all">
                                            <div className="flex items-center justify-between mb-8">
                                                <h3 className="text-xl font-black text-blue-500 uppercase italic tracking-tighter flex items-center gap-3">
                                                    <Trophy size={20} className="text-blue-500/50" /> {catName}
                                                </h3>
                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-slate-900">{catMatches.length} mečeva</span>
                                            </div>
                                            <div className="space-y-4">
                                                {catMatches.map(match => {
                                                    const p1Matches = match.player1?.name?.toLowerCase().includes(searchLower);
                                                    const p2Matches = match.player2?.name?.toLowerCase().includes(searchLower);
                                                    const p1Win = match.player1Score > match.player2Score;
                                                    const p2Win = match.player2Score > match.player1Score;
                                                    const isLive = match.status !== 'completed' && match.player1?.name && match.player2?.name;
                                                    
                                                    return (
                                                        <div key={match.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-900/80 hover:border-slate-800 transition-all flex flex-col gap-4 group">
                                                            <div className="flex justify-between items-center border-b border-slate-900/50 pb-3">
                                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                                                    {match.isKnockout ? (match.roundName || `Runda ${match.round}`) : `Grupa ${String.fromCharCode(65 + (match.groupId || 0))}`}
                                                                </span>
                                                                {isLive ? (
                                                                    <div className="flex items-center gap-2 bg-red-600/10 px-2 py-1 rounded border border-red-600/20">
                                                                        <div className="w-1 h-1 bg-red-600 rounded-full animate-pulse" />
                                                                        <span className="text-[8px] font-black text-red-600 uppercase">UŽIVO</span>
                                                                    </div>
                                                                ) : match.status === 'completed' && (
                                                                    <CheckCircle size={12} className="text-emerald-500/40" />
                                                                )}
                                                            </div>
                                                            
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between items-center">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className={`w-1.5 h-1.5 rounded-full ${p1Win && match.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-transparent'}`} />
                                                                        <p className={`text-xs font-bold uppercase truncate ${p1Win && match.status === 'completed' ? 'text-white' : 'text-slate-500'} ${p1Matches ? 'text-blue-500 font-black' : ''}`}>
                                                                            {match.player1.name}
                                                                        </p>
                                                                    </div>
                                                                    <span className={`text-sm font-black ${p1Win && match.status === 'completed' ? 'text-blue-500' : 'text-slate-700'}`}>{match.player1Score || 0}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className={`w-1.5 h-1.5 rounded-full ${p2Win && match.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-transparent'}`} />
                                                                        <p className={`text-xs font-bold uppercase truncate ${p2Win && match.status === 'completed' ? 'text-white' : 'text-slate-500'} ${p2Matches ? 'text-blue-500 font-black' : ''}`}>
                                                                            {match.player2.name}
                                                                        </p>
                                                                    </div>
                                                                    <span className={`text-sm font-black ${p2Win && match.status === 'completed' ? 'text-blue-500' : 'text-slate-700'}`}>{match.player2Score || 0}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </div>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {/* Phase Selector TABS */}
            <div className="flex justify-center flex-wrap gap-3 md:gap-4 p-2 bg-slate-950/50 border border-slate-900 rounded-[2rem] max-w-lg mx-auto">
               <button 
                 onClick={() => setActiveTab('players')}
                 className={`flex-1 min-w-[100px] py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'players' ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30' : 'text-slate-500 hover:text-white'}`}
               >
                 <Users size={16} /> Igrači
               </button>
               <button 
                 onClick={() => setActiveTab('groups')}
                 className={`flex-1 min-w-[100px] py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'groups' ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30' : 'text-slate-500 hover:text-white'}`}
               >
                 <LayoutGrid size={16} /> Grupe
               </button>
               <button 
                 onClick={() => setActiveTab('knockout')}
                 className={`flex-1 min-w-[100px] py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'knockout' ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30' : 'text-slate-500 hover:text-white'}`}
               >
                 <Zap size={16} /> Eliminacije
               </button>
            </div>

            {/* Category Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               {activeTab === 'players' && (
                  <div className="bg-slate-900/40 backdrop-blur-xl rounded-xl p-8 border border-slate-800 shadow-xl max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="h-8 w-1.5 bg-blue-500 rounded-full"></div>
                       <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Spisak Učesnika</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {(() => {
                           // Prefer playerIds if saved, fallback to groupConfig
                           let categoryPlayerIds = activeCategory.playerIds || [];
                           
                           if (categoryPlayerIds.length === 0 && activeCategory.groupConfig) {
                             categoryPlayerIds = Array.isArray(activeCategory.groupConfig) 
                               ? activeCategory.groupConfig.flat() 
                               : Object.values(activeCategory.groupConfig).flat();
                           }
                           
                           const participatingPlayers = allPlayers
                             .filter(p => categoryPlayerIds.includes(p.id))
                             .sort((a,b) => a.name.localeCompare(b.name));

                           if (participatingPlayers.length === 0) {
                             return <div className="col-span-full py-12 text-center text-slate-500 font-bold uppercase text-[10px] tracking-widest">Nema registrovanih igrača za ovu kategoriju</div>;
                           }

                           return participatingPlayers.map((player, idx) => (
                             <div key={player.id} className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 group hover:border-blue-500/50 transition-all">
                               <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-xs font-black text-slate-500 group-hover:text-blue-500 transition-colors">
                                 {idx + 1}
                               </div>
                               <div className="min-w-0">
                                 <p className="text-sm font-black text-white uppercase truncate">{player.name}</p>
                                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">{player.club || 'Individual'}</p>
                               </div>
                             </div>
                           ));
                       })()}
                    </div>
                  </div>
               )}

               {activeTab === 'groups' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                     {groups.map((group, gIdx) => {
                        const standings = calculateStandings(gIdx);
                        const groupMatches = matches
                          .filter(m => m.groupId === gIdx && !m.isKnockout)
                          .sort((a, b) => (a.round || 0) - (b.round || 0) || (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
                        const advancingCount = activeCategory.advancingPlayers || 2;
                        
                        return (
                          <div key={gIdx} className="bg-slate-900/40 backdrop-blur-xl rounded-xl p-4 md:p-6 border border-slate-800 shadow-xl">
                             <h4 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4">Grupa {String.fromCharCode(65 + gIdx)}</h4>
                             <PublicGroupStandings standings={standings} advancingCount={advancingCount} />
                             <PublicGroupMatches matches={groupMatches} />
                          </div>
                        );
                     })}

                     {groups.length === 0 && (
                        <div className="lg:col-span-2 py-32 text-center border-2 border-dashed border-slate-900 rounded-[3rem]">
                           <LayoutGrid size={64} className="mx-auto mb-6 text-slate-900" />
                           <h4 className="text-xl font-black text-slate-700 uppercase italic tracking-tighter">Nema grupne faze</h4>
                           <p className="text-[10px] text-slate-800 font-bold uppercase tracking-widest mt-2 px-8">Ova kategorija možda koristi direktni eliminacioni sistem.</p>
                           {matches.some(m => m.isKnockout) && (
                              <button 
                                onClick={() => setActiveTab('knockout')}
                                className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20"
                              >
                                Pogledaj Eliminacije
                              </button>
                           )}
                        </div>
                     )}
                  </div>
               )}

               {activeTab === 'knockout' && (
                  <div className="space-y-8">
                     <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                           <div className="h-8 w-1.5 bg-amber-500 rounded-full"></div>
                           <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Eliminaciona Faza</h3>
                        </div>
                     </div>

                     <div className="bg-slate-900/40 backdrop-blur-xl rounded-xl p-4 md:p-6 border border-slate-800 shadow-xl">
                        {(() => {
                           // Kalkulacija broja mečeva
                           const totalMatches = knockoutRounds.reduce((sum, r) => sum + r.matches.length, 0);
                           const maxMatchesInRound = Math.max(...knockoutRounds.map(r => r.matches.length), 1);
                           
                           // Automatsko skaliranje na osnovu broja mečeva
                           const autoScale = maxMatchesInRound > 8 ? 0.7 : maxMatchesInRound > 4 ? 0.85 : 1;
                           const finalScale = knockoutZoom * autoScale;
                           
                           // Prikaži zoom kontrole samo ako ima više od 4 meča u bilo kojoj rundi
                           const showZoomControls = maxMatchesInRound > 4;
                           
                           return (
                              <>
                                 {showZoomControls && (
                                    <div className="flex justify-end mb-2">
                                       <div className="flex items-center gap-2">
                                          <button 
                                             onClick={() => setKnockoutZoom(prev => Math.max(0.5, prev - 0.1))}
                                             type="button" 
                                             className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold transition-all border border-slate-700"
                                             title="Smanji"
                                          >
                                             −
                                          </button>
                                          <span className="text-xs text-slate-500 font-bold min-w-[40px] text-center">
                                             {Math.round(finalScale * 100)}%
                                          </span>
                                          <button 
                                             onClick={() => setKnockoutZoom(prev => Math.min(1.5, prev + 0.1))}
                                             type="button"
                                             className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold transition-all border border-slate-700"
                                             title="Povećaj"
                                          >
                                             +
                                          </button>
                                       </div>
                                    </div>
                                 )}
                                 
                                 <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 pb-6">
                                    <div className="min-w-max">
                          <div 
                            className="flex-1 flex flex-row h-full custom-scrollbar knockout-bracket-container transition-transform duration-200" 
                            style={{ 
                              gap: '16px', 
                              justifyContent: 'center', 
                              overflowX: 'hidden',
                              transform: `scale(${finalScale})`, 
                              transformOrigin: 'top left' 
                            }}
                          >
                          {knockoutRounds.map((round, rIdx) => {
                            const baseUnit = 32;
                            const roundExtra = round.matches.length >= 4 ? 12 : round.matches.length === 3 ? 6 : 0;
                            const roundUnit = baseUnit + roundExtra;
                            const columnHeight = roundUnit * maxMatchesInRound * 2;

                            return (
                            <div key={rIdx} className="flex-1 flex flex-col knockout-column h-full transition-all duration-300" style={{ gap: '5px', minWidth: '200px', flex: '1 1 0%' }}>
                              <div className="text-center mb-4">
                                <h3 className="text-lg font-bold text-amber-400 uppercase tracking-widest border-b border-amber-400/30 pb-2">
                                  {round.name}
                                </h3>
                              </div>
                                             
                              <div className="relative w-full" style={{ height: `${columnHeight}px` }}>
                                {round.matches.map((match, mIdx) => {
                                  const center = roundUnit * (Math.pow(2, rIdx) + mIdx * Math.pow(2, rIdx + 1));
                                  return (
                                  <div 
                                    key={match.id}
                                    className="absolute left-0 right-0 flex justify-center"
                                    style={{ top: `${center}px`, transform: 'translateY(-50%)' }}
                                  >
                                    <div className="w-full max-w-[260px]">
                                      <KnockoutMatchCard 
                                        match={match} 
                                        isFinal={round.name.toLowerCase().includes('finale') && !round.name.toLowerCase().includes('polu')} 
                                      />
                                    </div>
                                  </div>
                                  );
                                })}
                              </div>
                            </div>
                            );
                          })}
                          </div>
                                    </div>
                                 </div>
                              </>
                           );
                        })()}

                        {knockoutRounds.length === 0 && (
                          <div className="w-full py-32 text-center border-2 border-dashed border-slate-900 rounded-[3rem] mx-auto max-w-xl">
                             <Zap size={64} className="mx-auto mb-6 text-slate-900" />
                             <h4 className="text-xl font-black text-slate-700 uppercase italic tracking-tighter">Eliminacije još nisu počele</h4>
                             <p className="text-[10px] text-slate-800 font-bold uppercase tracking-widest mt-2 px-8">Kada grupna faza bude završena, ovdje će se pojaviti žrijeb (bracket).</p>
                          </div>
                        )}
                     </div>
                  </div>
               )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      {!isEmbed && (
        <footer className="mt-20 border-t border-slate-900/50 py-16 text-center">
           <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-8 h-8 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
                  <Trophy size={16} className="text-slate-400" />
              </div>
              <span className="text-lg font-black text-white uppercase italic tracking-tighter">TeamSphere</span>
           </div>
           <p className="text-[10px] text-slate-800 font-bold uppercase tracking-widest">
              Automated Tournament Management System &copy; {new Date().getFullYear()}
           </p>
        </footer>
      )}

      {/* Embed Modal */}
      {showEmbedCode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-[#070b14]/90 backdrop-blur-md" onClick={() => setShowEmbedCode(false)}></div>
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                  <Code className="text-emerald-500" /> Ugradi na svoj blog
               </h3>
               <button onClick={() => setShowEmbedCode(false)} className="text-slate-500 hover:text-white transition-colors">
                  <ArrowDown size={20} />
               </button>
            </div>
            
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
               Iskopirajte kod ispod i zalijepite ga na svoju web stranicu kako biste prikazali rezultate <strong>{activeCategory?.name}</strong> uživo.
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400/80 break-all mb-6 relative group">
               {`<iframe src="${window.location.origin}/p/${slug}?category=${selectedCategoryId}&embed=true" width="100%" height="800" frameborder="0"></iframe>`}
               <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`<iframe src="${window.location.origin}/p/${slug}?category=${selectedCategoryId}&embed=true" width="100%" height="800" frameborder="0"></iframe>`);
                    alert('Kod kopiran!');
                  }}
                  className="absolute right-3 top-3 bg-slate-800 p-2 rounded-lg text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
               >
                  Kopiraj
               </button>
            </div>

            <button 
              onClick={() => setShowEmbedCode(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-widest py-4 rounded-2xl transition-all"
            >
              Zatvori
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicCompetition;
