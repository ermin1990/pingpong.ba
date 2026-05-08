import React from 'react';
import { X, UserPlus, FileText, ExternalLink, Globe, Lock } from 'lucide-react';

const CompetitionSettingsModal = ({
  showCompSettings,
  setShowCompSettings,
  compName,
  setCompName,
  compSlug,
  setCompSlug,
  collaborators = [],
  setCollaborators,
  competition,
  handleUpdateCompetition,
  savingComp,
  isPublic,
  handleTogglePublic
}) => {
  if (!showCompSettings || !competition) return null;

  const [newCollabEmail, setNewCollabEmail] = React.useState('');

  const addCollaborator = () => {
    if (!newCollabEmail) return;
    if (collaborators.includes(newCollabEmail)) {
      setNewCollabEmail('');
      return;
    }
    setCollaborators([...collaborators, newCollabEmail]);
    setNewCollabEmail('');
  };

  const removeCollaborator = (email) => {
    setCollaborators(collaborators.filter(c => c !== email));
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all">
      <div className="bg-[#0f172a] border border-slate-800 w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl transition-all ring-1 ring-white/5">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
          <h3 className="font-black uppercase italic tracking-tighter text-2xl text-white">Postavke Takmičenja</h3>
          <button 
            onClick={() => setShowCompSettings(false)} 
            className="p-3 bg-slate-950 text-slate-500 hover:text-white hover:bg-slate-800 rounded-2xl transition-all border border-slate-800"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-10 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 ml-1 flex items-center gap-2">
               <FileText size={12} className="text-amber-500" /> NAZIV TAKMIČENJA
            </label>
            <input 
              type="text" 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white font-black uppercase tracking-widest text-xs outline-none focus:border-amber-500/50 transition-all placeholder:text-slate-800"
              value={compName}
              onChange={(e) => setCompName(e.target.value)}
              placeholder="npr. Joola Cup 2024"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 ml-1 flex items-center gap-2">
               <ExternalLink size={12} className="text-amber-500" /> LINK (SLUG)
            </label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700 font-black text-[10px] uppercase tracking-widest border-r border-slate-800 pr-3 h-4 flex items-center">
                /p/
              </div>
              <input 
                type="text" 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 pl-16 pr-5 text-amber-500 font-black uppercase tracking-widest text-xs outline-none focus:border-amber-500 transition-all placeholder:text-slate-800"
                value={compSlug}
                onChange={(e) => setCompSlug(e.target.value)}
                placeholder="joola-cup"
              />
            </div>
            <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest ml-1 mt-1">
               * Ovo je unikatni link po kojem će korisnici pratiti turnir
            </p>
          </div>

          <div className="space-y-6 pt-8 border-t border-slate-800">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <Lock size={12} className="text-amber-500" /> VIDLJIVOST TAKMIČENJA
              </label>
              <div className="flex items-center gap-3">
                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${isPublic ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-slate-950 text-slate-600 border-slate-800'}`}>
                  {isPublic ? 'JAVNO' : 'PRIVATNO'}
                </span>
              </div>
            </div>
            
            <div className="bg-slate-950 border border-slate-800 rounded-[24px] p-6 group hover:border-amber-500/20 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <p className="text-sm font-black text-white uppercase italic tracking-tighter mb-1">JAVNO TAKMIČENJE</p>
                  <p className="text-[10px] text-slate-600 font-black uppercase tracking-tight">
                    {isPublic ? 'Svi sa linkom mogu pratiti rezultate' : 'Samo administratori imaju pristup'}
                  </p>
                </div>
                <button 
                  onClick={() => handleTogglePublic(!isPublic)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    isPublic 
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 hover:scale-105' 
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {isPublic ? 'ISKLJUČI' : 'AKTIVIRAJ'}
                </button>
              </div>

              {isPublic && (
                <div className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 shadow-inner">
                   <div className="flex-1 truncate text-[10px] font-black text-amber-500/70 uppercase tracking-widest px-3 select-all">
                      {`${window.location.origin}/p/${compSlug}`}
                   </div>
                   <button 
                     onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/p/${compSlug}`);
                        alert("Link kopiran!");
                     }}
                     className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                   >
                     KOPIRAJ
                   </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 ml-1 flex items-center gap-2">
                 <UserPlus size={12} className="text-amber-500" /> SARADNICI (EMAIL)
              </label>
              
              <div className="flex gap-3">
                <input 
                  type="email" 
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white font-black uppercase tracking-widest text-xs outline-none focus:border-amber-500 transition-all placeholder:text-slate-800"
                  value={newCollabEmail}
                  onChange={(e) => setNewCollabEmail(e.target.value)}
                  placeholder="email@example.com"
                  onKeyPress={(e) => e.key === 'Enter' && addCollaborator()}
                />
                <button 
                  onClick={addCollaborator}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm border border-slate-700"
                >
                  DODAJ
                </button>
              </div>

              <div className="space-y-2 mt-4">
                {collaborators.map((email) => (
                  <div key={email} className="flex items-center justify-between bg-white/5 border border-white/5 p-4 rounded-2xl group transition-all hover:bg-white/[0.08]">
                    <span className="text-white text-[11px] font-black uppercase tracking-widest">{email}</span>
                    <button 
                      onClick={() => removeCollaborator(email)}
                      className="text-slate-600 hover:text-red-500 transition-colors p-2"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {collaborators.length === 0 && (
                  <div className="text-center py-6 text-slate-700 text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-slate-800 rounded-[24px]">
                    NEMA DODANIH SARADNIKA
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-900/40 border-t border-slate-800">
           <button 
             onClick={handleUpdateCompetition}
             disabled={savingComp}
             className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-400 text-black py-5 rounded-[24px] font-black uppercase italic tracking-tighter text-lg shadow-xl shadow-amber-500/20 transition-all active:scale-95"
           >
             {savingComp ? 'SPAŠAVANJE...' : 'SAČUVAJ SVE POSTAVKE'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default CompetitionSettingsModal;
