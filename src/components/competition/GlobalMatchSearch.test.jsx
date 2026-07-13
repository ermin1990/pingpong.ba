import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import GlobalMatchSearch from './GlobalMatchSearch';

// Regression test for a real crash: LeagueDetails.jsx renders this component
// without passing `tables`/`searchTableId`/`categories` (leagues have no courts),
// which used to throw "Cannot read properties of undefined (reading 'map')".
describe('GlobalMatchSearch', () => {
  it('renders without crashing when optional props are omitted', () => {
    render(
      <GlobalMatchSearch
        matchSearchQuery=""
        setMatchSearchQuery={() => {}}
        setEditingMatch={() => {}}
        setShowMatchModal={() => {}}
      />
    );
    expect(screen.getByText('Brza Pretraga')).toBeInTheDocument();
    expect(screen.getByText('Svi tereni')).toBeInTheDocument();
  });

  it('renders provided tables as select options', () => {
    render(
      <GlobalMatchSearch
        matchSearchQuery=""
        setMatchSearchQuery={() => {}}
        searchTableId=""
        setSearchTableId={() => {}}
        tables={[{ id: 't1', name: 'Teren 1' }]}
        setEditingMatch={() => {}}
        setShowMatchModal={() => {}}
      />
    );
    expect(screen.getByText('Teren 1')).toBeInTheDocument();
  });

  it('shows search results when a query is present', () => {
    const match = {
      id: 'm1', status: 'completed', categoryId: 'c1',
      player1: { name: 'Ana' }, player1Score: 2,
      player2: { name: 'Berina' }, player2Score: 0
    };
    render(
      <GlobalMatchSearch
        matchSearchQuery="Ana"
        setMatchSearchQuery={() => {}}
        filteredGlobalMatches={[match]}
        categories={[{ id: 'c1', name: 'Grupa A' }]}
        setEditingMatch={vi.fn()}
        setShowMatchModal={vi.fn()}
      />
    );
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Berina')).toBeInTheDocument();
  });
});
