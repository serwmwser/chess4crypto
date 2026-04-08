// frontend/src/components/WalletConnect.jsx
import { useAccount, useConnect } from 'wagmi';

export default function WalletConnect() {
  const { address } = useAccount();
  const { connect, connectors } = useConnect();

  // Если уже подключен — показываем адрес
  if (address) {
    return (
      <button style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
        🔗 {address.slice(0,6)}...{address.slice(-4)}
      </button>
    );
  }

  // Кнопка подключения (просто первый доступный коннектор)
  return (
    <button 
      onClick={() => connect({ connector: connectors[0] })}
      style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
    >
      🔐 Подключить кошелёк
    </button>
  );
}