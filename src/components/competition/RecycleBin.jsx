import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { Trash2, RotateCcw, RefreshCw, AlertTriangle, Clock } from 'lucide-react';

const RecycleBin = ({ competitionId }) => {
  const [deletedMatches, setDeletedMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState(null);

  const fetchDeleted = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'deleted_matches'),
        where('competitionId', '==', competitionId),
        orderBy('deletedAt', 'desc')
      );
      const snap = await getDocs(q);
      setDeletedMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('RecycleBin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeleted();
  }, [competitionId]);

  const handleRestore = async (item) => {
    if (!window.confirm(`Vratiti meč: ${item.player1?.name || item.player1} vs ${item.player2?.name || item.player2}?`)) return;
    setRestoringId(item.id);
    try {
      const { id: deletedId, originalId, ...matchData } = item;
      // Remove recycle bin meta fields
      const { deletedAt, deletedBy, deleteReason, ...cleanData } = matchData;

      // Restore to matches collection with original ID
      await setDoc(doc(db, 'matches', originalId), {
        ...cleanData,
        restoredAt: serverTimestamp(),
      });

      // Remove from deleted_matches
      await deleteDoc(doc(db, 'deleted_matches', deletedId));

      setDeletedMatches(prev => prev.filter(m => m.id !== deletedId));
      alert('Meč je uspješno vraćen!');
    } catch (err) {
      console.error('Restore error:', err);
      alert('Greška pri vraćanju meča: ' + err.message);
    } finally {
      setRestoringId(null);
    }
  };

  const handleRestoreAll = async (group) => {
    if (!window.confirm(`Vratiti sve mečeve iz ove grupe brisanja (${group.length})?`)) return;
    for (const item of group) {
      setRestoringId(item.id);
      try {
        const { id: deletedId, originalId, deletedAt, deletedBy, deleteReason, ...cleanData } = item;
        await setDoc(doc(db, 'matches', originalId), {
          ...cleanData,
          restoredAt: serverTimestamp(),
        });
        await deleteDoc(doc(db, 'deleted_matches', deletedId));
      } catch (err) {
        console.error('Restore error:', err);
        alert('Greška pri vraćanju: ' + err.message);
        setRestoringId(null);
        return;
      }
    }
    setRestoringId(null);
    setDeletedMatches(prev => {
      const ids = new Set(group.map(m => m.id));
      return prev.filter(m => !ids.has(m.id));
    });
    alert(`${group.length} mečeva je vraćeno!`);
  };

  const formatDate = (ts) => {
    if (!ts) return 'N/A';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString('bs-BA', { dateStyle: 'short', timeStyle: 'short' });
  };

  const reasonLabel = (reason) => {
    const labels = {
      reset_knockout: 'Reset KO faze',
      toggle_stage: 'Ponovni start grupe',
      return_to_draft: 'Povratak u Draft',
      clear_category: 'Čišćenje kategorije',
      delete_match: 'Ručno brisanje',
      delete_all_matches: 'Brisanje svih mečeva',
      manual: 'Brisanje',
    };
    return labels[reason] || reason;
  };

  // Group by deletedAt timestamp (round to nearest second) + deleteReason
  const grouped = deletedMatches.reduce((acc, m) => {
    const ts = m.deletedAt?.seconds || 0;
    const roundedTs = Math.round(ts / 5) * 5; // group within 5 seconds
    const key = `${roundedTs}_${m.deleteReason || 'manual'}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const playerName = (p) => {
    if (!p) return '?';
    if (typeof p === 'string') return p;
    return p.name || p.id || '?';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
        <span className="ml-3 text-slate-400 text-sm">Učitavanje...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Recycle Bin</h2>
            <p className="text-slate-400 text-xs">Nedavno obrisani mečevi — možete ih vratiti</p>
          </div>
        </div>
        <button
          onClick={fetchDeleted}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
        >
          <RefreshCw size={13} /> Osvježi
        </button>
      </div>

      {deletedMatches.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-7 h-7 text-emerald-400" />
          </div>
          <p className="text-white font-semibold mb-1">Recycle Bin je prazan</p>
          <p className="text-slate-500 text-xs">Nema obrisanih mečeva za ovo takmičenje.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([key, group]) => {
            const sample = group[0];
            const isKnockout = group.some(m => m.isKnockout);
            const categoryId = sample?.categoryId;
            return (
              <div key={key} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                {/* Group Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-800/40">
                  <div className="flex items-center gap-3">
                    <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${isKnockout ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'}`}>
                      {reasonLabel(sample?.deleteReason)}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Clock size={11} />
                      {formatDate(sample?.deletedAt)}
                    </div>
                    <span className="text-slate-600 text-[11px]">{group.length} mečeva</span>
                  </div>
                  <button
                    onClick={() => handleRestoreAll(group)}
                    disabled={restoringId !== null}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 text-[11px] font-bold uppercase tracking-wide transition-all disabled:opacity-50"
                  >
                    <RotateCcw size={12} /> Vrati sve ({group.length})
                  </button>
                </div>

                {/* Match list */}
                <div className="divide-y divide-slate-800/60">
                  {group.map(item => (
                    <div key={item.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/30 transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.isKnockout ? 'bg-amber-400' : 'bg-blue-400'}`}></span>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-semibold truncate">
                            {playerName(item.player1)} <span className="text-slate-500">vs</span> {playerName(item.player2)}
                          </p>
                          <p className="text-slate-500 text-[11px]">
                            {item.isKnockout ? `KO • ${item.roundName || item.round || ''}` : `Grupa ${item.groupIndex !== undefined ? item.groupIndex + 1 : item.groupId || ''}`}
                            {item.player1Score !== undefined && item.player2Score !== undefined && (
                              <span className="ml-2 text-slate-400">
                                {item.player1Score}:{item.player2Score}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRestore(item)}
                        disabled={restoringId === item.id}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-emerald-600/20 hover:text-emerald-400 text-slate-300 text-[11px] font-semibold transition-all disabled:opacity-50 ml-4"
                      >
                        {restoringId === item.id ? <RefreshCw size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                        Vrati
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-amber-300/80 text-xs leading-relaxed">
          Mečevi se čuvaju u recycle bin-u dok ih ne obrišete trajno. Vraćeni mečevi se automatski ponovo pojavljuju na takmičenju.
        </p>
      </div>
    </div>
  );
};

export default RecycleBin;
