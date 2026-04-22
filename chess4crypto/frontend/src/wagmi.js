import { http, createConfig } from 'wagmi'
import { bsc } from 'wagmi/chains'
import { walletConnect, metaMask, injected } from 'wagmi/connectors'

// 🔑 ВСТАВЬТЕ ВАШ PROJECT ID С https://cloud.walletconnect.com
export const projectId = '587fd6a621438c02626b74e674550d43'

export const metadata = {
  name: 'Chess4Crypto',
  description: 'PvP шахматы со ставками в GROK',
  url: 'https://serwmwser.github.io/chess4crypto/',
  icons: ['https://serwmwser.github.io/chess4crypto/favicon.ico']
}

// ✅ Настройка для мобильных и десктопов
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
        featuredWalletIds: [
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
          '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust
          'd93e283c-3c06-47b0-9798-f3c18a365b43' // Rainbow
        ]
      }
    }),
    metaMask({
      dappMetadata: metadata,
      order: 2
    }),
    injected({ shimDisconnect: true })
  ],
  ssr: true,
  batch: { multicall: { wait: 0 } }
})