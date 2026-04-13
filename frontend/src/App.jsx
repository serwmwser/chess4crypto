import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useTranslation } from 'react-i18next'

// 🎨 6 ТЕМ ДОСОК И ФИГУР
const BOARD_THEMES = {
  classic: { name: '🏛️ Классика', light: '#eeeed2', dark: '#769656', pieceFilter: 'none', boardShadow: '0 4px 12px rgba(0,0,0,0.2)' },
  wood3d: { name: '🪵 3D Дерево', light: '#e8c49a', dark: '#8b6f47', pieceFilter: 'drop-shadow(2px 3px 2px rgba(0,0,0,0.4))', boardShadow: '0 10px 30px rgba(0,0,0,0.4)' },
  neon: { name: '💜 Неон', light: '#1a1a2e', dark: '#16213e', pieceFilter: 'drop-shadow(0 0 3px rgba(236,72,153,0.8))', boardShadow: '0 0 25px rgba(59,130,246,0.4)' },
  ocean: { name: '🌊 Океан', light: '#a8d8ea', dark: '#2a6f97', pieceFilter: 'drop-shadow(0 0 2px rgba(6,182,212,0.5))', boardShadow: '0 4px 20px rgba(6,182,212,0.3)' },
  sunset: { name: '🌅 Закат', light: '#ffecd2', dark: '#fcb69f', pieceFilter: 'drop-shadow(0 0 2px rgba(245,158,11,0.5))', boardShadow: '0 4px 16px rgba(239,68,68,0.3)' },
  minimal: { name: '⚪ Минимал', light: '#f0f0f0', dark: '#606060', pieceFilter: 'grayscale(0.3) contrast(1.1)', boardShadow: '0 2px 8px rgba(0,0,0,0.15)' }
}

// 🌍 Страны
const COUNTRIES = [
  { code: 'RU', name: '🇷🇺 Россия' }, { code: 'UA', name: '🇺🇦 Украина' }, { code: 'BY', name: '🇧🇾 Беларусь' },
  { code: 'KZ', name: '🇰🇿 Казахстан' }, { code: 'US', name: '🇺🇸 США' }, { code: 'GB', name: '🇬🇧 Великобритания' },
  { code: 'DE', name: '🇩🇪 Германия' }, { code: 'FR', name: '🇫🇷 Франция' }, { code: 'ES', name: '🇪🇸 Испания' },
  { code: 'IT', name: '🇮🇹 Италия' }, { code: 'CN', name: '🇨🇳 Китай' }, { code: 'JP', name: '🇯🇵 Япония' },
  { code: 'BR', name: '🇧🇷 Бразилия' }, { code: 'IN', name: '🇮🇳 Индия' }, { code: 'OTHER', name: '🌍 Другая' }
]

