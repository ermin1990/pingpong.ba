import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PublicGroupMatches from './PublicGroupMatches';

describe('PublicGroupMatches', () => {
  it('renders team names without a lineup line when none is set', () => {
    const matches = [{
      id: 'm1', round: 1, status: 'completed',
      player1: { name: 'Ana' }, player2: { name: 'Berina' },
      player1Score: 2, player2Score: 0
    }];
    render(<PublicGroupMatches matches={matches} />);
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Berina')).toBeInTheDocument();
  });

  it('shows who actually played under the team name when a lineup is recorded', () => {
    const matches = [{
      id: 'm1', round: 1, status: 'completed',
      player1: { name: 'Firma X' }, player2: { name: 'Firma Y' },
      player1Score: 2, player2Score: 0,
      lineup1: [{ id: 'p1', name: 'Ana Anić' }, { id: 'p2', name: 'Berina Berić' }],
      lineup2: [{ id: 'p3', name: 'Ceca Cerić' }]
    }];
    render(<PublicGroupMatches matches={matches} />);

    expect(screen.getByText('Firma X')).toBeInTheDocument();
    expect(screen.getByText('Ana Anić, Berina Berić')).toBeInTheDocument();
    expect(screen.getByText('Firma Y')).toBeInTheDocument();
    expect(screen.getByText('Ceca Cerić')).toBeInTheDocument();
  });
});
