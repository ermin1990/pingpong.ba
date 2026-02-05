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

    // Komponenta za Competition Card
    const CompetitionCard = ({ comp, badge }) => (
        <Link 
            to={comp.slug ? `/p/${comp.slug}` : `/p/${comp.id}`}
            className="group relative bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
        >
            {/* Badge */}
            {badge && (
                <div className="absolute top-4 right-4 z-10">
                    {badge}
                </div>
            )}

            <div className="p-6">
                {/* Ikonica i Tip */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                        <Trophy size={22} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-0.5">
                            {comp.sport || 'Stonoteniski'}
                        </p>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight truncate">
                            {comp.name}
                        </h3>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="space-y-2.5 mb-4">
                    {comp.location && (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <MapPin size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                            <span className="text-xs font-bold truncate">{comp.location}</span>
                        </div>
                    )}
                    {comp.startDate && (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Calendar size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                            <span className="text-xs font-bold">
                                {formatDate(comp.startDate)}
                                {comp.endDate && comp.endDate !== comp.startDate && ` - ${formatDate(comp.endDate)}`}
                            </span>
                        </div>
                    )}
                    {comp.participantsCount > 0 && (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Users size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                            <span className="text-xs font-bold">{comp.participantsCount} igrača</span>
                        </div>
                    )}
                </div>

                {/* CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                        Pogledaj detalje
                    </span>
                    <ArrowRight size={18} className="text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform" />
                </div>
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
                        <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">PINGPONG.BA</span>
                    </Link>
                    <Link 
                        to="/login" 
                        className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors"
                    >
                        Organizatorski Panel
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-16">
                {/* Hero Header */}
                <div className="mb-16 text-center max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-blue-200 dark:border-blue-500/20">
                        <Sparkles size={14} />
                        Sportska Platforma Bosne i Hercegovine
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter leading-[0.95] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                        Sva Takmičenja<br />Na Jednom Mjestu
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                        Pratite rezultate uživo, pregledajte nadolazeće turnire i istražite arhivu završenih takmičenja.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="relative mb-12 max-w-2xl mx-auto">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" size={20} />
                    <input 
                        type="text" 
                        placeholder="Pretraži po nazivu, sportu ili lokaciji..."
                        className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl py-5 pl-16 pr-6 text-sm font-bold outline-none focus:border-blue-500 dark:focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-lg dark:shadow-2xl"
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
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/30">
                                        <Activity size={18} />
                                        <span className="text-sm font-black uppercase tracking-widest">Uživo Sada</span>
                                    </div>
                                    <div className="h-[2px] flex-1 bg-gradient-to-r from-emerald-500/20 to-transparent" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredLive.map(comp => (
                                        <CompetitionCard 
                                            key={comp.id} 
                                            comp={comp}
                                            badge={
                                                <div className="flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/40">
                                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Uživo</span>
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
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-blue-600/30">
                                        <Clock size={18} />
                                        <span className="text-sm font-black uppercase tracking-widest">Nadolazeći</span>
                                    </div>
                                    <div className="h-[2px] flex-1 bg-gradient-to-r from-blue-600/20 to-transparent" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredUpcoming.map(comp => (
                                        <CompetitionCard 
                                            key={comp.id} 
                                            comp={comp}
                                            badge={
                                                <div className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-full shadow-lg shadow-blue-600/40">
                                                    <Clock size={12} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Uskoro</span>
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
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="flex items-center gap-2 bg-gradient-to-r from-slate-500 to-slate-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-slate-500/30">
                                        <CheckCircle size={18} />
                                        <span className="text-sm font-black uppercase tracking-widest">Završeni</span>
                                    </div>
                                    <div className="h-[2px] flex-1 bg-gradient-to-r from-slate-500/20 to-transparent" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredFinished.map(comp => (
                                        <CompetitionCard 
                                            key={comp.id} 
                                            comp={comp}
                                            badge={
                                                <div className="flex items-center gap-1.5 bg-slate-500 text-white px-3 py-1.5 rounded-full shadow-lg shadow-slate-500/40">
                                                    <CheckCircle size={12} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Završeno</span>
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
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tight">
                                    {searchTerm ? 'Nema rezultata' : 'Nema javnih takmičenja'}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm max-w-md mx-auto leading-relaxed">
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
