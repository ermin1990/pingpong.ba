import { describe, it, expect } from 'vitest';
import { generateBergerMatches } from './berger';

const players = (n) =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `Player ${i + 1}` }));

describe('generateBergerMatches', () => {
  it('generates n-1 rounds for an even number of participants', () => {
    const rounds = generateBergerMatches(players(4));
    expect(rounds).toHaveLength(3);
    rounds.forEach(round => expect(round.matches).toHaveLength(2));
  });

  it('generates n rounds for an odd number of participants (bye round included)', () => {
    const rounds = generateBergerMatches(players(5));
    // n is padded to 6 internally (5 + bye), so n-1 = 5 rounds
    expect(rounds).toHaveLength(5);
    // one participant sits out each round because of the bye
    rounds.forEach(round => expect(round.matches).toHaveLength(2));
  });

  it('never schedules a player against the bye slot', () => {
    const rounds = generateBergerMatches(players(5));
    const allMatches = rounds.flatMap(r => r.matches);
    allMatches.forEach(m => {
      expect(m.player1.id).not.toBe('bye');
      expect(m.player2.id).not.toBe('bye');
    });
  });

  it('has every pair of participants play each other exactly once (round robin)', () => {
    const ps = players(6);
    const rounds = generateBergerMatches(ps);
    const allMatches = rounds.flatMap(r => r.matches);

    const pairKey = (a, b) => [a, b].sort().join('-');
    const seen = new Set();
    allMatches.forEach(m => {
      const key = pairKey(m.player1.id, m.player2.id);
      expect(seen.has(key)).toBe(false); // no pair repeats
      seen.add(key);
    });

    // total distinct pairs for n participants = n*(n-1)/2
    const n = ps.length;
    expect(seen.size).toBe((n * (n - 1)) / 2);
  });

  it('does not mutate the input array', () => {
    const ps = players(4);
    const copy = [...ps];
    generateBergerMatches(ps);
    expect(ps).toEqual(copy);
  });
});
