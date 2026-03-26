import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BookOpen,
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
} from 'lucide-react';
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../firebase/config';

const plans = [
  {
    id: 'demo',
    name: 'Demo pristup',
    price: '0 KM',
    period: '/ 5 dana',
    tournaments: '1 takmicenje',
    categories: '1 grupa ili kategorija',
    features: ['Probni pristup', 'Do 12 igraca', 'Sve osnovne funkcije'],
    accent: 'from-slate-500/30 to-slate-700/10',
  },
  {
    id: 'basic',
    name: 'Jednokratni',
    price: '50 KM',
    period: '/ turnir',
    tournaments: '1 turnir',
    categories: 'Do 15 kategorija',
    features: ['Raspored meceva', 'Live rezultati', 'Tabele i rangiranje'],
    accent: 'from-sky-500/30 to-cyan-500/10',
  },
  {
    id: 'standard',
    name: 'Paket 5',
    price: '200 KM',
    period: '/ paket',
    tournaments: '5 turnira',
    categories: 'Neograniceno',
    features: ['Sve iz Basic', 'Statistike igraca', 'Prioritetna podrska'],
    accent: 'from-amber-400/30 to-orange-500/10',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Godisnji',
    price: '500 KM',
    period: '/ godina',
    tournaments: 'Neograniceno',
    categories: 'Neograniceno',
    features: ['Sve iz Standard', 'Branding kluba', 'Arhiva rezultata'],
    accent: 'from-emerald-500/30 to-teal-500/10',
  },
];

const featureCards = [
  {
    icon: Trophy,
    title: 'Turniri bez excel haosa',
    description: 'Prijave, kategorije, tabele i eliminacije ostaju u jednom uredjenom toku.',
  },
  {
    icon: Activity,
    title: 'Rezultati odmah online',
    description: 'Sudije i organizatori upisuju rezultat, a publika vidi promjenu bez osvjezavanja.',
  },
  {
    icon: Users,
    title: 'Pregled za klub i igrace',
    description: 'Lakse pratite ko igra, gdje igra i kako izgleda kompletan raspored dana.',
  },
];

const processSteps = [
  {
    icon: Send,
    title: 'Posaljes zahtjev',
    description: 'Upises osnovne podatke o klubu i odaberes plan koji ti odgovara.',
  },
  {
    icon: ShieldCheck,
    title: 'Tim provjeri pristup',
    description: 'Verifikujemo organizatora kako bi platforma ostala cista i pouzdana.',
  },
  {
    icon: TimerReset,
    title: 'Krenes sa turnirom',
    description: 'Dobijas pristup i odmah mozes otvoriti prvo takmicenje ili test demo nalog.',
  },
];

