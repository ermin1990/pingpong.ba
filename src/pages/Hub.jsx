import { useState } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Trophy, Radio, Users, Send, Loader2, CheckCircle2, Facebook, Instagram } from 'lucide-react';

const APPS = [
  {
    name: 'PingPong.ba',
    sport: 'Stoni tenis',
    url: 'https://pingpong-bih.web.app/',
    color: 'from-orange-400 to-orange-600',
    glow: 'shadow-orange-500/20',
    text: 'text-orange-400',
    border: 'border-orange-500/20',
    bg: 'bg-orange-500/10'
  },
  {
    name: 'Padel.ba',
    sport: 'Padel',
    url: 'https://padel-bih.web.app/',
    color: 'from-amber-400 to-amber-600',
    glow: 'shadow-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/10'
  },
  {
    name: 'Tenis.ba',
    sport: 'Tenis',
    url: 'https://tenis-bih.web.app/',
    color: 'from-lime-400 to-emerald-600',
    glow: 'shadow-lime-500/20',
    text: 'text-lime-400',
    border: 'border-lime-500/20',
    bg: 'bg-lime-500/10'
  }
];

const Hub = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      await addDoc(collection(db, 'contact_requests'), {
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError('Greška pri slanju poruke. Pokušajte ponovo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 antialiased">
      {/* Nav */}
      <nav className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-5 h-[70px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Trophy size={18} className="text-white" />
            </div>
            <span className="font-black text-xl tracking-tight text-white">MOJ<span className="text-indigo-400">TURNIR</span><span className="text-slate-500">.BA</span></span>
          </div>
          <a href="#kontakt" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Kontakt</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28 px-5">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-indigo-500/10 rounded-full blur-[130px]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 text-[11px] font-bold uppercase tracking-[0.15em]">
            <Radio size={12} /> Live rezultati za tri sporta
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight mb-6">
            Sve tvoje lige, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">na jednom mjestu</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Tri platforme za organizaciju turnira i amaterskih liga u Bosni i Hercegovini — stoni tenis, padel i tenis.
            Live bodovanje poen po poen, tabele, rasporedi i prijave igrača, bez papira i Excela.
          </p>
        </div>
      </section>

      {/* App cards */}
      <section className="px-5 pb-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {APPS.map((app) => (
            <a
              key={app.name}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative overflow-hidden rounded-3xl border ${app.border} bg-slate-900/60 p-7 transition-all hover:scale-[1.02] hover:shadow-2xl ${app.glow}`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${app.color} flex items-center justify-center mb-5 shadow-lg`}>
                <Trophy size={26} className="text-black/80" />
              </div>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${app.text} mb-1.5`}>{app.sport}</p>
              <h3 className="text-2xl font-black text-white tracking-tight mb-2">{app.name}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-5">
                Organizuj turnire i lige, vodi rezultate uživo i prati tabelu — sve na jednoj javnoj stranici.
              </p>
              <span className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest ${app.text} group-hover:gap-2.5 transition-all`}>
                Otvori sajt →
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Why */}
      <section className="px-5 py-16 md:py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 text-indigo-300">
              <Radio size={22} />
            </div>
            <h4 className="text-white font-bold mb-2">Live bodovanje</h4>
            <p className="text-slate-500 text-sm">Poen po poen, uživo na javnom prikazu — bez čekanja na kraj meča.</p>
          </div>
          <div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 text-indigo-300">
              <Users size={22} />
            </div>
            <h4 className="text-white font-bold mb-2">Prijave igrača</h4>
            <p className="text-slate-500 text-sm">Igrači se prijave sami na javnoj stranici, organizator samo odobri.</p>
          </div>
          <div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 text-indigo-300">
              <Trophy size={22} />
            </div>
            <h4 className="text-white font-bold mb-2">Tabele i rasporedi</h4>
            <p className="text-slate-500 text-sm">Grupe, eliminacija ili Berger sistem — automatski generisano.</p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="kontakt" className="px-5 py-16 md:py-20 border-t border-white/5">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-black text-white text-center mb-2">Imaš pitanje ili prijedlog?</h2>
          <p className="text-slate-500 text-sm text-center mb-8">Javi nam se, odgovaramo brzo.</p>

          {submitted ? (
            <div className="text-center py-8 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <CheckCircle2 className="mx-auto mb-3 text-emerald-400" size={32} />
              <p className="text-white font-bold">Poruka poslana!</p>
              <p className="text-slate-500 text-sm mt-1">Javit ćemo se uskoro.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                placeholder="Ime i prezime"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
              />
              <textarea
                rows={3}
                placeholder="Poruka (opciono)"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 transition-colors resize-none"
              />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button
                disabled={submitting}
                className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-black uppercase tracking-widest text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {submitting ? 'Slanje...' : 'Pošalji poruku'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-5 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-xs">&copy; {new Date().getFullYear()} MojTurnir.ba</p>
          <div className="flex items-center gap-3">
            <a href="#" className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white transition-colors" title="Facebook">
              <Facebook size={15} />
            </a>
            <a href="#" className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white transition-colors" title="Instagram">
              <Instagram size={15} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Hub;
