import { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase/config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { X, Undo2, Trophy } from 'lucide-react';
import { createInitialLiveState, applyPoint, getPointLabel } from '../../utils/liveScoring';

// Full-screen point-by-point scorer for a referee/organizer standing at the
// court: two giant tap zones, live 0/15/30/40-Ad + tie-break scoring, and an
// undo for mis-taps. Every point is persisted immediately so the match
// documents (and anything reading them - match cards, standings, the
// share-result card) update in real time, not just on a final "save".
const LiveScoringModal = ({ show, match, onClose, onScoreUpdate, setsToWin = 2, noAd = false }) => {
  const [liveState, setLiveState] = useState(createInitialLiveState());
  const [flash, setFlash] = useState(null);
  const historyRef = useRef([]);
  const flashTimeoutRef = useRef(null);

  useEffect(() => {
    if (!show || !match) return;
    const seeded = match.liveScore || {
      ...createInitialLiveState(),
      sets: match.sets || [],
      setsWon: [match.player1Score || 0, match.player2Score || 0]
    };
    setLiveState(seeded);
    historyRef.current = [];
  }, [show, match?.id]);

  if (!show || !match) return null;

  const toMatchFields = (newState) => ({
    liveScore: newState,
    sets: newState.sets,
    player1Score: newState.setsWon[0],
    player2Score: newState.setsWon[1],
    status: newState.status === 'completed' ? 'completed' : 'in_progress'
  });

  const persist = async (newState) => {
    // Update the modal behind this one immediately - it holds its own local
    // copy of the match and won't otherwise learn about a live score until
    // its parent's Firestore listener happens to refire.
    onScoreUpdate?.(toMatchFields(newState));
    try {
      await updateDoc(doc(db, 'matches', match.id), {
        ...toMatchFields(newState),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
      alert('Greška pri spašavanju poena - provjerite konekciju.');
    }
  };

  const showFlash = (text) => {
    clearTimeout(flashTimeoutRef.current);
    setFlash(text);
    flashTimeoutRef.current = setTimeout(() => setFlash(null), 1400);
  };

  const handlePoint = (side) => {
    if (liveState.status === 'completed') return;
    historyRef.current.push(liveState);
    const { state, gameWon, setWon, matchWon } = applyPoint(liveState, side, { setsToWin, noAd });
    setLiveState(state);
    persist(state);

    if (matchWon) showFlash('MEČ ZAVRŠEN!');
    else if (setWon) showFlash('SET!');
    else if (gameWon) showFlash('GEM!');
  };

  const handleUndo = () => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    setLiveState(prev);
    persist(prev);
  };

  const name1 = match.player1?.name || 'Igrač 1';
  const name2 = match.player2?.name || 'Igrač 2';
  const isMatchOver = liveState.status === 'completed';

  return (
    <div className="fixed inset-0 z-[200] bg-[#070b14] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
        <button
          onClick={handleUndo}
          disabled={historyRef.current.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 disabled:opacity-30 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
        >
          <Undo2 size={14} /> Poništi
        </button>
        <div className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em]">Uživo Bodovanje</div>
        <button onClick={onClose} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all">
          <X size={18} />
        </button>
      </div>

      {/* Sets summary */}
      <div className="flex items-center justify-center gap-3 py-3 border-b border-white/5 shrink-0">
        {liveState.sets.map((s, i) => (
          <div key={i} className="px-3 py-1 rounded-lg bg-white/5 text-slate-400 text-xs font-bold">
            {s.p1}-{s.p2}
          </div>
        ))}
        {liveState.tiebreak && (
          <div className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-widest">
            Tie-Break
          </div>
        )}
      </div>

      {/* Flash toast */}
      {flash && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 bg-amber-400 text-black font-black uppercase italic tracking-widest px-8 py-3 rounded-full shadow-2xl animate-in fade-in zoom-in-95">
          {flash}
        </div>
      )}

      {isMatchOver ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Trophy size={40} />
          </div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Meč Završen</h2>
          <p className="text-slate-400 font-medium">
            {liveState.setsWon[0] > liveState.setsWon[1] ? name1 : name2} pobjeđuje {liveState.setsWon[0]}:{liveState.setsWon[1]} u setovima
          </p>
          <button
            onClick={onClose}
            className="px-10 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase italic tracking-widest rounded-xl transition-all"
          >
            Zatvori
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row">
          {[0, 1].map(side => {
            const name = side === 0 ? name1 : name2;
            const otherSide = side === 0 ? 1 : 0;
            const label = getPointLabel(liveState.points[side], liveState.points[otherSide], liveState.tiebreak);
            const accent = side === 0
              ? { text: 'text-amber-400', hoverBg: 'hover:bg-amber-500/[0.05] active:bg-amber-500/[0.09]', bar: 'bg-amber-400' }
              : { text: 'text-lime-400', hoverBg: 'hover:bg-lime-500/[0.05] active:bg-lime-500/[0.09]', bar: 'bg-lime-400' };
            return (
              <button
                key={side}
                onClick={() => handlePoint(side)}
                className={`relative flex-1 flex flex-col items-center justify-center gap-4 p-8 border-b md:border-b-0 md:border-r last:border-0 border-white/5 transition-all group ${accent.hoverBg}`}
              >
                <div className={`absolute top-0 left-0 right-0 h-1 md:h-full md:w-1 md:right-auto ${accent.bar} opacity-60`} />
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-black text-white">{liveState.games[side]}</span>
                  <span className="text-xs text-slate-600 font-bold uppercase tracking-widest">Gemova</span>
                </div>
                <div className={`text-8xl md:text-9xl font-black tabular-nums leading-none group-active:scale-95 transition-transform ${accent.text}`}>
                  {label}
                </div>
                <div className="text-lg md:text-xl font-black text-white uppercase italic tracking-tight text-center max-w-xs truncate">
                  {name}
                </div>
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Dodirni za poen</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LiveScoringModal;
