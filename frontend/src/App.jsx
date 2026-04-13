import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useTranslation } from 'react-i18next'

// 🎨 Темы
const BOARD_THEMES = {
  classic: { name: '🏛️ Классика', light: '#eeeed2', dark: '#769656', pieceFilter: 'none', boardShadow: '0 4px 12px rgba(0,0,0,0.2)' },
  wood3d: { name: '🪵 3D Дерево', light: '#e8c49a', dark: '#8b6f47', pieceFilter: 'drop-shadow(2px 3px 2px rgba(0,0,0,0.4))', boardShadow: '0 10px 30px rgba(0,0,0,0.4)' },
  neon: { name: '💜 Неон', light: '#1a1a2e', dark: '#16213e', pieceFilter: 'drop-shadow(0 0 3px rgba(236,72,153,0.8))', boardShadow: '0 0 25px rgba(59,130,246,0.4)' },
  ocean: { name: '🌊 Океан', light: '#a8d8ea', dark: '#2a6f97', pieceFilter: 'drop-shadow(0 0 2px rgba(6,182,212,0.5))', boardShadow: '0 4px 20px rgba(6,182,212,0.3)' },
  sunset: { name: '🌅 Закат', light: '#ffecd2', dark: '#fcb69f', pieceFilter: 'drop-shadow(0 0 2px rgba(245,158,11,0.5))', boardShadow: '0 4px 16px rgba(239,68,68,0.3)' },
  minimal: { name: '⚪ Минимал', light: '#f0f0f0', dark: '#606060', pieceFilter: 'grayscale(0.3) contrast(1.1)', boardShadow: '0 2px 8px rgba(0,0,0,0.15)' }
}

const COUNTRIES = [
  { code: 'RU', name: '🇷🇺 Россия' }, { code: 'UA', name: '🇺🇦 Украина' }, { code: 'KZ', name: '🇰🇿 Казахстан' },
  { code: 'US', name: '🇺🇸 США' }, { code: 'GB', name: '🇬🇧 Великобритания' }, { code: 'DE', name: '🇩🇪 Германия' },
  { code: 'OTHER', name: '🌍 Другая' }
]
const DEPOSIT_OPTIONS = [1000, 5000, 10000, 25000, 50000, 100000]
const KEY_USER = 'chess4crypto_user'
const KEY_GAMES = 'chess4crypto_games'

