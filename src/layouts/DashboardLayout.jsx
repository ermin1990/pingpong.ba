import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Trophy, Settings, LogOut, Menu, X, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth } from '../firebase/config';

const DashboardLayout = ({ children, title }) => {
  const { user, userData, loading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (userData?.role === 'unauthorized') {
        navigate('/unauthorized');
      } else if (!user) {
        navigate('/');
      }
    }
  }, [user, userData, loading, navigate]);

  if (loading || !user) return <div className="p-8 text-center text-gray-500">Učitavanje...</div>;

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', href: '/dashboard' },
    { icon: <Trophy size={20} />, label: 'Takmičenja', href: '/competitions' },
    { icon: <Users size={20} />, label: 'Igrači', href: '/players' },
    ...(isSuperAdmin ? [
      { icon: <Shield size={20} className="text-yellow-500" />, label: 'Super Admin', href: '/super-admin' }
    ] : []),
    { icon: <Settings size={20} />, label: 'Postavke', href: '/settings' },
  ];

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-[#070b14] text-slate-200">
      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2.5 bg-slate-900 border border-slate-800 rounded-xl lg:hidden text-slate-400"
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-900 transition-transform duration-300 lg:translate-x-0 lg:static
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Trophy size={18} className="text-white" />
            </div>
            <div>
              <div className="text-xl font-bold text-white tracking-tight">TEAMSPHERE</div>
              <div className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Tournament Manager</div>
            </div>
          </div>
          
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link 
                to={item.href}
                key={item.href}
                className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-all"
              >
                <span className="text-slate-500">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-6 border-t border-slate-900">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Odjava</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
          <div className="flex items-center gap-4 bg-slate-900/50 p-2 pl-4 rounded-full border border-slate-800">
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none">{userData?.role === 'super_admin' ? 'Super Admin' : 'Administrator'}</div>
              <div className="text-xs text-slate-300 font-medium">{user.email}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-blue-400 border border-slate-700">
              {user.email.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
