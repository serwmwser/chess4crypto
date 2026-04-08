import { useState } from 'react';
import { useAccount } from 'wagmi';
import WalletConnect from './components/WalletConnect';
import Navbar from './components/Navbar';

export default function App() {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>👋 Добро пожаловать в Chess4Crypto</h2>
            <p style={{ color: '#94a3b8', marginTop: '1rem' }}>
              Играйте в шахматы, делайте ставки в токенах GROK и зарабатывайте на BNB Chain.
            </p>
            {!isConnected && (
              <p style={{ marginTop: '1.5rem', color: '#f59e0b' }}>
                🔐 Подключите кошелёк в правом верхнем углу, чтобы начать
              </p>
            )}
          </div>
        );
      case 'play':
        return (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>♟️ Создание игры</h2>
            <p style={{ color: '#94a3b8' }}>
              {isConnected ? 'Выберите таймер и ставку, чтобы создать вызов.' : 'Подключите кошелёк, чтобы начать игру.'}
            </p>
          </div>
        );
      case 'chat':
        return (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>💬 Игровой чат</h2>
            <p style={{ color: '#94a3b8' }}>
              Чат активируется автоматически после создания партии.
            </p>
          </div>
        );
      case 'settings':
        return (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>⚙️ Настройки</h2>
            <p style={{ color: '#94a3b8' }}>Язык: RU | Сеть: BSC Testnet | Токен: GROK</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ background: '#0f172a', color: '#e2e8f0', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Шапка */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#0f172a', borderBottom: '1px solid #1e293b' }}>
        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>♟️ Chess4Crypto</span>
        <WalletConnect />
      </header>

      {/* Меню навигации */}
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Контент */}
      <main style={{ maxWidth: '800px', margin: '0 auto' }}>
        {renderContent()}
      </main>
    </div>
  );
}