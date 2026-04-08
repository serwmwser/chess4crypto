// frontend/src/App.jsx
import { useAccount } from 'wagmi';
import WalletConnect from './components/WalletConnect';

function App() {
  const { isConnected } = useAccount();

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', background: '#1a1a2e', color: '#fff', minHeight: '100vh' }}>
      <h1>♟️ Chess4Crypto</h1>
      
      {/* Кнопка подключения — всегда видна */}
      <div style={{ margin: '20px 0' }}>
        <WalletConnect />
      </div>

      {/* Контент после подключения */}
      {isConnected ? (
        <div style={{ background: '#2a2a4e', padding: '20px', borderRadius: '8px' }}>
          <p>✅ Кошелёк подключён!</p>
          <p>🎮 Готов к игре</p>
        </div>
      ) : (
        <div style={{ background: '#2a2a4e', padding: '20px', borderRadius: '8px' }}>
          <p>🔐 Нажмите кнопку выше, чтобы подключить кошелёк</p>
        </div>
      )}
    </div>
  );
}

export default App;