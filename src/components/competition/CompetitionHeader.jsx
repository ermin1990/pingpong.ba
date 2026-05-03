import { List, Users, Settings, Calendar, MapPin, Shield, LayoutGrid, FileText, ArrowLeft, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CompetitionHeader = ({ 
  competition, 
  activeTab, 
  setActiveTab, 
  categoriesLoading, 
  activeCategory,
  categories,
  onShowExport
}) => {
  const navigate = useNavigate();
  const participantCount = activeCategory?.playerIds?.length || 0;
  const showMatchesTab = activeCategory?.format !== 'direct_knockout';
  const formatLabel = activeCategory?.format === 'groups_knockout'
    ? 'Grupe + Knockout'
    : activeCategory?.format === 'round_robin'
      ? 'Liga'
      : (competition?.type || 'Individualno');

  const startDateLabel = competition?.startDate
    ? new Date(competition.startDate).toLocaleDateString('bs-BA', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Nije postavljen';
  const categoryStateLabel = activeCategory?.status === 'completed' ? 'Završeno' : activeCategory?.status === 'ongoing' ? 'U toku' : 'Draft';

  return (
    <>
      <div className="mb-5 space-y-4">
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800/90 backdrop-blur-xl rounded-[24px] p-4 sm:p-5 border border-slate-700/70 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                {competition?.name || 'Takmičenje'}
              </h1>
              <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-300">
                {(competition?.startDate || competition?.endDate) && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={13} className="text-sky-400" />
                    {competition.startDate ? new Date(competition.startDate).toLocaleDateString('bs-BA') : '...'}
                  </span>
                )}
                {competition?.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={13} className="text-cyan-400" />
                    {competition.location}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-400/25 text-[11px] font-semibold">
                {categoryStateLabel}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-200 border border-sky-400/25 text-[11px] font-semibold">
                Turnir
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => navigate(`/admin/competitions/${competition?.id}/settings`)}
                className="inline-flex items-center px-3 py-2 sm:px-3.5 sm:py-2.5 bg-white/8 hover:bg-white/14 text-slate-50 rounded-xl border border-white/12 transition-colors font-semibold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              >
                <Settings className="w-4 h-4 mr-2" />
                Postavke
              </button>

              <button
                onClick={() => navigate('/admin/competitions')}
                className="inline-flex items-center px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-950/40 hover:bg-slate-950/55 text-slate-100 rounded-xl border border-slate-600/70 transition-colors font-semibold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Nazad na Organizaciju
              </button>

              <button
                onClick={onShowExport}
                className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl border border-sky-500 transition-colors font-semibold text-sm shadow-md shadow-sky-950/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF Izvjestaj
              </button>
            </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-1">
          <div className="bg-slate-900/65 backdrop-blur-xl rounded-[18px] p-3 border border-slate-700/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-[11px] uppercase">Sport</p>
                <p className="text-white text-sm sm:text-base font-bold mt-1">{competition?.sport || 'Stoni Tenis'}</p>
              </div>
              <div className="w-8 h-8 bg-sky-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-sky-300" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/65 backdrop-blur-xl rounded-[18px] p-3 border border-slate-700/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-[11px] uppercase">Učesnici</p>
                <p className="text-white text-sm sm:text-base font-bold mt-1">{participantCount}</p>
              </div>
              <div className="w-8 h-8 bg-emerald-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-emerald-300" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/65 backdrop-blur-xl rounded-[18px] p-3 border border-slate-700/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-[11px] uppercase">Format</p>
                <p className="text-white text-sm sm:text-base font-bold mt-1">{formatLabel}</p>
              </div>
              <div className="w-8 h-8 bg-emerald-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
                <LayoutGrid className="w-4 h-4 text-emerald-300" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/65 backdrop-blur-xl rounded-[18px] p-3 border border-slate-700/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-[11px] uppercase">Datum početka</p>
                <p className="text-white text-sm sm:text-base font-bold mt-1">{startDateLabel}</p>
              </div>
              <div className="w-8 h-8 bg-indigo-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-indigo-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      {!categoriesLoading && !activeCategory && !['categories', 'all-matches', 'all-players', 'referees', 'tables'].includes(activeTab) ? (
        <div className="text-center py-20 bg-slate-900 rounded-[40px] border border-slate-800">
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
        <div className="overflow-x-auto mb-6 -mx-3 px-3 scrollbar-hide">
          <div className="flex items-center gap-1.5 bg-slate-900/65 p-1.5 rounded-[18px] border border-slate-700/60 shadow-lg w-fit min-w-full sm:min-w-min overflow-x-auto no-scrollbar backdrop-blur-xl">
            <button 
              onClick={() => setActiveTab('categories')}
              className={`px-3.5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'categories' ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
            >
              Kategorije
            </button>

            <button 
              onClick={() => setActiveTab('all-matches')}
              className={`px-3.5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'all-matches' ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
            >
              <List size={14} /> Svi Mečevi
            </button>

            <button 
              onClick={() => setActiveTab('all-players')}
              className={`px-3.5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'all-players' ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
            >
              <Users size={14} /> Svi Igrači
            </button>

            <button 
              onClick={() => setActiveTab('tables')}
              className={`px-3.5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'tables' ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
            >
              <LayoutGrid size={14} /> Stolovi
            </button>

            <button 
              onClick={() => setActiveTab('referees')}
              className={`px-3.5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'referees' ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
            >
              <Shield size={14} /> Sudije
            </button>
            
            {activeCategory && (
              <>
                <div className="w-px h-7 bg-slate-800 mx-1.5 hidden sm:block"></div>
                
                <button 
                  onClick={() => setActiveTab('players')}
                  className={`px-3.5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'players' ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
                >
                  Igrači
                </button>

                {showMatchesTab && (
                  <button 
                    onClick={() => setActiveTab('matches')}
                    className={`px-3.5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'matches' ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
                  >
                    Raspored
                  </button>
                )}

                <button 
                  onClick={() => setActiveTab('knockout')}
                  className={`px-3.5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'knockout' ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
                >
                  Eliminacije
                </button>

                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`px-3.5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'settings' ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
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
