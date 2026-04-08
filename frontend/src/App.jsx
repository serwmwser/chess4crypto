import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import WalletConnect from './components/WalletConnect';
import Navbar from './components/Navbar';
import ChessBoard from './components/ChessBoard';
import { generateGameId, createInviteLink, parseGameLink, copyToClipboard } from './utils/gameLink';

export default function App() {
  const { isConnected, address } = useAccount();
  const [isGuest, setIsGuest] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [gameMode, setGameMode] = useState(null); // 'bot' | 'online' | null
  const [gameTime, setGameTime] = useState(300); // 5 мин по умолчанию
  const [gameId, setGameId] = useState(null);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [playerRole, setPlayerRole] = useState(null);

  const isAuthorized = isConnected || isGuest;

  // 🚪 Гостевой режим
  const enterGuestMode = () => {
    setIsGuest(true);
    setGameMode(null);
    setActiveTab('play');
  };

  const exitGuestMode = () => {
    setIsGuest(false);
    setGameMode(null);
    setActiveTab('home');
  };

  // 🌐 Создание онлайн-игры
  const createGame = () => {
    if (isGuest) {
      alert('🔒 В гостевом режиме доступна только игра с AI');
      return;
    }
    const newId = generateGameId();
    setGameId(newId);
    setInviteLink(createInviteLink(newId));
    setGameMode('online');
    setPlayerRole('creator');
  };

  const handleCopyLink = async () => {
    await copyToClipboard(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetGame = () => {
    setGameMode(null);
    setGameId(null);
    setInviteLink('');
    setPlayerRole(null);
  };

  // 🔗 Проверка ссылки при загрузке (для присоединения)
  useEffect(() => {
    const joinedId = parseGameLink();
    if (joinedId && !isGuest) {
      setGameId(joinedId);
      setGameMode('online');
      setPlayerRole('joiner');
      window.history.replaceState({}, document.title, '/');
    }
  }, [isGuest]);

  // 🎮 Рендер контента
  const renderContent = () => {
    // 1. Игра с ботом
    if (gameMode === 'bot') {
      return (
        <div style={{ padding: '2rem' }}>
          <button onClick={() => setGameMode(null)} style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            ← Назад в меню
          </button>
          <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>♟️ Игра с ботом</h2>
          <ChessBoard
            gameId="BOT"
            userAddress={isGuest ? '0xGuest' : address}
            withBot={true}
            playerColor="white"
            initialTime={gameTime}
          />
        </div>
      );
    }

    // 2. Онлайн-игра
    if (gameMode === 'online' && gameId) {
      return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
          <button onClick={resetGame} style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            ← Выйти из игры
          </button>

          {playerRole === 'creator' && (
            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '2px solid #f59e0b' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#f59e0b' }}>🎮 Игра #{gameId}</h3>
              <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>Отправьте ссылку другу:</p>
              <div style={{ display: 'flex', gap: '0.5rem', background: '#0f172a', padding: '0.75rem', borderRadius: '8px', alignItems: 'center' }}>
                <code style={{ flex: 1, color: '#4ade80', wordBreak: 'break-all' }}>{inviteLink}</code>
                <button onClick={handleCopyLink} style={{ padding: '0.5rem 1rem', background: copied ? '#22c55e' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {copied ? '✓ Скопировано!' : '📋 Копировать'}
                </button>
              </div>
              <p style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>🎲 Вы играете за: <strong style={{ color: '#fff' }}>Белых</strong></p>
            </div>
          )}

          <ChessBoard
            gameId={gameId}
            userAddress={address}
            withBot={false}
            playerColor={playerRole === 'creator' ? 'white' : 'black'}
            initialTime={gameTime}
          />
        </div>
      );
    }

    // 3. Вкладки
    switch (activeTab) {
      case 'home':
        return (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>👋 Добро пожаловать в Chess4Crypto</h2>
            <p style={{ color: '#94a3b8', marginTop: '1rem' }}>Играйте в шахматы, тестируйте AI, делайте ставки в GROK.</p>

            {!isAuthorized && (
              <div style={{ marginTop: '2rem' }}>
                <button onClick={enterGuestMode} style={{ padding: '1rem 2rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}>
                  👤 Войти как гость
                </button>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.5rem' }}>Без кошелька. Доступна игра с AI.</p>
              </div>
            )}

            {isGuest && <p style={{ marginTop: '1rem', color: '#4ade80' }}>✅ Гостевой режим активен</p>}
          </div>
        );

      case 'play':
        return (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>♟️ Выбор режима</h2>

            {/* Выбор времени */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {[180, 300, 600, 900].map(t => (
                <button
                  key={t}
                  onClick={() => setGameTime(t)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: gameTime === t ? '#f59e0b' : '#334155',
                    color: gameTime === t ? '#000' : '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: gameTime === t ? 'bold' : 'normal'
                  }}
                >
                  {t / 60} мин
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gap: '1rem', maxWidth: '300px', margin: '0 auto' }}>
              <button
                onClick={() => setGameMode('bot')}
                style={{ padding: '1.5rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                🤖 Играть с ботом
              </button>

              <button
                onClick={createGame}
                disabled={isGuest}
                style={{
                  padding: '1.5rem',
                  background: isGuest ? '#475569' : '#f59e0b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: isGuest ? 'not-allowed' : 'pointer',
                  opacity: isGuest ? 0.6 : 1
                }}
              >
                🌐 Онлайн игра {isGuest ? '(🔒)' : ''}
              </button>
            </div>

            {isGuest && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#312e81', borderRadius: '8px', border: '1px solid #818cf8' }}>
                <p style={{ margin: 0, color: '#c7d2fe', fontSize: '0.9rem' }}>💡 Для онлайн-игр и ставок подключите кошелёк через MetaMask</p>
              </div>
            )}
          </div>
        );

      case 'chat':
        return (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>💬 Чат</h2>
            <p style={{ color: '#94a3b8' }}>Активируется автоматически во время онлайн-игры</p>
          </div>
        );

      case 'settings':
        return (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>⚙️ Настройки</h2>
            <p style={{ color: '#94a3b8' }}>Язык: RU | Сеть: BSC Testnet | Токен: GROK</p>
            {isGuest && (
              <button onClick={exitGuestMode} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                🚪 Выйти из гостевого режима
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ background: '#0f172a', color: '#e2e8f0', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#0f172a', borderBottom: '1px solid #1e293b' }}>
        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>♟️ Chess4Crypto</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isGuest && <span style={{ background: '#475569', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', color: '#94a3b8' }}>👤 Гость</span>}
          {isConnected && <WalletConnect />}
          {isGuest && <button onClick={exitGuestMode} style={{ padding: '0.4rem 0.8rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>🚪 Выйти</button>}
        </div>
      </header>

      {!gameMode && <Navbar activeTab={activeTab} onTabChange={setActiveTab} isGuest={isGuest} />}

      <main>{renderContent()}</main>
    </div>
  );
}