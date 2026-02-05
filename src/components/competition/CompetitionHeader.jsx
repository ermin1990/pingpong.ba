import { Edit2, Search, X, List, Users, Settings, Calendar, MapPin } from 'lucide-react';
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
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900/50 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              {competition?.name || 'Takmičenje'}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Upravljačka tabla
              </p>
              {(competition?.startDate || competition?.endDate) && (
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <Calendar size={12} className="text-slate-400" />
                  {competition.startDate ? new Date(competition.startDate).toLocaleDateString('de-DE') : '...'} 
                  {competition.endDate && ` - ${new Date(competition.endDate).toLocaleDateString('de-DE')}`}
                </div>
              )}
              {competition?.location && (
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <MapPin size={12} className="text-slate-400" />
                  {competition.location}
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={() => navigate(`/admin/competitions/${competition?.id}/settings`)}
            className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-sm"
          >
            <Settings size={16} className="text-blue-600 dark:text-blue-400" /> 
            <span>Postavke</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      {!categoriesLoading && !activeCategory && activeTab !== 'categories' ? (
        <div className="text-center py-20">
          <div className="bg-red-50 dark:bg-red-500/10 inline-block p-6 rounded-lg border border-red-200 dark:border-red-500/20 mb-4">
            <h3 className="text-slate-900 dark:text-white font-bold">Kategorija nije pronađena</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Izabrana kategorija ne postoji ili je obrisana.</p>
          </div>
          <br />
          <button 
            onClick={() => setActiveTab('categories')} 
            className="text-blue-600 dark:text-blue-400 font-bold text-xs hover:underline"
          >
            ← Nazad na pregled kategorija
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto mb-8 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700 backdrop-blur-sm w-fit min-w-min">
            <button 
              onClick={() => setActiveTab('categories')}
              className={`px-5 py-2.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'categories' ? 'bg-amber-400 text-slate-900 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              Kategorije
            </button>

            <button 
              onClick={() => setActiveTab('all-matches')}
              className={`px-5 py-2.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'all-matches' ? 'bg-amber-400 text-slate-900 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <List size={14} /> Svi Mečevi
            </button>

            <button 
              onClick={() => setActiveTab('all-players')}
              className={`px-5 py-2.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'all-players' ? 'bg-amber-400 text-slate-900 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <Users size={14} /> Svi Igrači
            </button>
            
            {activeCategory && (
              <>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>
                
                <button 
                  onClick={() => setActiveTab('players')}
                  className={`px-5 py-2.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'players' ? 'bg-amber-400 text-slate-900 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  Igrači
                </button>

                <button 
                  onClick={() => setActiveTab('matches')}
                  className={`px-5 py-2.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'matches' ? 'bg-amber-400 text-slate-900 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  Raspored
                </button>

                <button 
                  onClick={() => setActiveTab('knockout')}
                  className={`px-5 py-2.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'knockout' ? 'bg-amber-400 text-slate-900 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  Eliminacije
                </button>

                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`px-5 py-2.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'settings' ? 'bg-amber-400 text-slate-900 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
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
