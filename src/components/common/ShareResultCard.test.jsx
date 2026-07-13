import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ShareResultCard from './ShareResultCard';

describe('ShareResultCard', () => {
  it('renders both player names, scores and the share button', () => {
    const match = {
      player1: { name: 'Ana Anić' },
      player2: { name: 'Berina Berić' },
      player1Score: 2,
      player2Score: 1,
      sets: [{ p1: 6, p2: 4 }, { p1: 4, p2: 6 }, { p1: 6, p2: 3 }]
    };
    render(<ShareResultCard match={match} competitionName="Tuzlanska Biznis Liga" />);

    expect(screen.getByText('Ana Anić')).toBeInTheDocument();
    expect(screen.getByText('Berina Berić')).toBeInTheDocument();
    expect(screen.getByText('Tuzlanska Biznis Liga')).toBeInTheDocument();
    expect(screen.getByText('Podijeli Rezultat')).toBeInTheDocument();
  });

  it('falls back to provided team/pair labels when player objects are absent', () => {
    const match = { player1Score: 2, player2Score: 0 };
    render(<ShareResultCard match={match} label1="Firma X" label2="Firma Y" />);

    expect(screen.getByText('Firma X')).toBeInTheDocument();
    expect(screen.getByText('Firma Y')).toBeInTheDocument();
  });

  it('does not crash when sets are missing', () => {
    const match = { player1: { name: 'Ana' }, player2: { name: 'Berina' }, player1Score: 2, player2Score: 0 };
    expect(() => render(<ShareResultCard match={match} />)).not.toThrow();
  });

  it('shows who actually played under the team name for team-mode league matches', () => {
    const match = {
      player1: { name: 'Firma X' },
      player2: { name: 'Firma Y' },
      player1Score: 2,
      player2Score: 0,
      lineup1: [{ id: 'p1', name: 'Ana Anić' }, { id: 'p2', name: 'Berina Berić' }],
      lineup2: [{ id: 'p3', name: 'Ceca Cerić' }]
    };
    render(<ShareResultCard match={match} />);

    expect(screen.getByText('Firma X')).toBeInTheDocument();
    expect(screen.getByText('Ana Anić, Berina Berić')).toBeInTheDocument();
    expect(screen.getByText('Ceca Cerić')).toBeInTheDocument();
  });
});
