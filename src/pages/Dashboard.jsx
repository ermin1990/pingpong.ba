import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { Trophy, Users, Activity, ExternalLink, Plus, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm hover:border-slate-700 transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
    <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
    <div className="text-slate-400 text-sm font-medium">{label}</div>
  </div>
);

const Dashboard = () => {
  const { userData, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ players: 0, competitions: 0, activeMatches: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userData) return;
      if (!userData.organizationId && userData.role !== 'super_admin') return;

      try {
        let playersQ, compsQ;
        
        if (userData.role === 'super_admin') {
          playersQ = query(collection(db, "players"));
          compsQ = query(collection(db, "competitions"));
        } else {
          playersQ = query(collection(db, "players"), where("organizationId", "==", userData.organizationId));
          compsQ = query(collection(db, "competitions"), where("organizationId", "==", userData.organizationId));
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
            <h1 className="text-2xl font-bold text-white tracking-tight">Kontrolna Tabla</h1>
            <p className="text-slate-500 text-sm mt-1">
              Prijavljeni ste kao: <span className="text-blue-400 font-semibold">{userData?.role === 'super_admin' ? 'Super Admin' : 'Organizator'}</span>
            </p>
          </div>
          <button 
            onClick={() => navigate('/competitions')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Takmičenje
          </button>
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
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                <h3 className="font-bold text-white">Brze Akcije</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => navigate('/competitions')}
                  className="flex items-center gap-4 p-5 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-all group"
                >
                  <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-white text-sm">Pregled Turnira</p>
                    <p className="text-xs text-slate-500">Upravljajte listama i žrijebom</p>
                  </div>
                </button>

                <button 
                  onClick={() => navigate('/players')}
                  className="flex items-center gap-4 p-5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all group"
                >
                  <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-white text-sm">Registar Igrača</p>
                    <p className="text-xs text-slate-500">Dodajte nove učesnike u bazu</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
              <ExternalLink className="text-blue-500 w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Javni Prikaz</h3>
            <p className="text-slate-400 mb-8 text-sm">Podijelite link sa učesnicima kako bi uživo pratili rezultate i žrijeb.</p>
            <button 
              onClick={() => {
                const url = `${window.location.origin}/public-live-score`;
                navigator.clipboard.writeText(url);
                alert('Javni link je kopiran!');
              }}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
            >
              Kopiraj Public Link
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
