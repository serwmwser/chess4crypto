import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { injected, walletConnect } from 'wagmi/connectors'
import { bsc, bscTestnet } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './i18n'

console.log('🚀 Chess4Crypto starting...')
console.log('🔍 ENV:', { SUPABASE: import.meta.env.VITE_SUPABASE_URL ? '✓' : '✗', WALLETCONNECT: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ? '✓' : '✗' })

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '00000000000000000000000000000000'

export const config = createConfig({
  chains: [bsc, bscTestnet],
  connectors: [
    walletConnect({
      projectId,
      showQrModal: true,
      // ✅ ИСПРАВЛЕНО: meta (с двоеточием)
      meta {
        name: 'Chess4Crypto',
        description: 'Web3 Chess Platform with GROK Token Betting',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://serwmwser.github.io/chess4crypto',
        icons: [typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : '']
      }
    }),
    injected({ target: 'metaMask' })
  ],
  transports: { [bsc.id]: http(), [bscTestnet.id]: http() },
  ssr: typeof window === 'undefined'
})

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 }, mutations: { retry: false } } })

const rootElement = document.getElementById('root')
if (!rootElement) { console.error('❌ root not found'); document.body.innerHTML = '<div style="padding:2rem;color:#fff;background:#000">⚠️ Ошибка: root не найден</div>' }
else {
  try {
    ReactDOM.createRoot(rootElement).render(<React.StrictMode><WagmiProvider config={config}><QueryClientProvider client={queryClient}><App /></QueryClientProvider></WagmiProvider></React.StrictMode>)
    console.log('✅ App rendered')
  } catch (err) { console.error('❌ Render error:', err); rootElement.innerHTML = `<div style="padding:2rem;color:#fff;background:#000">⚠️ Ошибка: ${err.message}</div>` }
}