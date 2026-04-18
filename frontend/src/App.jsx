import { useState, useEffect, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'

// 🛡️ Защита от ошибок MetaMask
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', e => {
    if (e.reason?.message?.includes('MetaMask')) { e.preventDefault(); console.warn('🛡️ Wallet handled') }
  })
}

// 🌍 7 языков
const LANG = {
  ru: { t:'♟️ Chess4Crypto', s:'Web3 шахматы', g:'👤 Гостевой', c:'🦊 Кошелёк', k:'💰 GROK', p:'👤 Профиль', l:'🚪 Выход', y:'👤 Вы', b:'🤖 Бот', yt:'♟️ Ваш ход!', bt:'🤖 Думает...', w:'🏆 ПОБЕДА!', x:'😔 Поражение', d:'🤝 Ничья', tp:'⏰ Бот выиграл', tb:'⏰ Вы выиграли', cn:'✅ Подключён', nw:'⚠️ Нет MetaMask', gm:'👤 Гостевой', cl:'Закрыть', cp:'📋 Копировать', cd:'✅ Скопировано', gt:'💰 Купить GROK', g1:'1. Перейди по ссылке и подключи кошелёк в сети BNB (нужен BNB для комиссии).', g2:'2. Купи монету GROK на любую сумму.', g3:'3. Добавь адрес в кошелёк для отображения:', ln:'🇷🇺 RU', th:'🎨 Тема', tm:{c:'🏛️ Классика',w:'🪵 Дерево',n:'💜 Неон',o:'🌊 Океан',s:'🌅 Закат',m:'⚪ Минимал'} },
  en: { t:'♟️ Chess4Crypto', s:'Web3 Chess', g:'👤 Guest', c:'🦊 Wallet', k:'💰 GROK', p:'👤 Profile', l:'🚪 Logout', y:'👤 You', b:'🤖 Bot', yt:'♟️ Your turn!', bt:'🤖 Thinking...', w:'🏆 YOU WIN!', x:'😔 You lost', d:'🤝 Draw', tp:'⏰ Bot wins', tb:'⏰ You win', cn:'✅ Connected', nw:'⚠️ No MetaMask', gm:'👤 Guest', cl:'Close', cp:'📋 Copy', cd:'✅ Copied', gt:'💰 Buy GROK', g1:'1. Go to link and connect wallet on BNB Chain (need BNB for gas).', g2:'2. Buy GROK token for any amount.', g3:'3. Add contract to wallet to display:', ln:'🇬🇧 EN', th:'🎨 Theme', tm:{c:'🏛️ Classic',w:'🪵 Wood',n:'💜 Neon',o:'🌊 Ocean',s:'🌅 Sunset',m:'⚪ Minimal'} },
  de: { t:'♟️ Chess4Crypto', s:'Web3-Schach', g:'👤 Gast', c:'🦊 Wallet', k:'💰 GROK', p:'👤 Profil', l:'🚪 Exit', y:'👤 Du', b:'🤖 Bot', yt:'♟️ Dein Zug!', bt:'🤖 Denkt...', w:'🏆 GEWINN!', x:'😔 Verloren', d:'🤝 Remis', tp:'⏰ Bot gewinnt', tb:'⏰ Du gewinnst', cn:'✅ Verbunden', nw:'⚠️ Kein MetaMask', gm:'👤 Gast', cl:'Schließen', cp:'📋 Kopieren', cd:'✅ Kopiert', gt:'💰 GROK kaufen', g1:'1. Link öffnen und Wallet auf BNB Chain verbinden (BNB für Gebühren).', g2:'2. GROK-Token in beliebiger Menge kaufen.', g3:'3. Adresse im Wallet hinzufügen:', ln:'🇩🇪 DE', th:'🎨 Design', tm:{c:'🏛️ Klassisch',w:'🪵 Holz',n:'💜 Neon',o:'🌊 Ozean',s:'🌅 Sonnenuntergang',m:'⚪ Minimal'} },
  fr: { t:'♟️ Chess4Crypto', s:'Échecs Web3', g:'👤 Invité', c:'🦊 Wallet', k:'💰 GROK', p:'👤 Profil', l:'🚪 Quitter', y:'👤 Vous', b:'🤖 Bot', yt:'♟️ À vous!', bt:'🤖 Réfléchit...', w:'🏆 GAGNÉ!', x:'😔 Perdu', d:'🤝 Nulle', tp:'⏰ Bot gagne', tb:'⏰ Vous gagnez', cn:'✅ Connecté', nw:'⚠️ Pas de MetaMask', gm:'👤 Invité', cl:'Fermer', cp:'📋 Copier', cd:'✅ Copié', gt:'💰 Acheter GROK', g1:'1. Aller sur le lien et connecter wallet sur BNB Chain (BNB requis).', g2:'2. Acheter GROK pour n\'importe quel montant.', g3:'3. Ajouter l\'adresse au wallet:', ln:'🇫🇷 FR', th:'🎨 Thème', tm:{c:'🏛️ Classique',w:'🪵 Bois',n:'💜 Néon',o:'🌊 Océan',s:'🌅 Coucher',m:'⚪ Minimal'} },
  es: { t:'♟️ Chess4Crypto', s:'Ajedrez Web3', g:'👤 Invitado', c:'🦊 Wallet', k:'💰 GROK', p:'👤 Perfil', l:'🚪 Salir', y:'👤 Tú', b:'🤖 Bot', yt:'♟️ ¡Tu turno!', bt:'🤖 Piensa...', w:'🏆 ¡GANASTE!', x:'😔 Perdiste', d:'🤝 Empate', tp:'⏰ Bot gana', tb:'⏰ Ganas tú', cn:'✅ Conectado', nw:'⚠️ Sin MetaMask', gm:'👤 Invitado', cl:'Cerrar', cp:'📋 Copiar', cd:'✅ Copiado', gt:'💰 Comprar GROK', g1:'1. Ve al enlace y conecta wallet en BNB Chain (necesitas BNB).', g2:'2. Compra GROK por cualquier cantidad.', g3:'3. Añade la dirección al wallet:', ln:'🇪🇸 ES', th:'🎨 Tema', tm:{c:'🏛️ Clásico',w:'🪵 Madera',n:'💜 Neón',o:'🌊 Océano',s:'🌅 Atardecer',m:'⚪ Minimal'} },
  zh: { t:'♟️ Chess4Crypto', s:'Web3国际象棋', g:'👤 访客', c:'🦊 钱包', k:'💰 GROK', p:'👤 资料', l:'🚪 退出', y:'👤 你', b:'🤖 机器人', yt:'♟️ 轮到你!', bt:'🤖 思考中...', w:'🏆 你赢了!', x:'😔 你输了', d:'🤝 平局', tp:'⏰ 机器人赢', tb:'⏰ 你赢了', cn:'✅ 已连接', nw:'⚠️ 无MetaMask', gm:'👤 访客', cl:'关闭', cp:'📋 复制', cd:'✅ 已复制', gt:'💰 购买GROK', g1:'1. 点击链接并在BNB链上连接钱包（需要BNB支付手续费）。', g2:'2. 购买任意数量的GROK代币。', g3:'3. 将地址添加到钱包以显示:', ln:'🇨🇳 中文', th:'🎨 主题', tm:{c:'🏛️ 经典',w:'🪵 木质',n:'💜 霓虹',o:'🌊 海洋',s:'🌅 日落',m:'⚪ 简约'} },
  hi: { t:'♟️ Chess4Crypto', s:'Web3 शतरंज', g:'👤 अतिथि', c:'🦊 वॉलेट', k:'💰 GROK', p:'👤 प्रोफ़ाइल', l:'🚪 बाहर', y:'👤 आप', b:'🤖 बॉट', yt:'♟️ आपकी बारी!', bt:'🤖 सोच रहा...', w:'🏆 आप जीते!', x:'😔 आप हारे', d:'🤝 ड्रॉ', tp:'⏰ बॉट जीता', tb:'⏰ आप जीते', cn:'✅ कनेक्ट', nw:'⚠️ MetaMask नहीं', gm:'👤 अतिथि', cl:'बंद', cp:'📋 कॉपी', cd:'✅ कॉपी', gt:'💰 GROK खरीदें', g1:'1. लिंक पर जाएं और BNB Chain पर वॉलेट कनेक्ट करें (गैस के लिए BNB चाहिए)।', g2:'2. किसी भी राशि के लिए GROK खरीदें।', g3:'3. वॉलेट में एड्रेस जोड़ें:', ln:'🇮🇳 हिंदी', th:'🎨 थीम', tm:{c:'🏛️ क्लासिक',w:'🪵 लकड़ी',n:'💜 नियॉन',o:'🌊 महासागर',s:'🌅 सूर्यास्त',m:'⚪ मिनिमल'} }
}