const isMobile = () => /Android|webOS|iPhone|iPad/i.test(navigator.userAgent)
const fmtTime = (s) => { const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60; return h>0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}` }
const formatNumber = (n) => n.toLocaleString('ru-RU')
const getTimeLabel = (m) => { const o = [{v:5,l:'5 мин'},{v:15,l:'15 мин'},{v:30,l:'30 мин'},{v:60,l:'1 ч'},{v:1440,l:'24 ч'}]; return o.find(x=>x.v===m)?.l || `${m} мин` }

function App() {
  const { t, i18n } = useTranslation()
  const { address, isConnected, status } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  
  const gameRef = useRef(new Chess())
  const [view, setView] = useState('menu')
  const [lobbyTab, setLobbyTab] = useState('lobby') // lobby | my | create | history
  const [showLinkModal, setShowLinkModal] = useState(null) // { link, gameId }

  // 🎮 Игра
  const [fen, setFen] = useState(gameRef.current.fen())
  const [history, setHistory] = useState([gameRef.current.fen()])
  const [moveIndex, setMoveIndex] = useState(0)
  const [movesList, setMovesList] = useState([])
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  const [message, setMessage] = useState('')
  
  // ⏱️ Таймер
  const [timeControl, setTimeControl] = useState(15)
  const [playerTime, setPlayerTime] = useState(15*60)
  const [botTime, setBotTime] = useState(15*60)
  const [timerActive, setTimerActive] = useState(null)
  
  // 🎨 Тема
  const [boardTheme, setBoardTheme] = useState('classic')
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [possibleMoves, setPossibleMoves] = useState([])
  const [boardWidth, setBoardWidth] = useState(360)

  // 💰 Пользователь
  const [userData, setUserData] = useState({ balance: 50000, profile: { nickname: '', country: 'RU' }, gameHistory: [] })
  const [createStake, setCreateStake] = useState(5000)
  const [pendingJoinGame, setPendingJoinGame] = useState(null)
  
  // 🌐 Глобальные игры
  const [games, setGames] = useState([])
  const [isConnecting, setIsConnecting] = useState(false)

  // 📏 Размер доски
  useEffect(() => {
    const u = () => setBoardWidth(Math.min(window.innerWidth * 0.88, 380))
    u(); window.addEventListener('resize', u)
    return () => window.removeEventListener('resize', u)
  }, [])

  // 🗄️ Загрузка данных
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem(KEY_USER) || 'null')
    if (u?.address === address) setUserData(u.data)
    else setUserData({ balance: 50000, profile: { nickname: '', country: 'RU' }, gameHistory: [] })

    const g = JSON.parse(localStorage.getItem(KEY_GAMES) || '[]')
    setGames(g.filter(x => x.status !== 'finished')) // Только активные
  }, [address])

  // 📡 Синхронизация между вкладками
  useEffect(() => {
    const h = (e) => { if(e.key === KEY_GAMES) setGames(JSON.parse(e.newValue || '[]').filter(x => x.status !== 'finished')) }
    window.addEventListener('storage', h)
    const ch = new BroadcastChannel('chess_sync')
    ch.onmessage = (ev) => setGames(ev.data.filter(x => x.status !== 'finished'))
    return () => { ch.close(); window.removeEventListener('storage', h) }
  }, [])

  // 🔗 Парсинг ссылки-приглашения
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search)
      const id = p.get('invite')
      if (id && view !== 'game') {
        const g = games.find(x => x.id === id)
        if (g?.status === 'waiting') { setPendingJoinGame(g); setView('profile'); setLobbyTab('lobby'); setMessage(`🔗 Найдена игра! Внесите ${formatNumber(g.stake)} GROK`) }
      }
    }
  }, [games, view])

  // 💾 Сохранение пользователя
  const saveUser = (d) => { setUserData(d); if(address) localStorage.setItem(KEY_USER, JSON.stringify({ address,  d })) }

  // 💾 Сохранение игр + Broadcast
  const saveGames = (g) => {
    const clean = g.filter(x => x.status !== 'finished')
    setGames(clean)
    localStorage.setItem(KEY_GAMES, JSON.stringify(clean))
    new BroadcastChannel('chess_sync').postMessage(clean)
  }

  // 💰 Пополнение (тест)
  const handleTopUp = () => saveUser({ ...userData, balance: userData.balance + 100000 })

  // 🎲 Создание игры
  const handleCreateGame = () => {
    if (userData.balance < createStake) return setMessage('⚠️ Недостаточно GROK!')
    
    // Списываем ставку
    saveUser({ ...userData, balance: userData.balance - createStake })
    
    // Создаем запись
    const newGame = {
      id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      creator: address || 'guest',
      creatorName: userData.profile.nickname || `${(address||'0x0000').slice(0,6)}...`,
      stake: createStake,
      time: timeControl,
      status: 'waiting',
      created: Date.now()
    }
    
    saveGames([...games, newGame])
    
    // Показываем ссылку
    const link = `${window.location.origin}${window.location.pathname}?invite=${newGame.id}`
    navigator.clipboard.writeText(link)
    setShowLinkModal({ link, gameId: newGame.id })
    setMessage(`🎉 Игра создана! Ссылка скопирована.`)
  }

  // 🤝 Присоединение
  const confirmJoin = () => {
    if (!pendingJoinGame) return
    if (userData.balance < pendingJoinGame.stake) return setMessage('⚠️ Недостаточно GROK!')
    
    saveUser({ ...userData, balance: userData.balance - pendingJoinGame.stake })
    
    const updated = games.map(g => g.id === pendingJoinGame.id ? { ...g, status: 'playing', challenger: address || 'guest' } : g)
    saveGames(updated)
    
    setTimeControl(pendingJoinGame.time)
    setPlayerTime(pendingJoinGame.time * 60)
    setBotTime(pendingJoinGame.time * 60)
    startGame()
    setPendingJoinGame(null)
    setMessage('🚀 Игра началась!')
  }

  // 🏁 Конец игры
  const finishGame = (result) => {
    setTimerActive(null)
    let msg = '', change = 0
    if (result === 'player') {
      msg = '🏆 CHECKMATE! ВЫ ПОБЕДИЛИ!'
      change = pendingJoinGame?.stake || createStake || 0
      saveUser({ ...userData, balance: userData.balance + change, gameHistory: [{ date: new Date().toLocaleString(), result: 'WIN', change: `+${change}` }, ...userData.gameHistory] })
    } else if (result === 'bot') {
      msg = '😔 Вы проиграли. Ставка ушла сопернику.'
      change = -(pendingJoinGame?.stake || createStake || 0)
      saveUser({ ...userData, gameHistory: [{ date: new Date().toLocaleString(), result: 'LOSS', change: `${change}` }, ...userData.gameHistory] })
    } else {
      msg = '🤝 Ничья! Средства ушли в фонд развития.'
      saveUser({ ...userData, gameHistory: [{ date: new Date().toLocaleString(), result: 'DRAW', change: 'Фонд' }, ...userData.gameHistory] })
    }
    setWinner(result === 'player' ? 'player' : result === 'bot' ? 'bot' : 'draw')
    setMessage(msg)
  }

  // 🔄 Старт партии
  const startGame = () => {
    gameRef.current.reset()
    const f = gameRef.current.fen()
    setFen(f); setHistory([f]); setMoveIndex(0); setMovesList([])
    setIsPlayerTurn(true); setGameOver(false); setWinner(null)
    setSelectedSquare(null); setPossibleMoves([])
    setTimerActive('player'); setView('game')
  }

  // 🔗 Кошелек
  const handleConnect = async () => {
    if (isConnecting) return
    setIsConnecting(true); setMessage('🔄 Подключение...')
    try {
      const c = connectors.find(x => x.id === (isMobile() ? 'walletConnect' : 'metaMask')) || connectors[0]
      if (!c) throw new Error('Кошелек не найден')
      await connect({ connector: c, chainId: c.chains?.[0]?.id })
      for(let i=0;i<8;i++) { await new Promise(r=>setTimeout(r,300)); if(isConnected) break }
      if(isConnected) { setMessage('✅ Подключено!'); setView('profile') }
      else setMessage('') // Тихий отказ при отмене
    } catch(e) { if(!e.message.includes('rejected') && !e.message.includes('pending')) setMessage('⚠️ Ошибка') }
    finally { setTimeout(()=>setIsConnecting(false), 400) }
  }

  const handleGuest = () => { setMessage('👤 Гостевой режим'); startGame() }
  const handleLogout = () => { disconnect(); setView('menu'); setMessage(''); gameRef.current.reset(); setFen(gameRef.current.fen()); setTimerActive(null) }

  // ♟️ Логика ходов
  const getMoves = useCallback((sq) => gameRef.current.moves({ square: sq, verbose: true }).map(m => m.to), [])
  const sqStyles = useMemo(() => {
    const s = {}; if(selectedSquare) s[selectedSquare] = { backgroundColor: 'rgba(255,255,0,0.4)' }
    possibleMoves.forEach(sq => s[sq] = { backgroundColor: 'rgba(20,85,30,0.5)', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 25%, transparent 25%)', backgroundSize: '14px 14px', backgroundPosition: 'center' })
    return s
  }, [selectedSquare, possibleMoves])

  const onSqClick = useCallback((sq) => {
    if(gameOver) return
    const p = gameRef.current.get(sq)
    if(p && p.color === (isPlayerTurn?'w':'b')) { setSelectedSquare(sq); setPossibleMoves(getMoves(sq)); return }
    if(selectedSquare && possibleMoves.includes(sq)) { onDrop(selectedSquare, sq); setSelectedSquare(null); setPossibleMoves([]); return }
    setSelectedSquare(null); setPossibleMoves([])
  }, [gameOver, isPlayerTurn, selectedSquare, possibleMoves, getMoves])

  const onDrop = useCallback((src, tgt) => {
    if(!isPlayerTurn || gameOver) return false
    try {
      const mv = gameRef.current.move({ from: src, to: tgt, promotion: 'q' }); if(!mv) return false
      const nf = gameRef.current.fen(), san = gameRef.current.history({verbose:true}).pop()?.san || `${src}${tgt}`
      setHistory(h=>[...h, nf]); setMovesList(m=>[...m, {san, from:src, to:tgt}])
      setFen(nf); setMoveIndex(i=>i+1); setIsPlayerTurn(false); setTimerActive('bot'); setMessage('🤖 Бот думает...')
      setSelectedSquare(null); setPossibleMoves([])
      if(gameRef.current.isCheckmate()) { finishGame('player'); return true }
      if(gameRef.current.isDraw()) { finishGame('draw'); return true }
      setTimeout(makeBotMove, 600)
      return true
    } catch { return false }
  }, [isPlayerTurn, gameOver])

  const makeBotMove = useCallback(() => {
    if(gameOver || gameRef.current.isGameOver()) return
    const mv = gameRef.current.moves(); if(!mv.length) return
    const r = mv[Math.floor(Math.random()*mv.length)]; gameRef.current.move(r)
    const nf = gameRef.current.fen(), san = gameRef.current.history({verbose:true}).pop()?.san || r
    setHistory(h=>[...h, nf]); setMovesList(m=>[...m, {san, from:r.from, to:r.to}])
    setFen(nf); setMoveIndex(i=>i+1); setIsPlayerTurn(true); setTimerActive('player')
    if(gameRef.current.isCheckmate()) { finishGame('bot'); return }
    if(gameRef.current.isDraw()) { finishGame('draw'); return }
    setMessage('♟️ Ваш ход!')
  }, [gameOver])

  // ⏱️ Таймер
  useEffect(() => {
    if(!timerActive || gameOver) return
    const i = setInterval(()=>{
      if(timerActive==='player') { setPlayerTime(p=>{ if(p<=1){finishGame('bot'); return 0} return p-1 }) }
      else { setBotTime(p=>{ if(p<=1){finishGame('player'); return 0} return p-1 }) }
    }, 1000)
    return ()=>clearInterval(i)
  }, [timerActive, gameOver])

  const theme = BOARD_THEMES[boardTheme]
  const timeOpts = [{v:5,l:'5 мин'},{v:15,l:'15 мин'},{v:30,l:'30 мин'},{v:60,l:'1 ч'},{v:1440,l:'24 ч'}]

  // ============================================================================
  // 🎨 МЕНЮ
  // ============================================================================
  if(view === 'menu') return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0f172a,#1e293b)',color:'#f1f5f9',fontFamily:'system-ui',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'2rem',textAlign:'center'}}>
      <h1 style={{fontSize:'2.5rem',fontWeight:'bold',color:'#fbbf24',margin:'0 0 0.5rem 0'}}>♟️ Chess4Crypto</h1>
      <p style={{color:'#94a3b8',fontSize:'1.1rem',marginBottom:'2rem'}}>Web3 шахматы с крипто-ставками</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',width:'100%',maxWidth:'320px'}}>
        <button onClick={handleGuest} style={{padding:'1rem',background:'linear-gradient(135deg,#3b82f6,#2563eb)',color:'#fff',border:'none',borderRadius:'12px',cursor:'pointer',fontSize:'1.1rem',fontWeight:'600'}}>👤 Гостевой вход</button>
        <button onClick={handleConnect} disabled={isConnecting} style={{padding:'1rem',background:isConnecting?'#64748b':'linear-gradient(135deg,#f59e0b,#d97706)',color:isConnecting?'#94a3b8':'#000',border:'none',borderRadius:'12px',cursor:isConnecting?'not-allowed':'pointer',fontSize:'1.1rem',fontWeight:'600'}}>{isConnecting?'⏳...':(isMobile()?'🔗':'🦊')} Подключить кошелёк</button>
      </div>
      {message && <div style={{marginTop:'1.5rem',padding:'0.8rem',background:message.includes('✅')?'rgba(16,185,129,0.2)':message.includes('⚠️')?'rgba(239,68,68,0.2)':'rgba(59,130,246,0.2)',borderRadius:'10px',color:message.includes('✅')?'#34d399':message.includes('⚠️')?'#f87171':'#60a5fa'}}>{message}</div>}
      <select value={i18n.language} onChange={e=>i18n.changeLanguage(e.target.value)} style={{marginTop:'2rem',padding:'0.5rem',background:'#334155',color:'#fff',border:'1px solid #475569',borderRadius:'8px',cursor:'pointer'}}><option value="ru">🇷🇺 RU</option><option value="en">🇬🇧 EN</option></select>
    </div>
  )

  // ============================================================================
  // 👤 ПРОФИЛЬ
  // ============================================================================
  if(view === 'profile') {
    const disp = userData.profile.nickname || (address ? `${address.slice(0,6)}...` : 'Гость')
    return (
      <div style={{minHeight:'100vh',background:'#0f172a',color:'#f1f5f9',fontFamily:'system-ui',display:'flex',flexDirection:'column',alignItems:'center',padding:'1rem',boxSizing:'border-box'}}>
        <header style={{width:'100%',maxWidth:'500px',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.8rem 1rem',background:'#1e293b',borderRadius:'12px',marginBottom:'1rem'}}>
          <div><div style={{fontWeight:'bold',fontSize:'1.2rem'}}>{disp}</div><div style={{fontSize:'0.8rem',color:'#94a3b8'}}>{COUNTRIES.find(c=>c.code===userData.profile.country)?.name || '🌍'}</div></div>
          <div style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
            <span style={{background:'#334155',padding:'0.3rem 0.6rem',borderRadius:'8px',color:'#fbbf24',fontSize:'0.9rem'}}>💰 {formatNumber(userData.balance)}</span>
            <button onClick={handleTopUp} style={{padding:'0.3rem 0.6rem',background:'#3b82f6',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer'}}>+ Тест</button>
            <button onClick={handleLogout} style={{padding:'0.4rem 0.8rem',background:'#ef4444',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer'}}>🚪</button>
          </div>
        </header>

        {message && <div style={{width:'100%',maxWidth:'500px',padding:'0.7rem',marginBottom:'0.8rem',background:'rgba(59,130,246,0.2)',borderRadius:'8px',color:'#60a5fa',textAlign:'center',fontSize:'0.9rem'}}>{message}</div>}

        <div style={{display:'flex',gap:'0.4rem',width:'100%',maxWidth:'500px',marginBottom:'1rem'}}>
          {['lobby','my','create','history'].map(k=>(
            <button key={k} onClick={()=>setLobbyTab(k)} style={{flex:1,padding:'0.5rem',background:lobbyTab===k?'#3b82f6':'#1e293b',color:lobbyTab===k?'#fff':'#94a3b8',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:lobbyTab===k?'600':'400'}}>
              {k==='lobby'?'🌐 Лобби':k==='my'?'📋 Мои':k==='create'?'➕ Создать':'🏆 История'}
            </button>
          ))}
        </div>

        <div style={{width:'100%',maxWidth:'500px'}}>
          {/* 🌐 Лобби */}
          {lobbyTab==='lobby' && (
            <div style={{background:'#1e293b',padding:'1rem',borderRadius:'12px',border:'1px solid #334155'}}>
              <h3 style={{fontSize:'1.1rem',fontWeight:'bold',color:'#fbbf24',margin:'0 0 0.8rem 0',textAlign:'center'}}>Доступные игры</h3>
              {games.filter(g=>g.status==='waiting'&&g.creator!==address).length===0 ? <p style={{color:'#94a3b8',textAlign:'center'}}>Нет игр. Создайте свою!</p> :
              games.filter(g=>g.status==='waiting'&&g.creator!==address).map(g=>(
                <div key={g.id} style={{background:'#0f172a',padding:'0.8rem',borderRadius:'8px',marginBottom:'0.6rem',border:'1px solid #334155'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.4rem'}}>
                    <span style={{fontWeight:'bold'}}>👤 {g.creatorName}</span>
                    <span style={{color:'#fbbf24',fontWeight:'bold'}}>💰 {formatNumber(g.stake)} GROK</span>
                  </div>
                  <div style={{fontSize:'0.85rem',color:'#94a3b8',marginBottom:'0.6rem'}}>⏱️ {getTimeLabel(g.time)}</div>
                  <div style={{display:'flex',gap:'0.4rem'}}>
                    <button onClick={()=>setPendingJoinGame(g)} style={{flex:1,padding:'0.5rem',background:'#10b981',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontWeight:'600'}}>🤝 Присоединиться</button>
                    <button onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?invite=${g.id}`);setMessage('📋 Ссылка скопирована!')}} style={{padding:'0.5rem',background:'#3b82f6',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer'}}>🔗</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 📋 Мои игры */}
          {lobbyTab==='my' && (
            <div style={{background:'#1e293b',padding:'1rem',borderRadius:'12px',border:'1px solid #334155'}}>
              <h3 style={{fontSize:'1.1rem',fontWeight:'bold',color:'#fbbf24',margin:'0 0 0.8rem 0',textAlign:'center'}}>Мои игры</h3>
              {games.filter(g=>g.creator===address).length===0 ? <p style={{color:'#94a3b8',textAlign:'center'}}>Вы не создавали игр.</p> :
              games.filter(g=>g.creator===address).map(g=>(
                <div key={g.id} style={{background:'#0f172a',padding:'0.8rem',borderRadius:'8px',marginBottom:'0.6rem',border:'1px solid #334155'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.4rem'}}>
                    <span style={{fontSize:'0.8rem',color:'#94a3b8'}}>ID: {g.id.slice(-8)}</span>
                    <span style={{fontSize:'0.75rem',padding:'0.2rem 0.5rem',borderRadius:'4px',background:g.status==='waiting'?'#fbbf24':'#3b82f6',color:g.status==='waiting'?'#000':'#fff'}}>{g.status==='waiting'?'⏳ Ожидание':'🔥 Играет'}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.9rem',marginBottom:'0.6rem'}}>
                    <span>💰 {formatNumber(g.stake)} GROK</span><span>⏱️ {getTimeLabel(g.time)}</span>
                  </div>
                  {g.status==='waiting' && <button onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?invite=${g.id}`);setMessage('📋 Ссылка скопирована!')}} style={{width:'100%',padding:'0.5rem',background:'#3b82f6',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontWeight:'600'}}>📤 Скопировать ссылку</button>}
                </div>
              ))}
            </div>
          )}

          {/* ➕ Создать */}
          {lobbyTab==='create' && (
            <div style={{background:'#1e293b',padding:'1.2rem',borderRadius:'12px',border:'1px solid #334155'}}>
              <h3 style={{fontSize:'1.1rem',fontWeight:'bold',color:'#fbbf24',margin:'0 0 1rem 0',textAlign:'center'}}>Создать игру</h3>
              <div style={{marginBottom:'1rem'}}>
                <label style={{display:'block',marginBottom:'0.4rem',color:'#94a3b8'}}>💰 Ставка</label>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.4rem'}}>
                  {DEPOSIT_OPTIONS.map(a=>(
                    <button key={a} onClick={()=>setCreateStake(a)} style={{padding:'0.5rem',background:createStake===a?'#3b82f6':'#0f172a',color:'#fff',border:'1px solid #334155',borderRadius:'6px',cursor:'pointer',fontSize:'0.8rem'}}>{formatNumber(a)}</button>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:'1rem'}}>
                <label style={{display:'block',marginBottom:'0.4rem',color:'#94a3b8'}}>⏱️ Время</label>
                <select value={timeControl} onChange={e=>setTimeControl(Number(e.target.value))} style={{width:'100%',padding:'0.5rem',background:'#0f172a',color:'#fff',border:'1px solid #334155',borderRadius:'6px'}}>{timeOpts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select>
              </div>
              <div style={{background:'#0f172a',padding:'0.6rem',borderRadius:'6px',marginBottom:'1rem',fontSize:'0.9rem',display:'flex',justifyContent:'space-between'}}>
                <span>Ваш баланс:</span><span style={{color:userData.balance>=createStake?'#10b981':'#ef4444'}}>{formatNumber(userData.balance)} GROK</span>
              </div>
              <button onClick={handleCreateGame} disabled={userData.balance<createStake} style={{width:'100%',padding:'0.8rem',background:userData.balance>=createStake?'#10b981':'#334155',color:'#fff',border:'none',borderRadius:'10px',cursor:userData.balance>=createStake?'pointer':'not-allowed',fontWeight:'bold',fontSize:'1rem'}}>🎲 Создать игру</button>
            </div>
          )}

          {/* 🏆 История */}
          {lobbyTab==='history' && (
            <div style={{background:'#1e293b',padding:'1rem',borderRadius:'12px',border:'1px solid #334155'}}>
              <h3 style={{fontSize:'1.1rem',fontWeight:'bold',color:'#fbbf24',margin:'0 0 0.8rem 0',textAlign:'center'}}>Хронология игр</h3>
              {userData.gameHistory.length===0 ? <p style={{color:'#94a3b8',textAlign:'center'}}>История пуста.</p> :
              userData.gameHistory.map((h,i)=>(
                <div key={i} style={{background:'#0f172a',padding:'0.6rem',borderRadius:'6px',marginBottom:'0.4rem',display:'flex',justifyContent:'space-between',alignItems:'center',border:'1px solid #334155'}}>
                  <div>
                    <div style={{fontWeight:'bold',color:h.result==='WIN'?'#10b981':h.result==='LOSS'?'#ef4444':'#94a3b8'}}>
                      {h.result==='WIN'?'🏆 Победа':h.result==='LOSS'?'😔 Поражение':'🤝 Ничья'}
                    </div>
                    <div style={{fontSize:'0.75rem',color:'#94a3b8'}}>{h.date}</div>
                  </div>
                  <div style={{fontWeight:'bold',color:h.change.startsWith('+')?'#10b981':'#ef4444'}}>{h.change} GROK</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Модальное окно ссылки */}
        {showLinkModal && (
          <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,padding:'1rem'}} onClick={()=>setShowLinkModal(null)}>
            <div style={{background:'#1e293b',padding:'1.5rem',borderRadius:'16px',maxWidth:'400px',width:'100%',textAlign:'center',border:'2px solid #fbbf24'}} onClick={e=>e.stopPropagation()}>
              <h3 style={{color:'#fbbf24',margin:'0 0 1rem 0'}}>🎉 Игра создана!</h3>
              <p style={{color:'#cbd5e1',marginBottom:'0.8rem',fontSize:'0.9rem'}}>Отправьте эту ссылку сопернику:</p>
              <div style={{background:'#0f172a',padding:'0.6rem',borderRadius:'8px',wordBreak:'break-all',marginBottom:'1rem',border:'1px dashed #475569'}}>{showLinkModal.link}</div>
              <button onClick={()=>{navigator.clipboard.writeText(showLinkModal.link);setMessage('✅ Скопировано!');setShowLinkModal(null)}} style={{width:'100%',padding:'0.8rem',background:'#3b82f6',color:'#fff',border:'none',borderRadius:'10px',cursor:'pointer',fontWeight:'bold'}}>📋 Скопировать и закрыть</button>
            </div>
          </div>
        )}

        {/* Модальное окно входа */}
        {pendingJoinGame && !showLinkModal && (
          <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,padding:'1rem'}} onClick={()=>setPendingJoinGame(null)}>
            <div style={{background:'#1e293b',padding:'1.5rem',borderRadius:'16px',maxWidth:'360px',width:'100%',textAlign:'center',border:'2px solid #10b981'}} onClick={e=>e.stopPropagation()}>
              <h3 style={{color:'#fbbf24',margin:'0 0 1rem 0'}}>💰 Присоединиться к игре?</h3>
              <p style={{color:'#cbd5e1',marginBottom:'0.5rem'}}>Соперник: <strong>{pendingJoinGame.creatorName}</strong></p>
              <p style={{color:'#cbd5e1',marginBottom:'1.2rem'}}>Ставка: <strong>{formatNumber(pendingJoinGame.stake)} GROK</strong></p>
              <div style={{display:'flex',gap:'0.6rem'}}>
                <button onClick={()=>setPendingJoinGame(null)} style={{flex:1,padding:'0.7rem',background:'#64748b',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer'}}>Отмена</button>
                <button onClick={confirmJoin} style={{flex:1,padding:'0.7rem',background:'#10b981',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'bold'}}>✅ Внести</button>
              </div>
            </div>
          </div>
        )}

        <div style={{marginTop:'1.2rem',display:'flex',flexDirection:'column',gap:'0.6rem',width:'100%',maxWidth:'500px'}}>
          <button onClick={()=>startGame()} style={{padding:'0.9rem',background:'linear-gradient(135deg,#10b981,#059669)',color:'#fff',border:'none',borderRadius:'10px',cursor:'pointer',fontSize:'1rem',fontWeight:'600'}}>🤖 Быстрая игра с ботом</button>
        </div>
        <select value={i18n.language} onChange={e=>i18n.changeLanguage(e.target.value)} style={{marginTop:'1.2rem',padding:'0.5rem',background:'#334155',color:'#fff',border:'1px solid #475569',borderRadius:'8px',cursor:'pointer'}}><option value="ru">🇷🇺 RU</option><option value="en">🇬🇧 EN</option></select>
      </div>
    )
  }

  // ============================================================================
  // 🎮 ИГРА
  // ============================================================================
  return (
    <div style={{minHeight:'100vh',background:'#0f172a',color:'#f1f5f9',fontFamily:'system-ui',display:'flex',flexDirection:'column',alignItems:'center',padding:'0.8rem',boxSizing:'border-box'}}>
      <header style={{width:'100%',maxWidth:'420px',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.8rem 1rem',background:'#1e293b',borderRadius:'12px',marginBottom:'1rem'}}>
        <div style={{fontSize:'1.2rem',fontWeight:'bold',color:'#fbbf24'}}>♟️ Chess4Crypto</div>
        <div style={{display:'flex',gap:'0.5rem'}}>
          {isConnected && address && <span style={{fontSize:'0.8rem',background:'#334155',padding:'0.3rem 0.6rem',borderRadius:'8px'}}>🔗 {address.slice(0,4)}...</span>}
          <button onClick={()=>setView('profile')} style={{padding:'0.4rem 0.8rem',background:'#3b82f6',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer'}}>👤</button>
          <button onClick={handleLogout} style={{padding:'0.4rem 0.8rem',background:'#ef4444',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer'}}>🚪</button>
        </div>
      </header>

      <div style={{display:'flex',justifyContent:'space-around',width:'100%',maxWidth:'400px',marginBottom:'0.8rem'}}>
        <div style={{background:timerActive==='player'&&!gameOver?'#059669':'#1e293b',padding:'0.6rem 1.2rem',borderRadius:'10px',textAlign:'center',border:timerActive==='player'&&!gameOver?'2px solid #34d399':'2px solid transparent'}}>
          <div style={{fontSize:'0.85rem',color:'#94a3b8'}}>👤 Вы</div><div style={{fontSize:'1.4rem',fontWeight:'bold',fontFamily:'monospace'}}>{fmtTime(playerTime)}</div>
        </div>
        <div style={{background:timerActive==='bot'&&!gameOver?'#059669':'#1e293b',padding:'0.6rem 1.2rem',borderRadius:'10px',textAlign:'center',border:timerActive==='bot'&&!gameOver?'2px solid #34d399':'2px solid transparent'}}>
          <div style={{fontSize:'0.85rem',color:'#94a3b8'}}>🤖 Бот</div><div style={{fontSize:'1.4rem',fontWeight:'bold',fontFamily:'monospace'}}>{fmtTime(botTime)}</div>
        </div>
      </div>

      {message && <div style={{color:'#38bdf8',marginBottom:'0.6rem',fontSize:'1rem',textAlign:'center',minHeight:'1.3rem'}}>{message}</div>}

      <div style={{width:boardWidth+20,height:boardWidth+20,background:'#1e293b',padding:'10px',borderRadius:'12px',boxShadow:theme.boardShadow,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'1rem',transition:'box-shadow 0.3s ease'}}>
        <div style={{width:'100%',height:'100%',filter:theme.pieceFilter,transition:'filter 0.3s ease'}}>
          <Chessboard position={fen} onPieceDrop={onDrop} onSquareClick={onSqClick} customSquareStyles={sqStyles} boardOrientation="white" boardWidth={boardWidth} customDarkSquareStyle={{backgroundColor:theme.dark}} customLightSquareStyle={{backgroundColor:theme.light}} customBoardStyle={{borderRadius:'8px'}}/>
        </div>
      </div>

      <div style={{display:'flex',gap:'0.4rem',marginBottom:'1rem',flexWrap:'wrap',justifyContent:'center'}}>
        <button onClick={()=>{setSelectedSquare(null);setPossibleMoves([])}} style={{padding:'0.4rem 0.7rem',background:'#475569',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'0.85rem'}}>✖️</button>
        {Object.entries(BOARD_THEMES).map(([k,v])=><button key={k} onClick={()=>setBoardTheme(k)} style={{padding:'0.4rem 0.6rem',background:boardTheme===k?'#10b981':'#334155',color:'#fff',border:boardTheme===k?'2px solid #fbbf24':'1px solid #475569',borderRadius:'8px',cursor:'pointer',fontSize:'0.8rem'}}>{v.name}</button>)}
        <select value={timeControl} onChange={e=>{const v=Number(e.target.value);setTimeControl(v);if(view==='game'){setPlayerTime(v*60);setBotTime(v*60)}}} style={{padding:'0.4rem 0.6rem',background:'#334155',color:'#fff',border:'1px solid #475569',borderRadius:'8px',cursor:'pointer',fontSize:'0.85rem'}}>{timeOpts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select>
      </div>

      {movesList.length>0 && (
        <div style={{background:'#1e293b',padding:'0.6rem 1rem',borderRadius:'10px',width:'100%',maxWidth:'400px',marginBottom:'1rem'}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.85rem',color:'#94a3b8',marginBottom:'0.4rem'}}><span>📜 Ходы:</span><span style={{background:'#334155',padding:'0.1rem 0.5rem',borderRadius:'6px'}}>{movesList.length}</span></div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'0.3rem',maxHeight:'60px',overflowY:'auto'}}>{movesList.map((m,i)=><span key={i} style={{background:i===moveIndex-1?'#3b82f6':'#334155',padding:'0.2rem 0.5rem',borderRadius:'5px',fontSize:'0.8rem'}}>{Math.floor(i/2)+1}.{i%2===0?'':'..'} {m.san}</span>)}</div>
        </div>
      )}

      {gameOver && winner && (
        <div style={{background:'linear-gradient(135deg,#1e293b,#7c3aed)',padding:'1.2rem',borderRadius:'16px',width:'100%',maxWidth:'400px',textAlign:'center',marginBottom:'1rem',border:'2px solid #a78bfa'}}>
          <div style={{fontSize:'2.5rem',marginBottom:'0.3rem'}}>{winner==='player'?'🏆':winner==='bot'?'🤖':'🤝'}</div>
          <div style={{fontSize:'1.4rem',fontWeight:'bold',color:'#fbbf24',marginBottom:'0.5rem'}}>{winner==='player'?'🎉 CHECKMATE! ПОБЕДА!':winner==='bot'?'😔 Бот победил':'🤝 Ничья!'}</div>
          <button onClick={()=>{setView('profile');setGameOver(false);setTimerActive(null);gameRef.current.reset();setFen(gameRef.current.fen());setHistory([gameRef.current.fen()]);setMoveIndex(0);setMovesList([]);setMessage('')}} style={{padding:'0.7rem 1.5rem',background:'#10b981',color:'#fff',border:'none',borderRadius:'10px',cursor:'pointer',fontWeight:'600',fontSize:'1.1rem'}}>👤 В профиль</button>
        </div>
      )}
      <select value={i18n.language} onChange={e=>i18n.changeLanguage(e.target.value)} style={{padding:'0.4rem 0.8rem',background:'#334155',color:'#fff',border:'1px solid #475569',borderRadius:'8px',cursor:'pointer'}}><option value="ru">🇷🇺 RU</option><option value="en">🇬🇧 EN</option></select>
    </div>
  )
}

export default App