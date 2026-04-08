import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import WalletConnect from './components/WalletConnect';
import Navbar from './components/Navbar';
import ChessBoard from './components/ChessBoard';
import { generateGameId, createInviteLink, parseGameLink, copyToClipboard } from './utils/gameLink';

const GUEST_ADDRESS = '0xGuestMode0000000000000000000000000000';

export default function App() {
  const { isConnected, address } = useAccount();
  const [isGuest, setIsGuest] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [gameMode, setGameMode] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [playerRole, setPlayerRole] = useState(null);

  const userAddress = isGuest ? GUEST_ADDRESS : address;
  const isAuthorized = isConnected || isGuest;

  useEffect(() => {
    const joinedGameId = parseGameLink();
    if (joinedGameId && !isGuest) {
      setGameId(joinedGameId);
      setGameMode('online');
      setPlayerRole('joiner');
      window.history.replaceState({}, document.title, '/');
    }
  }, [isGuest]);

  const enterGuestMode = () => {
    setIsGuest(true);
    setGameMode(null);
    setActiveTab('home');
  };

  const exitGuestMode = () => {
    setIsGuest(false);
    setGameMode(null);
    setActiveTab('home');
  };

  const createGame = () => {
    if (isGuest) {
      alert('🔒 В гостевом режиме доступна только игра с AI');
      setGameMode('bot');
      return;
    }
    const newGameId = generateGameId();
    setGameId(newGameId);
    setInviteLink(createInviteLink(newGameId));
    setGameMode('online');
    setPlayerRole('creator');
  };

  const handleCopyLink = async () => {
    await copyToClipboard(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetGame = () => {
    setGameId(null);
    setInviteLink('');
    setGameMode(null);
    setPlayerRole(null);
  };

  const renderContent = () => {
    if (gameMode === 'bot') {
      return (
        <div style={{ padding: '2rem' }}>
          <button onClick={() => setGameMode(null)} style={btnBack}>← Назад в меню</button>
          <h2>♟️ Игра с ботом (Stockfish)</h2>
          <ChessBoard gameId={gameId || 'GUEST'} userAddress={userAddress} withBot={true} />
        </div>
      );
    }

    if (gameMode === 'online' && gameId && !isGuest) {
      return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
          <button onClick={resetGame} style={btnBack}>← Выйти из игры</button>
          <div style={cardStyle('#f59e0b')}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#f59e0b' }}>🎮 Игра #{gameId}</h3>
            <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>Отправьте ссылку другу:</p>
            <div style={linkBoxStyle}>
              <code style={{ flex: 1, color: '#4ade80', wordBreak: 'break-all' }}>{inviteLink}</code>
              <button onClick={handleCopyLink} style={copyBtnStyle(copied)}>
                {copied ? '✓ Скопировано!' : '📋 Копировать'}
              </button>
            </div>
            <p style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
              🎲 Вы играете за: <strong style={{ color: '#fff' }}>Белых</strong>
            </p>
          </div>
          <ChessBoard gameId={gameId} userAddress={address} withBot={false} playerColor="white" />
        </div>
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>👋 Добро пожаловать в Chess4Crypto</h2>
            <p style={{ color: '#94a3b8', marginTop: '1rem' }}>
              Играйте в шахматы, тестируйте AI, делайте ставки в GROK.
            </p>
            {!isAuthorized && (
              <div style={{ marginTop: '2rem', display: 'grid', gap: '1rem', maxWidth: '300px', margin: '2rem auto' }}>
                <button onClick={enterGuestMode} style={btnPrimary('#64748b')}>
                  👤 Войти как гость
                </button>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  Без кошелька. Доступна игра с AI и просмотр функций.
                </p>
              </div>
            )}
          </div>
        );
      case 'play':
        return (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>♟️ Выбор режима</h2>
            <div style={{ display: 'grid', gap: '1rem', maxWidth: '400px', margin: '2rem auto' }}>
              <button onClick={() => setGameMode('bot')} style={btnPrimary('#3b82f6')}>
                🤖 Играть с ботом
                <div style={btnSub}>Stockfish (бесплатно)</div>
              </button>
              
              <button 
                onClick={createGame} 
                disabled={isGuest}
                style={btnPrimary(isConnected ? '#f59e0b' : '#64748b', isGuest)}
              >
                🌐 Онлайн игра
                <div style={btnSub}>
                  {isGuest ? '🔒 Требуется кошелёк' : 'Пригласить друга'}
                </div>
              </button>
            </div>
            {isGuest && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#312e81', borderRadius: '8px', border: '1px solid #818cf8' }}>
                <p style={{ margin: 0, color: '#c7d2fe' }}>💡 Для онлайн-игр и ставок подключите кошелёк через MetaMask</p>
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
      default: return null;
    }
  };

  return (
    <div style={appContainerStyle}>
      <header style={headerStyle}>
        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>♟️ Chess4Crypto</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isGuest && <span style={{ background: '#475569', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', color: '#94a3b8' }}>👤 Гость</span>}
          {isAuthorized ? <WalletConnect /> : null}
        </div>
      </header>

      {!gameMode && <Navbar activeTab={activeTab} onTabChange={setActiveTab} isGuest={isGuest} />}

      <main>{renderContent()}</main>
    </div>
  );
}

// Стили
const appContainerStyle = { background: '#0f172a', color: '#e2e8f0', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#0f172a', borderBottom: '1px solid #1e293b' };
const btnBack = { marginBottom: '1rem', padding: '0.5rem 1rem', background: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' };
const cardStyle = (borderColor) => ({ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: `2px solid ${borderColor}` });
const linkBoxStyle = { display: 'flex', gap: '0.5rem', background: '#0f172a', padding: '0.75rem', borderRadius: '8px', flexWrap: 'wrap', alignItems: 'center' };
const copyBtnStyle = (copied) => ({ padding: '0.5rem 1rem', background: copied ? '#22c55e' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 'bold' });
const btnPrimary = (bg, disabled = false) => ({ padding: '1.5rem', background: disabled ? '#475569' : bg, color: '#fff', border: 'none', borderRadius: '12px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '1.1rem', fontWeight: 'bold', opacity: disabled ? 0.6 : 1 });
const btnSub = { fontSize: '0.85rem', fontWeight: 'normal', marginTop: '0.5rem', opacity: 0.9 };