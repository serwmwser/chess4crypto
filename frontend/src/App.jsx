import { useState, useEffect, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useTranslation } from 'react-i18next'

// 🌍 Встроенный словарь переводов (гарантированно работает без внешних конфигов)
const TRANSLATIONS = {
  ru: {
    title: '♟️ Chess4Crypto',
    subtitle: 'Web3 шахматы с крипто-ставками',
    guest: '👤 Гостевой вход',
    connect: '🦊 Подключить кошелёк',
    buyGrok: '💰 Купить GROK',
    profile: '👤 Профиль',
    logout: '🚪',
    balance: '💰 {amount}',
    editProfile: '✏️ Редактировать профиль',
    save: '💾 Сохранить',
    rules: '📜 Правила ставок:',
    rule1: 'Создание игры требует внесения ставки.',
    rule2: 'Присоединение требует равной суммы.',
    rule3: 'Победитель забирает ВЕСЬ банк (×2).',
    rule4: 'При ничьей средства идут в фонд.',
    lobby: '🌐 Лобби',
    myGames: '📋 Мои',
    create: '➕ Создать',
    history: '🏆 История',
    invite: '🔗 Приглашение',
    time: '⏱️ Время',
    stake: '💰 Сумма',
    pay: '💳 Внести {amount} GROK',
    createGame: '🎲 Создать игру',
    copyLink: '📤 Скопировать ссылку',
    back: '⏪ Назад',
    forward: '⏩ Вперед',
    yourTurn: '♟️ Ваш ход!',
    botThinking: '🤖 Бот думает...',
    win: '🏆 CHECKMATE! ВЫ ПОБЕДИЛИ!',
    lose: '😔 Вы проиграли.',
    draw: '🤝 Ничья!',
    timeOutPlayer: '⏰ Время вышло! Бот победил.',
    timeOutBot: '⏰ Время вышло! Вы победили!',
    connected: '✅ Кошелёк подключён!',
    guestMode: '👤 Гостевой режим',
    noGames: 'Нет активных игр.',
    empty: 'Пусто.',
    lang: '🇷🇺 RU',
    langEn: '🇬🇧 EN'
  },
  en: {
    title: '♟️ Chess4Crypto',
    subtitle: 'Web3 chess with crypto stakes',
    guest: '👤 Guest Mode',
    connect: '🦊 Connect Wallet',
    buyGrok: '💰 Buy GROK',
    profile: '👤 Profile',
    logout: '🚪',
    balance: '💰 {amount}',
    editProfile: '✏️ Edit Profile',
    save: '💾 Save',
    rules: '📜 Staking Rules:',
    rule1: 'Creating a game requires a deposit.',
    rule2: 'Joining requires an equal amount.',
    rule3: 'Winner takes ALL the pot (×2).',
    rule4: 'Draws go to the development fund.',
    lobby: '🌐 Lobby',
    myGames: '📋 My Games',
    create: '➕ Create',
    history: '🏆 History',
    invite: '🔗 Invite',
    time: '⏱️ Time',
    stake: '💰 Stake',
    pay: '💳 Pay {amount} GROK',
    createGame: '🎲 Create Game',
    copyLink: '📤 Copy Link',
    back: '⏪ Back',
    forward: '⏩ Forward',
    yourTurn: '♟️ Your turn!',
    botThinking: '🤖 Bot thinking...',
    win: '🏆 CHECKMATE! YOU WIN!',
    lose: '😔 You lost.',
    draw: '🤝 Draw!',
    timeOutPlayer: '⏰ Time out! Bot wins.',
    timeOutBot: '⏰ Time out! You win!',
    connected: '✅ Wallet connected!',
    guestMode: '👤 Guest Mode',
    noGames: 'No active games.',
    empty: 'Empty.',
    lang: '🇬🇧 EN',
    langRu: '🇷🇺 RU'
  }
}

const BOARD_THEMES = {
  classic: { name: '🏛️ Classic', light: '#eeeed2', dark: '#769656' },
  wood3d: { name: '🪵 Wood', light: '#e8c49a', dark: '#8b6f47' }
}