const DEPOSIT_OPTIONS = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000]
const isMobile = () => /Android|webOS|iPhone|iPad/i.test(navigator.userAgent)
const fmtTime = (s) => { const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60; return h>0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}` }
const formatNumber = (n) => n.toLocaleString('ru-RU')
const getTimeLabel = (m) => { const o = [{v:5,l:'5 мин'},{v:15,l:'15 мин'},{v:30,l:'30 мин'},{v:60,l:'1 ч'},{v:1440,l:'24 ч'}]; return o.find(x=>x.v===m)?.l || `${m} мин` }

// 🔗 Ссылка для покупки GROK
const GROK_BUY_LINK = 'https://four.meme/token/0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444?code=AHGX96R5GHK9'
const GROK_CONTRACT = '0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444'

function App() {
  const { t, i18n } = useTranslation()
  const { address, isConnected, status } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  
  const gameRef = useRef(new Chess())
  const [view, setView] = useState('menu')
  const [lobbyTab, setLobbyTab] = useState('lobby')
  
  // 🎮 Состояние игры
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
  
  // 🎨 Тема и ходы
  const [boardTheme, setBoardTheme] = useState('classic')
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [possibleMoves, setPossibleMoves] = useState([])
  const [boardWidth, setBoardWidth] = useState(360)

  // 👤 ПРОФИЛЬ ИГРОКА
  const [userData, setUserData] = useState({ 
    balance: 50000, 
    profile: { nickname: '', country: 'RU', avatar: '', social: '' },
    history: []
  })
  
  // 🌐 Глобальные игры
  const [games, setGames] = useState([])
  const [createStake, setCreateStake] = useState(5000)
  const [pendingJoinGame, setPendingJoinGame] = useState(null)
  const [showLinkModal, setShowLinkModal] = useState(null)
  const [showGrokModal, setShowGrokModal] = useState(false) // 💰 Модальное окно покупки GROK
  const [isConnecting, setIsConnecting] = useState(false)
  const [copiedContract, setCopiedContract] = useState(false)

  // 📏 Размер доски
  useEffect(() => {
    const u = () => setBoardWidth(Math.min(window.innerWidth * 0.88, 380))
    u(); window.addEventListener('resize', u)
    return () => window.removeEventListener('resize', u)
  }, [])

  // 🗄️ Загрузка данных и Проверка Приглашения
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('chess4crypto_user') || 'null')
    if (storedUser?.address === address) {
      setUserData(storedUser.data)
    }
    const storedGames = JSON.parse(localStorage.getItem('chess4crypto_games') || '[]')
    setGames(storedGames.filter(g => g.status !== 'finished'))

    const p = new URLSearchParams(window.location.search)
    const invId = p.get('invite')
    if (invId) {
      const game = storedGames.find(g => g.id === invId)
      if (game && game.status === 'waiting') {
        setPendingJoinGame({
          id: game.id,
          stake: Number(p.get('stake')) || game.stake,
          time: Number(p.get('time')) || game.timeControl,
          creatorName: game.creatorName
        })
        setView('profile')
        setLobbyTab('lobby')
        setMessage(`🔗 Приглашение! Нужно внести ${formatNumber(Number(p.get('stake')) || game.stake)} GROK`)
      }
    }
  }, [address])

  // 📡 Синхронизация игр между вкладками
  useEffect(() => {
    const h = (e) => { if(e.key === 'chess4crypto_games') setGames(JSON.parse(e.newValue || '[]').filter(g => g.status !== 'finished')) }
    window.addEventListener('storage', h)
    return () => window.removeEventListener('storage', h)
  }, [])

  // 💾 Сохранение пользователя
  const saveUser = (data) => {
    setUserData(data)
    if (address) localStorage.setItem('chess4crypto_user', JSON.stringify({ address, data }))
  }

  // 💾 Сохранение игр
  const saveGames = (gList) => {
    setGames(gList)
    localStorage.setItem('chess4crypto_games', JSON.stringify(gList))
  }

  // 📷 Загрузка аватара
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1024 * 1024) return setMessage('⚠️ Файл > 1МБ')
    const reader = new FileReader()
    reader.onload = (ev) => {
      const newProf = { ...userData.profile, avatar: ev.target?.result }
      saveUser({ ...userData, profile: newProf })
    }
    reader.readAsDataURL(file)
  }

  // 💰 Открыть инструкцию покупки GROK
  const handleBuyGrok = () => {
    setShowGrokModal(true)
  }

  // 📋 Копирование адреса контракта
  const copyContract = () => {
    navigator.clipboard.writeText(GROK_CONTRACT)
    setCopiedContract(true)
    setTimeout(() => setCopiedContract(false), 2000)
    setMessage('📋 Адрес контракта скопирован!')
  }

  // 💰 Тестовое пополнение
  const handleTopUp = () => saveUser({ ...userData, balance: userData.balance + 100000 })

  // 🔗 Подключение кошелька
  const handleConnect = async () => {
    if (isConnecting) return
    setIsConnecting(true)
    setMessage('🔄 Подключение...')
    try {
      const c = connectors.find(x => x.id === (isMobile() ? 'walletConnect' : 'metaMask')) || connectors[0]
      if (!c) throw new Error('Кошелек не найден')
      await connect({ connector: c, chainId: c.chains?.[0]?.id })
      for(let i=0; i<8; i++) { await new Promise(r=>setTimeout(r,300)); if(isConnected) break }
      if(isConnected) { 
        setMessage('✅ Подключено!')
        setView('profile')
      }
      else setMessage('')
    } catch(e) {
      if (!e.message.includes('rejected') && !e.message.includes('pending')) setMessage('⚠️ Ошибка')
      else setMessage('')
    }
    finally { setTimeout(()=>setIsConnecting(false), 400) }
  }

  const handleGuest = () => { setMessage('👤 Гостевой режим'); startGame() }
  const handleLogout = () => { disconnect(); setView('menu'); setMessage(''); gameRef.current.reset(); setFen(gameRef.current.fen()); setTimerActive(null) }

  // 🎲 Создание игры
  const handleCreateGame = () => {
    if (userData.balance < createStake) return setMessage('⚠️ Недостаточно GROK!')
    saveUser({ ...userData, balance: userData.balance - createStake })
    const newGame = {
      id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      creator: address || 'guest',
      creatorName: userData.profile.nickname || `${(address||'0x').slice(0,6)}...`,
      stake: createStake,
      timeControl: timeControl,
      status: 'waiting',
      created: Date.now()
    }
    saveGames([...games, newGame])
    const link = `${window.location.origin}${window.location.pathname}?invite=${newGame.id}&stake=${newGame.stake}&time=${newGame.timeControl}`
    setShowLinkModal({ link, gameId: newGame.id })
    navigator.clipboard.writeText(link)
    setMessage(`🎉 Игра создана! Ссылка скопирована.`)
  }

  // 🤝 Подтверждение входа в игру
  const confirmJoinGame = () => {
    if (!pendingJoinGame) return
    if (userData.balance < pendingJoinGame.stake) return setMessage('⚠️ Недостаточно GROK!')
    saveUser({ ...userData, balance: userData.balance - pendingJoinGame.stake })
    const updated = games.map(g => g.id === pendingJoinGame.id ? { ...g, status: 'playing', challenger: address } : g)
    saveGames(updated)
    setTimeControl(pendingJoinGame.time)
    setPlayerTime(pendingJoinGame.time * 60)
    setBotTime(pendingJoinGame.time * 60)
    startGame()
    setPendingJoinGame(null)
    setMessage('✅ Депозит внесен! Игра началась.')
  }

  // 🔄 Старт партии
  const startGame = () => {
    gameRef.current.reset()
    const f = gameRef.current.fen()
    setFen(f); setHistory([f]); setMoveIndex(0); setMovesList([])
    setIsPlayerTurn(true); setGameOver(false); setWinner(null)
    setSelectedSquare(null); setPossibleMoves([])
    setPlayerTime(timeControl * 60); setBotTime(timeControl * 60)
    setTimerActive('player'); setView('game')
  }

  // 🏁 Конец игры
  const finishGame = (result) => {
    setTimerActive(null)
    let msg = '', change = 0
    const currentStake = pendingJoinGame?.stake || 0
    if (result === 'player') {
      msg = '🏆 CHECKMATE! ВЫ ПОБЕДИЛИ!'
      change = currentStake * 2
      setWinner('player')
      saveUser({ ...userData, balance: userData.balance + change, history: [{ date: new Date().toLocaleString(), result: 'WIN', change: `+${change}` }, ...userData.history] })
    } else if (result === 'bot') {
      msg = '😔 Вы проиграли. Ставка ушла сопернику.'
      setWinner('bot')
      saveUser({ ...userData, history: [{ date: new Date().toLocaleString(), result: 'LOSS', change: `-${currentStake}` }, ...userData.history] })
    } else {
      msg = '🤝 Ничья! Средства ушли в фонд развития.'
      setWinner('draw')
      saveUser({ ...userData, history: [{ date: new Date().toLocaleString(), result: 'DRAW', change: 'Фонд' }, ...userData.history] })
    }
    setMessage(msg)
  }

  const handleBack = () => { if (moveIndex > 0 && !gameOver) { const i = moveIndex - 1; setMoveIndex(i); setFen(history[i]); gameRef.current.load(history[i]); setIsPlayerTurn(i % 2 === 0); setTimerActive(null); setMessage('⏪ Ход ' + (i+1)) } }
  const handleForward = () => { if (moveIndex < history.length - 1 && !gameOver) { const i = moveIndex + 1; setMoveIndex(i); setFen(history[i]); gameRef.current.load(history[i]); setIsPlayerTurn(i % 2 === 0); if (i === history.length - 1) { setTimerActive(isPlayerTurn ? 'player' : 'bot'); setMessage(isPlayerTurn ? '♟️ Ваш ход!' : '🤖 Бот думает...') } else setMessage('⏩ Ход ' + (i+1)) } }

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
  // 🎨 МЕНЮ ВХОДА
  // ============================================================================
  if(view === 'menu') return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0f172a,#1e293b)',color:'#f1f5f9',fontFamily:'system-ui',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'2rem',textAlign:'center'}}>
      <h1 style={{fontSize:'2.5rem',fontWeight:'bold',color:'#fbbf24',margin:'0 0 0.5rem 0'}}>♟️ Chess4Crypto</h1>
      <p style={{color:'#94a3b8',fontSize:'1.1rem',marginBottom:'2rem'}}>Web3 шахматы с крипто-ставками</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',width:'100%',maxWidth:'320px'}}>
        <button onClick={handleGuest} style={{padding:'1rem',background:'linear-gradient(135deg,#3b82f6,#2563eb)',color:'#fff',border:'none',borderRadius:'12px',cursor:'pointer',fontSize:'1.1rem',fontWeight:'600'}}>👤 Гостевой вход</button>
        <button onClick={handleConnect} disabled={isConnecting} style={{padding:'1rem',background:isConnecting?'#64748b':'linear-gradient(135deg,#f59e0b,#d97706)',color:isConnecting?'#94a3b8':'#000',border:'none',borderRadius:'12px',cursor:isConnecting?'not-allowed':'pointer',fontSize:'1.1rem',fontWeight:'600'}}>{isConnecting?'⏳...':(isMobile()?'🔗':'🦊')} Подключить кошелёк</button>
        {/* 💰 Кнопка покупки GROK */}
        <button onClick={handleBuyGrok} style={{padding:'1rem',background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#000',border:'none',borderRadius:'12px',cursor:'pointer',fontSize:'1.1rem',fontWeight:'600',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem'}}>💰 Купить GROK</button>
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
    const countryName = COUNTRIES.find(c => c.code === userData.profile.country)?.name || '🌍'
    const socialIcon = userData.profile.social?.includes('t.me') ? '✈️' : userData.profile.social?.includes('twit') ? '🐦' : '🔗'
    
    return (
      <div style={{minHeight:'100vh',background:'#0f172a',color:'#f1f5f9',fontFamily:'system-ui',display:'flex',flexDirection:'column',alignItems:'center',padding:'1rem',boxSizing:'border-box'}}>
        <header style={{width:'100%',maxWidth:'500px',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.8rem 1rem',background:'#1e293b',borderRadius:'12px',marginBottom:'1rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:'0.8rem'}}>
            <div style={{position:'relative',cursor:'pointer'}}>
               {userData.profile.avatar ? <img src={userData.profile.avatar} style={{width:50,height:50,borderRadius:'50%',objectFit:'cover'}} alt="Av"/> : <div style={{width:50,height:50,borderRadius:'50%',background:'#475569',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem'}}>👤</div>}
               <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{position:'absolute',width:'100%',height:'100%',opacity:0,cursor:'pointer'}} />
            </div>
            <div>
              <div style={{fontWeight:'bold',fontSize:'1.1rem'}}>{disp}</div>
              <div style={{fontSize:'0.8rem',color:'#94a3b8'}}>{countryName}</div>
            </div>
          </div>
          <div style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
            <span style={{background:'#334155',padding:'0.3rem 0.6rem',borderRadius:'8px',color:'#fbbf24',fontSize:'0.9rem',fontWeight:'bold'}}>💰 {formatNumber(userData.balance)}</span>
            <button onClick={handleTopUp} style={{padding:'0.3rem 0.6rem',background:'#3b82f6',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer'}}>+ Тест</button>
            <button onClick={handleLogout} style={{padding:'0.4rem 0.8rem',background:'#ef4444',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer'}}>🚪</button>
          </div>
        </header>

        {message && <div style={{width:'100%',maxWidth:'500px',padding:'0.7rem',marginBottom:'0.8rem',background:'rgba(59,130,246,0.2)',borderRadius:'8px',color:'#60a5fa',textAlign:'center',fontSize:'0.9rem'}}>{message}</div>}

        {userData.profile.social && (
          <div style={{width:'100%',maxWidth:'500px',background:'#1e293b',padding:'0.5rem',borderRadius:'8px',marginBottom:'0.5rem',textAlign:'center'}}>
             <a href={userData.profile.social.startsWith('http')?userData.profile.social:`https://${userData.profile.social}`} target="_blank" rel="noopener" style={{color:'#60a5fa',textDecoration:'none',fontSize:'0.9rem'}}>{socialIcon} {userData.profile.social}</a>
          </div>
        )}

        {/* 💰 Кнопка покупки GROK в профиле */}
        <button onClick={handleBuyGrok} style={{width:'100%',maxWidth:'500px',padding:'0.9rem',background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#000',border:'none',borderRadius:'12px',cursor:'pointer',fontSize:'1rem',fontWeight:'600',marginBottom:'1rem',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem'}}>
          💰 Приобрести GROK для игры
        </button>

        <div style={{width:'100%',maxWidth:'500px',background:'#1e293b',padding:'0.8rem',borderRadius:'8px',marginBottom:'1rem',border:'1px solid #475569'}}>
          <h4 style={{margin:'0 0 0.5rem 0',color:'#fbbf24',fontSize:'0.9rem'}}>📜 Правила ставок:</h4>
          <ul style={{margin:0,paddingLeft:'1.2rem',fontSize:'0.8rem',color:'#cbd5e1',lineHeight:'1.4'}}>
            <li>Создание игры требует внесения ставки (депозит).</li>
            <li>Присоединение требует внесения <strong>равной суммы</strong>.</li>
            <li>Победитель забирает <strong>весь банк</strong> (Сумма × 2).</li>
            <li>При ничьей средства переходят в <strong>фонд развития</strong> приложения.</li>
          </ul>
        </div>
        
        <div style={{width:'100%',maxWidth:'500px',display:'flex',gap:'0.5rem',marginBottom:'1rem'}}>
           <button onClick={()=>{setView('profile'); setLobbyTab('editProfile')}} style={{flex:1,padding:'0.6rem',background:'#3b82f6',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'bold'}}>✏️ Редактировать профиль</button>
        </div>

        {lobbyTab === 'editProfile' && (
          <div style={{width:'100%',maxWidth:'500px',background:'#1e293b',padding:'1rem',borderRadius:'12px',marginBottom:'1rem',display:'flex',flexDirection:'column',gap:'0.8rem'}}>
            <div>
              <label style={{display:'block',marginBottom:'0.3rem',color:'#94a3b8'}}>Никнейм</label>
              <input value={userData.profile.nickname} onChange={e=>saveUser({...userData, profile:{...userData.profile, nickname:e.target.value}})} style={{width:'100%',padding:'0.5rem',background:'#0f172a',color:'#fff',border:'1px solid #475569',borderRadius:'6px'}} />
            </div>
            <div>
              <label style={{display:'block',marginBottom:'0.3rem',color:'#94a3b8'}}>Страна</label>
              <select value={userData.profile.country} onChange={e=>saveUser({...userData, profile:{...userData.profile, country:e.target.value}})} style={{width:'100%',padding:'0.5rem',background:'#0f172a',color:'#fff',border:'1px solid #475569',borderRadius:'6px'}}>{COUNTRIES.map(c=><option key={c.code} value={c.code}>{c.name}</option>)}</select>
            </div>
            <div>
              <label style={{display:'block',marginBottom:'0.3rem',color:'#94a3b8'}}>Ссылка (Сайт/Соцсеть)</label>
              <input value={userData.profile.social} onChange={e=>saveUser({...userData, profile:{...userData.profile, social:e.target.value}})} placeholder="https://..." style={{width:'100%',padding:'0.5rem',background:'#0f172a',color:'#fff',border:'1px solid #475569',borderRadius:'6px'}} />
            </div>
            <button onClick={()=>setLobbyTab('lobby')} style={{width:'100%',padding:'0.6rem',background:'#10b981',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'bold'}}>💾 Сохранить изменения</button>
          </div>
        )}

        {/* Пункт 3: Обработка Приглашения */}
        {pendingJoinGame && (
          <div style={{width:'100%',maxWidth:'500px',background:'#1e293b',padding:'1rem',borderRadius:'12px',marginBottom:'1rem',border:'2px solid #fbbf24'}}>
            <h3 style={{color:'#fbbf24',margin:'0 0 0.8rem 0',textAlign:'center'}}>🔗 Приглашение в игру</h3>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem',paddingBottom:'0.5rem',borderBottom:'1px solid #334155'}}>
               <span>⏱️ Время:</span> <strong>{getTimeLabel(pendingJoinGame.time)}</strong>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'1rem',fontSize:'1.1rem'}}>
               <span>💰 Сумма:</span> <strong style={{color:'#fbbf24'}}>{formatNumber(pendingJoinGame.stake)} GROK</strong>
            </div>
            <button onClick={() => setPendingJoinGame('confirm')} style={{width:'100%',padding:'0.8rem',background:'#10b981',color:'#fff',border:'none',borderRadius:'10px',cursor:'pointer',fontWeight:'bold',fontSize:'1.1rem'}}>💳 Внести {formatNumber(pendingJoinGame.stake)} GROK</button>
          </div>
        )}

        {/* Вкладки Лобби */}
        {!pendingJoinGame && (
          <div style={{display:'flex',gap:'0.4rem',width:'100%',maxWidth:'500px',marginBottom:'1rem'}}>
            {['lobby','my','create','history'].map(k=>(
              <button key={k} onClick={()=>setLobbyTab(k)} style={{flex:1,padding:'0.5rem',background:lobbyTab===k?'#3b82f6':'#1e293b',color:lobbyTab===k?'#fff':'#94a3b8',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:lobbyTab===k?'600':'400'}}>
                {k==='lobby'?'🌐 Лобби':k==='my'?'📋 Мои':k==='create'?'➕ Создать':'🏆 История'}
              </button>
            ))}
          </div>
        )}

        {/* Контент Вкладок */}
        {!pendingJoinGame && (
          <div style={{width:'100%',maxWidth:'500px'}}>
            {lobbyTab==='lobby' && (
              <div style={{background:'#1e293b',padding:'1rem',borderRadius:'12px',border:'1px solid #334155'}}>
                <h3 style={{fontSize:'1rem',fontWeight:'bold',color:'#fbbf24',margin:'0 0 0.6rem 0',textAlign:'center'}}>Доступные игры</h3>
                {games.filter(g=>g.status==='waiting'&&g.creator!==address).length===0 ? <p style={{color:'#94a3b8',textAlign:'center'}}>Нет игр.</p> :
                games.filter(g=>g.status==='waiting'&&g.creator!==address).map(g=>(
                  <div key={g.id} style={{background:'#0f172a',padding:'0.7rem',borderRadius:'8px',marginBottom:'0.5rem',border:'1px solid #334155',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div><div style={{fontWeight:'bold'}}>{g.creatorName}</div><div style={{fontSize:'0.8rem',color:'#94a3b8'}}>💰 {formatNumber(g.stake)} • ⏱️ {g.timeControl} мин</div></div>
                    <button onClick={()=>setPendingJoinGame(g)} style={{padding:'0.4rem 0.8rem',background:'#10b981',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer'}}>🤝 Вход</button>
                  </div>
                ))}
              </div>
            )}
            {lobbyTab==='my' && (
              <div style={{background:'#1e293b',padding:'1rem',borderRadius:'12px',border:'1px solid #334155'}}>
                <h3 style={{fontSize:'1rem',fontWeight:'bold',color:'#fbbf24',margin:'0 0 0.6rem 0',textAlign:'center'}}>Мои игры</h3>
                {games.filter(g=>g.creator===address).length===0 ? <p style={{color:'#94a3b8',textAlign:'center'}}>Пусто.</p> :
                games.filter(g=>g.creator===address).map(g=>(
                  <div key={g.id} style={{background:'#0f172a',padding:'0.7rem',borderRadius:'8px',marginBottom:'0.5rem',border:'1px solid #334155'}}>
                    <div style={{display:'flex',justifyContent:'space-between'}}><span>ID: ...{g.id.slice(-6)}</span><span style={{color:g.status==='waiting'?'#fbbf24':'#3b82f6'}}>{g.status==='waiting'?'⏳ Ждет':'🔥 Играет'}</span></div>
                    {g.status==='waiting' && <button onClick={()=>{const l=`${window.location.origin}${window.location.pathname}?invite=${g.id}&stake=${g.stake}&time=${g.timeControl}`;navigator.clipboard.writeText(l);setMessage('Ссылка скопирована')}} style={{width:'100%',marginTop:'0.4rem',padding:'0.4rem',background:'#3b82f6',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer'}}>📤 Скопировать ссылку</button>}
                  </div>
                ))}
              </div>
            )}
            {lobbyTab==='create' && (
              <div style={{background:'#1e293b',padding:'1rem',borderRadius:'12px',border:'1px solid #334155'}}>
                <h3 style={{fontSize:'1rem',fontWeight:'bold',color:'#fbbf24',margin:'0 0 0.6rem 0',textAlign:'center'}}>Создать игру</h3>
                <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',marginBottom:'0.8rem'}}>
                  {DEPOSIT_OPTIONS.map(a=>(<button key={a} onClick={()=>setCreateStake(a)} style={{padding:'0.5rem',background:createStake===a?'#3b82f6':'#0f172a',color:'#fff',border:'1px solid #334155',borderRadius:'6px',cursor:'pointer',flex:1}}>{formatNumber(a)}</button>))}
                </div>
                <button onClick={handleCreateGame} disabled={userData.balance<createStake} style={{width:'100%',padding:'0.8rem',background:userData.balance>=createStake?'#10b981':'#334155',color:'#fff',border:'none',borderRadius:'10px',cursor:userData.balance>=createStake?'pointer':'not-allowed',fontWeight:'bold'}}>🎲 Создать</button>
              </div>
            )}
            {lobbyTab==='history' && (
              <div style={{background:'#1e293b',padding:'1rem',borderRadius:'12px',border:'1px solid #334155'}}>
                <h3 style={{fontSize:'1rem',fontWeight:'bold',color:'#fbbf24',margin:'0 0 0.6rem 0',textAlign:'center'}}>История</h3>
                {userData.history.map((h,i)=>(<div key={i} style={{background:'#0f172a',padding:'0.6rem',borderRadius:'6px',marginBottom:'0.4rem',display:'flex',justifyContent:'space-between',fontSize:'0.85rem'}}>
                   <span style={{color:h.result==='WIN'?'#10b981':h.result==='LOSS'?'#ef4444':'#94a3b8'}}>{h.result==='WIN'?'🏆 Победа':h.result==='LOSS'?'😔 Проигрыш':'🤝 Ничья'}</span>
                   <span>{h.change} GROK</span>
                </div>))}
              </div>
            )}
          </div>
        )}

        {/* Модальное окно подтверждения депозита */}
        {pendingJoinGame === 'confirm' && (
          <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,padding:'1rem'}}>
            <div style={{background:'#1e293b',padding:'1.5rem',borderRadius:'16px',maxWidth:'360px',width:'100%',textAlign:'center',border:'2px solid #10b981'}}>
               <h3 style={{color:'#fbbf24',marginBottom:'1rem'}}>💰 Подтверждение транзакции</h3>
               <p style={{color:'#cbd5e1',marginBottom:'0.5rem'}}>Вы собираетесь внести <strong>{formatNumber(pendingJoinGame.stake)} GROK</strong> на баланс игры.</p>
               <p style={{color:'#94a3b8',fontSize:'0.8rem',marginBottom:'1.5rem'}}>Время игры: {getTimeLabel(pendingJoinGame.time)}</p>
               <div style={{display:'flex',gap:'0.8rem'}}>
                 <button onClick={()=>setPendingJoinGame(null)} style={{flex:1,padding:'0.7rem',background:'#64748b',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer'}}>Отмена</button>
                 <button onClick={confirmJoinGame} style={{flex:1,padding:'0.7rem',background:'#10b981',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'bold'}}>✅ Подтвердить</button>
               </div>
            </div>
          </div>
        )}

         {/* Модальное окно Ссылки */}
        {showLinkModal && (
          <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,padding:'1rem'}} onClick={()=>setShowLinkModal(null)}>
            <div style={{background:'#1e293b',padding:'1.5rem',borderRadius:'16px',maxWidth:'400px',width:'100%',textAlign:'center',border:'2px solid #fbbf24'}} onClick={e=>e.stopPropagation()}>
              <h3 style={{color:'#fbbf24',margin:'0 0 1rem 0'}}>🎉 Игра создана!</h3>
              <p style={{color:'#cbd5e1',marginBottom:'0.8rem',fontSize:'0.9rem'}}>Отправьте эту ссылку сопернику:</p>
              <div style={{background:'#0f172a',padding:'0.6rem',borderRadius:'8px',wordBreak:'break-all',marginBottom:'1rem',border:'1px dashed #475569',fontSize:'0.8rem'}}>{showLinkModal.link}</div>
              <button onClick={()=>{navigator.clipboard.writeText(showLinkModal.link);setMessage('✅ Ссылка скопирована!');setShowLinkModal(null)}} style={{width:'100%',padding:'0.8rem',background:'#3b82f6',color:'#fff',border:'none',borderRadius:'10px',cursor:'pointer',fontWeight:'bold'}}>📋 Скопировать и закрыть</button>
            </div>
          </div>
        )}

        {/* 💰 МОДАЛЬНОЕ ОКНО: ИНСТРУКЦИЯ ПОКУПКИ GROK */}
        {showGrokModal && (
          <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.9)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:3000,padding:'1rem'}} onClick={()=>setShowGrokModal(false)}>
            <div style={{background:'linear-gradient(135deg,#1e293b,#334155)',padding:'1.5rem',borderRadius:'20px',maxWidth:'450px',width:'100%',border:'2px solid #f59e0b'}} onClick={e=>e.stopPropagation()}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
                <h3 style={{color:'#fbbf24',margin:0,fontSize:'1.3rem'}}>💰 Как купить GROK</h3>
                <button onClick={()=>setShowGrokModal(false)} style={{background:'none',border:'none',color:'#94a3b8',fontSize:'1.5rem',cursor:'pointer'}}>✕</button>
              </div>
              
              <p style={{color:'#cbd5e1',marginBottom:'1rem',fontSize:'0.95rem',lineHeight:'1.5'}}>
                Приобрести игровую крипто монету для игры на Chess4Crypto можно так:
              </p>
              
              <div style={{background:'#0f172a',padding:'1rem',borderRadius:'12px',marginBottom:'1rem'}}>
                <div style={{display:'flex',gap:'0.8rem',marginBottom:'1rem',alignItems:'flex-start'}}>
                  <span style={{background:'#f59e0b',color:'#000',width:'24px',height:'24px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',flexShrink:0}}>1</span>
                  <div>
                    <p style={{margin:'0 0 0.3rem 0',color:'#e2e8f0',fontWeight:'500'}}>Перейди на сайт и подключи кошелёк</p>
                    <p style={{margin:0,color:'#94a3b8',fontSize:'0.85rem'}}>Сеть: <strong>BNB Smart Chain</strong> (должны быть BNB для комиссии)</p>
                  </div>
                </div>
                <a href={GROK_BUY_LINK} target="_blank" rel="noopener noreferrer" style={{display:'block',background:'#3b82f6',color:'#fff',padding:'0.6rem',borderRadius:'8px',textAlign:'center',textDecoration:'none',fontWeight:'500',marginBottom:'1rem',wordBreak:'break-all'}}>
                  🔗 Открыть four.meme → GROK
                </a>
                
                <div style={{display:'flex',gap:'0.8rem',marginBottom:'1rem',alignItems:'flex-start'}}>
                  <span style={{background:'#f59e0b',color:'#000',width:'24px',height:'24px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',flexShrink:0}}>2</span>
                  <p style={{margin:0,color:'#e2e8f0'}}>Купи монету <strong>GROK</strong> на любую сумму</p>
                </div>
                
                <div style={{display:'flex',gap:'0.8rem',alignItems:'flex-start'}}>
                  <span style={{background:'#f59e0b',color:'#000',width:'24px',height:'24px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',flexShrink:0}}>3</span>
                  <div>
                    <p style={{margin:'0 0 0.3rem 0',color:'#e2e8f0'}}>Добавь GROK в кошелёк для отображения</p>
                    <p style={{margin:'0 0 0.5rem 0',color:'#94a3b8',fontSize:'0.85rem'}}>Адрес контракта:</p>
                    <div style={{display:'flex',gap:'0.4rem'}}>
                      <code style={{background:'#1e293b',padding:'0.4rem 0.6rem',borderRadius:'6px',fontSize:'0.8rem',color:'#60a5fa',wordBreak:'break-all',flex:1}}>{GROK_CONTRACT}</code>
                      <button onClick={copyContract} style={{padding:'0.4rem 0.8rem',background:copiedContract?'#10b981':'#3b82f6',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontWeight:'500',fontSize:'0.8rem',whiteSpace:'nowrap'}}>
                        {copiedContract ? '✅' : '📋'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <button onClick={()=>{window.open(GROK_BUY_LINK,'_blank'); setShowGrokModal(false)}} style={{width:'100%',padding:'0.8rem',background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#000',border:'none',borderRadius:'10px',cursor:'pointer',fontWeight:'bold',fontSize:'1rem'}}>
                🚀 Перейти к покупке
              </button>
            </div>
          </div>
        )}

        <div style={{marginTop:'1rem',width:'100%',maxWidth:'500px'}}>
           <button onClick={()=>startGame()} style={{width:'100%',padding:'0.9rem',background:'linear-gradient(135deg,#10b981,#059669)',color:'#fff',border:'none',borderRadius:'10px',cursor:'pointer',fontSize:'1rem',fontWeight:'600'}}>🤖 Быстрая игра с ботом</button>
        </div>
        <select value={i18n.language} onChange={e=>i18n.changeLanguage(e.target.value)} style={{marginTop:'1rem',padding:'0.5rem',background:'#334155',color:'#fff',border:'1px solid #475569',borderRadius:'8px',cursor:'pointer'}}><option value="ru">🇷🇺 RU</option><option value="en">🇬🇧 EN</option></select>
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
           <button onClick={()=>setView('profile')} style={{padding:'0.4rem 0.8rem',background:'#3b82f6',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer'}}>👤 Профиль</button>
           <button onClick={handleLogout} style={{padding:'0.4rem 0.8rem',background:'#ef4444',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer'}}>🚪</button>
        </div>
      </header>
      <div style={{display:'flex',justifyContent:'space-around',width:'100%',maxWidth:'400px',marginBottom:'0.8rem'}}>
        <div style={{background:timerActive==='player'&&!gameOver?'#059669':'#1e293b',padding:'0.6rem 1.2rem',borderRadius:'10px',textAlign:'center',border:timerActive==='player'&&!gameOver?'2px solid #34d399':'2px solid transparent'}}><div style={{fontSize:'0.85rem',color:'#94a3b8'}}>👤 Вы</div><div style={{fontSize:'1.4rem',fontWeight:'bold',fontFamily:'monospace'}}>{fmtTime(playerTime)}</div></div>
        <div style={{background:timerActive==='bot'&&!gameOver?'#059669':'#1e293b',padding:'0.6rem 1.2rem',borderRadius:'10px',textAlign:'center',border:timerActive==='bot'&&!gameOver?'2px solid #34d399':'2px solid transparent'}}><div style={{fontSize:'0.85rem',color:'#94a3b8'}}>🤖 Бот</div><div style={{fontSize:'1.4rem',fontWeight:'bold',fontFamily:'monospace'}}>{fmtTime(botTime)}</div></div>
      </div>
      {message && <div style={{color:'#38bdf8',marginBottom:'0.6rem',fontSize:'1rem',textAlign:'center'}}>{message}</div>}
      <div style={{width:boardWidth+20,height:boardWidth+20,background:'#1e293b',padding:'10px',borderRadius:'12px',boxShadow:theme.boardShadow,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'1rem'}}>
        <div style={{width:'100%',height:'100%',filter:theme.pieceFilter}}><Chessboard position={fen} onPieceDrop={onDrop} onSquareClick={onSqClick} customSquareStyles={sqStyles} boardOrientation="white" boardWidth={boardWidth} customDarkSquareStyle={{backgroundColor:theme.dark}} customLightSquareStyle={{backgroundColor:theme.light}} customBoardStyle={{borderRadius:'8px'}}/></div>
      </div>
      
      {/* ✅ КНОПКИ ВПЕРЕД И НАЗАД */}
      <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem',justifyContent:'center',width:'100%',maxWidth:'400px'}}>
        <button onClick={handleBack} disabled={moveIndex === 0 || gameOver} style={{padding:'0.6rem 1rem',background:moveIndex===0||gameOver?'#334155':'#3b82f6',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer'}}>⏪ Назад</button>
        <button onClick={handleForward} disabled={moveIndex >= history.length - 1 || gameOver} style={{padding:'0.6rem 1rem',background:moveIndex>=history.length-1||gameOver?'#334155':'#3b82f6',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer'}}>⏩ Вперед</button>
      </div>

      {gameOver && winner && <div style={{background:'#1e293b',padding:'1rem',borderRadius:'16px',width:'100%',maxWidth:'400px',textAlign:'center',marginBottom:'1rem',border:'2px solid #a78bfa'}}><div style={{fontSize:'2rem',marginBottom:'0.3rem'}}>{winner==='player'?'🏆':winner==='bot'?'🤖':'🤝'}</div><div style={{fontSize:'1.2rem',fontWeight:'bold',color:'#fbbf24',marginBottom:'0.5rem'}}>{winner==='player'?'🎉 CHECKMATE!':winner==='bot'?'😔 Поражение':'🤝 Ничья!'}</div><button onClick={()=>{setView('profile');setGameOver(false);setTimerActive(null);gameRef.current.reset();setFen(gameRef.current.fen());setHistory([gameRef.current.fen()]);setMoveIndex(0);setMovesList([])}} style={{padding:'0.6rem 1.5rem',background:'#10b981',color:'#fff',border:'none',borderRadius:'10px',cursor:'pointer'}}>👤 В профиль</button></div>}
    </div>
  )
}

export default App