import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useLanguage } from './contexts/LanguageContext';
import { useDrawListener } from './hooks/useDrawListener';
import WalletConnect from './components/WalletConnect';
import PlayerProfile from './components/PlayerProfile';
import TokenSupplyCounter from './components/TokenSupplyCounter';
import TimerSelector from './components/TimerSelector';
import GameChallenge from './components/GameChallenge';
import ChessBoard from './components/ChessBoard';
import Chat from './components/Chat';

function App() {
  const { isConnected, address } = useAccount();
  const { t, toggleLang } = useLanguage();
  const [selectedTimer, setSelectedTimer] = useState(0);
  const [gameId, setGameId] = useState(null);
  
  // Слушаем событие возврата при ничьей
  const drawInfo = useDrawListener();

  const handleGameCreated = (newGameId) => {
    setGameId(newGameId);
  };

  const resetGame = () => {
    setGameId(null);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: 'white',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* 🔝 Шапка */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>♟️ {t('title') || 'Chess4Crypto'}</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={toggleLang}
            style={{
              padding: '0.4rem 0.8rem',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            🌐 {t('toggleLang') || 'EN/RU'}
          </button>
          <WalletConnect />
        </div>
      </header>

      {/* 📦 Основной контент */}
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {!isConnected ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px'
          }}>
            <h2>{t('connectWallet') || '🔐 Подключите кошелёк для игры'}</h2>
            <p style={{ color: '#888', marginTop: '0.5rem' }}>{t('supportedWallets') || 'MetaMask • WalletConnect • Coinbase'}</p>
            <p style={{ marginTop: '1rem', color: '#f59e0b', fontSize: '0.9rem' }}>
              {t('warning') || '⚠️ Токен не верифицирован. Используйте на свой риск.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            
            {/* 👤 Профиль и счётчик токенов */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <PlayerProfile />
              <TokenSupplyCounter />
            </div>

            {/* 🤝 Уведомление о ничьей */}
            {drawInfo && (
              <div style={{
                background: 'rgba(74, 222, 128, 0.15)',
                border: '1px solid #4ade80',
                borderRadius: '12px',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <h3 style={{ color: '#4ade80', margin: '0 0 0.3rem' }}>🤝 {t('drawMessage') || 'Зафиксирована ничья!'}</h3>
                <p>{t('drawRefund') || 'Токены возвращены обоим игрокам.'}</p>
                <button
                  onClick={resetGame}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: '#4ade80',
                    color: '#000',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {t('newGame') || 'Создать новую игру'}
                </button>
              </div>
            )}

            {/* 🎮 Настройка игры или активная партия */}
            {!gameId ? (
              <>
                <TimerSelector selected={selectedTimer} onChange={setSelectedTimer} />
                <GameChallenge 
                  timerIndex={selectedTimer} 
                  onGameCreated={handleGameCreated} 
                />
              </>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                <ChessBoard gameId={gameId} />
                <Chat gameId={gameId} userAddress={address} />
              </div>
            )}
            
          </div>
        )}
      </main>

      {/* 🦶 Подвал */}
      <footer style={{
        textAlign: 'center',
        padding: '1.5rem',
        background: 'rgba(0,0,0,0.2)',
        fontSize: '0.85rem',
        color: 'rgba(255,255,255,0.6)',
        borderTop: '1px solid rgba(255,255,255,0.05)'
      }}>
        {t('footer') || '🤝 Ничья = возврат токенов | 🏆 Победитель забирает пул | ⏱️ Таймер 5 мин — 24 ч'}
      </footer>
    </div>
  );
}

export default App;