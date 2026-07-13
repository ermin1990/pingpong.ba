import { useState } from 'react';
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { X, CheckCircle2, Loader2, UserPlus } from 'lucide-react';

// Public sign-up form for a tournament/league: anyone can submit (no login
// required) - the organizer reviews and approves each request from their
// "Prijave" tab, which is what actually creates the player record and
// provisions their login. See firestore.rules `registrations` for the
// write constraints (competition must be public with registration.isOpen).
const PublicRegisterModal = ({ show, competition, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [club, setClub] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!show) return null;

  const categories = competition?.availableCategories || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      await addDoc(collection(db, 'registrations'), {
        competitionId: competition.id,
        competitionName: competition.name || '',
        categoryName: categoryName || null,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        club: club.trim(),
        message: message.trim(),
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setDone(true);
    } catch (err) {
      console.error(err);
      setError('Greška pri slanju prijave. Pokušajte ponovo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setDone(false);
    setName(''); setEmail(''); setPhone(''); setClub(''); setCategoryName(''); setMessage('');
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[24px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-white font-black uppercase tracking-tight text-sm leading-none">Prijava</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 truncate max-w-[260px]">
              {competition?.name}
            </p>
          </div>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-red-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
          {done ? (
            <div className="flex flex-col items-center text-center gap-4 py-8">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={30} />
              </div>
              <h4 className="text-white font-black uppercase italic tracking-tight text-lg">Prijava poslana!</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Organizator će pregledati vašu prijavu. Kada je odobri, na <span className="text-slate-200 font-semibold">{email}</span> stiže email s linkom da postavite lozinku i pratite svoje mečeve.
              </p>
              <button
                onClick={handleClose}
                className="mt-2 px-8 py-3 bg-lime-400 hover:bg-lime-300 text-black font-black uppercase tracking-widest text-xs rounded-xl transition-all"
              >
                Zatvori
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <Field label="Ime i prezime *">
                <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="npr. Amar Amarić" className="input" />
              </Field>
              <Field label="E-mail *">
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ime@email.com" className="input" />
              </Field>
              <p className="text-[10px] text-slate-500 -mt-2 px-1">Na ovaj email stiže link za pristup vašem nalogu nakon odobrenja.</p>
              <Field label="Telefon">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06x xxx xxx" className="input" />
              </Field>
              <Field label="Klub (opciono)">
                <input value={club} onChange={(e) => setClub(e.target.value)} placeholder="npr. TK Sarajevo" className="input" />
              </Field>
              {categories.length > 0 && (
                <Field label="Kategorija">
                  <select value={categoryName} onChange={(e) => setCategoryName(e.target.value)} className="input">
                    <option value="">Odaberite kategoriju...</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              )}
              <Field label="Poruka (opciono)">
                <textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)} className="input resize-none" />
              </Field>

              {error && <p className="text-red-400 text-xs font-medium">{error}</p>}

              <button
                disabled={submitting}
                className="w-full mt-2 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-black uppercase tracking-widest text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                {submitting ? 'Slanje...' : 'Pošalji prijavu'}
              </button>
            </form>
          )}
        </div>
      </div>
      <style>{`.input { width: 100%; background: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 10px 14px; color: white; font-size: 13px; outline: none; transition: border-color .15s; } .input:focus { border-color: #a3e635; }`}</style>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">{label}</label>
    {children}
  </div>
);

export default PublicRegisterModal;
