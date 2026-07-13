import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

const Bomb = () => {
  throw new Error('boom');
};

describe('ErrorBoundary', () => {
  it('renders children normally when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>Sve radi</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('Sve radi')).toBeInTheDocument();
  });

  it('shows a recovery screen instead of crashing when a child throws', () => {
    // React logs the caught error to the console by default; silence it for this test.
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );

    expect(screen.getByText('Nešto je pošlo po zlu')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});
