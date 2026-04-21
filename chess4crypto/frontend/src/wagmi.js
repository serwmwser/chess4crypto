import { http, createConfig } from 'wagmi'
import { bsc, mainnet } from 'wagmi/chains'
import { walletConnect, metaMask } from 'wagmi/connectors'

// 🔑 Замените на ваш projectId от https://cloud.walletconnect.com
export const projectId = '587fd6a621438c02626b74e674550d43'

export const metadata = {
  name: 'Chess4Crypto',
  description: 'Web3 шахматы с крипто-ставками',
  url: 'https://serwmwser.github.io/chess4crypto/',
  icons: ['https://serwmwser.github.io/chess4crypto/favicon.ico']
}

export const config = createConfig({
  chains: [bsc, mainnet],
  transports: {
    [bsc.id]: http(),
    [mainnet.id]: http()
  },
  connectors: [
    walletConnect({ 
      projectId, 
      metadata,
      showQrModal: true 
    }),
    metaMask()
  ],
  ssr: true
})