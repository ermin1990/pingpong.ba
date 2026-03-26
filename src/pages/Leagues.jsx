import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Trophy, Plus, Calendar, Target, ChevronRight, ExternalLink, List, Settings, Info, Users, Trash2 } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';

const Leagues = () => {
  const { user, userData, planDetails, isSuperAdmin } = useAuth(); // Add user, planDetails and isSuperAdmin
  const navigate = useNavigate();
  const location = useLocation();
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // New League State
  const [name, setName] = useState('');
  const [sport, setSport] = useState('Table Tennis');
  const [type, setType] = useState('league'); // Add 'type' state
  const [pointsWin, setPointsWin] = useState(2);
  const [pointsDraw, setPointsDraw] = useState(1);
  const [pointsLoss, setPointsLoss] = useState(0);
  const viewingSeasons = location.pathname.startsWith('/admin/seasons');

  useEffect(() => {
    setType(viewingSeasons ? 'league_season' : 'league');
  }, [viewingSeasons]);

  useEffect(() => {
    if (!user) return; // Wait for user auth

    let q;
    const baseQuery = query(collection(db, "competitions"));
    const userRole = userData?.role;

    if (userRole === 'super_admin') {
      q = baseQuery;
    } else {
      q = baseQuery; // We will filter on client side
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // NOVO: Na listi liga prikazujemo samo "roditelje" (krovna takmičenja)
      list = list.filter(item => {
        if (item.parentLeagueId) return false;
        return viewingSeasons ? item.type === 'league_season' : item.type === 'League';
      });

      // Filter by ownership if not super admin
      if (userRole !== 'super_admin') {
        const uid = user.uid;
        const email = user.email;
        list = list.filter(item => 
          item.ownerUid === uid || 
          (email && item.collaborators?.includes(email))
        );
      }

      // NOVO: Pobrini se da se vide i lige koje su kreirane preko skripte (bez ownerUid) ako je super_admin
      // To je već pokriveno gore s userRole === 'super_admin', ali dodat ćemo logging
      console.log("Leagues found:", list.length);
      
      setLeagues(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userData, viewingSeasons]); // Added user dependency

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!user) {
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
      const isSeason = type === 'league_season';
      await addDoc(collection(db, "competitions"), {
        name,
        sport,
        type: isSeason ? 'league_season' : 'League',
        status: 'draft',
        ownerUid: user.uid,
        ownerName: userData?.displayName || userData?.name || user.email || 'Admin',
        ownerEmail: user.email,
        createdAt: serverTimestamp(),
        participantsCount: 0,
        settings: {
          pointsWin: isSeason ? 0 : pointsWin,
          pointsDraw: isSeason ? 0 : pointsDraw,
          pointsLoss: isSeason ? 0 : pointsLoss
        },
        pointsSystem: isSeason ? {
          winInGroup: 5,
          winAfterGroup: 5,
          bonusPoints: { 1: 15, 2: 12, 3: 10, "9-16": 2 }
        } : null
      });
      setShowModal(false);
      setName('');
      setType(viewingSeasons ? 'league_season' : 'league');
    } catch (err) {
      console.error("Greška:", err);
      alert(`Greška: ${err.message}`);
    }
  };

  return (
    <DashboardLayout title={viewingSeasons ? "Amaterske Lige" : "Lige (Bergerov sistem)"}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {viewingSeasons ? 'Upravljanje Amaterskim Ligama' : 'Upravljanje Ligama'}
            </h2>
            <p className="text-slate-500 text-sm">
              Ukupno {leagues.length} {viewingSeasons ? 'registrovanih sezona.' : 'registrovanih liga (Bergerov sistem).'}
            </p>
          </div>
          
          <button 
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {viewingSeasons ? 'Nova Sezona' : 'Nova Liga'}
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : leagues.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
            <Trophy className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-300">
              {viewingSeasons ? 'Nema kreiranih sezona' : 'Nema kreiranih liga'}
            </h3>
            <p className="text-slate-500 mt-2 max-w-xs mx-auto text-sm">
              Kliknite na dugme "Nova Liga" da biste kreirali svoje prvo takmičenje po Bergerovom sistemu.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leagues.map((league) => (
              <div 
                key={league.id} 
                className={`p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col shadow-sm hover:shadow-xl transition-all ${
                  league.status === 'active' 
                    ? 'bg-blue-600 border-blue-400 shadow-blue-500/20 z-10' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className={`font-semibold uppercase tracking-tight text-lg ${league.status === 'active' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{league.name}</h3>
                  <div className={`flex items-center gap-1.5 p-1 rounded-lg border ${league.status === 'active' ? 'bg-white/10 border-white/10' : 'bg-slate-50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800'}`}>
                    {league.slug && (
                      <a 
                        href={`/p/${league.slug}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`p-1.5 rounded transition-all ${league.status === 'active' ? 'text-blue-200 hover:bg-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800'}`}
                        title="Otvori javni link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide ${league.status === 'active' ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                      {league.status === 'active' ? 'Aktivan' : 'U pripremi'}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-medium uppercase tracking-wide ${league.status === 'active' ? 'text-blue-100' : 'text-slate-500'}`}>Liga</span>
                  <span className={`text-xs font-medium uppercase tracking-wide ${league.status === 'active' ? 'text-white' : 'text-blue-600'}`}>{league.participantsCount || 0} Igrača</span>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); /* handleDeleteLeague is not defined in the scope but maybe it should be */ }}
                    className="px-3 py-1.5 bg-red-500/20 text-red-100 hover:bg-red-500/40 rounded-xl text-xs font-medium uppercase tracking-wide transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                  <Link 
                    to={league.type === 'league_season' ? `/admin/seasons/${league.id}` : `/admin/leagues/${league.id}`}
                    className={`flex-1 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
                      league.status === 'active' 
                        ? 'bg-white text-blue-600 hover:bg-blue-50' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    Upravljaj <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg w-full max-w-md overflow-hidden shadow-2xl transition-all">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {viewingSeasons ? 'Nova Amaterska Liga' : 'Nova Liga (Berger)'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
              
              <form onSubmit={handleCreate} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Naziv</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="npr. Prva Liga Kantona"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Sport</label>
                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium appearance-none"
                  >
                    <option value="Table Tennis">Stoni Tenis</option>
                    <option value="Tennis">Tenis</option>
                    <option value="Padel">Padel</option>
                    <option value="Badminton">Badminton</option>
                    <option value="Other">Ostalo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Tip</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium appearance-none"
                  >
                    <option value="league">Klasicna liga</option>
                    <option value="league_season">Amaterska liga sezona</option>
                  </select>
                </div>

                <div className={`grid grid-cols-3 gap-3 animate-in fade-in duration-300 ${type === 'league_season' ? 'opacity-50' : ''}`}>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 px-1 text-center">Pobjeda</label>
                    <input
                      disabled={type === 'league_season'}
                      type="number"
                      value={pointsWin}
                      onChange={(e) => setPointsWin(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-medium text-center disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 px-1 text-center">Neriješeno</label>
                    <input
                      disabled={type === 'league_season'}
                      type="number"
                      value={pointsDraw}
                      onChange={(e) => setPointsDraw(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-medium text-center disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 px-1 text-center">Poraz</label>
                    <input
                      disabled={type === 'league_season'}
                      type="number"
                      value={pointsLoss}
                      onChange={(e) => setPointsLoss(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-medium text-center disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                  >
                    Kreiraj Ligu <ChevronRight size={18} />
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

export default Leagues;
