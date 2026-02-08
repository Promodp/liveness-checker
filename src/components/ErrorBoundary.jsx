import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Update state so the next render will show the fallback UI
    this.setState({
      error,
      errorInfo,
    });

    // Log error details for debugging
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
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
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            fontFamily: "Arial, sans-serif",
            backgroundColor: "#fee",
            borderRadius: "8px",
            margin: "20px",
            minHeight: "300px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <h1 style={{ color: "#c00", marginBottom: "20px" }}>
            😞 Something went wrong
          </h1>

          <div
            style={{
              backgroundColor: "#f0f0f0",
              padding: "20px",
              borderRadius: "6px",
              marginBottom: "20px",
              maxWidth: "600px",
              textAlign: "left",
              fontSize: "14px",
              color: "#333",
              border: "1px solid #ddd",
            }}
          >
            <h2 style={{ marginTop: 0, color: "#c00" }}>Error Details:</h2>
            <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
              {this.state.error && this.state.error.toString()}
            </p>

            {process.env.NODE_ENV === "development" && (
              <details
                style={{
                  marginTop: "15px",
                  padding: "10px",
                  backgroundColor: "#fff",
                  borderRadius: "4px",
                }}
              >
                <summary
                  style={{
                    cursor: "pointer",
                    fontWeight: "bold",
                    color: "#666",
                  }}
                >
                  📋 Stack Trace (Development Only)
                </summary>
                <pre
                  style={{
                    marginTop: "10px",
                    overflow: "auto",
                    fontSize: "12px",
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                  }}
                >
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>

          <button
            onClick={this.handleReset}
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              marginRight: "10px",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#0056b3")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#007bff")}
          >
            🔄 Try Again
          </button>

          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#545b62")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#6c757d")}
          >
            🔃 Reload Page
          </button>

          <p style={{ marginTop: "20px", color: "#666", fontSize: "14px" }}>
            If the problem persists, please contact support or reload the page.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
