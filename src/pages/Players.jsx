import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, writeBatch, updateDoc } from 'firebase/firestore';
import DashboardLayout from '../layouts/DashboardLayout';
import { Users, Search, UserPlus, Trash2, FileText, LayoutGrid, Info, Edit2, XCircle, UserCircle2 } from 'lucide-react';

const Players = () => {
  const navigate = useNavigate();
  const { userData, user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [club, setClub] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [formMode, setFormMode] = useState('single'); // 'single' | 'bulk'
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPlayer, setEditingPlayer] = useState(null);

  useEffect(() => {
    if (!user) return; // Wait for user

    let q;
    const userRole = userData?.role;
    
    if (userRole === 'super_admin') {
      q = query(collection(db, "players"));
    } else {
      // Use user.uid which is guaranteed
      q = query(
        collection(db, "players"),
        where("ownerUid", "==", user.uid)
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
  }, [user, userData]); // Added user dependency

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "players"), {
        name: name.trim(),
        email: email.trim(),
        club: club.trim(),
        ownerUid: userData.uid,
        ownerEmail: userData.email,
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

  const handleUpdatePlayer = async (e) => {
    e.preventDefault();
    if (!name.trim() || !editingPlayer) return;

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "players", editingPlayer.id), {
        name: name.trim(),
        email: email.trim(),
        club: club.trim(),
        updatedAt: new Date()
      });
      setEditingPlayer(null);
      setName('');
      setEmail('');
      setClub('');
    } catch (err) {
      console.error("Greška pri ažuriranju igrača:", err);
      alert("Greška pri ažuriranju profila.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (player) => {
    setEditingPlayer(player);
    setName(player.name || '');
    setEmail(player.email || '');
    setClub(player.club || '');
    setFormMode('single');
  };

  const cancelEditing = () => {
    setEditingPlayer(null);
    setName('');
    setEmail('');
    setClub('');
  };

  const handleBulkAdd = async (e) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

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
            ownerUid: userData.uid,
            ownerEmail: userData.email,
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
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Centralni Registar</h2>
            <p className="text-slate-500 text-sm">Ukupno {players.length} profila sportista u bazi.</p>
          </div>
          
          <div className="relative w-full md:w-72">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
             <input 
              type="text" 
              placeholder="Pretraži..." 
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm dark:shadow-none transition-all placeholder:text-slate-400" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className={`bg-white dark:bg-slate-800/50 border ${editingPlayer ? 'border-blue-500/50' : 'border-slate-200 dark:border-slate-800'} p-6 rounded-2xl sticky top-6 shadow-sm dark:shadow-none transition-all`}>
               <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-400 dark:text-slate-500 text-sm uppercase tracking-wider">
                    {editingPlayer ? 'Uredi Profil' : (formMode === 'single' ? 'Novi Profil' : 'Grupni Unos')}
                  </h3>
                  {!editingPlayer && (
                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                      <button 
                        onClick={() => setFormMode('single')}
                        className={`p-1.5 rounded-md transition-all ${formMode === 'single' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        <UserPlus size={16} />
                      </button>
                      <button 
                        onClick={() => setFormMode('bulk')}
                        className={`p-1.5 rounded-md transition-all ${formMode === 'bulk' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        <FileText size={16} />
                      </button>
                    </div>
                  )}
                  {editingPlayer && (
                    <button 
                      onClick={cancelEditing}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      title="Otkaži uređivanje"
                    >
                      <XCircle size={18} />
                    </button>
                  )}
               </div>

              {formMode === 'single' ? (
                <form onSubmit={editingPlayer ? handleUpdatePlayer : handleAddPlayer} className="space-y-4">
                  <input 
                    placeholder="Ime i Prezime" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner transition-all font-medium" 
                    value={name} onChange={(e) => setName(e.target.value)} required
                  />
                  <input 
                    placeholder="E-mail (opciono)" 
                    type="email"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner transition-all font-medium" 
                    value={email} onChange={(e) => setEmail(e.target.value)}
                  />
                  <input 
                    placeholder="Klub / Organizacija" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner transition-all font-medium" 
                    value={club} onChange={(e) => setClub(e.target.value)}
                  />
                  {editingPlayer ? (
                    <div className="flex gap-2">
                       <button 
                        type="button"
                        onClick={cancelEditing}
                        className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-800 transition-all shadow-sm"
                      >
                        Otkaži
                      </button>
                      <button 
                        disabled={isSubmitting}
                        className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                      >
                        Sačuvaj izmjene
                      </button>
                    </div>
                  ) : (
                    <button 
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                    >
                      Dodaj u Registar
                    </button>
                  )}
                </form>
              ) : (
                <form onSubmit={handleBulkAdd} className="space-y-4">
                  <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-medium px-1">Format: Ime Prezime, Klub;</p>
                  <textarea 
                    placeholder="Marko Marković, STK Spin;&#10;Jovan Jovanović, STK Sarajevo;" 
                    rows={8} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none placeholder:text-slate-400 dark:placeholder:text-slate-700 transition-all" 
                    value={bulkText} onChange={(e) => setBulkText(e.target.value)} required
                  />
                  <button 
                    disabled={isSubmitting}
                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-semibold text-sm hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-50"
                  >
                    Procesiraj Listu
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* List Area */}
          <div className="lg:col-span-2 space-y-4">
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
                {loading ? (
                   <div className="py-20 text-center text-slate-500">Učitavanje...</div>
                ) : filteredPlayers.length === 0 ? (
                  <div className="py-20 text-center">
                    <Users className="w-10 h-10 text-slate-100 dark:text-slate-800 mx-auto mb-4" />
                    <p className="text-slate-400 text-sm italic">Nema pronađenih rezultata.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                          <th className="px-6 py-4">Igrač</th>
                          <th className="px-6 py-4">Klub</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Akcije</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                        {filteredPlayers.map(player => (
                          <tr key={player.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all group font-sans">
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-500 font-bold text-xs uppercase">
                                    {player.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 dark:text-white text-sm">{player.name}</div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-500 font-medium">{player.email || 'Nema email'}</div>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                {player.club || '-'}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-xs font-medium">
                               <span className="text-slate-500 dark:text-slate-500">{player.matchesPlayed || 0} mečeva</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => navigate(`/admin/players/${player.id}`)}
                                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-amber-500 transition-all md:opacity-0 md:group-hover:opacity-100"
                                    title="Profil igrača"
                                  >
                                    <UserCircle2 size={16} />
                                  </button>
                                  <button
                                    onClick={() => startEditing(player)}
                                    className={`p-2 transition-all md:opacity-0 md:group-hover:opacity-100 ${editingPlayer?.id === player.id ? 'text-blue-600 bg-blue-600/10 rounded-lg opacity-100' : 'text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400'}`}
                                    title="Uredi"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button 
                                    onClick={() => deletePlayer(player.id)}
                                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-all md:opacity-0 md:group-hover:opacity-100"
                                    title="Obriši"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                               </div>
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