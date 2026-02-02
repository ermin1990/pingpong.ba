import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import DashboardLayout from '../layouts/DashboardLayout';
import { Users, Search, UserPlus, Trash2, FileText, LayoutGrid, Info } from 'lucide-react';

const Players = () => {
  const { userData } = useAuth();
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [club, setClub] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [formMode, setFormMode] = useState('single'); // 'single' | 'bulk'
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!userData) return;
    if (!userData.organizationId && userData.role !== 'super_admin') return;

    let q;
    if (userData.role === 'super_admin') {
      q = query(collection(db, "players")); // Super admin vidi sve? Ili samo one bez org?
    } else {
      q = query(
        collection(db, "players"),
        where("organizationId", "==", userData.organizationId)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const playerList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlayers(playerList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    if (!userData?.organizationId && userData.role !== 'super_admin') {
      alert("Greška: Nemate dodijeljenu organizaciju.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "players"), {
        name: name.trim(),
        email: email.trim(),
        club: club.trim(),
        organizationId: userData.organizationId || "SUPER_ADMIN",
        createdAt: new Date(),
        matchesPlayed: 0,
        wins: 0
      });
      setName('');
      setEmail('');
      setClub('');
    } catch (err) {
      console.error("Greška pri dodavanju igrača:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkAdd = async (e) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    if (!userData?.organizationId && userData.role !== 'super_admin') {
      alert("Greška: Nemate dodijeljenu organizaciju.");
      return;
    }

    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);
      // Split by ; or new line
      const entries = bulkText.split(/[;\n]/).filter(entry => entry.trim());
      
      entries.forEach(entry => {
        // format: Ime i Prezime, Klub
        const [playerName, playerClub] = entry.split(',').map(s => s.trim());
        if (playerName) {
          const playerRef = doc(collection(db, "players"));
          batch.set(playerRef, {
            name: playerName,
            club: playerClub || '',
            organizationId: userData.organizationId || "SUPER_ADMIN",
            createdAt: new Date(),
            matchesPlayed: 0,
            wins: 0
          });
        }
      });

      await batch.commit();
      setBulkText('');
      setFormMode('single');
      alert(`Uspješno dodano ${entries.length} igrača.`);
    } catch (err) {
      console.error("Greška pri bulk dodavanju:", err);
      alert("Greška pri spašavanju liste igrača.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletePlayer = async (id) => {
    if (confirm('Jeste li sigurni da želite obrisati igrača?')) {
      try {
        await deleteDoc(doc(db, "players", id));
      } catch (err) {
        console.error("Greška pri brisanju:", err);
      }
    }
  };

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.club?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Igrači">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header with search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Centralni Registar</h2>
            <p className="text-slate-500 text-sm">Ukupno {players.length} profila sportista u bazi.</p>
          </div>
          
          <div className="relative w-full md:w-72">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
             <input 
              type="text" 
              placeholder="Pretraži..." 
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Form Side */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 border border-slate-800 p-6 rounded-2xl sticky top-6">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-400 text-sm uppercase tracking-wider">
                    {formMode === 'single' ? 'Novi Profil' : 'Grupni Unos'}
                  </h3>
                  <div className="flex bg-slate-900 p-1 rounded-lg">
                    <button 
                      onClick={() => setFormMode('single')}
                      className={`p-1.5 rounded-md transition-all ${formMode === 'single' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <UserPlus size={16} />
                    </button>
                    <button 
                      onClick={() => setFormMode('bulk')}
                      className={`p-1.5 rounded-md transition-all ${formMode === 'bulk' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <FileText size={16} />
                    </button>
                  </div>
               </div>

              {formMode === 'single' ? (
                <form onSubmit={handleAddPlayer} className="space-y-4">
                  <input 
                    placeholder="Ime i Prezime" 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none placeholder:text-slate-600" 
                    value={name} onChange={(e) => setName(e.target.value)} required
                  />
                  <input 
                    placeholder="E-mail (opciono)" 
                    type="email"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none placeholder:text-slate-600" 
                    value={email} onChange={(e) => setEmail(e.target.value)}
                  />
                  <input 
                    placeholder="Klub / Organizacija" 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none placeholder:text-slate-600" 
                    value={club} onChange={(e) => setClub(e.target.value)}
                  />
                  <button 
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    Dodaj u Registar
                  </button>
                </form>
              ) : (
                <form onSubmit={handleBulkAdd} className="space-y-4">
                  <p className="text-[10px] text-slate-500 uppercase font-bold px-1">Format: Ime Prezime, Klub;</p>
                  <textarea 
                    placeholder="Marko Marković, STK Spin;&#10;Jovan Jovanović, STK Sarajevo;" 
                    rows={8} 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white font-mono focus:border-blue-500 outline-none resize-none placeholder:text-slate-700" 
                    value={bulkText} onChange={(e) => setBulkText(e.target.value)} required
                  />
                  <button 
                    disabled={isSubmitting}
                    className="w-full bg-white text-slate-900 py-3 rounded-xl font-bold text-sm hover:bg-blue-500 hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-50"
                  >
                    Procesiraj Listu
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* List Area */}
          <div className="lg:col-span-2 space-y-4">
             <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                {loading ? (
                   <div className="py-20 text-center text-slate-500">Učitavanje...</div>
                ) : filteredPlayers.length === 0 ? (
                  <div className="py-20 text-center">
                    <Users className="w-10 h-10 text-slate-800 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm italic">Nema pronađenih rezultata.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-800/50 border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                          <th className="px-6 py-4">Igrač</th>
                          <th className="px-6 py-4">Klub</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Akcije</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {filteredPlayers.map(player => (
                          <tr key={player.id} className="hover:bg-slate-800/20 transition-all group font-sans">
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-500 font-bold text-xs">
                                    {player.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-white text-sm">{player.name}</div>
                                    <div className="text-[10px] text-slate-500">{player.email || 'Nema email'}</div>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <span className="text-xs text-slate-300">
                                {player.club || '-'}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-xs">
                               <span className="text-slate-500">{player.matchesPlayed || 0} mečeva</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <button 
                                onClick={() => deletePlayer(player.id)}
                                className="p-2 text-slate-700 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Players;