import { useState, useEffect, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'

// 🌍 7 ЯЗЫКОВ (полный словарь, БЕЗ УПОМИНАНИЙ КОШЕЛЬКА)
const LANG = {
  ru: { t:'♟️ Chess4Crypto', s:'Web3 шахматы с крипто-ставками', g:'👤 Гостевой вход', c:'👤 Войти', k:'💰 Купить GROK', p:'👤 Профиль', l:'🚪 Выйти', y:'👤 Вы', b:'🤖 Бот', yt:'♟️ Ваш ход!', bt:'🤖 Бот думает (3с)...', w:'🏆 ПОБЕДА!', x:'😔 Поражение', d:'🤝 Ничья', tp:'⏰ Бот выиграл', tb:'⏰ Вы выиграли', cn:'✅ Вход выполнен!', cl:'Закрыть', cp:'📋 Копировать', cd:'✅ Скопировано!', gt:'💰 Как купить GROK', g1:'1. Перейди по ссылке и подключи крипто-кошелёк в сети BNB (нужен BNB для комиссии).', g2:'2. Купи монету GROK на любую сумму.', g3:'3. Добавь адрес в кошелёк для отображения:', ln:'🇷🇺 RU', th:'🎨 Тема доски', tm:{c:'🏛️ Классика',w:'🪵 Дерево',n:'💜 Неон',o:'🌊 Океан',s:'🌅 Закат',m:'⚪ Минимал'} },
  en: { t:'♟️ Chess4Crypto', s:'Web3 Chess with Crypto Stakes', g:'👤 Guest Mode', c:'👤 Sign In', k:'💰 Buy GROK', p:'👤 Profile', l:'🚪 Logout', y:'👤 You', b:'🤖 Bot', yt:'♟️ Your turn!', bt:'🤖 Bot thinks (3s)...', w:'🏆 YOU WIN!', x:'😔 You lost', d:'🤝 Draw', tp:'⏰ Bot wins', tb:'⏰ You win', cn:'✅ Signed in!', cl:'Close', cp:'📋 Copy', cd:'✅ Copied!', gt:'💰 How to Buy GROK', g1:'1. Follow the link and connect your BNB Chain wallet (need BNB for gas).', g2:'2. Buy GROK token for any amount.', g3:'3. Add contract to wallet to display:', ln:'🇬🇧 EN', th:'🎨 Board Theme', tm:{c:'🏛️ Classic',w:'🪵 Wood',n:'💜 Neon',o:'🌊 Ocean',s:'🌅 Sunset',m:'⚪ Minimal'} },
  de: { t:'♟️ Chess4Crypto', s:'Web3-Schach mit Krypto', g:'👤 Gast', c:'👤 Anmelden', k:'💰 GROK', p:'👤 Profil', l:'🚪 Exit', y:'👤 Du', b:'🤖 Bot', yt:'♟️ Dein Zug!', bt:'🤖 Bot denkt (3s)...', w:'🏆 GEWINN!', x:'😔 Verloren', d:'🤝 Remis', tp:'⏰ Bot gewinnt', tb:'⏰ Du gewinnst', cn:'✅ Angemeldet', cl:'Schließen', cp:'📋 Kopieren', cd:'✅ Kopiert', gt:'💰 GROK kaufen', g1:'1. Link öffnen und BNB Chain Wallet verbinden (BNB nötig).', g2:'2. GROK-Token kaufen.', g3:'3. Adresse im Wallet hinzufügen:', ln:'🇩🇪 DE', th:'🎨 Design', tm:{c:'🏛️ Klassisch',w:'🪵 Holz',n:'💜 Neon',o:'🌊 Ozean',s:'🌅 Sonnenuntergang',m:'⚪ Minimal'} },
  fr: { t:'♟️ Chess4Crypto', s:'Échecs Web3 crypto', g:'👤 Invité', c:'👤 Connexion', k:'💰 GROK', p:'👤 Profil', l:'🚪 Quitter', y:'👤 Vous', b:'🤖 Bot', yt:'♟️ À vous!', bt:'🤖 Bot pense (3s)...', w:'🏆 GAGNÉ!', x:'😔 Perdu', d:'🤝 Nulle', tp:'⏰ Bot gagne', tb:'⏰ Vous gagnez', cn:'✅ Connecté', cl:'Fermer', cp:'📋 Copier', cd:'✅ Copié', gt:'💰 Acheter GROK', g1:'1. Suivre le lien et connecter wallet BNB Chain (BNB requis).', g2:'2. Acheter GROK.', g3:'3. Ajouter l\'adresse au wallet:', ln:'🇫🇷 FR', th:'🎨 Thème', tm:{c:'🏛️ Classique',w:'🪵 Bois',n:'💜 Néon',o:'🌊 Océan',s:'🌅 Coucher',m:'⚪ Minimal'} },
  es: { t:'♟️ Chess4Crypto', s:'Ajedrez Web3 crypto', g:'👤 Invitado', c:'👤 Entrar', k:'💰 GROK', p:'👤 Perfil', l:'🚪 Salir', y:'👤 Tú', b:'🤖 Bot', yt:'♟️ ¡Tu turno!', bt:'🤖 Bot piensa (3s)...', w:'🏆 ¡GANASTE!', x:'😔 Perdiste', d:'🤝 Empate', tp:'⏰ Bot gana', tb:'⏰ Ganas tú', cn:'✅ Conectado', cl:'Cerrar', cp:'📋 Copiar', cd:'✅ Copiado', gt:'💰 Comprar GROK', g1:'1. Ir al enlace y conectar wallet BNB Chain (necesitas BNB).', g2:'2. Comprar GROK.', g3:'3. Añadir dirección al wallet:', ln:'🇪🇸 ES', th:'🎨 Tema', tm:{c:'🏛️ Clásico',w:'🪵 Madera',n:'💜 Neón',o:'🌊 Océano',s:'🌅 Atardecer',m:'⚪ Minimal'} },
  zh: { t:'♟️ Chess4Crypto', s:'Web3国际象棋', g:'👤 访客', c:'👤 登录', k:'💰 GROK', p:'👤 资料', l:'🚪 退出', y:'👤 你', b:'🤖 机器人', yt:'♟️ 轮到你!', bt:'🤖 思考中 (3s)...', w:'🏆 你赢了!', x:'😔 你输了', d:'🤝 平局', tp:'⏰ 机器人赢', tb:'⏰ 你赢了', cn:'✅ 已登录', cl:'关闭', cp:'📋 复制', cd:'✅ 已复制', gt:'💰 购买GROK', g1:'1. 点击链接连接BNB链钱包（需BNB支付手续费）。', g2:'2. 购买GROK代币。', g3:'3. 将地址添加到钱包:', ln:'🇨🇳 中文', th:'🎨 主题', tm:{c:'🏛️ 经典',w:'🪵 木质',n:'💜 霓虹',o:'🌊 海洋',s:'🌅 日落',m:'⚪ 简约'} },
  hi: { t:'♟️ Chess4Crypto', s:'Web3 शतरंज', g:'👤 अतिथि', c:'👤 लॉगिन', k:'💰 GROK', p:'👤 प्रोफ़ाइल', l:'🚪 बाहर', y:'👤 आप', b:'🤖 बॉट', yt:'♟️ आपकी बारी!', bt:'🤖 सोच रहा (3s)...', w:'🏆 आप जीते!', x:'😔 आप हारे', d:'🤝 ड्रॉ', tp:'⏰ बॉट जीता', tb:'⏰ आप जीते', cn:'✅ लॉगिन', cl:'बंद', cp:'📋 कॉपी', cd:'✅ कॉपी', gt:'💰 GROK खरीदें', g1:'1. लिंक पर जाएं और BNB चेन वॉलेट कनेक्ट करें (BNB चाहिए)।', g2:'2. GROK खरीदें।', g3:'3. वॉलेट में एड्रेस जोड़ें:', ln:'🇮🇳 हिंदी', th:'🎨 थीम', tm:{c:'🏛️ क्लासिक',w:'🪵 लकड़ी',n:'💜 नियॉन',o:'🌊 महासागर',s:'🌅 सूर्यास्त',m:'⚪ मिनिमल'} }
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

const fmtTime = function(s) {
  var m = Math.floor(s / 60)
  var sec = s % 60
  return m + ':' + (sec < 10 ? '0' : '') + sec
}
const GROK_LINK = 'https://four.meme/token/0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444?code=AHGX96R5GHK9'
const GROK_CONTRACT = '0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444'

export default function App() {
  // 🔁 Инициализация хуков
  var langState = useState('ru')
  var lang = langState[0], setLang = langState[1]
  
  var viewState = useState('menu')
  var view = viewState[0], setView = viewState[1]
  
  var msgState = useState('')
  var msg = msgState[0], setMsg = msgState[1]
  
  var grokState = useState(false)
  var showGrok = grokState[0], setShowGrok = grokState[1]
  
  var copiedState = useState(false)
  var copied = copiedState[0], setCopied = copiedState[1]
  
  var themeState = useState('c')
  var boardTheme = themeState[0], setBoardTheme = themeState[1]
  
  var sizeState = useState(360)
  var boardSize = sizeState[0], setBoardSize = sizeState[1]

  // ♟️ Шахматы
  var gameRef = useRef(null)
  if (gameRef.current === null) { gameRef.current = new Chess() }
  
  var fenState = useState(gameRef.current.fen())
  var fen = fenState[0], setFen = fenState[1]
  
  var histState = useState([gameRef.current.fen()])
  var history = histState[0], setHistory = histState[1]
  
  var miState = useState(0), setMoveIdx = useState(0)[1]
  var moveIdx = miState[0]
  
  var ptState = useState(true), setIsPlayerTurn = useState(true)[1]
  var isPlayerTurn = ptState[0]
  
  var goState = useState(false), setGameOver = useState(false)[1]
  var gameOver = goState[0]
  
  var winState = useState(null), setWinner = useState(null)[1]
  var winner = winState[0]
  
  var pTState = useState(900), setPlayerTime = useState(900)[1]
  var playerTime = pTState[0]
  
  var bTState = useState(900), setBotTime = useState(900)[1]
  var botTime = bTState[0]
  
  var taState = useState(null), setTimerActive = useState(null)[1]
  var timerActive = taState[0]
  
  var timerRef = useRef(null)

  // 🌐 Перевод
  function t(key) {
    var dict = LANG[lang]
    if (!dict) dict = LANG.ru
    return dict[key] || key
  }

  // 📏 Ресайз
  useEffect(function() {
    function onResize() {
      if (typeof window !== 'undefined') {
        setBoardSize(Math.min(window.innerWidth * 0.9, 400))
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', onResize)
      onResize()
    }
    return function() {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', onResize)
      }
    }
  }, [])

  // ⏱️ ТАЙМЕР
  useEffect(function() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (!timerActive || gameOver) return
    timerRef.current = setInterval(function() {
      if (timerActive === 'player') {
        setPlayerTime(function(prev) {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            setGameOver(true)
            setWinner('bot')
            setMsg(t('tp'))
            return 0
          }
          return prev - 1
        })
      } else {
        setBotTime(function(prev) {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            setGameOver(true)
            setWinner('player')
            setMsg(t('tb'))
            return 0
          }
          return prev - 1
        })
      }
    }, 1000)
    return function() {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timerActive, gameOver])

  // 🔘 КНОПКИ (БЕЗ КОШЕЛЬКА!)
  function handleGuest() {
    setMsg(t('g'))
    setGameOver(false)
    setWinner(null)
    setPlayerTime(900)
    setBotTime(900)
    startGame()
  }

  // ✅ Кнопка "Войти": просто переходит в профиль (НИКАКИХ ВЫЗОВОВ!)
  function handleSignIn() {
    setMsg(t('cn'))
    setView('profile')
  }

  function handleGrok() { setShowGrok(true) }
  
  function toggleLang() {
    var langs = ['ru','en','de','fr','es','zh','hi']
    var idx = langs.indexOf(lang)
    var next = langs[(idx + 1) % langs.length]
    setLang(next)
  }
  
  function copyContract() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(GROK_CONTRACT)
      setCopied(true)
      setTimeout(function() { setCopied(false) }, 2000)
    }
  }

  function startGame() {
    if (gameRef.current) gameRef.current.reset()
    var f = gameRef.current ? gameRef.current.fen() : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    setFen(f)
    setHistory([f])
    setMoveIdx(0)
    setIsPlayerTurn(true)
    setGameOver(false)
    setWinner(null)
    setPlayerTime(900)
    setBotTime(900)
    setTimerActive('player')
    setView('game')
  }

  var makeBotMove = useCallback(function() {
    if (gameOver || !gameRef.current || gameRef.current.isGameOver()) return
    var moves = gameRef.current.moves()
    if (!moves || moves.length === 0) return
    var mv = moves[Math.floor(Math.random() * moves.length)]
    gameRef.current.move(mv)
    var nf = gameRef.current.fen()
    setFen(nf)
    setHistory(function(h) { return h.concat([nf]) })
    setMoveIdx(function(i) { return i + 1 })
    setIsPlayerTurn(true)
    setTimerActive('player')
    if (gameRef.current.isCheckmate()) { setGameOver(true); setWinner('bot'); setMsg(t('x')) }
    else if (gameRef.current.isDraw()) { setGameOver(true); setWinner(null); setMsg(t('d')) }
    else setMsg(t('yt'))
  }, [gameOver, t])

  var onDrop = useCallback(function(src, tgt) {
    if (!isPlayerTurn || gameOver || !gameRef.current) return false
    try {
      var res = gameRef.current.move({ from: src, to: tgt, promotion: 'q' })
      if (!res) return false
      var nf = gameRef.current.fen()
      setFen(nf)
      setHistory(function(h) { return h.concat([nf]) })
      setMoveIdx(function(i) { return i + 1 })
      setIsPlayerTurn(false)
      setTimerActive('bot')
      if (gameRef.current.isCheckmate()) { setGameOver(true); setWinner('player'); setMsg(t('w')) }
      else if (gameRef.current.isDraw()) { setGameOver(true); setWinner(null); setMsg(t('d')) }
      else { setMsg(t('bt')); setTimeout(makeBotMove, 3000) }
      return true
    } catch (err) { return false }
  }, [isPlayerTurn, gameOver, makeBotMove, t])

  // 🎨 UI
  function Btn(props) {
    var bg = props.bg || '#3b82f6'
    var opacity = props.disabled ? 0.5 : 1
    var cursor = props.disabled ? 'not-allowed' : 'pointer'
    return React.createElement('button', {
      onClick: props.o,
      disabled: props.dis,
      style: {
        padding: '0.8rem 1.2rem',
        background: bg,
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        cursor: cursor,
        fontSize: '1rem',
        fontWeight: '600',
        opacity: opacity
      }
    }, props.c)
  }
  
  function TimerBox(props) {
    var active = props.a === true
    return React.createElement('div', {
      style: {
        background: active ? '#059669' : '#1e293b',
        padding: '10px 20px',
        borderRadius: '10px',
        color: '#fff',
        textAlign: 'center',
        border: active ? '2px solid #34d399' : '1px solid #334155',
        width: '45%'
      }
    },
      React.createElement('div', { style: { fontSize: '0.85rem', opacity: 0.8 } }, props.l),
      React.createElement('div', { style: { fontSize: '1.6rem', fontWeight: 'bold', fontFamily: 'monospace' } }, fmtTime(props.t))
    )
  }

  // ============================================================================
  // 🖥️ МЕНЮ (БЕЗ КНОПКИ GROK)
  // ============================================================================
  if (view === 'menu') {
    return React.createElement('div', {
      style: { minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a,#1e293b)', color: '#f1f5f9', fontFamily: 'system-ui', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', gap: '1rem' }
    },
      React.createElement('h1', { style: { fontSize: '2.5rem', color: '#fbbf24', margin: 0 } }, t('t')),
      React.createElement('p', { style: { color: '#94a3b8' } }, t('s')),
      React.createElement(Btn, { c: t('g'), o: handleGuest, bg: 'linear-gradient(135deg,#3b82f6,#2563eb)' }),
      React.createElement(Btn, { c: t('c'), o: handleSignIn, bg: 'linear-gradient(135deg,#f59e0b,#d97706)' }),
      React.createElement(Btn, { c: t('ln'), o: toggleLang, bg: '#475569' }),
      msg ? React.createElement('div', { style: { padding: '0.6rem', background: 'rgba(59,130,246,0.2)', borderRadius: '8px', color: '#60a5fa' } }, msg) : null
    )
  }

  // ============================================================================
  // 🖥️ ПРОФИЛЬ (КНОПКА GROK ЗДЕСЬ)
  // ============================================================================
  if (view === 'profile') {
    return React.createElement('div', {
      style: { minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: 'system-ui', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem', gap: '1rem' }
    },
      React.createElement('h2', { style: { color: '#fbbf24' } }, t('p')),
      React.createElement('div', { style: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' } },
        React.createElement(Btn, { c: t('l'), o: function() { setView('menu') }, bg: '#ef4444' }),
        React.createElement(Btn, { c: t('k'), o: handleGrok, bg: '#10b981' }),
        React.createElement(Btn, { c: '🎮 ' + t('g'), o: startGame, bg: '#8b5cf6' }),
        React.createElement(Btn, { c: t('ln'), o: toggleLang, bg: '#475569' })
      )
    )
  }

  // ============================================================================
  // 🖥️ ИГРА
  // ============================================================================
  return React.createElement('div', {
    style: { minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: 'system-ui', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '1rem', gap: '1rem', padding: '0 1rem' }
  },
    // Таймеры
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-around', width: '100%', maxWidth: '420px', marginBottom: '0.5rem' } },
      React.createElement(TimerBox, { l: t('y'), t: playerTime, a: timerActive === 'player' }),
      React.createElement(TimerBox, { l: t('b'), t: botTime, a: timerActive === 'bot' })
    ),
    // Сообщение
    msg ? React.createElement('div', { style: { color: '#38bdf8', textAlign: 'center' } }, msg) : null,
    // Доска
    React.createElement('div', { style: { background: '#1e293b', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' } },
      React.createElement(Chessboard, {
        position: fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        onPieceDrop: onDrop,
        boardWidth: boardSize,
        customDarkSquareStyle: { backgroundColor: THEMES[boardTheme].dark },
        customLightSquareStyle: { backgroundColor: THEMES[boardTheme].light }
      })
    ),
    // Кнопки
    React.createElement('div', { style: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' } },
      React.createElement(Btn, { c: t('p'), o: function() { setView('profile') }, bg: '#3b82f6' }),
      React.createElement(Btn, { c: t('ln'), o: toggleLang, bg: '#475569' }),
      React.createElement('select', {
        value: boardTheme,
        onChange: function(e) { setBoardTheme(e.target.value) },
        style: { padding: '0.8rem', background: '#1e293b', color: '#fff', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer' }
      },
        React.createElement('option', { value: 'c' }, THEMES.c.name),
        React.createElement('option', { value: 'w' }, THEMES.w.name),
        React.createElement('option', { value: 'n' }, THEMES.n.name),
        React.createElement('option', { value: 'o' }, THEMES.o.name),
        React.createElement('option', { value: 's' }, THEMES.s.name),
        React.createElement('option', { value: 'm' }, THEMES.m.name)
      )
    ),
    // Конец игры
    gameOver ? React.createElement('div', { style: { background: '#1e293b', padding: '1.2rem', borderRadius: '12px', textAlign: 'center', maxWidth: '400px', border: '1px solid #fbbf24' } },
      React.createElement('h3', { style: { color: '#fbbf24' } }, winner === 'player' ? t('w') : winner === 'bot' ? t('x') : t('d')),
      React.createElement(Btn, { c: t('p'), o: function() { setView('profile') }, bg: '#10b981' })
    ) : null,
    // Модальное окно GROK
    showGrok ? React.createElement('div', {
      style: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' },
      onClick: function() { setShowGrok(false) }
    },
      React.createElement('div', {
        style: { background: 'linear-gradient(135deg,#1e293b,#334155)', padding: '1.5rem', borderRadius: '16px', maxWidth: '420px', width: '100%', border: '2px solid #f59e0b' },
        onClick: function(e) { e.stopPropagation() }
      },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' } },
          React.createElement('h3', { style: { color: '#fbbf24', margin: 0 } }, t('gt')),
          React.createElement('button', { onClick: function() { setShowGrok(false) }, style: { background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' } }, '✕')
        ),
        React.createElement('ol', { style: { color: '#cbd5e1', margin: '0 0 1rem 0', paddingLeft: '1.2rem', lineHeight: '1.6', fontSize: '0.95rem' } },
          React.createElement('li', { style: { marginBottom: '0.5rem' } }, t('g1')),
          React.createElement('li', { style: { marginBottom: '0.5rem' } }, t('g2')),
          React.createElement('li', null,
            t('g3'),
            React.createElement('br'),
            React.createElement('code', { style: { background: '#0f172a', padding: '0.4rem 0.6rem', borderRadius: '6px', color: '#60a5fa', wordBreak: 'break-all', display: 'block', margin: '0.5rem 0' } }, GROK_CONTRACT),
            React.createElement('button', {
              onClick: copyContract,
              style: { padding: '0.4rem 0.8rem', background: copied ? '#10b981' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }
            }, copied ? t('cd') : t('cp'))
          )
        ),
        React.createElement('a', {
          href: GROK_LINK,
          target: '_blank',
          rel: 'noopener',
          style: { display: 'block', background: '#f59e0b', color: '#000', padding: '0.8rem', borderRadius: '10px', textAlign: 'center', textDecoration: 'none', fontWeight: '600', marginBottom: '0.8rem' }
        }, '🔗 four.meme → GROK'),
        React.createElement(Btn, { c: t('cl'), o: function() { setShowGrok(false) }, bg: '#64748b', st: { width: '100%' } })
      )
    ) : null
  )
}