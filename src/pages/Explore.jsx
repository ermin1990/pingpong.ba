import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { 
  Trophy, Calendar, Search, ChevronRight, 
  MapPin, Users, Clock, ArrowRight, 
  Sparkles, CheckCircle, Activity 
} from 'lucide-react';

const Explore = () => {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all'); // all, live, upcoming, finished

    useEffect(() => {
        const q = query(collection(db, "competitions"), where("isPublic", "==", true));
        
        const unsubscribe = onSnapshot(q, (snap) => {
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCompetitions(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Kategorisi takmičenja po statusu i REALNIM DATUMIMA
    const categorizeCompetitions = (comps) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Poništi sate za čisto poređenje datuma
        
        return comps.reduce((acc, comp) => {
            const startDate = comp.startDate ? new Date(comp.startDate) : null;
            const endDate = comp.endDate ? new Date(comp.endDate) : null;
            
            if (startDate) startDate.setHours(0, 0, 0, 0);
            if (endDate) endDate.setHours(0, 0, 0, 0);
            
            // PRIORITET: Prvo gledamo realne datume, pa tek onda status
            
            // 1. Ako je završen po statusu ILI je endDate prošao
            if (comp.status === 'finished' || comp.status === 'completed' || (endDate && now > endDate)) {
                acc.finished.push(comp);
            }
            // 2. Ako je start datum u budućnosti - UVIJEK je nadolazeći
            else if (startDate && now < startDate) {
                acc.upcoming.push(comp);
            }
            // 3. Ako je između start i end datuma - UŽIVO
            else if (startDate && endDate && now >= startDate && now <= endDate) {
                acc.live.push(comp);
            }
            // 4. Ako je startDate danas ili prošao, a nema endDate ali je active
            else if (startDate && now >= startDate && comp.status === 'active') {
                acc.live.push(comp);
            }
            // 5. Ako je startDate danas ili prošao, ali NIJE označen kao active - završen je
            else if (startDate && now >= startDate && comp.status !== 'active') {
                acc.finished.push(comp);
            }
            // 6. Nema datuma, ali ima status - gledamo status
            else if (!startDate && comp.status === 'active') {
                acc.live.push(comp);
            }
            else if (!startDate && (comp.status === 'finished' || comp.status === 'completed')) {
                acc.finished.push(comp);
            }
            // 7. Sve ostalo (draft, bez datuma, bez statusa) - nadolazeći
            else {
                acc.upcoming.push(comp);
            }
            
            return acc;
        }, { live: [], upcoming: [], finished: [] });
    };

    const categorized = categorizeCompetitions(competitions);
    
    // Filtriraj po search termu
    const filterBySearch = (comps) => comps.filter(c => 
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.sport?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredLive = filterBySearch(categorized.live);
    const filteredUpcoming = filterBySearch(categorized.upcoming);
    const filteredFinished = filterBySearch(categorized.finished);

    // Format datuma
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}.`;
    };

    // Komponenta za Competition Card - KOMPAKTNI DIZAJN
    const CompetitionCard = ({ comp, badge }) => (
        <Link 
            to={comp.slug ? `/p/${comp.slug}` : `/p/${comp.id}`}
            className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-xl transition-all duration-300 flex flex-col h-full"
        >
            <div className="p-4 flex-1">
                {/* Header: Ikonica i Status */}
                <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 transition-colors">
                        <Trophy size={18} />
                    </div>
                    {badge}
                </div>

                {/* Title and Sport */}
                <div className="mb-4">
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                        {comp.sport || 'Stonoteniski'}
                    </p>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white uppercase tracking-tight leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {comp.name}
                    </h3>
                </div>

                {/* Info List */}
                <div className="space-y-1.5">
                    {comp.location && (
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <MapPin size={12} className="shrink-0" />
                            <span className="text-xs font-medium truncate">{comp.location}</span>
                        </div>
                    )}
                    {comp.startDate && (
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Calendar size={12} className="shrink-0" />
                            <span className="text-xs font-medium">
                                {formatDate(comp.startDate)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="px-4 py-3 bg-slate-50/50 dark:bg-white/5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide group-hover:text-blue-600 transition-colors">
                    Otvori Rezultate
                </span>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </div>
        </Link>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-white font-sans selection:bg-blue-500/30">
            {/* Navigation */}
            <div className="border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#070b14]/80 backdrop-blur-md sticky top-0 z-50 shadow-sm dark:shadow-none">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-xl shadow-lg shadow-blue-600/30">
                            <Trophy size={22} className="text-white" />
                        </div>
                        <span className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">PINGPONG.BA</span>
                    </Link>
                    <Link 
                        to="/login" 
                        className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors"
                    >
                        Organizatorski Panel
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Hero Header - Minimalist */}
                <div className="mb-12 text-left">
                    <h1 className="text-3xl md:text-5xl font-semibold mb-4 tracking-tight uppercase italic text-slate-900 dark:text-white">
                        Sva Takmičenja
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-normal max-w-2xl">
                        Pregledajte aktivna, nadolazeća i završena takmičenja na platformi.
                    </p>
                </div>

                {/* Search Bar - More compact */}
                <div className="relative mb-12">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" size={16} />
                    <input 
                        type="text" 
                        placeholder="Brza pretraga turnira..."
                        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm font-normal outline-none focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-64 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-16">
                        {/* LIVE TURNIRI */}
                        {filteredLive.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex items-center gap-2 bg-emerald-500 text-white px-3 py-1.5 rounded-lg shadow-lg shadow-emerald-500/20">
                                        <Activity size={14} className="animate-pulse" />
                                        <span className="text-xs font-medium uppercase tracking-wide">Uživo</span>
                                    </div>
                                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {filteredLive.map(comp => (
                                        <CompetitionCard 
                                            key={comp.id} 
                                            comp={comp}
                                            badge={
                                                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wide border border-emerald-100 dark:border-emerald-500/20">
                                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                    <span>LIVE</span>
                                                </div>
                                            }
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* NADOLAZEĆI TURNIRI */}
                        {filteredUpcoming.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex items-center gap-2 bg-amber-400 text-black px-3 py-1.5 rounded-lg shadow-lg shadow-amber-400/20">
                                        <Clock size={14} />
                                        <span className="text-xs font-medium uppercase tracking-wide">Nadolazeći</span>
                                    </div>
                                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {filteredUpcoming.map(comp => (
                                        <CompetitionCard 
                                            key={comp.id} 
                                            comp={comp}
                                            badge={
                                                <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 dark:bg-amber-400 dark:text-black px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wide border border-amber-100 dark:border-amber-400/20">
                                                    USKORO
                                                </div>
                                            }
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ZAVRŠENI TURNIRI */}
                        {filteredFinished.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex items-center gap-2 bg-slate-500 text-white px-3 py-1.5 rounded-lg shadow-lg shadow-slate-500/20">
                                        <CheckCircle size={14} />
                                        <span className="text-xs font-medium uppercase tracking-wide">Završeni</span>
                                    </div>
                                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {filteredFinished.map(comp => (
                                        <CompetitionCard 
                                            key={comp.id} 
                                            comp={comp}
                                            badge={
                                                <div className="flex items-center gap-1.5 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wide border border-slate-200 dark:border-slate-700">
                                                    ZAVRŠENO
                                                </div>
                                            }
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Empty State */}
                        {filteredLive.length === 0 && filteredUpcoming.length === 0 && filteredFinished.length === 0 && (
                            <div className="text-center py-24 bg-white dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                                <Trophy className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-6" />
                                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3 uppercase tracking-tight">
                                    {searchTerm ? 'Nema rezultata' : 'Nema javnih takmičenja'}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 font-normal text-sm max-w-md mx-auto leading-relaxed">
                                    {searchTerm 
                                        ? 'Pokušajte promijeniti pretragu ili filtere.' 
                                        : 'Trenutno nema dostupnih takmičenja. Budite prvi koji će kreirati turnir!'}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mt-24">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-xl shadow-lg shadow-blue-600/30">
                                <Trophy size={20} className="text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">PINGPONG.BA</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Sportska platforma</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            © 2026 PingPong.ba. Sva prava zadržana.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Explore;
