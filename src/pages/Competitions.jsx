import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, or } from 'firebase/firestore';
import { Trophy, Plus, Calendar, Target, ChevronRight, ExternalLink, MapPin, X, Trash2 } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';

const Competitions = () => {
  const { user, userData, planDetails, isSuperAdmin } = useAuth(); // Import user, planDetails and isSuperAdmin
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user) return; // Use user instead of userData for auth check

    let q;
    const userRole = userData?.role;
    
    if (userRole === 'super_admin') {
      q = query(collection(db, "competitions"));
    } else {
      const filters = [];
      // Use user.uid for owner check immediately
      if (user.uid) {
        filters.push(where("ownerUid", "==", user.uid));
      }
      // Only check collaborators if we have email
      if (user.email) {
        filters.push(where("collaborators", "array-contains", user.email));
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
      let list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Filtriraj da ne prikazuje Lige na ovoj stranici
      list = list.filter(comp => comp.type !== 'League');
      
      setCompetitions(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userData]); // Added user dependency

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!userData || !user) {
      alert("Profil se još uvijek učitava. Molimo sačekajte.");
      return;
    }

    // Check plan limits (super_admin has no limits)
    if (!isSuperAdmin && planDetails) {
      try {
        const { getDocs, query, collection, where } = await import('firebase/firestore');
        const countQ = query(collection(db, "competitions"), where("ownerUid", "==", user.uid));
        const countSnap = await getDocs(countQ);
        const totalCount = countSnap.size;
        
        const limit = planDetails.tournamentsLimit || 0;
        
        if (totalCount >= limit) {
          alert(`Dostigli ste limit vašeg plana (${limit} turnira/liga ukupno). Molimo zatražite nadogradnju na profilu.`);
          return;
        }
      } catch (err) {
        console.error("Greška pri provjeri limita:", err);
      }
    }

    try {
      const docRef = await addDoc(collection(db, "competitions"), {
        name,
        sport,
        type: type === 'League' ? 'Knockout' : type,
        status: 'draft',
        ownerUid: user.uid,
        ownerName: userData.displayName || userData.name || userData.email || 'Admin',
        ownerEmail: userData.email || user.email || '',
        createdAt: serverTimestamp(),
        participantsCount: 0,
        startDate: startDate || null,
        endDate: endDate || null,
        location: location || '',
        defaultSettings: {
          setsToWin: Number(setsToWin),
          winPoints: Number(winPoints),
          lossPoints: Number(lossPoints),
          advancingPlayers: Number(advancingPlayers)
        }
      });
      setShowModal(false);
      setName('');
      setStartDate('');
      setEndDate('');
      setLocation('');
      navigate(`/admin/competitions/${docRef.id}`);
    } catch (err) {
      console.error("Greška:", err);
      alert(`Greška: ${err.message}`);
    }
  };

  return (
    <DashboardLayout title="Turniri">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white uppercase italic tracking-tight">Moji Turniri</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide">Upravljajte svojim sportskim događajima</p>
          </div>
          <button 
            onClick={() => navigate('/admin/competitions/new')}
            className="w-full md:w-auto bg-amber-400 hover:bg-amber-500 text-black px-6 py-4 rounded-xl font-semibold uppercase text-xs tracking-wide transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Novi Turnir
          </button>
        </div>

      {loading ? (
        <div className="text-center py-20 flex flex-col items-center">
           <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
           <p className="text-xs text-slate-500 font-medium">Učitavanje podataka...</p>
        </div>
      ) : competitions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-dashed rounded-lg p-20 text-center">
          <Trophy size={48} className="text-slate-200 dark:text-slate-800 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Nema aktivnih turnira</h3>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm">Kreirajte svoj prvi turnir i započnite sa upravljanjem.</p>
          <button 
            onClick={() => navigate('/admin/competitions/new')}
            className="bg-amber-400 hover:bg-amber-500 text-black px-8 py-3 rounded-xl font-bold text-sm transition-all"
          >
            Kreiraj Turnir
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitions.map(comp => (
              <div 
                key={comp.id} 
                className={`p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col shadow-sm hover:shadow-xl transition-all ${
                  comp.status === 'active' 
                    ? 'bg-amber-400 border-amber-500 shadow-amber-500/20 z-10' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className={`font-semibold uppercase tracking-tight text-lg ${comp.status === 'active' ? 'text-black' : 'text-slate-900 dark:text-white'}`}>{comp.name}</h3>
                  <div className={`flex items-center gap-1.5 p-1 rounded-lg border ${comp.status === 'active' ? 'bg-black/10 border-black/10' : 'bg-slate-50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800'}`}>
                    {comp.slug && (
                      <a 
                        href={`/p/${comp.slug}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`p-1.5 rounded transition-all ${comp.status === 'active' ? 'text-black/70 hover:bg-black/10' : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-slate-800'}`}
                        title="Otvori javni link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide ${comp.status === 'active' ? 'bg-black/20 text-black' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                      {comp.status === 'active' ? 'Aktivan' : 'Draft'}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-medium uppercase tracking-wide ${comp.status === 'active' ? 'text-black/70' : 'text-slate-500'}`}>{comp.type === 'Groups' ? 'Turnir' : 'Takmičenje'}</span>
                  <span className={`text-xs font-medium uppercase tracking-wide ${comp.status === 'active' ? 'text-black' : 'text-blue-600'}`}>{comp.participantsCount || 0} Igrača</span>
                </div>

                <div className="mt-4 pt-4 border-t border-black/10 flex justify-between items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); /* handleDelete would go here */ }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium uppercase tracking-wide transition-all ${comp.status === 'active' ? 'bg-black/10 text-black hover:bg-black/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
                  >
                    <Trash2 size={12} />
                  </button>
                  <Link 
                    to={`/admin/competitions/${comp.id}`} 
                    className={`flex-1 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
                      comp.status === 'active' 
                        ? 'bg-slate-900 text-white hover:bg-slate-800' 
                        : 'bg-amber-400 text-black hover:bg-amber-500 shadow-amber-500/20'
                    }`}
                  >
                    Upravljaj <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
          ))}
        </div>
      )}
    </div>
  </DashboardLayout>
);
};

export default Competitions;