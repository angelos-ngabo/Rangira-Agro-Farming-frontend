import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { QueryClient, QueryClientProvider } from 'react-query';

// Set CSS variable for dashboard background image
const bgImageUrl = `${process.env.PUBLIC_URL || ''}/images/background-dashboard.jpg`;
document.documentElement.style.setProperty('--dashboard-bg-image', `url(${bgImageUrl})`);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false, // Don't retry on network errors
      onError: (error) => {
        // Only log network errors, don't show toast for every failed request
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
          console.warn('Backend connection error. Make sure the backend is running on http://localhost:8080');
        }
      },
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);

