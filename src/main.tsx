import { createRoot } from 'react-dom/client'
import React, { ErrorInfo, ReactNode } from 'react'
import App from './App.tsx'
import './index.css'

// Error boundary component to catch rendering errors
class ErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console
    console.error('Application Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '0 auto', color: 'white' }}>
          <h1 style={{ color: '#f43f5e' }}>Something went wrong</h1>
          <p>We're sorry, but the application encountered an error. Please try refreshing the page.</p>
          <div style={{ 
            padding: '10px', 
            backgroundColor: 'rgba(0,0,0,0.2)', 
            borderRadius: '4px',
            marginTop: '20px',
            overflow: 'auto',
            maxHeight: '200px'
          }}>
            <pre>{this.state.error?.toString()}</pre>
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '8px 16px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

// Add a try-catch around the entire app initialization
try {
  console.log('Starting application...');
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    throw new Error("Root element not found! Make sure there is a div with id 'root' in your HTML.");
  }
  
  createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log('Application rendered successfully');
} catch (error) {
  console.error('Failed to initialize application:', error);
  
  // Show a fallback error message in the DOM
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; color: white;">
        <h1 style="color: #f43f5e;">Application Initialization Failed</h1>
        <p>We're sorry, but the application failed to start properly.</p>
        <div style="padding: 10px; background-color: rgba(0,0,0,0.2); border-radius: 4px; margin-top: 20px; overflow: auto; max-height: 200px;">
          <pre>${String(error)}</pre>
        </div>
        <button 
          onclick="window.location.reload()"
          style="margin-top: 20px; padding: 8px 16px; background-color: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          Refresh Page
        </button>
      </div>
    `;
  }
}
