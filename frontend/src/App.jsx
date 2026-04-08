import { useAccount } from 'wagmi'
import WalletConnect from './components/WalletConnect'

export default function App() {
  const { isConnected } = useAccount()

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif', background: '#0f172a', color: '#fff', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#1e293b', borderRadius: '12px', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>♟️ Chess4Crypto</h1>
        <WalletConnect />
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        {isConnected ? (
          <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px' }}>
            <h2 style={{ color: '#4ade80' }}>✅ Кошелёк подключён!</h2>
            <p style={{ color: '#94a3b8', marginTop: '10px' }}>Готово к игре. Следующий шаг: настройка смарт-контракта и ставок.</p>
          </div>
        ) : (
          <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px' }}>
            <h2>🔐 Подключите кошелёк</h2>
            <p style={{ color: '#94a3b8', marginTop: '10px' }}>Нажмите кнопку в правом верхнем углу, чтобы войти через MetaMask.</p>
          </div>
        )}
      </main>
    </div>
  )
}