import React from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider } from '@tanstack/react-query'
import { config, queryClient, projectId, metadata } from './wagmi.js'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { bsc } from 'wagmi/chains'

// ✅ Инициализация Web3Modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  chains: [bsc],
  defaultChain: bsc,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#00695c',
    '--w3m-color-mix': '#004d40'
  },
  enableAnalytics: false,
  enableOnramp: false
})

export function Web3Provider({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}