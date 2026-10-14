import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error("Haven UI error", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="error-boundary container">
        <span className="eyebrow">Something went wrong</span>
        <h1>We couldn’t load this page.</h1>
        <p>Please refresh the page and try again. Your saved shortlist is kept on this device.</p>
        <button type="button" className="dark-btn" onClick={() => window.location.reload()}>Refresh page</button>
      </main>
    );
  }
}
