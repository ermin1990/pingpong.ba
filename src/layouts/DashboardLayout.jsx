import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Trophy, Settings, LogOut, Menu, X, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth } from '../firebase/config';

const DashboardLayout = ({ children, title }) => {
  const { user, userData, loading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

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

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', newState);
  };

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
        fixed inset-y-0 left-0 z-40 bg-slate-950 border-r border-slate-900 transition-all duration-300 lg:static
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64 w-64'}
      `}>
        <div className="h-full flex flex-col relative">
          {/* Collapse Toggle Desktop */}
          <button 
            onClick={toggleSidebar}
            className="hidden lg:flex absolute -right-3 top-10 w-6 h-6 bg-blue-600 rounded-full items-center justify-center text-white border border-slate-900 hover:bg-blue-500 transition-all z-50 shadow-lg"
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <div className={`p-6 ${isSidebarCollapsed ? 'flex flex-col items-center px-0 pt-4' : ''}`}>
            <div className={`flex items-center gap-3 mb-10 ${isSidebarCollapsed ? 'justify-center mx-0 mb-8' : 'px-2'}`}>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <Trophy size={18} className="text-white" />
              </div>
              {!isSidebarCollapsed && (
                <div className="overflow-hidden whitespace-nowrap">
                  <div className="text-xl font-bold text-white tracking-tight">TEAMSPHERE</div>
                  <div className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Tournament Manager</div>
                </div>
              )}
            </div>
            
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link 
                  to={item.href}
                  key={item.href}
                  title={isSidebarCollapsed ? item.label : ''}
                  className={`flex items-center gap-3 py-3 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-all ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'}`}
                >
                  <span className={`${isSidebarCollapsed ? '' : 'text-slate-500'}`}>{item.icon}</span>
                  {!isSidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              ))}
            </nav>
          </div>

          <div className={`mt-auto p-6 border-t border-slate-900 ${isSidebarCollapsed ? 'px-0 flex justify-center' : ''}`}>
            <button 
              onClick={handleLogout}
              title={isSidebarCollapsed ? 'Odjava' : ''}
              className={`flex items-center gap-3 w-full py-3 text-slate-500 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'}`}
            >
              <LogOut size={20} className="shrink-0" />
              {!isSidebarCollapsed && <span className="text-sm font-medium">Odjava</span>}
            </button>
          </div>
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
