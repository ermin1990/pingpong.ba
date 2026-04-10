import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Trash2, Plus, ChevronRight, Table as TableIcon, Clock, PlayCircle, LayoutGrid } from 'lucide-react';

const getMatchName = (match, slot) => match?.[`player${slot}`]?.name || match?.[`player${slot}Name`] || 'TBD';
const getMatchClub = (match, slot) => match?.[`player${slot}`]?.club || match?.[`player${slot}Club`] || 'Ind.';

const TablesTab = ({ competition, id, matches = [], referees = [], setEditingMatch, setShowMatchModal }) => {
  const [tables, setTables] = useState(competition?.tables || []);
  const [newTableName, setNewTableName] = useState('');
  const [loading, setLoading] = useState(false);
  const [generateCount, setGenerateCount] = useState(1);
  const [selectedTableId, setSelectedTableId] = useState(null);

  useEffect(() => {
    if (competition?.tables) setTables(competition.tables);
  }, [competition]);

  const handleAddTable = async () => {
    if (!newTableName.trim()) return;
    setLoading(true);

    const newTable = {
      id: Date.now().toString(),
      name: newTableName.trim()
    };

    setTables((prev) => [...prev, newTable]);
    setNewTableName('');

    try {
      const compRef = doc(db, 'competitions', id);
      await updateDoc(compRef, { tables: arrayUnion(newTable) });
    } catch (err) {
      console.error('Error adding table:', err);
      alert('Greška pri dodavanju stola.');
      setTables((prev) => prev.filter((table) => table.id !== newTable.id));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTables = async () => {
    if (generateCount < 1) return;
    setLoading(true);

    const currentCount = tables.length;
    const newTables = Array.from({ length: generateCount }, (_, idx) => ({
      id: `${Date.now()}-${idx + 1}`,
      name: `Stol ${currentCount + idx + 1}`
    }));

    setTables((prev) => [...prev, ...newTables]);

    try {
      const compRef = doc(db, 'competitions', id);
      await updateDoc(compRef, { tables: arrayUnion(...newTables) });
    } catch (err) {
      console.error('Error generating tables:', err);
      alert('Greška pri generisanju stolova.');
      setTables((prev) => prev.slice(0, prev.length - newTables.length));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = async (e, table) => {
    e.stopPropagation();
    if (!window.confirm(`Obrisati ${table.name}?`)) return;

    setTables((prev) => prev.filter((item) => item.id !== table.id));
    if (selectedTableId === table.id) setSelectedTableId(null);

    try {
      const compRef = doc(db, 'competitions', id);
      await updateDoc(compRef, { tables: arrayRemove(table) });
    } catch (err) {
      console.error('Error deleting table:', err);
      setTables((prev) => [...prev, table]);
    }
  };

  const currentTable = tables.find((table) => table.id === selectedTableId);
  const tableMatches = selectedTableId ? matches.filter((match) => match.tableId === selectedTableId) : [];

  return (
    <div className="space-y-5 p-5 sm:p-6">
      <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-5">
        <div className="space-y-4">
          <div className="bg-slate-950/90 border border-slate-800 rounded-[24px] p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-sky-500/12 rounded-2xl flex items-center justify-center text-sky-300 border border-sky-500/15">
                <Plus size={18} />
              </div>
              <div>
                <h4 className="text-lg font-black italic tracking-tight uppercase text-white leading-none">Novi Stol</h4>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">UPRAVLJANJE RESURSIMA</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">BROJ / NAZIV STOLA</label>
                <input
                  type="text"
                  placeholder="Npr. Sto 5"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold focus:border-sky-500 focus:outline-none placeholder:text-slate-700"
                />
                <button
                  onClick={handleAddTable}
                  disabled={loading || !newTableName}
                  className="w-full mt-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-sky-950/20 transition-all"
                >
                  Dodaj Sto
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">ILI</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">BRZA GENERACIJA</label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={generateCount}
                    onChange={(e) => setGenerateCount(parseInt(e.target.value, 10) || 1)}
                    className="w-20 bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white font-bold text-center focus:border-sky-500 focus:outline-none"
                  />
                  <button
                    onClick={handleGenerateTables}
                    disabled={loading}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700 transition-all"
                  >
                    Generiši Više
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-sky-500/5 border border-sky-500/10 p-4 rounded-[20px]">
            <p className="text-[10px] text-sky-300/90 font-black uppercase tracking-widest leading-relaxed">
              Stolovi vam omogućavaju da pratite aktivne mečeve i red čekanja. Klik na stol otvara njegov red mečeva.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center gap-3 flex-wrap">
            <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white italic flex items-center gap-3">
              <div className="w-2 h-7 bg-sky-500 rounded-full" />
              Stolovi <span className="text-sky-400/40">({tables.length})</span>
            </h3>
            {selectedTableId && (
              <button
                onClick={() => setSelectedTableId(null)}
                className="text-[10px] font-black uppercase tracking-widest text-sky-300 hover:text-white bg-sky-500/5 px-4 py-2 rounded-full border border-sky-500/10 transition-all"
              >
                Prikaži Sve
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {tables.map((table) => {
              const activeMatch = matches.find((match) => match.tableId === table.id && match.status === 'in_progress');
              const pendingCount = matches.filter((match) => match.tableId === table.id && match.status === 'pending').length;
              const isSelected = selectedTableId === table.id;
              const assignedReferee = referees.find((referee) => referee.assignedTableId === table.id);

              return (
                <div
                  key={table.id}
                  onClick={() => setSelectedTableId(table.id === selectedTableId ? null : table.id)}
                  className={`p-4 rounded-[20px] border transition-all cursor-pointer group flex flex-col justify-between min-h-[170px] shadow-sm ${
                    isSelected
                      ? 'bg-slate-950 border-sky-400/40 shadow-md shadow-sky-950/20'
                      : activeMatch
                        ? 'bg-slate-950 border-amber-500/30 hover:border-amber-500/50'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${activeMatch ? 'bg-amber-400 animate-pulse' : 'bg-slate-700'}`} />
                        <span className={`text-[11px] font-black uppercase tracking-widest ${isSelected ? 'text-sky-300' : activeMatch ? 'text-amber-400' : 'text-slate-400'}`}>
                          {table.name}
                        </span>
                      </div>
                      {assignedReferee && (
                        <span className="text-[9px] font-black uppercase mt-2 px-2 py-1 rounded-md bg-slate-900 text-slate-400 border border-slate-800">
                          Sudija: {assignedReferee.name}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDeleteTable(e, table)}
                      className={`p-2 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ${isSelected ? 'opacity-100' : ''}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="my-4">
                    {activeMatch ? (
                      <div className="space-y-2.5">
                        <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-amber-400">
                          <PlayCircle size={12} />
                          U toku
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-sm uppercase tracking-tight leading-none text-white truncate">
                            {getMatchName(activeMatch, 1)}
                          </p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">
                            {getMatchClub(activeMatch, 1)}
                          </p>
                        </div>
                        <div className="text-3xl font-black text-amber-400 italic tracking-tight leading-none py-1">
                          {activeMatch.player1Score ?? 0} : {activeMatch.player2Score ?? 0}
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-sm uppercase tracking-tight leading-none text-white truncate">
                            {getMatchName(activeMatch, 2)}
                          </p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">
                            {getMatchClub(activeMatch, 2)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-5 opacity-50">
                        <TableIcon size={28} className="text-slate-600 mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Slobodan</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-auto pt-3 border-t border-slate-800">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${activeMatch ? 'text-amber-300/80' : 'text-slate-600'}`}>
                      {pendingCount} na čekanju
                    </span>
                    <ChevronRight size={15} className={isSelected ? 'text-sky-300' : activeMatch ? 'text-amber-400' : 'text-slate-700'} />
                  </div>
                </div>
              );
            })}
          </div>

          {selectedTableId && (
            <div className="mt-4">
              <div className="bg-slate-950/90 border border-slate-800 rounded-[24px] overflow-hidden shadow-lg">
                <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950/60">
                  <div>
                    <h4 className="text-lg font-black uppercase tracking-tight italic text-white flex items-center gap-3">
                      <div className="w-2 h-7 bg-sky-500 rounded-full" />
                      Red Čekanja - {currentTable?.name}
                    </h4>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 ml-5">MEČEVI DODIJELJENI OVOM STOLU</p>
                  </div>
                  <span className="bg-sky-500/10 text-sky-300 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest border border-sky-500/20">
                    {tableMatches.length} MEČA
                  </span>
                </div>
                <div className="p-5 space-y-3 max-h-[460px] overflow-y-auto no-scrollbar">
                  {tableMatches.length === 0 ? (
                    <div className="py-16 text-center space-y-4">
                      <div className="w-14 h-14 bg-slate-900 rounded-2xl mx-auto flex items-center justify-center text-slate-700">
                        <Clock size={28} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nema dodijeljenih mečeva</p>
                    </div>
                  ) : (
                    tableMatches
                      .slice()
                      .sort((a, b) => (a.status === 'in_progress' ? -1 : 1) - (b.status === 'in_progress' ? -1 : 1))
                      .map((match) => (
                        <div
                          key={match.id}
                          onClick={() => {
                            setEditingMatch(match);
                            setShowMatchModal(true);
                          }}
                          className={`group/match relative bg-slate-950 border transition-all p-4 rounded-[20px] cursor-pointer hover:border-sky-500/30 ${
                            match.status === 'in_progress' ? 'border-amber-500/40' : 'border-slate-800'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                            <div className="flex-1 w-full">
                              <div className="flex items-center gap-3 mb-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                                  match.status === 'in_progress' ? 'bg-amber-500 text-black' : 'bg-slate-900 text-slate-500 border border-slate-800'
                                }`}>
                                  {match.status === 'in_progress' ? <PlayCircle size={14} fill="currentColor" /> : <Clock size={14} />}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${match.status === 'in_progress' ? 'text-amber-400' : 'text-slate-500'}`}>
                                  {match.status === 'in_progress' ? 'Aktivno' : 'Na čekanju'}
                                </span>
                                <div className="h-px flex-1 bg-slate-800" />
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{match.roundName || `R ${match.round}`}</span>
                              </div>

                              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8">
                                <div className="flex-1 text-center sm:text-left">
                                  <h5 className="text-base font-black text-white italic tracking-tight uppercase leading-none mb-1">{getMatchName(match, 1)}</h5>
                                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{getMatchClub(match, 1)}</p>
                                </div>

                                <div className="flex items-center gap-4 bg-slate-900/50 p-3 rounded-[18px] border border-slate-800">
                                  <span className={`text-3xl font-black italic tabular-nums ${match.status === 'in_progress' ? 'text-amber-400' : 'text-slate-400'}`}>
                                    {match.player1Score ?? 0}
                                  </span>
                                  <span className="text-2xl font-black text-slate-800 italic">:</span>
                                  <span className={`text-3xl font-black italic tabular-nums ${match.status === 'in_progress' ? 'text-amber-400' : 'text-slate-400'}`}>
                                    {match.player2Score ?? 0}
                                  </span>
                                </div>

                                <div className="flex-1 text-center sm:text-right">
                                  <h5 className="text-base font-black text-white italic tracking-tight uppercase leading-none mb-1">{getMatchName(match, 2)}</h5>
                                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{getMatchClub(match, 2)}</p>
                                </div>
                              </div>
                            </div>

                            <div className="hidden sm:flex flex-col items-center gap-4 pl-5 border-l border-slate-900">
                              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500 group-hover/match:text-sky-300 transition-all border border-slate-800">
                                <ChevronRight size={18} />
                              </div>
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
