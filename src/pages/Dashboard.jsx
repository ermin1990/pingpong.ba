import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { Trophy, Users, Activity, ExternalLink, Plus, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-[24px] shadow-sm hover:border-amber-500/50 transition-all group">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 group-hover:bg-amber-500/10 group-hover:border-amber-500/20 transition-all">
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
    <div className="text-3xl font-black text-white tracking-tighter italic">{value}</div>
    <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">{label}</div>
  </div>
);

const Dashboard = () => {
  const { userData, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ players: 0, competitions: 0, activeMatches: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userData || !user) return;

      try {
        let playersQ, compsQ;
        
        if (userData.role === 'super_admin') {
          playersQ = query(collection(db, "players"));
          compsQ = query(collection(db, "competitions"));
        } else {
          playersQ = query(collection(db, "players"), where("ownerUid", "==", user.uid));
          compsQ = query(collection(db, "competitions"), where("ownerUid", "==", user.uid));
        }
        
        const [playersSnap, compsSnap] = await Promise.all([
          getDocs(playersQ),
          getDocs(compsQ)
        ]);

        setStats({
          players: playersSnap.size,
          competitions: compsSnap.size,
          activeMatches: 0
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userData]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase">Kontrolna Tabla</h1>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-1">
              Prijavljeni ste kao: <span className="text-amber-500 font-black">{userData?.role === 'super_admin' ? 'Super Admin' : 'Organizator'}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/admin/leagues')}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all border border-slate-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Liga
            </button>
            <button 
              onClick={() => navigate('/admin/competitions')}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Takmičenje
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            label="Ukupno Igrača" 
            value={stats.players} 
            icon={Users} 
            color="text-blue-500" 
          />
          <StatCard 
            label="Aktivna Takmičenja" 
            value={stats.competitions} 
            icon={Trophy} 
            color="text-amber-500" 
          />
          <StatCard 
            label="Sistemski Status" 
            value="Online" 
            icon={Activity} 
            color="text-emerald-500" 
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#0f172a] border border-slate-800 rounded-[32px] overflow-hidden shadow-sm">
              <div className="p-8 border-b border-slate-800 bg-slate-900/20">
                <h3 className="font-black text-white uppercase tracking-widest text-xs italic">Brze Akcije</h3>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                  onClick={() => navigate('/admin/competitions')}
                  className="flex items-center gap-4 p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 transition-all group"
                >
                  <div className="p-4 rounded-xl bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-all">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-white text-[11px] uppercase tracking-widest">Pregled Turnira</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-1">Upravljajte listama i žrijebom</p>
                  </div>
                </button>

                <button 
                  onClick={() => navigate('/admin/players')}
                  className="flex items-center gap-4 p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all group"
                >
                  <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-white text-[11px] uppercase tracking-widest">Registar Igrača</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-1">Dodajte učesnike u bazu</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-[32px] flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border border-amber-500/20">
              <ExternalLink className="text-amber-500 w-10 h-10" />
            </div>
            <h3 className="font-black text-white uppercase tracking-tighter italic text-xl mb-2">Javni Profil</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-6">Prikažite svoje rezultate svijetu</p>
            <button 
              onClick={() => window.open('/public', '_blank')}
              className="w-full py-4 bg-slate-950 border border-slate-800 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all"
            >
              Otvori Javni Pregled
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
