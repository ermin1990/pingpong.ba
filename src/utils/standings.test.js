import { describe, it, expect } from 'vitest';
import { calculateStandings, initPlayerStats, updateStatsFromMatch, calculateSeasonStandings } from './standings';

describe('initPlayerStats', () => {
  it('creates a zeroed stats object for a player', () => {
    const stats = initPlayerStats({ id: 'p1', name: 'Ana', club: 'STK Tuzla' });
    expect(stats).toEqual({
      id: 'p1', name: 'Ana', club: 'STK Tuzla',
      played: 0, won: 0, lost: 0, setsWon: 0, setsLost: 0, points: 0, pointDiff: 0
    });
  });
});

describe('updateStatsFromMatch', () => {
  it('records a win with sets and point difference for player1', () => {
    const stats = initPlayerStats({ id: 'p1', name: 'Ana' });
    const match = {
      player1Score: 2, player2Score: 0,
      sets: [{ p1: 6, p2: 4 }, { p1: 6, p2: 3 }]
    };
    updateStatsFromMatch(stats, match, true, 2, 0);

    expect(stats.played).toBe(1);
    expect(stats.won).toBe(1);
    expect(stats.lost).toBe(0);
    expect(stats.points).toBe(2);
    expect(stats.setsWon).toBe(2);
    expect(stats.setsLost).toBe(0);
    expect(stats.pointDiff).toBe(5); // (6-4) + (6-3)
  });

  it('records a loss for player2 with no points awarded', () => {
    const stats = initPlayerStats({ id: 'p2', name: 'Berina' });
    const match = {
      player1Score: 2, player2Score: 0,
      sets: [{ p1: 6, p2: 4 }, { p1: 6, p2: 3 }]
    };
    updateStatsFromMatch(stats, match, false, 2, 0);

    expect(stats.won).toBe(0);
    expect(stats.lost).toBe(1);
    expect(stats.points).toBe(0);
    expect(stats.pointDiff).toBe(-5);
  });
});

describe('calculateStandings', () => {
  it('sorts by points first', () => {
    const stats = [
      { id: 'a', points: 2, setsWon: 2, setsLost: 0, pointDiff: 5, won: 1 },
      { id: 'b', points: 4, setsWon: 2, setsLost: 0, pointDiff: 1, won: 2 }
    ];
    const sorted = calculateStandings(stats);
    expect(sorted.map(s => s.id)).toEqual(['b', 'a']);
  });

  it('falls back to set difference when points are tied', () => {
    const stats = [
      { id: 'a', points: 2, setsWon: 2, setsLost: 1, pointDiff: 0, won: 1 },
      { id: 'b', points: 2, setsWon: 3, setsLost: 0, pointDiff: 0, won: 1 }
    ];
    const sorted = calculateStandings(stats);
    expect(sorted.map(s => s.id)).toEqual(['b', 'a']);
  });

  it('falls back to head-to-head result as a final tiebreaker', () => {
    const stats = [
      { id: 'a', points: 2, setsWon: 2, setsLost: 0, pointDiff: 0, won: 1 },
      { id: 'b', points: 2, setsWon: 2, setsLost: 0, pointDiff: 0, won: 1 }
    ];
    const matches = [{
      status: 'completed',
      player1: { id: 'b' }, player2: { id: 'a' },
      player1Score: 2, player2Score: 0
    }];
    const sorted = calculateStandings(stats, matches);
    expect(sorted.map(s => s.id)).toEqual(['b', 'a']);
  });
});

describe('calculateSeasonStandings', () => {
  it('awards win points and sorts by total points descending', () => {
    const matches = [
      { status: 'completed', player1: { id: 'p1', name: 'Ana' }, player2: { id: 'p2', name: 'Berina' }, player1Score: 2, player2Score: 0 },
      { status: 'completed', player1: { id: 'p1', name: 'Ana' }, player2: { id: 'p2', name: 'Berina' }, player1Score: 2, player2Score: 1 }
    ];
    const result = calculateSeasonStandings([], matches, { winInGroup: 5 });
    expect(result[0]).toMatchObject({ id: 'p1', winPoints: 10, totalPoints: 10 });
  });

  it('adds bonus points from final tournament rankings', () => {
    const rankings = [['p1', 'p2']];
    const result = calculateSeasonStandings(rankings, [], null);
    const p1 = result.find(p => p.id === 'p1');
    const p2 = result.find(p => p.id === 'p2');
    expect(p1.bonusPoints).toBe(50); // 1st place default bonus
    expect(p2.bonusPoints).toBe(40); // 2nd place default bonus
    expect(p1.totalPoints).toBeGreaterThan(p2.totalPoints);
  });

  it('ignores unfinished matches and tbd placements', () => {
    const matches = [{ status: 'pending', player1: { id: 'p1' }, player2: { id: 'p2' }, player1Score: 0, player2Score: 0 }];
    const rankings = [['tbd', 'p2']];
    const result = calculateSeasonStandings(rankings, matches, null);
    expect(result.find(p => p.id === 'p1')).toBeUndefined();
  });
});
