import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Catches render/lifecycle errors in its subtree so one broken component
// (missing prop, bad data shape, etc.) shows a recoverable screen instead of
// blanking the entire app. Error boundaries must be class components - React
// has no hook equivalent for componentDidCatch/getDerivedStateFromError.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-lg font-black text-white uppercase italic tracking-tight mb-2">
              Nešto je pošlo po zlu
            </h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Ova stranica je naišla na grešku. Osvježite stranicu - ako se greška ponavlja, javite nam.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-widest text-xs py-3 rounded-xl transition-all"
            >
              <RefreshCw size={14} /> Osvježi Stranicu
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
