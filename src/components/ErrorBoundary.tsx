import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * App-wide error boundary so a single render throw (e.g. malformed synced data)
 * shows a recoverable screen instead of a blank white page.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // Surfaced for diagnostics; the UI below handles recovery.
    console.error("App crashed:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-bg px-6 text-center">
          <div className="max-w-sm space-y-4">
            <img src="/logo.png" alt="MonkMode" className="mx-auto h-16 w-16 object-contain opacity-80" />
            <h1 className="text-xl font-bold">Something went wrong</h1>
            <p className="text-sm text-ink-mute">
              The app hit an unexpected error. Your data is saved — reloading usually fixes it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary w-full py-3"
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
