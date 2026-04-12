import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { useTranslation } from 'react-i18next'

// 🎨 5 ТЕМ
const BOARD_THEMES = {
  classic: { name: '🏛️ Классика', light: '#eeeed2', dark: '#769656', highlight: 'rgba(255,255,0,0.4)', validMove: 'rgba(20,85,30,0.5)' },
  neon: { name: '💜 Неон', light: '#1a1a2e', dark: '#16213e', highlight: 'rgba(236,72,153,0.5)', validMove: 'rgba(59,130,246,0.6)' },
  forest: { name: '🌲 Лес', light: '#c8b59a', dark: '#5d7a4f', highlight: 'rgba(251,191,36,0.4)', validMove: 'rgba(34,197,94,0.5)' },
  ocean: { name: '🌊 Океан', light: '#a8d8ea', dark: '#2a6f97', highlight: 'rgba(255,215,0,0.4)', validMove: 'rgba(6,182,212,0.5)' },
  sunset: { name: '🌅 Закат', light: '#ffecd2', dark: '#fcb69f', highlight: 'rgba(245,158,11,0.4)', validMove: 'rgba(239,68,68,0.5)' }
}

const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
const getShareUrl = () => typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://serwmwser.github.io/chess4crypto'

function App() {
  const { t, i18n } = useTranslation()
  // ✅ Используем status из wagmi вместо ручного connectStatus
  const { address, isConnected, status } = useAccount()
  const { connect, connectors, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()
  const {  balance: walletBalance } = useBalance({ address })

  // 🎮 Состояние
  const gameRef = useRef(new Chess())
  const [view, setView] = useState('menu')
  const [fen, setFen] = useState(gameRef.current.fen())
  const [history, setHistory] = useState([gameRef.current.fen()])
  const [moveIndex, setMoveIndex] = useState(0)
  const [movesList, setMovesList] = useState([])
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  const [message, setMessage] = useState('')
  
  // 📱 PWA
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  // 🎨 Тема & Ходы
  const [boardTheme, setBoardTheme] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('chess4crypto_theme') || 'classic' : 'classic')
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [possibleMoves, setPossibleMoves] = useState([])

  // ⏱️ Таймер
  const [timeControl, setTimeControl] = useState(5)
  const [playerTime, setPlayerTime] = useState(timeControl * 60)
  const [botTime, setBotTime] = useState(timeControl * 60)
  const [timerActive, setTimerActive] = useState(null)

  // 💰 Баланс & Лобби
  const [gameBalance, setGameBalance] = useState(0)
  const [pendingDeposit, setPendingDeposit] = useState(null)
  const [lobbyMode, setLobbyMode] = useState('idle')
  const [gameId, setGameId] = useState(null)
  const [inviteLink, setInviteLink] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [copied, setCopied] = useState(false)

  const fmtTime = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60; return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}` }
  const formatNumber = (n) => n.toLocaleString('ru-RU')

  const customSquareStyles = useMemo(() => {
    const theme = BOARD_THEMES[boardTheme], styles = {}
    if (selectedSquare) styles[selectedSquare] = { backgroundColor: theme.highlight }
    possibleMoves.forEach(sq => { styles[sq] = { backgroundColor: theme.validMove, backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 20%, transparent 20%)`, backgroundSize: '12px 12px', backgroundPosition: 'center' } })
    return styles
  }, [selectedSquare, possibleMoves, boardTheme])

  const getValidMoves = useCallback((square) => gameRef.current.moves({ square, verbose: true }).map(m => m.to), [])
  const onSquareClick = useCallback((square) => {
    if (gameOver || lobbyMode !== 'playing') return
    const piece = gameRef.current.get(square)
    if (piece && piece.color === (isPlayerTurn ? 'w' : 'b')) { setSelectedSquare(square); setPossibleMoves(getValidMoves(square)); return }
    if (selectedSquare && possibleMoves.includes(square)) { onDrop(selectedSquare, square); setSelectedSquare(null); setPossibleMoves([]); return }
    setSelectedSquare(null); setPossibleMoves([])
  }, [gameOver, isPlayerTurn, selectedSquare, possibleMoves, getValidMoves, lobbyMode])

  const onDrop = useCallback((source, target) => {
    if (!isPlayerTurn || gameOver || moveIndex !== history.length - 1 || lobbyMode !== 'playing') return false
    try {
      const move = gameRef.current.move({ from: source, to: target, promotion: 'q' }); if (!move) return false
      const newFen = gameRef.current.fen(), san = gameRef.current.history({ verbose: true }).pop()?.san || `${source}${target}`
      setHistory(prev => [...prev, newFen]); setMovesList(prev => [...prev, { san, from: source, to: target, piece: move.piece }])
      setFen(newFen); setMoveIndex(prev => prev + 1); setIsPlayerTurn(false); setTimerActive('bot'); setMessage('🤖 Бот думает...')
      setSelectedSquare(null); setPossibleMoves([])
      if (gameRef.current.isCheckmate()) endGame('player'); else if (gameRef.current.isDraw()) endGame('draw'); else setTimeout(makeBotMove, 1000)
      return true
    } catch { return false }
  }, [isPlayerTurn, gameOver, moveIndex, history.length, lobbyMode])

  const makeBotMove = useCallback(() => {
    if (gameOver || gameRef.current.isGameOver() || lobbyMode !== 'playing') return
    const moves = gameRef.current.moves(); if (!moves.length) return
    const random = moves[Math.floor(Math.random() * moves.length)]; gameRef.current.move(random)
    const newFen = gameRef.current.fen(), san = gameRef.current.history({ verbose: true }).pop()?.san || random
    setHistory(prev => [...prev, newFen]); setMovesList(prev => [...prev, { san, from: random.from, to: random.to, piece: random.piece }])
    setFen(newFen); setMoveIndex(prev => prev + 1); setIsPlayerTurn(true); setTimerActive('player')
    if (gameRef.current.isCheckmate()) endGame('player'); else if (gameRef.current.isDraw()) endGame('draw'); else setMessage('♟️ Ваш ход!')
  }, [gameOver, lobbyMode])

  const endGame = (result) => {
    setGameOver(true); setTimerActive(null); setSelectedSquare(null); setPossibleMoves([])
    if (result === 'player') { setWinner('player'); setMessage('🏁 КОНЕЦ ИГРЫ! Вы победили!'); if (gameBalance > 0) setMessage(`🎁 +${gameBalance} GROK зачислено!`) }
    else if (result === 'bot') { setWinner('bot'); setMessage('🏁 КОНЕЦ ИГРЫ! Бот победил.') }
    else { setWinner('draw'); setMessage('🤝 НИЧЬЯ!') }
    setLobbyMode('idle')
  }

  const handleDeposit = async (amount) => {
    if (!isConnected) { setMessage('⚠️ Сначала подключите кошелёк'); return }
    setPendingDeposit(amount); setMessage(`🔄 Вносим ${amount} GROK...`)
    await new Promise(resolve => setTimeout(resolve, 800)); setGameBalance(prev => prev + amount); setPendingDeposit(null); setMessage(`✅ ${amount} GROK внесено!`)
  }

  // 🔗 ИСПРАВЛЕННОЕ ПОДКЛЮЧЕНИЕ (ПК + Мобильные)
  const handleConnect = async () => {
    setMessage('🔄 Открываю кошелёк...')
    try {
      // 📱 Мобильные → WalletConnect | 💻 ПК → MetaMask (или первый injected)
      const connector = isMobile()
        ? connectors.find(c => c.id === 'walletConnect')
        : (connectors.find(c => c.id === 'metaMask') || connectors.find(c => c.id === 'injected'))
        
      if (!connector) throw new Error('Кошелёк не найден. Установите MetaMask или Trust Wallet.')
      
      await connect({ connector })
      // Wagmi обновляет статус асинхронно. Ждем реакции.
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      if (!isConnected) throw new Error('Подключение отменено пользователем')
    } catch (err) {
      setMessage('⚠️ ' + (err.shortMessage || err.message || 'Не удалось подключиться'))
    }
  }

  // 👁️ АВТОПЕРЕХОД В ПРОФИЛЬ ПРИ УСПЕШНОМ ПОДКЛЮЧЕНИИ
  useEffect(() => {
    if (status === 'connected' && address && view === 'menu') {
      setView('profile')
      setMessage('✅ Кошелёк подключён! Добро пожаловать в лобби.')
    }
  }, [status, address, view])

  // 🎮 Запуск игры
  const startGame = (mode = 'guest') => {
    gameRef.current.reset(); const startFen = gameRef.current.fen()
    setFen(startFen); setHistory([startFen]); setMoveIndex(0); setMovesList([]); setIsPlayerTurn(true); setGameOver(false); setWinner(null)
    setSelectedSquare(null); setPossibleMoves([]); setPlayerTime(timeControl * 60); setBotTime(timeControl * 60); setTimerActive('player')
    if (mode === 'wallet' && gameBalance === 0) setGameBalance(0)
    setMessage('♟️ Ваш ход!'); setView('game'); setLobbyMode('playing')
  }

  const handleGuestLogin = () => startGame('guest')
  const handleLogout = () => { if (isConnected) disconnect(); setView('menu'); setLobbyMode('idle'); gameRef.current.reset() }
  const goToProfile = () => setView('profile')
  const handleBuyGrok = () => window.open('https://four.meme/token/0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444?code=AHGX96R5GHK9', '_blank')
  const handleThemeChange = (key) => { setBoardTheme(key); localStorage.setItem('chess4crypto_theme', key); setMessage(`🎨 Тема: ${BOARD_THEMES[key].name}`) }

  const handleBack = () => { if (moveIndex > 0 && !gameOver) { const i = moveIndex - 1; setMoveIndex(i); setFen(history[i]); gameRef.current.load(history[i]); setIsPlayerTurn(i % 2 === 0); setTimerActive(null); setMessage('⏪ История') } }
  const handleForward = () => { if (moveIndex < history.length - 1 && !gameOver) { const i = moveIndex + 1; setMoveIndex(i); setFen(history[i]); gameRef.current.load(history[i]); setIsPlayerTurn(i % 2 === 0); if (i === history.length - 1) { setTimerActive(isPlayerTurn ? 'player' : 'bot'); setMessage(isPlayerTurn ? '♟️ Ваш ход!' : '🤖 Бот думает...') } else setMessage('⏩ История') } }

  // 📱 PWA
  useEffect(() => { const h = (e) => { e.preventDefault(); setDeferredPrompt(e) }; window.addEventListener('beforeinstallprompt', h); return () => window.removeEventListener('beforeinstallprompt', h) }, [])
  const handleInstallApp = async () => { if (!deferredPrompt) { setShowInstallModal(true); return }; deferredPrompt.prompt(); await deferredPrompt.userChoice; setDeferredPrompt(null); setMessage('✅ Установлено!') }

  // 🔗 Обработка ссылки-приглашения
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const invite = params.get('invite') || params.get('game')
      if (invite && (isConnected || status === 'disconnected')) {
        setJoinCode(invite)
        setView('profile')
        setLobbyMode('join')
      }
    }
  }, [isConnected, status])

  // ⏱️ Таймер
  useEffect(() => { if (!timerActive || gameOver || lobbyMode !== 'playing') return; const interval = setInterval(() => { if (timerActive === 'player') { setPlayerTime(prev => { if (prev <= 1) { endGame('bot'); return 0 } return prev - 1 }) } else { setBotTime(prev => { if (prev <= 1) { endGame('player'); return 0 } return prev - 1 }) } }, 1000); return () => clearInterval(interval) }, [timerActive, gameOver, lobbyMode])

  const timeOptions = [{ value: 5, label: '5 мин' }, { value: 15, label: '15 мин' }, { value: 30, label: '30 мин' }, { value: 60, label: '1 ч' }, { value: 1440, label: '24 ч' }]
  const depositOptions = [1000, 5000, 10000, 50000, 100000, 500000]
  const theme = BOARD_THEMES[boardTheme]

  const handleCreateGame = () => {
    const id = `game_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    setGameId(id); setInviteLink(`${getShareUrl()}?invite=${id}`); setLobbyMode('create'); setMessage('🎉 Игра создана! Отправьте ссылку.')
  }
  const handleShareInvite = async () => { if (navigator.share) { try { await navigator.share({ title: 'Chess4Crypto', text: `Присоединяйся! Ставка: ${formatNumber(1000)} GROK`, url: inviteLink }) } catch(e){copyToClipboard()} } else copyToClipboard() }
  const copyToClipboard = () => { navigator.clipboard.writeText(inviteLink || `${getShareUrl()}?invite=${joinCode}`); setCopied(true); setMessage('📋 Скопировано!'); setTimeout(() => setCopied(false), 2000) }
  const handleJoinGame = () => { if (!joinCode) { setMessage('⚠️ Введите код/ссылку'); return }; setGameId(joinCode.replace(/^.*invite=/, '')); setLobbyMode('playing'); startGame(isConnected ? 'wallet' : 'guest') }

  // ============================================================================
  // 🎨 МЕНЮ ВХОДА
  // ============================================================================
  if (view === 'menu') {
    return (<div style={styles.screen}>
      <h1 style={styles.title}>♟️ {t('app.title')}</h1><p style={styles.sub}>{t('app.subtitle')}</p>
      <button onClick={handleInstallApp} style={styles.btnInstall}>📱 Скачать приложение</button>
      <button onClick={handleBuyGrok} style={styles.btnGrok}>💰 Купить GROK</button><p style={styles.grokHint}>Подключи кошелёк в BNB → купи GROK</p>
      <div style={styles.controlGroup}><label style={styles.label}>⏱️ Время:</label><select value={timeControl} onChange={e => setTimeControl(Number(e.target.value))} style={styles.select}>{timeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
      
      {/* 🔗 КНОПКА ПОДКЛЮЧЕНИЯ (Всегда видна, чёткий статус) */}
      <div style={styles.btnGroup}>
        <button onClick={handleGuestLogin} style={styles.btnPrimary}>👤 {t('app.guestLogin')}</button>
        <button onClick={handleConnect} style={styles.btnWallet} disabled={status === 'connecting'}>
          {status === 'connecting' ? '⏳' : isMobile() ? '🔗 ' : '🦊 '} {status === 'connected' ? '✅ Подключено' : t('app.connectWallet')}
        </button>
      </div>

      {isConnected && address && <div style={styles.balanceRow}><span>💼 Кошелёк:</span><span style={{fontSize:'0.8rem', color:'#94a3b8'}}>{address.slice(0,6)}...{address.slice(-4)}</span></div>}
      {gameBalance > 0 && <div style={styles.gameBalanceBadge}>🎮 Баланс: <strong>{formatNumber(gameBalance)} GROK</strong></div>}
      <select value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)} style={styles.langSelect}><option value="ru">🇷🇺 RU</option><option value="en">🇬🇧 EN</option></select>
    </div>)
  }

  // ============================================================================
  // 👤 ПРОФИЛЬ / ЛОББИ
  // ============================================================================
  if (view === 'profile') {
    return (<div style={styles.screen}>
      <header style={styles.header}><span style={styles.headerTitle}>👤 Профиль & Лобби</span><div style={styles.headerRight}><button onClick={handleLogout} style={{...styles.btnSmall, background:'#ef4444'}}>🚪 Выйти</button></div></header>
      
      <div style={styles.balanceCard}>
        <div style={styles.balanceLabel}>🎮 Баланс игры</div>
        <div style={styles.balanceValue}>{formatNumber(gameBalance)} <span style={{fontSize:'1rem'}}>GROK</span></div>
        {isConnected && address && <div style={{fontSize:'0.8rem', color:'#94a3b8', marginTop:'0.3rem'}}>🔗 {address.slice(0,6)}...{address.slice(-4)}</div>}
        {isConnected && gameBalance === 0 && <div style={styles.depositQuick}>{depositOptions.slice(0,3).map(amt => <button key={amt} onClick={() => handleDeposit(amt)} style={styles.btnDepositSmall}>+{formatNumber(amt)}</button>)}</div>}
      </div>

      {lobbyMode === 'idle' && (
        <div style={styles.lobbyCard}>
          <h3 style={styles.lobbyTitle}>🎯 Что будем делать?</h3>
          <div style={styles.lobbyGrid}>
            <button onClick={() => setLobbyMode('create')} style={styles.lobbyBtn}>➕ Создать игру</button>
            <button onClick={() => setLobbyMode('join')} style={styles.lobbyBtn}>🔍 Присоединиться</button>
            <button onClick={() => startGame(isConnected ? 'wallet' : 'guest')} style={styles.lobbyBtn}>🤖 Играть с ботом</button>
            <button onClick={handleBuyGrok} style={styles.lobbyBtnSecondary}>💰 Купить GROK</button>
          </div>
        </div>
      )}

      {lobbyMode === 'create' && (
        <div style={styles.lobbyCard}>
          <h3 style={styles.lobbyTitle}>➕ Создание игры</h3>
          <button onClick={handleCreateGame} style={styles.btnPrimary}>🎲 Сгенерировать ссылку</button>
          <button onClick={() => setLobbyMode('idle')} style={styles.btnSmall}>↩️ Назад</button>
        </div>
      )}

      {lobbyMode === 'join' && (
        <div style={styles.lobbyCard}>
          <h3 style={styles.lobbyTitle}>🔍 Присоединиться к игре</h3>
          <div style={styles.formGroup}><label style={styles.label}>Код или ссылка</label><input value={joinCode} onChange={e => setJoinCode(e.target.value)} style={styles.input} placeholder="Вставьте ссылку..." /></div>
          <button onClick={handleJoinGame} style={styles.btnPrimary}>🤝 Войти в игру</button>
          <button onClick={() => setLobbyMode('idle')} style={styles.btnSmall}>↩️ Назад</button>
        </div>
      )}

      {lobbyMode === 'create' && inviteLink && (
        <div style={styles.lobbyCard}>
          <h3 style={styles.lobbyTitle}>⏳ Отправьте ссылку другу</h3>
          <div style={styles.codeBox}>{inviteLink}</div>
          <div style={styles.waitActions}>
            <button onClick={copyToClipboard} style={styles.btnSmall}>{copied ? '✅ Скопировано' : '📋 Копировать'}</button>
            <button onClick={handleShareInvite} style={styles.btnSmall}>📤 Отправить</button>
            <button onClick={() => setLobbyMode('idle')} style={styles.btnSmallCancel}>❌ Назад</button>
          </div>
        </div>
      )}

      <div style={styles.themeCard}><h3 style={styles.statsTitle}>🎨 Дизайн доски</h3><div style={styles.themeGrid}>{Object.entries(BOARD_THEMES).map(([key, t]) => <button key={key} onClick={() => handleThemeChange(key)} style={{...styles.themeBtn, border: boardTheme === key ? '3px solid #fbbf24' : '2px solid #475569', background: `linear-gradient(135deg, ${t.light}, ${t.dark})`}}><div style={styles.themePreview}><div style={{...styles.themeSquare, background: t.light}} /><div style={{...styles.themeSquare, background: t.dark}} /></div><span style={styles.themeName}>{t.name}</span>{boardTheme === key && <span style={styles.themeCheck}>✓</span>}</button>)}</div></div>
      <select value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)} style={styles.langSelect}><option value="ru">🇷🇺 RU</option><option value="en">🇬🇧 EN</option></select>
    </div>)
  }

  // ============================================================================
  // 🎮 ИГРОВОЙ ЭКРАН
  // ============================================================================
  return (<div style={styles.screen}><header style={styles.header}><span style={styles.headerTitle}>♟️ Chess4Crypto</span><div style={styles.headerRight}>{isConnected && address && <span style={styles.walletBadge}>🔗 {address.slice(0,6)}...{address.slice(-4)}</span>}<button onClick={goToProfile} style={styles.btnSmall}>🏠</button></div></header>
    {gameOver && winner && <div style={styles.gameOverBanner}><div style={styles.gameOverIcon}>{winner === 'player' ? '🏆' : winner === 'bot' ? '🤖' : '🤝'}</div><div style={styles.gameOverText}>{winner === 'player' && '🎉 ВЫ ПОБЕДИЛИ!'}{winner === 'bot' && '😔 БОТ ПОБЕДИЛ'}{winner === 'draw' && '🤝 НИЧЬЯ'}</div>{winner === 'player' && gameBalance > 0 && <div style={styles.prizeText}>+{formatNumber(gameBalance)} GROK!</div>}<button onClick={() => { setView('profile'); setGameOver(false); setLobbyMode('idle'); }} style={styles.btnNewGame}>🏠 В лобби</button></div>}
    <div style={styles.timers}><div style={{...styles.timerBox, active: timerActive === 'player' && !gameOver}}><span>👤</span><span style={styles.timerText}>{fmtTime(playerTime)}</span></div><div style={{...styles.timerBox, active: timerActive === 'bot' && !gameOver}}><span>🤖</span><span style={styles.timerText}>{fmtTime(botTime)}</span></div></div>
    {gameBalance > 0 && !gameOver && <div style={styles.gameBalance}>💰 {formatNumber(gameBalance)} GROK</div>}
    {!gameOver && message && <div style={styles.statusMsg}>{message}</div>}
    <div style={styles.boardWrap}><Chessboard position={fen} onPieceDrop={onDrop} onSquareClick={onSquareClick} customSquareStyles={customSquareStyles} boardOrientation="white" customDarkSquareStyle={{ backgroundColor: theme.dark }} customLightSquareStyle={{ backgroundColor: theme.light }} /></div>
    <div style={styles.historyPanel}><div style={styles.historyHeader}><span>📜 Ходы:</span><span style={styles.historyCount}>{movesList.length}</span></div><div style={styles.historyList}>{movesList.map((m, i) => <span key={i} style={{...styles.moveChip, highlight: i === moveIndex - 1}}>{Math.floor(i/2)+1}.{i%2===0?'':'..'} {m.san}</span>)}{movesList.length === 0 && <span style={styles.emptyHist}>Ходов нет...</span>}</div></div>
    <div style={styles.controls}>
      <button onClick={() => { setSelectedSquare(null); setPossibleMoves([]); }} style={styles.btnCtrl}>✖️</button>
      <button onClick={handleBack} disabled={moveIndex === 0 || gameOver} style={styles.btnCtrl}>⏪</button>
      <button onClick={handleForward} disabled={moveIndex === history.length - 1 || gameOver} style={styles.btnCtrl}>⏩</button>
    </div>
    <p style={styles.modeInfo}>{lobbyMode === 'playing' ? '🤖 Режим бота' : '👤 Лобби'} • {timeOptions.find(o=>o.value===timeControl)?.label} • {theme.name}</p>
    {showInstallModal && <div style={styles.modalOverlay} onClick={() => setShowInstallModal(false)}><div style={styles.modal} onClick={e => e.stopPropagation()}><h3 style={styles.modalTitle}>📱 Установка</h3><p style={styles.modalStep}>Нажмите "Поделиться" ⎋ → "На экран «Домой»"</p><button onClick={() => setShowInstallModal(false)} style={styles.modalClose}>✓ Понятно</button></div></div>}
  </div>)
}

const styles = {
  screen: { minHeight: '100vh', background: '#0b1120', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.8rem' },
  title: { fontSize: '1.8rem', margin: '0.3rem 0', textAlign: 'center' }, sub: { color: '#94a3b8', marginBottom: '0.8rem', textAlign: 'center', maxWidth: '360px', fontSize: '0.95rem' },
  btnInstall: { padding: '0.7rem 1.2rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '1rem', marginBottom: '0.3rem', width: '100%', maxWidth: '320px' },
  btnGrok: { padding: '0.7rem 1.2rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '1rem', marginBottom: '0.4rem', width: '100%', maxWidth: '320px' },
  grokHint: { color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center', marginBottom: '0.8rem', maxWidth: '320px', lineHeight: '1.3' },
  controlGroup: { background: '#1e293b', padding: '0.7rem', borderRadius: '10px', marginBottom: '0.6rem', width: '100%', maxWidth: '320px' },
  label: { display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', color: '#cbd5e1' }, select: { width: '100%', padding: '0.45rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.95rem' }, input: { width: '100%', padding: '0.6rem', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '8px', fontSize: '1rem' },
  balanceRow: { display: 'flex', justifyContent: 'space-between', background: '#1e293b', padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '0.6rem', fontSize: '0.9rem', maxWidth: '320px', width: '100%' },
  depositGroup: { background: '#1e293b', padding: '0.7rem', borderRadius: '10px', marginBottom: '0.6rem', width: '100%', maxWidth: '320px' },
  depositButtons: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }, btnDeposit: { padding: '0.4rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' },
  btnGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: '320px', marginBottom: '0.6rem' }, btnPrimary: { padding: '0.8rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', width: '100%' },
  btnWallet: { padding: '0.8rem', background: '#f59e0b', color: '#000', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', width: '100%' },
  langSelect: { marginTop: '0.8rem', padding: '0.35rem', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }, gameBalanceBadge: { background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' },
  header: { width: '100%', maxWidth: '480px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '0.5rem 0.8rem', borderRadius: '10px', marginBottom: '0.6rem' },
  headerTitle: { fontWeight: 'bold', fontSize: '1.1rem' }, headerRight: { display: 'flex', alignItems: 'center', gap: '0.3rem' },
  walletBadge: { fontSize: '0.7rem', background: '#334155', padding: '0.15rem 0.4rem', borderRadius: '12px' }, btnSmall: { padding: '0.5rem 0.8rem', background: '#475569', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }, btnSmallCancel: { padding: '0.5rem 0.8rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' },
  balanceCard: { background: 'linear-gradient(135deg, #1e293b, #334155)', padding: '1rem', borderRadius: '14px', width: '100%', maxWidth: '360px', marginBottom: '0.8rem', textAlign: 'center', border: '2px solid #475569' }, balanceLabel: { fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.2rem' }, balanceValue: { fontSize: '1.8rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '0.4rem' },
  depositQuick: { display: 'flex', gap: '0.3rem', justifyContent: 'center', marginTop: '0.4rem' }, btnDepositSmall: { padding: '0.3rem 0.6rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' },
  lobbyCard: { background: '#1e293b', padding: '1rem', borderRadius: '14px', width: '100%', maxWidth: '360px', marginBottom: '0.8rem', textAlign: 'center', border: '2px solid #475569' }, lobbyTitle: { fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.8rem', color: '#fbbf24' }, lobbyGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }, lobbyBtn: { padding: '0.7rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }, lobbyBtnSecondary: { gridColumn: '1 / -1', padding: '0.7rem', background: '#f59e0b', color: '#000', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }, formGroup: { marginBottom: '0.8rem' }, infoText: { color: '#94a3b8', marginBottom: '0.8rem', fontSize: '0.9rem' }, codeBox: { background: '#0f172a', padding: '0.8rem', borderRadius: '8px', wordBreak: 'break-all', fontSize: '0.8rem', marginBottom: '0.8rem', border: '1px dashed #475569' }, waitActions: { display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' },
  timers: { display: 'flex', gap: '0.8rem', marginBottom: '0.4rem', width: '100%', maxWidth: '360px', justifyContent: 'space-around' }, timerBox: ({ active }) => ({ background: active ? '#059669' : '#1e293b', padding: '0.4rem 0.8rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: active ? '2px solid #34d399' : '2px solid transparent', transition: 'all 0.2s' }), timerText: { fontSize: '1.3rem', fontWeight: 'bold', fontFamily: 'monospace' },
  gameBalance: { background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: '#fff', padding: '0.35rem 0.9rem', borderRadius: '18px', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }, statusMsg: { color: '#38bdf8', textAlign: 'center', marginBottom: '0.25rem', minHeight: '1.1rem', fontSize: '0.95rem' },
  boardWrap: { width: 'min(95vw, 360px)', background: '#1e293b', padding: '0.25rem', borderRadius: '12px', marginBottom: '0.5rem' }, historyPanel: { width: '100%', maxWidth: '360px', background: '#1e293b', borderRadius: '10px', padding: '0.4rem', marginBottom: '0.5rem', maxHeight: '110px', overflow: 'hidden' }, historyHeader: { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem', paddingBottom: '0.2rem', borderBottom: '1px solid #334155' }, historyCount: { background: '#334155', padding: '0.1rem 0.4rem', borderRadius: '10px', fontSize: '0.75rem' }, historyList: { display: 'flex', flexWrap: 'wrap', gap: '0.25rem', overflowY: 'auto', maxHeight: '70px', padding: '0.15rem' }, moveChip: ({ highlight }) => ({ background: highlight ? '#3b82f6' : '#475569', padding: '0.15rem 0.4rem', borderRadius: '5px', fontSize: '0.75rem', fontWeight: '500' }), emptyHist: { color: '#64748b', fontSize: '0.75rem' }, controls: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '0.4rem' }, btnCtrl: { padding: '0.4rem 0.7rem', background: '#475569', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }, modeInfo: { color: '#64748b', fontSize: '0.75rem', textAlign: 'center', marginTop: 'auto' },
  gameOverBanner: { background: 'linear-gradient(135deg, #1e293b, #7c3aed)', padding: '1rem', borderRadius: '16px', width: '100%', maxWidth: '400px', textAlign: 'center', marginBottom: '0.6rem', border: '2px solid #a78bfa' }, gameOverIcon: { fontSize: '2.5rem', marginBottom: '0.3rem' }, gameOverText: { fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '0.3rem', color: '#fbbf24' }, prizeText: { color: '#34d399', fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.6rem' }, btnNewGame: { padding: '0.6rem 1.5rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem' },
  themeCard: { background: '#1e293b', padding: '0.8rem', borderRadius: '12px', width: '100%', maxWidth: '360px', marginBottom: '0.8rem' }, statsTitle: { margin: '0 0 0.6rem 0', fontSize: '1rem', color: '#cbd5e1' }, themeGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }, themeBtn: { padding: '0.5rem', borderRadius: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', transition: 'all 0.2s', position: 'relative' }, themePreview: { display: 'flex', gap: '2px' }, themeSquare: { width: '20px', height: '20px', borderRadius: '3px' }, themeName: { fontSize: '0.75rem', color: '#e2e8f0' }, themeCheck: { position: 'absolute', top: '-5px', right: '-5px', background: '#10b981', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }, modal: { background: '#1e293b', padding: '1.2rem', borderRadius: '16px', maxWidth: '400px', width: '100%', border: '2px solid #475569' }, modalTitle: { fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.8rem', color: '#fbbf24', textAlign: 'center' }, modalStep: { paddingLeft: '1.2rem', marginBottom: '0.4rem', color: '#e2e8f0', fontSize: '0.9rem', lineHeight: '1.6' }, modalClose: { width: '100%', padding: '0.7rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem' }
}

export default App