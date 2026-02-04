import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { Trophy, Activity, Calendar, Search, ChevronRight, LayoutGrid } from 'lucide-react';

const Explore = () => {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const q = query(collection(db, "competitions"), where("isPublic", "==", true));
        
        const unsubscribe = onSnapshot(q, (snap) => {
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort by active first, then date
            setCompetitions(list.sort((a, b) => {
                if (a.status === 'active' && b.status !== 'active') return -1;
                if (a.status !== 'active' && b.status === 'active') return 1;
                return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
            }));
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filtered = competitions.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.sport.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#070b14] text-white font-sans selection:bg-blue-500/30">
            {/* Nav */}
            <div className="border-b border-white/5 bg-[#070b14]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <Trophy size={20} className="text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tighter">PINGPONG.BA</span>
                    </Link>
                    <Link to="/login" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                        Organizatorski Panel
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Rezultati Uživo</h1>
                    <p className="text-slate-500 font-medium">Pregledajte aktivne turnire i lige u realnom vremenu.</p>
                </div>

                {/* Search */}
                <div className="relative mb-12">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
                    <input 
                        type="text" 
                        placeholder="Pretraži takmičenje ili sport..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-3xl py-5 pl-16 pr-6 text-sm font-bold outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-600 shadow-2xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-slate-900/50 border border-slate-800 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-24 bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[3rem]">
                        <Activity className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-400">Trenutno nema javnih takmičenja</h3>
                        <p className="text-slate-600 mt-2 text-sm">Pokušajte kasnije ili kreirajte svoje takmičenje.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map(comp => (
                            <Link 
                                key={comp.id}
                                to={comp.slug ? `/p/${comp.slug}` : `/p/${comp.id}`}
                                className="group relative bg-slate-900 border border-white/5 rounded-3xl p-8 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5 transition-all"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${comp.type === 'League' ? 'from-emerald-500/20 to-teal-500/20 text-emerald-500' : 'from-blue-500/20 to-indigo-500/20 text-blue-500'} border border-current/10`}>
                                        {comp.type === 'League' ? <LayoutGrid size={24} /> : <Trophy size={24} />}
                                    </div>
                                    {comp.status === 'active' && (
                                        <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Uživo</span>
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-xl font-black text-white mb-2 group-hover:text-blue-400 transition-colors truncate">
                                    {comp.name}
                                </h3>
                                
                                <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Activity size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{comp.sport}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Calendar size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{comp.type === 'League' ? 'Liga' : 'Turnir'}</span>
                                    </div>
                                </div>

                                <div className="absolute bottom-8 right-8 text-blue-500 group-hover:translate-x-2 transition-transform">
                                    <ChevronRight size={24} />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Explore;
