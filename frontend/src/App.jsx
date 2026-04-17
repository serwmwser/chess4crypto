import { useState, useEffect, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'

// 🌍 Встроенный словарь (нулевые зависимости)
const LANG = {
  ru: { 
    title: '♟️ Chess4Crypto', sub: 'Web3 шахматы с крипто-ставками', 
    guest: '👤 Гостевой вход', connect: '🦊 Подключить кошелёк', grok: '💰 Купить GROK', 
    profile: '👤 Профиль', logout: '🚪', you: '👤 Вы', bot: '🤖 Бот', 
    yourTurn: '♟️ Ваш ход!', botThink: '🤖 Бот думает...', 
    win: '🏆 CHECKMATE! ВЫ ПОБЕДИЛИ!', lose: '😔 Вы проиграли.', draw: '🤝 Ничья!', 
    timeWin: '⏰ Время вышло! Вы победили!', timeLose: '⏰ Время вышло! Бот победил.', 
    noMeta: '⚠️ MetaMask не установлен. Используйте гостевой режим.', 
    connected: '✅ Кошелёк подключён!', langBtn: '🇬🇧 EN', back: '👤 Меню', grokDesc: 'Купите GROK на BNB Chain через four.meme'
  },
  en: { 
    title: '♟️ Chess4Crypto', sub: 'Web3 Chess with Crypto Stakes', 
    guest: '👤 Guest Mode', connect: '🦊 Connect Wallet', grok: '💰 Buy GROK', 
    profile: '👤 Profile', logout: '🚪', you: '👤 You', bot: '🤖 Bot', 
    yourTurn: '♟️ Your turn!', botThink: '🤖 Bot thinking...', 
    win: '🏆 CHECKMATE! YOU WIN!', lose: '😔 You lost.', draw: '🤝 Draw!', 
    timeWin: '⏰ Time out! You win!', timeLose: '⏰ Time out! Bot wins.', 
    noMeta: '⚠️ MetaMask not found. Use Guest mode.', 
    connected: '✅ Wallet connected!', langBtn: '🇷🇺 RU', back: '👤 Menu', grokDesc: 'Buy GROK on BNB Chain via four.meme'
  }
}

const fmtTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`
const GROK_LINK = 'https://four.meme/token/0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444?code=AHGX96R5GHK9'

export default function App() {
  const [lang, setLang] = useState('ru')
  const t = useCallback((k) => LANG[lang][k] || k, [lang])

  const [view, setView] = useState('menu')
  const [msg, setMsg] = useState('')
  const [showGrok, setShowGrok] = useState(false)
  const [connecting, setConnecting] = useState(false)

  // ♟️ Шахматы
  const game = useRef(new Chess())
  const [fen, setFen] = useState(game.current.fen())
  const [history, setHistory] = useState([game.current.fen()])
  const [moveIdx, setMoveIdx] = useState(0)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)

  // ⏱️ Таймер
  const [timeCtrl] = useState(15)
  const [pTime, setPTime] = useState(15 * 60)
  const [bTime, setBTime] = useState(15 * 60)
  const [timerActive, setTimerActive] = useState(null)
  const timerRef = useRef(null)
  const [boardSize, setBoardSize] = useState(Math.min(window.innerWidth * 0.9, 400))

  useEffect(() => {
    const r = () => setBoardSize(Math.min(window.innerWidth * 0.9, 400))
    window.addEventListener('resize', r)
    return () => window.removeEventListener('resize', r)
  }, [])

  // ✅ БЕЗОПАСНЫЙ ТАЙМЕР (функциональные обновления + очистка)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!timerActive || gameOver) return

    timerRef.current = setInterval(() => {
      if (timerActive === 'player') {
        setPTime(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); setGameOver(true); setWinner('bot'); setMsg(t('timeLose')); return 0 }
          return prev - 1
        })
      } else {
        setBTime(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); setGameOver(true); setWinner('player'); setMsg(t('timeWin')); return 0 }
          return prev - 1
        })
      }
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [timerActive, gameOver, t])

  // 🔘 КНОПКИ (гарантированно не крашат)
  const handleConnect = async () => {
    if (connecting) return
    setConnecting(true)
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' })
        setMsg(t('connected'))
        setView('profile')
      } else {
        throw new Error('No wallet')
      }
    } catch (e) {
      console.warn('Wallet skipped:', e.message)
      setMsg(t('noMeta'))
    } finally {
      setConnecting(false)
    }
  }

  const handleGuest = () => { setMsg(t('guest')); startGame() }
  const handleGrok = () => setShowGrok(true)

  const startGame = () => {
    game.current.reset()
    setFen(game.current.fen())
    setHistory([game.current.fen()])
    setMoveIdx(0)
    setIsPlayerTurn(true)
    setGameOver(false)
    setWinner(null)
    setMsg('')
    setPTime(timeCtrl * 60)
    setBTime(timeCtrl * 60)
    setTimerActive('player') // ✅ Запуск
    setView('game')
  }

  // 🤖 Логика бота
  const makeBotMove = useCallback(() => {
    if (gameOver || game.current.isGameOver()) return
    const moves = game.current.moves()
    if (!moves.length) return
    const mv = moves[Math.floor(Math.random() * moves.length)]
    game.current.move(mv)
    setFen(game.current.fen())
    setHistory(h => [...h, game.current.fen()])
    setMoveIdx(i => i + 1)
    setIsPlayerTurn(true)
    setTimerActive('player') // ✅ Переключение на игрока
    if (game.current.isCheckmate()) { setGameOver(true); setWinner('bot'); setMsg(t('lose')) }
    else if (game.current.isDraw()) { setGameOver(true); setWinner(null); setMsg(t('draw')) }
    else setMsg(t('yourTurn'))
  }, [gameOver, t])

  // ♟️ Ход игрока
  const onDrop = useCallback((src, tgt) => {
    if (!isPlayerTurn || gameOver) return false
    try {
      const res = game.current.move({ from: src, to: tgt, promotion: 'q' })
      if (!res) return false
      setFen(game.current.fen())
      setHistory(h => [...h, game.current.fen()])
      setMoveIdx(i => i + 1)
      setIsPlayerTurn(false)
      setTimerActive('bot') // ✅ Переключение на бота
      if (game.current.isCheckmate()) { setGameOver(true); setWinner('player'); setMsg(t('win')) }
      else if (game.current.isDraw()) { setGameOver(true); setWinner(null); setMsg(t('draw')) }
      else { setMsg(t('botThink')); setTimeout(makeBotMove, 500) }
      return true
    } catch { return false }
  }, [isPlayerTurn, gameOver, makeBotMove, t])

  // 🎨 UI Компоненты
  const Timer = ({label, time, active}) => (
    <div style={{background:active?'#059669':'#1e293b', padding:'8px 16px', borderRadius:'8px', color:'#fff', textAlign:'center', border:active?'2px solid #34d399':'1px solid #334155'}}>
      <div style={{fontSize:'0.8rem', opacity:0.8}}>{label}</div>
      <div style={{fontSize:'1.5rem', fontWeight:'bold'}}>{fmtTime(time)}</div>
    </div>
  )
  const Btn = ({children, onClick, bg, disabled, style={}}) => (
    <button onClick={onClick} disabled={disabled} style={{
      padding:'0.8rem 1.5rem', background:bg, color:'#fff', border:'none', borderRadius:'8px',
      cursor: disabled?'not-allowed':'pointer', fontSize:'1rem', fontWeight:'600',
      opacity: disabled?0.6:1, transition:'0.2s', ...style
    }}>{children}</button>
  )

  // ============================================================================
  // 🖥️ РЕНДЕР
  // ============================================================================
  if (view === 'menu') return (
    <div style={{minHeight:'100vh', background:'#0f172a', color:'#f1f5f9', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1rem', fontFamily:'system-ui', padding:'1rem'}}>
      <h1 style={{color:'#fbbf24'}}>{t('title')}</h1>
      <p style={{opacity:0.7}}>{t('sub')}</p>
      <Btn onClick={handleGuest} bg="#3b82f6">{t('guest')}</Btn>
      <Btn onClick={handleConnect} bg="#f59e0b" disabled={connecting}>{connecting?'⏳...':t('connect')}</Btn>
      <Btn onClick={handleGrok} bg="#10b981">{t('grok')}</Btn>
      <Btn onClick={()=>setLang(l=>l==='ru'?'en':'ru')} bg="#475569">{t('langBtn')}</Btn>
      {msg && <p style={{color:'#60a5fa', textAlign:'center'}}>{msg}</p>}
    </div>
  )

  if (view === 'profile') return (
    <div style={{minHeight:'100vh', background:'#0f172a', color:'#f1f5f9', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1rem', fontFamily:'system-ui'}}>
      <h2 style={{color:'#fbbf24'}}>{t('profile')}</h2>
      <Btn onClick={()=>setView('menu')} bg="#ef4444">{t('back')}</Btn>
      <Btn onClick={()=>setLang(l=>l==='ru'?'en':'ru')} bg="#475569">{t('langBtn')}</Btn>
    </div>
  )

  return (
    <div style={{minHeight:'100vh', background:'#0f172a', color:'#f1f5f9', display:'flex', flexDirection:'column', alignItems:'center', paddingTop:'1rem', gap:'1rem', fontFamily:'system-ui', padding:'0 1rem'}}>
      <div style={{display:'flex', gap:'1rem', width:'100%', maxWidth:'400px', justifyContent:'space-around'}}>
        <Timer label={t('you')} time={pTime} active={timerActive==='player'} />
        <Timer label={t('bot')} time={bTime} active={timerActive==='bot'} />
      </div>
      {msg && <p style={{color:'#38bdf8', textAlign:'center'}}>{msg}</p>}
      
      <div style={{background:'#1e293b', padding:'10px', borderRadius:'12px', boxShadow:'0 4px 12px rgba(0,0,0,0.3)'}}>
        <Chessboard position={fen} onPieceDrop={onDrop} boardWidth={boardSize} 
          customDarkSquareStyle={{backgroundColor:'#769656'}} customLightSquareStyle={{backgroundColor:'#eeeed2'}} />
      </div>

      <div style={{display:'flex', gap:'0.5rem'}}>
        <Btn onClick={()=>setView('profile')} bg="#3b82f6">{t('profile')}</Btn>
        <Btn onClick={()=>setLang(l=>l==='ru'?'en':'ru')} bg="#475569">{t('langBtn')}</Btn>
      </div>

      {gameOver && (
        <div style={{background:'#1e293b', padding:'1rem', borderRadius:'8px', textAlign:'center', maxWidth:'400px', border:'1px solid #fbbf24'}}>
          <h3 style={{color:'#fbbf24'}}>{winner==='player'?t('win'):winner==='bot'?t('lose'):t('draw')}</h3>
          <Btn onClick={()=>setView('menu')} bg="#10b981">{t('back')}</Btn>
        </div>
      )}

      {showGrok && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999}} onClick={()=>setShowGrok(false)}>
          <div style={{background:'#1e293b', padding:'1.5rem', borderRadius:'12px', textAlign:'center', maxWidth:'320px', border:'1px solid #475569'}} onClick={e=>e.stopPropagation()}>
            <h3 style={{color:'#fbbf24', marginBottom:'0.5rem'}}>{t('grok')}</h3>
            <p style={{color:'#cbd5e1', marginBottom:'1rem', fontSize:'0.9rem'}}>{t('grokDesc')}</p>
            <a href={GROK_LINK} target="_blank" rel="noopener" style={{display:'inline-block', padding:'0.6rem 1rem', background:'#3b82f6', color:'#fff', textDecoration:'none', borderRadius:'8px', marginBottom:'0.5rem'}}>🔗 Открыть four.meme</a>
            <br/>
            <Btn onClick={()=>setShowGrok(false)} bg="#64748b" style={{marginTop:'0.5rem'}}>Закрыть</Btn>
          </div>
        </div>
      )}
    </div>
  )
}