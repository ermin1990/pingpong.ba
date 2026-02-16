import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Users, Plus, Trash2, Copy, Check, Shield, UserPlus, X } from 'lucide-react';

const RefereesTab = ({ competitionId, tables = [], categories = [] }) => {
  const [referees, setReferees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRefereeName, setNewRefereeName] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    if (!competitionId) return;

    // Listen to referees for this competition
    const q = query(
      collection(db, 'referees'), 
      where('competitionId', '==', competitionId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const refs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReferees(refs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [competitionId]);

  const handleUpdateAssignment = async (refId, field, value) => {
    try {
      const refDoc = doc(db, 'referees', refId);
      const updateData = { [field]: value || null };
      
      // Ako resetujemo kategoriju, resetujemo i grupu
      if (field === 'assignedCategoryId' && !value) {
        updateData.assignedGroupId = null;
      }
      
      await updateDoc(refDoc, updateData);
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      alert("Greška pri ažuriranju zaduženja.");
    }
  };

  const handleUpdateTableAssignment = (refId, tableId) => handleUpdateAssignment(refId, 'assignedTableId', tableId);

  const generateCode = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const randomLetters = letters[Math.floor(Math.random() * letters.length)] + 
                         letters[Math.floor(Math.random() * letters.length)];
    const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
    return `${randomLetters}-${randomDigits}`;
  };

  const handleAddReferee = async (e) => {
    e.preventDefault();
    if (!newRefereeName.trim()) return;

    const code = generateCode();
    // Note: Theoretical collision possible but unlikely for small scale. 
    // Production would check 'exists' loop.

    try {
      await addDoc(collection(db, 'referees'), {
        name: newRefereeName.trim(),
        code: code,
        competitionId: competitionId,
        assignedMatchIds: [],
        currentUid: null,
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setNewRefereeName('');
    } catch (err) {
      console.error("Error adding referee:", err);
      alert("Greška: " + err.message);
    }
  };

  const handleDeleteReferee = async (id) => {
    if (window.confirm("Da li ste sigurni da želite obrisati ovog sudiju?")) {
      try {
        await deleteDoc(doc(db, 'referees', id));
      } catch (err) {
        console.error("Error deleting referee:", err);
      }
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Učitavanje sudija...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Sudije ({referees.length})</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Upravljanje sudijama i pristupom</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Novi Sudija
        </button>
      </div>

      {referees.length === 0 ? (
        <div className="text-center py-16 bg-slate-100 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 transition-colors">
          <Shield className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Nema dodanih sudija</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {referees.map((ref) => (
            <div key={ref.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                    <Shield size={22} />
                  </div>
                  <div>
                    <h3 className="font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-none mb-1">{ref.name}</h3>
                    <div className="flex items-center gap-2">
                       <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${ref.currentUid ? 'bg-emerald-100/10 text-emerald-500' : 'bg-amber-100/10 text-amber-500'}`}>
                        {ref.currentUid ? 'Aktivan' : 'Na čekanju'}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteReferee(ref.id)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 mb-5">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Pristupni Kod</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-500 tracking-widest">
                    {ref.code}
                  </span>
                  <button 
                    onClick={() => copyToClipboard(ref.code)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${copiedCode === ref.code ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 hover:text-blue-600 shadow-sm'}`}
                  >
                    {copiedCode === ref.code ? <Check size={12} /> : <Copy size={12} />}
                    {copiedCode === ref.code ? 'KOPIRANO' : 'KOPIRAJ'}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                       <div className="w-1 h-1 bg-blue-500 rounded-full"></div> Dodijeljeni Stol
                    </label>
                    <select 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-all cursor-pointer"
                      value={ref.assignedTableId || ''}
                      onChange={(e) => handleUpdateTableAssignment(ref.id, e.target.value)}
                    >
                      <option value="">Svi Stolovi (Slobodan)</option>
                      {tables.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                       <div className="w-1 h-1 bg-blue-500 rounded-full"></div> Kategorija
                    </label>
                    <select 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-all cursor-pointer"
                      value={ref.assignedCategoryId || ''}
                      onChange={(e) => handleUpdateAssignment(ref.id, 'assignedCategoryId', e.target.value)}
                    >
                      <option value="">Sve Kategorije</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {ref.assignedCategoryId && (
                    <div className="space-y-1.5 animate-in slide-in-from-left-2 fade-in duration-300">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-500 rounded-full"></div> Grupa (Opciono)
                      </label>
                      <select 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-all cursor-pointer"
                        value={ref.assignedGroupId !== undefined && ref.assignedGroupId !== null ? ref.assignedGroupId : ''}
                        onChange={(e) => handleUpdateAssignment(ref.id, 'assignedGroupId', e.target.value !== '' ? parseInt(e.target.value) : null)}
                      >
                        <option value="">Sve grupe</option>
                        {Array.from({ length: 26 }, (_, i) => (
                          <option key={i} value={i}>Grupa {String.fromCharCode(65 + i)}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Referee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-blue-600/10 to-transparent">
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Novi Sudija</h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Kreirajte pristupni kod</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddReferee} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  Ime i Prezime
                </label>
                <input
                  type="text"
                  required
                  value={newRefereeName}
                  onChange={(e) => setNewRefereeName(e.target.value)}
                  placeholder="npr. Adnan Sudija"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-700"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-white transition-all"
                >
                  Odustani
                </button>
                <button
                  type="submit"
                  disabled={!newRefereeName.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95"
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
