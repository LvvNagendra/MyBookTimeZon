import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = { children: ReactNode };

type State = { hasError: boolean; message: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message || "Something went wrong." };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("[SalonGo]", err, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <main id="main" className="section page-pad page-narrow" style={{ minHeight: "60vh" }}>
          <h1 className="page-title">Something broke</h1>
          <p className="text-muted">{this.state.message}</p>
          <p className="text-muted small">Try reloading the page. If this keeps happening after deploy, contact support with the time and screen you were on.</p>
          <div className="stack-gap" style={{ marginTop: "1.5rem" }}>
            <button type="button" className="btn btn--gold btn--wide" onClick={() => window.location.reload()}>
              Reload page
            </button>
            <Link to="/home" className="btn btn--ghost btn--wide">
              Back to home
            </Link>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
