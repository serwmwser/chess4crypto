import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import io from 'socket.io-client';
import WalletConnect from './components/WalletConnect';
import Navbar from './components/Navbar';
import ChessBoard from './components/ChessBoard';
import ChatBox from './components/ChatBox';
import { createInviteLink, copyToClipboard } from './utils/gameLink';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'https://chess4crypto-backend.onrender.com';
const GUEST_ADDRESS = '0xGuestMode0000000000000000000000000000';

export default function App() {
  const { isConnected, address } = useAccount();
  const [isGuest, setIsGuest] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [gameMode, setGameMode] = useState(null);
  const [gameTime, setGameTime] = useState(300);
  const [gameData, setGameData] = useState(null);
  
  const [socket, setSocket] = useState(null);
  const [onlineList, setOnlineList] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inviteAddr, setInviteAddr] = useState('');
  const [inviteModal, setInviteModal] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const userAddress = isGuest ? GUEST_ADDRESS : address;
  const isAuthorized = isConnected || isGuest;

  useEffect(() => {
    const newSocket = io(SOCKET_URL, { transports: ['websocket', 'polling'], reconnection: true });
    setSocket(newSocket);
    newSocket.on('connect', () => console.log('🔌 Socket connected'));
    newSocket.on('onlinePlayersUpdate', (list) => setOnlineList(list));
    newSocket.on('matchStatus', (data) => { if (data.status === 'canceled') setIsSearching(false); });
    newSocket.on('matchFound', (data) => { setIsSearching(false); setGameData({ gameId: data.gameId, role: data.role, opponent: data.opponent }); setGameMode('online'); });
    newSocket.on('inviteReceived', (data) => setInviteModal(data));
    newSocket.on('error', (msg) => alert(msg));
    return () => newSocket.disconnect();
  }, []);

  useEffect(() => { if (socket && userAddress) socket.emit('registerPlayer', { address: userAddress }); }, [socket, userAddress]);

  const startRandomMatch = () => { if (!socket || !userAddress) return; setIsSearching(true); socket.emit('requestMatch', { address: userAddress }); };
  const cancelRandomMatch = () => { if (socket && userAddress) { socket.emit('cancelMatch', { address: userAddress }); setIsSearching(false); } };
  const sendDirectInvite = () => { if (!socket || !userAddress || !inviteAddr) return; socket.emit('directInvite', { from: userAddress, to: inviteAddr, gameId: Math.random().toString(36).substring(2,10).toUpperCase() }); setInviteAddr(''); alert('✅ Приглашение отправлено!'); };
  const acceptInvite = () => { if (!socket || !inviteModal) return; setGameData({ gameId: inviteModal.gameId, role: 'black', opponent: inviteModal.from }); setGameMode('online'); setInviteModal(null); };
  const resetGame = () => { setGameMode(null); setGameData(null); setIsSearching(false); };

  const renderContent = () => {
    if (gameMode === 'bot') return (
      <div style={{ padding: '2rem' }}>
        <button onClick={() => setGameMode(null)} style={styles.btnBack}>← Назад</button>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>♟️ vs Бот</h2>
        <ChessBoard gameId="BOT" userAddress={userAddress} withBot={true} playerColor="white" initialTime={gameTime} />
      </div>
    );

    if (gameMode === 'online' && gameData) return (
      <div style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center' }}>
        <div style={{ flex: '2 1 500px', minWidth: '300px' }}>
          <button onClick={resetGame} style={styles.btnBack}>← Выйти</button>
          <div style={styles.card('#f59e0b')}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#f59e0b' }}>🎮 Игра #{gameData.gameId}</h3>
            <p style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>Соперник: <span style={{ color: '#fff', fontWeight: 'bold' }}>{gameData.opponent?.slice(0,6)}...{gameData.opponent?.slice(-4)}</span></p>
            <button onClick={async () => { await copyToClipboard(createInviteLink(gameData.gameId)); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); }} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{copiedLink ? '✓ Скопировано!' : '📋 Ссылка в игру'}</button>
          </div>
          <ChessBoard gameId={gameData.gameId} userAddress={userAddress} withBot={false} playerColor={gameData.role === 'white' ? 'white' : 'black'} initialTime={gameTime} />
        </div>
        <div style={{ flex: '1 1 280px', minWidth: '250px', position: 'sticky', top: '1rem', height: 'fit-content' }}>
          <ChatBox socket={socket} gameId={gameData.gameId} user={userAddress} />
        </div>
      </div>
    );

    if (isSearching) return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>⏳ Поиск соперника...</h2>
        <p style={{ color: '#94a3b8' }}>Ожидаем подключения</p>
        <button onClick={cancelRandomMatch} style={{ ...styles.btnBack, background: '#ef4444', marginTop: '1rem' }}>❌ Отменить</button>
      </div>
    );

    switch (activeTab) {
      case 'home': return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>👋 Добро пожаловать в Chess4Crypto</h2>
          <p style={{ color: '#94a3b8', marginTop: '1rem' }}>Играйте с AI или вызывайте соперников онлайн.</p>
          {!isAuthorized && <button onClick={() => { setIsGuest(true); setActiveTab('play'); }} style={styles.btnPrimary('#10b981')}>👤 Войти как гость</button>}
        </div>
      );
      case 'play': return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>♟️ Выбор режима</h2>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {[180, 300, 600, 900, 3600].map(t => (
              <button key={t} onClick={() => setGameTime(t)} style={{ padding: '0.5rem 1rem', background: gameTime===t?'#f59e0b':'#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: gameTime===t?'bold':'normal' }}>{t >= 3600 ? '1 ч' : `${t/60} мин`}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gap: '1rem', maxWidth: '400px', margin: '0 auto' }}>
            <button onClick={() => setGameMode('bot')} style={styles.btnPrimary('#3b82f6')}>🤖 Играть с ботом</button>
            <button onClick={startRandomMatch} disabled={isGuest} style={styles.btnPrimary(isGuest?'#475569':'#10b981', isGuest)}>⚡ Случайный соперник {isGuest?'(🔒)':''}</button>
            <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>🎯 Прямое приглашение</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" placeholder="Адрес 0x..." value={inviteAddr} onChange={e => setInviteAddr(e.target.value)} style={{ flex: 1, padding: '0.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} />
                <button onClick={sendDirectInvite} disabled={isGuest || !inviteAddr} style={{ padding: '0.5rem 1rem', background: '#f59e0b', color: '#000', border: 'none', borderRadius: '6px', cursor: isGuest?'not-allowed':'pointer', opacity: isGuest?0.5:1 }}>📨</button>
              </div>
              {onlineList.length > 0 && <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>🟢 В сети: {onlineList.length}</p>}
            </div>
          </div>
        </div>
      );
      default: return <div style={{ padding: '2rem', textAlign: 'center' }}><h2>🚧 В разработке</h2></div>;
    }
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>♟️ Chess4Crypto</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isGuest && <span style={styles.badge}>👤 Гость</span>}
          <WalletConnect />
          {isGuest && isConnected && <button onClick={() => { setIsGuest(false); setGameMode(null); }} style={styles.btnOutline}>🚪 Выйти</button>}
        </div>
      </header>
      {!gameMode && <Navbar activeTab={activeTab} onTabChange={setActiveTab} isGuest={isGuest} />}
      <main>{renderContent()}</main>
      {inviteModal && (
        <div style={styles.overlay} onClick={() => setInviteModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#f59e0b', marginBottom: '1rem' }}>📨 Приглашение</h3>
            <p style={{ color: '#e2e8f0', marginBottom: '1rem' }}><strong>{inviteModal.from?.slice(0,6)}...{inviteModal.from?.slice(-4)}</strong> зовёт вас!</p>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <button onClick={acceptInvite} style={{ padding: '0.75rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>✅ Принять</button>
              <button onClick={() => setInviteModal(null)} style={{ padding: '0.75rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>❌ Отклонить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  app: { background: '#0f172a', color: '#e2e8f0', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#0f172a', borderBottom: '1px solid #1e293b', position: 'sticky', top: 0, zIndex: 50 },
  badge: { background: '#475569', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', color: '#94a3b8' },
  btnBack: { marginBottom: '1rem', padding: '0.5rem 1rem', background: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  card: (b) => ({ background: '#1e293b', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: `2px solid ${b}` }),
  btnPrimary: (bg, d=false) => ({ padding: '1rem', background: d?'#475569':bg, color:'#fff', border:'none', borderRadius:'8px', cursor:d?'not-allowed':'pointer', fontWeight:'bold', opacity:d?0.5:1 }),
  btnOutline: { padding: '0.4rem 0.8rem', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' },
  overlay: { position: 'fixed', top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem' },
  modal: { background: '#1e293b', padding: '1.5rem', borderRadius: '12px', maxWidth: '350px', width: '90%', textAlign: 'center', border: '2px solid #3b82f6' }
};