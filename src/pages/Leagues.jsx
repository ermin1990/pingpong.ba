import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Trophy, Plus, Calendar, Target, ChevronRight, ExternalLink, List, Settings, Info, Users } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';

const Leagues = () => {
  const { user, userData, planDetails, isSuperAdmin } = useAuth(); // Add user, planDetails and isSuperAdmin
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // New League State
  const [name, setName] = useState('');
  const [sport, setSport] = useState('Table Tennis');
  const [pointsWin, setPointsWin] = useState(2);
  const [pointsDraw, setPointsDraw] = useState(1);
  const [pointsLoss, setPointsLoss] = useState(0);

  useEffect(() => {
    if (!user) return; // Wait for user auth

    let q;
    const baseQuery = query(collection(db, "competitions"), where("type", "==", "League"));
    const userRole = userData?.role;

    if (userRole === 'super_admin') {
      q = baseQuery;
    } else {
      // Just fetch all leagues and filter on client to avoid composite index issues for now
      // This is safer than the previous logic which depended on userData.uid being ready
      q = query(collection(db, "competitions"), where("type", "==", "League"));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter by ownership if not super admin
      if (userRole !== 'super_admin') {
        const uid = user.uid;
        const email = user.email;
        list = list.filter(item => 
          item.ownerUid === uid || 
          (email && item.collaborators?.includes(email))
        );
      }

      setLeagues(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userData]); // Added user dependency

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
      await addDoc(collection(db, "competitions"), {
        name,
        sport,
        type: 'League',
        status: 'draft',
        ownerUid: user.uid,
        ownerName: userData?.displayName || userData?.name || user.email || 'Admin',
        ownerEmail: user.email,
        createdAt: serverTimestamp(),
        participantsCount: 0,
        settings: {
          pointsWin,
          pointsDraw,
          pointsLoss
        }
      });
      setShowModal(false);
      setName('');
    } catch (err) {
      console.error("Greška:", err);
      alert(`Greška: ${err.message}`);
    }
  };

  return (
    <DashboardLayout title="Lige (Bergerov sistem)">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Upravljanje Ligama</h2>
            <p className="text-slate-500 text-sm">Ukupno {leagues.length} registrovanih liga (Bergerov sistem).</p>
          </div>
          
          <button 
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Liga
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : leagues.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <Trophy className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-300">Nema kreiranih liga</h3>
            <p className="text-slate-500 mt-2 max-w-xs mx-auto text-sm">
              Kliknite na dugme "Nova Liga" da biste kreirali svoje prvo takmičenje po Bergerovom sistemu.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leagues.map((league) => (
              <Link 
                key={league.id} 
                to={`/admin/leagues/${league.id}`}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-emerald-500 transition-all shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 dark:shadow-none dark:hover:shadow-emerald-500/5"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-500 group-hover:scale-110 transition-transform">
                    <List className="w-6 h-6" />
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    league.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-100 dark:border-emerald-500/20' : 
                    league.status === 'completed' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 border border-blue-100 dark:border-blue-500/20' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}>
                    {league.status === 'active' ? 'Aktivno' : league.status === 'completed' ? 'Završeno' : 'U pripremi'}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {league.name}
                </h3>
                
                <div className="flex flex-wrap gap-y-2 gap-x-4 mt-4">
                  <div className="flex items-center text-slate-600 dark:text-slate-400 text-xs font-medium">
                    <Target className="w-3.5 h-3.5 mr-1.5 text-slate-400 dark:text-slate-500" />
                    {league.sport}
                  </div>
                  <div className="flex items-center text-slate-600 dark:text-slate-400 text-xs font-medium">
                    <Users className="w-3.5 h-3.5 mr-1.5 text-slate-400 dark:text-slate-500" />
                    {league.participantsCount || 0} igrača
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    ID: {league.id.substring(0, 8)}...
                  </span>
                  <div className="flex items-center text-emerald-600 dark:text-emerald-500 text-xs font-bold group-hover:translate-x-1 transition-transform">
                    Upravljaj <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl transition-all">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Nova Liga (Berger)</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
              
              <form onSubmit={handleCreate} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Naziv Lige</label>
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
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sport</label>
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

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Bodova (Pob)</label>
                    <input
                      type="number"
                      value={pointsWin}
                      onChange={(e) => setPointsWin(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Bodova (Ner)</label>
                    <input
                      type="number"
                      value={pointsDraw}
                      onChange={(e) => setPointsDraw(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Bodova (Por)</label>
                    <input
                      type="number"
                      value={pointsLoss}
                      onChange={(e) => setPointsLoss(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-2xl flex gap-3">
                  <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-50 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    Ova opcija kreira takmičenje po sistemu "svako sa svakim". Moći ćete naknadno dodavati kola i unositi rezultate.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/25 active:scale-[0.98]"
                >
                  Kreiraj Ligu
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Leagues;
