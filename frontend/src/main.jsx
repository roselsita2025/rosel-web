import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Silence development logs in production builds
if (import.meta.env && import.meta.env.PROD) {
  const noop = () => {};
  // Keep warnings and errors visible; silence general logs
  // eslint-disable-next-line no-console
  console.log = noop;
  // eslint-disable-next-line no-console
  console.debug = noop;
  // eslint-disable-next-line no-console
  console.info = noop;
}
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
