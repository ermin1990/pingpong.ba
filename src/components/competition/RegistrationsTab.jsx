import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import {
  collection, query, where, onSnapshot, addDoc, updateDoc, doc,
  serverTimestamp, getDocs
} from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { provisionPlayerAccount } from '../../utils/playerAccounts';
import { Check, X, Mail, Phone, Building2, Tag, Loader2, Inbox, CheckCircle2, XCircle } from 'lucide-react';

// Organizer-side review queue for public sign-up requests (see
// PublicRegisterModal). Approving a request creates (or reuses) a `players`
// record, provisions that player's login via provisionPlayerAccount, and
// hands the resulting player back to the parent via onApproved so it can be
// added to the league's participants / a tournament category.
const RegistrationsTab = ({ competitionId, onApproved }) => {
  const { userData } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!competitionId) return;
    const q = query(collection(db, 'registrations'), where('competitionId', '==', competitionId));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRegistrations(list);
      setLoading(false);
    });
    return () => unsub();
  }, [competitionId]);

  const findOrCreatePlayer = async (reg) => {
    const existingQ = query(
      collection(db, 'players'),
      where('ownerUid', '==', userData.uid),
      where('email', '==', reg.email)
    );
    const existingSnap = await getDocs(existingQ);
    if (!existingSnap.empty) {
      const d = existingSnap.docs[0];
      return { id: d.id, ...d.data() };
    }

    const newPlayerRef = await addDoc(collection(db, 'players'), {
      name: reg.name,
      email: reg.email,
      club: reg.club || '',
      phone: reg.phone || '',
      ownerUid: userData.uid,
      ownerEmail: userData.email,
      authUid: null,
      createdAt: serverTimestamp(),
      matchesPlayed: 0,
      wins: 0
    });
    return { id: newPlayerRef.id, name: reg.name, email: reg.email, club: reg.club || '' };
  };

  const handleApprove = async (reg) => {
    setProcessingId(reg.id);
    try {
      const player = await findOrCreatePlayer(reg);

      if (reg.email && !player.authUid) {
        const result = await provisionPlayerAccount(reg.email);
        if (result.ok && result.uid) {
          await updateDoc(doc(db, 'players', player.id), { authUid: result.uid });
          player.authUid = result.uid;
        }
      }

      await updateDoc(doc(db, 'registrations', reg.id), {
        status: 'approved',
        playerId: player.id,
        reviewedAt: serverTimestamp()
      });

      onApproved?.(player, reg);
    } catch (err) {
      console.error(err);
      alert('Greška pri odobravanju prijave.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (reg) => {
    setProcessingId(reg.id);
    try {
      await updateDoc(doc(db, 'registrations', reg.id), {
        status: 'rejected',
        reviewedAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
      alert('Greška pri odbijanju prijave.');
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = registrations.filter(r => (r.status || 'pending') === filter);
  const pendingCount = registrations.filter(r => (r.status || 'pending') === 'pending').length;

  if (loading) return <div className="py-16 text-center text-slate-500 text-sm">Učitavanje prijava...</div>;

  return (
    <div className="space-y-5">
      <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800 w-fit">
        {[
          { id: 'pending', label: `Nove${pendingCount ? ` (${pendingCount})` : ''}` },
          { id: 'approved', label: 'Odobrene' },
          { id: 'rejected', label: 'Odbijene' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === tab.id ? 'bg-lime-400 text-black' : 'text-slate-500 hover:text-white'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/30 border border-slate-800 rounded-2xl">
          <Inbox className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm italic">
            {filter === 'pending' ? 'Nema novih prijava.' : filter === 'approved' ? 'Nema odobrenih prijava.' : 'Nema odbijenih prijava.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(reg => (
            <div key={reg.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-bold text-sm">{reg.name}</span>
                  {reg.categoryName && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-lime-300 bg-lime-500/10 border border-lime-500/20 px-2 py-0.5 rounded-full">
                      <Tag size={10} /> {reg.categoryName}
                    </span>
                  )}
                  {reg.status === 'approved' && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-400">
                      <CheckCircle2 size={11} /> Odobreno
                    </span>
                  )}
                  {reg.status === 'rejected' && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-red-400">
                      <XCircle size={11} /> Odbijeno
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1"><Mail size={11} /> {reg.email}</span>
                  {reg.phone && <span className="flex items-center gap-1"><Phone size={11} /> {reg.phone}</span>}
                  {reg.club && <span className="flex items-center gap-1"><Building2 size={11} /> {reg.club}</span>}
                </div>
                {reg.message && <p className="mt-2 text-xs text-slate-500 italic">"{reg.message}"</p>}
              </div>

              {filter === 'pending' && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleReject(reg)}
                    disabled={processingId === reg.id}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all disabled:opacity-40"
                    title="Odbij"
                  >
                    <X size={16} />
                  </button>
                  <button
                    onClick={() => handleApprove(reg)}
                    disabled={processingId === reg.id}
                    className="px-5 h-10 flex items-center justify-center gap-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-40"
                  >
                    {processingId === reg.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Odobri
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RegistrationsTab;
