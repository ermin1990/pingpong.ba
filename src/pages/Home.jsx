import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Trophy, Zap, Mail, ArrowRight, CheckCircle2, Send, Loader2, Building2, CreditCard, Users, X, Activity, BookOpen } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';

const Home = () => {
    const [stats, setStats] = useState({ tournaments: 0, leagues: 0 });
    const [requestForm, setRequestForm] = useState({ 
        name: '', 
        club: '', 
        city: '', 
        phone: '', 
        email: '', 
        message: '',
        plan: 'demo'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const q = query(collection(db, "competitions"), where("status", "==", "active"));
                const snap = await getDocs(q);
                const list = snap.docs.map(d => d.data());
                setStats({
                    tournaments: list.filter(c => c.type !== 'League').length,
                    leagues: list.filter(c => c.type === 'League').length
                });
            } catch (err) {
                console.error("Stats error:", err);
            }
        };
        fetchStats();
    }, []);

    const plans = [
        {
          id: 'demo',
          name: 'Demo Verzija',
          price: '0 KM',
          period: '/ 5 dana',
          tournaments: '1 takmičenje',
          categories: '1 grupa / kategorija',
          features: ['Probni period', 'Maksimalno 12 igrača', 'Sve osnovne funkcije'],
          color: 'slate'
        },
        {
          id: 'basic',
          name: 'Jednokratni',
          price: '50 KM',
          period: '/ turnir',
          tournaments: '1 turnir',
          categories: 'Do 15 kategorija',
          features: ['Raspored mečeva', 'Live rezultati', 'Tabele'],
          color: 'blue'
        },
        {
          id: 'standard',
          name: 'Paket 5',
          price: '200 KM',
          period: '/ paket',
          tournaments: '5 turnira',
          categories: 'Neograničeno',
          features: ['Sve iz Basic', 'Statistike igrača', 'Prioritetna podrška'],
          popular: true,
          color: 'indigo'
        },
        {
          id: 'pro',
          name: 'Godišnji',
          price: '500 KM',
          period: '/ godina',
          tournaments: 'Neograničeno',
          categories: 'Neograničeno',
          features: ['Sve iz Standard', 'Custom Branding', 'Arhiva rezultata'],
          color: 'emerald'
        }
    ];

    const handleSubmitRequest = async (e) => {
        e.preventDefault();

        // Basic gmail check
        if (!requestForm.email.toLowerCase().endsWith('@gmail.com')) {
            alert('Molimo unesite ispravan Gmail nalog (@gmail.com).');
            return;
        }

        setIsSubmitting(true);
        
        const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
        const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
        
        const selectedPlan = plans.find(p => p.id === requestForm.plan);
        const text = `🚨 *NOVI ZAHTJEV ZA ODOBRENJE* 🚨\n\n` + 
                     `👤 *Ime:* ${requestForm.name}\n` +
                     `📧 *Gmail:* ${requestForm.email}\n` +
                     `🏠 *Klub:* ${requestForm.club}\n` +
                     `📍 *Grad:* ${requestForm.city}\n` +
                     `📞 *Telefon:* ${requestForm.phone}\n` +
                     `📦 *Plan:* ${selectedPlan?.name} (${selectedPlan?.price})\n` +
                     `✉️ *Poruka:* ${requestForm.message || 'Nema poruke'}`;

        try {
            // 1. Save to Firestore for Admin Dashboard
            await addDoc(collection(db, "access_requests"), {
                organizationName: requestForm.club,
                contactPerson: requestForm.name,
                email: requestForm.email.toLowerCase().trim(),
                phone: requestForm.phone,
                city: requestForm.city,
                message: requestForm.message || '',
                status: 'pending',
                selectedPlan: requestForm.plan,
                createdAt: serverTimestamp()
            });

            // 2. Send Telegram Notification
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: text,
                    parse_mode: 'Markdown'
                })
            });

            setIsSuccess(true);
        } catch (error) {
            console.error('Request error:', error);
            alert('Greška pri slanju zahtjeva. Molimo pokušajte ponovo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#070b14] text-slate-200 relative overflow-hidden font-sans">
            {/* Custom Blurred Backgrounds */}
            <div className="absolute inset-0 opacity-10 pointer-events-none select-none z-0">
                <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
            </div>

            {/* Existing Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -z-10 opacity-30 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] -z-10 opacity-20 pointer-events-none" />

            {/* Simple Nav */}
            <nav className="p-6 md:p-8 flex justify-between items-center max-w-7xl mx-auto border-b border-white/5 backdrop-blur-sm sticky top-0 z-50 bg-[#070b14]/80">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-1.5 rounded-lg">
                        <Trophy size={20} className="text-white" />
                    </div>
                    <div className="text-xl md:text-2xl font-black text-white tracking-tighter">PINGPONG.BA</div>
                </div>
                <div className="flex gap-4 md:gap-8 items-center">
                    <Link to="/login" className="bg-blue-600/10 text-blue-400 border border-blue-500/20 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-lg shadow-blue-900/20">
                        Prijava
                    </Link>
                    <Link to="/p/help" className="hidden md:inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white/90 px-3 py-2 rounded-lg border border-transparent hover:border-slate-700 transition">
                        <BookOpen size={16} className="text-slate-400" />
                        Kako koristiti
                    </Link>
                </div>
            </nav>

            <div className="flex flex-col items-center justify-center pt-20 pb-32 px-4 text-center max-w-7xl mx-auto z-10 relative">
                 <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-xs md:text-sm font-bold tracking-wide text-blue-400 uppercase bg-blue-950/40 border border-blue-500/20 rounded-full animate-fade-in-up">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    Profesionalni Sistem za Turnire
                </div>
                
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight tracking-tighter">
                    <span className="text-white">Organizuj.</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Pobjedi.</span>
                    <br/>
                    <span className="text-slate-600">Dominiraj.</span>
                </h1>
                
                <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
                    Sveobuhvatna platforma za stonoteniske klubove i organizatore. 
                    Kreiraj <span className="text-blue-400 font-bold">Bergerove tabele</span>, 
                    upravljaj <span className="text-indigo-400 font-bold">eliminacijama</span> i 
                    prati rezultate <span className="text-purple-400 font-bold">uživo</span>.
                </p>

                {/* Stats & Live link */}
                <div className="flex flex-wrap justify-center gap-10 md:gap-20 mb-16">
                    <div className="flex flex-col items-center group">
                        <div className="text-5xl md:text-6xl font-black text-white group-hover:text-blue-500 transition-colors">{stats.tournaments}</div>
                        <div className="flex items-center gap-2 mt-2">
                             <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                             <span className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Turnira Online</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center group">
                        <div className="text-5xl md:text-6xl font-black text-white group-hover:text-emerald-500 transition-colors">{stats.leagues}</div>
                        <div className="flex items-center gap-2 mt-2">
                             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                             <span className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Liga Online</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto z-20">
                    <button 
                        onClick={() => setShowForm(true)}
                        className="group bg-blue-600 text-white px-10 py-5 rounded-2xl font-black hover:bg-blue-500 transition-all shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_0_60px_-15px_rgba(37,99,235,0.6)] text-base md:text-lg flex items-center justify-center gap-3 active:scale-95"
                    >
                        Postani Organizator <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <Link to="/explore" className="bg-white/5 text-white border border-white/10 px-10 py-5 rounded-2xl font-bold hover:bg-white/20 transition-all text-base md:text-lg flex items-center justify-center backdrop-blur-sm active:scale-95 gap-3">
                        <Activity size={20} className="text-emerald-500" /> Rezultati Uživo
                    </Link>
                </div>

                {/* Request Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#070b14]/95 backdrop-blur-xl overflow-y-auto">
                        <div className="w-full max-w-5xl my-auto animate-in fade-in zoom-in-95 duration-300">
                             {!isSuccess ? (
                                <div className="space-y-8">
                                    <div className="flex justify-between items-center text-left">
                                        <div>
                                            <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Odaberite Plan</h2>
                                            <p className="text-slate-400 font-medium mt-1">Sve što vam je potrebno za profesionalni turnir ili ligu</p>
                                        </div>
                                        <button onClick={() => setShowForm(false)} className="bg-slate-900 border border-slate-800 p-3 rounded-2xl text-slate-500 hover:text-white transition-all">
                                            <X size={24} />
                                        </button>
                                    </div>

                                    {/* Plans Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                                        {plans.map(plan => (
                                            <div 
                                                key={plan.id}
                                                onClick={() => setRequestForm({...requestForm, plan: plan.id})}
                                                className={`relative bg-slate-900/50 border-2 rounded-[2rem] p-8 cursor-pointer transition-all hover:scale-[1.02] ${
                                                    requestForm.plan === plan.id 
                                                        ? 'border-blue-500 shadow-2xl shadow-blue-500/10 bg-slate-900' 
                                                        : 'border-slate-800 hover:border-slate-700'
                                                }`}
                                            >
                                                {plan.popular && (
                                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black italic tracking-widest px-5 py-1.5 rounded-full shadow-lg">
                                                        NAJPOPULARNIJE
                                                    </div>
                                                )}
                                                
                                                <div className="mb-6">
                                                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-4xl font-black text-white">{plan.price}</span>
                                                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{plan.period}</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 mb-8">
                                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
                                                        <div className="p-1.5 bg-blue-500/10 rounded-lg"><Trophy size={14} className="text-blue-400" /></div>
                                                        {plan.tournaments}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
                                                        <div className="p-1.5 bg-blue-500/10 rounded-lg"><Users size={14} className="text-blue-400" /></div>
                                                        {plan.categories}
                                                    </div>
                                                </div>

                                                <div className="border-t border-slate-800 pt-6 space-y-3">
                                                    {plan.features.map((feature, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 text-xs font-medium text-slate-400">
                                                            <CheckCircle2 size={14} className="text-blue-500" />
                                                            {feature}
                                                        </div>
                                                    ))}
                                                </div>

                                                {requestForm.plan === plan.id && (
                                                    <div className="absolute top-6 right-6 w-8 h-8 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/40">
                                                        <CheckCircle2 size={20} className="text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Contact Section */}
                                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -mr-32 -mt-32" />
                                        
                                        <div className="relative z-10 flex flex-col lg:flex-row gap-12">
                                            <div className="lg:w-1/3 text-left">
                                                <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-600/20">
                                                    <Building2 size={32} className="text-white" />
                                                </div>
                                                <h3 className="text-3xl font-black text-white italic tracking-tighter mb-4 uppercase">Informacije</h3>
                                                <p className="text-slate-400 leading-relaxed font-medium">
                                                    Molimo popunite formu kako bismo verifikovali vaš profil. Nakon slanja zahtjeva, kontaktiraćemo vas sa uputstvima za pristup.
                                                </p>
                                                
                                                <div className="mt-8 flex flex-col gap-4">
                                                    <div className="flex items-center gap-4 text-sm font-bold text-slate-300 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                                        <CreditCard className="text-blue-400" />
                                                        <span>Plan: {plans.find(p => p.id === requestForm.plan)?.name}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="lg:w-2/3">
                                                <form onSubmit={handleSubmitRequest} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Naziv Kluba / Organizacije</label>
                                                        <input 
                                                            required
                                                            placeholder="npr. STK PING PONG"
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-800 font-medium"
                                                            value={requestForm.club}
                                                            onChange={e => setRequestForm({...requestForm, club: e.target.value})}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Kontakt Osoba (Ime i prezime)</label>
                                                        <input 
                                                            required
                                                            placeholder="Ime i Prezime"
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-800 font-medium"
                                                            value={requestForm.name}
                                                            onChange={e => setRequestForm({...requestForm, name: e.target.value})}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">E-mail adresa za odobrenje (Gmail)</label>
                                                        <input 
                                                            required
                                                            type="email"
                                                            placeholder="vas-email@gmail.com"
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-800 font-medium"
                                                            value={requestForm.email}
                                                            onChange={e => setRequestForm({...requestForm, email: e.target.value})}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Broj Telefona</label>
                                                        <input 
                                                            required
                                                            placeholder="+387 6x xxx xxx"
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-800 font-medium"
                                                            value={requestForm.phone}
                                                            onChange={e => setRequestForm({...requestForm, phone: e.target.value})}
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2 space-y-2">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Gdje se nalazi vaš klub/grad?</label>
                                                        <input 
                                                            required
                                                            placeholder="Grad, Država"
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-800 font-medium"
                                                            value={requestForm.city}
                                                            onChange={e => setRequestForm({...requestForm, city: e.target.value})}
                                                        />
                                                    </div>
                                                    
                                                    <div className="md:col-span-2 pt-4">
                                                        <button 
                                                            disabled={isSubmitting}
                                                            className="group w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase italic tracking-widest py-5 rounded-2xl transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
                                                        >
                                                            {isSubmitting ? (
                                                                <Loader2 className="animate-spin" size={24} />
                                                            ) : (
                                                                <>Pošalji Zahtjev za Odobrenje <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
                                                            )}
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                             ) : (
                                <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-[3rem] p-12 text-center shadow-2xl relative overflow-hidden">
                                     <div className="absolute inset-0 bg-blue-600/5 blur-3xl rounded-full" />
                                     <div className="relative z-10">
                                        <div className="w-24 h-24 bg-emerald-500/20 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
                                            <CheckCircle2 size={48} />
                                        </div>
                                        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-4">Uspješno!</h2>
                                        <p className="text-slate-400 font-medium leading-relaxed mb-10 text-lg">
                                            Vaš zahtjev je poslat. Tim će pregledati vaš Gmail nalog i odobriti pristup u najkraćem roku.
                                        </p>
                                        <button 
                                            onClick={() => setShowForm(false)}
                                            className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-black uppercase italic tracking-widest transition-all"
                                        >
                                            Zatvori Prozori
                                        </button>
                                     </div>
                                </div>
                             )}
                        </div>
                    </div>
                )}

                {/* Info Card for Approval */}
                <div className="mt-24 max-w-3xl mx-auto">
                    <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-xl border border-slate-700/50 p-6 md:p-8 rounded-3xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all" />
                        
                        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 border border-blue-500/20 shadow-lg shadow-blue-500/5">
                                <ShieldCheck size={32} className="text-blue-400" />
                            </div>
                            <div className="text-left flex-1">
                                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                    Verifikovani Organizatori
                                </h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Da bi se osigurao kvalitet i integritet takmičenja na platformi, kreiranje novih turnira je omogućeno isključivo verifikovanim organizatorima.
                                </p>
                                <div className="mt-4">
                                     <button 
                                        onClick={() => setShowForm(true)}
                                        className="flex items-center gap-2 text-xs font-bold text-blue-300 bg-blue-900/30 py-2.5 px-6 rounded-lg border border-blue-800/50 hover:bg-blue-900/50 transition-all"
                                     >
                                        <Send size={14} />
                                        <span>Pošalji zahtjev direktno putem forme</span>
                                     </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature Grid */}
                <div id="features" className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto w-full px-4 text-left border-b border-white/5 pb-32">
                    {[
                        { icon: <CheckCircle2 size={24} />, title: "Bergerov Sistem", desc: "Automatsko generisanje Round-Robin tabela za bilo koji broj igrača." },
                        { icon: <Zap size={24} />, title: "Live Žrijeb", desc: "Eliminaciona faza se automatski kreira na osnovu rezultata iz grupa." },
                        { icon: <Trophy size={24} />, title: "Rang Liste", desc: "Pratite napredak igrača kroz detaljnu statistiku pobjeda i poraza." }
                    ].map((feature, idx) => (
                        <div key={idx} className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all">
                            <div className="mb-4 text-blue-400">{feature.icon}</div>
                            <h4 className="text-lg font-bold text-white mb-2">{feature.title}</h4>
                            <p className="text-sm text-slate-400 leading-relaxed max-w-[250px]">{feature.desc}</p>
                        </div>
                    ))}
                </div>

                {/* About Section - Modern Design */}
                <div className="mt-32 w-full max-w-6xl mx-auto px-4 pb-20">
                    <div className="relative group">
                        {/* Decorative Background Elements */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        
                        <div className="relative bg-[#0a0f1d]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-16 overflow-hidden">
                            {/* Animated Background Orbs */}
                            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] animate-pulse"></div>
                            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }}></div>

                            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                                <div className="lg:col-span-7 text-left">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6">
                                        <Activity size={12} /> O Platformi
                                    </div>
                                    
                                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-8 leading-[1.1] tracking-tighter italic uppercase">
                                        Digitalna Transformacija <br/>
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Vašeg Kluba</span>
                                    </h2>

                                    <p className="text-slate-400 text-lg md:text-xl leading-relaxed mb-10 font-medium max-w-2xl">
                                        PingPong.ba nije samo softver – to je kompletan ekosistem za upravljanje stonotenisnim takmičenjima. Od rekreativnih liga do profesionalnih turnira, mi automatizujemo sve ono što vam oduzima vrijeme.
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                                        {[
                                            { icon: <Zap size={18} />, text: "Automatski Berger & Žrijeb" },
                                            { icon: <Users size={18} />, text: "Baza Igrača i Statistika" },
                                            { icon: <Trophy size={18} />, text: "Istorija Rezultata" },
                                            { icon: <Activity size={18} />, text: "Live Mečevi Online" }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 text-slate-300">
                                                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                                    {item.icon}
                                                </div>
                                                <span className="font-bold text-sm tracking-tight">{item.text}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Availability Note */}
                                    <div className="inline-block relative">
                                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-2xl"></div>
                                        <div className="relative bg-slate-900/80 border border-blue-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
                                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                                                <ShieldCheck size={28} className="text-white" />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-sm font-black text-blue-400 uppercase tracking-widest mb-1">Pristup Platformi</div>
                                                <div className="text-white font-bold leading-tight">
                                                    Aplikacija nije besplatna, ali se može dobiti na zahtjev na <span className="text-blue-400">5 dana za testiranje</span>.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-5 relative">
                                    <div className="aspect-square rounded-[3rem] bg-gradient-to-br from-blue-600 to-indigo-700 p-1 shadow-2xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-700">
                                        <div className="w-full h-full bg-[#070b14] rounded-[2.8rem] flex flex-col items-center justify-center p-8 space-y-6">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-blue-500/40 blur-3xl rounded-full"></div>
                                                <Trophy size={100} className="text-white relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                                            </div>
                                            <div className="text-center">
                                                <div className="text-3xl font-black text-white italic tracking-tighter mb-2">PRO LEVEL</div>
                                                <div className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Tournament Management</div>
                                            </div>
                                            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                            <button 
                                                onClick={() => setShowForm(true)}
                                                className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase italic tracking-widest hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 group-hover:gap-4 transition-all"
                                            >
                                                Zatraži Demo <ArrowRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Floating Stats */}
                                    <div className="absolute -top-6 -right-6 bg-slate-900/90 border border-white/10 backdrop-blur-xl p-4 rounded-2xl shadow-2xl hidden md:block animate-bounce" style={{ animationDuration: '4s' }}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
                                                <Activity size={20} />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-[10px] font-black text-slate-500 uppercase">Live Matches</div>
                                                <div className="text-white font-black text-lg">100% Sync</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Team Section */}
                <div className="mt-32 w-full max-w-6xl mx-auto px-4 pb-20">
                    <div className="mb-12">
                        <h3 className="text-3xl md:text-4xl font-black text-center mb-12 text-white italic uppercase tracking-tighter">Tim koji je razvio aplikaciju</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Developer Card */}
                            <div className="group bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-[2.5rem] p-8 md:p-10 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-blue-500/20">
                                        <Zap size={40} className="text-white" />
                                    </div>
                                    <h4 className="text-2xl md:text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">Ermin Selimović</h4>
                                    <p className="text-blue-400 font-black text-xs md:text-sm mb-6 uppercase tracking-[0.2em]">Dizajn & Razvoj</p>
                                    <p className="text-slate-400 text-base md:text-lg mb-8 leading-relaxed font-medium">
                                        Full-stack developer i dizajner odgovoran za kompletnu izradu aplikacije,
                                        od korisničkog interfejsa do strukturne logike sistema.
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-4">
                                        <a href="https://github.com/ermin1990" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-white/20 px-6 py-3 rounded-2xl transition-all group/link">
                                            <Activity size={18} className="text-slate-400 group-hover/link:text-white" />
                                            <span className="text-slate-400 group-hover/link:text-white text-sm font-black uppercase tracking-widest">GitHub</span>
                                        </a>
                                        <a href="https://instagram.com/infinitycreative.agency" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 hover:border-pink-500/40 px-6 py-3 rounded-2xl transition-all group/link">
                                            <div className="w-5 h-5 flex items-center justify-center text-pink-500 group-hover/link:text-pink-400">
                                                <Users size={18} />
                                            </div>
                                            <span className="text-pink-400 group-hover/link:text-pink-300 text-sm font-black uppercase tracking-widest">Instagram</span>
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Consultant Card */}
                            <div className="group bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-[2.5rem] p-8 md:p-10 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-purple-500/20">
                                        <Trophy size={40} className="text-white" />
                                    </div>
                                    <h4 className="text-2xl md:text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">Sanel Moranjkić</h4>
                                    <p className="text-purple-400 font-black text-xs md:text-sm mb-6 uppercase tracking-[0.2em]">Analiza & Takmičarska Logika</p>
                                    <p className="text-slate-400 text-base md:text-lg mb-8 leading-relaxed font-medium">
                                        Tehnička podrška u razvoju aplikacije i ekspertiza u takmičarskim procesima.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

               
            </div>
            
            <footer className="py-8 text-center text-slate-600 text-xs border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-center md:text-left">&copy; {new Date().getFullYear()} PingPong.ba Platforma. Sva prava zadržana.</p>
                    <div>
                        <Link to="/p/help" className="text-slate-400 hover:text-white text-sm flex items-center gap-2">
                            <BookOpen size={14} /> Kako koristiti javni prikaz
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;