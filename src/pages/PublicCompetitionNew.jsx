import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore';
import PublicGroupStandings from '../components/public/PublicGroupStandings';
import PublicGroupMatches from '../components/public/PublicGroupMatches';
import { Trophy, Clock, Zap, Users, LayoutGrid, AlertTriangle, ChevronRight, ChevronDown, CheckCircle, ArrowUp, ArrowDown, Share2, Code, Search, ShieldCheck, Calendar, MapPin, Phone, Mail, MapPinned, Award, DollarSign, ClockIcon, Timer } from 'lucide-react';

// Helper za formatiranje datuma u dd.mm.yyyy. format
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}.`;
};

// Countdown komponenta
const Countdown = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        setIsExpired(true);
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (isExpired) return null;

  return (
    <div className="flex gap-2 min-w-fit">
      {[
        { label: 'DANA', val: timeLeft.days },
        { label: 'SATI', val: timeLeft.hours },
        { label: 'MIN', val: timeLeft.minutes },
        { label: 'SEC', val: timeLeft.seconds }
      ].map((item, idx) => (
        <div key={idx} className="flex flex-col items-center bg-white/10 dark:bg-white/5 border border-white/20 px-2 py-1.5 rounded-lg min-w-[45px] animate-in fade-in zoom-in duration-300">
          <span className="text-lg font-black leading-none tabular-nums text-white">{item.val}</span>
          <span className="text-[7px] font-black uppercase tracking-tighter text-white/70 mt-1">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

// Knockout card komponenta
const KnockoutMatchCard = ({ match, isFinal = false }) => {
  const p1Win = match.status === 'completed' && match.player1Score > match.player2Score;
  const p2Win = match.status === 'completed' && match.player2Score > match.player1Score;
  
  const hasScore = (match.player1Score > 0 || match.player2Score > 0);
  const isLive = match.status !== 'completed' && 
                match.player1?.name && match.player1?.id !== 'tbd' && 
                match.player2?.name && match.player2?.id !== 'tbd' && 
                hasScore;

  const hasSets = match.sets && match.sets.some(s => s.p1 > 0 || s.p2 > 0);

  return (
    <div 
      className={`block bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-xl transition-all duration-200 hover:scale-[1.02] knockout-match relative pt-[3px] my-[3px] ${isFinal ? 'ring-2 ring-amber-500/20' : ''}`}
    >
      {isLive && (
        <div className="absolute -top-1 -right-1 z-20">
          <div className="bg-blue-600 text-[6px] font-black uppercase px-1.5 py-0.5 rounded shadow-lg border border-blue-400 text-white">
            UŽIVO
          </div>
        </div>
      )}
      
      <div className="px-3 md:px-4 py-2">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                <div className={`player-name font-semibold truncate text-[13px] ${p1Win ? 'text-emerald-600 dark:text-green-500 font-bold' : 'text-slate-500 dark:text-gray-300'}`}>
                  {match.player1?.name || "TBD"}
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                {hasSets && (
                  <div className="flex gap-0.5 justify-end">
                    {match.sets.map((s, idx) => (s.p1 > 0 || s.p2 > 0) && (
                      <div key={idx} className="w-4 text-center">
                        <span className={`text-[10px] leading-none font-bold block ${s.p1 > s.p2 ? 'text-slate-600 dark:text-gray-300' : 'text-slate-300 dark:text-gray-600'}`}>
                          {s.p1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex-shrink-0">
                    <div className={`w-7 h-7 rounded flex items-center justify-center border border-slate-100 dark:border-white/5 badge-box ${p1Win ? 'bg-emerald-50 dark:bg-green-900/80' : 'bg-slate-50 dark:bg-gray-800'}`}>
                        <div className={`text-sm font-bold badge-number ${p1Win ? 'text-emerald-700 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                          {match.player1Score || 0}
                        </div>
                    </div>
                </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                <div className={`player-name font-semibold truncate text-[13px] ${p2Win ? 'text-emerald-600 dark:text-green-500 font-bold' : 'text-slate-500 dark:text-gray-300'}`}>
                  {match.player2?.name || "TBD"}
                </div>
            </div>

            <div className="flex items-center gap-3">
                {hasSets && (
                  <div className="flex gap-0.5 justify-end">
                    {match.sets.map((s, idx) => (s.p1 > 0 || s.p2 > 0) && (
                      <div key={idx} className="w-4 text-center">
                        <span className={`text-[10px] leading-none font-bold block ${s.p2 > s.p1 ? 'text-slate-600 dark:text-gray-300' : 'text-slate-300 dark:text-gray-600'}`}>
                          {s.p2}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex-shrink-0">
                    <div className={`w-7 h-7 rounded flex items-center justify-center border border-slate-100 dark:border-white/5 badge-box ${p2Win ? 'bg-emerald-50 dark:bg-green-900/80' : 'bg-slate-50 dark:bg-gray-800'}`}>
                        <div className={`text-sm font-bold badge-number ${p2Win ? 'text-emerald-700 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                          {match.player2Score || 0}
                        </div>
                    </div>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};

const PublicCompetitionNew = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  
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
        let compDoc = null;
        const q = query(collection(db, "competitions"), where("slug", "==", slug));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          compDoc = snap.docs[0];
        } else {
          const dSnap = await getDoc(doc(db, "competitions", slug));
          if (dSnap.exists()) {
            compDoc = dSnap;
          }
        }
        
        if (compDoc) {
          const compData = { id: compDoc.id, ...compDoc.data() };
          setCompetition(compData);

          if (compData.ownerUid) {
            const pQ = query(collection(db, "players"), where("ownerUid", "==", compData.ownerUid));
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
          
          const catQ = query(collection(db, "competitions", compDoc.id, "categories"));
          unsubscribeCats = onSnapshot(catQ, (catSnap) => {
            const cats = catSnap.docs.map(d => ({ id: d.id, ...d.data() }))
              .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setCategories(cats);

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
        } else {
          setError("Takmičenje nije pronađeno.");
        }
      } catch (err) {
        console.error(err);
        setError("Došlo je do greške prilikom učitavanja podataka.");
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
    const hasGroups = cat?.groupConfig && Object.keys(cat.groupConfig).length > 0;
    
    setSearchParams({ 
      category: catId, 
      tab: hasGroups ? 'groups' : 'knockout' 
    });
    setSearchTerm('');
    
    // Scroll to category nav instead of top
    setTimeout(() => {
      const categoryNav = document.getElementById('category-nav');
      if (categoryNav) {
        const navTop = categoryNav.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: navTop - 20, behavior: 'smooth' });
      }
    }, 100);
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

        if (m.sets && Array.isArray(m.sets)) {
          m.sets.forEach(set => {
            p1.pointDiff += (set.p1 || 0) - (set.p2 || 0);
            p2.pointDiff += (set.p2 || 0) - (set.p1 || 0);
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
        if (a.bracketSide !== b.bracketSide) {
           return a.bracketSide === 'lijevi' ? -1 : 1;
        }
        return (a.bracketIndex || 0) - (b.bracketIndex || 0);
      })
    }));
  }, [matches]);

  if (loading) return (
    <div className="min-h-screen bg-white dark:bg-[#070b14] flex items-center justify-center">
      <div className="text-blue-500 animate-pulse font-black uppercase tracking-widest text-xl italic flex items-center gap-3">
         <Trophy className="animate-bounce" /> Učitavanje...
      </div>
    </div>
  );

  if (!competition) return (
    <div className="min-h-screen bg-white dark:bg-[#070b14] flex flex-col items-center justify-center p-8 text-center">
      <AlertTriangle size={48} className="text-red-500 mb-4" />
      <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic mb-2">Takmičenje nije pronađeno</h1>
      <p className="text-slate-500 text-sm max-w-sm">Provjerite da li je link ispravan ili je takmičenje možda uklonjeno.</p>
      <Link to="/" className="mt-8 text-blue-500 font-bold uppercase text-xs hover:underline">Nazad na početnu</Link>
    </div>
  );

  if (!competition.isPublic) return (
    <div className="min-h-screen bg-white dark:bg-[#070b14] flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center mb-6 border border-slate-200 dark:border-slate-800 shadow-xl">
        <ShieldCheck size={40} className="text-blue-500/20" />
      </div>
      <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4">Privatno Takmičenje</h1>
      <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8 font-medium">Organizator trenutno nije omogućio javni pristup rezultatima za ovo takmičenje.</p>
      <Link to="/" className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">
        Vrati se na početnu <ChevronRight size={12} />
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-[#070b14] dark:via-[#0a0f1a] dark:to-[#0d1220] text-slate-900 dark:text-white">
      {/* Hero Section / Header */}
      <header className="relative border-b-2 border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-r from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 py-12 md:py-20 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Tournament Badge & Meta */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl text-white shadow-xl shadow-blue-600/30 backdrop-blur-sm">
                  <Trophy size={24} />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] leading-none mb-1">Službena Stranica</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-black uppercase tracking-wider">Stonoteniski Turnir</p>
                </div>
              </div>

              {/* Social Share */}
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm">
                <Share2 size={14} /> Podijeli
              </button>
            </div>

            <div className="grid lg:grid-cols-[1fr,420px] gap-12 items-start">
              {/* Left: Title & Core Info */}
              <div className="space-y-6">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-[0.95] drop-shadow-sm">
                  {competition?.name}
                </h1>
                
                {/* Key Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  {competition?.location && (
                    <div className="group bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 border-slate-200/50 dark:border-slate-800/50 hover:border-emerald-500/50 p-5 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                          <MapPin size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.15em] leading-none mb-1.5">Lokacija Turnira</p>
                          <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{competition.location}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {(competition?.startDate || competition?.endDate) && (
                    <div className="group bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 border-slate-200/50 dark:border-slate-800/50 hover:border-blue-500/50 p-5 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                          <Calendar size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.15em] leading-none mb-1.5">Vrijeme Održavanja</p>
                          <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                            {formatDate(competition.startDate)}
                            {competition.endDate && competition.endDate !== competition.startDate && ` - ${formatDate(competition.endDate)}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {competition.organizer && (
                    <div className="group bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 border-slate-200/50 dark:border-slate-800/50 hover:border-amber-500/50 p-5 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                          <Users size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.15em] leading-none mb-1.5">Organizator</p>
                          <p className="text-sm font-black text-slate-900 dark:text-white leading-tight truncate">{competition.organizer}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {competition.entryFee && (
                    <div className="group bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 dark:from-emerald-500/20 dark:to-emerald-600/20 backdrop-blur-sm border-2 border-emerald-500/30 dark:border-emerald-500/50 hover:border-emerald-500 p-5 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                          <DollarSign size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-[0.15em] leading-none mb-1.5">Kotizacija</p>
                          <p className="text-sm font-black text-emerald-700 dark:text-emerald-300 leading-tight">{competition.entryFee}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Action Panel */}
              <div className="w-full lg:w-[420px] space-y-6">
                
                {/* Countdown Timer */}
                {competition?.startDate && new Date(competition.startDate) > new Date() && (
                  <div className="bg-slate-900 dark:bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <p className="text-[10px] text-white font-black uppercase tracking-[0.2em]">
                        Turnir Počinje Za
                      </p>
                    </div>
                    <Countdown targetDate={competition.startDate} />
                  </div>
                )}

                {/* CTA Card */}
                <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none"></div>
                  
                  {competition?.registration?.isOpen ? (
                    <>
                      <div className="flex items-center gap-2 mb-4 relative z-10">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em]">Prijave Su Otvorene</p>
                      </div>
                      <button 
                        onClick={() => competition.registration.link && window.open(competition.registration.link, '_blank')}
                        className="w-full bg-slate-900 dark:bg-white hover:bg-black dark:hover:bg-slate-100 text-white dark:text-black px-8 py-5 rounded-xl font-black uppercase text-sm tracking-widest transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 shadow-xl mb-3 relative z-10"
                      >
                        <span>Prijavi Se.</span>
                        <ChevronRight size={18} />
                      </button>
                      {competition.registration.deadline && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold text-center relative z-10">
                          Rok: {formatDate(competition.registration.deadline)}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4 relative z-10">
                      <p className="text-slate-900 dark:text-white font-black uppercase text-sm mb-2">Prijave Zatvorene</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">Kontaktirajte organizatora za više informacija</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sticky Category Nav */}
      {categories.length > 0 && (
        <div id="category-nav" className="sticky top-0 z-50 bg-white/95 dark:bg-[#070b14]/95 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="container mx-auto px-4 overflow-x-auto no-scrollbar">
            <div className="flex items-center h-14 gap-2 min-w-max">
              <button 
                  onClick={() => setSelectedCategoryId(null)}
                  className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${!selectedCategoryId ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
              >
                  Pregled
              </button>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
              
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategoryId === cat.id ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-6 py-16 max-w-7xl">
        {!selectedCategoryId ? (
          /* PREGLED / PROPOZICIJE */
          <div className="max-w-6xl mx-auto space-y-16">
            {/* Opšte informacije i Kontakt - Combined Section */}
            {(competition?.organizer || competition?.director || competition?.referee || competition?.contact?.address || competition?.contact?.phone || competition?.contact?.email) && (
              <section className="space-y-8">
                <div className="text-center space-y-2 mb-10">
                  <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                    Opšte Informacije
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">Osnovni podaci o organizaciji turnira</p>
                </div>

                {/* Grid Layout - Key People */}
                {(competition?.organizer || competition?.director || competition?.referee) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {competition.organizer && (
                      <div className="group bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500/50 p-6 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Users size={18} />
                          </div>
                          <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.15em]">Organizator</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white leading-tight">{competition.organizer}</p>
                      </div>
                    )}
                    {competition.director && (
                      <div className="group bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50 border-2 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 p-6 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <Users size={18} />
                          </div>
                          <p className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.15em]">Direktor Turnira</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white leading-tight">{competition.director}</p>
                      </div>
                    )}
                    {competition.referee && (
                      <div className="group bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50 border-2 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 p-6 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck size={18} />
                          </div>
                          <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.15em]">Vrhovni Sudija</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white leading-tight">{competition.referee}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Contact Information Section */}
                {(competition?.contact?.address || competition?.contact?.phone || competition?.contact?.email) && (
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900/50 dark:to-blue-900/10 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-10 shadow-xl">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg">
                        <Phone size={20} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Kontakt Informacije</h3>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Za pitanja i dodatne informacije</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Address - Full Width on Desktop if alone, or left column */}
                      {competition.contact.address && (
                        <div className={`${!competition.contact.phone && !competition.contact.email ? 'md:col-span-2' : 'md:col-span-2'} bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm`}>
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                              <MapPinned size={22} />
                            </div>
                            <div className="flex-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Adresa Dvorane</p>
                              <p className="text-base font-bold text-slate-900 dark:text-white leading-relaxed">{competition.contact.address}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Phone */}
                      {competition.contact.phone && (
                        <a 
                          href={`tel:${competition.contact.phone}`} 
                          className="group bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shrink-0">
                              <Phone size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Telefon</p>
                              <p className="text-base font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-500 transition-colors">{competition.contact.phone}</p>
                            </div>
                          </div>
                        </a>
                      )}

                      {/* Email */}
                      {competition.contact.email && (
                        <a 
                          href={`mailto:${competition.contact.email}`} 
                          className="group bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shrink-0">
                              <Mail size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Email</p>
                              <p className="text-sm font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-500 transition-colors truncate">{competition.contact.email}</p>
                            </div>
                          </div>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Kategorije */}
            {categories.length > 0 && (
              <section className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                    Takmičarske Kategorije
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">Kliknite na kategoriju za prikaz rezultata i rasporeda</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.id)}
                      className="group bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 p-6 rounded-2xl transition-all text-left hover:-translate-y-1"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                          <Trophy size={22} />
                        </div>
                        <ChevronRight size={20} className="text-slate-300 dark:text-slate-700 group-hover:text-blue-500 transition-colors group-hover:translate-x-1" />
                      </div>
                      <p className="text-lg font-black uppercase text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight mb-2">
                        {cat.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-slate-400" />
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                          {cat.playerIds?.length || 0} učesnika
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Opis */}
            {competition?.description && (
              <section className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-4">
                  O Turniru
                </h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-8 rounded-xl">
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{competition.description}</p>
                </div>
              </section>
            )}

            {/* Available Categories for Registration */}
            {competition?.availableCategories && competition.availableCategories.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-4">
                    Prijave po Kategorijama
                </h2>
                <div className="flex flex-wrap gap-3">
                    {competition.availableCategories.map((category, index) => (
                    <div 
                        key={index}
                        className="group bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-sm hover:border-emerald-500/50 transition-all hover:shadow-md"
                    >
                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <Award size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Kategorija</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{category}</p>
                        </div>
                    </div>
                    ))}
                </div>
              </section>
            )}

            {/* Pravila */}
            {competition?.rules && (
              <section className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-4">
                  Propozicije i Pravila
                </h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-8 rounded-xl">
                  <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                    {competition.rules}
                  </div>
                  {competition.rules.length > 600 && (
                    <button 
                      onClick={() => setShowRulesModal(true)}
                      className="mt-4 text-blue-600 dark:text-blue-400 font-bold uppercase text-[10px] tracking-widest hover:underline"
                    >
                      Prikaži sve propozicije
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* Dodatne info (kotizacija, nagrade, raspored) */}
            {(competition?.entryFee || competition?.prizes || competition?.schedule) && (
              <section className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-4">
                  Dodatne Informacije
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {competition.entryFee && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <DollarSign size={20} className="text-emerald-500" />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kotizacija</p>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{competition.entryFee}</p>
                    </div>
                  )}
                  {competition.prizes && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <Award size={20} className="text-amber-500" />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nagrade</p>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{competition.prizes}</p>
                    </div>
                  )}
                </div>
                {competition.schedule && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-8 rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <ClockIcon size={20} className="text-blue-500" />
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Raspored (Okvirna Satnica)</p>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{competition.schedule}</p>
                  </div>
                )}
              </section>
            )}
          </div>
        ) : (
          /* REZULTATI KATEGORIJE */
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="bg-gradient-to-br from-blue-50 to-slate-50 dark:from-slate-900/50 dark:to-blue-900/10 border-2 border-blue-100 dark:border-blue-900/30 rounded-3xl p-8 md:p-10 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-xl shadow-blue-600/30">
                      <Trophy size={24} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none mb-2">
                        {activeCategory.name}
                      </h2>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                          {activeCategory.format === 'round_robin' ? 'Round Robin Liga' : 'Grupe & Eliminacije'}
                        </span>
                        <div className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <MapPin size={10} className="text-slate-400" />
                          <span>{competition.location}</span>
                        </div>
                        <div className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {activeCategory.playerIds?.length || 0} IGRAČA
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tab Navigation - Moved inside header */}
                <div className="flex bg-white/50 dark:bg-slate-950/40 p-1.5 rounded-2xl w-full md:w-auto border border-blue-200/50 dark:border-blue-950/50 backdrop-blur-md shadow-sm">
                  <button 
                    onClick={() => setActiveTab('players')}
                    className={`flex-1 md:px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'players' ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800'}`}
                  >
                    Igrači
                  </button>
                  <button 
                    onClick={() => setActiveTab('groups')}
                    className={`flex-1 md:px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'groups' ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800'}`}
                  >
                    Grupe
                  </button>
                  <button 
                    onClick={() => setActiveTab('knockout')}
                    className={`flex-1 md:px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'knockout' ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800'}`}
                  >
                    Eliminacije
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'players' && (
              <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl max-w-4xl mx-auto">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-6">Spisak Učesnika</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(() => {
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
                      return <div className="col-span-full py-12 text-center text-slate-500 font-bold uppercase text-[10px] tracking-widest">Nema registrovanih igrača</div>;
                    }

                    return participatingPlayers.map((player, idx) => (
                      <div key={player.id} className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center gap-4 group hover:border-blue-500/50 transition-all">
                        <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-xs font-black text-slate-500 border border-slate-200 dark:border-slate-700 group-hover:text-blue-500 transition-colors">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">{player.name}</p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest truncate">{player.club || 'Individual'}</p>
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
                    .filter(m => {
                      if (m.isKnockout) return false;
                      if (m.groupId === gIdx) return true;
                      if (activeCategory.format === 'round_robin' && gIdx === 0 && (m.groupId === undefined || m.groupId === null)) return true;
                      return false;
                    })
                    .sort((a, b) => (a.round || 0) - (b.round || 0) || (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
                  const advancingCount = activeCategory.advancingPlayers || 2;
                  
                  return (
                    <div key={gIdx} className={`bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl ${activeCategory.format === 'round_robin' ? 'lg:col-span-2' : ''}`}>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white mb-4">
                        {activeCategory.format === 'round_robin' ? 'Tabela i mečevi' : `Grupa ${String.fromCharCode(65 + gIdx)}`}
                      </h4>
                      <PublicGroupStandings standings={standings} advancingCount={advancingCount} />
                      <PublicGroupMatches matches={groupMatches} />
                    </div>
                  );
                })}

                {groups.length === 0 && (
                  <div className="lg:col-span-2 py-32 text-center border-2 border-dashed border-slate-200 dark:border-slate-900 rounded-3xl">
                    <LayoutGrid size={64} className="mx-auto mb-6 text-slate-300 dark:text-slate-900" />
                    <h4 className="text-xl font-black text-slate-400 dark:text-slate-700 uppercase italic tracking-tighter">Nema grupne faze</h4>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'knockout' && (
              <div className="space-y-8">
                <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                  {(() => {
                    const maxMatchesInRound = Math.max(...knockoutRounds.map(r => r.matches.length), 1);
                    const autoScale = maxMatchesInRound > 8 ? 0.7 : maxMatchesInRound > 4 ? 0.85 : 1;
                    const finalScale = knockoutZoom * autoScale;
                    
                    return (
                      <div className="overflow-x-auto pb-6">
                        <div className="min-w-max">
                          <div 
                            className="flex-1 flex flex-row h-full transition-transform duration-200" 
                            style={{ gap: '16px', justifyContent: 'center', transform: `scale(${finalScale})`, transformOrigin: 'top left' }}
                          >
                            {knockoutRounds.map((round, rIdx) => {
                              const baseUnit = 32;
                              const roundExtra = round.matches.length >= 4 ? 12 : 0;
                              const roundUnit = baseUnit + roundExtra;
                              const columnHeight = roundUnit * maxMatchesInRound * 2;

                              return (
                                <div key={rIdx} className="flex-1 flex flex-col h-full" style={{ gap: '5px', minWidth: '200px' }}>
                                  <div className="text-center mb-4">
                                    <h3 className="text-base font-bold text-blue-600 dark:text-amber-400 uppercase tracking-widest border-b border-blue-100 dark:border-amber-400/30 pb-2">
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
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Rules Full Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setShowRulesModal(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
               <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center gap-3">
                  <ShieldCheck className="text-emerald-500" /> Propozicije Turnira
               </h3>
               <button onClick={() => setShowRulesModal(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X size={20} />
               </button>
            </div>
            <div className="p-8 max-h-[70vh] overflow-y-auto">
              <div className="text-slate-600 dark:text-slate-400 text-base leading-relaxed whitespace-pre-wrap">
                {competition?.rules}
              </div>
            </div>
            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <button 
                onClick={() => setShowRulesModal(false)}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-xs tracking-widest py-5 rounded-2xl transition-all"
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {!isEmbed && (
        <footer className="mt-20 border-t border-slate-200 dark:border-slate-900/50 py-16 text-center">
           <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  <Trophy size={16} className="text-slate-400" />
              </div>
              <span className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">PINGPONG.BA</span>
           </div>
           <p className="text-[9px] text-slate-400 dark:text-slate-800 font-bold uppercase tracking-widest">
              Automated Tournament Management System &copy; {new Date().getFullYear()}
           </p>
        </footer>
      )}
    </div>
  );
};

export default PublicCompetitionNew;
