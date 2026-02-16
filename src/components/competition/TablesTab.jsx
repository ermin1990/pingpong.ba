import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Trash2, Plus, LayoutGrid, ChevronRight, Table as TableIcon, Clock, CheckCircle2, PlayCircle } from 'lucide-react';

const TablesTab = ({ competition, id, matches = [], referees = [], setEditingMatch, setShowMatchModal, saveMatchResult }) => {
  const [tables, setTables] = useState(competition?.tables || []);
  const [newTableName, setNewTableName] = useState('');
  const [loading, setLoading] = useState(false);
  const [generateCount, setGenerateCount] = useState(1);
  const [selectedTableId, setSelectedTableId] = useState(null);

  // Sync internal state if competition changes
  useEffect(() => {
    if (competition?.tables) {
       setTables(competition.tables);
    }
  }, [competition]);

  const handleAddTable = async () => {
    if (!newTableName.trim()) return;
    setLoading(true);
    
    const newTable = {
      id: Date.now().toString(),
      name: newTableName.trim()
    };
    
    // Optimistic update
    setTables(prev => [...prev, newTable]);
    setNewTableName('');

    try {
      const compRef = doc(db, 'competitions', id);
      await updateDoc(compRef, {
        tables: arrayUnion(newTable)
      });
    } catch (err) {
      console.error("Error adding table:", err);
      alert("Gre�ka pri dodavanju stola.");
      setTables(prev => prev.filter(t => t.id !== newTable.id));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTables = async () => {
    if (generateCount < 1) return;
    setLoading(true);
    
    const newTables = [];
    const currentCount = tables.length;
    
    for (let i = 1; i <= generateCount; i++) {
      newTables.push({
        id: Date.now().toString() + '-' + i,
        name: `Stol ${currentCount + i}`
      });
    }

    setTables(prev => [...prev, ...newTables]);

    try {
      const compRef = doc(db, 'competitions', id);
      await updateDoc(compRef, {
        tables: arrayUnion(...newTables)
      });
    } catch (err) {
      console.error("Error generating tables:", err);
      alert("Gre�ka pri generisanju stolova.");
      setTables(prev => prev.slice(0, prev.length - newTables.length));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = async (e, table) => {
    e.stopPropagation(); // Don't trigger 'select table'
    if (!confirm(`Obrisati ${table.name}?`)) return;
    
    setTables(prev => prev.filter(t => t.id !== table.id));
    if (selectedTableId === table.id) setSelectedTableId(null);

    try {
      const compRef = doc(db, 'competitions', id);
      await updateDoc(compRef, {
        tables: arrayRemove(table)
      });
    } catch (err) {
      console.error("Error deleting table:", err);
      setTables(prev => [...prev, table]);
    }
  };

  const currentTable = tables.find(t => t.id === selectedTableId);
  const tableMatches = selectedTableId 
    ? matches.filter(m => m.tableId === selectedTableId)
    : [];

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Table Management sidebar if needed, or inline */}
        <div className="w-full lg:w-1/3 space-y-4">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 p-5 rounded-2xl">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <Plus size={16} /> Dodaj Stolove
                </h3>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={newTableName}
                            onChange={(e) => setNewTableName(e.target.value)}
                            placeholder="Ime stola..."
                            className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-blue-500 transition-all"
                        />
                        <button 
                            onClick={handleAddTable} 
                            disabled={loading || !newTableName}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-black uppercase shadow-lg shadow-blue-900/40"
                        >
                            Dodaj
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-[1px] bg-white/5"></div>
                        <span className="text-[10px] font-black text-slate-600 uppercase">Ili</span>
                        <div className="flex-1 h-[1px] bg-white/5"></div>
                    </div>
                    <div className="flex gap-2">
                        <input 
                            type="number" 
                            min="1" max="20"
                            value={generateCount}
                            onChange={(e) => setGenerateCount(parseInt(e.target.value) || 1)}
                            className="w-16 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-center"
                        />
                        <button 
                            onClick={handleGenerateTables}
                            disabled={loading}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-black uppercase border border-white/5 transition-all"
                        >
                            Generiši Više
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl">
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-tight leading-relaxed">
                    Stolovi vam omogucavaju da pratite meceve u realnom vremenu. Rasporedite meceve na stolove u tabu "Raspored".
                </p>
            </div>
        </div>

        {/* Global Monitor View */}
        <div className="w-full lg:w-2/3">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black uppercase tracking-tighter text-white flex items-center gap-2">
                    <TableIcon className="text-blue-500" /> Pracenje Stolova ({tables.length})
                </h3>
                {selectedTableId && (
                    <button 
                        onClick={() => setSelectedTableId(null)}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white"
                    >
                        Prika�i Sve
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {tables.map(table => {
                    const activeMatch = matches.find(m => m.tableId === table.id && m.status === 'in_progress');
                    const pendingCount = matches.filter(m => m.tableId === table.id && m.status === 'pending').length;
                    const isSelected = selectedTableId === table.id;
                    const assignedReferee = referees.find(r => r.assignedTableId === table.id);

                    return (
                        <div 
                            key={table.id}
                            onClick={() => setSelectedTableId(table.id === selectedTableId ? null : table.id)}
                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer group flex flex-col justify-between min-h-[140px] ${
                                isSelected 
                                ? 'bg-blue-600 border-blue-400 shadow-xl shadow-blue-600/20 z-10' 
                                : activeMatch 
                                ? 'bg-slate-900 border-blue-500/50 hover:border-blue-400' 
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                  <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                                      {table.name}
                                  </span>
                                  {assignedReferee && (
                                    <span className={`text-[8px] font-bold uppercase mt-0.5 ${isSelected ? 'text-blue-100' : 'text-emerald-500'}`}>
                                      Sudija: {assignedReferee.name}
                                    </span>
                                  )}
                                </div>
                                <button 
                                    onClick={(e) => handleDeleteTable(e, table)}
                                    className={`p-1 dark:text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 ${isSelected ? 'text-blue-200' : ''}`}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="my-3">
                                {activeMatch ? (
                                    <div className="space-y-1">
                                        <p className={`text-[10px] font-black uppercase tracking-tighter ${isSelected ? 'text-blue-100' : 'text-blue-500'}`}>U TOKU:</p>
                                        <p className="font-black text-sm uppercase tracking-tighter leading-tight line-clamp-2 text-white">
                                            {activeMatch.player1Name} <span className="text-blue-400">vs</span> {activeMatch.player2Name}
                                        </p>
                                        <div className={`flex items-center gap-2 text-xl font-black ${isSelected ? 'text-white' : 'text-blue-400'}`}>
                                            {activeMatch.player1Score ?? 0} : {activeMatch.player2Score ?? 0}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full py-4 opacity-40">
                                        <CheckCircle2 size={24} className={isSelected ? 'text-white' : 'text-slate-600'} />
                                        <span className={`text-[9px] font-black uppercase mt-1 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>Slobodan</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-center mt-auto pt-2 border-t border-white/5">
                                <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                                    {pendingCount} na cekanju
                                </span>
                                <ChevronRight size={14} className={isSelected ? 'text-white' : 'text-slate-700'} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Selected Table Detail View */}
            {selectedTableId && (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-blue-600/10 to-transparent">
                            <h4 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                                <Clock className="text-blue-500" /> Red ekanja - {currentTable?.name}
                            </h4>
                            <span className="bg-slate-800 text-slate-400 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                                {tableMatches.length} meceva ukupno
                            </span>
                        </div>
                        <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
                            {tableMatches.length === 0 ? (
                                <div className="py-12 text-center text-slate-500 text-xs font-black uppercase tracking-widest">
                                    Nema dodijeljenih meceva za ovaj stol.
                                </div>
                            ) : (
                                tableMatches.sort((a,b) => (a.status === 'in_progress' ? -1 : 1)).map(match => (
                                    <div 
                                        key={match.id}
                                        onClick={() => {
                                            setEditingMatch(match);
                                            setShowMatchModal(true);
                                        }}
                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
                                            match.status === 'in_progress' 
                                            ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-600/10' 
                                            : match.status === 'completed'
                                            ? 'bg-slate-950/30 border-slate-900 opacity-50'
                                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {match.status === 'in_progress' ? <PlayCircle size={10} className="text-blue-500 animate-pulse" /> : <Clock size={10} className="text-slate-500" />}
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{match.roundName || `Runda ${match.round}`}</span>
                                            </div>
                                            <p className="font-black text-[13px] sm:text-sm uppercase tracking-tighter line-clamp-2 text-white">
                                                {match.player1Name} <span className="text-blue-500/50 mx-1">vs</span> {match.player2Name}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 ml-4">
                                            <div className="flex gap-1">
                                                <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-lg ${match.winnerId === match.player1Id ? 'text-blue-500 bg-blue-500/10' : 'text-white bg-white/5'}`}>{match.player1Score ?? 0}</span>
                                                <span className="flex items-center text-slate-700 font-black">:</span>
                                                <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-lg ${match.winnerId === match.player2Id ? 'text-blue-500 bg-blue-500/10' : 'text-white bg-white/5'}`}>{match.player2Score ?? 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TablesTab;
