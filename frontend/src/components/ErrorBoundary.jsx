import React from 'react';

/**
 * Error Boundary component to catch errors in child components
 * and prevent the entire app from crashing.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Log to Sentry or error tracking service if available
    if (window.Sentry) {
      window.Sentry.captureException(error, { contexts: { react: errorInfo } });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#0a0e27',
          padding: '20px',
        }}>
          <div style={{
            maxWidth: '500px',
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#1a1f3a',
            borderRadius: '8px',
            border: '1px solid #d32f2f',
          }}>
            <h1 style={{ color: '#d32f2f', marginBottom: '16px', fontSize: '24px' }}>
              Something went wrong
            </h1>
            <p style={{
              color: '#b0bec5',
              marginBottom: '20px',
              lineHeight: '1.6',
              fontSize: '14px',
            }}>
              We encountered an unexpected error. Our team has been notified automatically.
            </p>

            {this.state.error && (
              <details style={{
                marginBottom: '20px',
                textAlign: 'left',
                padding: '12px',
                backgroundColor: '#0a0e27',
                borderRadius: '4px',
                border: '1px solid #455a64',
              }}>
                <summary style={{
                  cursor: 'pointer',
                  color: '#90caf9',
                  marginBottom: '8px',
                  fontWeight: 500,
                }}>
                  Error details (development only)
                </summary>
                <pre style={{
                  color: '#f5f5f5',
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '200px',
                  margin: '8px 0 0 0',
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4f46e5',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#4338ca'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#4f46e5'}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#455a64',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#37474f'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#455a64'}
              >
                Go Home
              </button>
            </div>

            <p style={{
              color: '#78909c',
              fontSize: '12px',
              marginTop: '20px',
            }}>
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
