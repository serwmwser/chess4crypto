import { useState, useEffect, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'

// 🛡️ ГЛОБАЛЬНАЯ ЗАЩИТА: глушит ошибки расширения MetaMask/inpage.js
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', e => {
    if (e.reason?.message?.includes('MetaMask') || e.reason?.message?.includes('not found')) {
      e.preventDefault()
      console.warn('🛡️ Wallet extension error safely ignored')
    }
  })
}

// 🌍 7 ЯЗЫКОВ
const LANG = {
  ru: { t:'♟️ Chess4Crypto', s:'Web3 шахматы с крипто-ставками', g:'👤 Гостевой вход', c:'🦊 Подключить кошелёк', k:'💰 Купить GROK', p:'👤 Профиль', l:'🚪 Выйти', y:'👤 Вы', b:'🤖 Бот', yt:'♟️ Ваш ход!', bt:'🤖 Бот думает (3с)...', w:'🏆 ПОБЕДА!', x:'😔 Поражение', d:'🤝 Ничья', tp:'⏰ Бот выиграл', tb:'⏰ Вы выиграли', cn:'✅ Кошелёк подключён!', nw:'⚠️ Кошелёк не найден, вход в профиль...', cl:'Закрыть', cp:'📋 Копировать', cd:'✅ Скопировано!', gt:'💰 Как купить GROK', g1:'1. Перейди по ссылке и подключи крипто-кошелёк в сети BNB (нужен BNB для комиссии).', g2:'2. Купи монету GROK на любую сумму.', g3:'3. Добавь адрес в кошелёк для отображения:', ln:'🇷🇺 RU', th:'🎨 Тема доски', tm:{c:'🏛️ Классика',w:'🪵 Дерево',n:'💜 Неон',o:'🌊 Океан',s:'🌅 Закат',m:'⚪ Минимал'} },
  en: { t:'♟️ Chess4Crypto', s:'Web3 Chess with Crypto Stakes', g:'👤 Guest Mode', c:'🦊 Connect Wallet', k:'💰 Buy GROK', p:'👤 Profile', l:'🚪 Logout', y:'👤 You', b:'🤖 Bot', yt:'♟️ Your turn!', bt:'🤖 Bot thinks (3s)...', w:'🏆 YOU WIN!', x:'😔 You lost', d:'🤝 Draw', tp:'⏰ Bot wins', tb:'⏰ You win', cn:'✅ Wallet connected!', nw:'⚠️ Wallet not found, entering profile...', cl:'Close', cp:'📋 Copy', cd:'✅ Copied!', gt:'💰 How to Buy GROK', g1:'1. Follow the link and connect your BNB Chain wallet (need BNB for gas).', g2:'2. Buy GROK token for any amount.', g3:'3. Add contract to wallet to display:', ln:'🇬🇧 EN', th:'🎨 Board Theme', tm:{c:'🏛️ Classic',w:'🪵 Wood',n:'💜 Neon',o:'🌊 Ocean',s:'🌅 Sunset',m:'⚪ Minimal'} },
  de: { t:'♟️ Chess4Crypto', s:'Web3-Schach mit Krypto', g:'👤 Gast', c:'🦊 Wallet', k:'💰 GROK', p:'👤 Profil', l:'🚪 Exit', y:'👤 Du', b:'🤖 Bot', yt:'♟️ Dein Zug!', bt:'🤖 Bot denkt (3s)...', w:'🏆 GEWINN!', x:'😔 Verloren', d:'🤝 Remis', tp:'⏰ Bot gewinnt', tb:'⏰ Du gewinnst', cn:'✅ Verbunden', nw:'⚠️ Nicht gefunden, Profil...', cl:'Schließen', cp:'📋 Kopieren', cd:'✅ Kopiert', gt:'💰 GROK kaufen', g1:'1. Link öffnen und BNB Chain Wallet verbinden (BNB nötig).', g2:'2. GROK-Token kaufen.', g3:'3. Adresse im Wallet hinzufügen:', ln:'🇩🇪 DE', th:'🎨 Design', tm:{c:'🏛️ Klassisch',w:'🪵 Holz',n:'💜 Neon',o:'🌊 Ozean',s:'🌅 Sonnenuntergang',m:'⚪ Minimal'} },
  fr: { t:'♟️ Chess4Crypto', s:'Échecs Web3 crypto', g:'👤 Invité', c:'🦊 Wallet', k:'💰 GROK', p:'👤 Profil', l:'🚪 Quitter', y:'👤 Vous', b:'🤖 Bot', yt:'♟️ À vous!', bt:'🤖 Bot pense (3s)...', w:'🏆 GAGNÉ!', x:'😔 Perdu', d:'🤝 Nulle', tp:'⏰ Bot gagne', tb:'⏰ Vous gagnez', cn:'✅ Connecté', nw:'⚠️ Non trouvé, profil...', cl:'Fermer', cp:'📋 Copier', cd:'✅ Copié', gt:'💰 Acheter GROK', g1:'1. Suivre le lien et connecter wallet BNB Chain (BNB requis).', g2:'2. Acheter GROK.', g3:'3. Ajouter l\'adresse au wallet:', ln:'🇫🇷 FR', th:'🎨 Thème', tm:{c:'🏛️ Classique',w:'🪵 Bois',n:'💜 Néon',o:'🌊 Océan',s:'🌅 Coucher',m:'⚪ Minimal'} },
  es: { t:'♟️ Chess4Crypto', s:'Ajedrez Web3 crypto', g:'👤 Invitado', c:'🦊 Wallet', k:'💰 GROK', p:'👤 Perfil', l:'🚪 Salir', y:'👤 Tú', b:'🤖 Bot', yt:'♟️ ¡Tu turno!', bt:'🤖 Bot piensa (3s)...', w:'🏆 ¡GANASTE!', x:'😔 Perdiste', d:'🤝 Empate', tp:'⏰ Bot gana', tb:'⏰ Ganas tú', cn:'✅ Conectado', nw:'⚠️ No encontrado, perfil...', cl:'Cerrar', cp:'📋 Copiar', cd:'✅ Copiado', gt:'💰 Comprar GROK', g1:'1. Ir al enlace y conectar wallet BNB Chain (necesitas BNB).', g2:'2. Comprar GROK.', g3:'3. Añadir dirección al wallet:', ln:'🇪🇸 ES', th:'🎨 Tema', tm:{c:'🏛️ Clásico',w:'🪵 Madera',n:'💜 Neón',o:'🌊 Océano',s:'🌅 Atardecer',m:'⚪ Minimal'} },
  zh: { t:'♟️ Chess4Crypto', s:'Web3国际象棋', g:'👤 访客', c:'🦊 钱包', k:'💰 GROK', p:'👤 资料', l:'🚪 退出', y:'👤 你', b:'🤖 机器人', yt:'♟️ 轮到你!', bt:'🤖 思考中 (3s)...', w:'🏆 你赢了!', x:'😔 你输了', d:'🤝 平局', tp:'⏰ 机器人赢', tb:'⏰ 你赢了', cn:'✅ 已连接', nw:'⚠️ 未找到，进入资料...', cl:'关闭', cp:'📋 复制', cd:'✅ 已复制', gt:'💰 购买GROK', g1:'1. 点击链接连接BNB链钱包（需BNB支付手续费）。', g2:'2. 购买GROK代币。', g3:'3. 将地址添加到钱包:', ln:'🇨🇳 中文', th:'🎨 主题', tm:{c:'🏛️ 经典',w:'🪵 木质',n:'💜 霓虹',o:'🌊 海洋',s:'🌅 日落',m:'⚪ 简约'} },
  hi: { t:'♟️ Chess4Crypto', s:'Web3 शतरंज', g:'👤 अतिथि', c:'🦊 वॉलेट', k:'💰 GROK', p:'👤 प्रोफ़ाइल', l:'🚪 बाहर', y:'👤 आप', b:'🤖 बॉट', yt:'♟️ आपकी बारी!', bt:'🤖 सोच रहा (3s)...', w:'🏆 आप जीते!', x:'😔 आप हारे', d:'🤝 ड्रॉ', tp:'⏰ बॉट जीता', tb:'⏰ आप जीते', cn:'✅ कनेक्ट', nw:'⚠️ नहीं मिला, प्रोफ़ाइल...', cl:'बंद', cp:'📋 कॉपी', cd:'✅ कॉपी', gt:'💰 GROK खरीदें', g1:'1. लिंक पर जाएं और BNB चेन वॉलेट कनेक्ट करें (BNB चाहिए)।', g2:'2. GROK खरीदें।', g3:'3. वॉलेट में एड्रेस जोड़ें:', ln:'🇮🇳 हिंदी', th:'🎨 थीम', tm:{c:'🏛️ क्लासिक',w:'🪵 लकड़ी',n:'💜 नियॉन',o:'🌊 महासागर',s:'🌅 सूर्यास्त',m:'⚪ मिनिमल'} }
}

