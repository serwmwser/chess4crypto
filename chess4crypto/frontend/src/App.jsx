import{useState,useEffect,useRef,useCallback,useMemo}from'react'
import{Chess}from'chess.js'
import{Chessboard}from'react-chessboard'
import{useAccount,useDisconnect,useWriteContract,useReadContract}from'wagmi'
import{useWeb3Modal}from'@web3modal/wagmi/react'
import{parseUnits,formatUnits}from'viem'
import{supabase,createGameRecord,updateGameStatus,recordMove,subscribeToGame}from'./supabase'

// 🌍 7 ЯЗЫКОВ
const LANG={
ru:{t:'♟️ Chess4Crypto',s:'PvP ставки в GROK',g:'👤 Гостевой',c:'🦊 Войти',k:'💰 Купить GROK',p:'👤 Профиль',l:'🚪 Выйти',y:'👤 Вы',b:'🤖 Бот',yt:'♟️ Ваш ход!',bt:'🤖 Бот думает (3с)...',w:'🏆 ПОБЕДА!',x:'😔 Поражение',d:'🤝 Ничья',tp:'⏰ Бот выиграл',tb:'⏰ Вы выиграли',cn:'✅ Подключено',cl:'Закрыть',cp:'📋 Копировать',cd:'✅ Скопировано!',gt:'💰 Как купить GROK',g1:'1. Перейдите по ссылке и подключите крипто-кошелёк в сети BNB (нужен BNB для комиссии).',g2:'2. Купите монету GROK на любую сумму.',g3:'3. Добавьте адрес контракта в кошелёк для отображения:',ln:'🇷🇺 RU',th:'🎨 Тема',tm:{c:'🏛️ Классика',w:'🪵 Дерево',n:'💜 Неон',o:'🌊 Океан',s:'🌅 Закат',m:'⚪ Минимал'},tc:'Время:',st:'Ставка:',cr:'➕ Создать матч',jn:'🤝 Присоединиться',mv:'Ходы:',newG:'🔄 В лобби',botG:'🤖 С ботом',select:'Время',bal:'Баланс:',games:'Игры:',noG:'Нет игр',myG:'Мои игры',join:'Войти',copy:'Ссылка скопирована!',invite:'🔗 Приглашение',dep:'💰 Внести',claim:'🏆 Забрать',approve:'✅ Разрешить',waiting:'⏳ Ожидание соперника...',playing:'♟️ Игра идёт',sync:'🔄 Синхронизация...',review:'🔍 Просмотр',live:'▶️ В реальном времени',prev:'⏪ Назад',next:'⏩ Вперёд',pot:'Банк игры:',payout:'Выплата:',refund:'Возврат',drawRefund:'🤝 Ничья — ставки возвращены',winnerGets:'🏆 Победитель забирает весь банк',needDep:'Нужно внести',toJoin:'для присоединения',yourStake:'Ваша ставка:',oppStake:'Ставка соперника:',totalPot:'Общий банк:',setTime:'Выберите время:'},
en:{t:'♟️ Chess4Crypto',s:'GROK PvP Betting',g:'👤 Guest',c:'🦊 Connect',k:'💰 GROK',p:'👤 Profile',l:'🚪 Logout',y:'👤 You',b:'🤖 Bot',yt:'♟️ Your turn!',bt:'🤖 Bot thinks (3s)...',w:'🏆 YOU WIN!',x:'😔 Lost',d:'🤝 Draw',tp:'⏰ Bot wins',tb:'⏰ You win',cn:'✅ Connected',cl:'Close',cp:'📋 Copy',cd:'✅ Copied!',gt:'💰 Buy GROK',g1:'1. Follow link and connect BNB Chain wallet (need BNB for gas).',g2:'2. Buy GROK token for any amount.',g3:'3. Add contract to wallet to display:',ln:'🇬🇧 EN',th:'🎨 Theme',tm:{c:'🏛️ Classic',w:'🪵 Wood',n:'💜 Neon',o:'🌊 Ocean',s:'🌅 Sunset',m:'⚪ Minimal'},tc:'Time:',st:'Stake:',cr:'➕ Create Match',jn:'🤝 Join',mv:'Moves:',newG:'🔄 Lobby',botG:'🤖 Vs Bot',select:'Time',bal:'Balance:',games:'Games:',noG:'No games',myG:'My Games',join:'Join',copy:'Copied!',invite:'🔗 Invite',dep:'💰 Deposit',claim:'🏆 Claim Win',approve:'✅ Approve GROK',waiting:'⏳ Waiting opponent...',playing:'♟️ Game in progress',sync:'🔄 Syncing...',review:'🔍 Review',live:'▶️ Live',prev:'⏪ Prev',next:'⏩ Next',pot:'Game Pot:',payout:'Payout:',refund:'Refund',drawRefund:'🤝 Draw — stakes refunded',winnerGets:'🏆 Winner takes entire pot',needDep:'Need to deposit',toJoin:'to join',yourStake:'Your stake:',oppStake:'Opponent stake:',totalPot:'Total pot:',setTime:'Select Time:'},
de:{t:'♟️ Chess4Crypto',s:'GROK PvP',g:'👤 Gast',c:'🦊 Verbinden',k:'💰 GROK',p:'👤 Profil',l:'🚪 Exit',y:'👤 Du',b:'🤖 Bot',yt:'♟️ Dein Zug!',bt:'🤖 Bot denkt (3s)...',w:'🏆 GEWINN!',x:'😔 Verloren',d:'🤝 Remis',tp:'⏰ Bot gewinnt',tb:'⏰ Du gewinnst',cn:'✅ Verbunden',cl:'Schließen',cp:'📋 Kopieren',cd:'✅ Kopiert',gt:'💰 GROK kaufen',g1:'1. Link öffnen und BNB Wallet verbinden (BNB für Gebühren).',g2:'2. GROK-Token kaufen.',g3:'3. Adresse im Wallet hinzufügen:',ln:'🇩🇪 DE',th:'🎨 Design',tm:{c:'🏛️ Klassisch',w:'🪵 Holz',n:'💜 Neon',o:'🌊 Ozean',s:'🌅 Sonnenuntergang',m:'⚪ Minimal'},tc:'Zeit:',st:'Einsatz:',cr:'➕ Match',jn:'🤝 Beitreten',mv:'Züge:',newG:'🔄 Lobby',botG:'🤖 Vs Bot',select:'Zeit',bal:'Guthaben:',games:'Spiele:',noG:'Keine',myG:'Meine',join:'Beitreten',copy:'Kopiert!',invite:'🔗 Einladen',dep:'💰 Einzahlen',claim:'🏆 Auszahlen',approve:'✅ Genehmigen',waiting:'⏳ Warte...',playing:'♟️ Läuft',sync:'🔄 Sync...',review:'🔍 Verlauf',live:'▶️ Live',prev:'⏪ Zurück',next:'⏩ Vor',pot:'Spielbank:',payout:'Auszahlung:',refund:'Rückerstattung',drawRefund:'🤝 Remis — Einsätze zurück',winnerGets:'🏆 Sieger bekommt alles',needDep:'Einzahlen',toJoin:'zum Beitreten',yourStake:'Dein Einsatz:',oppStake:'Einsatz Gegner:',totalPot:'Gesamtbank:',setTime:'Zeit wählen:'},
fr:{t:'♟️ Chess4Crypto',s:'Paris GROK PvP',g:'👤 Invité',c:'🦊 Connecter',k:'💰 GROK',p:'👤 Profil',l:'🚪 Quitter',y:'👤 Vous',b:'🤖 Bot',yt:'♟️ À vous!',bt:'🤖 Bot pense (3s)...',w:'🏆 GAGNÉ!',x:'😔 Perdu',d:'🤝 Nulle',tp:'⏰ Bot gagne',tb:'⏰ Vous gagnez',cn:'✅ Connecté',cl:'Fermer',cp:'📋 Copier',cd:'✅ Copié',gt:'💰 GROK',g1:'1. Suivre lien et connecter wallet BNB (BNB pour frais).',g2:'2. Acheter GROK.',g3:'3. Ajouter adresse au wallet:',ln:'🇫🇷 FR',th:'🎨 Thème',tm:{c:'🏛️ Classique',w:'🪵 Bois',n:'💜 Néon',o:'🌊 Océan',s:'🌅 Coucher',m:'⚪ Minimal'},tc:'Temps:',st:'Mise:',cr:'➕ Match',jn:'🤝 Rejoindre',mv:'Coups:',newG:'🔄 Lobby',botG:'🤖 Vs Bot',select:'Temps',bal:'Solde:',games:'Parties:',noG:'Aucune',myG:'Mes',join:'Rejoindre',copy:'Copié!',invite:'🔗 Inviter',dep:'💰 Déposer',claim:'🏆 Réclamer',approve:'✅ Approuver',waiting:'⏳ Attente...',playing:'♟️ En cours',sync:'🔄 Sync...',review:'🔍 Historique',live:'▶️ Live',prev:'⏪ Préc',next:'⏩ Suiv',pot:'Cagnotte:',payout:'Gain:',refund:'Remboursement',drawRefund:'🤝 Nulle — mises remboursées',winnerGets:'🏆 Le gagnant empoche tout',needDep:'Déposer',toJoin:'pour rejoindre',yourStake:'Votre mise:',oppStake:'Mise adversaire:',totalPot:'Cagnotte totale:',setTime:'Choisir temps:'},
es:{t:'♟️ Chess4Crypto',s:'Apuestas GROK PvP',g:'👤 Invitado',c:'🦊 Conectar',k:'💰 GROK',p:'👤 Perfil',l:'🚪 Salir',y:'👤 Tú',b:'🤖 Bot',yt:'♟️ ¡Tu turno!',bt:'🤖 Bot piensa (3s)...',w:'🏆 ¡GANASTE!',x:'😔 Perdiste',d:'🤝 Empate',tp:'⏰ Bot gana',tb:'⏰ Ganas tú',cn:'✅ Conectado',cl:'Cerrar',cp:'📋 Copiar',cd:'✅ Copiado',gt:'💰 GROK',g1:'1. Ir al enlace y conectar wallet BNB (necesitas BNB).',g2:'2. Comprar GROK.',g3:'3. Añadir dirección al wallet:',ln:'🇪🇸 ES',th:'🎨 Tema',tm:{c:'🏛️ Clásico',w:'🪵 Madera',n:'💜 Neón',o:'🌊 Océano',s:'🌅 Atardecer',m:'⚪ Minimal'},tc:'Tiempo:',st:'Apuesta:',cr:'➕ Partida',jn:'🤝 Unirse',mv:'Movimientos:',newG:'🔄 Lobby',botG:'🤖 Vs Bot',select:'Tiempo',bal:'Saldo:',games:'Partidas:',noG:'Ninguna',myG:'Mis',join:'Unirse',copy:'¡Copiado!',invite:'🔗 Invitar',dep:'💰 Depositar',claim:'🏆 Reclamar',approve:'✅ Aprobar',waiting:'⏳ Espera...',playing:'♟️ En juego',sync:'🔄 Sync...',review:'🔍 Historial',live:'▶️ En vivo',prev:'⏪ Ant',next:'⏩ Sig',pot:'Bote:',payout:'Ganancia:',refund:'Devolución',drawRefund:'🤝 Empate — apuestas devueltas',winnerGets:'🏆 El ganador se lo lleva todo',needDep:'Depositar',toJoin:'para unirse',yourStake:'Tu apuesta:',oppStake:'Apuesta rival:',totalPot:'Bote total:',setTime:'Elegir tiempo:'},
zh:{t:'♟️ Chess4Crypto',s:'GROK PvP投注',g:'👤 访客',c:'🦊 连接',k:'💰 GROK',p:'👤 资料',l:'🚪 退出',y:'👤 你',b:'🤖 机器人',yt:'♟️ 轮到你!',bt:'🤖 机器人思考中 (3秒)...',w:'🏆 你赢了!',x:'😔 你输了',d:'🤝 平局',tp:'⏰ 机器人赢',tb:'⏰ 你赢了',cn:'✅ 已连接',cl:'关闭',cp:'📋 复制',cd:'✅ 已复制',gt:'💰 购买GROK',g1:'1. 点击链接连接BNB链钱包（需BNB支付手续费）。',g2:'2. 购买任意数量的GROK代币。',g3:'3. 将地址添加到钱包以显示:',ln:'🇨🇳 中文',th:'🎨 主题',tm:{c:'🏛️ 经典',w:'🪵 木质',n:'💜 霓虹',o:'🌊 海洋',s:'🌅 日落',m:'⚪ 简约'},tc:'时间:',st:'GROK赌注:',cr:'➕ 创建比赛',jn:'🤝 加入',mv:'走法:',newG:'🔄 大厅',botG:'🤖 对战机器人',select:'选择时间',bal:'余额:',games:'游戏:',noG:'无游戏',myG:'我的游戏',join:'加入',copy:'链接已复制!',invite:'🔗 邀请',dep:'💰 存入',claim:'🏆 领取',approve:'✅ 授权',waiting:'⏳ 等待对手...',playing:'♟️ 游戏中',sync:'🔄 同步中...',review:'🔍 回顾',live:'▶️ 实时',prev:'⏪ 上一步',next:'⏩ 下一步',pot:'奖池:',payout:'奖金:',refund:'退款',drawRefund:'🤝 平局 — 赌注退还',winnerGets:'🏆 赢家通吃',needDep:'需存入',toJoin:'以加入',yourStake:'你的赌注:',oppStake:'对手赌注:',totalPot:'总奖池:',setTime:'选择时间:'},
hi:{t:'♟️ Chess4Crypto',s:'GROK PvP दांव',g:'👤 अतिथि',c:'🦊 कनेक्ट',k:'💰 GROK',p:'👤 प्रोफ़ाइल',l:'🚪 बाहर',y:'👤 आप',b:'🤖 बॉट',yt:'♟️ आपकी बारी!',bt:'🤖 बॉट सोच रहा (3से)...',w:'🏆 आप जीते!',x:'😔 आप हारे',d:'🤝 ड्रॉ',tp:'⏰ बॉट जीता',tb:'⏰ आप जीते',cn:'✅ कनेक्ट',cl:'बंद',cp:'📋 कॉपी',cd:'✅ कॉपी',gt:'💰 GROK खरीदें',g1:'1. लिंक पर जाएं और BNB वॉलेट कनेक्ट करें (गैस के लिए BNB चाहिए)।',g2:'2. GROK खरीदें।',g3:'3. वॉलेट में एड्रेस जोड़ें:',ln:'🇮🇳 हिंदी',th:'🎨 थीम',tm:{c:'🏛️ क्लासिक',w:'🪵 लकड़ी',n:'💜 नियॉन',o:'🌊 महासागर',s:'🌅 सूर्यास्त',m:'⚪ मिनिमल'},tc:'समय:',st:'GROK दांव:',cr:'➕ मैच बनाएं',jn:'🤝 जुड़ें',mv:'चाल:',newG:'🔄 लॉबी',botG:'🤖 बॉट से',select:'समय',bal:'शेष:',games:'गेम्स:',noG:'कोई नहीं',myG:'मेरे',join:'जुड़ें',copy:'कॉपी!',invite:'🔗 आमंत्रण',dep:'💰 जमा',claim:'🏆 क्लेम',approve:'✅ मंजूरी',waiting:'⏳ प्रतीक्षा...',playing:'♟️ खेल चल रहा',sync:'🔄 सिंक...',review:'🔍 इतिहास',live:'▶️ लाइव',prev:'⏪ पीछे',next:'⏩ आगे',pot:'पॉट:',payout:'जीत:',refund:'वापसी',drawRefund:'🤝 ड्रॉ — दांव वापस',winnerGets:'🏆 विजेता सब ले जाता है',needDep:'जमा करें',toJoin:'शामिल होने के लिए',yourStake:'आपका दांव:',oppStake:'प्रतिद्वंदी दांव:',totalPot:'कुल पॉट:',setTime:'समय चुनें:'}
}

