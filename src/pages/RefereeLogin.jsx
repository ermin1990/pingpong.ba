import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { signInAnonymously, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Lock, ArrowRight, AlertCircle, Loader2, Shield, KeyRound } from 'lucide-react';

const normalizeCode = (value) => value.replace(/[^A-Z0-9]/gi, '').toUpperCase();

const RefereeLogin = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError('');

    try {
      const rawCode = code.trim().toUpperCase();
      const normalizedCode = normalizeCode(code);

      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

      const exactQuery = query(collection(db, 'referees'), where('code', '==', rawCode));
      const exactSnapshot = await getDocs(exactQuery);

      let refereeDoc = exactSnapshot.docs[0] || null;

      if (!refereeDoc) {
        const allRefereesSnapshot = await getDocs(collection(db, 'referees'));
        refereeDoc = allRefereesSnapshot.docs.find((item) => normalizeCode(item.data()?.code || '') === normalizedCode) || null;
      }

      if (!refereeDoc) {
        await signOut(auth);
        setError('PIN ili kod sudije nije ispravan.');
        return;
      }

      const refereeData = refereeDoc.data();
      const claimedRefPath = doc(db, 'referees', user.uid);

      if (refereeDoc.id === user.uid) {
        await updateDoc(claimedRefPath, {
          ...refereeData,
          currentUid: user.uid,
          activatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        });
      } else {
        await setDoc(claimedRefPath, {
          ...refereeData,
          currentUid: user.uid,
          activatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        });
      }

      navigate('/sudija-dashboard');
    } catch (err) {
      console.error(err);
      setError(`Greška prilikom prijave: ${err.code || 'nepoznata greška'}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_55%,_#111827_100%)] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md overflow-hidden rounded-[24px] border border-slate-800/90 bg-slate-950/90 shadow-2xl shadow-sky-950/20">
        <div className="border-b border-slate-800 bg-gradient-to-r from-sky-500/10 to-transparent px-6 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sky-300">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-400">Referee Access</p>
              <h1 className="text-xl font-black uppercase italic tracking-tight text-white">Prijava Za Sudije</h1>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 sm:px-7 sm:py-7">
          <div className="mb-6 rounded-[18px] border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-sky-300">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-black text-white">Unesite PIN ili pristupni kod</p>
                <p className="mt-1 text-[11px] uppercase tracking-widest text-slate-500">
                  Radi i ako unesete kod bez crtice ili sa razmacima.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                PIN / Kod
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="npr. AB-1234"
                  className="w-full rounded-[16px] border border-slate-800 bg-slate-950 py-3.5 pl-11 pr-4 text-center text-lg font-black uppercase tracking-[0.18em] text-white outline-none transition-all placeholder:text-slate-700 focus:border-sky-500"
                  autoComplete="off"
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
              className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-sky-600 px-6 py-3.5 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-70 shadow-md shadow-sky-950/30"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Provjera
                </>
              ) : (
                <>
                  Prijavi Se <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-5 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-[11px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:text-sky-300"
            >
              Niste sudija? Prijava za organizatore
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefereeLogin;
