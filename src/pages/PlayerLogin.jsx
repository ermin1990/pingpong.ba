import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Mail, Lock, ArrowRight, AlertCircle, Loader2, User } from 'lucide-react';

// Login for players: email + password, but the account itself only ever
// gets created by an organizer (see provisionPlayerAccount / RegistrationsTab)
// - there's no self-signup here. On first successful login we self-link this
// auth uid to the matching `players` doc (see firestore.rules), so later
// visits to /moj-nalog/pocetna can find "who am I" straight from that doc.
const PlayerLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const linkPlayerRecord = async (uid, normalizedEmail) => {
    const q = query(collection(db, 'players'), where('email', '==', normalizedEmail));
    const snap = await getDocs(q);
    const unlinked = snap.docs.find(d => !d.data().authUid);
    if (unlinked) {
      await updateDoc(doc(db, 'players', unlinked.id), { authUid: uid });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError('');
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      await linkPlayerRecord(cred.user.uid, normalizedEmail).catch((err) => console.error('Self-link failed:', err));
      navigate('/moj-nalog/pocetna');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Pogrešan email ili lozinka.');
      } else {
        setError(`Greška prilikom prijave: ${err.code || 'nepoznata greška'}.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Unesite email da vam pošaljemo link za postavljanje lozinke.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      setResetSent(true);
    } catch (err) {
      console.error(err);
      setError('Nije moguće poslati email. Provjerite da li je email ispravan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(163,230,53,0.12),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_55%,_#111827_100%)] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md overflow-hidden rounded-[24px] border border-slate-800/90 bg-slate-950/90 shadow-2xl shadow-lime-950/10">
        <div className="border-b border-slate-800 bg-gradient-to-r from-lime-500/10 to-transparent px-6 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-lime-500/20 bg-lime-500/10 text-lime-300">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-400">Moj Nalog</p>
              <h1 className="text-xl font-black uppercase italic tracking-tight text-white">Prijava Za Igrače</h1>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 sm:px-7 sm:py-7">
          {resetSent ? (
            <div className="rounded-[18px] border border-emerald-500/20 bg-emerald-500/10 p-5 text-center">
              <p className="text-sm font-bold text-emerald-200">Email je poslan!</p>
              <p className="mt-2 text-xs text-emerald-300/80 leading-relaxed">
                Provjerite {email} - link u emailu vam omogućava da postavite (ili resetujete) lozinku.
              </p>
              <button
                onClick={() => setResetSent(false)}
                className="mt-4 text-[11px] font-black uppercase tracking-widest text-emerald-300 hover:text-emerald-200"
              >
                Nazad na prijavu
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ime@email.com"
                    className="w-full rounded-[16px] border border-slate-800 bg-slate-950 py-3.5 pl-11 pr-4 text-sm font-medium text-white outline-none transition-all placeholder:text-slate-700 focus:border-lime-500"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Lozinka</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-[16px] border border-slate-800 bg-slate-950 py-3.5 pl-11 pr-4 text-sm font-medium text-white outline-none transition-all placeholder:text-slate-700 focus:border-lime-500"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-[16px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-lime-400 px-6 py-3.5 text-[11px] font-black uppercase tracking-widest text-black transition-all hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-70 shadow-md shadow-lime-950/20"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Prijavi Se <ArrowRight className="h-4 w-4" /></>}
              </button>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="w-full text-center text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-lime-300 transition-colors"
              >
                Zaboravili lozinku ili nemate nalog?
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-slate-800 pt-5 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-[11px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:text-lime-300"
            >
              Niste igrač? Prijava za organizatore
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerLogin;
