import { Component } from "react";
import { TriangleAlert } from "lucide-react";

// If a page crashes while rendering, show a friendly message instead of a blank screen.
// React only supports this with a class component, so this is the one class in the app.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="empty-state">
          <TriangleAlert />
          <h1>Something went wrong</h1>
          <p>Please reload the page and try again.</p>
          <button onClick={() => window.location.reload()}>Reload page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
