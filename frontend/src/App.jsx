import { useState, useEffect, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'

// 🌍 Встроенный словарь (без внешних зависимостей i18n)
const T = {
  ru: {
    title: '♟️ Chess4Crypto', subtitle: 'Web3 шахматы с крипто-ставками',
    guest: '👤 Гостевой вход', connect: '🦊 Подключить кошелёк', buyGrok: '💰 Купить GROK',
    profile: '👤 Профиль', logout: '🚪', editProfile: '✏️ Редактировать профиль',
    rules: '📜 Правила: 1. Внесите ставку. 2. Присоединяйтесь с равной суммой. 3. Победитель забирает ×2. 4. Ничья → в фонд.',
    lobby: '🌐 Лобби', myGames: '📋 Мои', create: '➕ Создать', history: '🏆 История',
    back: '⏪ Назад', forward: '⏩ Вперед', yourTurn: '♟️ Ваш ход!', botThinking: '🤖 Бот думает...',
    win: '🏆 CHECKMATE! ВЫ ПОБЕДИЛИ!', lose: '😔 Вы проиграли.', draw: '🤝 Ничья!',
    timeOutPlayer: '⏰ Время вышло! Бот победил.', timeOutBot: '⏰ Время вышло! Вы победили!',
    connected: '✅ Кошелёк подключён!', guestMode: '👤 Гостевой режим', noGames: 'Нет игр.',
    langSwitch: '🇬🇧 EN', lang: '🇷🇺 RU'
  },
  en: {
    title: '♟️ Chess4Crypto', subtitle: 'Web3 chess with crypto stakes',
    guest: '👤 Guest Mode', connect: '🦊 Connect Wallet', buyGrok: '💰 Buy GROK',
    profile: '👤 Profile', logout: '🚪', editProfile: '✏️ Edit Profile',
    rules: '📜 Rules: 1. Deposit stake. 2. Join with equal amount. 3. Winner takes ×2. 4. Draw → fund.',
    lobby: '🌐 Lobby', myGames: '📋 My Games', create: '➕ Create', history: '🏆 History',
    back: '⏪ Back', forward: '⏩ Forward', yourTurn: '♟️ Your turn!', botThinking: '🤖 Bot thinking...',
    win: '🏆 CHECKMATE! YOU WIN!', lose: '😔 You lost.', draw: '🤝 Draw!',
    timeOutPlayer: '⏰ Time out! Bot wins.', timeOutBot: '⏰ Time out! You win!',
    connected: '✅ Wallet connected!', guestMode: '👤 Guest Mode', noGames: 'No games.',
    langSwitch: '🇷🇺 RU', lang: '🇬🇧 EN'
  }
}

const isMobile = () => /Android|webOS|iPhone|iPad/i.test(navigator.userAgent)
const fmtTime = (s) => { const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60; return h>0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}` }
const GROK_LINK = 'https://four.meme/token/0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444?code=AHGX96R5GHK9'

export default function App() {
  const [lang, setLang] = useState('ru')
  const t = useCallback((key) => T[lang][key] || key, [lang])
  
  const [view, setView] = useState('menu')
  const [message, setMessage] = useState('')
  const [showGrok, setShowGrok] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  
  // 🎮 Шахматы
  const gameRef = useRef(new Chess())
  const [fen, setFen] = useState(gameRef.current.fen())
  const [history, setHistory] = useState([gameRef.current.fen()])
  const [moveIndex, setMoveIndex] = useState(0)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  
  // ⏱️ Таймер
  const [timeControl, setTimeControl] = useState(15)
  const [playerTime, setPlayerTime] = useState(15*60)
  const [botTime, setBotTime] = useState(15*60)
  const [timerActive, setTimerActive] = useState(null)
  const timerRef = useRef(null)

  // 📏 Размер доски
  const [boardW, setBoardW] = useState(360)
  useEffect(() => {
    const u = () => setBoardW(Math.min(window.innerWidth * 0.88, 380))
    u(); window.addEventListener('resize', u)
    return () => window.removeEventListener('resize', u)
  }, [])

  // ✅ ТАЙМЕР (Функциональные обновления + безопасная очистка)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!timerActive || gameOver) return

    timerRef.current = setInterval(() => {
      if (timerActive === 'player') {
        setPlayerTime(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); setGameOver(true); setWinner('bot'); setMessage(t('timeOutPlayer')); return 0 }
          return prev - 1
        })
      } else if (timerActive === 'bot') {
        setBotTime(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); setGameOver(true); setWinner('player'); setMessage(t('timeOutBot')); return 0 }
          return prev - 1
        })
      }
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [timerActive, gameOver, t])

  // 🔘 КНОПКИ (Безопасные, не крашат приложение)
  const handleGuest = () => {
    setMessage(t('guestMode'))
    setPlayerTime(timeControl * 60); setBotTime(timeControl * 60)
    setGameOver(false); setWinner(null); setIsPlayerTurn(true)
    startGame()
  }

  const handleConnect = async () => {
    if (isConnecting) return
    setIsConnecting(true)
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' })
        setMessage(t('connected'))
        setView('profile')
      } else {
        throw new Error('Wallet not found')
      }
    } catch (e) {
      console.warn('Wallet skipped:', e.message)
      setMessage(lang === 'ru' ? '⚠️ MetaMask не установлен. Используйте гостевой режим.' : '⚠️ MetaMask not found. Use Guest Mode.')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleBuyGrok = () => setShowGrok(true)

  const startGame = () => {
    gameRef.current.reset()
    setFen(gameRef.current.fen())
    setHistory([gameRef.current.fen()])
    setMoveIndex(0)
    setIsPlayerTurn(true)
    setGameOver(false)
    setWinner(null)
    setPlayerTime(timeControl * 60)
    setBotTime(timeControl * 60)
    setTimerActive('player') // ✅ Запуск таймера
    setView('game')
  }

  const makeBotMove = useCallback(() => {
    if (gameOver || gameRef.current.isGameOver()) return
    const mv = gameRef.current.moves()
    if (!mv.length) return
    const r = mv[Math.floor(Math.random() * mv.length)]
    gameRef.current.move(r)
    setHistory(h => [...h, gameRef.current.fen()])
    setFen(gameRef.current.fen())
    setMoveIndex(i => i + 1)
    setIsPlayerTurn(true)
    setTimerActive('player') // ✅ Переключение на игрока
    if (gameRef.current.isCheckmate()) { setGameOver(true); setWinner('bot'); setMessage(t('lose')) }
    else if (gameRef.current.isDraw()) { setGameOver(true); setWinner(null); setMessage(t('draw')) }
    else setMessage(t('yourTurn'))
  }, [gameOver, t])

  const onDrop = useCallback((src, tgt) => {
    if (!isPlayerTurn || gameOver) return false
    try {
      const mv = gameRef.current.move({ from: src, to: tgt, promotion: 'q' })
      if (!mv) return false
      setHistory(h => [...h, gameRef.current.fen()])
      setFen(gameRef.current.fen())
      setMoveIndex(i => i + 1)
      setIsPlayerTurn(false)
      setTimerActive('bot') // ✅ Переключение на бота
      if (gameRef.current.isCheckmate()) { setGameOver(true); setWinner('player'); setMessage(t('win')) }
      else if (gameRef.current.isDraw()) { setGameOver(true); setWinner(null); setMessage(t('draw')) }
      else { setMessage(t('botThinking')); setTimeout(makeBotMove, 600) }
      return true
    } catch { return false }
  }, [isPlayerTurn, gameOver, makeBotMove, t])

  // ============================================================================
  // 🎨 РЕНДЕР
  // ============================================================================
  if (view === 'menu') return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0f172a,#1e293b)',color:'#f1f5f9',fontFamily:'system-ui',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'2rem',textAlign:'center'}}>
      <h1 style={{fontSize:'2.5rem',color:'#fbbf24',margin:'0 0 0.5rem'}}>{t('title')}</h1>
      <p style={{color:'#94a3b8',marginBottom:'2rem'}}>{t('subtitle')}</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',width:'100%',maxWidth:'320px'}}>
        <button onClick={handleGuest} style={btnStyle('linear-gradient(135deg,#3b82f6,#2563eb)')}>{t('guest')}</button>
        <button onClick={handleConnect} disabled={isConnecting} style={btnStyle(isConnecting?'#64748b':'linear-gradient(135deg,#f59e0b,#d97706)')}>{isConnecting?'⏳...':'🦊'} {t('connect')}</button>
        <button onClick={handleBuyGrok} style={btnStyle('linear-gradient(135deg,#10b981,#059669)')}>{t('buyGrok')}</button>
      </div>
      {message && <div style={{marginTop:'1rem',padding:'0.5rem',background:'rgba(59,130,246,0.2)',borderRadius:'8px',color:'#60a5fa'}}>{message}</div>}
      <button onClick={()=>setLang(l=>l==='ru'?'en':'ru')} style={{...btnStyle('#334155'),marginTop:'1.5rem'}}>{t('langSwitch')}</button>
    </div>
  )

  if (view === 'profile') return (
    <div style={{minHeight:'100vh',background:'#0f172a',color:'#f1f5f9',fontFamily:'system-ui',display:'flex',flexDirection:'column',alignItems:'center',padding:'1rem'}}>
      <h2 style={{color:'#fbbf24'}}>{t('profile')}</h2>
      <button onClick={()=>setView('menu')} style={btnStyle('#ef4444')}>{t('logout')}</button>
      <button onClick={handleBuyGrok} style={{...btnStyle('#f59e0b'),color:'#000',marginTop:'1rem'}}>{t('buyGrok')}</button>
      <button onClick={()=>setLang(l=>l==='ru'?'en':'ru')} style={btnStyle('#334155')}>{t('langSwitch')}</button>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#0f172a',color:'#f1f5f9',fontFamily:'system-ui',display:'flex',flexDirection:'column',alignItems:'center',padding:'0.8rem'}}>
      <div style={{display:'flex',justifyContent:'space-around',width:'100%',maxWidth:'400px',marginBottom:'0.8rem'}}>
        <TimerBox label="👤 Вы" time={playerTime} active={timerActive==='player'} />
        <TimerBox label="🤖 Бот" time={botTime} active={timerActive==='bot'} />
      </div>
      {message && <div style={{color:'#38bdf8',marginBottom:'0.6rem'}}>{message}</div>}
      <div style={{background:'#1e293b',padding:'10px',borderRadius:'12px',marginBottom:'1rem'}}>
        <Chessboard position={fen} onPieceDrop={onDrop} boardWidth={boardW} customDarkSquareStyle={{backgroundColor:'#769656'}} customLightSquareStyle={{backgroundColor:'#eeeed2'}} />
      </div>
      <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem'}}>
        <button onClick={()=>{setView('profile')}} style={btnStyle('#3b82f6')}>{t('profile')}</button>
        <button onClick={()=>setLang(l=>l==='ru'?'en':'ru')} style={btnStyle('#334155')}>{t('langSwitch')}</button>
      </div>
      {gameOver && (
        <div style={{background:'#1e293b',padding:'1rem',borderRadius:'12px',textAlign:'center',maxWidth:'400px'}}>
          <h3 style={{color:'#fbbf24'}}>{winner==='player'?t('win'):winner==='bot'?t('lose'):t('draw')}</h3>
          <button onClick={()=>setView('profile')} style={btnStyle('#10b981')}>{t('profile')}</button>
        </div>
      )}
      {showGrok && <Modal onClose={()=>setShowGrok(false)} title={t('buyGrok')} content={lang==='ru'?'Для игры используйте токен GROK на BNB Chain. Перейдите на four.meme, подключите кошелёк и купите GROK.':'Use GROK token on BNB Chain. Go to four.meme, connect wallet, and buy GROK.'} link={GROK_LINK} />}
    </div>
  )
}

// 🧩 Вспомогательные компоненты
const btnStyle = (bg) => ({padding:'0.8rem 1.2rem',background:bg,color:'#fff',border:'none',borderRadius:'10px',cursor:'pointer',fontWeight:'600',fontSize:'1rem'})
const TimerBox = ({label, time, active}) => (
  <div style={{background:active?'#059669':'#1e293b',padding:'0.6rem 1rem',borderRadius:'10px',textAlign:'center',border:active?'2px solid #34d399':'2px solid transparent'}}>
    <div style={{fontSize:'0.85rem',color:'#94a3b8'}}>{label}</div>
    <div style={{fontSize:'1.4rem',fontWeight:'bold',fontFamily:'monospace'}}>{fmtTime(time)}</div>
  </div>
)
const Modal = ({onClose, title, content, link}) => (
  <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={onClose}>
    <div style={{background:'#1e293b',padding:'1.5rem',borderRadius:'12px',maxWidth:'350px',textAlign:'center'}} onClick={e=>e.stopPropagation()}>
      <h3 style={{color:'#fbbf24',marginBottom:'0.5rem'}}>{title}</h3>
      <p style={{color:'#cbd5e1',marginBottom:'1rem'}}>{content}</p>
      <a href={link} target="_blank" rel="noopener" style={{display:'inline-block',padding:'0.6rem 1rem',background:'#3b82f6',color:'#fff',textDecoration:'none',borderRadius:'8px',marginBottom:'0.5rem'}}>🔗 Открыть</a>
      <br/><button onClick={onClose} style={btnStyle('#64748b')}>Закрыть</button>
    </div>
  </div>
)