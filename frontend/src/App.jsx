import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { useTranslation } from 'react-i18next'

function App() {
  const { t, i18n } = useTranslation()
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const {  balance } = useBalance({ address })

  const [view, setView] = useState('menu') // 'menu' | 'game'
  const [chess] = useState(() => new Chess())
  const [boardPosition, setBoardPosition] = useState(chess.fen())
  const [message, setMessage] = useState('')
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)

  useEffect(() => {
    console.log('✅ App mounted. Language:', i18n.language)
  }, [i18n.language])

  // 🔹 Гостевой вход -> сразу игра с ботом
  const handleGuestLogin = () => {
    console.log('👤 Guest login')
    setView('game')
    setIsPlayerTurn(true)
    setMessage(t('app.yourTurn'))
    setTimeout(() => makeBotMove(), 1200)
  }

  // 🔹 Подключение кошелька
  const handleConnectWallet = async () => {
    try {
      console.log('🦊 Connect wallet')
      const connector = connectors.find(c => c.id === 'injected') || connectors[0]
      if (connector) {
        await connect({ connector })
        setView('game')
        setMessage('✅ ' + (isConnected ? 'Кошелёк подключён' : 'Подключение...'))
      }
    } catch (err) {
      setMessage('⚠️ ' + (err.message || 'Ошибка'))
    }
  }

  // 🔹 Выход
  const handleLogout = () => {
    if (isConnected) disconnect()
    setView('menu')
    chess.reset()
    setBoardPosition(chess.fen())
    setMessage('')
  }

  // 🔹 Ход игрока
  const onDrop = (source, target) => {
    if (!isPlayerTurn || chess.isGameOver()) return false
    try {
      const move = chess.move({ from: source, to: target, promotion: 'q' })
      if (!move) return false
      setBoardPosition(chess.fen())
      setIsPlayerTurn(false)
      setMessage(t('app.botTurn'))
      setTimeout(() => makeBotMove(), 800)
      return true
    } catch { return false }
  }

  // 🔹 Простой бот (случайный легальный ход)
  const makeBotMove = () => {
    if (chess.isGameOver()) return
    const moves = chess.moves()
    if (!moves.length) return
    const random = moves[Math.floor(Math.random() * moves.length)]
    chess.move(random)
    setBoardPosition(chess.fen())
    setIsPlayerTurn(true)
    
    if (chess.isCheckmate()) setMessage(t('app.checkmate'))
    else if (chess.isDraw()) setMessage(t('app.draw'))
    else setMessage(t('app.yourTurn'))
  }

  // 🔹 Смена языка
  const changeLang = (lng) => {
    i18n.changeLanguage(lng)
    console.log('🌐 Language:', lng)
  }

  // ============================================================================
  // 🎨 МЕНЮ ВХОДА
  // ============================================================================
  if (view === 'menu') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0b1120, #1e293b)', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.3rem' }}>♟️ {t('app.title')}</h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem', textAlign: 'center' }}>{t('app.subtitle')}</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%', maxWidth: '320px' }}>
          <button onClick={handleGuestLogin} style={btnStyle('#475569')}>{t('app.guestLogin')}</button>
          <button onClick={handleConnectWallet} style={btnStyle('#f59e0b', '#000')}>{t('app.connectWallet')}</button>
          
          <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
            {t('app.availableWallets')} {connectors.map(c => c.name).join(', ') || '...'}
          </div>
        </div>

        <select value={i18n.language} onChange={(e) => changeLang(e.target.value)} style={{ marginTop: '1.5rem', padding: '0.5rem', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer' }}>
          <option value="ru">🇷🇺 Русский</option>
          <option value="en">🇬🇧 English</option>
        </select>
      </div>
    )
  }

  // ============================================================================
  // 🎮 ИГРОВОЙ ЭКРАН
  // ============================================================================
  return (
    <div style={{ minHeight: '100vh', background: '#0b1120', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ padding: '1rem', background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>♟️ {t('app.title')}</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isConnected && address && (
            <span style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', background: '#334155', borderRadius: '20px' }}>
              🔗 {address.slice(0,6)}...{address.slice(-4)}
            </span>
          )}
          <select value={i18n.language} onChange={(e) => changeLang(e.target.value)} style={{ padding: '0.3rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            <option value="ru">🇷🇺 RU</option>
            <option value="en">🇬🇧 EN</option>
          </select>
          <button onClick={handleLogout} style={{ ...btnStyle('#ef4444', '#fff', '0.3rem 0.6rem', '0.8rem') }}>{t('app.logout')}</button>
        </div>
      </header>

      <main style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        {message && <p style={{ color: '#38bdf8', textAlign: 'center', margin: 0, fontSize: '1rem' }}>{message}</p>}
        
        <div style={{ width: 'min(95vw, 480px)', background: '#1e293b', padding: '0.5rem', borderRadius: '12px' }}>
          <Chessboard position={boardPosition} onPieceDrop={onDrop} boardOrientation="white" />
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => { chess.reset(); setBoardPosition(chess.fen()); setIsPlayerTurn(true); setMessage(t('app.yourTurn')); setTimeout(makeBotMove, 1000) }} style={btnStyle('#3b82f6')}>🔄 {t('app.newGame')}</button>
          <button onClick={() => window.location.hash = '#/profile'} style={btnStyle('#10b981')}>👤 {t('app.profile')}</button>
        </div>
        
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{view === 'game' ? (isConnected ? t('app.walletMode') : t('app.guestMode')) : ''}</p>
      </main>
    </div>
  )
}

// 🎨 Вспомогательный стиль кнопок
const btnStyle = (bg, color = '#fff', padding = '0.9rem 1.5rem', fontSize = '1rem') => ({
  padding, fontSize, background: bg, color, border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', transition: 'opacity 0.2s', width: '100%'
})

export default App