import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PublicLeagueView from './PublicLeagueView';

describe('PublicLeagueView', () => {
  it('shows a friendly placeholder when no schedule has been generated yet', () => {
    render(<PublicLeagueView competition={{ participants: [] }} allMatches={[]} />);
    expect(screen.getByText('Liga uskoro počinje')).toBeInTheDocument();
  });

  it('builds standings and a match list from competition.participants + matches, regardless of participant mode', () => {
    // Participants here happen to be team entries, but the view doesn't care -
    // it's the same { id, name } shape for singles/doubles/teams leagues.
    const competition = {
      participants: [{ id: 't1', name: 'Firma X' }, { id: 't2', name: 'Firma Y' }],
      settings: { pointsWin: 2, pointsLoss: 0 }
    };
    const allMatches = [
      {
        id: 'm1', round: 1, status: 'completed',
        player1: { id: 't1', name: 'Firma X' }, player2: { id: 't2', name: 'Firma Y' },
        player1Score: 2, player2Score: 0
      }
    ];
    render(<PublicLeagueView competition={competition} allMatches={allMatches} />);

    // Standings: Firma X should be ranked above Firma Y (won the only match)
    const names = screen.getAllByText(/Firma [XY]/).map(el => el.textContent);
    expect(names[0]).toBe('Firma X');

    // Match list renders too
    expect(screen.getByText('Kolo 1')).toBeInTheDocument();
  });
});
