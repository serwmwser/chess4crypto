import { useAccount, useConnect, useDisconnect } from 'wagmi';

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  // Если уже подключен
  if (isConnected && address) {
    return (
      <button onClick={() => disconnect()} style={btnStyle('#ef4444')}>
        🔗 {address.slice(0, 6)}...{address.slice(-4)} (Откл.)
      </button>
    );
  }

  // Кнопка подключения
  const connector = connectors?.[0];
  if (!connector) return <span style={{ color: '#94a3b8' }}>⚠️ MetaMask не найден</span>;

  return (
    <button onClick={() => connect({ connector })} disabled={isPending} style={btnStyle('#3b82f6')}>
      {isPending ? '⏳ Подключение...' : '🦊 Подключить кошелёк'}
    </button>
  );
}

const btnStyle = (bg) => ({
  padding: '8px 14px',
  background: bg,
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.9rem'
});