// 🎨 6 тем
const TM = { c:{l:'#eeeed2',d:'#769656'}, w:{l:'#e8c49a',d:'#8b6f47'}, n:{l:'#1a1a2e',d:'#16213e'}, o:{l:'#a8d8ea',d:'#2a6f97'}, s:{l:'#ffecd2',d:'#fcb69f'}, m:{l:'#f0f0f0',d:'#606060'} }
const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`
const GL = 'https://four.meme/token/0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444?code=AHGX96R5GHK9'
const GC = '0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444'

export default function App() {
  const [lang, setLang] = useState('ru')
  const t = useCallback(k => LANG[lang][k] || k, [lang])
  const [view, setView] = useState('menu')
  const [msg, setMsg] = useState('')
  const [conn, setConn] = useState(false)
  const [grok, setGrok] = useState(false)
  const [cop, setCop] = useState(false)
  const [th, setTh] = useState('c')
  const [bs, setBs] = useState(360)
  const game = useRef(new Chess())
  const [fen, setFen] = useState(game.current.fen())
  const [hist, setHist] = useState([game.current.fen()])
  const [mi, setMi] = useState(0)
  const [pt, setPt] = useState(true)
  const [go, setGo] = useState(false)
  const [win, setWin] = useState(null)
  const [pT, setPT] = useState(900)
  const [bT, setBT] = useState(900)
  const [ta, setTa] = useState(null)
  const tr = useRef(null)

  useEffect(() => { const r=()=>setBs(Math.min(window.innerWidth*0.9,400)); window.addEventListener('resize',r); return ()=>window.removeEventListener('resize',r) }, [])

  // ⏱️ Таймер
  useEffect(() => {
    if (tr.current) clearInterval(tr.current)
    if (!ta || go) return
    tr.current = setInterval(() => {
      if (ta === 'p') setPT(v => { if (v<=1) { clearInterval(tr.current); setGo(true); setWin('b'); setMsg(t('tp')); return 0 } return v-1 })
      else setBT(v => { if (v<=1) { clearInterval(tr.current); setGo(true); setWin('p'); setMsg(t('tb')); return 0 } return v-1 })
    }, 1000)
    return () => clearInterval(tr.current)
  }, [ta, go, t])

  const guest = () => { setMsg(t('gm')); setGo(false); setWin(null); setPT(900); setBT(900); start() }
  const connect = () => { if (conn) return; setConn(true); if (window.ethereum) { window.ethereum.request({method:'eth_requestAccounts'}).then(()=>{setMsg(t('cn'));setView('profile')}).catch(()=>setMsg(t('nw'))).finally(()=>setConn(false)) } else { setMsg(t('nw')); setConn(false) } }
  const buyGrok = () => setGrok(true)
  const langNext = () => setLang(l => ({ru:'en',en:'de',de:'fr',fr:'es',es:'zh',zh:'hi',hi:'ru'})[l])
  const copyC = () => { navigator.clipboard.writeText(GC); setCop(true); setTimeout(()=>setCop(false),2000) }

  const start = () => { game.current.reset(); setFen(game.current.fen()); setHist([game.current.fen()]); setMi(0); setPt(true); setGo(false); setWin(null); setPT(900); setBT(900); setTa('p'); setView('game') }

  const botMove = useCallback(() => { if (go || game.current.isGameOver()) return; const m = game.current.moves(); if (!m.length) return; const mv = m[Math.floor(Math.random()*m.length)]; game.current.move(mv); setFen(game.current.fen()); setHist(h=>[...h,game.current.fen()]); setMi(i=>i+1); setPt(true); setTa('p'); if (game.current.isCheckmate()) { setGo(true); setWin('b'); setMsg(t('x')) } else if (game.current.isDraw()) { setGo(true); setWin(null); setMsg(t('d')) } else setMsg(t('yt')) }, [go, t])

  const onDrop = useCallback((s,e) => { if (!pt || go) return false; try { const r = game.current.move({from:s,to:e,promotion:'q'}); if (!r) return false; setFen(game.current.fen()); setHist(h=>[...h,game.current.fen()]); setMi(i=>i+1); setPt(false); setTa('b'); if (game.current.isCheckmate()) { setGo(true); setWin('p'); setMsg(t('w')) } else if (game.current.isDraw()) { setGo(true); setWin(null); setMsg(t('d')) } else { setMsg(t('bt')); setTimeout(botMove,600) } return true } catch { return false } }, [pt, go, botMove, t])

  const Btn = ({c,o,bg,dis,st}) => <button onClick={o} disabled={dis} style={{padding:'0.8rem 1.2rem',background:bg||'#3b82f6',color:'#fff',border:'none',borderRadius:'10px',cursor:dis?'not-allowed':'pointer',fontSize:'1rem',fontWeight:'600',opacity:dis?0.5:1,...st}}>{c}</button>
  const Timer = ({l,t,a}) => <div style={{background:a?'#059669':'#1e293b',padding:'10px 20px',borderRadius:'10px',color:'#fff',textAlign:'center',border:a?'2px solid #34d399':'1px solid #334155',width:'45%'}}><div style={{fontSize:'0.85rem',opacity:0.8}}>{l}</div><div style={{fontSize:'1.6rem',fontWeight:'bold',fontFamily:'monospace'}}>{fmt(t)}</div></div>

  if (view === 'menu') return <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0f172a,#1e293b)',color:'#f1f5f9',fontFamily:'system-ui',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'2rem',textAlign:'center',gap:'1rem'}}><h1 style={{fontSize:'2.5rem',color:'#fbbf24',margin:0}}>{t('t')}</h1><p style={{color:'#94a3b8'}}>{t('s')}</p><Btn c={t('g')} o={guest} bg="linear-gradient(135deg,#3b82f6,#2563eb)"/><Btn c={conn?'⏳...':t('c')} o={connect} bg="linear-gradient(135deg,#f59e0b,#d97706)" dis={conn}/><Btn c={t('k')} o={buyGrok} bg="linear-gradient(135deg,#10b981,#059669)"/><Btn c={t('ln')} o={langNext} bg="#475569"/>{msg && <div style={{padding:'0.6rem',background:'rgba(59,130,246,0.2)',borderRadius:'8px',color:'#60a5fa'}}>{msg}</div>}</div>

  if (view === 'profile') return <div style={{minHeight:'100vh',background:'#0f172a',color:'#f1f5f9',fontFamily:'system-ui',display:'flex',flexDirection:'column',alignItems:'center',padding:'1.5rem',gap:'1rem'}}><h2 style={{color:'#fbbf24'}}>{t('p')}</h2><div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}><Btn c={t('l')} o={()=>setView('menu')} bg="#ef4444"/><Btn c={t('k')} o={buyGrok} bg="#10b981"/><Btn c="🎮 "+t('g') o={start} bg="#8b5cf6"/><Btn c={t('ln')} o={langNext} bg="#475569"/></div><div style={{background:'#1e293b',padding:'1rem',borderRadius:'10px',maxWidth:'400px',textAlign:'center',color:'#94a3b8',fontSize:'0.9rem'}}>{t('rules')||'📜 Правила: 1. Внесите ставку. 2. Присоединяйтесь с равной суммой. 3. Победитель забирает ×2. 4. Ничья → фонд.'}</div></div>

  return <div style={{minHeight:'100vh',background:'#0f172a',color:'#f1f5f9',fontFamily:'system-ui',display:'flex',flexDirection:'column',alignItems:'center',paddingTop:'1rem',gap:'1rem',padding:'0 1rem'}}><div style={{display:'flex',justifyContent:'space-around',width:'100%',maxWidth:'420px',marginBottom:'0.5rem'}}><Timer l={t('y')} t={pT} a={ta==='p'}/><Timer l={t('b')} t={bT} a={ta==='b'}/></div>{msg && <div style={{color:'#38bdf8',textAlign:'center'}}>{msg}</div>}<div style={{background:'#1e293b',padding:'10px',borderRadius:'12px',boxShadow:'0 4px 16px rgba(0,0,0,0.4)'}}><Chessboard position={fen} onPieceDrop={onDrop} boardWidth={bs} customDarkSquareStyle={{backgroundColor:TM[th].d}} customLightSquareStyle={{backgroundColor:TM[th].l}}/></div><div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',justifyContent:'center'}}><Btn c={t('p')} o={()=>setView('profile')} bg="#3b82f6"/><Btn c={t('ln')} o={langNext} bg="#475569"/><select value={th} onChange={e=>setTh(e.target.value)} style={{padding:'0.8rem',background:'#1e293b',color:'#fff',border:'1px solid #475569',borderRadius:'8px'}}><option value="c">🏛️ {t('tm').c}</option><option value="w">🪵 {t('tm').w}</option><option value="n">💜 {t('tm').n}</option><option value="o">🌊 {t('tm').o}</option><option value="s">🌅 {t('tm').s}</option><option value="m">⚪ {t('tm').m}</option></select></div>{go && <div style={{background:'#1e293b',padding:'1.2rem',borderRadius:'12px',textAlign:'center',maxWidth:'400px',border:'1px solid #fbbf24'}}><h3 style={{color:'#fbbf24'}}>{win==='p'?t('w'):win==='b'?t('x'):t('d')}</h3><Btn c={t('p')} o={()=>setView('profile')} bg="#10b981"/></div>}{grok && <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.9)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,padding:'1rem'}} onClick={()=>setGrok(false)}><div style={{background:'linear-gradient(135deg,#1e293b,#334155)',padding:'1.5rem',borderRadius:'16px',maxWidth:'420px',width:'100%',border:'2px solid #f59e0b'}} onClick={e=>e.stopPropagation()}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}><h3 style={{color:'#fbbf24',margin:0}}>{t('gt')}</h3><button onClick={()=>setGrok(false)} style={{background:'none',border:'none',color:'#94a3b8',fontSize:'1.5rem',cursor:'pointer'}}>✕</button></div><ol style={{color:'#cbd5e1',margin:'0 0 1rem 0',paddingLeft:'1.2rem',lineHeight:'1.6',fontSize:'0.95rem'}}><li style={{marginBottom:'0.5rem'}}>{t('g1')}</li><li style={{marginBottom:'0.5rem'}}>{t('g2')}</li><li>{t('g3')}<br/><code style={{background:'#0f172a',padding:'0.4rem 0.6rem',borderRadius:'6px',color:'#60a5fa',wordBreak:'break-all',display:'block',margin:'0.5rem 0'}}>{GC}</code><button onClick={copyC} style={{padding:'0.4rem 0.8rem',background:cop?'#10b981':'#3b82f6',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer'}}>{cop?t('cd'):t('cp')}</button></li></ol><a href={GL} target="_blank" rel="noopener" style={{display:'block',background:'#f59e0b',color:'#000',padding:'0.8rem',borderRadius:'10px',textAlign:'center',textDecoration:'none',fontWeight:'600',marginBottom:'0.8rem'}}>🔗 four.meme → GROK</a><Btn c={t('cl')} o={()=>setGrok(false)} bg="#64748b" st={{width:'100%'}}/></div></div>}</div>
}