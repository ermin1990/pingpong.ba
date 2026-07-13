import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { 
  collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc 
} from 'firebase/firestore';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  Trophy, Plus, ChevronRight, Zap, Calendar, Users, Info, Search, Trash2, Edit2, X, ExternalLink
} from 'lucide-react';

const SeasonList = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSeason, setEditingSeason] = useState(null);
  const [name, setName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "amater_leagues")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter by owner or collaborator
      const filtered = list.filter(item => 
        item.ownerUid === user.uid || 
        item.collaborators?.includes(user.email) ||
        userData?.role === 'super_admin'
      );

      setSeasons(filtered);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userData]);

  const handleCreateSeason = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editingSeason) {
        await updateDoc(doc(db, "amater_leagues", editingSeason.id), {
          name: name.trim()
        });
      } else {
        const shortId = Math.random().toString(36).substring(2, 7).toUpperCase();
        const docRef = await setDoc(doc(db, "amater_leagues", shortId), {
          name: name.trim(),
          type: 'league_season',
          status: 'draft',
          ownerUid: user.uid,
          ownerEmail: user.email,
          createdAt: serverTimestamp(),
          sport: 'Padel',
          slug: name.trim().toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
          pointsSystem: {
            winInGroup: 5,
            winAfterGroup: 5,
            bonusPoints: { 1: 15, 2: 12, 3: 10, "9-16": 2 }
          }
        });
      }
      setShowModal(false);
      setEditingSeason(null);
      setName('');
    } catch (err) {
      alert("Greška pri spremanju sezone.");
    }
  };

  const handleDeleteSeason = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Da li ste sigurni da želite obrisati ovu sezonu i sve njene podatke?")) {
      try {
        await deleteDoc(doc(db, "amater_leagues", id));
      } catch (err) {
        alert("Greška pri brisanju sezone.");
      }
    }
  };

  const handleEditSeason = (season, e) => {
    e.stopPropagation();
    setEditingSeason(season);
    setName(season.name);
    setShowModal(true);
  };

  const filteredSeasons = seasons.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Amaterske Lige">
      <div className="max-w-7xl mx-auto space-y-8 px-4 pb-20">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 border border-slate-800 p-8 rounded-[2rem] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/5 rounded-full -ml-32 -mt-32 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
              <Zap className="text-yellow-400 fill-yellow-400" /> Amaterske Lige
            </h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Upravljanje sezonskim amaterskim ligama i zbirnim tabelama</p>
          </div>
          
          <button 
            onClick={() => {
                setEditingSeason(null);
                setName('');
                setShowModal(true);
            }}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-blue-900/40 active:scale-95 flex items-center gap-3 relative z-10"
          >
            <Plus size={18} className="stroke-[3]" /> Nova Amaterska Liga
          </button>
        </div>

        {/* Search */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
          </div>
          <input 
            type="text"
            placeholder="Pretraži sezone po nazivu..."
            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-14 pr-6 text-white text-sm font-bold placeholder:text-slate-700 outline-none focus:border-blue-500/50 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-slate-900/50 border border-slate-800 rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : filteredSeasons.length === 0 ? (
          <div className="text-center py-24 bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-[3rem]">
            <Trophy className="w-16 h-16 text-slate-800 mx-auto mb-6 opacity-50" />
            <h3 className="text-2xl font-black text-white uppercase italic tracking-widest">Nema aktivnih sezona</h3>
            <p className="text-slate-500 mt-3 max-w-sm mx-auto text-xs font-bold uppercase tracking-widest leading-relaxed">
              Kreirajte svoju prvu sezonu kako biste počeli sa organizacijom mjesečnih turnira.
            </p>
            <button 
              onClick={() => setShowModal(true)}
              className="mt-8 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
            >
              Započni Kreiranje
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSeasons.map(season => (
              <div key={season.id} className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 hover:border-blue-500/50 transition-all group relative overflow-hidden flex flex-col h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-yellow-500/10 transition-all" />
                
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20 group-hover:scale-110 transition-transform">
                     <Zap className="text-yellow-500" size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    {season.slug && (
                      <a 
                        href={`/p/${season.slug}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-xl transition-all"
                        onClick={(e) => e.stopPropagation()}
                        title="Javni Pregled"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <button 
                      onClick={(e) => handleEditSeason(season, e)}
                      className="p-2 bg-slate-800 hover:bg-emerald-600 text-slate-400 hover:text-white rounded-xl transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteSeason(season.id, e)}
                      className="p-2 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-xl transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex-grow">
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-2 group-hover:text-blue-400 transition-colors truncate">{season.name}</h3>
                  
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-slate-500">
                        <Calendar size={14} className="text-slate-700" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{new Date(season.createdAt?.toDate?.() || Date.now()).toLocaleDateString('bs-BA')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500">
                        <Users size={14} className="text-slate-700" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Zbirna Tabela Sezone</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => navigate(`/admin/seasons/${season.id}`)}
                  className="w-full py-4 bg-slate-800 group-hover:bg-blue-600 text-slate-300 group-hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                >
                  Upravljaj Sezonom <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Create Season Modal */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-10 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-blue-600/10 to-transparent">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                      <Plus className="text-white" size={24} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">
                        {editingSeason ? 'Uredi Amatersku Ligu' : 'Nova Amaterska Liga'}
                      </h3>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2 italic">Format: Amaterska Liga (5pts + Bonus)</p>
                   </div>
                </div>
                <button 
                  onClick={() => {
                    setShowModal(false);
                    setEditingSeason(null);
                    setName('');
                  }} 
                  className="text-slate-500 hover:text-white transition-colors transition-transform hover:rotate-90"
                >
                  <X size={32} />
                </button>
              </div>
              
              <form onSubmit={handleCreateSeason} className="p-10 space-y-8">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Naziv Sezone</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="npr. ROZE PHARM LIGA 2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-8 py-5 text-white focus:outline-none focus:border-blue-500 transition-all font-black uppercase placeholder:text-slate-800 italic"
                  />
                </div>

                <div className="bg-blue-600/5 border border-blue-600/20 rounded-2xl p-6 flex gap-4">
                  <Info className="text-blue-500 shrink-0" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                    Ovaj format omogućava kreiranje pod-turnira koji se automatski boduju za glavnu tabelu sezone. Pravila bodovanja moći ćete fino podesiti naknadno.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.3em] rounded-2xl transition-all shadow-2xl shadow-blue-900/40 active:scale-[0.98] text-sm italic"
                >
                  {editingSeason ? 'Spremi Izmjene' : 'Kreiraj Sezonu'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SeasonList;
