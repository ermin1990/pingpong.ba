import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, LayoutGrid, ChevronDown } from 'lucide-react';
import { generateSlug } from '../utils';

const Navigation = ({ slug, categorySlug, categories, showDropdown, setShowDropdown, isEmbed }) => {
  return (
    <div id="category-nav" className="sticky top-0 z-[100] bg-[#070b14]/95 backdrop-blur-xl border-b border-slate-800/80">
      <div className="container mx-auto px-4">
        <div className="flex items-center min-h-[64px] gap-2 md:gap-3 relative py-2">
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
                  {categorySlug ? categories.find(c => generateSlug(c.name) === categorySlug)?.name || 'Kategorija' : 'Kategorije'}
                  <ChevronDown size={14} className={`transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-[110] overflow-hidden">
                    <div className="bg-slate-950/60 px-4 py-3 border-b border-slate-800">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em]">Dostupne kategorije</span>
                    </div>
                    <div className="max-h-[50vh] overflow-y-auto py-1.5 custom-scrollbar">
                      {categories.map(cat => {
                        const catSlug = generateSlug(cat.name);
                        return (
                          <Link
                            key={cat.id}
                            to={`/p/${slug}/${catSlug}${isEmbed ? '?embed=true' : ''}`}
                            onClick={() => setShowDropdown(false)}
                            className={`w-full px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-[0.12em] transition-all block ${categorySlug === catSlug ? 'text-blue-300 bg-blue-600/10' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'}`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{cat.name}</span>
                              {categorySlug === catSlug && <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
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
