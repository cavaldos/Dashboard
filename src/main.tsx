import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style/global.css'
import App from './App.tsx'
import ProviderGlobal from './redux/provider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProviderGlobal>
      <App />
    </ProviderGlobal>
  </StrictMode>,
)
