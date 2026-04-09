import './i18n';
import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { bsc, bscTestnet } from 'wagmi/chains'
import { metaMask, walletConnect, injected } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

// ✅ Ваш рабочий projectId из cloud.walletconnect.com
export const config = createConfig({
  chains: [bsc, bscTestnet],
  connectors: [
    metaMask({ shimDisconnect: true }),
    injected({ target: 'injected' }),
    walletConnect({ projectId: '587fd6a621438c02626b74e674550d43', showQrModal: true })
  ],
  transports: {
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
  },
})

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)