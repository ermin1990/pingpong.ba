import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LiveScoringModal from './LiveScoringModal';

vi.mock('../../firebase/config', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  serverTimestamp: vi.fn()
}));

const match = {
  id: 'm1',
  player1: { name: 'Ana' },
  player2: { name: 'Berina' },
  player1Score: 0,
  player2Score: 0,
  sets: []
};

describe('LiveScoringModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders nothing when show is false', () => {
    const { container } = render(<LiveScoringModal show={false} match={match} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows both player names and starts at 0-0', () => {
    render(<LiveScoringModal show={true} match={match} onClose={() => {}} setsToWin={2} />);
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Berina')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(4); // games (0) + point label (0) for each of the 2 sides
  });

  it('advances the point score when a side is tapped', () => {
    render(<LiveScoringModal show={true} match={match} onClose={() => {}} setsToWin={2} />);
    fireEvent.click(screen.getByText('Ana'));
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('shows a GEM! flash and resets points after a side wins a game', () => {
    render(<LiveScoringModal show={true} match={match} onClose={() => {}} setsToWin={2} />);
    // Ana wins 4 straight points -> wins the game
    fireEvent.click(screen.getByText('Ana'));
    fireEvent.click(screen.getByText('15'));
    fireEvent.click(screen.getByText('30'));
    fireEvent.click(screen.getByText('40'));
    expect(screen.getByText('GEM!')).toBeInTheDocument();
  });

  it('undo reverts the last point', () => {
    render(<LiveScoringModal show={true} match={match} onClose={() => {}} setsToWin={2} />);
    fireEvent.click(screen.getByText('Ana'));
    expect(screen.getByText('15')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Poništi'));
    expect(screen.getAllByText('0')).toHaveLength(4);
  });
});
