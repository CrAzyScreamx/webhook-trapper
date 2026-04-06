import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <pre style={{ color: 'red', padding: 24, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
          {this.state.error.message}{'\n\n'}{this.state.error.stack}
        </pre>
      );
    }
    return this.props.children;
  }
}
