import { describe, it, expect } from 'vitest';
import { createInitialLiveState, applyPoint, getPointLabel } from './liveScoring';

const play = (state, sequence, config) => {
  let s = state;
  let last = { state: s, gameWon: false, setWon: false, matchWon: false };
  sequence.forEach(side => {
    last = applyPoint(last.state, side, config);
  });
  return last;
};

describe('getPointLabel', () => {
  it('maps 0/1/2 to 0/15/30', () => {
    expect(getPointLabel(0, 0, false)).toBe('0');
    expect(getPointLabel(1, 0, false)).toBe('15');
    expect(getPointLabel(2, 1, false)).toBe('30');
  });

  it('shows 40 for both sides at deuce (3-3)', () => {
    expect(getPointLabel(3, 3, false)).toBe('40');
  });

  it('shows Ad for whoever is ahead past deuce, 40 for the other side', () => {
    expect(getPointLabel(4, 3, false)).toBe('Ad');
    expect(getPointLabel(3, 4, false)).toBe('40');
  });

  it('shows plain numbers during a tiebreak regardless of value', () => {
    expect(getPointLabel(5, 3, true)).toBe('5');
  });
});

describe('applyPoint - game scoring', () => {
  it('wins a game at 4 points with a 2+ point lead (e.g. 40-15 -> game)', () => {
    const result = play(createInitialLiveState(), [0, 0, 0, 1, 0], { setsToWin: 2 });
    expect(result.gameWon).toBe(true);
    expect(result.state.games).toEqual([1, 0]);
    expect(result.state.points).toEqual([0, 0]);
  });

  it('does not win at deuce with only a 1-point lead (advantage, not game)', () => {
    // 3 points each (deuce), then side 0 scores once -> advantage, not a win yet
    const result = play(createInitialLiveState(), [0, 1, 0, 1, 0, 1, 0], { setsToWin: 2 });
    expect(result.gameWon).toBe(false);
    expect(result.state.games).toEqual([0, 0]);
  });

  it('wins the game after reaching a 2-point lead from deuce', () => {
    // deuce (3-3), side 0 gets advantage, then wins it
    const result = play(createInitialLiveState(), [0, 1, 0, 1, 0, 1, 0, 0], { setsToWin: 2 });
    expect(result.gameWon).toBe(true);
    expect(result.state.games).toEqual([1, 0]);
  });

  it('golden point (noAd): the very next point after deuce wins the game', () => {
    const result = play(createInitialLiveState(), [0, 1, 0, 1, 0, 1, 0], { setsToWin: 2, noAd: true });
    expect(result.gameWon).toBe(true);
    expect(result.state.games).toEqual([1, 0]);
  });
});

describe('applyPoint - set scoring', () => {
  const winGame = (side) => Array(4).fill(side);

  it('wins a set 6-0', () => {
    let state = createInitialLiveState();
    let result;
    for (let i = 0; i < 6; i++) {
      result = play(state, winGame(0), { setsToWin: 2 });
      state = result.state;
    }
    expect(result.setWon).toBe(true);
    expect(result.state.sets).toEqual([{ p1: 6, p2: 0 }]);
    expect(result.state.setsWon).toEqual([1, 0]);
    expect(result.state.games).toEqual([0, 0]);
  });

  it('enters a tiebreak at 6-6 instead of ending the set', () => {
    let state = createInitialLiveState();
    let result = { state };
    // Alternate game wins so neither side gets a 2-game lead before 6-6
    for (let i = 0; i < 6; i++) {
      result = play(result.state, winGame(0), { setsToWin: 2 });
      result = play(result.state, winGame(1), { setsToWin: 2 });
    }
    expect(result.state.games).toEqual([6, 6]);
    expect(result.state.tiebreak).toBe(true);
    expect(result.state.sets).toEqual([]); // set not recorded yet - still being decided
  });

  it('wins the set 7-6 via tiebreak (first to 7, win by 2)', () => {
    let state = createInitialLiveState();
    let result = { state };
    for (let i = 0; i < 6; i++) {
      result = play(result.state, winGame(0), { setsToWin: 2 });
      result = play(result.state, winGame(1), { setsToWin: 2 });
    }
    expect(result.state.tiebreak).toBe(true);

    result = play(result.state, [0, 0, 0, 0, 0, 0, 0], { setsToWin: 2 }); // 7-0 in the breaker
    expect(result.setWon).toBe(true);
    expect(result.state.sets).toEqual([{ p1: 7, p2: 6 }]);
    expect(result.state.tiebreak).toBe(false);
  });
});

describe('applyPoint - match scoring', () => {
  it('completes the match once a side reaches setsToWin sets', () => {
    let state = createInitialLiveState();
    let result = { state };
    // Win 2 sets 6-0 each for side 0, with setsToWin = 2
    for (let set = 0; set < 2; set++) {
      for (let g = 0; g < 6; g++) {
        result = play(result.state, [0, 0, 0, 0], { setsToWin: 2 });
      }
    }
    expect(result.matchWon).toBe(true);
    expect(result.state.status).toBe('completed');
    expect(result.state.setsWon).toEqual([2, 0]);
    expect(result.state.sets).toEqual([{ p1: 6, p2: 0 }, { p1: 6, p2: 0 }]);
  });

  it('ignores further points once the match is already completed', () => {
    let state = createInitialLiveState();
    let result = { state };
    for (let set = 0; set < 2; set++) {
      for (let g = 0; g < 6; g++) result = play(result.state, [0, 0, 0, 0], { setsToWin: 2 });
    }
    const finished = result.state;
    const after = applyPoint(finished, 1, { setsToWin: 2 });
    expect(after.state).toEqual(finished);
    expect(after.matchWon).toBe(false);
  });
});
