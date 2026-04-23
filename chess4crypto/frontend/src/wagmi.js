import { http, createConfig } from 'wagmi'
import { bsc } from 'wagmi/chains'
import { walletConnect, metaMask, injected, coinbaseWallet, trustWallet } from 'wagmi/connectors'
import { QueryClient } from '@tanstack/react-query'

// 🔑 ВАШ PROJECT ID С https://cloud.walletconnect.com/app
export const projectId = '587fd6a621438c02626b74e674550d43'

// 🔗 Metadata для WalletConnect
export const metadata = {
  name: 'Chess4Crypto',
  description: 'PvP шахматы со ставками в криптовалюте GROK',
  url: 'https://serwmwser.github.io/chess4crypto/',
  icons: ['https://serwmwser.github.io/chess4crypto/favicon.ico']
}

// ✅ Настройка wagmi config
export const config = createConfig({
  chains: [bsc],
  transports: {
    [bsc.id]: http('https://bsc-dataseed.binance.org')
  },
  connectors: [
    walletConnect({
      projectId,
      metadata,
      showQrModal: true,
      qrModalOptions: {
        themeMode: 'dark',
        mobileWallets: [
          { id: 'metaMask', name: 'MetaMask' },
          { id: 'trust', name: 'Trust Wallet' },
          { id: 'rainbow', name: 'Rainbow' }
        ]
      }
    }),
    metaMask({ order: 2 }),
    coinbaseWallet({ appName: metadata.name, order: 3 }),
    trustWallet({ projectId, order: 4 }),
    injected({ shimDisconnect: true, order: 5 })
  ],
  ssr: true,
  batch: { multicall: { wait: 100 } }
})

// ✅ QueryClient для React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000
    }
  }
})