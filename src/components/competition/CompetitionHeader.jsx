import { Edit2, Search, X, List, Users, Settings, Calendar, MapPin, Shield, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CompetitionHeader = ({ 
  competition, 
  activeTab, 
  setActiveTab, 
  categoriesLoading, 
  activeCategory,
  categories
}) => {
  const navigate = useNavigate();
  return (
    <>
      {/* Competition Header Bar with Settings */}
      <div className="mb-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-[32px] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none italic">
              {competition?.name || 'Takmičenje'}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="bg-blue-600 text-[10px] text-white px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">
                Upravljačka tabla
              </span>
              {(competition?.startDate || competition?.endDate) && (
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  <Calendar size={12} className="text-blue-500" />
                  {competition.startDate ? new Date(competition.startDate).toLocaleDateString('de-DE') : '...'} 
                </div>
              )}
              {competition?.location && (
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  <MapPin size={12} className="text-blue-500" />
                  {competition.location}
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={() => navigate(`/admin/competitions/${competition?.id}/settings`)}
            className="w-full sm:w-auto bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Settings size={14} className="text-blue-500" /> 
            <span>Postavke</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      {!categoriesLoading && !activeCategory && !['categories', 'all-matches', 'all-players', 'referees', 'tables'].includes(activeTab) ? (
        <div className="text-center py-20 bg-slate-950 rounded-[40px] border border-slate-900">
          <div className="bg-red-500/10 inline-block p-8 rounded-[32px] border border-red-500/20 mb-6">
            <h3 className="text-white font-black uppercase italic tracking-tighter text-xl mb-2">Kategorija nije pronađena</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Izabrana kategorija ne postoji ili je obrisana.</p>
          </div>
          <br />
          <button 
            onClick={() => setActiveTab('categories')} 
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20"
          >
            ← Nazad na kategorije
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto mb-8 -mx-4 px-4 scrollbar-hide">
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 p-1.5 rounded-[24px] border border-slate-200 dark:border-slate-900 shadow-sm w-fit min-w-full sm:min-w-min overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('categories')}
              className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'categories' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 dark:text-gray-500 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
            >
              Kategorije
            </button>

            <button 
              onClick={() => setActiveTab('all-matches')}
              className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'all-matches' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 dark:text-gray-500 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
            >
              <List size={14} /> Svi Mečevi
            </button>

            <button 
              onClick={() => setActiveTab('all-players')}
              className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'all-players' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 dark:text-gray-500 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
            >
              <Users size={14} /> Svi Igrači
            </button>

            <button 
              onClick={() => setActiveTab('tables')}
              className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'tables' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 dark:text-gray-500 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
            >
              <LayoutGrid size={14} /> Stolovi
            </button>

            <button 
              onClick={() => setActiveTab('referees')}
              className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'referees' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 dark:text-gray-500 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
            >
              <Shield size={14} /> Sudije
            </button>
            
            {activeCategory && (
              <>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1.5 hidden sm:block"></div>
                
                <button 
                  onClick={() => setActiveTab('players')}
                  className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'players' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 dark:text-gray-500 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
                >
                  Igrači
                </button>

                <button 
                  onClick={() => setActiveTab('matches')}
                  className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'matches' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 dark:text-gray-500 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
                >
                  Raspored
                </button>

                <button 
                  onClick={() => setActiveTab('knockout')}
                  className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'knockout' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 dark:text-gray-500 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
                >
                  Eliminacije
                </button>

                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 dark:text-gray-500 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
                >
                  Postavke
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CompetitionHeader;
