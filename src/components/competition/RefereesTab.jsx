import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Trash2, Copy, Check, Shield, UserPlus, X } from 'lucide-react';

const RefereesTab = ({ competitionId, tables = [], categories = [] }) => {
  const [referees, setReferees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRefereeName, setNewRefereeName] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    if (!competitionId) return;

    const q = query(collection(db, 'referees'), where('competitionId', '==', competitionId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReferees(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [competitionId]);

  const handleUpdateAssignment = async (refId, field, value) => {
    try {
      const refDoc = doc(db, 'referees', refId);
      const updateData = { [field]: value || null };

      if (field === 'assignedCategoryId' && !value) {
        updateData.assignedGroupId = null;
      }

      await updateDoc(refDoc, updateData);
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      alert('Greška pri ažuriranju zaduženja.');
    }
  };

  const generateCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetters =
      letters[Math.floor(Math.random() * letters.length)] +
      letters[Math.floor(Math.random() * letters.length)];
    const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
    return `${randomLetters}-${randomDigits}`;
  };

  const handleAddReferee = async (e) => {
    e.preventDefault();
    if (!newRefereeName.trim()) return;

    try {
      await addDoc(collection(db, 'referees'), {
        name: newRefereeName.trim(),
        code: generateCode(),
        competitionId,
        assignedMatchIds: [],
        currentUid: null,
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setNewRefereeName('');
    } catch (err) {
      console.error('Error adding referee:', err);
      alert(`Greška: ${err.message}`);
    }
  };

  const handleDeleteReferee = async (id) => {
    if (!window.confirm('Da li ste sigurni da želite obrisati ovog sudiju?')) return;
    try {
      await deleteDoc(doc(db, 'referees', id));
    } catch (err) {
      console.error('Error deleting referee:', err);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return (
      <div className="p-16 text-center animate-pulse">
        <div className="w-14 h-14 bg-slate-900 rounded-2xl mx-auto mb-5 flex items-center justify-center">
          <Shield className="text-sky-400 w-7 h-7" />
        </div>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-600">Učitavanje sudija...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-5 sm:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 bg-slate-950/90 p-5 sm:p-6 rounded-[24px] border border-slate-800 shadow-lg">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-white italic tracking-tight uppercase leading-none mb-1.5">
            Sudije <span className="text-sky-400/30">({referees.length})</span>
          </h3>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">UPRAVLJANJE SUDIJAMA I DIGITALNIM PRISTUPOM</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full md:w-auto bg-sky-600 hover:bg-sky-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-sky-950/20 flex items-center justify-center gap-2"
        >
          <UserPlus size={16} />
          Novi Sudija
        </button>
      </div>

      {referees.length === 0 ? (
        <div className="text-center py-24 bg-slate-950/40 rounded-[24px] border border-dashed border-slate-800">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl mx-auto flex items-center justify-center mb-5">
            <Shield className="w-8 h-8 text-slate-700" />
          </div>
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Nema dodijeljenih sudija</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {referees.map((ref) => (
            <div key={ref.id} className="bg-slate-950/95 border border-slate-800 hover:border-slate-700 rounded-[24px] p-5 shadow-sm transition-all flex flex-col justify-between">
              <div className="flex justify-between items-start gap-4 mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-sky-300">
                    <Shield size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight italic text-white leading-none mb-1.5">{ref.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${ref.currentUid ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400/30'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${ref.currentUid ? 'text-emerald-400' : 'text-amber-400/60'}`}>
                        {ref.currentUid ? 'AKTIVAN LOGIN' : 'NA ČEKANJU'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteReferee(ref.id)}
                  className="p-2.5 text-slate-600 hover:text-red-400 transition-all bg-slate-900/50 rounded-xl border border-slate-800"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-[20px] mb-5">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">PRISTUPNI KOD</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-2xl font-black text-white tracking-[0.08em] italic leading-none truncate">
                    {ref.code}
                  </span>
                  <button
                    onClick={() => copyToClipboard(ref.code)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      copiedCode === ref.code
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-950/20'
                        : 'bg-slate-950 text-slate-400 hover:text-sky-300 border border-slate-800'
                    }`}
                  >
                    {copiedCode === ref.code ? <Check size={14} /> : <Copy size={14} />}
                    {copiedCode === ref.code ? 'OK' : 'KOPIRAJ'}
                  </button>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block ml-1">ZADUŽENI TEREN</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 text-[11px] font-black uppercase text-white tracking-widest outline-none focus:border-sky-500 transition-all cursor-pointer appearance-none"
                    value={ref.assignedTableId || ''}
                    onChange={(e) => handleUpdateAssignment(ref.id, 'assignedTableId', e.target.value)}
                  >
                    <option value="">SVI TERENI</option>
                    {tables.map((table) => (
                      <option key={table.id} value={table.id}>{table.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block ml-1">KATEGORIJA</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 text-[11px] font-black uppercase text-white tracking-widest outline-none focus:border-sky-500 transition-all cursor-pointer appearance-none"
                    value={ref.assignedCategoryId || ''}
                    onChange={(e) => handleUpdateAssignment(ref.id, 'assignedCategoryId', e.target.value)}
                  >
                    <option value="">SVE KATEGORIJE</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                {ref.assignedCategoryId && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block ml-1">GRUPA (OPCIONO)</label>
                    <select
                      className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 text-[11px] font-black uppercase text-white tracking-widest outline-none focus:border-sky-500 transition-all cursor-pointer appearance-none"
                      value={ref.assignedGroupId !== undefined && ref.assignedGroupId !== null ? ref.assignedGroupId : ''}
                      onChange={(e) => handleUpdateAssignment(ref.id, 'assignedGroupId', e.target.value !== '' ? parseInt(e.target.value, 10) : null)}
                    >
                      <option value="">SVE GRUPE</option>
                      {Array.from({ length: 26 }, (_, idx) => (
                        <option key={idx} value={idx}>Grupa {String.fromCharCode(65 + idx)}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-[24px] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-sky-600/10 to-transparent">
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Novi Sudija</h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Kreirajte pristupni kod</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleAddReferee} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ime i Prezime</label>
                <input
                  type="text"
                  required
                  value={newRefereeName}
                  onChange={(e) => setNewRefereeName(e.target.value)}
                  placeholder="npr. Adnan Sudija"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-all placeholder:text-slate-700"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-white transition-all"
                >
                  Odustani
                </button>
                <button
                  type="submit"
                  disabled={!newRefereeName.trim()}
                  className="flex-1 bg-sky-600 hover:bg-sky-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md shadow-sky-950/20"
                >
                  Kreiraj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefereesTab;
