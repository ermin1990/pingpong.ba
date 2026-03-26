import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore';
import PublicGroupStandings from '../components/public/PublicGroupStandings';
import PublicGroupMatches from '../components/public/PublicGroupMatches';
import { calculateStandings, calculateSeasonStandings } from '../utils/standings';
import { Trophy, Clock, Zap, Users, LayoutGrid, AlertTriangle, ChevronRight, ChevronDown, CheckCircle, ArrowUp, ArrowDown, Share2, Code, Search, ShieldCheck, Calendar, MapPin, Phone, Mail, MapPinned, Award, DollarSign, ClockIcon, Timer, ZoomIn, ZoomOut, Maximize, X, List } from 'lucide-react';

// Helper za generisanje URL slug-a iz imena kategorije
const generateSlug = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/ž/g, 'z')
    .replace(/š/g, 's')
    .replace(/č/g, 'c')
    .replace(/ć/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

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
        <div key={idx} className="flex flex-col items-center bg-white/10 dark:bg-white/5 border border-white/20 px-2.5 py-2 rounded-lg min-w-[48px] animate-in fade-in zoom-in duration-300">
          <span className="text-lg font-medium leading-none tabular-nums text-white">{item.val}</span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/70 mt-1">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

// Knockout card komponenta
const KnockoutMatchCard = ({ match, isFinal = false, onMatchClick, isSelected }) => {
  const p1Win = match.status === 'completed' && match.player1Score > match.player2Score;
  const p2Win = match.status === 'completed' && match.player2Score > match.player1Score;
  
  const hasScore = (match.player1Score > 0 || match.player2Score > 0);
  const isLive = match.status !== 'completed' && 
                match.player1?.name && match.player1?.id !== 'tbd' && 
                match.player2?.name && match.player2?.id !== 'tbd' && 
                hasScore;

  return (
    <div className={`relative ${isSelected ? 'z-[100]' : 'z-10'}`}>
      <div 
        onClick={() => onMatchClick(match)}
        className={`block bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-xl border ${isSelected ? 'border-emerald-500 ring-4 ring-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'border-slate-200 dark:border-slate-700/50 shadow-sm'} dark:shadow-xl transition-all duration-300 hover:scale-[1.02] knockout-match relative pt-[3px] my-[3px] cursor-pointer overflow-hidden group`}
      >
        {isLive && (
          <div className="absolute top-0 right-0 z-20">
             <div className="bg-red-600 text-white text-[10px] font-medium px-2.5 py-1 rounded-bl-lg shadow-lg flex items-center gap-1.5 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                LIVE
             </div>
          </div>
        )}
        
        <div className={`px-3 md:px-4 py-2 transition-all duration-300 ${isSelected ? 'blur-md opacity-20 scale-95' : ''}`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                  <div className={`player-name font-medium text-sm ${p1Win ? 'text-emerald-600 dark:text-green-500 font-semibold' : 'text-slate-600 dark:text-gray-300'}`}>
                    {match.player1?.name || "TBD"}
                  </div>
              </div>
              <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded flex items-center justify-center border border-slate-100 dark:border-white/5 badge-box ${p1Win ? 'bg-emerald-50 dark:bg-green-900/80' : 'bg-slate-50 dark:bg-gray-800'}`}>
                          <div className={`text-sm font-semibold badge-number ${p1Win ? 'text-emerald-700 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                            {match.player1Score || 0}
                          </div>
                      </div>
                  </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                  <div className={`player-name font-medium text-sm ${p2Win ? 'text-emerald-600 dark:text-green-500 font-semibold' : 'text-slate-600 dark:text-gray-300'}`}>
                    {match.player2?.name || "TBD"}
                  </div>
              </div>
              <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded flex items-center justify-center border border-slate-100 dark:border-white/5 badge-box ${p2Win ? 'bg-emerald-50 dark:bg-green-900/80' : 'bg-slate-50 dark:bg-gray-800'}`}>
                          <div className={`text-sm font-semibold badge-number ${p2Win ? 'text-emerald-700 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                            {match.player2Score || 0}
                          </div>
                      </div>
                  </div>
              </div>
            </div>
        </div>

        {isSelected && (
          <div className="absolute inset-0 z-30 flex flex-col justify-center px-4 animate-in zoom-in-95 duration-200">
            {match.sets && match.sets.length > 0 && match.sets.some(s => (s.p1 > 0 || s.p2 > 0)) ? (
              <>
                <div className="flex items-center justify-center mb-2">
                   <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded italic">Rezultati Setova</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {match.sets.map((set, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                       <div className={`h-7 rounded flex items-center justify-center text-xs font-medium border transition-colors ${set.p1 > set.p2 ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                         {set.p1}
                       </div>
                       <div className={`h-7 rounded flex items-center justify-center text-xs font-medium border transition-colors ${set.p2 > set.p1 ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                         {set.p2}
                       </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 italic bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                  Nisu unešeni poeni
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const PublicCompetitionNew = () => {
  const { slug, categorySlug } = useParams();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(window.location.search);
  const isEmbed = queryParams.get('embed') === 'true';

  // ─── ALL STATE (must come before any early returns) ───────────────────────
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false); // ← FIX: was missing
  const [activeTab, setActiveTab] = useState('groups');
  const [showFinalRanking, setShowFinalRanking] = useState(false);
  const [seasonSubCompetitions, setSeasonSubCompetitions] = useState([]);
  const [seasonAllMatches, setSeasonAllMatches] = useState([]);
  const [allMatches, setAllMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [manualOrders, setManualOrders] = useState({});
  const [playerNames, setPlayerNames] = useState({});
  const [allPlayers, setAllPlayers] = useState([]);
  const [knockoutZoom, setKnockoutZoom] = useState(1);
  const [knockoutDetailMatch, setKnockoutDetailMatch] = useState(null);
  const [selectedMatchModal, setSelectedMatchModal] = useState(null);

  // ─── ALL MEMOS (must come before any early returns) ───────────────────────
  const activeCategory = useMemo(() => {
    if (!categorySlug || categories.length === 0) return null;
    return categories.find(c => generateSlug(c.name || '') === categorySlug);
  }, [categorySlug, categories]);

  const selectedCategoryId = activeCategory?.id;

  const seasonStandings = useMemo(() => {
    if ((competition?.id && !competition?.isSeason && competition?.type !== 'league_season') || !activeCategory) return [];
    
    const tourneyRankings = seasonSubCompetitions
      .filter(s => s.status === 'completed')
      .map(s => s.finalRanking || []);

    return calculateSeasonStandings(tourneyRankings, seasonAllMatches, competition?.pointsSystem);
  }, [competition, seasonSubCompetitions, seasonAllMatches, activeCategory]);

  const matches = useMemo(() => {
    if (!selectedCategoryId) return [];
    return allMatches.filter(m => m.categoryId === selectedCategoryId);
  }, [allMatches, selectedCategoryId]);

  const groups = useMemo(() => {
    if (!activeCategory || !activeCategory.groupConfig) return [];
    const config = activeCategory.groupConfig;
    const gArray = [];
    Object.keys(config).sort((a, b) => Number(a) - Number(b)).forEach(key => {
      gArray.push(config[key].map(id => {
        let name = playerNames[id];
        
        if (!name) {
          const matchWithPlayer = allMatches.find(m => 
            m.player1?.id === id || m.player2?.id === id
          );
          if (matchWithPlayer) {
            if (matchWithPlayer.player1?.id === id) {
              name = matchWithPlayer.player1?.name;
            } else if (matchWithPlayer.player2?.id === id) {
              name = matchWithPlayer.player2?.name;
            }
          }
        }
        
        return { 
          id, 
          name: name || "TBD" 
        };
      })
      .filter(p => p.id && p.id !== 'placeholder' && p.id !== 'null'));
    });
    return gArray.filter(g => g.length > 0);
  }, [activeCategory, playerNames, allMatches]);

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

  // ─── FIX: tabs useMemo moved BEFORE early returns ─────────────────────────
  const tabs = useMemo(() => {
    const baseTabs = [
      { id: 'groups', label: activeCategory?.format === 'round_robin' ? 'Tabela' : 'Grupe', icon: LayoutGrid },
      { id: 'knockout', label: 'Žrijeb', icon: Trophy },
      { id: 'players', label: 'Igrači', icon: Users },
    ];

    if (showFinalRanking) {
      baseTabs.unshift({ id: 'final', label: 'Konačni Plasman', icon: Award });
    }

    if (competition?.seasonalTag || competition?.isSeason) {
      baseTabs.push({ id: 'season_standings', label: 'Sezona', icon: List });
    }

    return baseTabs;
  }, [activeCategory, competition, showFinalRanking]);

  // ─── ALL EFFECTS (must come before any early returns) ─────────────────────
  useEffect(() => {
    if (activeCategory?.finalRanking && Object.keys(activeCategory.finalRanking).length > 0) {
      setShowFinalRanking(true);
      setActiveTab('final');
    } else {
      setShowFinalRanking(false);
      setActiveTab('groups');
    }
  }, [activeCategory?.id]);

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
          try {
            const dSnap = await getDoc(doc(db, "competitions", slug));
            if (dSnap.exists()) compDoc = dSnap;
          } catch (e) {}
        }

        if (!compDoc) {
          const qRose = query(collection(db, "amater_leagues"), where("slug", "==", slug));
          const snapRose = await getDocs(qRose);
          if (!snapRose.empty) {
            compDoc = snapRose.docs[0];
          } else {
            try {
              const dSnapRose = await getDoc(doc(db, "amater_leagues", slug));
              if (dSnapRose.exists()) compDoc = dSnapRose;
            } catch (e) {}
          }
        }
        
        if (compDoc) {
          const compData = { id: compDoc.id, ...compDoc.data() };
          setCompetition(compData);

          if (compData.ownerUid) {
            const playersRef = collection(db, "players");
            const pQ = query(playersRef, where("ownerUid", "==", compData.ownerUid));
            getDocs(pQ).then(pSnap => {
              const playersList = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
              setAllPlayers(playersList);
              const names = {};
              playersList.forEach(p => { names[p.id] = p.name; });
              setPlayerNames(names);
            }).catch(err => {
              console.error('Error loading players:', err);
            });
          }
          
          const collectionPath = (compDoc.ref.path.includes('amater_leagues')) ? "amater_leagues" : "competitions";
          const catQ = query(collection(db, collectionPath, compDoc.id, "categories"));
          unsubscribeCats = onSnapshot(catQ, (catSnap) => {
            const cats = catSnap.docs.map(d => ({ id: d.id, ...d.data() }))
              .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setCategories(cats);

            cats.forEach(async (cat) => {
              const ordersQ = query(collection(db, collectionPath, compDoc.id, "categories", cat.id, "manualOrders"));
              const ordersSnap = await getDocs(ordersQ);
              const orders = {};
              ordersSnap.docs.forEach(d => {
                orders[d.id] = d.data().order;
              });
              setManualOrders(prev => ({ ...prev, [cat.id]: orders }));
            });
          }, (error) => {
            console.error('Error loading categories:', error);
          });
        } else {
          setError("Takmičenje nije pronađeno.");
        }
      } catch (err) {
        console.error("Error fetching competition:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBySlug();
    return () => unsubscribeCats?.();
  }, [slug]);

  useEffect(() => {
    if (competition) {
      const matchCollection = competition.type === 'amater_league' || competition.seasonalTag ? "amater_league_matches" : "matches";
      const q = query(
        collection(db, matchCollection), 
        where("competitionId", "==", competition.id)
      );
      
      const unsubscribe = onSnapshot(q, (snap) => {
        const matchesList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllMatches(matchesList);
        
        if (Object.keys(playerNames).length === 0 && matchesList.length > 0) {
          const namesFromMatches = {};
          matchesList.forEach(match => {
            if (match.player1?.id && match.player1?.name) {
              namesFromMatches[match.player1.id] = match.player1.name;
            }
            if (match.player2?.id && match.player2?.name) {
              namesFromMatches[match.player2.id] = match.player2.name;
            }
          });
          setPlayerNames(prev => ({ ...prev, ...namesFromMatches }));
        }
      });
      return () => unsubscribe();
    }
  }, [competition, playerNames]);

  useEffect(() => {
    if (competition?.isSeason || competition?.type === 'league_season' || competition?.type === 'amater_league') {
      const q = query(
        collection(db, competition?.type === 'amater_league' ? "amater_league_tournaments" : "competitions"),
        where(competition?.type === 'amater_league' ? "seasonalTag" : "parentLeagueId", "==", competition?.type === 'amater_league' ? competition.slug : competition.id)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSeasonSubCompetitions(subs);
        
        const subIds = subs.map(s => s.id);
        if (subIds.length > 0) {
          const matchColl = (competition?.type === 'amater_league') ? "amater_league_matches" : "matches";
          
          const matchesQ = query(
            collection(db, matchColl),
            where("competitionId", "in", subIds.slice(0, 10))
          );
          onSnapshot(matchesQ, (mSnapshot) => {
            setSeasonAllMatches(mSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
          });
        }
      });
      return () => unsubscribe();
    }
  }, [competition?.id]);

  useEffect(() => {
    if (activeCategory) {
      if (activeCategory.finalRanking && Object.keys(activeCategory.finalRanking).length > 0) {
        setActiveTab('final');
        return;
      }
      const hasGroups = activeCategory.groupConfig && Object.entries(activeCategory.groupConfig).some(([_, ids]) => ids.length > 0);
      setActiveTab(hasGroups ? 'groups' : 'knockout');
    }
  }, [activeCategory?.id]);

  // ─── HELPERS (defined after hooks, before early returns) ──────────────────
  const isSlotReserved = (match, slot) => {
    if (!match?.slots) return false;
    return match.slots[slot]?.isReserved || false;
  };

  const calculateStandingsForGroup = (groupIdx) => {
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

  const handleCategorySelect = (catId) => {
    const cat = categories.find(c => c.id === catId);
    const catSlug = generateSlug(cat?.name || '');
    const embedParam = isEmbed ? '?embed=true' : '';
    navigate(`/p/${slug}/${catSlug}${embedParam}`);
    setSearchTerm('');
    setTimeout(() => {
      const categoryNav = document.getElementById('category-nav');
      if (categoryNav) {
        const navTop = categoryNav.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: navTop - 20, behavior: 'smooth' });
      }
    }, 100);
  };

  // ─── EARLY RETURNS (after ALL hooks) ──────────────────────────────────────
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

  // ─── MAIN RENDER ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#070b14] dark text-slate-900 dark:text-white overflow-x-hidden">
      {/* Hero Section / Header */}
      <header className="relative border-b border-slate-800/50 bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 md:px-6 py-8 md:py-20 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-6 md:mb-8">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-2 md:p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl md:rounded-2xl text-white shadow-xl shadow-blue-600/30 backdrop-blur-sm">
                  <Trophy size={20} className="md:w-6 md:h-6" />
                </div>
                <div>
                  <p className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-wide leading-none mb-1.5 md:mb-2">Službena Stranica</p>
                  <p className="text-xs md:text-sm text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide">Stonoteniski Turnir</p>
                </div>
              </div>

              <button className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg md:rounded-xl text-[10px] md:text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm">
                <Share2 size={12} className="md:w-3.5 md:h-3.5" /> Podijeli
              </button>
            </div>

            <div className="grid lg:grid-cols-[1fr,380px] gap-8 md:gap-12 items-start">
              <div className="space-y-4 md:space-y-6">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-semibold text-slate-900 dark:text-white uppercase tracking-tight leading-[1.1] md:leading-[0.95] drop-shadow-sm">
                  {competition?.name}
                </h1>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 pt-2 md:pt-4">
                  {competition?.location && (
                    <div className="group bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 hover:border-emerald-500/50 p-4 md:p-5 rounded-xl md:rounded-2xl transition-all shadow-lg hover:shadow-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                          <MapPin size={18} className="md:w-5 md:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-wide leading-none mb-1.5 md:mb-2">Lokacija Turnira</p>
                          <p className="text-sm md:text-base font-medium text-slate-900 dark:text-white leading-tight">{competition.location}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {(competition?.startDate || competition?.endDate) && (
                    <div className="group bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 hover:border-blue-500/50 p-3 md:p-5 rounded-xl md:rounded-2xl transition-all shadow-lg hover:shadow-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                          <Calendar size={18} className="md:w-5 md:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-wide leading-none mb-1.5 md:mb-2">Vrijeme Održavanja</p>
                          <p className="text-sm md:text-base font-medium text-slate-900 dark:text-white leading-tight">
                            {formatDate(competition.startDate)}
                            {competition.endDate && competition.endDate !== competition.startDate && ` - ${formatDate(competition.endDate)}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {competition.organizer && (
                    <div className="group bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 hover:border-amber-500/50 p-3 md:p-5 rounded-xl md:rounded-2xl transition-all shadow-lg hover:shadow-xl">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                          <Users size={18} className="md:w-5 md:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-wide leading-none mb-1.5 md:mb-2">Organizator</p>
                          <p className="text-sm md:text-base font-medium text-slate-900 dark:text-white leading-tight truncate">{competition.organizer}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {competition.entryFee && (
                    <div className="group bg-emerald-500/5 dark:bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/30 dark:border-emerald-500/40 hover:border-emerald-500 p-3 md:p-5 rounded-xl md:rounded-2xl transition-all shadow-lg hover:shadow-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                          <DollarSign size={18} className="md:w-5 md:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] md:text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wide leading-none mb-1.5 md:mb-2">Kotizacija</p>
                          <p className="text-sm md:text-base font-semibold text-emerald-700 dark:text-emerald-300 leading-tight">{competition.entryFee}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full lg:w-[380px] space-y-4 md:space-y-6">
                {competition?.startDate && new Date(competition.startDate) > new Date() && (
                  <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800/50 rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                      <p className="text-[10px] md:text-xs text-white font-medium uppercase tracking-wide">
                        Turnir Počinje Za
                      </p>
                    </div>
                    <Countdown targetDate={competition.startDate} />
                  </div>
                )}

                {competition?.registration?.show !== false && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none"></div>
                    
                    {competition?.registration?.isOpen ? (
                      <>
                        <div className="flex items-center gap-2 mb-4 relative z-10">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Prijave Su Otvorene</p>
                        </div>
                        <button 
                          onClick={() => competition.registration.link && window.open(competition.registration.link, '_blank')}
                          className="w-full bg-slate-900 dark:bg-white hover:bg-black dark:hover:bg-slate-100 text-white dark:text-black px-6 py-4 md:px-8 md:py-5 rounded-xl font-semibold uppercase text-xs md:text-sm tracking-wide transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-xl mb-3 relative z-10"
                        >
                          <span>Prijavi Se</span>
                          <ChevronRight size={16} />
                        </button>
                        {competition.registration.deadline && (
                          <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-medium text-center relative z-10">
                            Rok: {formatDate(competition.registration.deadline)}
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-4 relative z-10">
                        <p className="text-slate-900 dark:text-white font-semibold uppercase text-sm mb-2">Prijave Zatvorene</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-normal tracking-normal">Kontaktirajte organizatora za više informacija</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sticky Category Nav */}
      <div id="category-nav" className="sticky top-0 z-[100] bg-slate-950/95 backdrop-blur-lg border-b border-slate-800 shadow-sm overflow-visible">
        <div className="container mx-auto px-4 overflow-visible">
          <div className="flex items-center h-14 gap-2 relative py-2">
            <Link 
                to={`/p/${slug}`}
                className={`px-4 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wide transition-all whitespace-nowrap ${!categorySlug ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
                Pregled
            </Link>
            
            {categories.length > 0 && (
              <>
                <div className="h-4 w-px bg-slate-800 mx-1 shrink-0" />
                
                <div className="relative z-50">
                  <button 
                    onClick={() => setShowCategoryDropdown(prev => !prev)}
                    className={`px-4 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wide transition-all flex items-center gap-2 whitespace-nowrap ${
                      categorySlug 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {categorySlug ? categories.find(c => generateSlug(c.name) === categorySlug)?.name || 'Kategorije' : 'Kategorije'}
                    <ChevronDown size={12} className={`transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showCategoryDropdown && (
                    <div className="absolute left-0 top-full mt-1 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                      {categories.length === 0 ? (
                        <div className="px-4 py-3 text-xs text-slate-500 font-medium uppercase tracking-wide text-center">
                          Nema kategorija
                        </div>
                      ) : (
                        <div className="py-2">
                          {categories.map(cat => {
                            const catSlug = generateSlug(cat.name);
                            const isActive = categorySlug === catSlug;
                            return (
                              <Link
                                key={cat.id}
                                to={`/p/${slug}/${catSlug}${isEmbed ? '?embed=true' : ''}`}
                                onClick={() => setShowCategoryDropdown(false)}
                                className={`w-full px-4 py-3 text-left text-xs font-medium uppercase tracking-wide transition-all block ${
                                  isActive 
                                    ? 'bg-blue-500/10 text-blue-400' 
                                    : 'text-slate-300 hover:bg-slate-800'
                                }`}
                              >
                                {cat.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-16 max-w-7xl">
        {!categorySlug ? (
          <div className="max-w-6xl mx-auto space-y-16">
            {(competition?.organizer || competition?.director || competition?.referee || competition?.contact?.address || competition?.contact?.phone || competition?.contact?.email) && (
              <section className="space-y-8">
                <div className="text-center space-y-2 mb-10">
                  <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                    Opšte Informacije
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">Osnovni podaci o organizaciji turnira</p>
                </div>

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
                      {competition.contact.address && (
                        <div className="md:col-span-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
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

            {categories.length > 0 ? (
              <section className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                    Takmičarske Kategorije
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">Kliknite na kategoriju za prikaz rezultata i rasporeda</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
                  {categories.map(cat => {
                    const catSlug = generateSlug(cat.name);
                    return (
                      <Link
                        key={cat.id}
                        to={`/p/${slug}/${catSlug}${isEmbed ? '?embed=true' : ''}`}
                        className="group bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 p-6 rounded-2xl transition-all text-left hover:-translate-y-1 block"
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
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : (
              <section className="text-center py-20">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center mb-6 mx-auto border border-slate-200 dark:border-slate-800">
                  <Trophy size={40} className="text-slate-300 dark:text-slate-700" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-3">
                  Kategorije Još Nisu Dostupne
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                  Organizator još nije postavio takmičarske kategorije. Provjerite ponovo kasnije.
                </p>
              </section>
            )}

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

            {competition?.rules && (
              <section className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-4">
                  Propozicije i Pravila
                </h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-8 rounded-xl">
                  <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                    {typeof competition.rules === 'string' ? competition.rules : (
                      <div className="space-y-4">
                        {Object.entries(competition.rules).map(([key, value]) => (
                          <div key={key}>
                            <p className="font-bold uppercase text-[10px] text-slate-400 mb-1">{key}</p>
                            <p className="text-slate-900 dark:text-white">{value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {typeof competition.rules === 'string' && competition.rules.length > 600 && (
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
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {typeof competition.prizes === 'string' ? competition.prizes : (
                           <div className="space-y-2">
                              {Object.entries(competition.prizes).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center gap-4 border-b border-slate-200/50 dark:border-slate-800/50 pb-2 last:border-0 last:pb-0">
                                  <span className="text-[10px] uppercase text-slate-400">{key === 'others' ? 'Ostalo' : `${key}. Mjesto`}</span>
                                  <span className="text-right">{value}</span>
                                </div>
                              ))}
                           </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {competition.charity && (
                  <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 p-8 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                        <Zap size={20} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none mb-1">Humanitarna Akcija</p>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Donacije za Dvoranu</h3>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 italic">
                          "{competition.charity.purpose}"
                        </p>
                        <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck size={18} />
                          <span className="text-xs font-bold uppercase tracking-wider">{competition.charity.transparency}</span>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-emerald-100 dark:border-emerald-800/50 flex flex-col items-center justify-center text-center">
                         <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Preporučena Donacija</p>
                         <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{competition.charity.minFee}</p>
                      </div>
                    </div>
                  </div>
                )}
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
        ) : activeCategory ? (
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
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                            {activeCategory.playerIds?.length || 0} IGRAČA
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                {(matches.length > 0 || groups.length > 0) ? (
                  <div className="flex bg-white/50 dark:bg-slate-950/40 p-1.5 rounded-2xl w-full md:w-auto border border-blue-200/50 dark:border-blue-950/50 backdrop-blur-md shadow-sm">
                    {tabs.map(tab => (
                      <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 md:px-6 py-3 rounded-xl text-xs font-medium uppercase tracking-wide transition-all whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === tab.id ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800'}`}
                      >
                        <tab.icon size={14} />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-amber-500/10 border border-amber-500/20 px-6 py-3.5 rounded-2xl flex items-center gap-3">
                    <Clock size={16} className="text-amber-500" />
                    <span className="text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-500 italic">
                      Raspored i rezultati će biti objavljeni uskoro
                    </span>
                  </div>
                )}
              </div>
            </div>

            {(matches.length > 0 || groups.length > 0) ? (
              <>
                {activeTab === 'final' && activeCategory?.finalRanking && (
                  <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Konačni Poredak</h3>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">Službeni rezultati takmičenja</p>
                      </div>
                      <Award className="text-blue-500" size={32} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(activeCategory.finalRanking)
                        .sort(([posA], [posB]) => parseInt(posA) - parseInt(posB))
                        .map(([pos, playerId]) => {
                          const player = allPlayers.find(p => p.id === playerId);
                          const position = parseInt(pos);
                          
                          return (
                            <div key={pos} className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                              position === 1 ? 'bg-amber-500/10 border-amber-500/50' : 
                              position === 2 ? 'bg-slate-100 border-slate-300 dark:bg-slate-800/50 dark:border-slate-700' :
                              position === 3 ? 'bg-orange-500/10 border-orange-500/50' :
                              'bg-slate-50/50 border-slate-200 dark:bg-slate-950/30 dark:border-slate-800'
                            }`}>
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black border-2 ${
                                position === 1 ? 'bg-amber-500 border-amber-300 text-white' :
                                position === 2 ? 'bg-slate-400 border-slate-300 text-white' :
                                position === 3 ? 'bg-orange-600 border-orange-400 text-white' :
                                'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'
                              }`}>
                                {pos}.
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">
                                  {player?.name || 'Nepoznat Igrač'}
                                </p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">
                                  {player?.club || 'Individual'}
                                </p>
                              </div>
                            </div>
                        );
                        })}
                    </div>
                  </div>
                )}

                {activeTab === 'players' && (
                  <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl max-w-4xl mx-auto">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white uppercase tracking-tight mb-6">Spisak Učesnika</h3>

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
                          return <div className="col-span-full py-12 text-center text-slate-500 font-medium uppercase text-xs tracking-wide">Nema registrovanih igrača</div>;
                        }

                        return participatingPlayers.map((player, idx) => (
                          <div key={player.id} className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center gap-4 group hover:border-blue-500/50 transition-all">
                            <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-sm font-medium text-slate-500 border border-slate-200 dark:border-slate-700 group-hover:text-blue-500 transition-colors">
                              {idx + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-white uppercase truncate">{player.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal uppercase tracking-wide truncate">{player.club || 'Individual'}</p>
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
                      const standings = calculateStandingsForGroup(gIdx);
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
                          <PublicGroupMatches matches={groupMatches} onMatchClick={(m) => setSelectedMatchModal(m)} />
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
                    <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
                      <div className="flex items-center justify-center gap-4 mb-8 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/50 w-fit mx-auto sticky top-4 z-50 shadow-lg">
                        <button 
                          onClick={() => setKnockoutZoom(prev => Math.max(0.5, prev - 0.1))}
                          className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600 group"
                          title="Smanji"
                        >
                          <ZoomOut size={18} className="text-slate-500 group-hover:text-blue-500" />
                        </button>
                        
                        <div className="flex flex-col items-center min-w-[80px]">
                          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Zoom</span>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                            {(knockoutZoom * 100).toFixed(0)}%
                          </span>
                        </div>

                        <button 
                          onClick={() => setKnockoutZoom(prev => Math.min(2, prev + 0.1))}
                          className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600 group"
                          title="Povećaj"
                        >
                          <ZoomIn size={18} className="text-slate-500 group-hover:text-blue-500" />
                        </button>

                        <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                        <button 
                          onClick={() => setKnockoutZoom(1)}
                          className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600 group"
                          title="Resetuj"
                        >
                          <Maximize size={18} className="text-slate-500 group-hover:text-amber-500" />
                        </button>
                      </div>

                      {(() => {
                        const maxMatchesInRound = Math.max(...knockoutRounds.map(r => r.matches.length), 1);
                        const autoScale = maxMatchesInRound > 8 ? 0.7 : maxMatchesInRound > 4 ? 0.85 : 1;
                        const finalScale = knockoutZoom * autoScale;
                        
                        return (
                          <div className="overflow-x-auto pb-6">
                            <div className="min-w-max">
                              <div 
                                className="flex-1 flex flex-row h-full transition-transform duration-200" 
                                style={{ gap: '16px', justifyContent: 'center', transform: `scale(${finalScale})`, transformOrigin: 'top center' }}
                              >
                                {knockoutRounds.map((round, rIdx) => {
                                  const baseUnit = 32;
                                  const roundExtra = round.matches.length >= 4 ? 12 : 0;
                                  const roundUnit = baseUnit + roundExtra;
                                  const columnHeight = roundUnit * maxMatchesInRound * 2;
                                  
                                  const isRoundContainingSelected = round.matches.some(m => m.id === knockoutDetailMatch?.id);

                                  return (
                                    <div 
                                      key={rIdx} 
                                      className="flex-1 flex flex-col h-full" 
                                      style={{ 
                                        gap: '5px', 
                                        minWidth: '200px', 
                                        position: 'relative',
                                        zIndex: isRoundContainingSelected ? 50 : 1
                                      }}
                                    >
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
                                                  onMatchClick={(m) => setKnockoutDetailMatch(m.id === knockoutDetailMatch?.id ? null : m)}
                                                  isSelected={knockoutDetailMatch?.id === match.id}
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

                    <div className="pt-3 flex items-center justify-center gap-4">
                      <div className="flex items-center gap-2 bg-slate-900/40 backdrop-blur-md px-4 py-2.5 rounded-full border border-slate-800/50 shadow-lg">
                         <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                         <span className="text-xs font-medium text-slate-400 uppercase tracking-wide italic">Savjet: Kliknite na meč za prikaz poena po setovima</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'season_standings' && (
                  <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                          Tabela Sezone: {activeCategory?.name}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">
                          Zbirni poeni iz svih turnira (5 po pobjedi + bonus za plasman)
                        </p>
                      </div>
                      <Trophy className="text-amber-500" size={32} />
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Poz</th>
                            <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Igrač</th>
                            <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 text-center">Mečevi</th>
                            <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 text-center">Pobjede</th>
                            <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 text-center">Bonus</th>
                            <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 text-center bg-blue-50/30 dark:bg-blue-900/10">Ukupno</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seasonStandings.sort((a,b) => b.totalPoints - a.totalPoints).map((player, idx) => (
                            <tr key={player.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                              <td className="py-4 px-4">
                                <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${idx < 3 ? 'bg-amber-500/10 dark:bg-amber-900/30 text-amber-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="py-4 px-4 font-bold text-slate-700 dark:text-slate-200 uppercase text-xs">{player.name}</td>
                              <td className="py-4 px-4 text-center text-xs text-slate-500">{player.matchesWon}</td>
                              <td className="py-4 px-4 text-center text-xs font-bold text-slate-700 dark:text-slate-300">{player.winPoints}</td>
                              <td className="py-4 px-4 text-center text-xs font-bold text-emerald-600">+{player.bonusPoints}</td>
                              <td className="py-4 px-4 text-center text-sm font-black text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10 italic">
                                {player.totalPoints}
                              </td>
                            </tr>
                          ))}
                          {seasonStandings.length === 0 && (
                            <tr>
                              <td colSpan="6" className="py-20 text-center text-slate-400 uppercase text-[10px] font-black tracking-widest italic">
                                Sezona još nije počela ili nema obrađenih podataka
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
                <div className="py-20 text-center space-y-6 bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-4xl mx-auto">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto border border-slate-100 dark:border-slate-800">
                        <Calendar size={32} className="text-slate-300 dark:text-slate-700" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Obrada podataka u toku</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mt-2 font-medium">
                            Organizator priprema raspored mečeva za ovu kategoriju. Svi podaci će biti dostupni čim se završi žrijebanje.
                        </p>
                    </div>
                </div>
            )}
          </div>
        ) : (
          <div className="max-w-6xl mx-auto text-center py-20">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center mb-6 mx-auto border border-slate-200 dark:border-slate-800">
              <AlertTriangle size={40} className="text-slate-300 dark:text-slate-700" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-3">
              Kategorija Nije Pronađena
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
              Možda je kategorija uklonjena ili URL nije ispravan.
            </p>
            <Link 
              to={`/p/${slug}`}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
            >
              Nazad na Pregled
            </Link>
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
                {typeof competition?.rules === 'string' ? competition.rules : (
                  <div className="space-y-6">
                    {Object.entries(competition?.rules || {}).map(([key, value]) => (
                      <div key={key} className="border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0">
                        <p className="font-black uppercase text-[10px] text-blue-500 mb-2 tracking-widest">{key}</p>
                        <p className="text-slate-900 dark:text-white font-medium">{value}</p>
                      </div>
                    ))}
                  </div>
                )}
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

      {/* Match Result Modal */}
      {selectedMatchModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setSelectedMatchModal(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
               <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center gap-3">
                  <Zap className="text-amber-500" /> Rezultat Meča
               </h3>
               <button onClick={() => setSelectedMatchModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X size={20} />
               </button>
            </div>
            
            <div className="p-8">
                <div className="space-y-8">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 text-center">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-slate-200 dark:border-slate-700">
                                <Users size={32} className="text-slate-400" />
                            </div>
                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase leading-tight">{selectedMatchModal.player1.name}</p>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-4">
                                <span className={`text-5xl font-black ${selectedMatchModal.player1Score > selectedMatchModal.player2Score ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                    {selectedMatchModal.player1Score || 0}
                                </span>
                                <span className="text-2xl font-black text-slate-300 dark:text-slate-700">:</span>
                                <span className={`text-5xl font-black ${selectedMatchModal.player2Score > selectedMatchModal.player1Score ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                    {selectedMatchModal.player2Score || 0}
                                </span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Konačan Rezultat</span>
                        </div>

                        <div className="flex-1 text-center">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-slate-200 dark:border-slate-700">
                                <Users size={32} className="text-slate-400" />
                            </div>
                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase leading-tight">{selectedMatchModal.player2.name}</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                        <div className="grid grid-cols-6 gap-2 text-center">
                            <div className="col-span-1"></div>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Set {i}</div>
                            ))}
                            
                            <div className="col-span-1 text-left py-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase truncate block">{selectedMatchModal.player1.name}</span>
                            </div>
                            {[0, 1, 2, 3, 4].map(i => {
                                const set = selectedMatchModal.sets?.[i];
                                return (
                                    <div key={i} className={`py-2 rounded-lg font-bold text-sm ${set && set.p1 > set.p2 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                        {set ? set.p1 : '-'}
                                    </div>
                                );
                            })}

                            <div className="col-span-1 text-left py-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase truncate block">{selectedMatchModal.player2.name}</span>
                            </div>
                            {[0, 1, 2, 3, 4].map(i => {
                                const set = selectedMatchModal.sets?.[i];
                                return (
                                    <div key={i} className={`py-2 rounded-lg font-bold text-sm ${set && set.p2 > set.p1 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                        {set ? set.p2 : '-'}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <button 
                onClick={() => setSelectedMatchModal(null)}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-xs tracking-widest py-5 rounded-2xl shadow-lg transition-all active:scale-95"
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