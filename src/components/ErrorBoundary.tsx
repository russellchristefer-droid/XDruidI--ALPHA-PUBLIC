import { Component, type ErrorInfo, type ReactNode } from "react";
import { logError } from "@/game/errorLog";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean; message: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message || "Unexpected failure" };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    logError(err, `react:${info.componentStack?.slice(0, 200) || "render"}`);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{ padding: 24, color: "#e07a5f", fontFamily: "monospace", background: "#1a120c" }}>
          <h2>The yard stumbled.</h2>
          <p>{this.state.message}</p>
          <p>A defect has been filed. Reload to continue. Your save is intact.</p>
          <button type="button" onClick={() => location.reload()}>
            Reload the homestead
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