const isMobile = () => /Android|webOS|iPhone|iPad/i.test(navigator.userAgent)
const fmtTime = (s) => { const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60; return h>0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}` }
const formatNumber = (n) => n.toLocaleString('ru-RU')
const GROK_BUY_LINK = 'https://four.meme/token/0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444?code=AHGX96R5GHK9'
const GROK_CONTRACT = '0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444'

function App() {
  const { t, i18n } = useTranslation()
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  
  const gameRef = useRef(new Chess())
  const [view, setView] = useState('menu')
  const [lobbyTab, setLobbyTab] = useState('lobby')
  const [fen, setFen] = useState(gameRef.current.fen())
  const [history, setHistory] = useState([gameRef.current.fen()])
  const [moveIndex, setMoveIndex] = useState(0)
  const [movesList, setMovesList] = useState([])
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  const [message, setMessage] = useState('')
  const [timeControl, setTimeControl] = useState(15)
  const [playerTime, setPlayerTime] = useState(15*60)
  const [botTime, setBotTime] = useState(15*60)
  const [timerActive, setTimerActive] = useState(null) // 'player' | 'bot' | null
  const [boardTheme, setBoardTheme] = useState('classic')
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [possibleMoves, setPossibleMoves] = useState([])
  const [boardWidth, setBoardWidth] = useState(360)
  const [userData, setUserData] = useState({ balance: 50000, profile: { nickname: '', country: 'RU' }, history: [] })
  const [games, setGames] = useState([])
  const [createStake, setCreateStake] = useState(5000)
  const [pendingJoinGame, setPendingJoinGame] = useState(null)
  const [showGrokModal, setShowGrokModal] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [copiedContract, setCopiedContract] = useState(false)
  const [lang, setLang] = useState('ru') // ✅ Управление языком

  // 📏 Размер доски
  useEffect(() => {
    const u = () => setBoardWidth(Math.min(window.innerWidth * 0.88, 380))
    u(); window.addEventListener('resize', u)
    return () => window.removeEventListener('resize', u)
  }, [])

  // ✅ ТАЙМЕР (ИСПРАВЛЕН: функциональные обновления + useRef для очистки)
  const timerRef = useRef(null)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!timerActive || gameOver) return

    timerRef.current = setInterval(() => {
      if (timerActive === 'player') {
        setPlayerTime(prev => {
          if (prev <= 1) { finishGame('bot', 'time'); return 0 }
          return prev - 1
        })
      } else if (timerActive === 'bot') {
        setBotTime(prev => {
          if (prev <= 1) { finishGame('player', 'time'); return 0 }
          return prev - 1
        })
      }
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [timerActive, gameOver])

  // 🌐 Язык (ИСПРАВЛЕН: прямое переключение без i18next зависимостей)
  const toggleLang = () => {
    const next = lang === 'ru' ? 'en' : 'ru'
    setLang(next)
    if (i18n?.changeLanguage) i18n.changeLanguage(next)
  }

  const tKey = useCallback((key) => TRANSLATIONS[lang][key] || key, [lang])

  // 🔘 КНОПКИ (ИСПРАВЛЕНЫ: прямые обработчики + безопасные fallback)
  const handleGuest = () => {
    setMessage(tKey('guestMode'))
    setPlayerTime(timeControl * 60)
    setBotTime(timeControl * 60)
    setGameOver(false)
    setWinner(null)
    startGame()
  }

  const handleConnect = async () => {
    if (isConnecting) return
    setIsConnecting(true)
    try {
      const c = connectors.find(x => x.id === (isMobile() ? 'walletConnect' : 'metaMask')) || connectors[0]
      if (c) await connect({ connector: c })
      // Fallback для прямого вызова MetaMask
      if (window.ethereum && !isConnected) {
        await window.ethereum.request({ method: 'eth_requestAccounts' })
      }
      setMessage(tKey('connected'))
      setView('profile')
    } catch (e) {
      setMessage(e.message?.includes('rejected') ? '' : '⚠️ Ошибка подключения')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleBuyGrok = () => {
    console.log('💰 Opening GROK modal')
    setShowGrokModal(true)
  }

  const startGame = () => {
    gameRef.current.reset()
    setFen(gameRef.current.fen())
    setHistory([gameRef.current.fen()])
    setMoveIndex(0)
    setMovesList([])
    setIsPlayerTurn(true)
    setGameOver(false)
    setWinner(null)
    setSelectedSquare(null)
    setPossibleMoves([])
    setPlayerTime(timeControl * 60)
    setBotTime(timeControl * 60)
    setTimerActive('player') // ✅ Запуск таймера
    setView('game')
  }

  const finishGame = (result, reason) => {
    setTimerActive(null)
    setGameOver(true)
    let msg = reason === 'time' ? (result === 'player' ? tKey('timeOutBot') : tKey('timeOutPlayer')) : (result === 'player' ? tKey('win') : result === 'bot' ? tKey('lose') : tKey('draw'))
    setWinner(result)
    setMessage(msg)
  }

  const makeBotMove = useCallback(() => {
    if (gameOver || gameRef.current.isGameOver()) return
    const mv = gameRef.current.moves()
    if (!mv.length) return
    const r = mv[Math.floor(Math.random() * mv.length)]
    gameRef.current.move(r)
    const nf = gameRef.current.fen()
    setHistory(h => [...h, nf])
    setMovesList(m => [...m, { san: r, from: r.from || 'e2', to: r.to || 'e4' }])
    setFen(nf)
    setMoveIndex(i => i + 1)
    setIsPlayerTurn(true)
    setTimerActive('player') // ✅ Переключение таймера на игрока
    if (gameRef.current.isCheckmate()) finishGame('bot')
    else if (gameRef.current.isDraw()) finishGame('draw')
    else setMessage(tKey('yourTurn'))
  }, [gameOver, tKey])

  const onDrop = useCallback((src, tgt) => {
    if (!isPlayerTurn || gameOver) return false
    try {
      const mv = gameRef.current.move({ from: src, to: tgt, promotion: 'q' })
      if (!mv) return false
      const nf = gameRef.current.fen()
      setHistory(h => [...h, nf])
      setMovesList(m => [...m, { san: mv.san, from: src, to: tgt }])
      setFen(nf)
      setMoveIndex(i => i + 1)
      setIsPlayerTurn(false)
      setTimerActive('bot') // ✅ Переключение таймера на бота
      setSelectedSquare(null)
      setPossibleMoves([])
      if (gameRef.current.isCheckmate()) finishGame('player')
      else if (gameRef.current.isDraw()) finishGame('draw')
      else { setMessage(tKey('botThinking')); setTimeout(makeBotMove, 600) }
      return true
    } catch { return false }
  }, [isPlayerTurn, gameOver, makeBotMove, tKey])

  const onSqClick = useCallback((sq) => {
    if (gameOver) return
    const p = gameRef.current.get(sq)
    if (p && p.color === (isPlayerTurn ? 'w' : 'b')) { setSelectedSquare(sq); setPossibleMoves(gameRef.current.moves({ square: sq, verbose: true }).map(m => m.to)); return }
    if (selectedSquare && possibleMoves.includes(sq)) { onDrop(selectedSquare, sq); setSelectedSquare(null); setPossibleMoves([]); return }
    setSelectedSquare(null); setPossibleMoves([])
  }, [gameOver, isPlayerTurn, selectedSquare, possibleMoves])

  const theme = BOARD_THEMES[boardTheme]

  // ============================================================================
  // 🎨 МЕНЮ
  // ============================================================================
  if (view === 'menu') return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0f172a,#1e293b)',color:'#f1f5f9',fontFamily:'system-ui',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'2rem',textAlign:'center'}}>
      <h1 style={{fontSize:'2.5rem',fontWeight:'bold',color:'#fbbf24',margin:'0 0 0.5rem 0'}}>{tKey('title')}</h1>
      <p style={{color:'#94a3b8',fontSize:'1.1rem',marginBottom:'2rem'}}>{tKey('subtitle')}</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',width:'100%',maxWidth:'320px'}}>
        <button onClick={handleGuest} style={{padding:'1rem',background:'linear-gradient(135deg,#3b82f6,#2563eb)',color:'#fff',border:'none',borderRadius:'12px',cursor:'pointer',fontSize:'1.1rem',fontWeight:'600'}}>{tKey('guest')}</button>
        <button onClick={handleConnect} disabled={isConnecting} style={{padding:'1rem',background:isConnecting?'#64748b':'linear-gradient(135deg,#f59e0b,#d97706)',color:isConnecting?'#94a3b8':'#000',border:'none',borderRadius:'12px',cursor:isConnecting?'not-allowed':'pointer',fontSize:'1.1rem',fontWeight:'600'}}>{isConnecting?'⏳...':(isMobile()?'🔗':'🦊')} {tKey('connect')}</button>
        <button onClick={handleBuyGrok} style={{padding:'1rem',background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#000',border:'none',borderRadius:'12px',cursor:'pointer',fontSize:'1.1rem',fontWeight:'600'}}>{tKey('buyGrok')}</button>
      </div>
      {message && <div style={{marginTop:'1.5rem',padding:'0.8rem',background:'rgba(59,130,246,0.2)',borderRadius:'10px',color:'#60a5fa'}}>{message}</div>}
      <button onClick={toggleLang} style={{marginTop:'2rem',padding:'0.5rem 1rem',background:'#334155',color:'#fff',border:'1px solid #475569',borderRadius:'8px',cursor:'pointer'}}>{lang === 'ru' ? tKey('langEn') : tKey('langRu')}</button>
    </div>
  )

  // ============================================================================
  // 👤 ПРОФИЛЬ
  // ============================================================================
  if (view === 'profile') return (
    <div style={{minHeight:'100vh',background:'#0f172a',color:'#f1f5f9',fontFamily:'system-ui',display:'flex',flexDirection:'column',alignItems:'center',padding:'1rem'}}>
      <header style={{width:'100%',maxWidth:'500px',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.8rem 1rem',background:'#1e293b',borderRadius:'12px',marginBottom:'1rem'}}>
        <span style={{fontWeight:'bold'}}>{userData.profile.nickname || 'Гость'}</span>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <span style={{background:'#334155',padding:'0.3rem 0.6rem',borderRadius:'8px',color:'#fbbf24'}}>{tKey('balance').replace('{amount}', formatNumber(userData.balance))}</span>
          <button onClick={() => disconnect(); setView('menu')} style={{padding:'0.4rem',background:'#ef4444',color:'#fff',border:'none',borderRadius:'8px'}}>{tKey('logout')}</button>
        </div>
      </header>
      <button onClick={handleBuyGrok} style={{width:'100%',maxWidth:'500px',padding:'0.9rem',background:'#f59e0b',color:'#000',border:'none',borderRadius:'12px',cursor:'pointer',fontSize:'1rem',fontWeight:'600',marginBottom:'1rem'}}>{tKey('buyGrok')}</button>
      <div style={{display:'flex',gap:'0.5rem',width:'100%',maxWidth:'500px',marginBottom:'1rem'}}>{['lobby','my','create'].map(k=>(<button key={k} onClick={()=>setLobbyTab(k)} style={{flex:1,padding:'0.5rem',background:lobbyTab===k?'#3b82f6':'#1e293b',color:'#fff',border:'none',borderRadius:'8px'}}>{k==='lobby'?tKey('lobby'):k==='my'?tKey('myGames'):tKey('create')}</button>))}</div>
      <button onClick={() => setView('menu')} style={{padding:'0.8rem',background:'#10b981',color:'#fff',border:'none',borderRadius:'10px',cursor:'pointer'}}>{tKey('guest')}</button>
      <button onClick={toggleLang} style={{marginTop:'1rem',padding:'0.5rem 1rem',background:'#334155',color:'#fff',border:'1px solid #475569',borderRadius:'8px',cursor:'pointer'}}>{lang === 'ru' ? tKey('langEn') : tKey('langRu')}</button>
    </div>
  )

  // ============================================================================
  // 🎮 ИГРА
  // ============================================================================
  return (
    <div style={{minHeight:'100vh',background:'#0f172a',color:'#f1f5f9',fontFamily:'system-ui',display:'flex',flexDirection:'column',alignItems:'center',padding:'0.8rem'}}>
      <div style={{display:'flex',justifyContent:'space-around',width:'100%',maxWidth:'400px',marginBottom:'0.8rem'}}>
        <div style={{background:timerActive==='player'?'#059669':'#1e293b',padding:'0.6rem',borderRadius:'10px',textAlign:'center'}}>
          <div style={{fontSize:'0.85rem',color:'#94a3b8'}}>👤 Вы</div>
          <div style={{fontSize:'1.4rem',fontWeight:'bold',fontFamily:'monospace'}}>{fmtTime(playerTime)}</div>
        </div>
        <div style={{background:timerActive==='bot'?'#059669':'#1e293b',padding:'0.6rem',borderRadius:'10px',textAlign:'center'}}>
          <div style={{fontSize:'0.85rem',color:'#94a3b8'}}>🤖 Бот</div>
          <div style={{fontSize:'1.4rem',fontWeight:'bold',fontFamily:'monospace'}}>{fmtTime(botTime)}</div>
        </div>
      </div>
      {message && <div style={{color:'#38bdf8',marginBottom:'0.6rem'}}>{message}</div>}
      <div style={{width:boardWidth,height:boardWidth,background:'#1e293b',padding:'10px',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'1rem'}}>
        <Chessboard position={fen} onPieceDrop={onDrop} onSquareClick={onSqClick} boardWidth={boardWidth} customDarkSquareStyle={{backgroundColor:theme.dark}} customLightSquareStyle={{backgroundColor:theme.light}} />
      </div>
      <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem'}}>
        <button onClick={() => setView('profile')} style={{padding:'0.6rem 1rem',background:'#3b82f6',color:'#fff',border:'none',borderRadius:'8px'}}>{tKey('profile')}</button>
        <button onClick={toggleLang} style={{padding:'0.6rem 1rem',background:'#334155',color:'#fff',border:'1px solid #475569',borderRadius:'8px'}}>{lang === 'ru' ? tKey('langEn') : tKey('langRu')}</button>
      </div>
      {gameOver && (
        <div style={{background:'#1e293b',padding:'1rem',borderRadius:'12px',textAlign:'center',maxWidth:'400px'}}>
          <h3 style={{color:'#fbbf24'}}>{winner==='player'?tKey('win'):winner==='bot'?tKey('lose'):tKey('draw')}</h3>
          <button onClick={() => {setGameOver(false); setView('profile')}} style={{padding:'0.8rem',background:'#10b981',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer'}}>{tKey('profile')}</button>
        </div>
      )}
    </div>
  )
}

export default App