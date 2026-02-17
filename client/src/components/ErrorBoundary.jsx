import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8 text-foreground">
          <div className="max-w-2xl bg-card p-8 rounded-3xl shadow-xl border border-destructive/20 selection:bg-destructive selection:text-destructive-foreground">
            <h1 className="text-3xl font-serif font-bold text-destructive mb-4 tracking-tight">Something went wrong.</h1>
            <p className="mb-6 text-muted-foreground font-medium">The application encountered an unexpected error. Don't worry, your data is safe.</p>
            <details className="bg-muted/30 p-4 rounded-2xl overflow-auto max-h-64 text-sm font-mono whitespace-pre-wrap border border-border/50 text-muted-foreground">
              <summary className="cursor-pointer font-bold mb-2 text-foreground">Error Details</summary>
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </details>
            <button 
              onClick={() => window.location.href = '/'}
              className="mt-8 px-8 py-3 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-all font-bold shadow-lg shadow-primary/20 active:scale-95"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
