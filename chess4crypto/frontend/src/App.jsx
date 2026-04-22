import{useState,useEffect,useRef,useCallback,useMemo}from'react'
import{Chess}from'chess.js'
import{Chessboard}from'react-chessboard'
import{useAccount,useDisconnect,useReadContract,useWriteContract,useWaitForTransactionReceipt}from'wagmi'
import{useWeb3Modal}from'@web3modal/wagmi/react'
import{parseUnits,formatUnits}from'viem'

// 🌍 7 ЯЗЫКОВ (сокращено для читаемости, полная версия в предыдущих ответах)
const LANG={
ru:{t:'♟️ Chess4Crypto',s:'PvP ставки GROK',g:'👤 Гостевой',c:'🦊 Войти',k:'💰 Купить GROK',p:'👤 Профиль',l:'🚪 Выйти',y:'👤 Вы',b:'🤖 Бот',yt:'♟️ Ваш ход!',bt:'🤖 Бот думает...',w:'🏆 ПОБЕДА!',x:'😔 Поражение',d:'🤝 Ничья',tp:'⏰ Бот выиграл',tb:'⏰ Вы выиграли',cn:'✅ Подключено',cl:'Закрыть',cp:'📋 Копировать',cd:'✅ Скопировано!',gt:'💰 Как купить GROK',g1:'1. Перейди на сайт и подключи кошелёк в сети BNB.',g2:'2. Купи GROK на любую сумму.',g3:'3. Добавь адрес контракта в кошелёк:',ln:'🇷🇺 RU',th:'🎨 Тема',tm:{c:'🏛️ Классика',w:'🪵 Дерево',n:'💜 Неон',o:'🌊 Океан',s:'🌅 Закат',m:'⚪ Минимал'},tc:'Время:',st:'Ставка GROK:',cr:'➕ Создать матч',jn:'🤝 Присоединиться',mv:'Ходы:',newG:'🔄 В лобби',botG:'🤖 С ботом',select:'Время',bal:'Баланс:',games:'Матчи:',noG:'Нет матчей',myG:'Мои матчи',join:'Войти',copy:'Ссылка скопирована!',invite:'🔗 Приглашение',dep:'💰 Внести',claim:'🏆 Забрать выигрыш',approve:'✅ Разрешить GROK'},
en:{t:'♟️ Chess4Crypto',s:'GROK PvP Betting',g:'👤 Guest',c:'🦊 Connect',k:'💰 GROK',p:'👤 Profile',l:'🚪 Logout',y:'👤 You',b:'🤖 Bot',yt:'♟️ Your turn!',bt:'🤖 Bot thinking...',w:'🏆 YOU WIN!',x:'😔 Lost',d:'🤝 Draw',tp:'⏰ Bot wins',tb:'⏰ You win',cn:'✅ Connected',cl:'Close',cp:'📋 Copy',cd:'✅ Copied!',gt:'💰 Buy GROK',g1:'1. Follow link and connect BNB wallet.',g2:'2. Buy GROK.',g3:'3. Add contract address:',ln:'🇬🇧 EN',th:'🎨 Theme',tm:{c:'🏛️ Classic',w:'🪵 Wood',n:'💜 Neon',o:'🌊 Ocean',s:'🌅 Sunset',m:'⚪ Minimal'},tc:'Time:',st:'Stake GROK:',cr:'➕ Create Match',jn:'🤝 Join',mv:'Moves:',newG:'🔄 Lobby',botG:'🤖 Vs Bot',select:'Time',bal:'Balance:',games:'Matches:',noG:'No matches',myG:'My Matches',join:'Join',copy:'Copied!',invite:'🔗 Invite',dep:'💰 Deposit',claim:'🏆 Claim Win',approve:'✅ Approve GROK'},
de:{t:'♟️ Chess4Crypto',s:'GROK PvP',g:'👤 Gast',c:'🦊 Verbinden',k:'💰 GROK',p:'👤 Profil',l:'🚪 Exit',y:'👤 Du',b:'🤖 Bot',yt:'♟️ Dein Zug!',bt:'🤖 Bot denkt...',w:'🏆 GEWINN!',x:'😔 Verloren',d:'🤝 Remis',tp:'⏰ Bot gewinnt',tb:'⏰ Du gewinnst',cn:'✅ Verbunden',cl:'Schließen',cp:'📋 Kopieren',cd:'✅ Kopiert',gt:'💰 GROK kaufen',g1:'1. Link öffnen, BNB Wallet verbinden.',g2:'2. GROK kaufen.',g3:'3. Adresse hinzufügen:',ln:'🇩🇪 DE',th:'🎨 Design',tm:{c:'🏛️ Klassisch',w:'🪵 Holz',n:'💜 Neon',o:'🌊 Ozean',s:'🌅 Sonnenuntergang',m:'⚪ Minimal'},tc:'Zeit:',st:'Einsatz GROK:',cr:'➕ Match',jn:'🤝 Beitreten',mv:'Züge:',newG:'🔄 Lobby',botG:'🤖 Vs Bot',select:'Zeit',bal:'Guthaben:',games:'Matches:',noG:'Keine',myG:'Meine',join:'Beitreten',copy:'Kopiert!',invite:'🔗 Einladen',dep:'💰 Einzahlen',claim:'🏆 Auszahlen',approve:'✅ Genehmigen'},
fr:{t:'♟️ Chess4Crypto',s:'Paris GROK PvP',g:'👤 Invité',c:'🦊 Connecter',k:'💰 GROK',p:'👤 Profil',l:'🚪 Quitter',y:'👤 Vous',b:'🤖 Bot',yt:'♟️ À vous!',bt:'🤖 Bot réfléchit...',w:'🏆 GAGNÉ!',x:'😔 Perdu',d:'🤝 Nulle',tp:'⏰ Bot gagne',tb:'⏰ Vous gagnez',cn:'✅ Connecté',cl:'Fermer',cp:'📋 Copier',cd:'✅ Copié',gt:'💰 GROK',g1:'1. Suivre lien, connecter wallet BNB.',g2:'2. Acheter GROK.',g3:'3. Ajouter adresse:',ln:'🇫🇷 FR',th:'🎨 Thème',tm:{c:'🏛️ Classique',w:'🪵 Bois',n:'💜 Néon',o:'🌊 Océan',s:'🌅 Coucher',m:'⚪ Minimal'},tc:'Temps:',st:'Mise GROK:',cr:'➕ Match',jn:'🤝 Rejoindre',mv:'Coups:',newG:'🔄 Lobby',botG:'🤖 Vs Bot',select:'Temps',bal:'Solde:',games:'Matchs:',noG:'Aucun',myG:'Mes',join:'Rejoindre',copy:'Copié!',invite:'🔗 Inviter',dep:'💰 Déposer',claim:'🏆 Réclamer',approve:'✅ Approuver'},
es:{t:'♟️ Chess4Crypto',s:'Apuestas GROK PvP',g:'👤 Invitado',c:'🦊 Conectar',k:'💰 GROK',p:'👤 Perfil',l:'🚪 Salir',y:'👤 Tú',b:'🤖 Bot',yt:'♟️ ¡Tu turno!',bt:'🤖 Bot piensa...',w:'🏆 ¡GANASTE!',x:'😔 Perdiste',d:'🤝 Empate',tp:'⏰ Bot gana',tb:'⏰ Ganas tú',cn:'✅ Conectado',cl:'Cerrar',cp:'📋 Copiar',cd:'✅ Copiado',gt:'💰 GROK',g1:'1. Ir al enlace, conectar wallet BNB.',g2:'2. Comprar GROK.',g3:'3. Añadir dirección:',ln:'🇪🇸 ES',th:'🎨 Tema',tm:{c:'🏛️ Clásico',w:'🪵 Madera',n:'💜 Neón',o:'🌊 Océano',s:'🌅 Atardecer',m:'⚪ Minimal'},tc:'Tiempo:',st:'Apuesta GROK:',cr:'➕ Partida',jn:'🤝 Unirse',mv:'Movimientos:',newG:'🔄 Lobby',botG:'🤖 Vs Bot',select:'Tiempo',bal:'Saldo:',games:'Partidas:',noG:'Ninguna',myG:'Mis',join:'Unirse',copy:'¡Copiado!',invite:'🔗 Invitar',dep:'💰 Depositar',claim:'🏆 Reclamar',approve:'✅ Aprobar'},
zh:{t:'♟️ Chess4Crypto',s:'GROK PvP投注',g:'👤 访客',c:'🦊 连接',k:'💰 GROK',p:'👤 资料',l:'🚪 退出',y:'👤 你',b:'🤖 机器人',yt:'♟️ 轮到你!',bt:'🤖 机器人思考中...',w:'🏆 你赢了!',x:'😔 你输了',d:'🤝 平局',tp:'⏰ 机器人赢',tb:'⏰ 你赢了',cn:'✅ 已连接',cl:'关闭',cp:'📋 复制',cd:'✅ 已复制',gt:'💰 购买GROK',g1:'1. 点击链接连接BNB钱包。',g2:'2. 购买GROK。',g3:'3. 添加地址:',ln:'🇨🇳 中文',th:'🎨 主题',tm:{c:'🏛️ 经典',w:'🪵 木质',n:'💜 霓虹',o:'🌊 海洋',s:'🌅 日落',m:'⚪ 简约'},tc:'时间:',st:'GROK赌注:',cr:'➕ 创建比赛',jn:'🤝 加入',mv:'走法:',newG:'🔄 大厅',botG:'🤖 对战机器人',select:'选择时间',bal:'余额:',games:'比赛:',noG:'无比赛',myG:'我的比赛',join:'加入',copy:'链接已复制!',invite:'🔗 邀请',dep:'💰 存入',claim:'🏆 领取',approve:'✅ 授权'},
hi:{t:'♟️ Chess4Crypto',s:'GROK PvP दांव',g:'👤 अतिथि',c:'🦊 कनेक्ट',k:'💰 GROK',p:'👤 प्रोफ़ाइल',l:'🚪 बाहर',y:'👤 आप',b:'🤖 बॉट',yt:'♟️ आपकी बारी!',bt:'🤖 बॉट सोच रहा...',w:'🏆 आप जीते!',x:'😔 आप हारे',d:'🤝 ड्रॉ',tp:'⏰ बॉट जीता',tb:'⏰ आप जीते',cn:'✅ कनेक्ट',cl:'बंद',cp:'📋 कॉपी',cd:'✅ कॉपी',gt:'💰 GROK खरीदें',g1:'1. लिंक पर जाएं, BNB वॉलेट कनेक्ट करें।',g2:'2. GROK खरीदें।',g3:'3. एड्रेस जोड़ें:',ln:'🇮🇳 हिंदी',th:'🎨 थीम',tm:{c:'🏛️ क्लासिक',w:'🪵 लकड़ी',n:'💜 नियॉन',o:'🌊 महासागर',s:'🌅 सूर्यास्त',m:'⚪ मिनिमल'},tc:'समय:',st:'GROK दांव:',cr:'➕ मैच बनाएं',jn:'🤝 जुड़ें',mv:'चाल:',newG:'🔄 लॉबी',botG:'🤖 बॉट से',select:'समय',bal:'शेष:',games:'मैच:',noG:'कोई नहीं',myG:'मेरे',join:'जुड़ें',copy:'कॉपी!',invite:'🔗 आमंत्रण',dep:'💰 जमा',claim:'🏆 क्लेम',approve:'✅ मंजूरी'}
}

