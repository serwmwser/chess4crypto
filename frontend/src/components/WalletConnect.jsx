// frontend/src/components/WalletConnect.jsx
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { metaMask } from 'wagmi/connectors';

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        style={{
          padding: '0.5rem 1rem',
          background: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        🔗 {address.slice(0, 6)}...{address.slice(-4)} (Отключить)
      </button>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: connectors[0] || metaMask() })}
      style={{
        padding: '0.5rem 1rem',
        background: '#f59e0b',
        color: 'black',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}
    >
      🦊 Подключить MetaMask
    </button>
  );
}