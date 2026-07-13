import { useAuth } from '../context/AuthContext';
import { useTheme } from '../themes/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Trophy, Settings, LogOut, Menu, X, Shield, ChevronLeft, ChevronRight, User, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

const DashboardLayout = ({ children, title }) => {
  const { user, userData, loading, isSuperAdmin, logout } = useAuth();
  const { isDark, toggleDarkMode } = useTheme();
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
    { icon: <User size={20} />, label: 'Moj profil', href: '/admin/profile' },
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: <Trophy size={20} />, label: 'Turniri', href: '/admin/competitions' },
    { icon: <Trophy size={20} className="text-emerald-500" />, label: 'Lige (Berger)', href: '/admin/leagues' },
    { icon: <Users size={20} />, label: 'Igrači', href: '/admin/players' },
    { icon: <Settings size={20} />, label: 'Postavke', href: '/admin/settings' },
    ...(isSuperAdmin ? [
      { icon: <Shield size={20} className="text-yellow-500" />, label: 'Super Admin', href: '/admin/super-admin' }
    ] : []),
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="admin-dark flex flex-col h-screen bg-[#070b14] text-slate-300 transition-colors duration-300 dark overflow-hidden">
      {/* Top Navbar */}
      <header className="h-20 bg-slate-950 border-b border-slate-900 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
              <Trophy size={20} className="text-black" />
            </div>
            <div className="hidden sm:block overflow-hidden whitespace-nowrap">
              <div className="text-2xl font-black text-white tracking-tighter italic leading-none">TENIS.BA</div>
              <div className="text-[10px] text-amber-500/60 font-black uppercase tracking-[0.2em] mt-1">ADMIN PANEL</div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link 
                to={item.href}
                key={item.href}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all ${
                  window.location.pathname === item.href 
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <span className={`transition-transform ${window.location.pathname === item.href ? 'text-black' : ''}`}>{item.icon}</span>
                <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent"
          >
            <LogOut size={18} />
            <span className="hidden sm:block text-[11px] font-black uppercase tracking-widest">Odjava</span>
          </button>
          
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-amber-400 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[55] lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer (Sidebar) */}
      <aside className={`
        fixed inset-y-0 left-0 z-[60] w-72 bg-slate-950 border-r border-slate-900 shadow-2xl transition-all duration-300 lg:hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col relative">
          <button 
            onClick={() => setSidebarOpen(false)}
            className="absolute top-6 right-6 p-2 text-slate-300 hover:text-white z-50 rounded-xl bg-slate-900 border border-slate-700"
          >
            <X size={20} />
          </button>

          <div className="p-8">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shrink-0">
                <Trophy size={20} className="text-black" />
              </div>
              <div>
                <div className="text-2xl font-black text-white italic tracking-tighter">TENIS.BA</div>
              </div>
            </div>
            
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link 
                  to={item.href}
                  key={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-[20px] transition-all ${
                    window.location.pathname === item.href 
                      ? 'bg-amber-500 text-black' 
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  {item.icon}
                  <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-10">
        <div className="max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
