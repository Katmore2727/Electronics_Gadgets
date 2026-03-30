import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      reverseOrder={false}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#0f172a',
          color: '#f1f5f9',
          borderRadius: '0.75rem',
          border: '1px solid #334155',
        },
        success: {
          style: {
            borderColor: '#10b981',
          },
        },
        error: {
          style: {
            borderColor: '#ef4444',
          },
        },
      }}
    />
  </StrictMode>,
)
