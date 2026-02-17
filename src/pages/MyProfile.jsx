import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { CreditCard, ArrowUpRight, Mail, Trophy, Users, Layout, Clock, CheckCircle } from 'lucide-react';

const MyProfile = () => {
  const { userData, user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [planDetails, setPlanDetails] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { getDocs, query, orderBy } = await import('firebase/firestore');
        const q = query(collection(db, 'plans'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAvailablePlans(data);
        if (data.length > 0) setSelectedPlan(data[0].name);
      } catch (e) {
        console.error("Greška pri dohvaćanju svih planova:", e);
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    const fetchPlanDetails = async () => {
      if (userData?.subscriptionPlanId) {
        setLoadingPlan(true);
        try {
          const planSnap = await getDoc(doc(db, 'plans', userData.subscriptionPlanId));
          if (planSnap.exists()) {
            setPlanDetails(planSnap.data());
          }
        } catch (err) {
          console.error("Greška pri dohvaćanju detalja plana:", err);
        } finally {
          setLoadingPlan(false);
        }
      }
    };

    fetchPlanDetails();
  }, [userData?.subscriptionPlanId]);

  const currentPlanName = userData?.subscriptionPlan || 'Basic';

  const handleRequestUpgrade = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'access_requests'), {
        type: 'upgrade_request',
        userId: userData?.uid || user?.uid || null,
        email: userData?.email || user?.email,
        currentPlan: currentPlanName,
        requestedPlan: selectedPlan,
        message: message || '',
        status: 'pending',
        createdAt: serverTimestamp()
      });

      setSuccess(true);
      setShowModal(false);
      setMessage('');
    } catch (err) {
      console.error('Greška pri slanju zahtjeva:', err);
      alert('Došlo je do greške. Pokušajte ponovo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Moj profil">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 uppercase font-medium tracking-wide">Korisnik</div>
              <div className="text-lg font-medium text-white">{userData?.displayName || user?.email}</div>
              <div className="text-sm text-slate-500">{userData?.email}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Trenutni plan</div>
              <div className="text-lg font-semibold text-blue-400">{currentPlanName}</div>
              {userData?.subscriptionExpiry && (
                <div className="text-xs text-slate-500">
                  Ističe: {userData.subscriptionExpiry.seconds ? new Date(userData.subscriptionExpiry.toMillis()).toLocaleDateString() : new Date(userData.subscriptionExpiry).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 md:col-span-2 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <Layout size={18} className="text-blue-500" />
                Mogućnosti vašeg plana
              </h3>
              
              {loadingPlan ? (
                <div className="animate-pulse flex space-y-4 flex-col">
                  <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                </div>
              ) : planDetails ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase mb-1.5">
                        <Trophy size={12} /> Limit takmičenja
                      </div>
                      <div className="text-xl font-semibold text-white">{planDetails.tournamentsLimit}</div>
                      <div className="text-xs text-slate-500">Turnira ili liga ukupno</div>
                    </div>
                    
                    <div className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase mb-1.5">
                        <Layout size={12} /> Limit grupa
                      </div>
                      <div className="text-xl font-semibold text-white">{planDetails.groupsLimit}</div>
                      <div className="text-xs text-slate-500">Po turniru</div>
                    </div>

                    <div className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase mb-1.5">
                        <Users size={12} /> Igrača po grupi
                      </div>
                      <div className="text-xl font-semibold text-white">{planDetails.playersPerGroupLimit}</div>
                      <div className="text-xs text-slate-500">Maksimalno</div>
                    </div>
                  </div>

                  {planDetails.features && planDetails.features.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-xs font-medium uppercase text-slate-500 tracking-wide">Uključene opcije:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {planDetails.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                            <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-sm text-blue-400">
                    Koristite osnovni plan. Za više mogućnosti, zatražite nadogradnju.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Želite više?</h4>
                <p className="text-xs text-slate-400">Nadogradite plan za veće limite i ekskluzivne opcije.</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 text-sm"
              >
                <ArrowUpRight size={16} /> Nadogradi
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Mail size={16} className="text-blue-500" /> Podrška
              </h3>
              <p className="text-xs text-slate-400 mb-4">Ako imate pitanja ili trebate pomoć, pošaljite poruku našem timu.</p>
              <a href="mailto:info@pingpong.ba" className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-xs transition-colors">
                Kontaktiraj nas
              </a>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Clock size={16} className="text-blue-500" /> Info
              </h3>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Vaša pretplata se računa od datuma dodjele plana. Ukoliko je plan "Jednokratni", on važi do završetka navedenog takmičenja.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 opacity-60">
          <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Historija zahtjeva</h4>
          <p className="text-xs text-slate-500 font-medium">Vaši zahtjevi za nadogradnju se obrađuju u roku od 24 sata.</p>
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowModal(false)}></div>
            <form onSubmit={handleRequestUpgrade} className="relative bg-slate-900 border border-slate-800 rounded-lg p-6 w-full max-w-lg z-10">
              <h3 className="text-lg font-bold text-white mb-4">Zatraži nadogradnju</h3>
              <div className="space-y-3 mb-4">
                <label className="text-sm text-slate-400">Odaberite plan</label>
                <select value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                  {availablePlans.map(p => (
                    <option key={p.id} value={p.name}>{p.name} — {p.price}</option>
                  ))}
                  {availablePlans.length === 0 && <option value="">Nema dostupnih planova</option>}
                </select>
              </div>

              <div className="space-y-3 mb-4">
                <label className="text-sm text-slate-400">Poruka (opcionalno)</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 min-h-[80px]" placeholder="Napišite razlog za nadogradnju..."></textarea>
              </div>

              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-slate-800">Otkaži</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold">
                  {submitting ? 'Šaljem...' : 'Pošalji zahtjev'}
                </button>
              </div>
            </form>
          </div>
        )}

        {success && (
          <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg">Zahtjev poslan. Hvala!</div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyProfile;
