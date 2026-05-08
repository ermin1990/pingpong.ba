import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { 
  Trophy, Calendar, Search, ChevronRight, 
  MapPin, Users, Clock, Activity, ArrowRight 
} from 'lucide-react';

const Explore = () => {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const q = query(collection(db, "competitions"), where("isPublic", "==", true));
        
        const unsubscribe = onSnapshot(q, (snap) => {
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCompetitions(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const categorizeCompetitions = (comps) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        return comps.reduce((acc, comp) => {
            const startDate = comp.startDate ? new Date(comp.startDate) : null;
            const endDate = comp.endDate ? new Date(comp.endDate) : null;
            if (startDate) startDate.setHours(0, 0, 0, 0);
            if (endDate) endDate.setHours(0, 0, 0, 0);
            
            if (comp.status === 'finished' || comp.status === 'completed' || (endDate && now > endDate)) {
                acc.finished.push(comp);
            } else if (startDate && now < startDate) {
                acc.upcoming.push(comp);
            } else if (startDate && now >= startDate && comp.status === 'active') {
                acc.live.push(comp);
            } else if (!startDate && comp.status === 'active') {
                acc.live.push(comp);
            } else {
                acc.upcoming.push(comp);
            }
            return acc;
        }, { live: [], upcoming: [], finished: [] });
    };

    const categorized = categorizeCompetitions(competitions);
    
    const filterBySearch = (comps) => comps.filter(c => 
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.sport?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredLive = filterBySearch(categorized.live);
    const filteredUpcoming = filterBySearch(categorized.upcoming);
    const filteredFinished = filterBySearch(categorized.finished);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('bs-BA');
    };

    const CompetitionCard = ({ comp, badge, statusType }) => {
        const isLive = statusType === 'live';
        const isUpcoming = statusType === 'upcoming';

        return (
            <Link 
                to={comp.slug ? `/p/${comp.slug}` : `/p/${comp.id}`}
                className="group relative bg-[#0a0f1d] border border-slate-800/60 rounded-[28px] overflow-hidden transition-all duration-500 hover:border-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1.5 flex flex-col h-full"
            >
                <div className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                            isLive ? 'bg-emerald-500/10 text-emerald-500' : 
                            isUpcoming ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800/50 text-slate-500'
                        } group-hover:scale-110`}>
                            <Trophy size={24} />
                        </div>
                        {badge}
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-8 h-[2px] bg-amber-500/30 rounded-full" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                {comp.sport || 'Stonoteniski'}
                            </p>
                        </div>
                        <h3 className="text-xl font-black text-white uppercase italic leading-[1.1] tracking-tight group-hover:text-amber-300 transition-colors">
                            {comp.name}
                        </h3>
                    </div>

                    <div className="space-y-4 mt-auto">
                        <div className="flex items-center gap-4 text-slate-400">
                            <div className="w-10 h-10 rounded-xl bg-slate-900/50 border border-slate-800/50 flex items-center justify-center shrink-0">
                                <MapPin size={18} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Lokacija</p>
                                <p className="text-xs font-bold text-slate-300 truncate">{comp.location || 'BIH'}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-slate-400">
                            <div className="w-10 h-10 rounded-xl bg-slate-900/50 border border-slate-800/50 flex items-center justify-center shrink-0">
                                <Calendar size={18} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Datum</p>
                                <p className="text-xs font-bold text-slate-300">
                                    {comp.startDate ? formatDate(comp.startDate) : 'Uskoro'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {[1, 2].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-lg bg-slate-800 border-2 border-[#0a0f1d] flex items-center justify-center overflow-hidden">
                                        <Users size={12} className="text-slate-500" />
                                    </div>
                                ))}
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rezultati</span>
                        </div>
                        <div className="w-10 h-10 bg-slate-800/50 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:bg-amber-500 group-hover:text-black">
                            <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </div>
                </div>
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-[#081427] text-slate-100">
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(34,197,94,0.14),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(251,191,36,0.12),transparent_30%),linear-gradient(160deg,#060f1d_0%,#081427_46%,#0a1a2f_100%)]" />
            </div>

            <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#081427]/80 backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <Link to="/" className="flex min-h-11 items-center gap-3 rounded-full pr-2">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-[0_18px_40px_-18px_rgba(16,185,129,1)]">
                            <Trophy size={20} />
                        </div>
                        <div>
                            <div className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-200">PingPong.ba</div>
                            <div className="text-xs text-slate-400">Javna takmičenja</div>
                        </div>
                    </Link>
                    <Link to="/login" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2 text-xs font-black uppercase tracking-[0.15em] text-slate-950 transition hover:bg-emerald-300">
                        Prijava <ArrowRight size={14} />
                    </Link>
                </div>
            </nav>

            <main className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
                <div className="mb-10">
                    <div className="text-xs font-black uppercase tracking-[0.17em] text-slate-400">Javni prikaz</div>
                    <h1 className="font-title text-[clamp(2.2rem,6vw,4.5rem)] leading-[0.96] tracking-tight text-white">Istraži <span className="bg-gradient-to-r from-emerald-300 to-amber-200 bg-clip-text text-transparent">takmičenja</span></h1>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">Prati rezultate uživo, provjeri tabele i saznaj termine narednih mečeva.</p>
                </div>

                <div className="relative mb-10 max-w-xl group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-300" size={16} />
                    <input 
                        type="text" 
                        placeholder="Pretraži turnir, grad ili sport..."
                        className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-300/40 focus:bg-white/8 backdrop-blur-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => <div key={i} className="h-80 bg-slate-910/30 border border-slate-800 rounded-[40px] animate-pulse" />)}
                    </div>
                ) : (
                    <div className="space-y-14">
                        {filteredLive.length > 0 && (
                            <section>
                                <div className="flex items-center gap-4 mb-6">
                                    <h2 className="font-title text-3xl text-white shrink-0">Rezultati Uživo</h2>
                                    <div className="h-px w-full bg-gradient-to-r from-emerald-400/40 to-transparent" />
                                    <span className="whitespace-nowrap rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-200">Live</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredLive.map(comp => (
                                        <CompetitionCard key={comp.id} comp={comp} statusType="live" 
                                            badge={<div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-glow" />
                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">AKTIVNO</span>
                                            </div>} 
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {filteredUpcoming.length > 0 && (
                            <section>
                                <div className="flex items-center gap-4 mb-6">
                                    <h2 className="font-title text-3xl text-white shrink-0">U pripremi</h2>
                                    <div className="h-px w-full bg-gradient-to-r from-amber-300/40 to-transparent" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredUpcoming.map(comp => (
                                        <CompetitionCard key={comp.id} comp={comp} statusType="upcoming"
                                            badge={<div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-2">
                                                <Clock size={12} className="text-amber-400" />
                                                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">USKORO</span>
                                            </div>}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {filteredFinished.length > 0 && (
                            <section>
                                <div className="flex items-center gap-4 mb-6 opacity-60">
                                    <h2 className="font-title text-3xl text-white shrink-0">Arhiva</h2>
                                    <div className="h-px w-full bg-gradient-to-r from-slate-600/50 to-transparent" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70">
                                    {filteredFinished.map(comp => (
                                        <CompetitionCard key={comp.id} comp={comp} statusType="finished"
                                            badge={<div className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ZAVRŠENO</span>
                                            </div>}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                        
                        {!filteredLive.length && !filteredUpcoming.length && !filteredFinished.length && (
                            <div className="rounded-3xl border border-white/10 bg-white/5 py-32 text-center backdrop-blur-xl">
                                <Activity size={48} className="mx-auto mb-5 text-slate-600" />
                                <h3 className="font-title text-3xl text-slate-400">Nema pronađenih takmičenja</h3>
                                <button onClick={() => setSearchTerm('')} className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-emerald-300 hover:text-emerald-200">Očisti pretragu</button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Explore;
