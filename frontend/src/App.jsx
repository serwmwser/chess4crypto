import { useState, useEffect, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'

// 🛡️ Глобальная защита от ошибок MetaMask
window.addEventListener('unhandledrejection', event => {
  if (event.reason?.message?.includes('MetaMask') || event.reason?.message?.includes('not found')) {
    event.preventDefault()
    console.warn('🛡️ Wallet not found - handled safely')
  }
})

// 🌍 СЛОВАРЬ: 7 языков (полный перевод всех ключей)
const LANG = {
  ru: {
    title: '♟️ Chess4Crypto', sub: 'Web3 шахматы с крипто-ставками',
    guest: '👤 Гостевой вход', connect: '🦊 Подключить кошелёк', grok: '💰 Купить GROK',
    profile: '👤 Профиль', logout: '🚪 Выйти', save: '💾 Сохранить',
    rules: '📜 Правила: 1. Внесите ставку. 2. Присоединяйтесь с равной суммой. 3. Победитель забирает ×2. 4. Ничья → фонд.',
    yourTurn: '♟️ Ваш ход!', botThink: '🤖 Бот думает...',
    win: '🏆 CHECKMATE! ВЫ ПОБЕДИЛИ!', lose: '😔 Вы проиграли.', draw: '🤝 Ничья!',
    timeOutP: '⏰ Время вышло! Бот победил.', timeOutB: '⏰ Время вышло! Вы победили!',
    connected: '✅ Кошелёк подключён!', noWallet: '⚠️ MetaMask не установлен. Используйте гостевой режим.',
    guestMode: '👤 Гостевой режим', close: 'Закрыть', copy: '📋 Скопировать', copied: '✅ Скопировано!',
    grokTitle: '💰 Как купить GROK',
    grokStep1: '1. Перейди на сайт по ссылке и подключи свой крипто-кошелёк в сети BNB, на котором есть BNB для комиссии.',
    grokStep2: '2. Купи монету GROK на любую сумму.',
    grokStep3: '3. Добавь GROK в свой кошелёк для отображения. Адрес контракта:',
    lang: '🇷🇺 RU', theme: '🎨 Тема доски',
    themes: { classic: '🏛️ Классика', wood: '🪵 Дерево', neon: '💜 Неон', ocean: '🌊 Океан', sunset: '🌅 Закат', minimal: '⚪ Минимал' },
    you: '👤 Вы', bot: '🤖 Бот'
  },
  en: {
    title: '♟️ Chess4Crypto', sub: 'Web3 Chess with Crypto Stakes',
    guest: '👤 Guest Mode', connect: '🦊 Connect Wallet', grok: '💰 Buy GROK',
    profile: '👤 Profile', logout: '🚪 Logout', save: '💾 Save',
    rules: '📜 Rules: 1. Deposit stake. 2. Join with equal amount. 3. Winner takes ×2. 4. Draw → fund.',
    yourTurn: '♟️ Your turn!', botThink: '🤖 Bot thinking...',
    win: '🏆 CHECKMATE! YOU WIN!', lose: '😔 You lost.', draw: '🤝 Draw!',
    timeOutP: '⏰ Time out! Bot wins.', timeOutB: '⏰ Time out! You win!',
    connected: '✅ Wallet connected!', noWallet: '⚠️ MetaMask not found. Use Guest mode.',
    guestMode: '👤 Guest Mode', close: 'Close', copy: '📋 Copy', copied: '✅ Copied!',
    grokTitle: '💰 How to Buy GROK',
    grokStep1: '1. Go to the link and connect your crypto wallet on BNB Chain with BNB for gas fees.',
    grokStep2: '2. Buy GROK token for any amount.',
    grokStep3: '3. Add GROK to your wallet to display it. Contract address:',
    lang: '🇬🇧 EN', theme: '🎨 Board Theme',
    themes: { classic: '🏛️ Classic', wood: '🪵 Wood', neon: '💜 Neon', ocean: '🌊 Ocean', sunset: '🌅 Sunset', minimal: '⚪ Minimal' },
    you: '👤 You', bot: '🤖 Bot'
  },
  de: {
    title: '♟️ Chess4Crypto', sub: 'Web3-Schach mit Krypto-Einsätzen',
    guest: '👤 Gastmodus', connect: '🦊 Wallet verbinden', grok: '💰 GROK kaufen',
    profile: '👤 Profil', logout: '🚪 Abmelden', save: '💾 Speichern',
    rules: '📜 Regeln: 1. Einsatz hinterlegen. 2. Mit gleichem Betrag beitreten. 3. Gewinner nimmt ×2. 4. Remis → Fonds.',
    yourTurn: '♟️ Dein Zug!', botThink: '🤖 Bot denkt...',
    win: '🏆 SCHACHMATT! DU GEWINNST!', lose: '😔 Du hast verloren.', draw: '🤝 Remis!',
    timeOutP: '⏰ Zeit abgelaufen! Bot gewinnt.', timeOutB: '⏰ Zeit abgelaufen! Du gewinnst!',
    connected: '✅ Wallet verbunden!', noWallet: '⚠️ MetaMask nicht gefunden. Nutze Gastmodus.',
    guestMode: '👤 Gastmodus', close: 'Schließen', copy: '📋 Kopieren', copied: '✅ Kopiert!',
    grokTitle: '💰 GROK kaufen',
    grokStep1: '1. Gehe zum Link und verbinde deine Wallet im BNB Chain mit BNB für Gebühren.',
    grokStep2: '2. Kaufe GROK-Token für einen beliebigen Betrag.',
    grokStep3: '3. Füge GROK zu deiner Wallet hinzu. Vertragsadresse:',
    lang: '🇩🇪 DE', theme: '🎨 Brett-Design',
    themes: { classic: '🏛️ Klassisch', wood: '🪵 Holz', neon: '💜 Neon', ocean: '🌊 Ozean', sunset: '🌅 Sonnenuntergang', minimal: '⚪ Minimal' },
    you: '👤 Du', bot: '🤖 Bot'
  },
  fr: {
    title: '♟️ Chess4Crypto', sub: 'Échecs Web3 avec mises crypto',
    guest: '👤 Mode invité', connect: '🦊 Connecter wallet', grok: '💰 Acheter GROK',
    profile: '👤 Profil', logout: '🚪 Déconnexion', save: '💾 Enregistrer',
    rules: '📜 Règles: 1. Déposez une mise. 2. Rejoignez avec montant égal. 3. Le gagnant prend ×2. 4. Nulle → fonds.',
    yourTurn: '♟️ À vous!', botThink: '🤖 Bot réfléchit...',
    win: '🏆 ÉCHEC ET MAT! VOUS GAGNEZ!', lose: '😔 Vous avez perdu.', draw: '🤝 Nulle!',
    timeOutP: '⏰ Temps écoulé! Le bot gagne.', timeOutB: '⏰ Temps écoulé! Vous gagnez!',
    connected: '✅ Wallet connecté!', noWallet: '⚠️ MetaMask introuvable. Utilisez le mode invité.',
    guestMode: '👤 Mode invité', close: 'Fermer', copy: '📋 Copier', copied: '✅ Copié!',
    grokTitle: '💰 Comment acheter GROK',
    grokStep1: '1. Allez sur le lien et connectez votre wallet sur BNB Chain avec du BNB pour les frais.',
    grokStep2: '2. Achetez le token GROK pour n\'importe quel montant.',
    grokStep3: '3. Ajoutez GROK à votre wallet. Adresse du contrat:',
    lang: '🇫🇷 FR', theme: '🎨 Thème d\'échiquier',
    themes: { classic: '🏛️ Classique', wood: '🪵 Bois', neon: '💜 Néon', ocean: '🌊 Océan', sunset: '🌅 Coucher de soleil', minimal: '⚪ Minimal' },
    you: '👤 Vous', bot: '🤖 Bot'
  },
  es: {
    title: '♟️ Chess4Crypto', sub: 'Ajedrez Web3 con apuestas cripto',
    guest: '👤 Modo invitado', connect: '🦊 Conectar wallet', grok: '💰 Comprar GROK',
    profile: '👤 Perfil', logout: '🚪 Salir', save: '💾 Guardar',
    rules: '📜 Reglas: 1. Deposita una apuesta. 2. Únete con igual cantidad. 3. El ganador se lleva ×2. 4. Empate → fondo.',
    yourTurn: '♟️ ¡Tu turno!', botThink: '🤖 Bot pensando...',
    win: '🏆 ¡JAQUE MATE! ¡GANASTE!', lose: '😔 Perdiste.', draw: '🤝 ¡Empate!',
    timeOutP: '⏰ ¡Tiempo agotado! El bot gana.', timeOutB: '⏰ ¡Tiempo agotado! Ganas tú.',
    connected: '✅ Wallet conectada!', noWallet: '⚠️ MetaMask no encontrado. Usa modo invitado.',
    guestMode: '👤 Modo invitado', close: 'Cerrar', copy: '📋 Copiar', copied: '✅ ¡Copiado!',
    grokTitle: '💰 Cómo comprar GROK',
    grokStep1: '1. Ve al enlace y conecta tu wallet en BNB Chain con BNB para comisiones.',
    grokStep2: '2. Compra el token GROK por cualquier cantidad.',
    grokStep3: '3. Añade GROK a tu wallet. Dirección del contrato:',
    lang: '🇪🇸 ES', theme: '🎨 Tema del tablero',
    themes: { classic: '🏛️ Clásico', wood: '🪵 Madera', neon: '💜 Neón', ocean: '🌊 Océano', sunset: '🌅 Atardecer', minimal: '⚪ Minimal' },
    you: '👤 Tú', bot: '🤖 Bot'
  },
  zh: {
    title: '♟️ Chess4Crypto', sub: 'Web3国际象棋与加密货币投注',
    guest: '👤 访客模式', connect: '🦊 连接钱包', grok: '💰 购买GROK',
    profile: '👤 个人资料', logout: '🚪 退出', save: '💾 保存',
    rules: '📜 规则: 1. 存入押金。2. 以相同金额加入。3. 赢家获得×2。4. 平局→基金。',
    yourTurn: '♟️ 轮到你!', botThink: '🤖 机器人思考中...',
    win: '🏆 将死! 你赢了!', lose: '😔 你输了。', draw: '🤝 平局!',
    timeOutP: '⏰ 时间到! 机器人获胜。', timeOutB: '⏰ 时间到! 你赢了!',
    connected: '✅ 钱包已连接!', noWallet: '⚠️ 未找到MetaMask。使用访客模式。',
    guestMode: '👤 访客模式', close: '关闭', copy: '📋 复制', copied: '✅ 已复制!',
    grokTitle: '💰 如何购买GROK',
    grokStep1: '1. 点击链接并在BNB链上连接你的加密钱包（需有BNB支付手续费）。',
    grokStep2: '2. 购买任意数量的GROK代币。',
    grokStep3: '3. 将GROK添加到钱包以显示。合约地址:',
    lang: '🇨🇳 中文', theme: '🎨 棋盘主题',
    themes: { classic: '🏛️ 经典', wood: '🪵 木质', neon: '💜 霓虹', ocean: '🌊 海洋', sunset: '🌅 日落', minimal: '⚪ 简约' },
    you: '👤 你', bot: '🤖 机器人'
  },
  hi: {
    title: '♟️ Chess4Crypto', sub: 'Web3 शतरंज क्रिप्टो दांव के साथ',
    guest: '👤 अतिथि मोड', connect: '🦊 वॉलेट कनेक्ट करें', grok: '💰 GROK खरीदें',
    profile: '👤 प्रोफ़ाइल', logout: '🚪 लॉगआउट', save: '💾 सहेजें',
    rules: '📜 नियम: 1. दांव जमा करें। 2. समान राशि से जुड़ें। 3. विजेता ×2 लेता है। 4. ड्रॉ → फंड।',
    yourTurn: '♟️ आपकी बारी!', botThink: '🤖 बॉट सोच रहा है...',
    win: '🏆 चेकमेट! आप जीते!', lose: '😔 आप हार गए।', draw: '🤝 ड्रॉ!',
    timeOutP: '⏰ समय समाप्त! बॉट जीता।', timeOutB: '⏰ समय समाप्त! आप जीते!',
    connected: '✅ वॉलेट कनेक्ट हुआ!', noWallet: '⚠️ MetaMask नहीं मिला। अतिथि मोड उपयोग करें।',
    guestMode: '👤 अतिथि मोड', close: 'बंद करें', copy: '📋 कॉपी', copied: '✅ कॉपी हुआ!',
    grokTitle: '💰 GROK कैसे खरीदें',
    grokStep1: '1. लिंक पर जाएं और BNB Chain पर अपना क्रिप्टो वॉलेट कनेक्ट करें (गैस फीस के लिए BNB चाहिए)।',
    grokStep2: '2. किसी भी राशि के लिए GROK टोकन खरीदें।',
    grokStep3: '3. GROK को अपने वॉलेट में जोड़ें। कॉन्ट्रैक्ट एड्रेस:',
    lang: '🇮🇳 हिंदी', theme: '🎨 बोर्ड थीम',
    themes: { classic: '🏛️ क्लासिक', wood: '🪵 लकड़ी', neon: '💜 नियॉन', ocean: '🌊 महासागर', sunset: '🌅 सूर्यास्त', minimal: '⚪ मिनिमल' },
    you: '👤 आप', bot: '🤖 बॉट'
  }
}

// 🎨 6 тем доски
const THEMES = {
  classic: { light: '#eeeed2', dark: '#769656', name: '🏛️' },
  wood: { light: '#e8c49a', dark: '#8b6f47', name: '🪵' },
  neon: { light: '#1a1a2e', dark: '#16213e', name: '💜' },
  ocean: { light: '#a8d8ea', dark: '#2a6f97', name: '🌊' },
  sunset: { light: '#ffecd2', dark: '#fcb69f', name: '🌅' },
  minimal: { light: '#f0f0f0', dark: '#606060', name: '⚪' }
}

const fmtTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`
const GROK_LINK = 'https://four.meme/token/0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444?code=AHGX96R5GHK9'
const GROK_CONTRACT = '0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444'

export default function App() {
  // 🌐 Язык — ключевое: используй useCallback для t()
  const [lang, setLang] = useState('ru')
  const t = useCallback((key) => LANG[lang][key] || key, [lang])

  const [view, setView] = useState('menu')
  const [msg, setMsg] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [showGrok, setShowGrok] = useState(false)
  const [copied, setCopied] = useState(false)
  const [boardTheme, setBoardTheme] = useState('classic')
  const [boardSize, setBoardSize] = useState(Math.min(window.innerWidth * 0.9, 400))

  // ♟️ Шахматы
  const gameRef = useRef(new Chess())
  const [fen, setFen] = useState(gameRef.current.fen())
  const [history, setHistory] = useState([gameRef.current.fen()])
  const [moveIdx, setMoveIdx] = useState(0)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)

  // ⏱️ Таймеры
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

  // ✅ ТАЙМЕР (функциональные обновления — работает в гостевом режиме!)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!timerActive || gameOver) return
    timerRef.current = setInterval(() => {
      if (timerActive === 'player') {
        setPTime(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); setGameOver(true); setWinner('bot'); setMsg(t('timeOutP')); return 0 }
          return prev - 1
        })
      } else if (timerActive === 'bot') {
        setBTime(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); setGameOver(true); setWinner('player'); setMsg(t('timeOutB')); return 0 }
          return prev - 1
        })
      }
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [timerActive, gameOver, t])

  // 🔘 КНОПКИ
  const handleGuest = useCallback(() => {
    setMsg(t('guestMode'))
    setGameOver(false); setWinner(null); setMsg('')
    setPTime(timeCtrl * 60); setBTime(timeCtrl * 60)
    startGame()
  }, [timeCtrl, t])

  // ✅ Кошелёк: .then().catch() вместо async/await — нет Unhandled Promise
  const handleConnect = useCallback(() => {
    if (isConnecting) return
    setIsConnecting(true)
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_requestAccounts' })
        .then(() => { setMsg(t('connected')); setView('profile') })
        .catch(err => { console.warn('Wallet skipped:', err.message || err); setMsg(t('noWallet')) })
        .finally(() => setIsConnecting(false))
    } else {
      setMsg(t('noWallet')); setIsConnecting(false)
    }
  }, [isConnecting, t])

  const handleGrok = useCallback(() => setShowGrok(true), [])
  
  // ✅ Язык: цикл через 7 языков
  const toggleLang = useCallback(() => {
    setLang(prev => {
      const order = ['ru','en','de','fr','es','zh','hi']
      const idx = order.indexOf(prev)
      return order[(idx + 1) % order.length]
    })
  }, [])
  
  const copyContract = useCallback(() => {
    navigator.clipboard.writeText(GROK_CONTRACT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

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
      else { setMsg(t('botThink')); setTimeout(makeBotMove, 600) }
      return true
    } catch { return false }
  }, [isPlayerTurn, gameOver, makeBotMove, t])

  // 🎨 UI Компоненты
  const Btn = ({children, onClick, bg, disabled, style={}}) => (
    <button type="button" onClick={onClick} disabled={disabled} style={{
      padding:'0.8rem 1.2rem', background:bg||'#3b82f6', color:'#fff', border:'none', borderRadius:'10px',
      cursor: disabled?'not-allowed':'pointer', fontSize:'1rem', fontWeight:'600', opacity: disabled?0.5:1, transition:'0.2s', ...style
    }}>{children}</button>
  )
  const TimerBox = ({label, time, active}) => (
    <div style={{background:active?'#059669':'#1e293b', padding:'10px 20px', borderRadius:'10px', color:'#fff', textAlign:'center', border:active?'2px solid #34d399':'1px solid #334155', width:'45%'}}>
      <div style={{fontSize:'0.85rem', opacity:0.8}}>{label}</div>
      <div style={{fontSize:'1.6rem', fontWeight:'bold', fontFamily:'monospace'}}>{fmtTime(time)}</div>
    </div>
  )

  // ============================================================================
  // 🖥️ РЕНДЕР
  // ============================================================================
  if (view === 'menu') return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg,#0f172a,#1e293b)', color:'#f1f5f9', fontFamily:'system-ui', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem', textAlign:'center', gap:'1.2rem'}}>
      <h1 style={{fontSize:'2.5rem', color:'#fbbf24', margin:0}}>{t('title')}</h1>
      <p style={{color:'#94a3b8', margin:0}}>{t('sub')}</p>
      <Btn onClick={handleGuest} bg="linear-gradient(135deg,#3b82f6,#2563eb)">{t('guest')}</Btn>
      <Btn onClick={handleConnect} bg="linear-gradient(135deg,#f59e0b,#d97706)" disabled={isConnecting}>{isConnecting?'⏳...':t('connect')}</Btn>
      <Btn onClick={handleGrok} bg="linear-gradient(135deg,#10b981,#059669)">{t('grok')}</Btn>
      <Btn onClick={toggleLang} bg="#475569">{t('lang')}</Btn>
      {msg && <div style={{padding:'0.6rem', background:'rgba(59,130,246,0.2)', borderRadius:'8px', color:'#60a5fa', maxWidth:'300px'}}>{msg}</div>}
    </div>
  )

  if (view === 'profile') return (
    <div style={{minHeight:'100vh', background:'#0f172a', color:'#f1f5f9', fontFamily:'system-ui', display:'flex', flexDirection:'column', alignItems:'center', padding:'1.5rem', gap:'1rem'}}>
      <h2 style={{color:'#fbbf24'}}>👤 {t('profile')}</h2>
      <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap', justifyContent:'center'}}>
        <Btn onClick={()=>setView('menu')} bg="#ef4444">{t('logout')}</Btn>
        <Btn onClick={handleGrok} bg="#10b981">{t('grok')}</Btn>
        <Btn onClick={startGame} bg="#8b5cf6">🎮 {t('guest')}</Btn>
        <Btn onClick={toggleLang} bg="#475569">{t('lang')}</Btn>
      </div>
      <div style={{background:'#1e293b', padding:'1rem', borderRadius:'10px', maxWidth:'400px', textAlign:'center', color:'#94a3b8', fontSize:'0.9rem'}}>{t('rules')}</div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh', background:'#0f172a', color:'#f1f5f9', fontFamily:'system-ui', display:'flex', flexDirection:'column', alignItems:'center', paddingTop:'1rem', gap:'1rem', padding:'0 1rem'}}>
      <div style={{display:'flex', justifyContent:'space-around', width:'100%', maxWidth:'420px', marginBottom:'0.5rem'}}>
        <TimerBox label={t('you')} time={pTime} active={timerActive==='player'} />
        <TimerBox label={t('bot')} time={bTime} active={timerActive==='bot'} />
      </div>
      {msg && <div style={{color:'#38bdf8', textAlign:'center', minHeight:'20px'}}>{msg}</div>}
      
      <div style={{background:'#1e293b', padding:'10px', borderRadius:'12px', boxShadow:'0 4px 16px rgba(0,0,0,0.4)'}}>
        <Chessboard position={fen} onPieceDrop={onDrop} boardWidth={boardSize}
          customDarkSquareStyle={{backgroundColor:THEMES[boardTheme].dark}}
          customLightSquareStyle={{backgroundColor:THEMES[boardTheme].light}} />
      </div>

      <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap', justifyContent:'center'}}>
        <Btn onClick={()=>setView('profile')} bg="#3b82f6">{t('profile')}</Btn>
        <Btn onClick={toggleLang} bg="#475569">{t('lang')}</Btn>
        <select value={boardTheme} onChange={e=>setBoardTheme(e.target.value)} style={{padding:'0.8rem', background:'#1e293b', color:'#fff', border:'1px solid #475569', borderRadius:'8px', cursor:'pointer'}}>
          <option value="classic">{THEMES.classic.name} {t('themes').classic}</option>
          <option value="wood">{THEMES.wood.name} {t('themes').wood}</option>
          <option value="neon">{THEMES.neon.name} {t('themes').neon}</option>
          <option value="ocean">{THEMES.ocean.name} {t('themes').ocean}</option>
          <option value="sunset">{THEMES.sunset.name} {t('themes').sunset}</option>
          <option value="minimal">{THEMES.minimal.name} {t('themes').minimal}</option>
        </select>
      </div>

      {gameOver && (
        <div style={{background:'#1e293b', padding:'1.2rem', borderRadius:'12px', textAlign:'center', maxWidth:'400px', border:'1px solid #fbbf24', marginTop:'0.5rem'}}>
          <h3 style={{color:'#fbbf24', margin:'0 0 0.5rem 0'}}>{winner==='player'?t('win'):winner==='bot'?t('lose'):t('draw')}</h3>
          <Btn onClick={()=>setView('profile')} bg="#10b981">{t('profile')}</Btn>
        </div>
      )}

      {showGrok && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'1rem'}} onClick={()=>setShowGrok(false)}>
          <div style={{background:'linear-gradient(135deg,#1e293b,#334155)', padding:'1.5rem', borderRadius:'16px', maxWidth:'420px', width:'100%', border:'2px solid #f59e0b'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
              <h3 style={{color:'#fbbf24', margin:0, fontSize:'1.3rem'}}>{t('grokTitle')}</h3>
              <button onClick={()=>setShowGrok(false)} style={{background:'none', border:'none', color:'#94a3b8', fontSize:'1.5rem', cursor:'pointer'}}>✕</button>
            </div>
            <ol style={{color:'#cbd5e1', margin:'0 0 1rem 0', paddingLeft:'1.2rem', lineHeight:'1.6', fontSize:'0.95rem'}}>
              <li style={{marginBottom:'0.5rem'}}>{t('grokStep1')}</li>
              <li style={{marginBottom:'0.5rem'}}>{t('grokStep2')}</li>
              <li>
                {t('grokStep3')}<br/>
                <code style={{background:'#0f172a', padding:'0.4rem 0.6rem', borderRadius:'6px', color:'#60a5fa', wordBreak:'break-all', display:'block', margin:'0.5rem 0'}}>{GROK_CONTRACT}</code>
                <button onClick={copyContract} style={{padding:'0.4rem 0.8rem', background:copied?'#10b981':'#3b82f6', color:'#fff', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'500'}}>{copied ? t('copied') : t('copy')}</button>
              </li>
            </ol>
            <a href={GROK_LINK} target="_blank" rel="noopener noreferrer" style={{display:'block', background:'#f59e0b', color:'#000', padding:'0.8rem', borderRadius:'10px', textAlign:'center', textDecoration:'none', fontWeight:'600', marginBottom:'0.8rem'}}>🔗 four.meme → GROK</a>
            <Btn onClick={()=>setShowGrok(false)} bg="#64748b" style={{width:'100%'}}>{t('close')}</Btn>
          </div>
        </div>
      )}
    </div>
  )
}