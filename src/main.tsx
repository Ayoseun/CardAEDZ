import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import web3AuthContextConfig from './context/web3authContext.tsx'
import { Web3AuthProvider } from '@web3auth/modal/react'


createRoot(document.getElementById('root')!).render(

  <StrictMode>
     <Web3AuthProvider config={web3AuthContextConfig}>

     
    <App />
    </Web3AuthProvider>
  </StrictMode>,
)