const emptyForm = {
  name: '',
  club: '',
  city: '',
  phone: '',
  email: '',
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

  const selectedPlan = plans.find((plan) => plan.id === requestForm.plan) ?? plans[0];

  const openForm = (planId = requestForm.plan) => {
    setRequestForm((current) => ({
      ...current,
      plan: planId,
    }));
    setIsSuccess(false);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setIsSubmitting(false);
  };

  const handleChange = (field) => (event) => {
    setRequestForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSubmitRequest = async (event) => {
    event.preventDefault();

    if (!requestForm.email.toLowerCase().endsWith('@gmail.com')) {
      alert('Molimo unesite ispravan Gmail nalog (@gmail.com).');
      return;
    }

    setIsSubmitting(true);

    const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

    const text =
      `Novi zahtjev za odobrenje\n\n` +
      `Ime: ${requestForm.name}\n` +
      `Gmail: ${requestForm.email}\n` +
      `Klub: ${requestForm.club}\n` +
      `Grad: ${requestForm.city}\n` +
      `Telefon: ${requestForm.phone}\n` +
      `Plan: ${selectedPlan.name} (${selectedPlan.price})\n` +
      `Poruka: ${requestForm.message || 'Nema poruke'}`;

    try {
      await addDoc(collection(db, 'access_requests'), {
        organizationName: requestForm.club,
        contactPerson: requestForm.name,
        email: requestForm.email.toLowerCase().trim(),
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
          text,
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
    <div className="min-h-screen overflow-x-hidden bg-[#06111f] text-slate-100">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.22),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.16),transparent_24%),linear-gradient(180deg,#06111f_0%,#08192c_46%,#05101d_100%)]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />
      </div>
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#06111f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-h-11 items-center gap-3 rounded-full pr-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-400 text-slate-950 shadow-[0_16px_40px_-20px_rgba(56,189,248,0.9)]">
              <Trophy size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-200">PingPong.ba</div>
              <div className="text-xs text-slate-400">Tournament control panel</div>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/p/help"
              className="hidden min-h-11 items-center gap-2 rounded-full border border-white/10 px-4 text-sm text-slate-300 transition hover:border-sky-300/40 hover:text-white md:inline-flex"
            >
              <BookOpen size={16} />
              Kako koristiti
            </Link>
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-sky-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
            >
              Prijava
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-10 sm:px-6 md:pt-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-center lg:px-8 lg:pb-28">
          <div className="max-w-3xl">
            <div className="inline-flex min-h-11 items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-4 text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
              <Sparkles size={14} />
              Profesionalni sistem za turnire i lige
            </div>

            <h1 className="mt-6 max-w-4xl text-balance text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-7xl">
              Organizacija meceva koja izgleda ozbiljno i radi brzo.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Platforma za stonoteniske klubove koja spaja prijave, raspored, live rezultate i javni prikaz u
              jedno cisto iskustvo za organizatora, sudiju i publiku.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => openForm('demo')}
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-sky-400 px-6 text-base font-semibold text-slate-950 transition hover:bg-sky-300"
              >
                Zatrazi demo
                <ArrowRight size={18} />
              </button>
              <Link
                to="/explore"
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 text-base font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
              >
                <Activity size={18} className="text-emerald-300" />
                Pregled javnih takmicenja
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <div className="text-3xl font-semibold text-white sm:text-4xl">{stats.tournaments}</div>
                <div className="mt-2 text-sm text-slate-400">aktivnih turnira</div>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <div className="text-3xl font-semibold text-white sm:text-4xl">{stats.leagues}</div>
                <div className="mt-2 text-sm text-slate-400">liga online</div>
              </div>
              <div className="rounded-[28px] border border-amber-300/20 bg-amber-300/10 p-5 backdrop-blur-sm">
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-100">Live sync</div>
                <div className="mt-2 text-sm leading-6 text-slate-200">Rezultat na terenu, odmah na ekranu publike.</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[36px] bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.22),transparent_50%)] blur-2xl" />
            <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-sky-950/30 backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Kontrola dana</div>
                  <div className="mt-1 text-lg font-semibold text-white">Turnirski dashboard</div>
                </div>
                <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">online</div>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-sky-400/18 to-transparent p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm text-sky-100">Finalni sto</div>
                      <div className="mt-2 text-2xl font-semibold text-white">Sto 2 / Mec u toku</div>
                    </div>
                    <div className="rounded-2xl bg-sky-300 px-3 py-2 text-sm font-semibold text-slate-950">11 : 8</div>
                  </div>
                  <div className="mt-4 flex items-center gap-3 text-sm text-slate-300">
                    <div className="h-2 w-2 rounded-full bg-emerald-300" />
                    Azuriranje bez reload-a
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Automatika</div>
                    <div className="mt-2 text-lg font-semibold text-white">Berger + knockout</div>
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      Raspored i prelazak u eliminacije ostaju uredni i predvidivi.
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Javni prikaz</div>
                    <div className="mt-2 text-lg font-semibold text-white">Publika prati sve</div>
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      Link za gledaoce, klubove i igrace bez dodatnih prijava.
                    </p>
                  </div>
                </div>

                <div className="rounded-[28px] border border-amber-300/20 bg-amber-300/10 p-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 text-amber-200" size={18} />
                    <div>
                      <div className="font-semibold text-white">Pristup ide kroz verifikaciju</div>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Time stitimo kvalitet takmicenja i drzimo administraciju pod kontrolom.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {featureCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm transition hover:-translate-y-1 hover:border-sky-300/30"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-300/10 text-sky-200">
                    <Icon size={22} />
                  </div>
                  <h2 className="mt-5 text-xl font-semibold text-white">{feature.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 text-left md:max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Kako ulazis u sistem</div>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">Jednostavan proces, bez suvisnih koraka.</h2>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-[30px] border border-white/10 bg-slate-950/50 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-sky-200">
                      <Icon size={22} />
                    </div>
                    <div className="text-sm font-semibold text-slate-500">0{index + 1}</div>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{step.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="md:max-w-2xl">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">Planovi</div>
              <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Od demo pristupa do pune sezone.</h2>
            </div>
            <button
              onClick={() => openForm('standard')}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-amber-200/30 bg-amber-200/10 px-5 text-sm font-semibold text-amber-100 transition hover:bg-amber-200/20"
            >
              Posalji zahtjev
            </button>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className={`relative overflow-hidden rounded-[32px] border p-6 backdrop-blur-sm transition hover:-translate-y-1 ${
                  plan.popular
                    ? 'border-amber-300/40 bg-amber-200/10 shadow-[0_25px_80px_-50px_rgba(251,191,36,0.65)]'
                    : 'border-white/10 bg-white/[0.04]'
                }`}
              >
                <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${plan.accent}`} />
                <div className="relative">
                  {plan.popular && (
                    <div className="inline-flex rounded-full bg-amber-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-950">
                      Najtrazeniji
                    </div>
                  )}
                  <h3 className="mt-4 text-2xl font-semibold text-white">{plan.name}</h3>
                  <div className="mt-3 flex items-end gap-2">
                    <div className="text-4xl font-semibold text-white">{plan.price}</div>
                    <div className="pb-1 text-sm text-slate-400">{plan.period}</div>
                  </div>
                  <div className="mt-6 space-y-3 text-sm text-slate-300">
                    <div className="flex items-center gap-3">
                      <Trophy size={16} className="text-sky-200" />
                      {plan.tournaments}
                    </div>
                    <div className="flex items-center gap-3">
                      <Users size={16} className="text-sky-200" />
                      {plan.categories}
                    </div>
                  </div>
                  <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3 text-sm leading-6 text-slate-400">
                        <CheckCircle2 size={16} className="mt-1 shrink-0 text-emerald-300" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => openForm(plan.id)}
                    className={`mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full px-4 text-sm font-semibold transition ${
                      plan.popular
                        ? 'bg-amber-300 text-slate-950 hover:bg-amber-200'
                        : 'border border-white/10 bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    Odaberi plan
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 rounded-[36px] border border-white/10 bg-slate-950/55 p-6 backdrop-blur-xl sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:p-10">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Verifikovani organizatori</div>
              <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Zelis testni pristup ili punu aktivaciju platforme?</h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-400">
                Posalji zahtjev i tim ce ti javiti naredne korake. Demo je najbrzi nacin da provjeris kako sistem
                izgleda na stvarnom turniru.
              </p>
            </div>
            <button
              onClick={() => openForm('demo')}
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-sky-400 px-6 text-base font-semibold text-slate-950 transition hover:bg-sky-300"
            >
              <CreditCard size={18} />
              Zatrazi pristup
            </button>
          </div>
        </section>
      </main>
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#06111f]/90 p-4 backdrop-blur-xl">
          <div className="mx-auto flex min-h-full max-w-6xl items-center justify-center py-8">
            <div className="w-full rounded-[36px] border border-white/10 bg-[#071423] shadow-2xl shadow-sky-950/40">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-8">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Pristup platformi</div>
                  <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Odaberi plan i posalji zahtjev</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">Forma je prilagodjena za brzi unos i na mobitelu i na desktopu.</p>
                </div>
                <button
                  onClick={closeForm}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                  aria-label="Zatvori formu"
                >
                  <X size={18} />
                </button>
              </div>

              {!isSuccess ? (
                <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
                  <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r lg:p-8">
                    <div className="grid gap-4 md:grid-cols-2">
                      {plans.map((plan) => (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setRequestForm((current) => ({ ...current, plan: plan.id }))}
                          className={`rounded-[28px] border p-5 text-left transition ${
                            requestForm.plan === plan.id
                              ? 'border-sky-300/40 bg-sky-300/10'
                              : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-lg font-semibold text-white">{plan.name}</div>
                              <div className="mt-2 flex items-end gap-2">
                                <div className="text-3xl font-semibold text-white">{plan.price}</div>
                                <div className="pb-1 text-xs uppercase tracking-[0.22em] text-slate-500">{plan.period}</div>
                              </div>
                            </div>
                            {plan.popular && (
                              <div className="rounded-full bg-amber-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-950">
                                Popularno
                              </div>
                            )}
                          </div>
                          <div className="mt-4 space-y-2 text-sm text-slate-400">
                            <div>{plan.tournaments}</div>
                            <div>{plan.categories}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 sm:p-8">
                    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-300/10 text-sky-200">
                          <Building2 size={22} />
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Odabrani plan</div>
                          <div className="mt-1 text-lg font-semibold text-white">{selectedPlan.name}</div>
                        </div>
                      </div>
                      <div className="mt-4 text-sm leading-6 text-slate-400">
                        Nakon slanja zahtjeva javljamo se sa narednim koracima za aktivaciju ili demo pristup.
                      </div>
                    </div>

                    <form onSubmit={handleSubmitRequest} className="mt-5 space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-sm text-slate-300">Ime i prezime</span>
                          <input
                            required
                            type="text"
                            value={requestForm.name}
                            onChange={handleChange('name')}
                            className="min-h-12 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-white outline-none transition placeholder:text-slate-600 focus:border-sky-300/40"
                            placeholder="Kontakt osoba"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-sm text-slate-300">Naziv kluba</span>
                          <input
                            required
                            type="text"
                            value={requestForm.club}
                            onChange={handleChange('club')}
                            className="min-h-12 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-white outline-none transition placeholder:text-slate-600 focus:border-sky-300/40"
                            placeholder="TT klub Sarajevo"
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-sm text-slate-300">Grad</span>
                          <input
                            required
                            type="text"
                            value={requestForm.city}
                            onChange={handleChange('city')}
                            className="min-h-12 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-white outline-none transition placeholder:text-slate-600 focus:border-sky-300/40"
                            placeholder="Sarajevo"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-sm text-slate-300">Telefon</span>
                          <input
                            required
                            type="tel"
                            value={requestForm.phone}
                            onChange={handleChange('phone')}
                            className="min-h-12 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-white outline-none transition placeholder:text-slate-600 focus:border-sky-300/40"
                            placeholder="+387 xx xxx xxx"
                          />
                        </label>
                      </div>

                      <label className="block">
                        <span className="mb-2 block text-sm text-slate-300">Gmail adresa</span>
                        <input
                          required
                          type="email"
                          value={requestForm.email}
                          onChange={handleChange('email')}
                          className="min-h-12 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-white outline-none transition placeholder:text-slate-600 focus:border-sky-300/40"
                          placeholder="ime.prezime@gmail.com"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm text-slate-300">Poruka</span>
                        <textarea
                          value={requestForm.message}
                          onChange={handleChange('message')}
                          rows={4}
                          className="w-full rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-sky-300/40"
                          placeholder="Ukratko napisi za kakav tip turnira ti treba pristup."
                        />
                      </label>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-sky-400 px-6 text-base font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        {isSubmitting ? 'Slanje u toku...' : 'Posalji zahtjev'}
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="mx-auto max-w-xl p-8 text-center sm:p-12">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-emerald-400/15 text-emerald-300">
                    <CheckCircle2 size={38} />
                  </div>
                  <h3 className="mt-6 text-3xl font-semibold text-white">Zahtjev je uspjesno poslan</h3>
                  <p className="mt-4 text-base leading-8 text-slate-400">
                    Tim ce pregledati podatke i javiti ti se s narednim korakom za demo ili aktivaciju naloga.
                  </p>
                  <button
                    onClick={closeForm}
                    className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 text-base font-semibold text-white transition hover:bg-white/10"
                  >
                    Zatvori
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-white/10 py-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>{new Date().getFullYear()} PingPong.ba Platforma. Sva prava zadrzana.</p>
          <Link to="/p/help" className="inline-flex items-center gap-2 text-slate-400 transition hover:text-white">
            <BookOpen size={16} />
            Kako koristiti javni prikaz
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Home;
