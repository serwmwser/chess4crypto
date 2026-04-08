// frontend/src/App.jsx
import { useAccount } from 'wagmi';
import { useLanguage } from './contexts/LanguageContext';
import WalletConnect from './components/WalletConnect';

function App() {
  const { isConnected } = useAccount();
  const { t, toggleLang } = useLanguage();

  return (
    <div style={{
      background: '#0f172a',
      color: '#e2e8f0',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      padding: '1rem'
    }}>
      {/* Шапка */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        background: '#1e293b',
        borderRadius: '12px',
        marginBottom: '2rem'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>♟️ Chess4Crypto</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={toggleLang}
            style={{
              padding: '0.4rem 0.8rem',
              background: '#334155',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            🌐 RU/EN
          </button>
          <WalletConnect />
        </div>
      </header>

      {/* Основной контент */}
      <main style={{ maxWidth: '800px', margin: '0 auto' }}>
        {!isConnected ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            background: '#1e293b',
            borderRadius: '12px'
          }}>
            <h2>🔐 Подключите кошелёк для игры</h2>
            <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
              MetaMask • WalletConnect • Coinbase
            </p>
            <p style={{ marginTop: '1rem', color: '#f59e0b', fontSize: '0.9rem' }}>
              ⚠️ Тестовая сеть • Не используйте реальные средства
            </p>
          </div>
        ) : (
          <div style={{
            background: '#1e293b',
            padding: '2rem',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <h3>✅ Кошелёк подключён!</h3>
            <p style={{ color: '#4ade80', fontSize: '1.2rem', margin: '1rem 0' }}>
              🎮 Готовы к игре
            </p>
            <p style={{ color: '#94a3b8' }}>
              (Дальнейшие компоненты: таймер, ставка, доска — подключаются по мере готовности)
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;