import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { 
  Trophy, Calendar, Search, ChevronRight, 
  MapPin, Users, Clock, Activity 
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
                                {comp.sport || 'Tenis'}
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
        <div className="min-h-screen bg-[#070b14] text-slate-200 font-sans selection:bg-emerald-500/30">
            <div className="border-b border-slate-800/50 bg-[#070b14]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-4 group">
                        <div className="w-11 h-11 bg-amber-500 rounded-xl flex items-center justify-center rotate-3 shadow-lg shadow-amber-500/20 group-hover:rotate-6 transition-transform">
                            <Trophy size={26} className="text-white -rotate-3 group-hover:-rotate-6 transition-transform" />
                        </div>
                        <span className="text-xl font-black uppercase tracking-tighter text-white italic">
                            tenis<span className="text-amber-400">.ba</span>
                        </span>
                    </Link>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-14 relative">
                    <div className="absolute -top-20 -left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-[100px]" />
                    <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter mb-4 relative">ISTRAŽI <span className="text-amber-400 block md:inline">TAKMIČENJA</span></h1>
                    <p className="text-slate-400 text-base md:text-lg font-medium max-w-2xl leading-relaxed">Prati rezultate uživo, provjeri tabele i saznaj termine narednih mečeva.</p>
                </div>

                <div className="relative mb-14 max-w-2xl group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-amber-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Pretraži turnir, grad ili sport..."
                        className="w-full bg-[#0a0f1d] border border-slate-800 rounded-[20px] py-4 pl-14 pr-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/40 transition-all font-bold uppercase tracking-wide text-xs"
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
                                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tight shrink-0">Rezultati Uživo</h2>
                                    <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500/50 to-transparent" />
                                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black animate-pulse uppercase tracking-widest whitespace-nowrap">Live mečevi</span>
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
                                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tight shrink-0">U PRIPREMI</h2>
                                    <div className="h-[2px] w-full bg-gradient-to-r from-amber-500/50 to-transparent" />
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
                                <div className="flex items-center gap-4 mb-6 opacity-50">
                                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tight shrink-0">ARHIVA</h2>
                                    <div className="h-[2px] w-full bg-gradient-to-r from-slate-700 to-transparent" />
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
                            <div className="text-center py-40 bg-[#0a0f1d] border-2 border-dashed border-slate-800 rounded-[40px]">
                                <Activity size={60} className="text-slate-800 mx-auto mb-6" />
                                <h3 className="text-2xl font-black text-slate-500 uppercase italic">Nema pronađenih takmičenja</h3>
                                <button onClick={() => setSearchTerm('')} className="mt-6 text-amber-400 font-bold uppercase tracking-widest text-sm hover:underline">Očisti pretragu</button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Explore;
