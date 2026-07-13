import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Trophy, Zap, ArrowRight, CheckCircle2, Send, Loader2, Building2, CreditCard, Users, X, Activity, BookOpen, Briefcase, Gift, Calendar, Sparkles, ArrowDown, Layers, Wifi, Star, Radio, Undo2, UserPlus2, KeyRound } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';

const Home = () => {
    const [stats, setStats] = useState({ tournaments: 0, leagues: 0 });
    const [scrolled, setScrolled] = useState(false);
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

    // Sticky nav shadow on scroll
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Scroll-reveal
    useEffect(() => {
        const els = document.querySelectorAll('.reveal');
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('is-visible');
                    io.unobserve(e.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        els.forEach(el => io.observe(el));
        return () => io.disconnect();
    }, []);

    const plans = [
        {
          id: 'demo',
          name: 'Demo Verzija',
          price: '0 KM',
          period: '/ 5 dana',
          tournaments: '1 takmičenje',
          categories: '1 grupa / kategorija',
          features: ['Probni period', 'Maksimalno 12 igrača', 'Sve osnovne funkcije']
        },
        {
          id: 'basic',
          name: 'Jednokratni',
          price: '50 KM',
          period: '/ turnir',
          tournaments: '1 turnir',
          categories: 'Do 15 kategorija',
          features: ['Raspored mečeva', 'Live rezultati', 'Tabele']
        },
        {
          id: 'standard',
          name: 'Paket 5',
          price: '200 KM',
          period: '/ paket',
          tournaments: '5 turnira',
          categories: 'Neograničeno',
          features: ['Sve iz Basic', 'Statistike igrača', 'Prioritetna podrška'],
          popular: true
        },
        {
          id: 'pro',
          name: 'Godišnji',
          price: '500 KM',
          period: '/ godina',
          tournaments: 'Neograničeno',
          categories: 'Neograničeno',
          features: ['Sve iz Standard', 'Custom Branding', 'Arhiva rezultata']
        }
    ];

    const choosePlan = (planId) => {
        setRequestForm(prev => ({ ...prev, plan: planId }));
        setShowForm(true);
    };

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

    const selectedPlan = plans.find(p => p.id === requestForm.plan);

    const marqueeItems = ['Automatski žrijeb', 'Berger sistem', 'Parovi za dublove', 'Live rezultati', 'Eliminacija uživo', 'Korporativne lige', 'Rang liste', 'Statistike igrača', 'PDF izvještaji', 'Javni prikaz'];

    return (
        <div className="min-h-screen bg-[#06090f] text-slate-200 relative overflow-x-hidden font-body antialiased selection:bg-lime-400/30 selection:text-white">
            {/* ── Ambient background ─────────────────────────────── */}
            <div className="fixed inset-0 -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-1/2 w-[1200px] h-[700px] bg-lime-500/15 rounded-full blur-[150px] animate-aurora" />
                <div className="absolute top-[70%] right-[-10%] w-[800px] h-[560px] bg-emerald-400/10 rounded-full blur-[130px] animate-aurora-2" />
                <div className="absolute bottom-0 left-[-5%] w-[700px] h-[450px] bg-lime-500/[0.06] rounded-full blur-[120px]" />
                {/* faint grid */}
                <div
                    className="absolute inset-0 opacity-[0.15]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)',
                        backgroundSize: '64px 64px',
                        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent 75%)'
                    }}
                />
            </div>
            {/* grain */}
            <div className="grain-overlay fixed inset-0 -z-10 opacity-[0.04] pointer-events-none mix-blend-overlay" />

            {/* ── Nav ────────────────────────────────────────────── */}
            <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#06090f]/80 backdrop-blur-xl border-b border-white/[0.06]' : 'bg-transparent border-b border-transparent'}`}>
                <div className="max-w-7xl mx-auto px-5 md:px-8 h-[70px] flex justify-between items-center">
                    <a href="#top" className="flex items-center gap-2.5 group">
                        <Logo />
                        <span className="font-display text-xl font-semibold text-white tracking-tight">TENIS<span className="text-lime-400">.BA</span></span>
                    </a>
                    <div className="flex gap-1.5 md:gap-2 items-center">
                        <a href="#features" className="hidden md:inline-flex items-center text-sm text-slate-400 hover:text-white px-3.5 py-2 rounded-lg transition-colors">
                            Mogućnosti
                        </a>
                        <a href="#pricing" className="hidden md:inline-flex items-center text-sm text-slate-400 hover:text-white px-3.5 py-2 rounded-lg transition-colors">
                            Cjenovnik
                        </a>
                        <Link to="/p/help" className="hidden md:inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white px-3.5 py-2 rounded-lg transition-colors">
                            <BookOpen size={15} /> Vodič
                        </Link>
                        <Link to="/login" className="ml-1 relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-black bg-gradient-to-r from-lime-300 to-lime-400 hover:from-lime-200 hover:to-lime-300 transition-all shadow-[0_4px_24px_-6px_rgba(163,230,53,0.5)]">
                            Prijava <ArrowRight size={15} />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── HERO ───────────────────────────────────────────── */}
            <header id="top" className="relative pt-36 md:pt-44 pb-24 px-5 text-center">
                {/* court motif */}
                <svg className="absolute top-24 left-1/2 -translate-x-1/2 w-[min(1150px,95%)] h-[560px] text-emerald-300/[0.07] pointer-events-none select-none" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                    <rect x="40" y="40" width="720" height="420" rx="16" fill="none" stroke="currentColor" strokeWidth="2" />
                    <line x1="40" y1="250" x2="760" y2="250" stroke="currentColor" strokeWidth="2" />
                    <line x1="400" y1="40" x2="400" y2="460" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 10" />
                    <line x1="180" y1="130" x2="620" y2="130" stroke="currentColor" strokeWidth="1" />
                    <line x1="180" y1="370" x2="620" y2="370" stroke="currentColor" strokeWidth="1" />
                </svg>

                <div className="relative max-w-5xl mx-auto">
                    <div className="reveal inline-flex items-center gap-2.5 px-4 py-2 mb-9 text-[11px] md:text-xs font-medium tracking-[0.15em] text-lime-200 uppercase bg-lime-500/[0.08] border border-lime-400/20 rounded-full backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-300 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-400"></span>
                        </span>
                        Tenis platforma za BiH · uživo bodovanje, poen po poen
                    </div>

                    <h1 className="reveal reveal-delay-1 font-display text-[3.25rem] leading-[0.95] md:text-8xl font-semibold mb-7 tracking-[-0.03em] text-white max-w-4xl mx-auto">
                        Organizuj. Odigraj.
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-lime-200 to-emerald-300">Dominiraj.</span>
                    </h1>

                    <p className="reveal reveal-delay-2 text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Kompletna platforma za teniske klubove, lige i <span className="text-slate-200 font-medium">firme koje žele turnir za svoje zaposlene</span>. Vodite meč <span className="text-emerald-300 font-medium">uživo, poen po poen</span> — 0, 15, 30, 40 — i pratite rezultat u realnom vremenu, bez papira i Excela.
                    </p>

                    <div className="reveal reveal-delay-3 flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                        <button
                            onClick={() => setShowForm(true)}
                            className="sheen-parent group w-full sm:w-auto bg-gradient-to-r from-lime-300 to-lime-400 text-black px-9 py-4 rounded-2xl font-semibold hover:from-lime-200 hover:to-lime-300 transition-all shadow-[0_0_50px_-12px_rgba(163,230,53,0.6)] text-base flex items-center justify-center gap-2.5 active:scale-[0.98]"
                        >
                            Postani organizator <ArrowRight size={19} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <Link to="/explore" className="group w-full sm:w-auto bg-white/[0.04] text-white border border-white/10 px-9 py-4 rounded-2xl font-medium hover:bg-white/[0.09] hover:border-white/20 transition-all text-base flex items-center justify-center gap-2.5 backdrop-blur-sm active:scale-[0.98]">
                            <Activity size={19} className="text-emerald-300" /> Pogledaj takmičenja
                        </Link>
                    </div>

                    {/* Live scoreboard mockup - concrete proof of the point-by-point live scoring feature */}
                    <div className="reveal reveal-delay-3 max-w-md mx-auto mb-12">
                        <div className="relative bg-slate-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-sm shadow-2xl">
                            <div className="flex items-center justify-center gap-2 mb-5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                </span>
                                <span className="text-[10px] font-bold text-red-400 uppercase tracking-[0.25em]">Uživo · Kolo 2</span>
                            </div>
                            <div className="grid grid-cols-2 divide-x divide-white/10">
                                <div className="text-center px-3">
                                    <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-2 truncate">Ana &amp; Berina</div>
                                    <div className="font-display text-5xl md:text-6xl font-bold text-lime-400 tabular-nums">40</div>
                                    <div className="text-[10px] text-slate-500 mt-2 font-medium">1 SET</div>
                                </div>
                                <div className="text-center px-3">
                                    <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-2 truncate">Ceca &amp; Dina</div>
                                    <div className="font-display text-5xl md:text-6xl font-bold text-emerald-400 tabular-nums">AD</div>
                                    <div className="text-[10px] text-slate-500 mt-2 font-medium">0 SETOVA</div>
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-white/[0.06] text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                                <Undo2 size={12} /> Poništi poen dostupno sudiji u svakom trenutku
                            </div>
                        </div>
                    </div>

                    {/* Stats / tags */}
                    {(stats.tournaments > 0 || stats.leagues > 0) ? (
                        <div className="reveal reveal-delay-4 inline-flex items-stretch gap-2 p-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm">
                            <div className="flex items-center gap-3 px-6 py-3">
                                <div className="font-display text-4xl md:text-5xl font-semibold text-white">{stats.tournaments}</div>
                                <div className="text-left">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse" />
                                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Turnira</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500">online sada</div>
                                </div>
                            </div>
                            <div className="w-px bg-white/10 my-2" />
                            <div className="flex items-center gap-3 px-6 py-3">
                                <div className="font-display text-4xl md:text-5xl font-semibold text-white">{stats.leagues}</div>
                                <div className="text-left">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Liga</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500">u toku</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="reveal reveal-delay-4 flex flex-wrap justify-center gap-2.5">
                            {['Uživo bodovanje poen-po-poen', 'Automatski žrijeb', 'Parovi za dublove', 'Praćenje meča uživo', 'Korporativne lige'].map((tag, i) => (
                                <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/10 rounded-full text-sm text-slate-300">
                                    <CheckCircle2 size={14} className="text-emerald-400" /> {tag}
                                </div>
                            ))}
                        </div>
                    )}

                    <a href="#trust" className="reveal reveal-delay-4 hidden md:flex flex-col items-center gap-2 mt-20 text-slate-600 hover:text-slate-400 transition-colors">
                        <span className="text-[10px] uppercase tracking-[0.3em]">Skroluj</span>
                        <ArrowDown size={16} className="animate-bounce" />
                    </a>
                </div>
            </header>

            {/* ── Marquee ticker ─────────────────────────────────── */}
            <div className="relative py-5 border-y border-white/[0.06] bg-white/[0.015] overflow-hidden">
                <div className="flex w-max animate-marquee">
                    {[...marqueeItems, ...marqueeItems].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 px-8 text-slate-500 whitespace-nowrap">
                            <Sparkles size={13} className="text-lime-400/70" />
                            <span className="font-display text-sm font-medium uppercase tracking-widest">{item}</span>
                        </div>
                    ))}
                </div>
                <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#06090f] to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#06090f] to-transparent pointer-events-none" />
            </div>

            {/* ── Trust strip ────────────────────────────────────── */}
            <section id="trust" className="relative py-20 md:py-24 px-5">
                <div className="max-w-3xl mx-auto reveal">
                    <div className="relative bg-gradient-to-br from-slate-900/80 to-slate-900/30 backdrop-blur-xl border border-white/[0.08] p-7 md:p-9 rounded-3xl overflow-hidden group hover:border-emerald-400/25 transition-all duration-500">
                        <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-400/10 rounded-full blur-3xl group-hover:bg-lime-400/15 transition-all duration-700" />
                        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-400/10 flex items-center justify-center flex-shrink-0 border border-emerald-400/20">
                                <ShieldCheck size={30} className="text-emerald-300" />
                            </div>
                            <div className="text-center md:text-left flex-1">
                                <h3 className="font-display text-xl font-semibold text-white mb-2">Verifikovani organizatori</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Da bi se osigurao kvalitet i integritet takmičenja, kreiranje novih turnira je omogućeno isključivo verifikovanim organizatorima.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowForm(true)}
                                className="shrink-0 flex items-center gap-2 text-sm font-semibold text-emerald-300 bg-emerald-400/10 py-3 px-6 rounded-xl border border-emerald-400/20 hover:bg-emerald-400/20 transition-all"
                            >
                                <Send size={15} /> Zatraži pristup
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Features (bento) ───────────────────────────────── */}
            <section id="features" className="relative py-16 md:py-24 px-5 scroll-mt-24">
                <div className="max-w-6xl mx-auto">
                    <div className="max-w-2xl mb-14 reveal">
                        <SectionEyebrow icon={<Layers size={13} />}>Mogućnosti</SectionEyebrow>
                        <h2 className="font-display text-3xl md:text-5xl font-semibold text-white tracking-[-0.02em] leading-tight mb-5">
                            Sve što turnir traži — <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-300">na jednom mjestu</span>
                        </h2>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            Od prijave igrača do posljednjeg finala. Automatizujemo dosadan dio, vi se fokusirate na igru.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                        {/* Large feature - live scoring, the newest and most differentiating capability */}
                        <div className="reveal md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-slate-900/70 to-slate-900/20 p-8 md:p-10 hover:border-emerald-400/25 transition-all duration-500">
                            <div className="absolute -top-20 -right-20 w-56 h-56 bg-emerald-400/10 rounded-full blur-3xl group-hover:bg-emerald-400/20 transition-all duration-700" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-6">
                                    <Radio size={24} />
                                </div>
                                <h3 className="font-display text-2xl md:text-3xl font-semibold text-white mb-3">Uživo bodovanje, poen po poen</h3>
                                <p className="text-slate-400 leading-relaxed max-w-md mb-8">
                                    Sudija ili organizator vodi meč sa terena — 0, 15, 30, 40, prednost i tie-break, baš kao u tenisu. Svaki poen se odmah vidi na javnom prikazu, bez čekanja na kraj meča, uz mogućnost poništavanja pogrešno unesenog poena.
                                </p>
                                {/* mini live scoreboard */}
                                <div className="flex items-center gap-3 text-xs text-slate-500 font-display uppercase tracking-widest">
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10">
                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> Uživo
                                    </span>
                                    <span className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10">Gem 40</span>
                                    <ArrowRight size={14} className="text-emerald-400" />
                                    <span className="px-3 py-1.5 rounded-lg bg-emerald-400/10 border border-emerald-400/20 text-emerald-300">Set 1:0</span>
                                </div>
                            </div>
                        </div>

                        <FeatureCard icon={<Wifi size={22} />} title="Praćenje meča uživo" delay="reveal-delay-1">
                            Gledaoci, kolege iz firme ili roditelji prate rezultat u realnom vremenu na javnoj stranici, bez potrebe da su na licu mjesta.
                        </FeatureCard>

                        <FeatureCard icon={<Zap size={22} />} title="Live žrijeb & eliminacija" delay="reveal-delay-2">
                            Eliminaciona faza se generiše automatski na osnovu rezultata iz grupa — Berger sistem, seeding i raspored za par klikova.
                        </FeatureCard>

                        <FeatureCard icon={<Users size={22} />} title="Parovi za dublove" delay="reveal-delay-1">
                            Uparite igrače u timove i generišite grupe za dubl format u par klikova.
                        </FeatureCard>

                        <FeatureCard icon={<Trophy size={22} />} title="Rang liste" delay="reveal-delay-2">
                            Pratite napredak igrača i timova kroz detaljnu statistiku pobjeda i poraza.
                        </FeatureCard>
                    </div>
                </div>
            </section>

            {/* ── Self sign-up + player portal ───────────────────── */}
            <section className="relative py-16 md:py-24 px-5">
                <div className="max-w-6xl mx-auto">
                    <div className="max-w-2xl mb-14 reveal">
                        <SectionEyebrow icon={<UserPlus2 size={13} />}>Novo</SectionEyebrow>
                        <h2 className="font-display text-3xl md:text-5xl font-semibold text-white tracking-[-0.02em] leading-tight mb-5">
                            Igrači se prijave sami, <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-300">vi samo odobrite</span>
                        </h2>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            Idealno za amaterske lige — objavite javni poziv, igrači se prijave preko javne stranice, a svaki odobreni igrač dobija svoj nalog i vidi sve svoje mečeve.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                        <FeatureCard icon={<Send size={22} />} title="Javna prijava na turnir/ligu">
                            Podijelite link javne stranice — svako se može prijaviti sam, uz ime, email i (opciono) kategoriju. Bez Excela, bez grupa na Viberu.
                        </FeatureCard>

                        <FeatureCard icon={<ShieldCheck size={22} />} title="Vi odobravate ko igra" delay="reveal-delay-1">
                            Sve prijave stižu u jedan pregled. Odobrite ili odbijte jednim klikom — možete i sami ručno dodati igrača i njegov email.
                        </FeatureCard>

                        <FeatureCard icon={<KeyRound size={22} />} title="Igrač dobija svoj nalog" delay="reveal-delay-2">
                            Nakon odobrenja, igrač na email dobija link da postavi lozinku. Uloguje se i vidi svoju poziciju u tabeli, ko mu je slijedeći protivnik, i sam upisuje rezultat — ili vodi meč uživo, poen po poen.
                        </FeatureCard>
                    </div>
                </div>
            </section>

            {/* ── How it works ──────────────────────────────────── */}
            <section className="relative py-16 md:py-24 px-5">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center max-w-2xl mx-auto mb-14 reveal">
                        <SectionEyebrow icon={<Activity size={13} />} center>Kako funkcioniše</SectionEyebrow>
                        <h2 className="font-display text-3xl md:text-5xl font-semibold text-white tracking-[-0.02em] leading-tight">
                            Turnir spreman za <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-lime-300">tri koraka</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
                        {[
                            { n: '01', title: 'Kreiraj takmičenje', desc: 'Odaberi format — grupe, eliminacija ili liga. Dodaj kategorije i unesi igrače ili timove.' },
                            { n: '02', title: 'Generiši raspored', desc: 'Platforma automatski pravi žrijeb, parove i raspored mečeva po Berger sistemu.' },
                            { n: '03', title: 'Igraj & prati uživo', desc: 'Vodi meč poen po poen sa terena, a tabele, eliminacija i javni prikaz se ažuriraju automatski, u realnom vremenu.' }
                        ].map((step, i) => (
                            <div key={i} className={`reveal reveal-delay-${i + 1} relative rounded-3xl border border-white/[0.08] bg-slate-900/40 p-8 hover:border-white/20 transition-all duration-500`}>
                                <div className="font-display text-6xl font-semibold text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-white/[0.03] mb-4">{step.n}</div>
                                <h3 className="font-display text-xl font-semibold text-white mb-3">{step.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Corporate / B2B ───────────────────────────────── */}
            <section className="relative py-16 md:py-24 px-5">
                <div className="max-w-6xl mx-auto reveal">
                    <div className="relative bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-slate-900/30 border border-emerald-400/15 rounded-[2rem] p-8 md:p-14 overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-400/10 rounded-full blur-[110px] pointer-events-none" />

                        <div className="relative z-10 text-center max-w-3xl mx-auto mb-12">
                            <SectionEyebrow icon={<Briefcase size={13} />} center variant="lime">Za firme i organizacije</SectionEyebrow>
                            <h2 className="font-display text-3xl md:text-5xl font-semibold text-white tracking-[-0.02em] leading-tight mb-5">
                                Team building koji se <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-lime-300">pamti</span>
                            </h2>
                            <p className="text-slate-400 text-lg leading-relaxed">
                                Organizujte teniski turnir za zaposlene bez ijedne tabele u Excelu. Mi vodimo žrijeb, raspored i rezultate uživo — vi samo dođete i igrate.
                            </p>
                        </div>

                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-11">
                            {[
                                { icon: <Users size={22} />, title: 'Zaposleni kao timovi', desc: 'Prijavite odjele ili timove firme, mi generišemo dublove i raspored mečeva.' },
                                { icon: <Calendar size={22} />, title: 'Liga kroz sezonu', desc: 'Od jednodnevnog turnira do korporativne lige koja traje cijelu sezonu.' },
                                { icon: <Gift size={22} />, title: 'Brendirano za vas', desc: 'Naziv firme, boje i logo na javnoj stranici turnira i u rezultatima.' }
                            ].map((item, idx) => (
                                <div key={idx} className="bg-slate-950/50 border border-white/[0.06] rounded-2xl p-6 hover:border-emerald-400/25 transition-all">
                                    <div className="w-11 h-11 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-300 mb-4">
                                        {item.icon}
                                    </div>
                                    <h4 className="font-display text-white font-semibold mb-2">{item.title}</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="relative z-10 flex justify-center">
                            <button
                                onClick={() => setShowForm(true)}
                                className="sheen-parent group bg-gradient-to-r from-emerald-300 to-emerald-400 text-black px-9 py-4 rounded-2xl font-semibold hover:from-emerald-200 hover:to-emerald-300 transition-all shadow-[0_0_45px_-12px_rgba(163,230,53,0.6)] flex items-center justify-center gap-2.5 active:scale-[0.98]"
                            >
                                Zatraži ponudu za firmu <ArrowRight size={19} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Pricing ───────────────────────────────────────── */}
            <section id="pricing" className="relative py-16 md:py-24 px-5 scroll-mt-24">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center max-w-2xl mx-auto mb-14 reveal">
                        <SectionEyebrow icon={<CreditCard size={13} />} center>Cjenovnik</SectionEyebrow>
                        <h2 className="font-display text-3xl md:text-5xl font-semibold text-white tracking-[-0.02em] leading-tight mb-5">
                            Bez skrivenih troškova
                        </h2>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            Plaćate samo ono što vam treba — od jednog vikend turnira do cijele sezone.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {plans.map((plan, i) => (
                            <div
                                key={plan.id}
                                className={`reveal reveal-delay-${(i % 4) + 1} relative flex flex-col rounded-3xl p-7 transition-all duration-500 hover:-translate-y-1 ${
                                    plan.popular
                                        ? 'border-2 border-lime-400/50 bg-gradient-to-b from-lime-950/30 to-slate-900/60 shadow-[0_20px_60px_-20px_rgba(163,230,53,0.25)]'
                                        : 'border border-white/[0.08] bg-slate-900/40 hover:border-white/20'
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-lime-300 to-lime-400 text-black text-[10px] font-bold tracking-[0.15em] uppercase px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                                        <Star size={11} fill="currentColor" /> Najpopularnije
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="font-display text-lg font-semibold text-white mb-3">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="font-display text-4xl font-semibold text-white">{plan.price}</span>
                                        <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">{plan.period}</span>
                                    </div>
                                </div>

                                <div className="space-y-2.5 mb-5">
                                    <div className="flex items-center gap-3 text-sm text-slate-300">
                                        <div className="p-1.5 bg-emerald-400/10 rounded-lg"><Trophy size={14} className="text-emerald-300" /></div>
                                        {plan.tournaments}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-300">
                                        <div className="p-1.5 bg-emerald-400/10 rounded-lg"><Users size={14} className="text-emerald-300" /></div>
                                        {plan.categories}
                                    </div>
                                </div>

                                <div className="border-t border-white/[0.08] pt-5 space-y-3 mb-7 flex-1">
                                    {plan.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-2.5 text-sm text-slate-400">
                                            <CheckCircle2 size={15} className="text-lime-400 shrink-0" />
                                            {feature}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => choosePlan(plan.id)}
                                    className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
                                        plan.popular
                                            ? 'bg-gradient-to-r from-lime-300 to-lime-400 hover:from-lime-200 hover:to-lime-300 text-black shadow-lg shadow-lime-500/20'
                                            : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/10'
                                    }`}
                                >
                                    Odaberi plan
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── About ─────────────────────────────────────────── */}
            <section className="relative py-16 md:py-24 px-5">
                <div className="max-w-6xl mx-auto reveal">
                    <div className="relative bg-[#0a0f1d]/70 backdrop-blur-xl border border-white/[0.08] rounded-[2rem] p-8 md:p-16 overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-lime-500/10 rounded-full blur-[90px]" />
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-400/10 rounded-full blur-[90px]" />

                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                            <div className="lg:col-span-7 text-left">
                                <SectionEyebrow icon={<Activity size={13} />}>O platformi</SectionEyebrow>
                                <h2 className="font-display text-3xl md:text-5xl font-semibold text-white mb-7 leading-[1.1] tracking-[-0.02em]">
                                    Digitalna transformacija <br className="hidden md:block" />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-300">vašeg kluba ili firme</span>
                                </h2>
                                <p className="text-slate-400 text-lg leading-relaxed mb-9 max-w-2xl">
                                    Tenis.ba nije samo softver — to je kompletan ekosistem za upravljanje teniskim takmičenjima. Od rekreativnih liga do korporativnih turnira, automatizujemo sve ono što vam oduzima vrijeme.
                                </p>

                                <div className="inline-flex items-center gap-4 bg-slate-900/70 border border-lime-400/25 rounded-2xl p-5">
                                    <div className="w-12 h-12 bg-gradient-to-br from-lime-300 to-lime-500 rounded-xl flex items-center justify-center shadow-lg shadow-lime-900/40 shrink-0">
                                        <ShieldCheck size={26} className="text-black" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xs font-semibold text-lime-400 uppercase tracking-widest mb-1">Pristup platformi</div>
                                        <div className="text-slate-200 text-sm font-medium leading-snug">
                                            Aplikacija se dobija na zahtjev — uz <span className="text-lime-400 font-semibold">5 dana besplatnog testiranja</span>.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-5 relative">
                                <div className="aspect-square rounded-[2.5rem] bg-gradient-to-br from-lime-400 to-emerald-400 p-[1.5px] shadow-2xl">
                                    <div className="w-full h-full bg-[#06090f] rounded-[2.4rem] flex flex-col items-center justify-center p-8 gap-6">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-lime-400/40 blur-3xl rounded-full" />
                                            <Trophy size={92} className="text-white relative z-10 drop-shadow-[0_0_18px_rgba(255,255,255,0.35)]" />
                                        </div>
                                        <div className="text-center">
                                            <div className="font-display text-2xl font-semibold text-white tracking-tight mb-1">TENIS PRO</div>
                                            <div className="text-slate-500 font-medium uppercase tracking-[0.25em] text-[10px]">Tournament Management</div>
                                        </div>
                                        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                                        <button
                                            onClick={() => setShowForm(true)}
                                            className="w-full py-3.5 bg-white text-black rounded-xl font-semibold hover:bg-lime-50 transition-colors flex items-center justify-center gap-2 group"
                                        >
                                            Zatraži demo <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>

                                <div className="absolute -top-5 -right-3 bg-slate-900/90 border border-white/10 backdrop-blur-xl p-4 rounded-2xl shadow-2xl hidden md:block">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-400/15 rounded-xl flex items-center justify-center text-emerald-400">
                                            <Wifi size={19} />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Live matches</div>
                                            <div className="font-display text-white font-semibold">100% sync</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Team ──────────────────────────────────────────── */}
            <section className="relative py-16 md:py-24 px-5">
                <div className="max-w-5xl mx-auto">
                    <h3 className="reveal font-display text-3xl md:text-4xl font-semibold text-center mb-12 text-white tracking-[-0.02em]">Tim koji je razvio aplikaciju</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="reveal group bg-slate-900/50 backdrop-blur-sm rounded-3xl p-8 md:p-10 border border-lime-400/15 hover:border-lime-400/35 transition-all duration-500">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-lime-300 to-lime-500 rounded-2xl flex items-center justify-center mb-7 group-hover:scale-105 transition-transform duration-500 shadow-xl shadow-lime-500/20">
                                    <Zap size={38} className="text-black" />
                                </div>
                                <h4 className="font-display text-2xl font-semibold text-white mb-1.5">Ermin Selimović</h4>
                                <p className="text-lime-400 font-semibold text-xs mb-5 uppercase tracking-[0.2em]">Dizajn & Razvoj</p>
                                <p className="text-slate-400 text-base mb-7 leading-relaxed">
                                    Full-stack developer i dizajner odgovoran za kompletnu izradu aplikacije, od korisničkog interfejsa do strukturne logike sistema.
                                </p>
                                <div className="flex flex-wrap justify-center gap-3">
                                    <a href="https://github.com/ermin1990" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-950 border border-white/10 hover:border-white/25 px-5 py-2.5 rounded-xl transition-all group/link">
                                        <Activity size={17} className="text-slate-400 group-hover/link:text-white" />
                                        <span className="text-slate-400 group-hover/link:text-white text-xs font-semibold uppercase tracking-widest">GitHub</span>
                                    </a>
                                    <a href="https://instagram.com/infinitycreative.agency" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-lime-400/10 border border-lime-400/20 hover:border-lime-400/40 px-5 py-2.5 rounded-xl transition-all">
                                        <Users size={17} className="text-lime-400" />
                                        <span className="text-lime-300 text-xs font-semibold uppercase tracking-widest">Instagram</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="reveal reveal-delay-1 group bg-slate-900/50 backdrop-blur-sm rounded-3xl p-8 md:p-10 border border-emerald-400/15 hover:border-emerald-400/35 transition-all duration-500">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-emerald-300 to-emerald-500 rounded-2xl flex items-center justify-center mb-7 group-hover:scale-105 transition-transform duration-500 shadow-xl shadow-emerald-500/20">
                                    <Trophy size={38} className="text-black" />
                                </div>
                                <h4 className="font-display text-2xl font-semibold text-white mb-1.5">Sanel Moranjkić</h4>
                                <p className="text-emerald-400 font-semibold text-xs mb-5 uppercase tracking-[0.2em]">Analiza & Takmičarska Logika</p>
                                <p className="text-slate-400 text-base leading-relaxed">
                                    Tehnička podrška u razvoju aplikacije i ekspertiza u takmičarskim procesima.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Final CTA ─────────────────────────────────────── */}
            <section className="relative py-20 md:py-28 px-5">
                <div className="max-w-4xl mx-auto text-center reveal">
                    <h2 className="font-display text-4xl md:text-6xl font-semibold text-white tracking-[-0.03em] leading-[1.05] mb-6">
                        Spreman za <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-300">svoj sljedeći turnir</span>?
                    </h2>
                    <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                        Zatraži pristup danas i pokreni prvi turnir za manje od pet minuta.
                    </p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="sheen-parent group bg-gradient-to-r from-lime-300 to-lime-400 text-black px-10 py-5 rounded-2xl font-semibold hover:from-lime-200 hover:to-lime-300 transition-all shadow-[0_0_55px_-12px_rgba(163,230,53,0.6)] text-lg inline-flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        Postani organizator <ArrowRight size={21} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </section>

            {/* ── Footer ────────────────────────────────────────── */}
            <footer className="py-9 px-5 border-t border-white/[0.06]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <Logo size="sm" />
                        <span className="text-slate-500 text-sm">&copy; {new Date().getFullYear()} Tenis.ba Platforma. Sva prava zadržana.</span>
                    </div>
                    <Link to="/p/help" className="text-slate-400 hover:text-white text-sm flex items-center gap-2 transition-colors">
                        <BookOpen size={14} /> Kako koristiti javni prikaz
                    </Link>
                </div>
            </footer>

            {/* ── Request Form Modal ────────────────────────────── */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#06090f]/95 backdrop-blur-xl overflow-y-auto">
                    <div className="w-full max-w-2xl my-auto animate-in fade-in zoom-in-95 duration-300">
                        {!isSuccess ? (
                            <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 md:p-11 shadow-2xl relative overflow-hidden">
                                <div className="absolute -top-24 -right-24 w-56 h-56 bg-lime-500/10 rounded-full blur-3xl" />
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-lime-300 to-lime-500 rounded-2xl flex items-center justify-center shrink-0 shadow-xl shadow-lime-600/20">
                                                <Building2 size={26} className="text-black" />
                                            </div>
                                            <div>
                                                <h2 className="font-display text-2xl md:text-3xl font-semibold text-white tracking-tight">Zatraži pristup</h2>
                                                <p className="text-slate-400 text-sm mt-1">Odgovaramo u najkraćem roku</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowForm(false)} className="bg-slate-950 border border-white/10 p-2.5 rounded-xl text-slate-500 hover:text-white transition-all shrink-0">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="mb-7">
                                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em] ml-1 mb-3 block">Odabrani plan</label>
                                        <div className="flex flex-wrap gap-2">
                                            {plans.map(plan => (
                                                <button
                                                    type="button"
                                                    key={plan.id}
                                                    onClick={() => setRequestForm({ ...requestForm, plan: plan.id })}
                                                    className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                                                        requestForm.plan === plan.id
                                                            ? 'bg-gradient-to-r from-lime-300 to-lime-400 text-black border-lime-400'
                                                            : 'bg-slate-950 text-slate-400 border-white/10 hover:border-white/25'
                                                    }`}
                                                >
                                                    {plan.name} · {plan.price}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <form onSubmit={handleSubmitRequest} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em] ml-1">Naziv kluba / organizacije</label>
                                            <input
                                                required
                                                placeholder="npr. TK TENIS BIH"
                                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-lime-400 outline-none transition-all placeholder:text-slate-700"
                                                value={requestForm.club}
                                                onChange={e => setRequestForm({ ...requestForm, club: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em] ml-1">Kontakt osoba</label>
                                            <input
                                                required
                                                placeholder="Ime i Prezime"
                                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-lime-400 outline-none transition-all placeholder:text-slate-700"
                                                value={requestForm.name}
                                                onChange={e => setRequestForm({ ...requestForm, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em] ml-1">E-mail za odobrenje (Gmail)</label>
                                            <input
                                                required
                                                type="email"
                                                placeholder="vas-email@gmail.com"
                                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-lime-400 outline-none transition-all placeholder:text-slate-700"
                                                value={requestForm.email}
                                                onChange={e => setRequestForm({ ...requestForm, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em] ml-1">Broj telefona</label>
                                            <input
                                                required
                                                placeholder="+387 6x xxx xxx"
                                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-lime-400 outline-none transition-all placeholder:text-slate-700"
                                                value={requestForm.phone}
                                                onChange={e => setRequestForm({ ...requestForm, phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em] ml-1">Grad</label>
                                            <input
                                                required
                                                placeholder="Grad, Država"
                                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-lime-400 outline-none transition-all placeholder:text-slate-700"
                                                value={requestForm.city}
                                                onChange={e => setRequestForm({ ...requestForm, city: e.target.value })}
                                            />
                                        </div>

                                        <div className="md:col-span-2 flex items-center gap-3 text-sm font-medium text-slate-300 bg-slate-950 p-4 rounded-xl border border-white/10">
                                            <CreditCard size={18} className="text-lime-300 shrink-0" />
                                            <span>Odabrani plan: {selectedPlan?.name} ({selectedPlan?.price}{selectedPlan?.period})</span>
                                        </div>

                                        <div className="md:col-span-2 pt-1">
                                            <button
                                                disabled={isSubmitting}
                                                className="sheen-parent group w-full bg-gradient-to-r from-lime-300 to-lime-400 hover:from-lime-200 hover:to-lime-300 text-black font-semibold py-4 rounded-xl transition-all shadow-xl shadow-lime-600/30 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
                                            >
                                                {isSubmitting ? (
                                                    <Loader2 className="animate-spin" size={24} />
                                                ) : (
                                                    <>Pošalji zahtjev za odobrenje <Send size={19} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-md mx-auto bg-slate-900 border border-white/10 rounded-3xl p-12 text-center shadow-2xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full" />
                                <div className="relative z-10">
                                    <div className="w-24 h-24 bg-emerald-500/15 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce">
                                        <CheckCircle2 size={48} />
                                    </div>
                                    <h2 className="font-display text-3xl font-semibold text-white mb-4">Uspješno!</h2>
                                    <p className="text-slate-400 leading-relaxed mb-10 text-lg">
                                        Vaš zahtjev je poslat. Tim će pregledati vaš Gmail nalog i odobriti pristup u najkraćem roku.
                                    </p>
                                    <button
                                        onClick={() => setShowForm(false)}
                                        className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-semibold transition-all"
                                    >
                                        Zatvori prozor
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

/* ── Helper components ──────────────────────────────────── */

const SectionEyebrow = ({ icon, children, center = false, variant = 'lime' }) => {
    const styles = variant === 'lime'
        ? 'bg-emerald-400/10 border-emerald-400/25 text-emerald-300'
        : 'bg-lime-400/10 border-lime-400/25 text-lime-300';
    return (
        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 mb-5 rounded-full border text-[11px] font-semibold uppercase tracking-[0.15em] ${styles} ${center ? 'mx-auto' : ''}`}>
            {icon} {children}
        </div>
    );
};

const Logo = ({ size = 'md' }) => {
    const dims = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
    const font = size === 'sm' ? 'text-base' : 'text-lg';
    return (
        <div className="relative shrink-0">
            <div className="absolute inset-0 bg-lime-400/40 blur-md rounded-lg" />
            <div className={`relative ${dims} bg-gradient-to-br from-lime-300 to-lime-500 rounded-lg flex items-center justify-center`}>
                <span className={`${font} font-black italic text-[#0b1220] leading-none`} style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>T</span>
            </div>
        </div>
    );
};

const FeatureCard = ({ icon, title, children, delay = '' }) => (
    <div className={`reveal ${delay} group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-900/40 p-7 hover:border-emerald-400/25 hover:bg-slate-900/60 transition-all duration-500`}>
        <div className="w-11 h-11 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-300 mb-5 group-hover:scale-105 transition-transform">
            {icon}
        </div>
        <h3 className="font-display text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{children}</p>
    </div>
);

export default Home;
