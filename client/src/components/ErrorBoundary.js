import React, { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-lg w-full text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">
                            ⚠️
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            An unexpected error occurred. Please try refreshing the page or navigating back home.
                        </p>
                        <button 
                            onClick={() => window.location.href = "/"}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                        >
                            Back to Home
                        </button>
                        
                        {process.env.NODE_ENV === 'development' && (
                            <div className="mt-8 text-left bg-gray-100 dark:bg-slate-950 p-4 rounded-xl overflow-auto text-xs text-red-500 max-h-40">
                                <p className="font-bold mb-1">{this.state.error?.toString()}</p>
                                <pre>{this.state.errorInfo?.componentStack}</pre>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
