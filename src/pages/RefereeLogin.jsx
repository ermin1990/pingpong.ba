import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { signInAnonymously } from 'firebase/auth';
import { collection, query, where, getDocs, updateDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

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
      // 1. Prvo se prijavimo anonimno na Firebase
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

      // 2. Tražimo sudiju sa ovim kodom
      const q = query(collection(db, 'referees'), where('code', '==', code.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Neispravan kod sudije.');
        setLoading(false);
        return;
      }

      const refereeDoc = querySnapshot.docs[0];
      const refereeData = refereeDoc.data();

      // 3. Povezujemo anonimnog korisnika sa sudijom (Claim)
      // Dozvoljavamo prijavu čak i ako je currentUid postavljen (preuzimanje sesije)
      // Koristimo UID kao ID dokumenta za lakša security rules
      const newRef = doc(db, 'referees', user.uid);
      await setDoc(newRef, {
        ...refereeData,
        currentUid: user.uid,
        activatedAt: new Date()
      });
      
      // Brišemo staru referencu kojom je kod pronađen (ako nije isti ID)
      if (refereeDoc.id !== user.uid) {
         await deleteDoc(refereeDoc.ref);
      }

      // 5. Redirekcija
      navigate('/sudija-dashboard');

    } catch (err) {
      console.error(err);
      setError('Greška prilikom prijave: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Prijava za Sudije</h1>
          <p className="text-slate-500 mt-2">Unesite vaš jedinstveni kod za pristup mečevima</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Pristupni Kod
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="npr. REF-12345"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-center text-xl tracking-widest uppercase"
              required
            />
          </div>

          {error && (
            <div className="flex items-center p-4 text-sm text-red-800 rounded-lg bg-red-50">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center mb-6"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Prijavi se <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="pt-6 border-t border-slate-700 text-center">
            <button 
                onClick={() => navigate('/login')}
                className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
            >
                Niste sudija? Prijava za organizatore
            </button>
        </div>
      </div>
    </div>
  );
};

export default RefereeLogin;
