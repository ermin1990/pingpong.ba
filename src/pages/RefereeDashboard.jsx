import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot, deleteDoc, addDoc } from 'firebase/firestore';
import { Loader2, LogOut, LayoutGrid, List, Trophy, ChevronRight, Table as TableIcon, Search, X } from 'lucide-react';
import MatchUpdateModal from '../components/competition/MatchUpdateModal';
import MatchCard from '../components/competition/MatchCard';

const RefereeDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [competition, setCompetition] = useState(null);
    const [categories, setCategories] = useState([]);
    const [referee, setReferee] = useState(null);
    const [matches, setMatches] = useState([]);
    const [activeMatch, setActiveMatch] = useState(null);
    const [showMatchModal, setShowMatchModal] = useState(false);
    
    // URL-based state management
    const [searchParams, setSearchParams] = useSearchParams();
    const viewMode = searchParams.get('tab') || 'mine';
    const selectedTableId = searchParams.get('tableId');
    
    const [searchTerm, setSearchTerm] = useState('');
    const [searchTableId, setSearchTableId] = useState('');
    
    const navigate = useNavigate();

    useEffect(() => {
        let unsubscribeCompetition = () => {};
        let unsubscribeCategories = () => {};
        let unsubscribeMatches = () => {};

        const initDashboard = async () => {
            const user = auth.currentUser;
            if (!user) {
                navigate('/sudija');
                return;
            }

            try {
                // 1. Get Referee Data
                const q = query(collection(db, 'referees'), where('currentUid', '==', user.uid));
                const snap = await getDocs(q);
                
                if (snap.empty) {
                    navigate('/sudija');
                    return;
                }

                const refereeDoc = snap.docs[0];
                const refereeData = { id: refereeDoc.id, ...refereeDoc.data() };
                setReferee(refereeData);

                // Pre-select assigned table if available and no view is set
                if (refereeData.assignedTableId && !searchParams.get('tab')) {
                    setSearchParams({ tab: 'tables', tableId: refereeData.assignedTableId });
                }

                if (!refereeData.competitionId) {
                    console.error("Referee has no competitionId!");
                    return;
                }

                // 2. Listen to Competition (to get tables)
                unsubscribeCompetition = onSnapshot(doc(db, 'competitions', refereeData.competitionId), (docSnap) => {
                    if (docSnap.exists()) {
                        setCompetition({ id: docSnap.id, ...docSnap.data() });
                    }
                });

                // 2b. Listen to Categories
                const categoriesQ = query(collection(db, 'competitions', refereeData.competitionId, 'categories'));
                unsubscribeCategories = onSnapshot(categoriesQ, (cSnap) => {
                    const loadedCategories = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                    setCategories(loadedCategories);
                });

                // 3. Listen to Matches
                const matchesQ = query(collection(db, 'matches'), where('competitionId', '==', refereeData.competitionId));
                unsubscribeMatches = onSnapshot(matchesQ, (mSnap) => {
                    const loadedMatches = mSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                    setMatches(loadedMatches);
                    setLoading(false);
                });

            } catch (err) {
                console.error("Error initializing dashboard:", err);
                setLoading(false);
            }
        };

        initDashboard();

        return () => {
            unsubscribeCompetition();
            unsubscribeCategories();
            unsubscribeMatches();
        };
    }, [navigate]);

    const handleLogout = async () => {
        if (confirm("Da li se želite odjaviti? Vaš pristupni kod će biti oslobođen za ponovnu upotrebu.")) {
            if (referee && auth.currentUser) {
                try {
                    // Oslobađamo kod kako bi se mogao opet iskoristiti
                    await addDoc(collection(db, 'referees'), {
                        name: referee.name,
                        code: referee.code,
                        competitionId: referee.competitionId,
                        assignedTableId: referee.assignedTableId || null,
                        createdAt: referee.createdAt || new Date()
                    });
                    
                    await deleteDoc(doc(db, 'referees', auth.currentUser.uid));
                } catch (err) {
                    console.error("Logout cleanup error:", err);
                }
            }
            await auth.signOut();
            navigate('/sudija');
        }
    };

    const handleMatchClick = (match) => {
        setActiveMatch(match);
        setShowMatchModal(true);
    };

    const saveMatchResult = async (matchData) => {
        try {
            const matchRef = doc(db, 'matches', matchData.id);
            // Kada sudija snimi rezultat, on postaje "zaduženi" sudija za taj meč
            const updateObj = {
                player1Score: matchData.player1Score,
                player2Score: matchData.player2Score,
                status: matchData.status,
                sets: matchData.sets || [],
                winnerId: matchData.winnerId || null,
                updatedAt: new Date(),
                tableId: matchData.tableId || null,
                table: matchData.table || null,
                refereeId: referee?.id || matchData.refereeId || null,
                refereeName: referee?.name || matchData.refereeName || null
            };
            
            await updateDoc(matchRef, updateObj);
            setShowMatchModal(false);
            setActiveMatch(null);
        } catch (err) {
            console.error("Error saving match:", err);
            alert("Gre�ka pri spa�avanju rezultata. Provjerite da li imate dozvolu.");
        }
    };

    const tables = competition?.tables || [];
    
    const filteredMatches = useMemo(() => {
        let result = [...matches];
        
        // 1. Filter za "Moji Mečevi"
        if (viewMode === 'mine') {
            if (!referee) return [];
            result = result.filter(m => {
                // Direktno dodijeljen
                if (m.refereeId === referee.id) return true;
                
                // Dodijeljen stol
                if (referee.assignedTableId && m.tableId === referee.assignedTableId) return true;
                
                // Dodijeljena kategorija
                if (referee.assignedCategoryId && m.categoryId === referee.assignedCategoryId) {
                    // Ako je dodijeljena i grupa, filteraj po njoj, inače cijela kategorija
                    if (referee.assignedGroupId !== undefined && referee.assignedGroupId !== null) {
                        return m.groupId === referee.assignedGroupId;
                    }
                    return true;
                }
                
                return false;
            });
        }

        // 2. Filter po stolu (ako je odabran u "Tables" tabu)
        if (viewMode === 'tables' && selectedTableId) {
            result = result.filter(m => m.tableId === selectedTableId);
        }

        // 3. Globalni filteri koji rade samo u "Svi mečevi" ili pojačavaju gornje
        if (viewMode === 'all') {
            if (searchTableId) {
                result = result.filter(m => m.tableId === searchTableId);
            }
        }

        // Pretraga po imenu (radi u svim modovima)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(m => 
                (m.player1Name || m.player1?.name || '').toLowerCase().includes(term) ||
                (m.player2Name || m.player2?.name || '').toLowerCase().includes(term)
            );
        }

        // Sortiranje
        return result.sort((a, b) => {
            if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
            if (a.status !== 'in_progress' && b.status === 'in_progress') return 1;
            if (a.status === 'pending' && b.status === 'completed') return -1;
            return 0;
        });
    }, [matches, selectedTableId, searchTableId, searchTerm, viewMode, referee]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-400 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Ucitavanje panela...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans">
            {/* Mobile-first Header */}
            <header className="bg-slate-900 shadow-xl sticky top-0 z-20 border-b border-white/5 px-4 py-3 flex justify-between items-center transition-all duration-300">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-600/20">
                        <Trophy className="text-white h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="font-black text-sm uppercase tracking-tighter leading-tight">Sudijski <span className="text-blue-500">Panel</span></h1>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{referee?.name}</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-500 transition-colors bg-slate-800 rounded-lg">
                    <LogOut className="h-4 w-4" />
                </button>
            </header>

            {/* Selection Bar */}
            <div className="bg-slate-900 border-b border-white/5 p-2 sticky top-[61px] z-10">
                <div className="flex bg-slate-950 p-1 rounded-xl gap-1">
                    <button 
                        onClick={() => setSearchParams({ tab: 'mine' })}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'mine' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Trophy size={14} /> Moji Mečevi
                    </button>
                    <button 
                        onClick={() => setSearchParams({ tab: 'tables' })}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'tables' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <LayoutGrid size={14} /> Stolovi
                    </button>
                    <button 
                        onClick={() => setSearchParams({ tab: 'all' })}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <List size={14} /> Svi Mecevi
                    </button>
                </div>
            </div>

            {/* Search Controls - Only in All Matches, Mine or Table Details */}
            {(viewMode === 'all' || viewMode === 'mine' || selectedTableId) && (
                <div className="px-4 py-3 bg-slate-900 border-b border-white/5 space-y-2">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Traži igrača..."
                                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none focus:border-blue-500 transition-all text-white"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        {viewMode === 'all' && (
                            <select 
                                value={searchTableId}
                                onChange={(e) => setSearchTableId(e.target.value)}
                                className="w-1/3 min-w-[100px] bg-slate-950 border border-white/10 rounded-xl px-2 py-2 text-[10px] font-black uppercase outline-none focus:border-blue-500 transition-all text-white"
                            >
                                <option value="">Svi Stolovi</option>
                                {tables.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
            )}

            <main className="p-4 max-w-4xl mx-auto space-y-6">
                {selectedTableId && (
                    <div className="flex justify-between items-center mb-6 bg-slate-900 p-4 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600/20 p-2 rounded-lg">
                                <TableIcon className="text-blue-500 size-5" />
                            </div>
                            <h2 className="text-xl font-black uppercase tracking-tighter">
                                {tables.find(t => t.id === selectedTableId)?.name}
                            </h2>
                        </div>
                        <button 
                            onClick={() => setSearchParams({ tab: 'tables' })}
                            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                        >
                            Zatvori
                        </button>
                    </div>
                )}

                {viewMode === 'mine' && (
                    <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {filteredMatches.length === 0 ? (
                            <div className="py-20 text-center text-slate-500 bg-slate-900 rounded-3xl border-2 border-dashed border-slate-800 flex flex-col items-center gap-4">
                                <Trophy className="size-10 opacity-10" />
                                <p className="text-xs font-black uppercase tracking-widest">Nemate direktno dodijeljenih mečeva</p>
                                <p className="text-[10px] text-slate-600 font-bold max-w-[200px] mx-auto uppercase">Prikažite "Sve mečeve" ili odaberite stol da zadužite meč.</p>
                            </div>
                        ) : (
                            filteredMatches.map(match => (
                                <MatchCard 
                                    key={match.id} 
                                    match={match} 
                                    categories={categories} 
                                    tables={tables}
                                    referee={referee}
                                    handleMatchClick={handleMatchClick}
                                />
                            ))
                        )}
                    </div>
                )}

                {viewMode === 'tables' && !selectedTableId && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {tables.map(table => {
                            const activeMatchOnTable = matches.find(m => m.tableId === table.id && m.status === 'in_progress');
                            const pendingOnTable = matches.filter(m => m.tableId === table.id && m.status === 'pending').length;
                            const isMyTable = referee?.assignedTableId === table.id;

                            return (
                                <button
                                    key={table.id}
                                    onClick={() => setSearchParams({ tab: 'tables', tableId: table.id })}
                                    className={`relative p-5 rounded-3xl border-2 transition-all text-left flex flex-col justify-between h-40 ${activeMatchOnTable ? 'bg-blue-600 border-blue-400 shadow-xl shadow-blue-600/20' : 'bg-slate-900 border-slate-800 hover:border-slate-700'} ${isMyTable ? 'ring-2 ring-emerald-500' : ''}`}
                                >
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <div className={`p-2 rounded-xl ${activeMatchOnTable ? 'bg-blue-500' : 'bg-slate-800'}`}>
                                                <TableIcon size={18} className={activeMatchOnTable ? 'text-white' : 'text-slate-500'} />
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                {isMyTable && (
                                                    <span className="bg-emerald-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-black uppercase shadow-lg shadow-emerald-500/20">
                                                        Moj Stol
                                                    </span>
                                                )}
                                                {pendingOnTable > 0 && !activeMatchOnTable && (
                                                    <span className="bg-amber-500 text-black text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase">
                                                        {pendingOnTable} meča
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <h3 className="font-black text-base mt-2 uppercase tracking-tighter leading-none">{table.name}</h3>
                                        {activeMatchOnTable && (
                                            <p className="text-[9px] text-white/70 mt-1 line-clamp-1 font-bold uppercase overflow-hidden">
                                                {(activeMatchOnTable.player1Name || activeMatchOnTable.player1?.name)} vs {(activeMatchOnTable.player2Name || activeMatchOnTable.player2?.name)}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                        {activeMatchOnTable ? (
                                            <span className="text-white animate-pulse">U Toku</span>
                                        ) : (
                                            <span className="text-slate-600">Slobodno</span>
                                        )}
                                        <ChevronRight size={14} className={activeMatchOnTable ? 'text-white' : 'text-slate-700'} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {(viewMode === 'all' || (viewMode === 'tables' && selectedTableId)) && (
                    <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {filteredMatches.length === 0 ? (
                            <div className="py-20 text-center text-slate-500 bg-slate-900 rounded-3xl border-2 border-dashed border-slate-800 flex flex-col items-center gap-4">
                                <Trophy className="size-10 opacity-10" />
                                <p className="text-xs font-black uppercase tracking-widest">Nema dostupnih meceva</p>
                            </div>
                        ) : (
                            filteredMatches.map(match => (
                                <MatchCard 
                                    key={match.id} 
                                    match={match} 
                                    categories={categories} 
                                    tables={tables}
                                    referee={referee}
                                    handleMatchClick={handleMatchClick}
                                />
                            ))
                        )}
                    </div>
                )}
            </main>

            {/* Match Modal */}
            {showMatchModal && activeMatch && (
                <div className="fixed inset-0 z-[100] overflow-y-auto">
                    <MatchUpdateModal 
                        showMatchModal={showMatchModal}
                        editingMatch={activeMatch}
                        setEditingMatch={setActiveMatch}
                        setShowMatchModal={setShowMatchModal}
                        saveMatchResult={(matchIdOrData) => {
                            const data = typeof matchIdOrData === 'string' ? activeMatch : matchIdOrData;
                            saveMatchResult(data);
                        }}
                        activeCategory={{ setsToWin: competition?.setsToWin || 2 }} 
                        tables={tables}
                    />
                </div>
            )}
        </div>
    );
};

export default RefereeDashboard;
