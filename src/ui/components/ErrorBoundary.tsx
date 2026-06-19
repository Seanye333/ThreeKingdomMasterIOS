import { Component, type ReactNode } from 'react';

interface Props {
  /** Friendly name shown to the user when this boundary catches an error. */
  fallbackLabel?: string;
  /** Optional escape hatch — e.g. "退出戰鬥" when the battle scene crashes,
   *  so the player is never trapped (Retry may just re-crash, and Reload
   *  restores the same persisted state). */
  escapeAction?: { label: string; onClick: () => void };
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches any render-time exception in its subtree and shows a fallback
 * panel instead of letting the whole page go blank.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }): void {
    // eslint-disable-next-line no-console
    console.error('[TKM error boundary]', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            background: '#1b2531',
            border: '1px solid #b8442e',
            color: '#e6edf3',
            padding: '1rem 1.5rem',
            margin: '1rem',
            fontFamily: 'var(--tkm-font-body)',
          }}
        >
          <div style={{ fontSize: '1.1rem', color: '#b8442e', letterSpacing: '0.07rem' }}>
            ⚠ {this.props.fallbackLabel ?? 'A panel crashed'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#aab6c0', marginTop: '0.5rem', fontFamily: 'ui-monospace, monospace' }}>
            {this.state.error.message}
          </div>
          <div style={{ marginTop: '0.7rem' }}>
            <button
              onClick={() => this.setState({ error: null })}
              style={{
                background: '#26323e',
                border: '1px solid #e6c473',
                color: '#e6c473',
                padding: '0.3rem 0.8rem',
                fontFamily: 'inherit',
                cursor: 'pointer',
                marginRight: '0.5rem',
              }}
            >
              Retry
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'none',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                color: '#aab6c0',
                padding: '0.3rem 0.8rem',
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              Reload page
            </button>
            {this.props.escapeAction && (
              <button
                onClick={this.props.escapeAction.onClick}
                style={{
                  background: '#3a1a16',
                  border: '1px solid #b8584a',
                  color: '#f0c0b0',
                  padding: '0.3rem 0.8rem',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  marginLeft: '0.5rem',
                }}
              >
                {this.props.escapeAction.label}
              </button>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
