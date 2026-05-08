import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  Loader2,
  Send,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Trophy,
  Users,
  X,
  Activity,
  BookOpen,
} from 'lucide-react';
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../firebase/config';

const plans = [
  {
    id: 'demo',
    name: 'Demo pristup',
    price: '0 KM',
    period: '/ 5 dana',
    tournaments: '1 takmičenje',
    categories: '1 grupa ili kategorija',
    features: ['Probni pristup', 'Do 12 igrača', 'Sve osnovne funkcije'],
    tone: 'from-slate-500/30 to-slate-800/10',
  },
  {
    id: 'basic',
    name: 'Jednokratni',
    price: '50 KM',
    period: '/ turnir',
    tournaments: '1 turnir',
    categories: 'Do 15 kategorija',
    features: ['Raspored mečeva', 'Live rezultati', 'Tabele i rangiranje'],
    tone: 'from-emerald-500/30 to-cyan-500/10',
  },
  {
    id: 'standard',
    name: 'Paket 5',
    price: '200 KM',
    period: '/ paket',
    tournaments: '5 turnira',
    categories: 'Neograničeno',
    features: ['Sve iz Basic', 'Statistike igrača', 'Prioritetna podrška'],
    tone: 'from-amber-400/30 to-orange-500/10',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Godišnji',
    price: '500 KM',
    period: '/ godina',
    tournaments: 'Neograničeno',
    categories: 'Neograničeno',
    features: ['Sve iz Standard', 'Branding kluba', 'Arhiva rezultata'],
    tone: 'from-fuchsia-500/30 to-rose-500/10',
  },
];

const featureCards = [
  {
    icon: Trophy,
    title: 'Turnir bez Excel haosa',
    description: 'Kategorije, mečevi, tabele i knockout ostaju sinhronizovani bez ručnog prepisivanja.',
  },
  {
    icon: Activity,
    title: 'Rezultat uživo',
    description: 'Uneseni rezultat odmah se vidi svima: igračima, publici i sudijama.',
  },
  {
    icon: Users,
    title: 'Jasan pregled kluba',
    description: 'Prati ko igra, kada igra i kako izgleda kompletan tok turnira na jednom mjestu.',
  },
];

const processSteps = [
  {
    icon: Send,
    title: 'Pošalješ zahtjev',
    description: 'Uneseš klub, kontakt i odabereš plan koji želiš aktivirati.',
  },
  {
    icon: ShieldCheck,
    title: 'Provjera organizatora',
    description: 'Whitelist i verifikacija drže sistem urednim i sigurnim.',
  },
  {
    icon: TimerReset,
    title: 'Kreneš sa takmičenjem',
    description: 'Nakon odobrenja možeš odmah otvoriti novo takmičenje.',
  },
];

const emptyForm = {
  club: '',
  name: '',
  email: '',
  phone: '',
  city: '',
  message: '',
  plan: 'demo',
};