// 🎨 6 ТЕМ ДОСОК
const THEMES = {
  c: { light: '#eeeed2', dark: '#769656', name: '🏛️ Classic' },
  w: { light: '#f0d9b5', dark: '#b58863', name: '🪵 Wood' },
  n: { light: '#1a1a2e', dark: '#16213e', name: '💜 Neon' },
  o: { light: '#e0f7fa', dark: '#006064', name: '🌊 Ocean' },
  s: { light: '#fff3e0', dark: '#e65100', name: '🌅 Sunset' },
  m: { light: '#e0e0e0', dark: '#757575', name: '⚪ Minimal' }
}

const fmtTime = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`
const GROK_LINK = 'https://four.meme/token/0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444?code=AHGX96R5GHK9'
const GROK_CONTRACT = '0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444'

export default function App() {
  const [lang, setLang] = useState('ru')
  const t = useCallback(k => LANG[lang][k] || k, [lang])
  const [view, setView] = useState('menu')
  const [msg, setMsg] = useState('')
  const [showGrok, setShowGrok] = useState(false)
  const [copied, setCopied] = useState(false)
  const [boardTheme, setBoardTheme] = useState('c')
  const [boardSize, setBoardSize] = useState(Math.min(window.innerWidth * 0.9, 400))

  const gameRef = useRef(new Chess())
  const [fen, setFen] = useState(gameRef.current.fen())
  const [history, setHistory] = useState([gameRef.current.fen()])
  const [moveIdx, setMoveIdx] = useState(0)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  const [playerTime, setPlayerTime] = useState(900)
  const [botTime, setBotTime] = useState(900)
  const [timerActive, setTimerActive] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    const r = () => setBoardSize(Math.min(window.innerWidth * 0.9, 400))
    window.addEventListener('resize', r)
    return () => window.removeEventListener('resize', r)
  }, [])

  // ⏱️ ТАЙМЕР (функциональные обновления)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!timerActive || gameOver) return
    timerRef.current = setInterval(() => {
      if (timerActive === 'player') {
        setPlayerTime(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); setGameOver(true); setWinner('bot'); setMsg(t('tp')); return 0 }
          return prev - 1
        })
      } else {
        setBotTime(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); setGameOver(true); setWinner('player'); setMsg(t('tb')); return 0 }
          return prev - 1
        })
      }
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [timerActive, gameOver, t])

  // 🔘 КНОПКИ
  const handleGuest = () => {
    setMsg(t('g')); setGameOver(false); setWinner(null); setPlayerTime(900); setBotTime(900); startGame()
  }

  // ✅ Кошелёк: безопасный вызов + автоматический вход в профиль
  const connectWallet = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_requestAccounts' })
        .then(() => { setMsg(t('cn')); setView('profile') })
        .catch(() => { setMsg(t('nw')); setView('profile') })
    } else {
      setMsg(t('nw')); setView('profile')
    }
  }

  const handleGrok = () => setShowGrok(true)
  const toggleLang = () => setLang(prev => {
    const langs = ['ru','en','de','fr','es','zh','hi']
    return langs[(langs.indexOf(prev) + 1) % langs.length]
  })
  const copyContract = () => { navigator.clipboard.writeText(GROK_CONTRACT); setCopied(true); setTimeout(()=>setCopied(false), 2000) }

  const startGame = () => {
    gameRef.current.reset(); setFen(gameRef.current.fen()); setHistory([gameRef.current.fen()]); setMoveIdx(0)
    setIsPlayerTurn(true); setGameOver(false); setWinner(null); setPlayerTime(900); setBotTime(900)
    setTimerActive('player'); setView('game')
  }

  const makeBotMove = useCallback(() => {
    if (gameOver || gameRef.current.isGameOver()) return
    const moves = gameRef.current.moves(); if (!moves.length) return
    const mv = moves[Math.floor(Math.random() * moves.length)]
    gameRef.current.move(mv)
    setFen(gameRef.current.fen()); setHistory(h => [...h, gameRef.current.fen()]); setMoveIdx(i => i + 1)
    setIsPlayerTurn(true); setTimerActive('player')
    if (gameRef.current.isCheckmate()) { setGameOver(true); setWinner('bot'); setMsg(t('x')) }
    else if (gameRef.current.isDraw()) { setGameOver(true); setWinner(null); setMsg(t('d')) }
    else setMsg(t('yt'))
  }, [gameOver, t])

  // ✅ Ход игрока + бот через 3 секунды
  const onDrop = useCallback((src, tgt) => {
    if (!isPlayerTurn || gameOver) return false
    try {
      const res = gameRef.current.move({ from: src, to: tgt, promotion: 'q' }); if (!res) return false
      setFen(gameRef.current.fen()); setHistory(h => [...h, gameRef.current.fen()]); setMoveIdx(i => i + 1)
      setIsPlayerTurn(false); setTimerActive('bot')
      if (gameRef.current.isCheckmate()) { setGameOver(true); setWinner('player'); setMsg(t('w')) }
      else if (gameRef.current.isDraw()) { setGameOver(true); setWinner(null); setMsg(t('d')) }
      else { setMsg(t('bt')); setTimeout(makeBotMove, 3000) } // ⏱️ 3 секунды
      return true
    } catch { return false }
  }, [isPlayerTurn, gameOver, makeBotMove, t])

  // 🎨 UI
  const Btn = ({c,o,bg,dis,st}) => <button onClick={o} disabled={dis} style={{padding:'0.8rem 1.2rem',background:bg||'#3b82f6',color:'#fff',border:'none',borderRadius:'10px',cursor:dis?'not-allowed':'pointer',fontSize:'1rem',fontWeight:'600',opacity:dis?0.5:1,...st}}>{c}</button>
  const Timer = ({l,t,a}) => <div style={{background:a?'#059669':'#1e293b',padding:'10px 20px',borderRadius:'10px',color:'#fff',textAlign:'center',border:a?'2px solid #34d399':'1px solid #334155',width:'45%'}}><div style={{fontSize:'0.85rem',opacity:0.8}}>{l}</div><div style={{fontSize:'1.6rem',fontWeight:'bold',fontFamily:'monospace'}}>{fmtTime(t)}</div></div>

  // ============================================================================
  // 🖥️ МЕНЮ (БЕЗ КНОПКИ GROK)
  // ============================================================================
  if (view === 'menu') return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0f172a,#1e293b)',color:'#f1f5f9',fontFamily:'system-ui',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'2rem',textAlign:'center',gap:'1rem'}}>
      <h1 style={{fontSize:'2.5rem',color:'#fbbf24',margin:0}}>{t('t')}</h1>
      <p style={{color:'#94a3b8'}}>{t('s')}</p>
      <Btn c={t('g')} o={handleGuest} bg="linear-gradient(135deg,#3b82f6,#2563eb)"/>
      <Btn c={t('c')} o={connectWallet} bg="linear-gradient(135deg,#f59e0b,#d97706)"/>
      <Btn c={t('ln')} o={toggleLang} bg="#475569"/>
      {msg && <div style={{padding:'0.6rem',background:'rgba(59,130,246,0.2)',borderRadius:'8px',color:'#60a5fa'}}>{msg}</div>}
    </div>
  )

  // ============================================================================
  // 🖥️ ПРОФИЛЬ (КНОПКА GROK ЗДЕСЬ)
  // ============================================================================
  if (view === 'profile') return (
    <div style={{minHeight:'100vh',background:'#0f172a',color:'#f1f5f9',fontFamily:'system-ui',display:'flex',flexDirection:'column',alignItems:'center',padding:'1.5rem',gap:'1rem'}}>
      <h2 style={{color:'#fbbf24'}}>{t('p')}</h2>
      <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
        <Btn c={t('l')} o={()=>setView('menu')} bg="#ef4444"/>
        <Btn c={t('k')} o={handleGrok} bg="#10b981"/>
        <Btn c="🎮 "+t('g') o={startGame} bg="#8b5cf6"/>
        <Btn c={t('ln')} o={toggleLang} bg="#475569"/>
      </div>
    </div>
  )

  // ============================================================================
  // 🖥️ ИГРА
  // ============================================================================
  return (
    <div style={{minHeight:'100vh',background:'#0f172a',color:'#f1f5f9',fontFamily:'system-ui',display:'flex',flexDirection:'column',alignItems:'center',paddingTop:'1rem',gap:'1rem',padding:'0 1rem'}}>
      <div style={{display:'flex',justifyContent:'space-around',width:'100%',maxWidth:'420px',marginBottom:'0.5rem'}}>
        <Timer l={t('y')} t={playerTime} a={timerActive==='player'}/>
        <Timer l={t('b')} t={botTime} a={timerActive==='bot'}/>
      </div>
      {msg && <div style={{color:'#38bdf8',textAlign:'center'}}>{msg}</div>}
      
      <div style={{background:'#1e293b',padding:'10px',borderRadius:'12px',boxShadow:'0 4px 16px rgba(0,0,0,0.4)'}}>
        <Chessboard position={fen} onPieceDrop={onDrop} boardWidth={boardSize}
          customDarkSquareStyle={{backgroundColor:THEMES[boardTheme].dark}}
          customLightSquareStyle={{backgroundColor:THEMES[boardTheme].light}} />
      </div>

      <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',justifyContent:'center'}}>
        <Btn c={t('p')} o={()=>setView('profile')} bg="#3b82f6"/>
        <Btn c={t('ln')} o={toggleLang} bg="#475569"/>
        <select value={boardTheme} onChange={e=>setBoardTheme(e.target.value)} style={{padding:'0.8rem',background:'#1e293b',color:'#fff',border:'1px solid #475569',borderRadius:'8px',cursor:'pointer'}}>
          <option value="c">{THEMES.c.name}</option>
          <option value="w">{THEMES.w.name}</option>
          <option value="n">{THEMES.n.name}</option>
          <option value="o">{THEMES.o.name}</option>
          <option value="s">{THEMES.s.name}</option>
          <option value="m">{THEMES.m.name}</option>
        </select>
      </div>

      {gameOver && (
        <div style={{background:'#1e293b',padding:'1.2rem',borderRadius:'12px',textAlign:'center',maxWidth:'400px',border:'1px solid #fbbf24'}}>
          <h3 style={{color:'#fbbf24'}}>{winner==='player'?t('w'):winner==='bot'?t('x'):t('d')}</h3>
          <Btn c={t('p')} o={()=>setView('profile')} bg="#10b981"/>
        </div>
      )}

      {showGrok && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.9)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,padding:'1rem'}} onClick={()=>setShowGrok(false)}>
          <div style={{background:'linear-gradient(135deg,#1e293b,#334155)',padding:'1.5rem',borderRadius:'16px',maxWidth:'420px',width:'100%',border:'2px solid #f59e0b'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
              <h3 style={{color:'#fbbf24',margin:0}}>{t('gt')}</h3>
              <button onClick={()=>setShowGrok(false)} style={{background:'none',border:'none',color:'#94a3b8',fontSize:'1.5rem',cursor:'pointer'}}>✕</button>
            </div>
            <ol style={{color:'#cbd5e1',margin:'0 0 1rem 0',paddingLeft:'1.2rem',lineHeight:'1.6',fontSize:'0.95rem'}}>
              <li style={{marginBottom:'0.5rem'}}>{t('g1')}</li>
              <li style={{marginBottom:'0.5rem'}}>{t('g2')}</li>
              <li>{t('g3')}<br/><code style={{background:'#0f172a',padding:'0.4rem 0.6rem',borderRadius:'6px',color:'#60a5fa',wordBreak:'break-all',display:'block',margin:'0.5rem 0'}}>{GROK_CONTRACT}</code>
              <button onClick={copyContract} style={{padding:'0.4rem 0.8rem',background:copied?'#10b981':'#3b82f6',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer'}}>{copied?t('cd'):t('cp')}</button></li>
            </ol>
            <a href={GROK_LINK} target="_blank" rel="noopener" style={{display:'block',background:'#f59e0b',color:'#000',padding:'0.8rem',borderRadius:'10px',textAlign:'center',textDecoration:'none',fontWeight:'600',marginBottom:'0.8rem'}}>🔗 four.meme → GROK</a>
            <Btn c={t('cl')} o={()=>setShowGrok(false)} bg="#64748b" st={{width:'100%'}}/>
          </div>
        </div>
      )}
    </div>
  )
}