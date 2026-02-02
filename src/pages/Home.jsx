import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200">
            {/* Simple Nav */}
            <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
                <div className="text-2xl font-black text-blue-500 tracking-tighter">TEAMSPHERE TT</div>
                <div className="flex gap-6 items-center">
                    <Link to="/login" className="text-sm font-bold hover:text-blue-400 transition">Prijava</Link>
                    <Link to="/register" className="bg-blue-600/10 text-blue-400 border border-blue-500/20 px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-600/20 transition">Registracija</Link>
                </div>
            </nav>

            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 font-sans">
                 <div className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wide text-blue-400 uppercase bg-blue-500/10 border border-blue-500/20 rounded-full">
                    Sistem za upravljanje turnirima
                </div>
                <h1 className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent tracking-tighter italic">
                    Stoni Tenis
                </h1>
                <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Sveobuhvatna platforma za vaš klub. 
                    Organizujte lige i turnire uz automatski žrijeb, 
                    praćenje rezultata uživo i detaljnu statistiku igrača.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link to="/register" className="bg-blue-600 px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition shadow-xl shadow-blue-500/20 text-lg flex items-center justify-center gap-2">
                        Pokreni Besplatno
                    </Link>
                </div>

                <div className="mt-20 flex flex-wrap justify-center gap-12 opacity-20 grayscale">
                    <span className="text-3xl font-black font-mono tracking-tighter">BERGER_SYSTEM</span>
                    <span className="text-3xl font-black font-mono tracking-tighter">ELIMINATIONS</span>
                    <span className="text-3xl font-black font-mono tracking-tighter">LIVE_SCORING</span>
                </div>
            </div>
        </div>
    );
};

export default Home;