const Home = () => {
  const [stats, setStats] = useState({ tournaments: 0, leagues: 0 });
  const [requestForm, setRequestForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const activeCompetitions = query(collection(db, 'competitions'), where('status', '==', 'active'));
        const snap = await getDocs(activeCompetitions);
        const list = snap.docs.map((docItem) => docItem.data());

        setStats({
          tournaments: list.filter((competition) => competition.type !== 'League').length,
          leagues: list.filter((competition) => competition.type === 'League').length,
        });
      } catch (err) {
        console.error('Stats error:', err);
      }
    };

    fetchStats();
  }, []);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === requestForm.plan) ?? plans[0],
    [requestForm.plan],
  );

  const openForm = (planId = requestForm.plan) => {
    setRequestForm((current) => ({ ...current, plan: planId }));
    setIsSuccess(false);
    setShowForm(true);
  };

  const closeForm = () => {
    if (isSubmitting) return;
    setShowForm(false);
    setIsSuccess(false);
  };

  const handleChange = (field) => (event) => {
    setRequestForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSubmitRequest = async (event) => {
    event.preventDefault();

    const normalizedEmail = requestForm.email.toLowerCase().trim();
    if (!normalizedEmail.endsWith('@gmail.com')) {
      alert('Molimo unesite ispravan Gmail nalog (@gmail.com).');
      return;
    }

    setIsSubmitting(true);

    const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

    const messageText =
      `Novi zahtjev za odobrenje\n\n` +
      `Ime: ${requestForm.name}\n` +
      `Gmail: ${normalizedEmail}\n` +
      `Klub: ${requestForm.club}\n` +
      `Grad: ${requestForm.city}\n` +
      `Telefon: ${requestForm.phone}\n` +
      `Plan: ${selectedPlan.name} (${selectedPlan.price})\n` +
      `Poruka: ${requestForm.message || 'Nema poruke'}`;

    try {
      await addDoc(collection(db, 'access_requests'), {
        organizationName: requestForm.club,
        contactPerson: requestForm.name,
        email: normalizedEmail,
        phone: requestForm.phone,
        city: requestForm.city,
        message: requestForm.message || '',
        status: 'pending',
        selectedPlan: requestForm.plan,
        createdAt: serverTimestamp(),
      });

      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
        }),
      });

      setIsSuccess(true);
      setRequestForm(emptyForm);
    } catch (error) {
      console.error('Request error:', error);
      alert('Greska pri slanju zahtjeva. Molimo pokusajte ponovo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#081427] text-slate-100 font-display">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(34,197,94,0.22),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(251,191,36,0.2),transparent_30%),radial-gradient(circle_at_50%_88%,rgba(244,63,94,0.18),transparent_32%),linear-gradient(160deg,#060f1d_0%,#081427_46%,#0a1a2f_100%)]" />
        <div className="absolute left-6 top-24 h-72 w-72 rounded-full border border-white/10" />
        <div className="absolute bottom-8 right-8 h-44 w-44 rounded-full border border-amber-200/20" />
      </div>

      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#081427]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-h-11 items-center gap-3 rounded-full pr-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-[0_18px_40px_-18px_rgba(16,185,129,1)]">
              <Trophy size={20} />
            </div>
            <div>
              <div className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-200">PingPong.ba</div>
              <div className="text-xs text-slate-400">Tournament command center</div>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/p/help"
              className="hidden min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300 transition hover:border-white/30 hover:text-white md:inline-flex"
            >
              <BookOpen size={14} />
              Help
            </Link>
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2 text-xs font-black uppercase tracking-[0.15em] text-slate-950 transition hover:bg-emerald-300"
            >
              Prijava
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 lg:px-8">
        <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">
              <Sparkles size={14} />
              Pro platforma za stoni tenis
            </div>

            <h1 className="font-title text-[clamp(2.3rem,7vw,5.7rem)] leading-[0.96] tracking-tight text-white">
              Napravi turnir
              <span className="block bg-gradient-to-r from-emerald-300 via-amber-200 to-rose-300 bg-clip-text text-transparent">
                koji izgleda ozbiljno
              </span>
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Od prijava i rasporeda do live rezultata i knockouta. PingPong.ba uklanja operativni stres
              i ostavlja ti fokus na kvalitetu takmičenja.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => openForm('standard')}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-amber-300 px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-amber-200"
              >
                Zatraži pristup
                <Send size={16} />
              </button>
              <Link
                to="/explore"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:border-white/40 hover:bg-white/5"
              >
                Pogledaj takmičenja
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Aktivno sada</div>
              <div className="mt-3 text-4xl font-black text-emerald-200">{stats.tournaments}</div>
              <div className="mt-1 text-sm text-slate-300">Turnira uživo</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Liga modul</div>
              <div className="mt-3 text-4xl font-black text-amber-200">{stats.leagues}</div>
              <div className="mt-1 text-sm text-slate-300">Liga aktivna</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-400/10 to-amber-300/10 p-5 sm:col-span-2 lg:col-span-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-200">
                <ShieldCheck size={12} />
                Verifikovan pristup
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Novi organizatori ulaze kroz whitelist proces, što osigurava kvalitet i sigurnost platforme.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-18 grid gap-5 md:grid-cols-3">
          {featureCards.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="rounded-3xl border border-white/10 bg-[#0b1a30]/80 p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-emerald-300/40">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-200">
                  <Icon size={20} />
                </div>
                <h2 className="font-title text-2xl text-white">{feature.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{feature.description}</p>
              </article>
            );
          })}
        </section>

        <section className="mt-18 rounded-[2rem] border border-white/10 bg-[#09182f]/70 p-6 sm:p-8 lg:p-10">
          <div className="mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-[0.17em] text-slate-300">
            <TimerReset size={14} className="text-amber-200" />
            Kako počinješ
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/15 text-amber-200">
                      <Icon size={18} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">0{index + 1}</span>
                  </div>
                  <h3 className="font-title text-xl text-white">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{step.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-18">
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.17em] text-slate-400">Planovi</div>
              <h2 className="font-title text-4xl text-white">Izaberi paket</h2>
            </div>
            <button
              onClick={() => openForm('demo')}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-200/40 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-amber-200 transition hover:bg-amber-200 hover:text-slate-950"
            >
              Probaj demo
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className={`relative rounded-3xl border p-5 transition hover:-translate-y-1 ${
                  plan.popular
                    ? 'border-amber-200/55 bg-gradient-to-b from-amber-300/15 to-transparent'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-4 rounded-full bg-amber-300 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-slate-950">
                    Najpopularniji
                  </div>
                )}

                <div className={`mb-5 rounded-2xl bg-gradient-to-br ${plan.tone} p-4`}>
                  <div className="text-xs font-black uppercase tracking-[0.13em] text-slate-200">{plan.name}</div>
                  <div className="mt-2 text-3xl font-black text-white">{plan.price}</div>
                  <div className="text-xs text-slate-300">{plan.period}</div>
                </div>

                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <Trophy size={14} className="text-emerald-200" />
                    {plan.tournaments}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-amber-200" />
                    {plan.categories}
                  </div>
                </div>

                <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-xs text-slate-300">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="mt-0.5 text-emerald-200" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => openForm(plan.id)}
                  className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950/70 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-slate-950"
                >
                  Odaberi plan
                  <ArrowRight size={14} />
                </button>
              </article>
            ))}
          </div>
        </section>
      </main>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="text-xs font-black uppercase tracking-[0.17em] text-slate-400">Tim</div>
          <h2 className="font-title text-4xl text-white">Ko stoji iza platforme</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <article className="rounded-3xl border border-blue-400/20 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-6">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-[0_12px_30px_-10px_rgba(59,130,246,0.8)]">
              <Activity size={22} />
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.17em] text-blue-300">Dizajn &amp; Razvoj</div>
            <h3 className="font-title mt-1 text-3xl text-white">Ermin Selimović</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Full-stack developer i dizajner odgovoran za kompletnu izradu aplikacije — od korisničkog interfejsa do strukturne logike sistema.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href="https://github.com/ermin1990" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2 text-xs font-bold text-slate-200 transition hover:border-white/30 hover:text-white">
                GitHub
              </a>
              <a href="https://instagram.com/infinitycreative.agency" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-pink-500/20 bg-pink-500/10 px-4 py-2 text-xs font-bold text-pink-300 transition hover:border-pink-400/40 hover:text-pink-200">
                Instagram
              </a>
            </div>
          </article>

          <article className="rounded-3xl border border-purple-400/20 bg-gradient-to-br from-purple-500/10 to-rose-500/5 p-6">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500 text-white shadow-[0_12px_30px_-10px_rgba(168,85,247,0.8)]">
              <Trophy size={22} />
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.17em] text-purple-300">Analiza &amp; Takmičarska logika</div>
            <h3 className="font-title mt-1 text-3xl text-white">Sanel Moranjkić</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Tehnička podrška u razvoju aplikacije i ekspertiza u takmičarskim procesima. Stoji iza logike takmičarskih pravila i toka mečeva.
            </p>
          </article>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-slate-400 sm:flex-row sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} PingPong.ba. Sva prava zadržana.</p>
          <div className="flex items-center gap-3">
            <Link to="/explore" className="transition hover:text-white">Takmičenja</Link>
            <span className="text-slate-600">|</span>
            <Link to="/p/help" className="transition hover:text-white">Javni prikaz</Link>
          </div>
        </div>
      </footer>

      {showForm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#04101f]/85 p-4 backdrop-blur-lg">
          <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/15 bg-[#09192f] shadow-[0_30px_90px_-50px_rgba(0,0,0,0.9)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-7">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Novi zahtjev</div>
                <h3 className="font-title text-3xl text-white">Pristup platformi</h3>
              </div>
              <button
                onClick={closeForm}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 text-slate-200 transition hover:border-white/35 hover:text-white"
                disabled={isSubmitting}
              >
                <X size={18} />
              </button>
            </div>

            {!isSuccess ? (
              <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_1.2fr]">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Odabrani plan</div>
                  <div className="mb-2 font-title text-3xl text-white">{selectedPlan.name}</div>
                  <div className="mb-5 text-sm text-slate-300">
                    {selectedPlan.price} <span className="text-slate-400">{selectedPlan.period}</span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-300">
                    {selectedPlan.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-emerald-200" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setRequestForm((current) => ({ ...current, plan: 'standard' }))}
                    className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-200/35 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-amber-200 transition hover:bg-amber-200 hover:text-slate-950"
                  >
                    Promijeni plan
                  </button>
                </div>

                <form onSubmit={handleSubmitRequest} className="grid gap-4 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Naziv kluba</span>
                    <input
                      required
                      value={requestForm.club}
                      onChange={handleChange('club')}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/60"
                      placeholder="npr. STK Sarajevo"
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Kontakt osoba</span>
                    <input
                      required
                      value={requestForm.name}
                      onChange={handleChange('name')}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/60"
                      placeholder="Ime i prezime"
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Telefon</span>
                    <input
                      required
                      value={requestForm.phone}
                      onChange={handleChange('phone')}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/60"
                      placeholder="+387 xx xxx xxx"
                    />
                  </label>

                  <label className="sm:col-span-2">
                    <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Gmail adresa</span>
                    <input
                      type="email"
                      required
                      value={requestForm.email}
                      onChange={handleChange('email')}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/60"
                      placeholder="ime.prezime@gmail.com"
                    />
                  </label>

                  <label className="sm:col-span-2">
                    <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Grad</span>
                    <input
                      required
                      value={requestForm.city}
                      onChange={handleChange('city')}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/60"
                      placeholder="Grad, drzava"
                    />
                  </label>

                  <label className="sm:col-span-2">
                    <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Poruka (opcionalno)</span>
                    <textarea
                      value={requestForm.message}
                      onChange={handleChange('message')}
                      rows={3}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/60"
                      placeholder="Kratka napomena za tim"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="sm:col-span-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Posalji zahtjev
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-5 p-8 text-center sm:p-10">
                <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-400/20 text-emerald-200">
                  <CheckCircle2 size={38} />
                </div>
                <h3 className="font-title text-4xl text-white">Zahtjev je poslan</h3>
                <p className="mx-auto max-w-lg text-sm text-slate-300">
                  Super admin je primio tvoj zahtjev. Nakon odobrenja email adrese dobijaš pristup i možeš
                  aktivirati turnire.
                </p>
                <button
                  onClick={closeForm}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-6 py-2 text-xs font-black uppercase tracking-[0.15em] text-white transition hover:border-white/40 hover:bg-white/5"
                >
                  Zatvori
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
