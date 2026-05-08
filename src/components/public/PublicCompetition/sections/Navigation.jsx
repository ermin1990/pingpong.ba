import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, LayoutGrid, ChevronDown, Globe, X } from 'lucide-react';
import { generateSlug } from '../utils';

const Navigation = ({ slug, categorySlug, categories, showDropdown, setShowDropdown, isEmbed }) => {
  return (
    <div id="category-nav" className="sticky top-0 z-[100] bg-[#070b14]/95 backdrop-blur-xl border-b border-slate-800/80">
      <div className="container mx-auto px-4">
        <div className="flex items-center min-h-[56px] gap-2 md:gap-3 relative py-2">
          <Link
            to="/explore"
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.14em] transition-all border bg-slate-800 text-slate-200 border-slate-600 hover:text-white hover:border-slate-400 hover:bg-slate-700"
          >
            <Globe size={13} />
            <span>pingpong.ba</span>
          </Link>

          <div className="w-px h-5 bg-slate-800 flex-shrink-0" />

          <Link 
            to={`/p/${slug}`}
            className={`px-3 md:px-4 py-2.5 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-[0.14em] transition-all whitespace-nowrap flex items-center gap-2 border ${!categorySlug ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20' : 'bg-slate-900/70 text-slate-300 border-slate-700 hover:text-white hover:border-slate-500 hover:bg-slate-800'}`}
          >
            <LayoutGrid size={14} /> Pregled
          </Link>
          
          {categories.length > 0 && (
            <>
              <div className="hidden lg:flex items-center gap-2 min-w-0 overflow-x-auto no-scrollbar">
                {categories.map(cat => {
                  const catSlug = generateSlug(cat.name);
                  const isActive = categorySlug === catSlug;
                  return (
                    <Link
                      key={cat.id}
                      to={`/p/${slug}/${catSlug}${isEmbed ? '?embed=true' : ''}`}
                      className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.12em] whitespace-nowrap border transition-all ${isActive ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900/60 text-slate-300 border-slate-700 hover:border-slate-500 hover:text-white'}`}
                    >
                      {cat.name}
                    </Link>
                  );
                })}
              </div>

              <div className="lg:hidden relative z-50 ml-auto">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.14em] transition-all flex items-center gap-2 border whitespace-nowrap ${categorySlug ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900/70 text-slate-300 border-slate-700 hover:text-white'}`}
                >
                  <Trophy size={14} />
                  <span className="max-w-[120px] truncate">
                    {categorySlug ? categories.find(c => generateSlug(c.name) === categorySlug)?.name || 'Kategorija' : 'Kategorije'}
                  </span>
                  <ChevronDown size={14} className={`transition-transform duration-300 flex-shrink-0 ${showDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showDropdown && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-[105] bg-black/60"
                      onClick={() => setShowDropdown(false)}
                    />
                    {/* Panel */}
                    <div className="fixed left-3 right-3 top-[70px] z-[110] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                      <div className="flex items-center justify-between bg-slate-950/60 px-4 py-3 border-b border-slate-800">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em]">Kategorije</span>
                        <button onClick={() => setShowDropdown(false)} className="text-slate-500 hover:text-white transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                      <div className="max-h-[60vh] overflow-y-auto py-1.5">
                        {categories.map(cat => {
                          const catSlug = generateSlug(cat.name);
                          return (
                            <Link
                              key={cat.id}
                              to={`/p/${slug}/${catSlug}${isEmbed ? '?embed=true' : ''}`}
                              onClick={() => setShowDropdown(false)}
                              className={`w-full px-4 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.1em] transition-all block ${categorySlug === catSlug ? 'text-blue-300 bg-blue-600/10' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="flex-1">{cat.name}</span>
                                {categorySlug === catSlug && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"></div>}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navigation;