const THEMES={c:{l:'#eeeed2',d:'#769656',n:'🏛️ Classic'},w:{l:'#f0d9b5',d:'#b58863',n:'🪵 Wood'},n:{l:'#1a1a2e',d:'#16213e',n:'💜 Neon'},o:{l:'#e0f7fa',d:'#006064',n:'🌊 Ocean'},s:{l:'#fff3e0',d:'#e65100',n:'🌅 Sunset'},m:{l:'#e0e0e0',d:'#757575',n:'⚪ Minimal'}}
const TIME_OPTIONS=[5,15,30,60,1440]
const fmtTime=s=>{const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return h>0?`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`:`${m}:${String(sec).padStart(2,'0')}`}
const GROK_LINK='https://four.meme/token/0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444?code=AHGX96R5GHK9'
const GROK_ADDR='0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444'
const CHESS_CONTRACT='0xB77ED8144d328A270994B157700Ee28AfD8A3a5b' // 🔑 ВСТАВЬТЕ АДРЕС DEPLOYED КОНТРАКТА
const GROK_ABI=[{"inputs":[{"internalType":"address","name":"_grokToken","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"grokToken","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"gameId","type":"bytes32"}],"name":"createGame","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"gameId","type":"bytes32"}],"name":"deposit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"gameId","type":"bytes32"},{"internalType":"address","name":"winner","type":"address"}],"name":"settleGame","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"games","outputs":[{"internalType":"address","name":"creator","type":"address"},{"internalType":"address","name":"challenger","type":"address"},{"internalType":"uint256","name":"stake","type":"uint256"},{"internalType":"bool","name":"creatorDeposited","type":"bool"},{"internalType":"bool","name":"challengerDeposited","type":"bool"},{"internalType":"address","name":"winner","type":"address"},{"internalType":"bool","name":"settled","type":"bool"},{"internalType":"uint256","name":"createdAt","type":"uint256"}],"stateMutability":"view","type":"function"}]
const ERC20_ABI=[{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]

export default function App(){
const[lang,setLang]=useState('ru')
const t=useCallback(k=>LANG[lang][k]||k,[lang])
const{address,isConnected}=useAccount()
const{disconnect}=useDisconnect()
const{open}=useWeb3Modal()
const[view,setView]=useState('menu')
const[profileTab,setProfileTab]=useState('lobby')
const[msg,setMsg]=useState('')
const[grok,setGrok]=useState(false)
const[cop,setCop]=useState(false)
const[theme,setTheme]=useState('c')
const[bs,setBs]=useState(360)
const[games,setGames]=useState([])
const[createStake,setCreateStake]=useState(5000)
const[timeCtrl,setTimeCtrl]=useState(15)
const[pendingJoin,setPendingJoin]=useState(null)
const[inviteLink,setInviteLink]=useState('')
const[selectedSq,setSelectedSq]=useState(null)
const[possibleMoves,setPossibleMoves]=useState([])
const[moveHistory,setMoveHistory]=useState([])
const[gameId,setGameId]=useState('')
const[isDeposited,setIsDeposited]=useState(false)
const[gameState,setGameState]=useState('idle') // idle | waiting_funds | playing | finished

const gameRef=useRef(new Chess())
const[fen,setFen]=useState(gameRef.current.fen())
const[hist,setHist]=useState([gameRef.current.fen()])
const[mi,setMi]=useState(0)
const[isPlayerTurn,setIsPlayerTurn]=useState(true)
const[gameOver,setGameOver]=useState(false)
const[winner,setWinner]=useState(null)
const[pTime,setPTime]=useState(15*60)
const[bTime,setBTime]=useState(15*60)
const[timerActive,setTimerActive]=useState(null)
const timerRef=useRef(null)

// 💰 Контрактные хуки
const{writeContract:approveWrite}=useWriteContract()
const{writeContract:depositWrite}=useWriteContract()
const{writeContract:claimWrite}=useWriteContract()

useEffect(()=>{const r=()=>setBs(Math.min(window.innerWidth*0.9,400));window.addEventListener('resize',r);return()=>window.removeEventListener('resize',r)},[])
useEffect(()=>{if(timerRef.current)clearInterval(timerRef.current);if(!timerActive||gameOver)return;timerRef.current=setInterval(()=>{if(timerActive==='player'){setPTime(prev=>{if(prev<=1){clearInterval(timerRef.current);setGameOver(true);setWinner('bot');setMsg(t('tp'));return 0}return prev-1})}else{setBTime(prev=>{if(prev<=1){clearInterval(timerRef.current);setGameOver(true);setWinner('player');setMsg(t('tb'));return 0}return prev-1})}},1000);return()=>clearInterval(timerRef.current)},[timerActive,gameOver,t])

const guest=()=>{setMsg(t('g'));resetGame();startGame()}
const buyGrok=()=>setGrok(true)
const langNext=()=>setLang(l=>({ru:'en',en:'de',de:'fr',fr:'es',es:'zh',zh:'hi',hi:'ru'})[l])
const copyAddr=()=>{if(navigator.clipboard){navigator.clipboard.writeText(GROK_ADDR);setCop(true);setTimeout(()=>setCop(false),2000)}}
const connectWallet=()=>open()
const resetGame=()=>{gameRef.current.reset();setFen(gameRef.current.fen());setHist([gameRef.current.fen()]);setMi(0);setIsPlayerTurn(true);setGameOver(false);setWinner(null);setMoveHistory([]);setSelectedSq(null);setPossibleMoves([]);setIsDeposited(false);setGameState('idle')}
const startGame=()=>{const gameTime=timeCtrl*60;setPTime(gameTime);setBTime(gameTime);setTimerActive('player');setView('game');setGameState('playing')}

// 🔐 1. Approve GROK
const handleApprove=()=>{
  if(!isConnected||CHESS_CONTRACT==='0xB77ED8144d328A270994B157700Ee28AfD8A3a5b'){setMsg('⚠️ Deploy contract first');return}
  approveWrite({
    address:GROK_ADDR,
    abi:ERC20_ABI,
    functionName:'approve',
    args:[CHESS_CONTRACT, parseUnits(createStake.toString(),18)]
  },{
    onSuccess:()=>{setMsg('✅ GROK approved');setTimeout(()=>handleDeposit(),1000)},
    onError:(e)=>setMsg('❌ '+e.message)
  })
}

// 💰 2. Deposit
const handleDeposit=()=>{
  if(!gameId){setMsg('⚠️ Create or join first');return}
  depositWrite({
    address:CHESS_CONTRACT,
    abi:CHESS_ABI,
    functionName:'deposit',
    args:[gameId]
  },{
    onSuccess:()=>{setIsDeposited(true);setMsg('✅ Deposited. Waiting for opponent.');setGameState('waiting_funds')},
    onError:(e)=>setMsg('❌ '+e.message)
  })
}

// 🏆 3. Create Match
const handleCreateMatch=()=>{
  if(!isConnected){setMsg('⚠️ '+t('cn'));return}
  const newId='game_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)
  setGameId(newId)
  const link=`${window.location.origin}${window.location.pathname}?game=${newId}&stake=${createStake}&time=${timeCtrl}`
  setInviteLink(link)
  if(navigator.clipboard)navigator.clipboard.writeText(link)
  setMsg('🔗 Link copied! Share it.')
  handleApprove()
}

// 🤝 4. Join Match
const handleJoinMatch=()=>{
  if(!isConnected||!pendingJoin){setMsg('⚠️ Open invite link');return}
  setGameId(pendingJoin.id)
  setCreateStake(pendingJoin.stake)
  setTimeCtrl(pendingJoin.time)
  handleApprove()
}

// 🏁 5. Settle/Claim
const handleClaim=()=>{
  if(!gameId||!winner){setMsg('⚠️ Game not finished');return}
  claimWrite({
    address:CHESS_CONTRACT,
    abi:CHESS_ABI,
    functionName:'settleGame',
    args:[gameId,address] // winner claims for themselves
  },{
    onSuccess:()=>{setMsg('🎉 Payout sent!');setGameState('idle')},
    onError:(e)=>setMsg('❌ '+e.message)
  })
}

const botMove=useCallback(()=>{if(gameOver||gameRef.current.isGameOver()||gameState!=='playing')return;const moves=gameRef.current.moves({verbose:true});if(!moves.length)return;let chosenMove;const rand=Math.random();if(rand<0.7){chosenMove=moves[Math.floor(Math.random()*moves.length)]}else{const captures=moves.filter(m=>m.captured);if(captures.length>0){chosenMove=captures[Math.floor(Math.random()*captures.length)]}else{chosenMove=moves[Math.floor(Math.random()*moves.length)]}}gameRef.current.move(chosenMove);const san=gameRef.current.history({verbose:true}).pop()?.san||`${chosenMove.from}${chosenMove.to}`;setFen(gameRef.current.fen());setHist(h=>[...h,gameRef.current.fen()]);setMoveHistory(mh=>[...mh,{san,from:chosenMove.from,to:chosenMove.to}]);setMi(i=>i+1);setIsPlayerTurn(true);setTimerActive('player');if(gameRef.current.isCheckmate()){setGameOver(true);setWinner('bot');setMsg(t('x'))}else if(gameRef.current.isDraw()){setGameOver(true);setWinner(null);setMsg(t('d'))}else{setMsg(t('yt'))}},[gameOver,t,gameState])

const onSqClick=useCallback((sq)=>{if(gameOver||gameState!=='playing'||!isPlayerTurn)return;const piece=gameRef.current.get(sq);if(piece&&piece.color===(isPlayerTurn?'w':'b')){setSelectedSq(sq);const moves=gameRef.current.moves({square:sq,verbose:true});setPossibleMoves(moves.map(m=>m.to));return}if(selectedSq&&possibleMoves.includes(sq)){onDrop(selectedSq,sq);setSelectedSq(null);setPossibleMoves([]);return}setSelectedSq(null);setPossibleMoves([])},[gameOver,isPlayerTurn,selectedSq,possibleMoves,gameState])

const onDrop=useCallback((src,tgt)=>{if(!isPlayerTurn||gameOver||gameState!=='playing')return false;try{const res=gameRef.current.move({from:src,to:tgt,promotion:'q'});if(!res)return false;const san=gameRef.current.history({verbose:true}).pop()?.san||`${src}${tgt}`;setFen(gameRef.current.fen());setHist(h=>[...h,gameRef.current.fen()]);setMoveHistory(mh=>[...mh,{san,from:src,to:tgt}]);setMi(i=>i+1);setIsPlayerTurn(false);setTimerActive('bot');setSelectedSq(null);setPossibleMoves([]);if(gameRef.current.isCheckmate()){setGameOver(true);setWinner(address);handleClaim()}else if(gameRef.current.isDraw()){setGameOver(true);setWinner(null);setMsg(t('d'))}else{setMsg(t('bt'));setTimeout(botMove,1500)}return true}catch{return false}},[isPlayerTurn,gameOver,botMove,t,address,gameState])

useEffect(()=>{const params=new URLSearchParams(window.location.search);const gid=params.get('game');if(gid&&!pendingJoin){setPendingJoin({id:gid,stake:parseInt(params.get('stake'))||5000,time:parseInt(params.get('time'))||15});setView('profile');setProfileTab('lobby')}},[pendingJoin])

const sqStyles=useMemo(()=>{const styles={};if(selectedSq){styles[selectedSq]={backgroundColor:'rgba(255,255,0,0.4)'}};possibleMoves.forEach(sq=>{styles[sq]={backgroundColor:'rgba(20,85,30,0.5)',backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.9) 25%,transparent 25%)',backgroundSize:'14px 14px',backgroundPosition:'center'}});return styles},[selectedSq,possibleMoves])
const Btn=({c,o,bg,dis,st})=>(<button onClick={o}disabled={dis}style={{padding:'0.8rem 1.2rem',background:bg||'#3b82f6',color:'#fff',border:'none',borderRadius:'10px',cursor:dis?'not-allowed':'pointer',fontSize:'1rem',fontWeight:'600',opacity:dis?0.5:1,...st}}>{c}</button>)
const Timer=({l,t,a})=>(<div style={{background:a?'#059669':'#1e293b',padding:'10px 20px',borderRadius:'10px',color:'#fff',textAlign:'center',border:a?'2px solid #34d399':'1px solid #334155',width:'45%'}}><div style={{fontSize:'0.85rem',opacity:0.8}}>{l}</div><div style={{fontSize:'1.6rem',fontWeight:'bold',fontFamily:'monospace'}}>{fmtTime(t)}</div></div>)

// ============================================================================
// 🖥️ РЕНДЕР
// ============================================================================
return(<div style={{minHeight:'100vh',background:'#0f172a',color:'#f1f5f9',fontFamily:'system-ui',padding:'1rem'}}>{view==='menu'&&<div style={{maxWidth:'400px',margin:'0 auto',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'80vh',gap:'1rem'}}><h1 style={{color:'#fbbf24'}}>{t('t')}</h1><Btn c={t('g')}o={guest}bg="#3b82f6"/><Btn c={t('c')}o={connectWallet}bg="#f59e0b"/><Btn c={t('k')}o={buyGrok}bg="#10b981"/><Btn c={t('ln')}o={langNext}bg="#475569"/>{msg&&<div style={{padding:'0.5rem',background:'#1e293b',borderRadius:'8px',color:'#60a5fa'}}>{msg}</div>}</div>}

{view==='profile'&&<div style={{maxWidth:'500px',margin:'0 auto',display:'flex',flexDirection:'column',gap:'1rem'}}><div style={{background:'#1e293b',padding:'1rem',borderRadius:'12px',display:'flex',justifyContent:'space-between'}}><span>{address?.slice(0,6)}...{address?.slice(-4)}</span><Btn c={t('l')}o={()=>{disconnect();setView('menu')}}bg="#ef4444"/></div><div style={{display:'flex',gap:'0.5rem'}}>{['lobby','my','create'].map(tab=>(<Btn key={tab}c={tab==='lobby'?t('jn'):tab==='my'?t('myG'):t('cr')}o={()=>setProfileTab(tab)}bg={profileTab===tab?'#3b82f6':'#334155'}/>))}<Btn c={t('ln')}o={langNext}bg="#475569"/></div>
{profileTab==='create'&&<div style={{background:'#1e293b',padding:'1rem',borderRadius:'12px'}}><div style={{marginBottom:'0.5rem'}}><label>{t('st')}</label><div style={{display:'flex',gap:'0.5rem'}}>{[100,500,1000,5000].map(a=>(<Btn key={a}c={a}o={()=>setCreateStake(a)}bg={createStake===a?'#10b981':'#334155'}/>))}</div></div><Btn c={t('cr')}o={handleCreateMatch}bg="#10b981"st={{width:'100%',marginTop:'0.5rem'}}/>{inviteLink&&<div style={{marginTop:'0.5rem',fontSize:'0.8rem',background:'#0f172a',padding:'0.5rem',borderRadius:'6px',wordBreak:'break-all'}}>{inviteLink}</div>}</div>}
{profileTab==='lobby'&&<div style={{background:'#1e293b',padding:'1rem',borderRadius:'12px'}}>{pendingJoin?<div><p>{t('invite')}: {pendingJoin.stake} GROK</p><Btn c={t('join')}o={handleJoinMatch}bg="#10b981"st={{width:'100%'}}/></div>:<p style={{color:'#94a3b8'}}>{t('noG')}</p>}</div>}
{profileTab==='my'&&<div style={{background:'#1e293b',padding:'1rem',borderRadius:'12px'}}><p>Game ID: {gameId||'-'}</p><p>Status: {gameState}</p>{gameState==='playing'&&<Btn c="🎮 Play"o={()=>setView('game')}bg="#8b5cf6"st={{width:'100%'}}/>}{gameOver&&<Btn c={t('claim')}o={handleClaim}bg="#f59e0b"st={{width:'100%',marginTop:'0.5rem'}}/>}</div>}</div>}

{view==='game'&&<div style={{maxWidth:'420px',margin:'0 auto'}}><div style={{display:'flex',justifyContent:'space-around',marginBottom:'0.5rem'}}><Timer l={t('y')}t={pTime}a={timerActive==='player'}/><Timer l={t('b')}t={bTime}a={timerActive==='bot'}/></div><div style={{background:'#1e293b',padding:'8px',borderRadius:'12px'}}><Chessboard position={fen}onPieceDrop={onDrop}onSquareClick={onSqClick}boardWidth={bs}customSquareStyles={sqStyles}customDarkSquareStyle={{backgroundColor:THEMES[theme].d}}customLightSquareStyle={{backgroundColor:THEMES[theme].l}}/></div><div style={{display:'flex',gap:'0.5rem',marginTop:'0.5rem',justifyContent:'center'}}><Btn c={t('newG')}o={()=>{resetGame();setView('profile')}}bg="#3b82f6"/><Btn c={t('botG')}o={()=>{resetGame();startGame()}}bg="#10b981"/><select value={theme}onChange={e=>setTheme(e.target.value)}style={{padding:'0.5rem',background:'#1e293b',color:'#fff',border:'none',borderRadius:'6px'}}>{Object.entries(THEMES).map(([k,v])=>(<option key={k}value={k}>{v.n}</option>))}</select></div>{moveHistory.length>0&&<div style={{marginTop:'0.5rem',background:'#1e293b',padding:'0.5rem',borderRadius:'8px',maxHeight:'100px',overflowY:'auto',fontSize:'0.8rem'}}>{moveHistory.map((m,i)=>(<span key={i}style={{marginRight:'0.5rem'}}>{i+1}.{m.san}</span>))}</div>}</div>}

{grok&&<div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.9)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}onClick={()=>setGrok(false)}><div style={{background:'#1e293b',padding:'1.5rem',borderRadius:'16px',maxWidth:'360px'}}onClick={e=>e.stopPropagation()}><h3 style={{color:'#fbbf24'}}>{t('gt')}</h3><ol style={{color:'#cbd5e1',margin:'1rem 0',paddingLeft:'1.2rem'}}><li>{t('g1')}</li><li>{t('g2')}</li><li>{t('g3')}<br/><code style={{background:'#0f172a',padding:'0.3rem',borderRadius:'4px',display:'block',margin:'0.3rem 0',fontSize:'0.8rem'}}>{GROK_ADDR}</code><Btn c={t('cp')}o={copyAddr}bg="#3b82f6"st={{marginTop:'0.3rem'}}/></li></ol><a href={GROK_LINK}target="_blank"style={{display:'block',background:'#f59e0b',color:'#000',padding:'0.6rem',borderRadius:'8px',textAlign:'center',textDecoration:'none'}}>🔗 four.meme</a><Btn c={t('cl')}o={()=>setGrok(false)}bg="#475569"st={{marginTop:'0.5rem',width:'100%'}}/></div></div>}
{msg&&<div style={{position:'fixed',bottom:'1rem',left:'50%',transform:'translateX(-50%)',background:'#3b82f6',color:'#fff',padding:'0.6rem 1rem',borderRadius:'8px',zIndex:1000}}>{msg}</div>}</div>)
}