import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, or } from 'firebase/firestore';
import { Trophy, Plus, Calendar, Target, ChevronRight, ExternalLink } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';

const Competitions = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // New Comp State
  const [name, setName] = useState('');
  const [sport, setSport] = useState('Table Tennis');
  const [type, setType] = useState('League');

  useEffect(() => {
    if (!userData) return;

    let q;
    if (userData.role === 'super_admin') {
      q = query(collection(db, "competitions"));
    } else {
      const filters = [];
      if (userData.organizationId) {
        filters.push(where("organizationId", "==", userData.organizationId));
      }
      if (userData.email) {
        filters.push(where("collaborators", "array-contains", userData.email));
      }

      if (filters.length === 0) {
        setLoading(false);
        return;
      }

      q = query(
        collection(db, "competitions"),
        or(...filters)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCompetitions(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!userData) {
      alert("Profil se još uvijek učitava. Molimo sačekajte.");
      return;
    }

    if (!userData.organizationId && userData.role !== 'super_admin') {
      alert("Greška: Nemate dodijeljenu organizaciju. Kontaktirajte administratora.");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "competitions"), {
        name,
        sport,
        type,
        status: 'draft',
        organizationId: userData.organizationId || "SUPER_ADMIN",
        createdAt: serverTimestamp(),
        participantsCount: 0
      });
      setShowModal(false);
      setName('');
      navigate(`/competitions/${docRef.id}`);
    } catch (err) {
      console.error("Greška:", err);
      alert(`Greška: ${err.message}`);
    }
  };

  return (
    <DashboardLayout title="Takmičenja">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Upravljačka Ploča</h2>
            <p className="text-slate-500 text-sm">Ukupno {competitions.length} registrovanih takmičenja.</p>
          </div>
          
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Novo Takmičenje
          </button>
        </div>

      {loading ? (
        <div className="text-center py-20 flex flex-col items-center">
           <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
           <p className="text-xs text-slate-500 font-medium">Učitavanje podataka...</p>
        </div>
      ) : competitions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-3xl p-20 text-center">
          <Trophy size={48} className="text-slate-800 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-white mb-2">Nema aktivnih takmičenja</h3>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm">Kreirajte svoj prvi turnir ili ligu i započnite sa upravljanjem.</p>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all"
          >
            Kreiraj Takmičenje
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitions.map(comp => (
            <div key={comp.id} className="group bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    comp.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {comp.status === 'draft' ? 'Nije pokrenuto' : 'Aktivno'}
                  </span>
                  <Trophy size={16} className="text-slate-700" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-500 transition-colors">{comp.name}</h3>
                <div className="text-xs text-slate-500 flex items-center gap-2 mb-6">
                  <span>{comp.sport}</span>
                  <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                  <span>{comp.type}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                    <Calendar size={14} /> {comp.createdAt?.toDate().toLocaleDateString('de-DE')}
                  </div>
                  {comp.slug && (
                    <a 
                      href={`/p/${comp.slug}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-400 transition-colors"
                      title="Javni prikaz"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
                <Link 
                  to={`/competitions/${comp.id}`} 
                  className="bg-slate-800 p-2 rounded-lg text-slate-400 hover:text-white transition-all"
                >
                  <ChevronRight size={18} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Simplified */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-white mb-6">Novo Takmičenje</h2>
            
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Naziv Takmičenja</label>
                <input 
                  type="text" required
                  placeholder="npr. Proljećni Kup 2026"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none placeholder:text-slate-600"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Format Takmičenja</label>
                  <select 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 appearance-none shadow-sm"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="League">Bergerov Sistem (Liga)</option>
                    <option value="Knockout">Knockout (Eliminacije)</option>
                    <option value="Groups">Grupni Sistem + Knockout</option>
                  </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-700 transition-all"
                >
                  Odustani
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                >
                  Kreiraj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  </DashboardLayout>
);
};

export default Competitions;