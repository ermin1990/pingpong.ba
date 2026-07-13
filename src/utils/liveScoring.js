/**
 * Point-by-point live scoring engine for a padel/tennis-style match:
 * points (0/15/30/40 + deuce/advantage) -> games (first to 6, win by 2,
 * tie-break at 6-6) -> sets (best of N, N = config.setsToWin).
 *
 * State is plain data so it can be persisted to Firestore and rehydrated
 * as-is; `applyPoint` is a pure function (no mutation) so it's easy to
 * unit test and to support "undo last point" by keeping prior snapshots.
 */

export const createInitialLiveState = () => ({
  points: [0, 0],   // raw point counts this game (0,1,2,3 = 0/15/30/40, 4+ = deuce/advantage territory)
  games: [0, 0],    // games won in the current set
  sets: [],         // completed sets so far, e.g. [{ p1: 6, p2: 4 }]
  setsWon: [0, 0],
  tiebreak: false,
  status: 'in_progress' // 'in_progress' | 'completed'
});

/**
 * Human-readable label for one side's current point count.
 * Tiebreak points are shown as plain numbers per convention.
 */
export const getPointLabel = (mine, theirs, inTiebreak) => {
  if (inTiebreak) return String(mine);
  if (mine < 3) return ['0', '15', '30'][mine];
  if (mine === theirs) return '40'; // deuce
  if (mine < theirs) return '40';   // trailing in the deuce zone, not yet behind by 2
  return theirs >= 3 ? 'Ad' : '40';
};

/**
 * Applies one point won by `side` (0 or 1) to `state`, returning a new
 * state plus flags describing what just happened, for UI feedback.
 *
 * @param {object} state - current live state (see createInitialLiveState)
 * @param {number} side - 0 or 1, whichever side won the point
 * @param {object} config - { setsToWin: number, noAd?: boolean }
 */
export const applyPoint = (state, side, config = {}) => {
  if (state.status === 'completed') return { state, gameWon: false, setWon: false, matchWon: false };

  const other = side === 0 ? 1 : 0;
  const setsToWin = config.setsToWin ?? 2;
  const noAd = !!config.noAd;

  let gameWon = false;
  let setWon = false;
  let matchWon = false;

  if (state.tiebreak) {
    const points = [...state.points];
    points[side]++;
    const mine = points[side], theirs = points[other];

    if (mine >= 7 && mine - theirs >= 2) {
      // Tiebreak (and therefore the set) is won; record as a 7-6 style set score.
      const games = [0, 0];
      games[side] = state.games[side] + 1;
      games[other] = state.games[other];
      const setEntry = side === 0 ? { p1: games[0], p2: games[1] } : { p1: games[0], p2: games[1] };
      const setsWon = [...state.setsWon];
      setsWon[side]++;
      setWon = true;
      matchWon = setsWon[side] >= setsToWin;

      return {
        state: {
          points: [0, 0],
          games: [0, 0],
          sets: [...state.sets, setEntry],
          setsWon,
          tiebreak: false,
          status: matchWon ? 'completed' : 'in_progress'
        },
        gameWon: true,
        setWon,
        matchWon
      };
    }

    return { state: { ...state, points }, gameWon: false, setWon: false, matchWon: false };
  }

  const points = [...state.points];
  points[side]++;
  const mine = points[side], theirs = points[other];

  const won = noAd ? (mine >= 4 && mine > theirs) : (mine >= 4 && mine - theirs >= 2);
  if (!won) {
    return { state: { ...state, points }, gameWon: false, setWon: false, matchWon: false };
  }

  gameWon = true;
  const games = [...state.games];
  games[side]++;

  // Set decided outright (6-x with x<=4, or 7-5)
  if (games[side] >= 6 && games[side] - games[other] >= 2) {
    const setEntry = { p1: games[0], p2: games[1] };
    const setsWon = [...state.setsWon];
    setsWon[side]++;
    setWon = true;
    matchWon = setsWon[side] >= setsToWin;

    return {
      state: {
        points: [0, 0],
        games: [0, 0],
        sets: [...state.sets, setEntry],
        setsWon,
        tiebreak: false,
        status: matchWon ? 'completed' : 'in_progress'
      },
      gameWon,
      setWon,
      matchWon
    };
  }

  // 6-6: next game is a tiebreak
  if (games[0] === 6 && games[1] === 6) {
    return {
      state: { ...state, points: [0, 0], games, tiebreak: true },
      gameWon,
      setWon: false,
      matchWon: false
    };
  }

  // Set continues
  return {
    state: { ...state, points: [0, 0], games },
    gameWon,
    setWon: false,
    matchWon: false
  };
};
