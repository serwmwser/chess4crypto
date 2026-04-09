import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useTranslation } from 'react-i18next';
import io from 'socket.io-client';
import Navbar from './components/Navbar';
import ChessBoard from './components/ChessBoard';
import ChatBox from './components/ChatBox';
import Profile from './components/Profile';
import { createInviteLink, copyToClipboard } from './utils/gameLink';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'https://chess4crypto-backend.onrender.com';
const GUEST_ADDRESS = '0xGuestMode0000000000000000000000000000';

export default function App() {
  const { t } = useTranslation();
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

  // 🔌 Инициализация WebSocket
  useEffect(() => {
    const newSocket = io(SOCKET_URL, { transports: ['websocket', 'polling'], reconnection: true, reconnectionAttempts: 5 });
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
        <button onClick={() => setGameMode(null)} style={styles.btnBack}>← {t('chess.back')}</button>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>♟️ {t('play.vsBot')}</h2>
        <ChessBoard gameId="BOT" userAddress={userAddress} withBot={true} playerColor="white" initialTime={gameTime} />
      </div>
    );

    if (gameMode === 'online' && gameData) return (
      <div style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center' }}>
        <div style={{ flex: '2 1 500px', minWidth: '300px' }}>
          <button onClick={resetGame} style={styles.btnBack}>← {t('chess.back')}</button>
          <div style={styles.card('#f59e0b')}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#f59e0b' }}>{t('game.title', { id: gameData.gameId })}</h3>
            <p style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>
              {t('game.opp')} <span style={{ color: '#fff', fontWeight: 'bold' }}>{gameData.opponent?.slice(0,6)}...{gameData.opponent?.slice(-4)}</span>
            </p>
            <button onClick={async () => { await copyToClipboard(createInviteLink(gameData.gameId)); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); }} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              {copiedLink ? t('game.copied') : t('game.copyLink')}
            </button>
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
        <h2>{t('match.search')}</h2>
        <p style={{ color: '#94a3b8' }}>{t('match.wait')}</p>
        <button onClick={cancelRandomMatch} style={{ ...styles.btnBack, background: '#ef4444', marginTop: '1rem' }}>{t('match.cancel')}</button>
      </div>
    );

    switch (activeTab) {
      case 'home': return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>{t('home.welcome')}</h2>
          <p style={{ color: '#94a3b8', marginTop: '1rem' }}>{t('home.sub')}</p>
          {!isConnected && !isGuest && (
            <button onClick={() => { setIsGuest(true); setActiveTab('play'); }} style={styles.btnPrimary('#10b981')}>{t('home.guestBtn')}</button>
          )}
        </div>
      );
      case 'play': return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>{t('play.title')}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {[180, 300, 600, 900, 3600].map(tTime => (
              <button key={tTime} onClick={() => setGameTime(tTime)} style={{ padding: '0.5rem 1rem', background: gameTime===tTime?'#f59e0b':'#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: gameTime===tTime?'bold':'normal' }}>
                {tTime >= 3600 ? t('play.timeHour') : t('play.timeMin', { count: tTime/60 })}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gap: '1rem', maxWidth: '400px', margin: '0 auto' }}>
            <button onClick={() => setGameMode('bot')} style={styles.btnPrimary('#3b82f6')}>{t('play.vsBot')}</button>
            <button onClick={startRandomMatch} disabled={isGuest} style={styles.btnPrimary(isGuest?'#475569':'#10b981', isGuest)}>
              {t('play.random')} {isGuest ? t('play.locked') : ''}
            </button>
            <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>{t('play.invite')}</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" placeholder={t('play.placeholder')} value={inviteAddr} onChange={e => setInviteAddr(e.target.value)} style={{ flex: 1, padding: '0.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} />
                <button onClick={sendDirectInvite} disabled={isGuest || !inviteAddr} style={{ padding: '0.5rem 1rem', background: '#f59e0b', color: '#000', border: 'none', borderRadius: '6px', cursor: isGuest?'not-allowed':'pointer', opacity: isGuest?0.5:1 }}>{t('play.send')}</button>
              </div>
              {onlineList.length > 0 && <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>{t('play.online', { count: onlineList.length })}</p>}
            </div>
          </div>
        </div>
      );
      case 'profile': return <Profile onNavigate={(tab) => setActiveTab(tab)} />;
      case 'chat': return <div style={{ padding: '2rem', textAlign: 'center' }}><h2>💬 {t('chat.title')}</h2><p style={{ color: '#94a3b8' }}>{t('profile.chatBtn')}</p></div>;
      default: return <div style={{ padding: '2rem', textAlign: 'center' }}><h2>🚧 В разработке</h2></div>;
    }
  };

  return (
    <div style={styles.app}>
      {/* ✅ Единая красочная панель навигации (заменяет старый header) */}
      <Navbar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isGuest={isGuest} 
        isConnected={isConnected}
        onGuestLogout={() => { setIsGuest(false); setGameMode(null); }}
      />

      <main>{renderContent()}</main>

      {inviteModal && (
        <div style={styles.overlay} onClick={() => setInviteModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#f59e0b', marginBottom: '1rem' }}>{t('invite.title')}</h3>
            <p style={{ color: '#e2e8f0', marginBottom: '1rem' }}>
              <strong>{inviteModal.from?.slice(0,6)}...{inviteModal.from?.slice(-4)}</strong> {t('invite.msg')}
            </p>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <button onClick={acceptInvite} style={{ padding: '0.75rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>{t('invite.accept')}</button>
              <button onClick={() => setInviteModal(null)} style={{ padding: '0.75rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{t('invite.decline')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 🎨 Стили
const styles = {
  app: { background: '#0f172a', color: '#e2e8f0', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  btnBack: { marginBottom: '1rem', padding: '0.5rem 1rem', background: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  card: (b) => ({ background: '#1e293b', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: `2px solid ${b}` }),
  btnPrimary: (bg, d=false) => ({ padding: '1rem', background: d?'#475569':bg, color:'#fff', border:'none', borderRadius:'8px', cursor:d?'not-allowed':'pointer', fontWeight:'bold', opacity:d?0.5:1 }),
  overlay: { position: 'fixed', top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem' },
  modal: { background: '#1e293b', padding: '1.5rem', borderRadius: '12px', maxWidth: '350px', width: '90%', textAlign: 'center', border: '2px solid #3b82f6' }
};