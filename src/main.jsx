import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Performance monitoring
const startTime = performance.now()

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Log performance metric
window.addEventListener('load', () => {
  const loadTime = performance.now() - startTime
  if (loadTime > 1000) {
    console.warn(`App load time: ${loadTime.toFixed(2)}ms (exceeds 1s threshold)`)
  } else {
    console.log(`App load time: ${loadTime.toFixed(2)}ms`)
  }
})