const THEMES={c:{l:'#eeeed2',d:'#769656',n:'🏛️ Classic'},w:{l:'#f0d9b5',d:'#b58863',n:'🪵 Wood'},n:{l:'#1a1a2e',d:'#16213e',n:'💜 Neon'},o:{l:'#e0f7fa',d:'#006064',n:'🌊 Ocean'},s:{l:'#fff3e0',d:'#e65100',n:'🌅 Sunset'},m:{l:'#e0e0e0',d:'#757575',n:'⚪ Minimal'}}
const TIME_OPTIONS=[5,15,30,60,1440]
// ✅ Разрешённые ставки в GROK
const STAKE_OPTIONS=[500,1000,5000,10000,25000,50000,100000,250000]
const fmtTime=s=>{const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return h>0?`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`:`${m}:${String(sec).padStart(2,'0')}`}
const GROK_LINK='https://four.meme/token/0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444?code=AHGX96R5GHK9'
const GROK_ADDR='0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444'
const CHESS_CONTRACT='0xB77ED8144d328A270994B157700Ee28AfD8A3a5b'

const CHESS_ABI=[{"inputs":[{"internalType":"address","name":"_grokToken","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"grokToken","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"gameId","type":"bytes32"}],"name":"create","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"gameId","type":"bytes32"}],"name":"deposit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"gameId","type":"bytes32"},{"internalType":"address","name":"winner","type":"address"},{"internalType":"bool","name":"isDraw","type":"bool"}],"name":"finish","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"games","outputs":[{"internalType":"address","name":"creator","type":"address"},{"internalType":"address","name":"challenger","type":"address"},{"internalType":"uint256","name":"stake","type":"uint256"},{"internalType":"bool","name":"cPaid","type":"bool"},{"internalType":"bool","name":"hPaid","type":"bool"},{"internalType":"address","name":"winner","type":"address"},{"internalType":"bool","name":"done","type":"bool"},{"internalType":"bool","name":"isDraw","type":"bool"},{"internalType":"uint256","name":"createdAt","type":"uint256"}],"stateMutability":"view","type":"function"}]
const ERC20_ABI=[{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]

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
const[gameState,setGameState]=useState('idle')
const[remoteFen,setRemoteFen]=useState(null)
const[isRemoteTurn,setIsRemoteTurn]=useState(false)
const[syncStatus,setSyncStatus]=useState('')
const[currentMoveIdx,setCurrentMoveIdx]=useState(-1)
const[isReviewMode,setIsReviewMode]=useState(false)
const[liveFen,setLiveFen]=useState(null)
const[userBalance,setUserBalance]=useState(0)
const[activeGames,setActiveGames]=useState([])

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
const unsubscribeRef=useRef(null)
const botTimerRef=useRef(null)

const{writeContract:approveWrite,writeContract:depositWrite,writeContract:claimWrite}=useWriteContract()
const{data:grokBalance}=useReadContract({address:GROK_ADDR,abi:ERC20_ABI,functionName:'balanceOf',args:[address||'0x0000000000000000000000000000000000000000'],watch:true})

// 📏 Ресайз
useEffect(()=>{const r=()=>setBs(Math.min(window.innerWidth*0.9,400));window.addEventListener('resize',r);return()=>window.removeEventListener('resize',r)},[])

// 💰 Обновление баланса при подключении
useEffect(()=>{if(address&&grokBalance!==undefined){setUserBalance(Number(formatUnits(grokBalance,18)))}},[address,grokBalance])

// ⏱️ ТАЙМЕР
useEffect(()=>{if(timerRef.current)clearInterval(timerRef.current);if(!timerActive||gameOver||gameState!=='playing'||isReviewMode)return;timerRef.current=setInterval(()=>{if(timerActive==='player'){setPTime(prev=>{if(prev<=1){clearInterval(timerRef.current);setGameOver(true);setWinner('bot');setMsg(t('tp'));return 0}return prev-1})}else{setBTime(prev=>{if(prev<=1){clearInterval(timerRef.current);setGameOver(true);setWinner('player');setMsg(t('tb'));return 0}return prev-1})}},1000);return()=>clearInterval(timerRef.current)},[timerActive,gameOver,t,gameState,isReviewMode])

// 🔐 Авто-переход в профиль при подключении
useEffect(()=>{if(isConnected&&address&&view==='menu'){setMsg(t('cn'));setView('profile')}},[isConnected,address,view,t])

// 🔗 Обработка приглашения из URL
useEffect(()=>{
  const params=new URLSearchParams(window.location.search)
  const gid=params.get('game'),stake=params.get('stake'),time=params.get('time')
  if(gid){
    const parsedStake=parseInt(stake)||5000,parsedTime=parseInt(time)||15
    setPendingJoin({id:gid,stake:parsedStake,time:parsedTime})
    setView('profile');setProfileTab('lobby')
    setMsg(`${t('needDep')} ${parsedStake} GROK ${t('toJoin')}`)
  }
},[])

// 🔄 Загрузка активных игр для табло
useEffect(()=>{
  if(!address)return
  const loadActiveGames=async()=>{
    try{
      const{data,error}=await supabase.from('games').select('*').or(`creator.eq.${address},challenger.eq.${address}`).in('status',['playing','waiting']).order('created_at',{ascending:false}).limit(10)
      if(error)throw error
      setActiveGames(data||[])
    }catch(e){console.warn('Load games failed:',e.message)}
  }
  loadActiveGames()
  const interval=setInterval(loadActiveGames,15000)
  return()=>clearInterval(interval)
},[address])

const guest=()=>{setMsg(t('g'));resetGame();startGame()}
const buyGrok=()=>setGrok(true)
const langNext=()=>setLang(l=>({ru:'en',en:'de',de:'fr',fr:'es',es:'zh',zh:'hi',hi:'ru'})[l])
const copyAddr=()=>{if(navigator.clipboard){navigator.clipboard.writeText(GROK_ADDR);setCop(true);setTimeout(()=>setCop(false),2000)}}
const connectWallet=()=>open()

const resetGame=()=>{
  gameRef.current.reset();setFen(gameRef.current.fen());setHist([gameRef.current.fen()]);setMi(0);setIsPlayerTurn(true);setGameOver(false);setWinner(null);setMoveHistory([]);setSelectedSq(null);setPossibleMoves([]);setIsDeposited(false);setGameState('idle');setRemoteFen(null);setIsRemoteTurn(false);setCurrentMoveIdx(-1);setIsReviewMode(false);setLiveFen(null)
  if(botTimerRef.current){clearTimeout(botTimerRef.current);botTimerRef.current=null}
  if(unsubscribeRef.current){unsubscribeRef.current();unsubscribeRef.current=null}
}

// 🎲 Старт игры (использует выбранное время timeCtrl)
const startGame=()=>{
  const gameTime=timeCtrl*60; // Берёт время из state
  setPTime(gameTime);setBTime(gameTime);setTimerActive('player');setView('game');setGameState('playing')
}

// 🔐 Approve GROK
const handleApprove=()=>{
  if(!isConnected||CHESS_CONTRACT==='0x0000000000000000000000000000000000000000'){setMsg('⚠️ Deploy contract first');return}
  approveWrite({address:GROK_ADDR,abi:ERC20_ABI,functionName:'approve',args:[CHESS_CONTRACT,parseUnits(createStake.toString(),18)]},{
    onSuccess:()=>{setMsg('✅ GROK approved');setTimeout(()=>handleDeposit(),1000)},
    onError:(e)=>setMsg('❌ '+e.message)
  })
}

// 💰 Deposit
const handleDeposit=()=>{
  if(!gameId){setMsg('⚠️ Create or join first');return}
  depositWrite({address:CHESS_CONTRACT,abi:CHESS_ABI,functionName:'deposit',args:[gameId]},{
    onSuccess:()=>{setIsDeposited(true);setMsg('✅ Deposited. Waiting for opponent.');setGameState('waiting_funds')},
    onError:(e)=>setMsg('❌ '+e.message)
  })
}

// 🏆 Create Match
const handleCreateMatch=async()=>{
  if(!isConnected){setMsg('⚠️ '+t('cn'));return}
  const newId='game_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)
  setGameId(newId)
  try{await createGameRecord(newId,address,createStake,timeCtrl);setMsg(t('sync'))}catch(e){console.warn('Supabase create failed:',e)}
  const link=`${window.location.origin}${window.location.pathname}?game=${newId}&stake=${createStake}&time=${timeCtrl}`
  setInviteLink(link)
  if(navigator.clipboard)navigator.clipboard.writeText(link)
  setMsg('🔗 Link copied! Share it.')
  setupGameSubscription(newId)
  handleApprove()
}

// 🤝 Join Match
const handleJoinMatch=async()=>{
  if(!isConnected||!pendingJoin){setMsg('⚠️ Open invite link');return}
  const{id,stake,time}=pendingJoin
  setGameId(id);setCreateStake(stake);setTimeCtrl(time)
  try{await updateGameStatus(id,{challenger:address,status:'playing',updated_at:new Date()});setMsg(t('sync'))}catch(e){console.warn('Supabase update failed:',e)}
  setupGameSubscription(id)
  handleApprove()
}

// 🔗 Подписка на Realtime
const setupGameSubscription=(id)=>{
  if(unsubscribeRef.current)unsubscribeRef.current()
  unsubscribeRef.current=subscribeToGame(id,{
    onGameUpdate:(game)=>{
      if(game.status==='playing'&&!game.hPaid)setMsg(t('waiting'))
      else if(game.status==='playing'&&game.hPaid){setMsg('♟️ Game started!');setGameState('playing')}
    },
    onMove:(move)=>{
      if(move.player!==address&&!isReviewMode){
        setSyncStatus('🔄 Receiving move...')
        setTimeout(()=>{
          try{
            gameRef.current.move({from:move.from_sq,to:move.to_sq,promotion:'q'})
            const newFen=gameRef.current.fen();setFen(newFen);setLiveFen(newFen);setHist(h=>[...h,newFen]);setMoveHistory(mh=>[...mh,{san:move.san,from:move.from_sq,to:move.to_sq}]);setMi(i=>i+1);setCurrentMoveIdx(i=>i+1);setIsPlayerTurn(true);setTimerActive('player');setSyncStatus('')
            if(gameRef.current.isCheckmate()){setGameOver(true);setWinner(address);handleClaim(false)}
            else if(gameRef.current.isDraw()){setGameOver(true);setWinner(null);handleClaim(true)}
            else setMsg(t('yt'))
          }catch(e){console.warn('Move apply failed:',e)}
        },300)
      }
    }
  })
}

// 🏁 Claim — ✅ ЗАЩИТА ОТ ОШИБКИ "Connector not connected"
const handleClaim=(isDraw)=>{
  if(!gameId){setMsg('⚠️ Game not finished');return}
  
  // ✅ ИСПРАВЛЕНИЕ: Если кошелёк НЕ подключен (гостевой режим), не пытаемся вызвать смарт-контракт
  if(!isConnected||!address){
    console.warn("Guest mode: skipping contract claim")
    setMsg(isDraw?t('drawRefund'):t('winnerGets'))
    setGameState('idle')
    return
  }
  
  claimWrite({address:CHESS_CONTRACT,abi:CHESS_ABI,functionName:'finish',args:[gameId,address,isDraw]},{
    onSuccess:()=>{
      if(isDraw){setMsg(t('drawRefund'))}
      else{setMsg(`${t('winnerGets')} ${createStake*2} GROK!`)}
      setGameState('idle')
    },
    onError:(e)=>setMsg('❌ '+e.message)
  })
}

// 🤖 Ход бота (ровно 3 секунды)
const botMove=useCallback(()=>{
  if(gameOver||gameRef.current.isGameOver()||gameState!=='playing'||isRemoteTurn||isReviewMode)return
  const moves=gameRef.current.moves({verbose:true});if(!moves.length)return
  let chosenMove;const rand=Math.random()
  if(rand<0.7){chosenMove=moves[Math.floor(Math.random()*moves.length)]}
  else{const captures=moves.filter(m=>m.captured);if(captures.length>0){chosenMove=captures[Math.floor(Math.random()*captures.length)]}else{chosenMove=moves[Math.floor(Math.random()*moves.length)]}}
  gameRef.current.move(chosenMove);const san=gameRef.current.history({verbose:true}).pop()?.san||`${chosenMove.from}${chosenMove.to}`
  const newFen=gameRef.current.fen();setFen(newFen);setLiveFen(newFen);setHist(h=>[...h,newFen]);setMoveHistory(mh=>[...mh,{san,from:chosenMove.from,to:chosenMove.to}]);setMi(i=>i+1);setCurrentMoveIdx(i=>i+1);setIsPlayerTurn(true);setTimerActive('player')
  if(gameRef.current.isCheckmate()){setGameOver(true);setWinner('bot');setMsg(t('x'))}
  else if(gameRef.current.isDraw()){setGameOver(true);setWinner(null);handleClaim(true)}
  else setMsg(t('yt'))
},[gameOver,t,gameState,isRemoteTurn,isReviewMode])

// ♟️ Клик по клетке
const onSqClick=useCallback((sq)=>{
  if(gameOver||gameState!=='playing'||!isPlayerTurn||isRemoteTurn||isReviewMode)return
  const piece=gameRef.current.get(sq)
  if(piece&&piece.color===(isPlayerTurn?'w':'b')){setSelectedSq(sq);const moves=gameRef.current.moves({square:sq,verbose:true});setPossibleMoves(moves.map(m=>m.to));return}
  if(selectedSq&&possibleMoves.includes(sq)){onDrop(selectedSq,sq);setSelectedSq(null);setPossibleMoves([]);return}
  setSelectedSq(null);setPossibleMoves([])
},[gameOver,isPlayerTurn,selectedSq,possibleMoves,gameState,isRemoteTurn,isReviewMode])

// ♟️ Ход игрока + бот через 3 сек
const onDrop=useCallback((src,tgt)=>{
  if(!isPlayerTurn||gameOver||gameState!=='playing'||isRemoteTurn||isReviewMode)return false
  try{
    const res=gameRef.current.move({from:src,to:tgt,promotion:'q'});if(!res)return false
    const san=gameRef.current.history({verbose:true}).pop()?.san||`${src}${tgt}`;const newFen=gameRef.current.fen()
    setFen(newFen);setLiveFen(newFen);setHist(h=>[...h,newFen]);setMoveHistory(mh=>[...mh,{san,from:src,to:tgt}]);setMi(i=>i+1);setCurrentMoveIdx(i=>i+1);setIsPlayerTurn(false);setTimerActive('bot');setSelectedSq(null);setPossibleMoves([])
    if(gameId&&address){setSyncStatus('🔄 Sending move...');recordMove(gameId,address,src,tgt,san,newFen).then(()=>setSyncStatus('')).catch(e=>{console.warn('Move sync failed:',e);setSyncStatus('')})}
    if(gameRef.current.isCheckmate()){setGameOver(true);setWinner(address);handleClaim(false)}
    else if(gameRef.current.isDraw()){setGameOver(true);setWinner(null);handleClaim(true)}
    else{setMsg(t('bt'));if(botTimerRef.current)clearTimeout(botTimerRef.current);botTimerRef.current=setTimeout(()=>{botMove()},3000)}
    return true
  }catch{return false}
},[isPlayerTurn,gameOver,gameState,isRemoteTurn,isReviewMode,gameId,address,botMove,t])

// 🔄 Навигация по ходам
const goToMove=(idx)=>{if(idx<0||idx>=hist.length)return;setCurrentMoveIdx(idx);setFen(hist[idx]);setIsReviewMode(idx<hist.length-1);setIsPlayerTurn(idx%2===0)}
const prevMove=()=>{if(currentMoveIdx>0)goToMove(currentMoveIdx-1)}
const nextMove=()=>{if(currentMoveIdx<hist.length-1)goToMove(currentMoveIdx+1);else resumeLive()}
const resumeLive=()=>{if(liveFen){setFen(liveFen);setCurrentMoveIdx(hist.length-1);setIsReviewMode(false);setIsPlayerTurn(hist.length%2===1);setMsg(t('live'))}}

// 🎨 Подсветка
const sqStyles=useMemo(()=>{const styles={};if(selectedSq&&!isReviewMode){styles[selectedSq]={backgroundColor:'rgba(255,255,0,0.4)'}};possibleMoves.forEach(sq=>{if(!isReviewMode)styles[sq]={backgroundColor:'rgba(20,85,30,0.5)',backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.9) 25%,transparent 25%)',backgroundSize:'14px 14px',backgroundPosition:'center'}});return styles},[selectedSq,possibleMoves,isReviewMode])

const Btn=({c,o,bg,dis,st})=>(<button onClick={o}disabled={dis}style={{padding:'0.8rem 1.2rem',background:bg||'#3b82f6',color:'#fff',border:'none',borderRadius:'10px',cursor:dis?'not-allowed':'pointer',fontSize:'1rem',fontWeight:'600',opacity:dis?0.5:1,...st}}>{c}</button>)
const Timer=({l,t,a})=>(<div style={{background:a?'#059669':'#1e293b',padding:'10px 20px',borderRadius:'10px',color:'#fff',textAlign:'center',border:a?'2px solid #34d399':'1px solid #334155',width:'45%'}}><div style={{fontSize:'0.85rem',opacity:0.8}}>{l}</div><div style={{fontSize:'1.6rem',fontWeight:'bold',fontFamily:'monospace'}}>{fmtTime(t)}</div></div>)

// ============================================================================
// 🖥️ РЕНДЕР
// ============================================================================
return(<div style={{minHeight:'100vh',background:'#0f172a',color:'#f1f5f9',fontFamily:'system-ui',padding:'1rem'}}>{view==='menu'&&<div style={{maxWidth:'400px',margin:'0 auto',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'80vh',gap:'1rem'}}>
<h1 style={{color:'#fbbf24'}}>{t('t')}</h1>

{/* ⏱️ ✅ НОВЫЙ БЛОК: ВЫБОР ВРЕМЕНИ ИГРЫ В МЕНЮ */}
<div style={{background:'#1e293b',padding:'0.8rem',borderRadius:'12px',width:'100%',textAlign:'center'}}>
<div style={{color:'#94a3b8',marginBottom:'0.5rem',fontSize:'0.9rem'}}>{t('setTime')}</div>
<select value={timeCtrl}onChange={e=>setTimeCtrl(Number(e.target.value))}style={{width:'100%',padding:'0.6rem',background:'#0f172a',color:'#fff',border:'1px solid #334155',borderRadius:'8px',fontSize:'1rem'}}>
{TIME_OPTIONS.map(min=>(<option key={min}value={min}>{min===1440?'24 часа':`${min} мин`}</option>))}
</select>
</div>

<Btn c={t('g')}o={guest}bg="#3b82f6"/><Btn c={t('c')}o={connectWallet}bg="#f59e0b"/><Btn c={t('k')}o={buyGrok}bg="#10b981"/><Btn c={t('ln')}o={langNext}bg="#475569"/>{msg&&<div style={{padding:'0.5rem',background:'#1e293b',borderRadius:'8px',color:'#60a5fa'}}>{msg}</div>}</div>}

{view==='profile'&&<div style={{maxWidth:'600px',margin:'0 auto',display:'flex',flexDirection:'column',gap:'1rem'}}><div style={{background:'#1e293b',padding:'1rem',borderRadius:'12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><div style={{fontWeight:'bold',fontSize:'1.1rem'}}>{address?.slice(0,6)}...{address?.slice(-4)}</div><div style={{color:'#94a3b8',fontSize:'0.9rem'}}>{t('bal')} <span style={{color:'#fbbf24'}}>{userBalance.toLocaleString()} GROK</span></div></div><div style={{display:'flex',gap:'0.5rem'}}><Btn c={t('l')}o={()=>{disconnect();setView('menu')}}bg="#ef4444"/></div></div>

{/* 📊 ТАБЛО ИГР С БАЛАНСАМИ */}
{activeGames.length>0&&<div style={{background:'#1e293b',padding:'1rem',borderRadius:'12px'}}><h3 style={{color:'#fbbf24',margin:'0 0 0.8rem 0'}}>{t('games')}</h3>
{activeGames.map(g=>{
  const totalPot=(g.stake||0)*((g.cPaid?1:0)+(g.hPaid?1:0));
  const isCreator=g.creator===address;
  const myPaid=isCreator?g.cPaid:g.hPaid;
  const oppPaid=isCreator?g.hPaid:g.cPaid;
  const isDone=g.status==='finished'||g.status==='draw';
  const isDraw=g.status==='draw';
  return(
    <div key={g.id}style={{background:'#0f172a',padding:'0.8rem',borderRadius:'8px',marginBottom:'0.5rem'}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}>
        <span style={{fontWeight:'bold'}}>ID: ...{g.id.slice(-6)}</span>
        <span style={{color:g.status==='playing'?'#3b82f6':'#94a3b8'}}>{g.status}</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',fontSize:'0.9rem'}}>
        <div><span style={{color:'#94a3b8'}}>{t('yourStake')}</span><div style={{color:'#fbbf24',fontWeight:'bold'}}>{g.stake?.toLocaleString()||0} GROK {myPaid?'✅':'⏳'}</div></div>
        <div><span style={{color:'#94a3b8'}}>{t('oppStake')}</span><div style={{color:'#fbbf24',fontWeight:'bold'}}>{g.stake?.toLocaleString()||0} GROK {oppPaid?'✅':'⏳'}</div></div>
      </div>
      <div style={{marginTop:'0.5rem',paddingTop:'0.5rem',borderTop:'1px solid #334155'}}>
        <span style={{color:'#94a3b8'}}>{t('totalPot')}</span>
        <div style={{color:'#fbbf24',fontSize:'1.2rem',fontWeight:'bold'}}>{totalPot.toLocaleString()} GROK</div>
        <div style={{fontSize:'0.8rem',color:'#60a5fa',marginTop:'0.3rem'}}>
          {isDone?(isDraw?t('drawRefund'):t('winnerGets')):t('waiting')}
        </div>
      </div>
      {!isDone&&myPaid&&(
        <Btn c={t('newG')}o={()=>{setGameId(g.id);setCreateStake(g.stake);setTimeCtrl(g.time_limit||15);setView('game');setGameState('playing');}}bg="#8b5cf6"st={{marginTop:'0.5rem',width:'100%'}}/>
      )}
    </div>
  );
})}</div>}

<div style={{display:'flex',gap:'0.5rem'}}>{['lobby','my','create'].map(tab=>(<Btn key={tab}c={tab==='lobby'?t('jn'):tab==='my'?t('myG'):t('cr')}o={()=>setProfileTab(tab)}bg={profileTab===tab?'#3b82f6':'#334155'}/>))}<Btn c={t('ln')}o={langNext}bg="#475569"/></div>

{profileTab==='create'&&<div style={{background:'#1e293b',padding:'1rem',borderRadius:'12px'}}><div style={{marginBottom:'0.5rem'}}><label>{t('st')}</label><div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>{STAKE_OPTIONS.map(a=>(<Btn key={a}c={a.toLocaleString()}o={()=>setCreateStake(a)}bg={createStake===a?'#10b981':'#334155'}/>))}</div></div><div style={{marginBottom:'0.5rem'}}><label>{t('select')}</label><div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>{TIME_OPTIONS.map(min=>(<Btn key={min}c={min===1440?'24 ч':`${min} мин`}o={()=>setTimeCtrl(min)}bg={timeCtrl===min?'#10b981':'#334155'}/>))}</div></div><Btn c={t('cr')}o={handleCreateMatch}bg="#10b981"st={{width:'100%',marginTop:'0.5rem'}}/>{inviteLink&&<div style={{marginTop:'0.5rem',fontSize:'0.8rem',background:'#0f172a',padding:'0.5rem',borderRadius:'6px',wordBreak:'break-all'}}>{inviteLink}</div>}</div>}

{profileTab==='lobby'&&<div style={{background:'#1e293b',padding:'1rem',borderRadius:'12px'}}>{pendingJoin?<div><p style={{color:'#fbbf24',fontWeight:'bold'}}>{t('invite')}</p><p>{t('needDep')} <strong>{pendingJoin.stake.toLocaleString()} GROK</strong> {t('toJoin')}</p><p style={{color:'#94a3b8',fontSize:'0.9rem'}}>{t('tc')}: {pendingJoin.time} мин</p><Btn c={t('join')}o={handleJoinMatch}bg="#10b981"st={{width:'100%',marginTop:'0.5rem'}}/></div>:<p style={{color:'#94a3b8'}}>{t('noG')}</p>}</div>}

{profileTab==='my'&&<div style={{background:'#1e293b',padding:'1rem',borderRadius:'12px'}}><p>Game ID: {gameId||'-'}</p><p>Status: {gameState} {syncStatus&&<span style={{color:'#60a5fa'}}>{syncStatus}</span>}</p>{gameState==='playing'&&<Btn c="🎮 Play"o={()=>setView('game')}bg="#8b5cf6"st={{width:'100%'}}/>}{gameOver&&<Btn c={isReviewMode?t('claim'):t('newG')}o={()=>{if(isReviewMode){handleClaim(false)}else{resetGame();setView('profile')}}}bg="#f59e0b"st={{width:'100%',marginTop:'0.5rem'}}/>}</div>}</div>}

{view==='game'&&<div style={{maxWidth:'420px',margin:'0 auto'}}><div style={{display:'flex',justifyContent:'space-around',marginBottom:'0.5rem'}}><Timer l={t('y')}t={pTime}a={timerActive==='player'}/><Timer l={t('b')}t={bTime}a={timerActive==='bot'}/></div>{syncStatus&&<div style={{textAlign:'center',color:'#60a5fa',fontSize:'0.9rem',marginBottom:'0.3rem'}}>{syncStatus}</div>}{msg&&<div style={{color:'#38bdf8',textAlign:'center',marginBottom:'0.3rem'}}>{msg}</div>}{isReviewMode&&<div style={{textAlign:'center',background:'#1e293b',padding:'0.5rem',borderRadius:'8px',marginBottom:'0.5rem',color:'#fbbf24'}}>{t('review')} • {currentMoveIdx+1}/{hist.length}</div>}<div style={{background:'#1e293b',padding:'8px',borderRadius:'12px'}}><Chessboard position={fen}onPieceDrop={isReviewMode?null:onDrop}onSquareClick={isReviewMode?null:onSqClick}boardWidth={bs}customSquareStyles={sqStyles}customDarkSquareStyle={{backgroundColor:THEMES[theme].d}}customLightSquareStyle={{backgroundColor:THEMES[theme].l}}/></div>{moveHistory.length>0&&<div style={{display:'flex',gap:'0.5rem',marginTop:'0.5rem',justifyContent:'center',flexWrap:'wrap'}}><Btn c={t('prev')}o={prevMove}dis={currentMoveIdx<=0}bg="#475569"/><Btn c={t('next')}o={nextMove}dis={currentMoveIdx>=hist.length-1}bg="#475569"/>{isReviewMode&&<Btn c={t('live')}o={resumeLive}bg="#10b981"/>}</div>}<div style={{display:'flex',gap:'0.5rem',marginTop:'0.5rem',justifyContent:'center'}}><Btn c={t('newG')}o={()=>{resetGame();setView('profile')}}bg="#3b82f6"/><Btn c={t('botG')}o={()=>{resetGame();startGame()}}bg="#10b981"/><select value={theme}onChange={e=>setTheme(e.target.value)}style={{padding:'0.5rem',background:'#1e293b',color:'#fff',border:'none',borderRadius:'6px'}}>{Object.entries(THEMES).map(([k,v])=>(<option key={k}value={k}>{v.n}</option>))}</select></div>{moveHistory.length>0&&<div style={{marginTop:'0.5rem',background:'#1e293b',padding:'0.5rem',borderRadius:'8px',maxHeight:'100px',overflowY:'auto',fontSize:'0.8rem'}}>{moveHistory.map((m,i)=>(<span key={i}style={{marginRight:'0.5rem',background:currentMoveIdx===i?'#3b82f6':'#0f172a',padding:'0.2rem 0.4rem',borderRadius:'4px'}}>{i+1}.{m.san}</span>))}</div>}</div>}

{grok&&<div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.9)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}onClick={()=>setGrok(false)}><div style={{background:'#1e293b',padding:'1.5rem',borderRadius:'16px',maxWidth:'360px'}}onClick={e=>e.stopPropagation()}><h3 style={{color:'#fbbf24'}}>{t('gt')}</h3><ol style={{color:'#cbd5e1',margin:'1rem 0',paddingLeft:'1.2rem'}}><li>{t('g1')}<br/><a href={GROK_LINK}target="_blank"rel="noopener"style={{color:'#60a5fa',wordBreak:'break-all'}}>{GROK_LINK}</a></li><li>{t('g2')}</li><li>{t('g3')}<br/><code style={{background:'#0f172a',padding:'0.3rem',borderRadius:'4px',display:'block',margin:'0.3rem 0',fontSize:'0.8rem'}}>{GROK_ADDR}</code><Btn c={t('cp')}o={copyAddr}bg="#3b82f6"st={{marginTop:'0.3rem'}}/></li></ol><a href={GROK_LINK}target="_blank"style={{display:'block',background:'#f59e0b',color:'#000',padding:'0.6rem',borderRadius:'8px',textAlign:'center',textDecoration:'none'}}>🔗 four.meme</a><Btn c={t('cl')}o={()=>setGrok(false)}bg="#475569"st={{marginTop:'0.5rem',width:'100%'}}/></div></div>}
{msg&&<div style={{position:'fixed',bottom:'1rem',left:'50%',transform:'translateX(-50%)',background:'#3b82f6',color:'#fff',padding:'0.6rem 1rem',borderRadius:'8px',zIndex:1000}}>{msg}</div>}</div>)
}