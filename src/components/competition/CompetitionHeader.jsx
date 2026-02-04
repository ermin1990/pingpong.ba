import { Edit2, Search, X, List, Users } from 'lucide-react';

const CompetitionHeader = ({ 
  competition, 
  setShowCompSettings, 
  activeTab, 
  setActiveTab, 
  categoriesLoading, 
  activeCategory,
  categories
}) => {
  return (
    <>
      {/* Quick Competition Settings Button */}
      <div className="flex justify-end mb-6">
        <button 
          onClick={() => setShowCompSettings(true)}
          className="bg-slate-900/40 text-slate-400 border border-slate-800 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2 shadow-xl"
        >
          <Edit2 size={14} className="text-blue-500" /> Postavke Takmičenja
        </button>
      </div>

      {/* Navigation Tabs */}
      {!categoriesLoading && !activeCategory && activeTab !== 'categories' ? (
        <div className="text-center py-20">
          <div className="bg-red-500/10 inline-block p-6 rounded-3xl border border-red-500/20 mb-4">
            <h3 className="text-white font-bold">Kategorija nije pronađena</h3>
            <p className="text-slate-500 text-xs mt-1">Izabrana kategorija ne postoji ili je obrisana.</p>
          </div>
          <br />
          <button 
            onClick={() => setActiveTab('categories')} 
            className="text-blue-500 font-bold uppercase text-xs hover:underline"
          >
            Nazad na pregled
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto mb-8 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-sm w-fit min-w-min">
            <button 
              onClick={() => setActiveTab('categories')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'categories' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
            >
              Kategorije
            </button>

            <button 
              onClick={() => setActiveTab('all-matches')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'all-matches' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
            >
              <List size={12} /> Svi Mečevi
            </button>

            <button 
              onClick={() => setActiveTab('all-players')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'all-players' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
            >
              <Users size={12} /> Svi Igrači
            </button>
            
            {activeCategory && (
              <>
                <div className="w-px h-6 bg-slate-800 mx-2 hidden md:block"></div>
                
                <button 
                  onClick={() => setActiveTab('players')}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'players' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
                >
                  Igrači
                </button>

                <button 
                  onClick={() => setActiveTab('matches')}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'matches' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
                >
                  Raspored
                </button>

                <button 
                  onClick={() => setActiveTab('knockout')}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'knockout' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
                >
                  Eliminacije
                </button>

                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
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
