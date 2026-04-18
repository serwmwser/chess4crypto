import { useState, useEffect, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'

// 🛡️ ГЛОБАЛЬНАЯ ЗАЩИТА: глушит ошибки расширения MetaMask, если оно не установлено
window.addEventListener('unhandledrejection', event => {
  if (event.reason?.message?.includes('MetaMask') || event.reason?.message?.includes('not found')) {
    event.preventDefault()
    console.warn('🛡️ Wallet extension not found. Connection skipped safely.')
  }
})

// 🌍 Встроенный словарь (нулевые зависимости)
const TRANSLATIONS = {
  ru: {
    title: '♟️ Chess4Crypto', subtitle: 'Web3 шахматы с крипто-ставками',
    guest: '👤 Гостевой вход', connect: '🦊 Подключить кошелёк', buyGrok: '💰 Купить GROK',
    profile: '👤 Профиль', logout: '🚪 Выйти', save: '💾 Сохранить',
    rules: '📜 Правила: 1. Внесите ставку. 2. Присоединяйтесь с равной суммой. 3. Победитель забирает ×2. 4. Ничья → фонд.',
    lobby: '🌐 Лобби', myGames: '📋 Мои', create: '➕ Создать', history: '🏆 История',
    back: '⏪ Назад', forward: '⏩ Вперед', yourTurn: '♟️ Ваш ход!', botThinking: '🤖 Бот думает...',
    win: '🏆 CHECKMATE! ВЫ ПОБЕДИЛИ!', lose: '😔 Вы проиграли.', draw: '🤝 Ничья!',
    timeOutPlayer: '⏰ Время вышло! Бот победил.', timeOutBot: '⏰ Время вышло! Вы победили!',
    connected: '✅ Кошелёк подключён!', guestMode: '👤 Гостевой режим',
    noWallet: '⚠️ MetaMask не установлен. Используйте гостевой режим.',
    langSwitch: '🇬🇧 EN', close: 'Закрыть', openLink: '🔗 Перейти на four.meme',
    grokDesc: 'Для игры используйте токен GROK (BNB Chain). Подключите кошелёк и купите монету.',
    noGames: 'Нет активных игр.', empty: 'Пусто.', editProfile: '✏️ Редактировать профиль'
  },
  en: {
    title: '♟️ Chess4Crypto', subtitle: 'Web3 Chess with Crypto Stakes',
    guest: '👤 Guest Mode', connect: '🦊 Connect Wallet', buyGrok: '💰 Buy GROK',
    profile: '👤 Profile', logout: '🚪 Logout', save: '💾 Save',
    rules: '📜 Rules: 1. Deposit stake. 2. Join with equal amount. 3. Winner takes ×2. 4. Draw → fund.',
    lobby: '🌐 Lobby', myGames: '📋 My Games', create: '➕ Create', history: '🏆 History',
    back: '⏪ Back', forward: '⏩ Forward', yourTurn: '♟️ Your turn!', botThinking: '🤖 Bot thinking...',
    win: '🏆 CHECKMATE! YOU WIN!', lose: '😔 You lost.', draw: '🤝 Draw!',
    timeOutPlayer: '⏰ Time out! Bot wins.', timeOutBot: '⏰ Time out! You win!',
    connected: '✅ Wallet connected!', guestMode: '👤 Guest Mode',
    noWallet: '⚠️ MetaMask not found. Use Guest mode.',
    langSwitch: '🇷🇺 RU', close: 'Close', openLink: '🔗 Go to four.meme',
    grokDesc: 'Use GROK token (BNB Chain) to play. Connect wallet and buy coins.',
    noGames: 'No active games.', empty: 'Empty.', editProfile: '✏️ Edit Profile'
  }
}

const BOARD_THEMES = {
  classic: { name: '🏛️ Classic', light: '#eeeed2', dark: '#769656' },
  wood3d: { name: '🪵 Wood', light: '#e8c49a', dark: '#8b6f47' },
  neon: { name: '💜 Neon', light: '#1a1a2e', dark: '#16213e' }
}

const fmtTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`
const GROK_LINK = 'https://four.meme/token/0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444?code=AHGX96R5GHK9'

export default function App() {
  const [lang, setLang] = useState('ru')
  const t = useCallback((key) => TRANSLATIONS[lang][key] || key, [lang])

  const [view, setView] = useState('menu')
  const [msg, setMsg] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [showGrok, setShowGrok] = useState(false)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [nickname, setNickname] = useState('Гость')
  const [boardTheme, setBoardTheme] = useState('classic')

  const gameRef = useRef(new Chess())
  const [fen, setFen] = useState(gameRef.current.fen())
  const [history, setHistory] = useState([gameRef.current.fen()])
  const [moveIdx, setMoveIdx] = useState(0)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  const [boardSize, setBoardSize] = useState(Math.min(window.innerWidth * 0.9, 400))

  const [timeCtrl] = useState(15)
  const [pTime, setPTime] = useState(timeCtrl * 60)
  const [bTime, setBTime] = useState(timeCtrl * 60)
  const [timerActive, setTimerActive] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    const u = () => setBoardSize(Math.min(window.innerWidth * 0.9, 400))
    window.addEventListener('resize', u)
    return () => window.removeEventListener('resize', u)
  }, [])

  // ✅ ТАЙМЕР (Функциональные обновления + безопасная очистка)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!timerActive || gameOver) return

    timerRef.current = setInterval(() => {
      if (timerActive === 'player') {
        setPTime(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); setGameOver(true); setWinner('bot'); setMsg(t('timeOutPlayer')); return 0 }
          return prev - 1
        })
      } else if (timerActive === 'bot') {
        setBTime(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); setGameOver(true); setWinner('player'); setMsg(t('timeOutBot')); return 0 }
          return prev - 1
        })
      }
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [timerActive, gameOver, t])

  // 🔘 КНОПКИ (Без async/await -> нет Unhandled Promise)
  const handleGuest = useCallback(() => {
    setMsg(t('guestMode'))
    setGameOver(false); setWinner(null); setMsg('')
    setPTime(timeCtrl * 60); setBTime(timeCtrl * 60)
    startGame()
  }, [timeCtrl, t])

  const handleConnect = useCallback(() => {
    if (isConnecting) return
    setIsConnecting(true)
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_requestAccounts' })
        .then(() => {
          setMsg(t('connected'))
          setView('profile')
        })
        .catch(err => {
          console.warn('Wallet skipped:', err.message || err)
          setMsg(t('noWallet'))
        })
        .finally(() => setIsConnecting(false))
    } else {
      setMsg(t('noWallet'))
      setIsConnecting(false)
    }
  }, [isConnecting, t])

  const handleGrok = useCallback(() => setShowGrok(true), [])
  const toggleLang = useCallback(() => setLang(l => l === 'ru' ? 'en' : 'ru'), [])

  const startGame = useCallback(() => {
    gameRef.current.reset()
    setFen(gameRef.current.fen())
    setHistory([gameRef.current.fen()])
    setMoveIdx(0)
    setIsPlayerTurn(true)
    setGameOver(false)
    setWinner(null)
    setPTime(timeCtrl * 60)
    setBTime(timeCtrl * 60)
    setTimerActive('player')
    setView('game')
  }, [timeCtrl])

  const makeBotMove = useCallback(() => {
    if (gameOver || gameRef.current.isGameOver()) return
    const moves = gameRef.current.moves()
    if (!moves.length) return
    const mv = moves[Math.floor(Math.random() * moves.length)]
    gameRef.current.move(mv)
    setFen(gameRef.current.fen())
    setHistory(h => [...h, gameRef.current.fen()])
    setMoveIdx(i => i + 1)
    setIsPlayerTurn(true)
    setTimerActive('player')
    if (gameRef.current.isCheckmate()) { setGameOver(true); setWinner('bot'); setMsg(t('lose')) }
    else if (gameRef.current.isDraw()) { setGameOver(true); setWinner(null); setMsg(t('draw')) }
    else setMsg(t('yourTurn'))
  }, [gameOver, t])

  const onDrop = useCallback((src, tgt) => {
    if (!isPlayerTurn || gameOver) return false
    try {
      const res = gameRef.current.move({ from: src, to: tgt, promotion: 'q' })
      if (!res) return false
      setFen(gameRef.current.fen())
      setHistory(h => [...h, gameRef.current.fen()])
      setMoveIdx(i => i + 1)
      setIsPlayerTurn(false)
      setTimerActive('bot')
      if (gameRef.current.isCheckmate()) { setGameOver(true); setWinner('player'); setMsg(t('win')) }
      else if (gameRef.current.isDraw()) { setGameOver(true); setWinner(null); setMsg(t('draw')) }
      else { setMsg(t('botThinking')); setTimeout(makeBotMove, 600) }
      return true
    } catch { return false }
  }, [isPlayerTurn, gameOver, makeBotMove, t])

  const Btn = ({children, onClick, bg, disabled, style={}}) => (
    <button type="button" onClick={onClick} disabled={disabled} style={{
      padding:'0.8rem 1.2rem', background:bg||'#3b82f6', color:'#fff', border:'none', borderRadius:'10px',
      cursor: disabled?'not-allowed':'pointer', fontSize:'1rem', fontWeight:'600',
      opacity: disabled?0.5:1, transition:'0.2s', ...style
    }}>{children}</button>
  )

  const TimerBox = ({label, time, active}) => (
    <div style={{background:active?'#059669':'#1e293b', padding:'10px 20px', borderRadius:'10px', color:'#fff', textAlign:'center', border:active?'2px solid #34d399':'1px solid #334155', width:'45%'}}>
      <div style={{fontSize:'0.85rem', opacity:0.8}}>{label}</div>
      <div style={{fontSize:'1.6rem', fontWeight:'bold', fontFamily:'monospace'}}>{fmtTime(time)}</div>
    </div>
  )

  if (view === 'menu') return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg,#0f172a,#1e293b)', color:'#f1f5f9', fontFamily:'system-ui', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem', textAlign:'center', gap:'1.2rem'}}>
      <h1 style={{fontSize:'2.5rem', color:'#fbbf24', margin:0}}>{t('title')}</h1>
      <p style={{color:'#94a3b8', margin:0}}>{t('subtitle')}</p>
      <Btn onClick={handleGuest} bg="linear-gradient(135deg,#3b82f6,#2563eb)">{t('guest')}</Btn>
      <Btn onClick={handleConnect} bg="linear-gradient(135deg,#f59e0b,#d97706)" disabled={isConnecting}>
        {isConnecting?'⏳...':t('connect')}
      </Btn>
      <Btn onClick={handleGrok} bg="linear-gradient(135deg,#10b981,#059669)">{t('buyGrok')}</Btn>
      <Btn onClick={toggleLang} bg="#475569">{t('langSwitch')}</Btn>
      {msg && <div style={{padding:'0.6rem', background:'rgba(59,130,246,0.2)', borderRadius:'8px', color:'#60a5fa', maxWidth:'300px'}}>{msg}</div>}
    </div>
  )

  if (view === 'profile') return (
    <div style={{minHeight:'100vh', background:'#0f172a', color:'#f1f5f9', fontFamily:'system-ui', display:'flex', flexDirection:'column', alignItems:'center', padding:'1.5rem', gap:'1rem'}}>
      <h2 style={{color:'#fbbf24'}}>{nickname} | {t('profile')}</h2>
      <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap', justifyContent:'center'}}>
        <Btn onClick={()=>setView('menu')} bg="#ef4444">{t('logout')}</Btn>
        <Btn onClick={()=>setShowProfileEdit(true)} bg="#3b82f6">{t('editProfile')}</Btn>
        <Btn onClick={handleGrok} bg="#10b981">{t('buyGrok')}</Btn>
        <Btn onClick={startGame} bg="#8b5cf6">🎮 Быстрая игра</Btn>
        <Btn onClick={toggleLang} bg="#475569">{t('langSwitch')}</Btn>
      </div>
      <div style={{background:'#1e293b', padding:'1rem', borderRadius:'10px', maxWidth:'400px', textAlign:'center', color:'#94a3b8', fontSize:'0.9rem'}}>{t('rules')}</div>
      {showProfileEdit && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999}} onClick={()=>setShowProfileEdit(false)}>
          <div style={{background:'#1e293b', padding:'1.5rem', borderRadius:'12px', width:'90%', maxWidth:'350px'}} onClick={e=>e.stopPropagation()}>
            <h3 style={{color:'#fbbf24'}}>{t('editProfile')}</h3>
            <input value={nickname} onChange={e=>setNickname(e.target.value)} style={{width:'100%', padding:'0.5rem', background:'#0f172a', color:'#fff', border:'1px solid #475569', borderRadius:'6px', marginBottom:'1rem'}} />
            <div style={{display:'flex', gap:'0.5rem'}}>
              <Btn onClick={()=>setShowProfileEdit(false)} bg="#64748b">{t('close')}</Btn>
              <Btn onClick={()=>setShowProfileEdit(false)} bg="#10b981">{t('save')}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div style={{minHeight:'100vh', background:'#0f172a', color:'#f1f5f9', fontFamily:'system-ui', display:'flex', flexDirection:'column', alignItems:'center', paddingTop:'1rem', gap:'1rem', padding:'0 1rem'}}>
      <div style={{display:'flex', justifyContent:'space-around', width:'100%', maxWidth:'420px', marginBottom:'0.5rem'}}>
        <TimerBox label={t('guest').replace('👤 ','')} time={pTime} active={timerActive==='player'} />
        <TimerBox label={t('bot').replace('🤖 ','')} time={bTime} active={timerActive==='bot'} />
      </div>
      {msg && <div style={{color:'#38bdf8', textAlign:'center', minHeight:'20px'}}>{msg}</div>}
      <div style={{background:'#1e293b', padding:'10px', borderRadius:'12px', boxShadow:'0 4px 16px rgba(0,0,0,0.4)'}}>
        <Chessboard position={fen} onPieceDrop={onDrop} boardWidth={boardSize} 
          customDarkSquareStyle={{backgroundColor:BOARD_THEMES[boardTheme].dark}} 
          customLightSquareStyle={{backgroundColor:BOARD_THEMES[boardTheme].light}} />
      </div>
      <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap', justifyContent:'center'}}>
        <Btn onClick={()=>setView('profile')} bg="#3b82f6">{t('profile')}</Btn>
        <Btn onClick={toggleLang} bg="#475569">{t('langSwitch')}</Btn>
        <Btn onClick={()=>setBoardTheme(th => th==='classic'?'wood3d':th==='wood3d'?'neon':'classic')} bg="#1e293b">🎨 Тема</Btn>
      </div>
      {gameOver && (
        <div style={{background:'#1e293b', padding:'1.2rem', borderRadius:'12px', textAlign:'center', maxWidth:'400px', border:'1px solid #fbbf24', marginTop:'0.5rem'}}>
          <h3 style={{color:'#fbbf24', margin:'0 0 0.5rem 0'}}>{winner==='player'?t('win'):winner==='bot'?t('lose'):t('draw')}</h3>
          <Btn onClick={()=>setView('profile')} bg="#10b981">{t('profile')}</Btn>
        </div>
      )}
      {showGrok && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999}} onClick={()=>setShowGrok(false)}>
          <div style={{background:'linear-gradient(135deg,#1e293b,#334155)', padding:'1.5rem', borderRadius:'16px', maxWidth:'360px', width:'90%', border:'2px solid #f59e0b'}} onClick={e=>e.stopPropagation()}>
            <h3 style={{color:'#fbbf24', margin:'0 0 0.8rem 0', textAlign:'center'}}>{t('buyGrok')}</h3>
            <p style={{color:'#cbd5e1', marginBottom:'1rem', lineHeight:'1.4'}}>{t('grokDesc')}</p>
            <a href={GROK_LINK} target="_blank" rel="noopener noreferrer" style={{display:'block', background:'#3b82f6', color:'#fff', padding:'0.8rem', borderRadius:'10px', textAlign:'center', textDecoration:'none', fontWeight:'600', marginBottom:'0.8rem'}}>{t('openLink')}</a>
            <Btn onClick={()=>setShowGrok(false)} bg="#64748b" style={{width:'100%'}}>{t('close')}</Btn>
          </div>
        </div>
      )}
    </div>
  )
}