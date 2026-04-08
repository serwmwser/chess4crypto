import { useAccount, useConnect, useDisconnect } from 'wagmi'

export default function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <button onClick={() => disconnect()} style={btnStyle('#ef4444')}>
        🔗 {address.slice(0, 6)}...{address.slice(-4)} (Отключить)
      </button>
    )
  }

  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      disabled={isPending}
      style={btnStyle('#3b82f6')}
    >
      {isPending ? '⏳ Подключение...' : '🦊 Подключить MetaMask'}
    </button>
  )
}

const btnStyle = (bg) => ({
  padding: '10px 20px',
  background: bg,
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '16px'
})