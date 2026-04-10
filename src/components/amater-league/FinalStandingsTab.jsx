import React, { useState, useEffect } from 'react';
import { Trophy, Star, Medal, Save, RefreshCw, Layers } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

const FinalStandingsTab = ({ 
  activeCategory, 
  allPlayers = [], 
  matches = [], 
  id, 
  tournamentCollection = 'amater_league_tournaments' 
}) => {
  const [standings, setStandings] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Inicijalizacija tabele na osnovu trenutnih rankings-a ili učesnika
  useEffect(() => {
    const playerMap = {};
    allPlayers.forEach(p => { playerMap[p.id] = p.name; });

    const currentRankings = activeCategory.finalRankings || [];
    
    // Ako već imamo spašen poredak, koristi ga
    if (currentRankings.length > 0) {
      setStandings(currentRankings);
    } else {
      // Inicijalizuj listu sa svim igračima iz ove kategorije
      const initial = (activeCategory.playerIds || []).map((pid, idx) => ({
        playerId: pid,
        playerName: playerMap[pid] || 'Nepoznat',
        position: idx + 1,
        manual: false
      }));
      setStandings(initial);
    }
  }, [activeCategory, allPlayers]);

  const handlePositionChange = (playerId, newPos) => {
    setStandings(prev => prev.map(p => 
      p.playerId === playerId ? { ...p, position: parseInt(newPos) || 0, manual: true } : p
    ).sort((a,b) => a.position - b.position));
  };

  const handleSaveRankings = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, tournamentCollection, id, "categories", activeCategory.id), {
        finalRankings: standings,
        updatedAt: serverTimestamp()
      });
      alert("Poredak uspješno sačuvan!");
    } catch (err) {
      console.error(err);
      alert("Greška pri spašavanju.");
    } finally {
      setIsSaving(false);
    }
  };

  const autoAnalyze = () => {
    // 1. Pobjednik Finala u Knockoutu je #1, poraženi #2
    // 2. Traži mečeve u razigravanju koji imaju "3. mjesto" u nazivu itd.
    const newStandings = [...standings];
    
    // Analiza Knockout Finale
    const finale = matches.find(m => m.isKnockout && (m.roundName?.toLowerCase().includes('finale') || m.round === 4) && !m.roundName?.toLowerCase().includes('polu'));
    if (finale && finale.status === 'completed') {
      const p1Win = finale.player1Score > finale.player2Score;
      const winner = p1Win ? finale.player1 : finale.player2;
      const loser = p1Win ? finale.player2 : finale.player1;

      const wIdx = newStandings.findIndex(s => s.playerId === winner.id);
      if (wIdx > -1) newStandings[wIdx].position = 1;
      
      const lIdx = newStandings.findIndex(s => s.playerId === loser.id);
      if (lIdx > -1) newStandings[lIdx].position = 2;
    }

    // Analiza Razigravanja (npr. "za 3. mjesto")
    matches.filter(m => m.isPlayoff && m.status === 'completed').forEach(m => {
      const name = m.roundName?.toLowerCase() || '';
      let targetPos = 0;
      if (name.includes('3')) targetPos = 3;
      else if (name.includes('5')) targetPos = 5;
      else if (name.includes('7')) targetPos = 7;

      if (targetPos > 0) {
        const p1Win = m.player1Score > m.player2Score;
        const winner = p1Win ? m.player1 : m.player2;
        const loser = p1Win ? m.player2 : m.player1;

        const wIdx = newStandings.findIndex(s => s.playerId === winner.id);
        if (wIdx > -1) newStandings[wIdx].position = targetPos;
        
        const lIdx = newStandings.findIndex(s => s.playerId === loser.id);
        if (lIdx > -1) newStandings[lIdx].position = targetPos + 1;
      }
    });

    setStandings(newStandings.sort((a,b) => a.position - b.position));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-[32px]">
        <div>
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
            <Trophy className="text-amber-400" size={24} /> Finalni Poredak Turnira
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
            Definišite konačne pozicije za dodjelu sezonskih poena
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={autoAnalyze}
            className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-600/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
          >
            <RefreshCw size={14} /> Auto-Analiza
          </button>
          <button 
            disabled={isSaving}
            onClick={handleSaveRankings}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/40 flex items-center gap-2"
          >
            <Save size={14} /> {isSaving ? 'Spašavam...' : 'Sačuvaj Poredak'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {standings.map((player, idx) => (
          <div key={player.playerId} className="flex items-center gap-4 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl hover:border-blue-500/30 transition-all">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black italic border-2 ${
              player.position === 1 ? 'bg-amber-400/10 border-amber-400 text-amber-500 shadow-lg shadow-amber-400/10' :
              player.position === 2 ? 'bg-slate-300/10 border-slate-300 text-slate-400' :
              player.position === 3 ? 'bg-amber-700/10 border-amber-700 text-amber-800' :
              'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500'
            }`}>
              {player.position}.
            </div>
            
            <div className="flex-1">
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{player.playerName}</h4>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">ID: {player.playerId.substring(0,8)}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Pozicija</label>
                <input 
                  type="number" 
                  min="1"
                  max="100"
                  value={player.position}
                  onChange={(e) => handlePositionChange(player.playerId, e.target.value)}
                  className="w-16 bg-slate-100 dark:bg-slate-950 border-none rounded-lg p-2 text-center font-black text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-amber-400/10 border border-amber-400/20 rounded-2xl">
        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest leading-relaxed">
          <Star size={12} className="inline mr-2 mb-1" />
          Napomena: Pozicije od 1 do 8 dobijaju bonus bodove (npr. 1. mjesto = 50 poena), dok svi ostali dobijaju fiksni broj poena za učešće. 
          Pobjede se računaju odvojeno (5 poena po pobjedi).
        </p>
      </div>
    </div>
  );
};

export default FinalStandingsTab;
