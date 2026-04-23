import{useState,useEffect,useRef,useCallback,useMemo}from'react'
import{Chess}from'chess.js'
import{Chessboard}from'react-chessboard'
import{useAccount,useDisconnect,useWriteContract,useReadContract,useWaitForTransactionReceipt}from'wagmi'
import{useWeb3Modal}from'@web3modal/wagmi/react'
import{parseUnits,formatUnits,keccak256,stringToBytes}from'viem'
import{supabase,createGameRecord,updateGameStatus,subscribeToGame,getProfile,updateProfile,listAvailableGames,recordMove}from'./supabase'

const COLORS={bg:'#00695c',cardBg:'#004d40',btnBlue:'#1a237e',btnOrange:'#f57c00',text:'#ffffff',textSec:'#b2dfdb',accent:'#ffb74d'}

// ✅ 7 ЯЗЫКОВ С ПОЛНЫМ НАБОРОМ КЛЮЧЕЙ
const LANG={
ru:{t:'♟️ Chess4Crypto',s:'PvP ставки в GROK',g:'👤 Гостевой',c:'🦊 Войти',k:'💰 Купить GROK',p:'👤 Профиль',l:'🚪 Выйти',y:'👤 Вы',b:'🤖 Бот',yt:'♟️ Ваш ход!',bt:'🤖 Бот думает (3с)...',w:'🏆 ПОБЕДА!',x:'😔 Поражение',d:'🤝 Ничья',tp:'⏰ Бот выиграл',tb:'⏰ Вы выиграли',cn:'✅ Подключено',cl:'Закрыть',cp:'📋 Копировать',cd:'✅ Скопировано!',gt:'💰 Как купить GROK',g1:'1. Перейдите по ссылке и подключите кошелёк в сети BNB.',g2:'2. Купите монету GROK.',g3:'3. Адрес контракта:',ln:'🇷🇺 RU',th:'🎨 Тема',tm:{c:'🏛️ Классика',w:'🪵 Дерево',n:'💜 Неон',o:'🌊 Океан',s:'🌅 Закат',m:'⚪ Минимал'},tc:'Время:',st:'Ставка:',cr:'➕ Создать матч',jn:'🤝 Присоединиться',mv:'Ходы:',newG:'🔄 В лобби',botG:'🤖 С ботом',select:'Время',bal:'Баланс:',games:'Игры:',noG:'Нет игр',myG:'Мои игры',join:'Войти',copy:'Ссылка скопирована!',invite:'🔗 Приглашение',dep:'💰 Внести',claim:'🏆 Забрать',approve:'✅ Разрешить',waiting:'⏳ Ожидание соперника...',playing:'♟️ Игра идёт',sync:'🔄 Синхронизация...',review:'🔍 Просмотр',live:'▶️ В реальном времени',prev:'⏪ Назад',next:'⏩ Вперёд',pot:'Банк игры:',payout:'Выплата:',refund:'Возврат',drawRefund:'🤝 Ничья — ставки возвращены',winnerGets:'🏆 Победитель забирает весь банк',needDep:'Нужно внести',toJoin:'для присоединения',yourStake:'Ваша ставка:',oppStake:'Ставка соперника:',totalPot:'Общий банк:',setTime:'Выберите время:',approveTx:'1️⃣ Разрешаем контракт тратить GROK...',depositTx:'2️⃣ Переводим ставку в пул игры...',confirmingTx:'⏳ Ожидание подтверждения блокчейна...',successDep:'✅ Депозит подтверждён! Игра создана.',successJoin:'✅ Депозит внесён! Игра начинается.',errTx:'❌ Ошибка: ',errBal:'❌ Недостаточно GROK',claimBtn:'💰 Забрать выигрыш',victoryTitle:'🏆 Победа!',defeatTitle:'😔 Поражение',drawTitle:'🤝 Ничья',noMetaMask:'⚠️ Установите MetaMask/TrustWallet',playerProfile:'👤 Профиль',avatar:'🖼️ Аватар',name:'👤 Имя',bio:'📝 О себе',website:'🌐 Сайт',social:'🔗 Соцсеть',save:'💾 Сохранить',availableGames:'🎮 Доступные игры',guestInfo:'⏱️ Гостевой режим: бесплатно с ботом. Выберите время:',grokInstructions:'📖 Создание игры на GROK:\n• Нажмите "Создать матч".\n• Подтвердите Approve (разрешение) в кошельке.\n• Подтвердите Deposit (перевод ставки) в кошельке.\n• Дождитесь подтверждения блокчейна (~15 сек).\n• Средства поступают в пул игры на смарт-контракт 0xB77ED...3a5b.\n• Отправьте ссылку сопернику.\n• Победитель забирает весь банк!',txCancelled:'⚠️ Транзакция отменена',step1:'Шаг 1/2: Разрешение',step2:'Шаг 2/2: Депозит',clickToCopy:'📋 Нажмите для копирования',checkBalance:'🔍 Проверить баланс контракта',profileSaved:'✅ Профиль сохранён!',profileError:'❌ Ошибка сохранения профиля'},
en:{t:'♟️ Chess4Crypto',s:'GROK PvP Betting',g:'👤 Guest',c:'🦊 Connect',k:'💰 GROK',p:'👤 Profile',l:'🚪 Logout',y:'👤 You',b:'🤖 Bot',yt:'♟️ Your turn!',bt:'🤖 Bot thinks (3s)...',w:'🏆 YOU WIN!',x:'😔 Lost',d:'🤝 Draw',tp:'⏰ Bot wins',tb:'⏰ You win',cn:'✅ Connected',cl:'Close',cp:'📋 Copy',cd:'✅ Copied!',gt:'💰 Buy GROK',g1:'1. Follow link, connect BNB wallet.',g2:'2. Buy GROK.',g3:'3. Contract address:',ln:'🇬🇧 EN',th:'🎨 Theme',tm:{c:'🏛️ Classic',w:'🪵 Wood',n:'💜 Neon',o:'🌊 Ocean',s:'🌅 Sunset',m:'⚪ Minimal'},tc:'Time:',st:'Stake:',cr:'➕ Create Match',jn:'🤝 Join',mv:'Moves:',newG:'🔄 Lobby',botG:'🤖 Vs Bot',select:'Time',bal:'Balance:',games:'Games:',noG:'No games',myG:'My Games',join:'Join',copy:'Copied!',invite:'🔗 Invite',dep:'💰 Deposit',claim:'🏆 Claim Win',approve:'✅ Approve',waiting:'⏳ Waiting opponent...',playing:'♟️ Game in progress',sync:'🔄 Syncing...',review:'🔍 Review',live:'▶️ Live',prev:'⏪ Prev',next:'⏩ Next',pot:'Game Pot:',payout:'Payout:',refund:'Refund',drawRefund:'🤝 Draw — stakes refunded',winnerGets:'🏆 Winner takes entire pot',needDep:'Need to deposit',toJoin:'to join',yourStake:'Your stake:',oppStake:'Opponent stake:',totalPot:'Total pot:',setTime:'Select Time:',approveTx:'1️⃣ Approve GROK...',depositTx:'2️⃣ Deposit to pool...',confirmingTx:'⏳ Waiting for blockchain confirmation...',successDep:'✅ Deposit confirmed! Game created.',successJoin:'✅ Deposit paid! Game started.',errTx:'❌ Error: ',errBal:'❌ Insufficient GROK',claimBtn:'💰 Claim Winnings',victoryTitle:'🏆 Victory!',defeatTitle:'😔 Defeat',drawTitle:'🤝 Draw',noMetaMask:'⚠️ Install MetaMask/TrustWallet',playerProfile:'👤 Profile',avatar:'🖼️ Avatar',name:'👤 Name',bio:'📝 Bio',website:'🌐 Website',social:'🔗 Social',save:'💾 Save',availableGames:'🎮 Available Games',guestInfo:'⏱️ Guest: free vs bot. Select time:',grokInstructions:'📖 Create GROK game:\n• Click "Create Match".\n• Confirm Approve in wallet.\n• Confirm Deposit in wallet.\n• Wait for blockchain confirmation (~15s).\n• Funds go to game pool on contract 0xB77ED...3a5b.\n• Share link with opponent.\n• Winner takes all!',txCancelled:'⚠️ Transaction cancelled',step1:'Step 1/2: Approve',step2:'Step 2/2: Deposit',clickToCopy:'📋 Tap to copy',checkBalance:'🔍 Check contract balance',profileSaved:'✅ Profile saved!',profileError:'❌ Failed to save profile'},
de:{t:'♟️ Chess4Crypto',s:'GROK PvP',g:'👤 Gast',c:'🦊 Verbinden',k:'💰 GROK',p:'👤 Profil',l:'🚪 Exit',y:'👤 Du',b:'🤖 Bot',yt:'♟️ Dein Zug!',bt:'🤖 Bot denkt (3s)...',w:'🏆 GEWINN!',x:'😔 Verloren',d:'🤝 Remis',tp:'⏰ Bot gewinnt',tb:'⏰ Du gewinnst',cn:'✅ Verbunden',cl:'Schließen',cp:'📋 Kopieren',cd:'✅ Kopiert',gt:'💰 GROK kaufen',g1:'1. Link öffnen, BNB Wallet verbinden.',g2:'2. GROK kaufen.',g3:'3. Adresse hinzufügen:',ln:'🇩🇪 DE',th:'🎨 Design',tm:{c:'🏛️ Klassisch',w:'🪵 Holz',n:'💜 Neon',o:'🌊 Ozean',s:'🌅 Sonnenuntergang',m:'⚪ Minimal'},tc:'Zeit:',st:'Einsatz:',cr:'➕ Match',jn:'🤝 Beitreten',mv:'Züge:',newG:'🔄 Lobby',botG:'🤖 Vs Bot',select:'Zeit',bal:'Guthaben:',games:'Spiele:',noG:'Keine',myG:'Meine',join:'Beitreten',copy:'Kopiert!',invite:'🔗 Einladen',dep:'💰 Einzahlen',claim:'🏆 Auszahlen',approve:'✅ Genehmigen',waiting:'⏳ Warte...',playing:'♟️ Läuft',sync:'🔄 Sync...',review:'🔍 Verlauf',live:'▶️ Live',prev:'⏪ Zurück',next:'⏩ Vor',pot:'Spielbank:',payout:'Auszahlung:',refund:'Rückerstattung',drawRefund:'🤝 Remis — Einsätze zurück',winnerGets:'🏆 Sieger bekommt alles',needDep:'Einzahlen',toJoin:'zum Beitreten',yourStake:'Dein Einsatz:',oppStake:'Einsatz Gegner:',totalPot:'Gesamtbank:',setTime:'Zeit wählen:',approveTx:'⏳ Genehmigung...',depositTx:'💸 Einzahlung...',confirmingTx:'⏳ Bestätigung warten...',successDep:'✅ Einzahlung bestätigt!',successJoin:'✅ Einzahlung eingegangen!',errTx:'❌ Fehler: ',errBal:'❌ Guthaben reicht nicht',claimBtn:'💰 Gewinn abheben',victoryTitle:'🏆 Sieg!',defeatTitle:'😔 Niederlage',drawTitle:'🤝 Remis',noMetaMask:'⚠️ MetaMask nicht installiert',playerProfile:'👤 Spielerprofil',avatar:'🖼️ Avatar',name:'👤 Name',bio:'📝 Über mich',website:'🌐 Website',social:'🔗 Social',save:'💾 Speichern',availableGames:'🎮 Verfügbare Spiele',guestInfo:'⏱️ Gastmodus: kostenlos vs Bot. Zeit wählen:',grokInstructions:'📖 GROK-Spiel erstellen:\n• "Match erstellen" klicken.\n• Approve im Wallet bestätigen.\n• Deposit im Wallet bestätigen.\n• Bestätigung warten (~15s).\n• Mittel gehen an Pool im Contract 0xB77ED...3a5b.\n• Link an Gegner senden.\n• Sieger bekommt alles!',txCancelled:'⚠️ Transaktion abgebrochen',step1:'Schritt 1/2: Approve',step2:'Schritt 2/2: Deposit',clickToCopy:'📋 Zum Kopieren',checkBalance:'🔍 Contract-Guthaben prüfen',profileSaved:'✅ Profil gespeichert!',profileError:'❌ Speichern fehlgeschlagen'},
fr:{t:'♟️ Chess4Crypto',s:'Paris GROK PvP',g:'👤 Invité',c:'🦊 Connecter',k:'💰 GROK',p:'👤 Profil',l:'🚪 Quitter',y:'👤 Vous',b:'🤖 Bot',yt:'♟️ À vous!',bt:'🤖 Bot pense (3s)...',w:'🏆 GAGNÉ!',x:'😔 Perdu',d:'🤝 Nulle',tp:'⏰ Bot gagne',tb:'⏰ Vous gagnez',cn:'✅ Connecté',cl:'Fermer',cp:'📋 Copier',cd:'✅ Copié',gt:'💰 GROK',g1:'1. Suivre lien, connecter wallet BNB.',g2:'2. Acheter GROK.',g3:'3. Ajouter adresse:',ln:'🇫🇷 FR',th:'🎨 Thème',tm:{c:'🏛️ Classique',w:'🪵 Bois',n:'💜 Néon',o:'🌊 Océan',s:'🌅 Coucher',m:'⚪ Minimal'},tc:'Temps:',st:'Mise:',cr:'➕ Match',jn:'🤝 Rejoindre',mv:'Coups:',newG:'🔄 Lobby',botG:'🤖 Vs Bot',select:'Temps',bal:'Solde:',games:'Parties:',noG:'Aucune',myG:'Mes',join:'Rejoindre',copy:'Copié!',invite:'🔗 Inviter',dep:'💰 Déposer',claim:'🏆 Réclamer',approve:'✅ Approuver',waiting:'⏳ Attente...',playing:'♟️ En cours',sync:'🔄 Sync...',review:'🔍 Historique',live:'▶️ Live',prev:'⏪ Préc',next:'⏩ Suiv',pot:'Cagnotte:',payout:'Gain:',refund:'Remboursement',drawRefund:'🤝 Nulle — mises remboursées',winnerGets:'🏆 Le gagnant empoche tout',needDep:'Déposer',toJoin:'pour rejoindre',yourStake:'Votre mise:',oppStake:'Mise adversaire:',totalPot:'Cagnotte totale:',setTime:'Choisir temps:',approveTx:'⏳ Approbation...',depositTx:'💸 Dépôt...',confirmingTx:'⏳ Attente confirmation...',successDep:'✅ Dépôt accepté!',successJoin:'✅ Dépôt versé!',errTx:'❌ Erreur: ',errBal:'❌ Solde insuffisant',claimBtn:'💰 Réclamer les gains',victoryTitle:'🏆 Victoire!',defeatTitle:'😔 Défaite',drawTitle:'🤝 Nulle',noMetaMask:'⚠️ MetaMask non installé',playerProfile:'👤 Profil',avatar:'🖼️ Avatar',name:'👤 Nom',bio:'📝 Bio',website:'🌐 Site',social:'🔗 Social',save:'💾 Enregistrer',availableGames:'🎮 Parties disponibles',guestInfo:'⏱️ Mode invité: gratuit vs bot. Choisir temps:',grokInstructions:'📖 Créer partie GROK:\n• Cliquer "Créer".\n• Confirmer Approve dans wallet.\n• Confirmer Deposit dans wallet.\n• Attendre confirmation (~15s).\n• Fonds vont au pool sur contrat 0xB77ED...3a5b.\n• Envoyer lien à adversaire.\n• Gagnant empoche tout!',txCancelled:'⚠️ Transaction annulée',step1:'Étape 1/2: Approve',step2:'Étape 2/2: Deposit',clickToCopy:'📋 Appuyer pour copier',checkBalance:'🔍 Vérifier solde contrat',profileSaved:'✅ Profil enregistré!',profileError:'❌ Échec de l\'enregistrement'},
es:{t:'♟️ Chess4Crypto',s:'Apuestas GROK PvP',g:'👤 Invitado',c:'🦊 Conectar',k:'💰 GROK',p:'👤 Perfil',l:'🚪 Salir',y:'👤 Tú',b:'🤖 Bot',yt:'♟️ ¡Tu turno!',bt:'🤖 Bot piensa (3s)...',w:'🏆 ¡GANASTE!',x:'😔 Perdiste',d:'🤝 Empate',tp:'⏰ Bot gana',tb:'⏰ Ganas tú',cn:'✅ Conectado',cl:'Cerrar',cp:'📋 Copiar',cd:'✅ Copiado',gt:'💰 GROK',g1:'1. Ir al enlace, conectar wallet BNB.',g2:'2. Comprar GROK.',g3:'3. Añadir dirección:',ln:'🇪🇸 ES',th:'🎨 Tema',tm:{c:'🏛️ Clásico',w:'🪵 Madera',n:'💜 Neón',o:'🌊 Océano',s:'🌅 Atardecer',m:'⚪ Minimal'},tc:'Tiempo:',st:'Apuesta:',cr:'➕ Partida',jn:'🤝 Unirse',mv:'Movimientos:',newG:'🔄 Lobby',botG:'🤖 Vs Bot',select:'Tiempo',bal:'Saldo:',games:'Partidas:',noG:'Ninguna',myG:'Mis',join:'Unirse',copy:'¡Copiado!',invite:'🔗 Invitar',dep:'💰 Depositar',claim:'🏆 Reclamar',approve:'✅ Aprobar',waiting:'⏳ Espera...',playing:'♟️ En juego',sync:'🔄 Sync...',review:'🔍 Historial',live:'▶️ En vivo',prev:'⏪ Ant',next:'⏩ Sig',pot:'Bote:',payout:'Ganancia:',refund:'Devolución',drawRefund:'🤝 Empate — apuestas devueltas',winnerGets:'🏆 El ganador se lo lleva todo',needDep:'Depositar',toJoin:'para unirse',yourStake:'Tu apuesta:',oppStake:'Apuesta rival:',totalPot:'Bote total:',setTime:'Elegir tiempo:',approveTx:'⏳ Aprobando...',depositTx:'💸 Depositando...',confirmingTx:'⏳ Esperando confirmación...',successDep:'✅ Depósito aceptado!',successJoin:'✅ Depósito pagado!',errTx:'❌ Error: ',errBal:'❌ Saldo insuficiente',claimBtn:'💰 Reclamar premio',victoryTitle:'🏆 ¡Victoria!',defeatTitle:'😔 Derrota',drawTitle:'🤝 Empate',noMetaMask:'⚠️ MetaMask no instalado',playerProfile:'👤 Perfil',avatar:'🖼️ Avatar',name:'👤 Nombre',bio:'📝 Bio',website:'🌐 Web',social:'🔗 Social',save:'💾 Guardar',availableGames:'🎮 Partidas disponibles',guestInfo:'⏱️ Modo invitado: gratis vs bot. Elegir tiempo:',grokInstructions:'📖 Crear partida GROK:\n• Click "Crear".\n• Confirmar Approve en wallet.\n• Confirmar Deposit en wallet.\n• Esperar confirmación (~15s).\n• Fondos van al pool en contrato 0xB77ED...3a5b.\n• Enviar enlace a oponente.\n• ¡Ganador se lo lleva todo!',txCancelled:'⚠️ Transacción cancelada',step1:'Paso 1/2: Approve',step2:'Paso 2/2: Deposit',clickToCopy:'📋 Toca para copiar',checkBalance:'🔍 Verificar saldo contrato',profileSaved:'✅ Perfil guardado!',profileError:'❌ Error al guardar'},
zh:{t:'♟️ Chess4Crypto',s:'GROK PvP投注',g:'👤 访客',c:'🦊 连接',k:'💰 GROK',p:'👤 资料',l:'🚪 退出',y:'👤 你',b:'🤖 机器人',yt:'♟️ 轮到你!',bt:'🤖 机器人思考中 (3秒)...',w:'🏆 你赢了!',x:'😔 你输了',d:'🤝 平局',tp:'⏰ 机器人赢',tb:'⏰ 你赢了',cn:'✅ 已连接',cl:'关闭',cp:'📋 复制',cd:'✅ 已复制',gt:'💰 购买GROK',g1:'1. 点击链接连接BNB钱包。',g2:'2. 购买GROK。',g3:'3. 添加地址:',ln:'🇨🇳 中文',th:'🎨 主题',tm:{c:'🏛️ 经典',w:'🪵 木质',n:'💜 霓虹',o:'🌊 海洋',s:'🌅 日落',m:'⚪ 简约'},tc:'时间:',st:'GROK赌注:',cr:'➕ 创建比赛',jn:'🤝 加入',mv:'走法:',newG:'🔄 大厅',botG:'🤖 对战机器人',select:'选择时间',bal:'余额:',games:'游戏:',noG:'无游戏',myG:'我的游戏',join:'加入',copy:'链接已复制!',invite:'🔗 邀请',dep:'💰 存入',claim:'🏆 领取',approve:'✅ 授权',waiting:'⏳ 等待对手...',playing:'♟️ 游戏中',sync:'🔄 同步中...',review:'🔍 回顾',live:'▶️ 实时',prev:'⏪ 上一步',next:'⏩ 下一步',pot:'奖池:',payout:'奖金:',refund:'退款',drawRefund:'🤝 平局 — 赌注退还',winnerGets:'🏆 赢家通吃',needDep:'需存入',toJoin:'以加入',yourStake:'你的赌注:',oppStake:'对手赌注:',totalPot:'总奖池:',setTime:'选择时间:',approveTx:'⏳ 授权中...',depositTx:'💸 存入中...',confirmingTx:'⏳ 等待确认...',successDep:'✅ 存入成功！',successJoin:'✅ 赌注已支付！',errTx:'❌ 错误: ',errBal:'❌ GROK余额不足',claimBtn:'💰 领取奖金',victoryTitle:'🏆 胜利!',defeatTitle:'😔 失败',drawTitle:'🤝 平局',noMetaMask:'⚠️ 未安装 MetaMask',playerProfile:'👤 资料',avatar:'🖼️ 头像',name:'👤 名字',bio:'📝 简介',website:'🌐 网站',social:'🔗 社交',save:'💾 保存',availableGames:'🎮 可加入的游戏',guestInfo:'⏱️ 访客模式：免费对战机器人。选择时间：',grokInstructions:'📖 创建GROK对局:\n• 点击"创建"。\n• 在钱包确认 Approve。\n• 在钱包确认 Deposit。\n• 等待确认 (~15秒)。\n• 资金进入合约奖池 0xB77ED...3a5b。\n• 分享链接给对手。\n• 胜者通吃！',txCancelled:'⚠️ 交易已取消',step1:'步骤 1/2: Approve',step2:'步骤 2/2: Deposit',clickToCopy:'📋 点击复制',checkBalance:'🔍 检查合约余额',profileSaved:'✅ 资料已保存！',profileError:'❌ 保存失败'},
hi:{t:'♟️ Chess4Crypto',s:'GROK PvP दांव',g:'👤 अतिथि',c:'🦊 कनेक्ट',k:'💰 GROK',p:'👤 प्रोफ़ाइल',l:'🚪 बाहर',y:'👤 आप',b:'🤖 बॉट',yt:'♟️ आपकी बारी!',bt:'🤖 बॉट सोच रहा (3से)...',w:'🏆 आप जीते!',x:'😔 आप हारे',d:'🤝 ड्रॉ',tp:'⏰ बॉट जीता',tb:'⏰ आप जीते',cn:'✅ कनेक्ट',cl:'बंद',cp:'📋 कॉपी',cd:'✅ कॉपी',gt:'💰 GROK खरीदें',g1:'1. लिंक पर जाएं, BNB वॉलेट कनेक्ट करें।',g2:'2. GROK खरीदें।',g3:'3. एड्रेस जोड़ें:',ln:'🇮🇳 हिंदी',th:'🎨 थीम',tm:{c:'🏛️ क्लासिक',w:'🪵 लकड़ी',n:'💜 नियॉन',o:'🌊 महासागर',s:'🌅 सूर्यास्त',m:'⚪ मिनिमल'},tc:'समय:',st:'GROK दांव:',cr:'➕ मैच बनाएं',jn:'🤝 जुड़ें',mv:'चाल:',newG:'🔄 लॉबी',botG:'🤖 बॉट से',select:'समय',bal:'शेष:',games:'गेम्स:',noG:'कोई नहीं',myG:'मेरे',join:'जुड़ें',copy:'कॉपी!',invite:'🔗 आमंत्रण',dep:'💰 जमा',claim:'🏆 क्लेम',approve:'✅ मंजूरी',waiting:'⏳ प्रतीक्षा...',playing:'♟️ खेल चल रहा',sync:'🔄 सिंक...',review:'🔍 इतिहास',live:'▶️ लाइव',prev:'⏪ पीछे',next:'⏩ आगे',pot:'पॉट:',payout:'जीत:',refund:'वापसी',drawRefund:'🤝 ड्रॉ — दांव वापस',winnerGets:'🏆 विजेता सब ले जाता है',needDep:'जमा करें',toJoin:'शामिल होने के लिए',yourStake:'आपका दांव:',oppStake:'प्रतिद्वंदी दांव:',totalPot:'कुल पॉट:',setTime:'समय चुनें:',approveTx:'⏳ मंजूरी...',depositTx:'💸 जमा...',confirmingTx:'⏳ पुष्टि की प्रतीक्षा...',successDep:'✅ जमा स्वीकार!',successJoin:'✅ दांव जमा!',errTx:'❌ त्रुटि: ',errBal:'❌ अपर्याप्त शेष',claimBtn:'💰 इनाम लें',victoryTitle:'🏆 जीत!',defeatTitle:'😔 हार',drawTitle:'🤝 ड्रॉ',noMetaMask:'⚠️ MetaMask स्थापित नहीं',playerProfile:'👤 प्रोफ़ाइल',avatar:'🖼️ अवतार',name:'👤 नाम',bio:'📝 बारे में',website:'🌐 वेबसाइट',social:'🔗 सोशल',save:'💾 सहेजें',availableGames:'🎮 उपलब्ध गेम्स',guestInfo:'⏱️ अतिथि मोड: बॉट के खिलाफ मुफ्त। समय चुनें:',grokInstructions:'📖 GROK गेम बनाएं:\n• "बनाएं" क्लिक करें।\n• वॉलेट में Approve की पुष्टि करें।\n• वॉलेट में Deposit की पुष्टि करें।\n• पुष्टि की प्रतीक्षा करें (~15s)。\n• फंड कॉन्ट्रैक्ट पूल 0xB77ED...3a5b में जाते हैं。\n• लिंक प्रतिद्वंदी को भेजें。\n• विजेता सब ले जाता है!',txCancelled:'⚠️ ट्रांजेक्शन रद्द',step1:'चरण 1/2: Approve',step2:'चरण 2/2: Deposit',clickToCopy:'📋 कॉपी करने के लिए टैप करें',checkBalance:'🔍 कॉन्ट्रैक्ट शेष जाँचें',profileSaved:'✅ प्रोफ़ाइल सहेजी गई!',profileError:'❌ सहेजने में त्रुटि'}
}

const THEMES={c:{l:'#eeeed2',d:'#769656',n:'🏛️ Classic'},w:{l:'#f0d9b5',d:'#b58863',n:'🪵 Wood'},n:{l:'#1a1a2e',d:'#16213e',n:'💜 Neon'},o:{l:'#e0f7fa',d:'#006064',n:'🌊 Ocean'},s:{l:'#fff3e0',d:'#e65100',n:'🌅 Sunset'},m:{l:'#e0e0e0',d:'#757575',n:'⚪ Minimal'}}
const TIME_OPTIONS=[5,15,30,60,1440]
const STAKE_OPTIONS=[500,1000,5000,10000,25000,50000,100000,250000]
const fmtTime=s=>{const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return h>0?`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`:`${m}:${String(sec).padStart(2,'0')}`}
const GROK_LINK='https://four.meme/token/0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444?code=AHGX96R5GHK9'
const GROK_ADDR='0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444'
const CHESS_CONTRACT='0xB77ED8144d328A270994B157700Ee28AfD8A3a5b'
const CHESS_ABI=[{"inputs":[{"internalType":"address","name":"_grokToken","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"grokToken","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"gameId","type":"bytes32"}],"name":"create","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"gameId","type":"bytes32"}],"name":"deposit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"gameId","type":"bytes32"},{"internalType":"address","name":"winner","type":"address"},{"internalType":"bool","name":"isDraw","type":"bool"}],"name":"finish","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"games","outputs":[{"internalType":"address","name":"creator","type":"address"},{"internalType":"address","name":"challenger","type":"address"},{"internalType":"uint256","name":"stake","type":"uint256"},{"internalType":"bool","name":"cpaid","type":"bool"},{"internalType":"bool","name":"hpaid","type":"bool"},{"internalType":"address","name":"winner","type":"address"},{"internalType":"bool","name":"done","type":"bool"},{"internalType":"bool","name":"is_draw","type":"bool"},{"internalType":"uint256","name":"createdAt","type":"uint256"}],"stateMutability":"view","type":"function"}]
const ERC20_ABI=[{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]

export default function App(){
const[lang,setLang]=useState('ru')
const t=useCallback(k=>LANG[lang]?.[k]||LANG['en']?.[k]||k,[lang])
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
const[availableGames,setAvailableGames]=useState([])
const[loadingTx,setLoadingTx]=useState(false)
const[txHash,setTxHash]=useState(null)
const[contractBalance,setContractBalance]=useState(null)
const[profile,setProfile]=useState({avatar:'',name:'',bio:'',website:'',social:''})
const[isEditingProfile,setIsEditingProfile]=useState(false)
const[profileLoading,setProfileLoading]=useState(false)
const[isPvP,setIsPvP]=useState(false)

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
const{writeContractAsync}=useWriteContract()
const{depositReceipt,isSuccess:depositConfirmed}=useWaitForTransactionReceipt({hash:txHash})

// ✅ Баланс пользователя
const{data:userGrokBalance,refetch:refetchUserBalance}=useReadContract({
  address:GROK_ADDR,
  abi:ERC20_ABI,
  functionName:'balanceOf',
  args:[address],
  watch:true,
  query:{enabled:!!address}
})

// ✅ Баланс контракта
const{data:contractGrokBalance}=useReadContract({
  address:GROK_ADDR,
  abi:ERC20_ABI,
  functionName:'balanceOf',
  args:[CHESS_CONTRACT],
  watch:true
})

useEffect(()=>{if(userGrokBalance!==undefined)setUserBalance(Number(formatUnits(userGrokBalance,18)))},[userGrokBalance])
useEffect(()=>{if(contractGrokBalance!==undefined)setContractBalance(Number(formatUnits(contractGrokBalance,18)))},[contractGrokBalance])
useEffect(()=>{const r=()=>setBs(Math.min(window.innerWidth-40,400));r();window.addEventListener('resize',r);return()=>window.removeEventListener('resize',r)},[])
useEffect(()=>{if(depositConfirmed&&gameId){setMsg(t('successDep'));setGameState('waiting_funds');setTxHash(null)}},[depositConfirmed,gameId,t])
useEffect(()=>{if(timerRef.current)clearInterval(timerRef.current);if(!timerActive||gameOver||gameState!=='playing'||isReviewMode)return;timerRef.current=setInterval(()=>{if(timerActive==='player'){setPTime(p=>{if(p<=1){clearInterval(timerRef.current);setGameOver(true);setWinner('bot');setMsg(t('tp'));return 0}return p-1})}else{setBTime(p=>{if(p<=1){clearInterval(timerRef.current);setGameOver(true);setWinner('player');setMsg(t('tb'));return 0}return p-1})}},1000);return()=>clearInterval(timerRef.current)},[timerActive,gameOver,t,gameState,isReviewMode])
useEffect(()=>{if(isConnected&&address){setMsg(t('cn'));setView('profile');loadProfile();setTimeout(()=>refetchUserBalance?.(),500)}},[isConnected,address,t,refetchUserBalance])

const loadProfile=useCallback(async()=>{if(!address)return;try{setProfileLoading(true);const d=await getProfile(address);if(d)setProfile(d)}catch(e){console.warn('Profile:',e.message)}finally{setProfileLoading(false)}},[address])
const loadAvailableGames=useCallback(async()=>{try{const g=await listAvailableGames();setAvailableGames(g||[])}catch(e){console.warn('Games:',e.message)}},[])
const loadActiveGames=useCallback(async()=>{if(!address)return;try{const{data,error}=await supabase.from('games').select('*').or(`creator.eq.${address},challenger.eq.${address}`).order('created_at',{ascending:false}).limit(10);if(!error)setActiveGames(data||[])}catch(e){console.warn('Active:',e.message)}},[address])

useEffect(()=>{const p=new URLSearchParams(window.location.search);const gid=p.get('game');if(gid){setPendingJoin({id:gid,stake:parseInt(p.get('stake'))||5000,time:parseInt(p.get('time'))||15});setView('profile');setProfileTab('lobby');setMsg(`${t('needDep')} ${parseInt(p.get('stake'))||5000} GROK ${t('toJoin')}`)}},[])
useEffect(()=>{loadActiveGames();loadAvailableGames();const i=setInterval(()=>{loadActiveGames();loadAvailableGames()},15000);return()=>clearInterval(i)},[address,loadActiveGames,loadAvailableGames])

const guest=()=>{setMsg(t('g'));resetGame();startGame()}
const buyGrok=()=>setGrok(true)
const langNext=()=>setLang(l=>({ru:'en',en:'de',de:'fr',fr:'es',es:'zh',zh:'hi',hi:'ru'})[l])

// ✅ Надёжное копирование
const copyToClipboard=async(text)=>{
  try{if(document.hasFocus()&&navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);setCop(true);setTimeout(()=>setCop(false),2000);return true}}catch(e){}
  try{const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';ta.style.left='-9999px';document.body.appendChild(ta);ta.focus();ta.select();const ok=document.execCommand('copy');document.body.removeChild(ta);if(ok){setCop(true);setTimeout(()=>setCop(false),2000);return true}}catch(e){}
  setMsg(t('clickToCopy')+': '+text.slice(0,30)+'...');return false
}
const copyAddr=()=>copyToClipboard(GROK_ADDR)
const connectWallet=async()=>{try{await open()}catch(e){console.error('Connect error:',e);setMsg(t('noMetaMask'))}}
const resetGame=()=>{gameRef.current.reset();setFen(gameRef.current.fen());setHist([gameRef.current.fen()]);setMi(0);setIsPlayerTurn(true);setGameOver(false);setWinner(null);setMoveHistory([]);setSelectedSq(null);setPossibleMoves([]);setIsDeposited(false);setGameState('idle');setIsPvP(false);setRemoteFen(null);setIsRemoteTurn(false);setCurrentMoveIdx(-1);setIsReviewMode(false);setLiveFen(null);setTxHash(null);if(botTimerRef.current)clearTimeout(botTimerRef.current);if(unsubscribeRef.current){unsubscribeRef.current();unsubscribeRef.current=null}}
const startGame=()=>{setPTime(timeCtrl*60);setBTime(timeCtrl*60);setTimerActive('player');setView('game');setGameState('playing')}

// 💰 СОЗДАНИЕ ИГРЫ + ДЕПОЗИТ + ОТЛАДКА
const handleCreateMatch=async()=>{
  if(!isConnected||!address){setMsg('🦊 '+t('c'));return}
  if(CHESS_CONTRACT==='0x0000000000000000000000000000000000000000'){setMsg('⚠️ Contract not set');return}
  if(userGrokBalance!==undefined&&Number(formatUnits(userGrokBalance,18))<createStake){setMsg(t('errBal'));return}
  setLoadingTx(true)
  try{
    console.log('=== DEBUG: Creating game ===')
    console.log('Contract balance BEFORE:',contractBalance)
    console.log('User balance:',userGrokBalance?formatUnits(userGrokBalance,18):'loading')
    
    setMsg(t('step1'))
    const approveTx=await writeContractAsync({address:GROK_ADDR,abi:ERC20_ABI,functionName:'approve',args:[CHESS_CONTRACT,parseUnits(createStake.toString(),18)]})
    console.log('Approve TX:',approveTx)
    
    // 🔍 Проверка allowance после approve
    const{data:allowance}=await supabase.rpc('check_allowance',{
      token_address:GROK_ADDR,
      owner:address,
      spender:CHESS_CONTRACT
    }).single().catch(()=>({data:null}))
    console.log('Allowance after approve:',allowance)
    
    const rawId='game_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)
    const bytes32Id=keccak256(stringToBytes(rawId))
    console.log('Game ID (raw):',rawId,'(bytes32):',bytes32Id)
    
    setMsg(t('step2'))
    const createTx=await writeContractAsync({address:CHESS_CONTRACT,abi:CHESS_ABI,functionName:'create',args:[bytes32Id]})
    console.log('Create TX:',createTx)
    
    const depositTx=await writeContractAsync({address:CHESS_CONTRACT,abi:CHESS_ABI,functionName:'deposit',args:[bytes32Id]})
    console.log('Deposit TX:',depositTx)
    setTxHash(depositTx)
    
    await createGameRecord(rawId,address,createStake,timeCtrl)
    
    setGameId(rawId);setIsDeposited(true)
    const link=`${window.location.origin}${window.location.pathname}?game=${rawId}&stake=${createStake}&time=${timeCtrl}`
    setInviteLink(link)
    await copyToClipboard(link)
    
    setMsg(t('confirmingTx'))
    setupGameSubscription(rawId);await loadActiveGames();await loadAvailableGames();setProfileTab('my')
    setTimeout(()=>refetchUserBalance?.(),2000)
  }catch(e){
    console.error('Create error:',e)
    if(e.message?.includes('rejected')||e.message?.includes('denied')||e.message?.includes('User rejected')){
      setMsg(t('txCancelled'))
    }else{
      setMsg(t('errTx')+(e.shortMessage||e.message||''))
    }
  }finally{setLoadingTx(false)}
}

const handleJoinMatch=async()=>{
  if(!isConnected||!pendingJoin||!address){setMsg('🦊 '+t('c'));return}
  if(CHESS_CONTRACT==='0x0000000000000000000000000000000000000000'){setMsg('⚠️ Contract not set');return}
  if(userGrokBalance!==undefined&&Number(formatUnits(userGrokBalance,18))<pendingJoin.stake){setMsg(t('errBal'));return}
  setLoadingTx(true)
  try{
    setMsg(t('step1'))
    await writeContractAsync({address:GROK_ADDR,abi:ERC20_ABI,functionName:'approve',args:[CHESS_CONTRACT,parseUnits(pendingJoin.stake.toString(),18)]})
    const bytes32Id=keccak256(stringToBytes(pendingJoin.id))
    setMsg(t('step2'))
    const depositTx=await writeContractAsync({address:CHESS_CONTRACT,abi:CHESS_ABI,functionName:'deposit',args:[bytes32Id]})
    setTxHash(depositTx)
    await updateGameStatus(pendingJoin.id,{challenger:address,hpaid:true,status:'playing',updated_at:new Date().toISOString()})
    setGameId(pendingJoin.id);setCreateStake(pendingJoin.stake);setTimeCtrl(pendingJoin.time)
    setGameState('playing');setIsPvP(true)
    setupGameSubscription(pendingJoin.id);setMsg(t('successJoin'));setPendingJoin(null)
    loadActiveGames();loadAvailableGames();setTimeout(()=>startGame(),500)
    setTimeout(()=>refetchUserBalance?.(),2000)
  }catch(e){console.error('Join error:',e);setMsg(e.message?.includes('rejected')?t('txCancelled'):t('errTx')+(e.shortMessage||e.message||''))}finally{setLoadingTx(false)}
}

const setupGameSubscription=(id)=>{if(unsubscribeRef.current)unsubscribeRef.current();unsubscribeRef.current=subscribeToGame(id,{onGameUpdate:(g)=>{if(g.status==='playing'&&!g.hpaid)setMsg(t('waiting'));else if(g.status==='playing'&&g.hpaid&&!isPvP)setIsPvP(true);},onMove:(m)=>{if(m.player!==address&&!isReviewMode){setSyncStatus('🔄...');setTimeout(()=>{try{gameRef.current.move({from:m.from_sq,to:m.to_sq,promotion:'q'});const nf=gameRef.current.fen();setFen(nf);setLiveFen(nf);setHist(h=>[...h,nf]);setMoveHistory(mh=>[...mh,{san:m.san,from:m.from_sq,to:m.to_sq}]);setMi(i=>i+1);setCurrentMoveIdx(i=>i+1);setIsPlayerTurn(true);setTimerActive('player');setSyncStatus('');if(gameRef.current.isCheckmate()){setGameOver(true);setWinner(address);handleClaim(false)}else if(gameRef.current.isDraw()){setGameOver(true);setWinner(null);handleClaim(true)}else setMsg(t('yt'))}catch(e){console.warn(e)}},300)}}})}

const handleClaim=(isDraw)=>{if(!gameId)return;if(!isConnected||!address){setMsg(isDraw?t('drawRefund'):t('winnerGets'));return}const bytes32Id=keccak256(stringToBytes(gameId));writeContractAsync({address:CHESS_CONTRACT,abi:CHESS_ABI,functionName:'finish',args:[bytes32Id,address,isDraw]}).then(()=>{setMsg(isDraw?t('drawRefund'):t('winnerGets'));setGameState('idle')}).catch(e=>setMsg(e.message?.includes('rejected')?t('txCancelled'):t('errTx')))}

const botMove=useCallback(()=>{if(gameOver||gameRef.current.isGameOver()||gameState!=='playing'||isRemoteTurn||isReviewMode||isPvP)return;const moves=gameRef.current.moves({verbose:true});if(!moves.length)return;let c;const r=Math.random();if(r<0.7)c=moves[Math.floor(Math.random()*moves.length)];else{const caps=moves.filter(m=>m.captured);c=caps.length?caps[Math.floor(Math.random()*caps.length)]:moves[Math.floor(Math.random()*moves.length)]}gameRef.current.move(c);const san=gameRef.current.history({verbose:true}).pop()?.san||`${c.from}${c.to}`;const nf=gameRef.current.fen();setFen(nf);setLiveFen(nf);setHist(h=>[...h,nf]);setMoveHistory(mh=>[...mh,{san,from:c.from,to:c.to}]);setMi(i=>i+1);setCurrentMoveIdx(i=>i+1);setIsPlayerTurn(true);setTimerActive('player');if(gameRef.current.isCheckmate()){setGameOver(true);setWinner('bot');setMsg(t('x'))}else if(gameRef.current.isDraw()){setGameOver(true);setWinner(null);handleClaim(true)}else setMsg(t('yt'))},[gameOver,t,gameState,isRemoteTurn,isReviewMode,isPvP])

const onSqClick=useCallback((sq)=>{if(gameOver||gameState!=='playing'||!isPlayerTurn||isRemoteTurn||isReviewMode)return;const p=gameRef.current.get(sq);if(p&&p.color===(isPlayerTurn?'w':'b')){setSelectedSq(sq);setPossibleMoves(gameRef.current.moves({square:sq,verbose:true}).map(m=>m.to));return}if(selectedSq&&possibleMoves.includes(sq)){onDrop(selectedSq,sq);setSelectedSq(null);setPossibleMoves([]);return}setSelectedSq(null);setPossibleMoves([])},[gameOver,isPlayerTurn,selectedSq,possibleMoves,gameState,isRemoteTurn,isReviewMode])

const onDrop=useCallback((src,tgt)=>{if(!isPlayerTurn||gameOver||gameState!=='playing'||isRemoteTurn||isReviewMode)return false;try{const r=gameRef.current.move({from:src,to:tgt,promotion:'q'});if(!r)return false;const san=gameRef.current.history({verbose:true}).pop()?.san||`${src}${tgt}`;const nf=gameRef.current.fen();setFen(nf);setLiveFen(nf);setHist(h=>[...h,nf]);setMoveHistory(mh=>[...mh,{san,from:src,to:tgt}]);setMi(i=>i+1);setCurrentMoveIdx(i=>i+1);setIsPlayerTurn(false);setTimerActive('bot');setSelectedSq(null);setPossibleMoves([]);if(gameId&&address){setSyncStatus('🔄...');recordMove(gameId,address,src,tgt,san,nf).then(()=>setSyncStatus('')).catch(()=>setSyncStatus(''))}if(gameRef.current.isCheckmate()){setGameOver(true);setWinner(address);handleClaim(false)}else if(gameRef.current.isDraw()){setGameOver(true);setWinner(null);handleClaim(true)}else{setMsg(t('bt'));if(!isPvP&&botTimerRef.current)clearTimeout(botTimerRef.current);if(!isPvP)botTimerRef.current=setTimeout(()=>{botMove()},3000)}return true}catch{return false}},[isPlayerTurn,gameOver,gameState,isRemoteTurn,isReviewMode,gameId,address,botMove,t,isPvP])

const goToMove=(i)=>{if(i<0||i>=hist.length)return;setCurrentMoveIdx(i);setFen(hist[i]);setIsReviewMode(i<hist.length-1);setIsPlayerTurn(i%2===0)}
const prevMove=()=>{if(currentMoveIdx>0)goToMove(currentMoveIdx-1)}
const nextMove=()=>{if(currentMoveIdx<hist.length-1)goToMove(currentMoveIdx+1);else resumeLive()}
const resumeLive=()=>{if(liveFen){setFen(liveFen);setCurrentMoveIdx(hist.length-1);setIsReviewMode(false);setIsPlayerTurn(hist.length%2===1);setMsg(t('live'))}}
const sqStyles=useMemo(()=>{const s={};if(selectedSq&&!isReviewMode)s[selectedSq]={backgroundColor:'rgba(255,255,0,0.4)'};possibleMoves.forEach(q=>{if(!isReviewMode)s[q]={backgroundColor:'rgba(20,85,30,0.5)',backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.9) 25%,transparent 25%)',backgroundSize:'14px 14px',backgroundPosition:'center'}});return s},[selectedSq,possibleMoves,isReviewMode])
const BtnStyle=(c,d)=>({width:'100%',padding:'12px',background:c||COLORS.btnBlue,color:'#fff',border:'none',borderRadius:'10px',fontSize:'1rem',fontWeight:'600',cursor:d?'not-allowed':'pointer',marginTop:'8px',boxShadow:'0 2px 5px rgba(0,0,0,0.2)',opacity:d?0.5:1})

// ✅ ИСПРАВЛЕНО: Сохранение профиля с обработкой ошибок
const handleSaveProfile=async()=>{
  if(!address){setMsg('❌ '+t('noMetaMask'));return}
  if(profile.bio?.length>500){setMsg('❌ Био макс. 500 символов');return}
  setProfileLoading(true)
  try{
    console.log('Saving profile for:',address)
    const ok=await updateProfile(address,profile)
    if(ok){
      setMsg(t('profileSaved'))
      setIsEditingProfile(false)
      loadProfile()
    }else{
      setMsg(t('profileError'))
    }
  }catch(e){
    console.error('Save profile error:',e)
    // ✅ Понятное сообщение об ошибке
    if(e.message?.includes('401')||e.message?.includes('Unauthorized')){
      setMsg('❌ Нет прав. Проверьте политики RLS в Supabase')
    }else if(e.message?.includes('406')){
      setMsg('❌ Ошибка формата данных. Проверьте схему таблицы')
    }else{
      setMsg(t('profileError')+': '+e.message)
    }
  }finally{
    setProfileLoading(false)
  }
}

return(<div style={{minHeight:'100vh',background:COLORS.bg,color:COLORS.text,fontFamily:'system-ui',padding:'1rem',display:'flex',justifyContent:'center',overflowX:'hidden'}}>
{view==='menu'&&<div style={{maxWidth:'400px',width:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'1rem'}}>
<h1 style={{color:COLORS.accent,marginBottom:0}}>{t('t')}</h1>
{!pendingJoin&&<div style={{background:'rgba(0,0,0,0.3)',padding:'1rem',borderRadius:'12px',width:'100%',marginBottom:'0.5rem'}}><label style={{color:COLORS.textSec,display:'block',marginBottom:'0.3rem'}}>{t('setTime')}</label><select value={timeCtrl}onChange={e=>setTimeCtrl(Number(e.target.value))}style={{width:'100%',padding:'10px',background:COLORS.cardBg,color:'#fff',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'8px',fontSize:'1rem'}}>{TIME_OPTIONS.map(m=>(<option key={m}value={m}>{m===1440?'24 часа':`${m} мин`}</option>))}</select></div>}
<div style={{background:'rgba(0,0,0,0.3)',padding:'1rem',borderRadius:'12px',width:'100%'}}><p style={{color:COLORS.textSec,fontSize:'0.85rem',margin:0,lineHeight:'1.4'}}>{t('guestInfo')}</p></div>
<button onClick={guest}disabled={loadingTx}style={BtnStyle(COLORS.btnBlue,loadingTx)}>{t('g')}</button>
<button onClick={connectWallet}disabled={loadingTx}style={BtnStyle(COLORS.btnOrange,loadingTx)}>{t('c')}</button>
<button onClick={buyGrok}disabled={loadingTx}style={BtnStyle(COLORS.btnOrange,loadingTx)}>{t('k')}</button>
<button onClick={langNext}disabled={loadingTx}style={BtnStyle(COLORS.btnBlue,loadingTx)}>{t('ln')}</button>
{msg&&<div style={{padding:'1rem',background:'rgba(0,0,0,0.4)',borderRadius:'8px',color:COLORS.accent,textAlign:'center',width:'100%'}}>{msg}</div>}
</div>}

{view==='profile'&&<div style={{maxWidth:'600px',width:'100%',display:'flex',flexDirection:'column',gap:'1rem'}}>
<div style={{background:COLORS.cardBg,padding:'1rem',borderRadius:'12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
<div style={{display:'flex',alignItems:'center',gap:'0.8rem'}}>{profile.avatar&&<img src={profile.avatar} alt="av" style={{width:40,height:40,borderRadius:'50%',objectFit:'cover',border:'2px solid '+COLORS.accent}}/>}<div><div style={{fontWeight:'bold'}}>{profile.name||address?.slice(0,6)+'...'+address?.slice(-4)}</div><div style={{color:COLORS.textSec,fontSize:'0.9rem'}}>{t('bal')} <span style={{color:COLORS.accent}}>{userBalance?.toLocaleString()||'0'} GROK</span></div></div></div>
<button onClick={()=>{disconnect();setView('menu')}}style={{...BtnStyle('#b71c1c'),width:'auto',padding:'8px 16px',marginTop:0}}>{t('l')}</button>
</div>

{profileTab==='playerProfile'&&<div style={{background:COLORS.cardBg,padding:'1rem',borderRadius:'12px'}}><h3 style={{color:COLORS.accent,margin:'0 0 1rem'}}>{t('playerProfile')}</h3>{isEditingProfile?(<div style={{display:'flex',flexDirection:'column',gap:'0.8rem'}}><input value={profile.avatar} onChange={e=>setProfile({...profile,avatar:e.target.value})} placeholder={t('avatar')} style={{width:'100%',padding:'8px',background:'#00332e',border:'1px solid #00897b',borderRadius:'6px',color:'#fff'}}/><input value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})} maxLength={30} placeholder={t('name')} style={{width:'100%',padding:'8px',background:'#00332e',border:'1px solid #00897b',borderRadius:'6px',color:'#fff'}}/><textarea value={profile.bio} onChange={e=>setProfile({...profile,bio:e.target.value})} maxLength={500} rows={3} placeholder={t('bio')} style={{width:'100%',padding:'8px',background:'#00332e',border:'1px solid #00897b',borderRadius:'6px',color:'#fff'}}/><input value={profile.website} onChange={e=>setProfile({...profile,website:e.target.value})} placeholder={t('website')} style={{width:'100%',padding:'8px',background:'#00332e',border:'1px solid #00897b',borderRadius:'6px',color:'#fff'}}/><input value={profile.social} onChange={e=>setProfile({...profile,social:e.target.value})} placeholder={t('social')} style={{width:'100%',padding:'8px',background:'#00332e',border:'1px solid #00897b',borderRadius:'6px',color:'#fff'}}/><div style={{display:'flex',gap:'0.5rem'}}><button onClick={handleSaveProfile} disabled={profileLoading} style={BtnStyle('#10b981',profileLoading)}>{profileLoading?'⏳...':t('save')}</button><button onClick={()=>{setIsEditingProfile(false);loadProfile()}} style={BtnStyle('#64748b')}>{t('cl')}</button></div></div>):(<div>{profile.avatar&&<img src={profile.avatar} alt="av" style={{width:80,height:80,borderRadius:'50%',objectFit:'cover',margin:'0 auto 1rem',display:'block',border:'3px solid '+COLORS.accent}}/>}<p><b>{t('name')}:</b> {profile.name||'—'}</p><p><b>{t('bio')}:</b> {profile.bio||'—'}</p>{profile.website&&<p><b>{t('website')}:</b> <a href={profile.website} target="_blank" rel="noopener" style={{color:'#60a5fa'}}>{profile.website}</a></p>}{profile.social&&<p><b>{t('social')}:</b> <a href={profile.social.startsWith('http')?profile.social:'#'} target="_blank" rel="noopener" style={{color:'#60a5fa'}}>{profile.social}</a></p>}<button onClick={()=>setIsEditingProfile(true)} style={BtnStyle(COLORS.btnBlue)}>{t('playerProfile')}</button></div>)}</div>}

{profileTab==='lobby'&&<div style={{background:COLORS.cardBg,padding:'1rem',borderRadius:'12px'}}><h3 style={{color:COLORS.accent,margin:'0 0 0.8rem'}}>{t('availableGames')}</h3>{availableGames.length>0?availableGames.map(g=>{const totalPot=(g.stake||0)*((g.cpaid?1:0)+(g.hpaid?1:0));return(<div key={g.id}style={{background:'rgba(0,0,0,0.2)',padding:'0.8rem',borderRadius:'8px',marginBottom:'0.8rem'}}><div style={{display:'flex',justifyContent:'space-between'}}><b>ID: ...{g.id.slice(-6)}</b><span style={{color:g.status==='playing'?COLORS.accent:COLORS.textSec}}>{g.status}</span></div><div style={{fontSize:'0.8rem',color:COLORS.textSec,margin:'0.5rem 0'}}>{t('st')}: {g.stake} | ⏱️ {g.time_limit}мин | {t('totalPot')}: {totalPot}GROK</div>{!g.hpaid&&g.creator!==address&&<button onClick={()=>{setPendingJoin({id:g.id,stake:g.stake,time:g.time_limit});handleJoinMatch()}} disabled={loadingTx} style={{...BtnStyle('#10b981',loadingTx),marginTop:'0.5rem'}}>{t('jn')} ({g.stake} GROK)</button>}</div>)}):<p style={{color:COLORS.textSec}}>{t('noG')}</p>}</div>}

{pendingJoin&&<div style={{background:'linear-gradient(135deg,#1e293b,#334155)',padding:'1.5rem',borderRadius:'12px',textAlign:'center',border:`2px solid ${COLORS.accent}`}}><h3 style={{color:COLORS.accent,margin:'0 0 0.5rem'}}>{t('invite')}</h3><p>{t('needDep')} <b style={{color:COLORS.accent}}>{pendingJoin.stake.toLocaleString()} GROK</b></p><p style={{color:COLORS.textSec,fontSize:'0.9rem',marginBottom:'1rem'}}>⏱️ {pendingJoin.time} мин</p><button onClick={handleJoinMatch}disabled={loadingTx}style={BtnStyle('#10b981',loadingTx)}>{`🤝 ${t('jn')}`}</button></div>}

<div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',justifyContent:'center'}}>{['lobby','my','create','playerProfile'].map(tab=>(<button key={tab}onClick={()=>{setProfileTab(tab);if(tab==='playerProfile')loadProfile()}}style={{...BtnStyle(profileTab===tab?COLORS.btnBlue:'#334155',loadingTx),flex:'1',minWidth:'80px',padding:'10px 0',fontSize:'0.9rem',marginTop:0}}>{tab==='lobby'?t('availableGames'):tab==='my'?t('myG'):tab==='create'?t('cr'):t('playerProfile')}</button>))}<button onClick={langNext}style={{...BtnStyle('#334155'),minWidth:'auto',flex:'0',width:'auto',padding:'0 15px',marginTop:0}}>{t('ln')}</button></div>

{profileTab==='create'&&<div style={{background:COLORS.cardBg,padding:'1rem',borderRadius:'12px'}}>
<div style={{background:'rgba(0,0,0,0.2)',padding:'0.8rem',borderRadius:'8px',marginBottom:'1rem',fontSize:'0.85rem',lineHeight:'1.4',color:COLORS.textSec,whiteSpace:'pre-line',border:'1px solid '+COLORS.accent}}>{t('grokInstructions')}</div>
<div style={{marginBottom:'0.8rem'}}><label style={{color:COLORS.textSec}}>{t('setTime')}</label><select value={timeCtrl}onChange={e=>setTimeCtrl(Number(e.target.value))}style={{width:'100%',padding:'10px',background:'#00332e',color:'#fff',border:'1px solid #00897b',borderRadius:'8px',marginTop:'4px'}}>{TIME_OPTIONS.map(m=>(<option key={m}value={m}>{m===1440?'24ч':`${m}м`}</option>))}</select></div>
<div style={{marginBottom:'0.5rem'}}><label>{t('st')}</label><div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>{STAKE_OPTIONS.map(a=>(<button key={a}onClick={()=>setCreateStake(a)}style={{...BtnStyle(createStake===a?'#10b981':'#334155',loadingTx),flex:'1',minWidth:'70px',padding:'10px 0',fontSize:'0.9rem',marginTop:4}}>{a.toLocaleString()}</button>))}</div></div>
<button onClick={handleCreateMatch}disabled={loadingTx}style={BtnStyle('#10b981',loadingTx)}>{loadingTx?(txHash?t('confirmingTx'):t('approveTx')):t('cr')}</button>
{inviteLink&&<div style={{marginTop:'1rem',padding:'0.8rem',background:'#00332e',border:`1px solid ${COLORS.accent}`,borderRadius:'8px',wordBreak:'break-all',fontSize:'0.8rem'}}><div style={{color:COLORS.accent,marginBottom:'4px',fontWeight:'bold'}}>{t('invite')}:</div><div style={{color:COLORS.textSec,marginBottom:'8px',cursor:'pointer'}} onClick={()=>copyToClipboard(inviteLink)}>{inviteLink}<br/><small style={{color:COLORS.textSec}}>{cop?t('cd'):t('clickToCopy')}</small></div></div>}
</div>}

{profileTab==='my'&&<div style={{background:COLORS.cardBg,padding:'1rem',borderRadius:'12px'}}><p>Game ID: {gameId||'-'}</p><p>Status: {gameState} {syncStatus&&<span style={{color:COLORS.accent}}>{syncStatus}</span>}</p>{txHash&&<p style={{color:COLORS.accent,fontSize:'0.8rem'}}>🔗 TX: {txHash.slice(0,10)}...{txHash.slice(-8)}</p>}{contractBalance!==null&&<p style={{color:COLORS.textSec,fontSize:'0.8rem'}}>🏦 {t('pot')} {contractBalance.toLocaleString()} GROK</p>}{gameState==='playing'&&<button onClick={()=>setView('game')}disabled={loadingTx}style={BtnStyle('#8b5cf6',loadingTx)}>🎮 Play</button>}{gameState==='waiting_funds'&&<div style={{background:'rgba(0,0,0,0.3)',padding:'0.8rem',borderRadius:'8px',marginTop:'0.5rem'}}><p style={{color:'#fbbf24',margin:0}}>{t('waiting')} ⏱️ {timeCtrl} мин</p>{inviteLink&&<div style={{marginTop:'0.5rem',display:'flex',gap:'0.5rem',alignItems:'center'}}><input readOnly value={inviteLink} style={{flex:1,background:'#00221a',border:'1px solid #004d40',color:'#fff',padding:'4px 8px',borderRadius:'4px',fontSize:'0.8rem'}}/><button onClick={()=>copyToClipboard(inviteLink)}style={{padding:'4px 10px',background:COLORS.btnBlue,color:'#fff',border:'none',borderRadius:'4px',cursor:'pointer'}}>{cop?t('cd'):t('cp')}</button></div>}</div>}</div>}
</div>}

{view==='game'&&<div style={{maxWidth:'100%',width:'100%',margin:'0 auto',display:'flex',flexDirection:'column',alignItems:'center'}}>
<div style={{display:'flex',justifyContent:'space-around',width:'100%',maxWidth:'420px',marginBottom:'0.5rem'}}><div style={{background:'#004d40',padding:'10px 20px',borderRadius:'10px',color:'#fff',textAlign:'center',border:'1px solid #00897b',width:'45%'}}><div style={{fontSize:'0.85rem',opacity:0.8}}>{t('y')}</div><div style={{fontSize:'1.6rem',fontWeight:'bold',fontFamily:'monospace'}}>{fmtTime(pTime)}</div></div><div style={{background:'#004d40',padding:'10px 20px',borderRadius:'10px',color:'#fff',textAlign:'center',border:'1px solid #00897b',width:'45%'}}><div style={{fontSize:'0.85rem',opacity:0.8}}>{t('b')}</div><div style={{fontSize:'1.6rem',fontWeight:'bold',fontFamily:'monospace'}}>{fmtTime(bTime)}</div></div></div>
{syncStatus&&<div style={{textAlign:'center',color:COLORS.accent,fontSize:'0.9rem',marginBottom:'0.3rem'}}>{syncStatus}</div>}{msg&&<div style={{color:'#38bdf8',textAlign:'center',marginBottom:'0.3rem'}}>{msg}</div>}
<div style={{background:COLORS.cardBg,padding:'8px',borderRadius:'12px',display:'flex',justifyContent:'center',margin:'0 auto'}}><Chessboard position={fen}onPieceDrop={isReviewMode?null:onDrop}onSquareClick={isReviewMode?null:onSqClick}boardWidth={bs}customSquareStyles={sqStyles}customDarkSquareStyle={{backgroundColor:THEMES[theme].d}}customLightSquareStyle={{backgroundColor:THEMES[theme].l}}/></div>
{moveHistory.length>0&&<div style={{display:'flex',gap:'0.5rem',marginTop:'0.5rem',justifyContent:'center'}}><button onClick={prevMove}disabled={currentMoveIdx<=0}style={{...BtnStyle('#334155',loadingTx),width:'auto',padding:'8px 16px'}}>{t('prev')}</button><button onClick={nextMove}disabled={currentMoveIdx>=hist.length-1}style={{...BtnStyle('#334155',loadingTx),width:'auto',padding:'8px 16px'}}>{t('next')}</button>{isReviewMode&&<button onClick={resumeLive}disabled={loadingTx}style={{...BtnStyle('#10b981',loadingTx),width:'auto',padding:'8px 16px'}}>{t('live')}</button>}</div>}
<div style={{display:'flex',gap:'0.5rem',marginTop:'0.5rem',justifyContent:'center'}}><button onClick={()=>{resetGame();setView('profile')}}disabled={loadingTx}style={{...BtnStyle(COLORS.btnBlue,loadingTx),width:'auto',flex:'1'}}>{t('newG')}</button><button onClick={()=>{resetGame();startGame()}}disabled={loadingTx}style={{...BtnStyle('#10b981',loadingTx),width:'auto',flex:'1'}}>{t('botG')}</button></div>
{moveHistory.length>0&&<div style={{marginTop:'0.5rem',background:COLORS.cardBg,padding:'0.5rem',borderRadius:'8px',maxHeight:'100px',overflowY:'auto',fontSize:'0.8rem'}}>{moveHistory.map((m,i)=>(<span key={i}style={{marginRight:'0.5rem',background:currentMoveIdx===i?COLORS.btnBlue:'rgba(0,0,0,0.3)',padding:'0.2rem 0.4rem',borderRadius:'4px'}}>{i+1}.{m.san}</span>))}</div>}
{gameOver&&<div style={{marginTop:'1.5rem',background:'#1e293b',padding:'1.5rem',borderRadius:'12px',textAlign:'center',border:`2px solid ${winner===address?'#10b981':'#ef4444'}`,maxWidth:'400px',width:'100%'}}><h2 style={{color:COLORS.accent,margin:'0 0 1rem'}}>{winner===address?t('victoryTitle'):winner==='bot'?t('defeatTitle'):t('drawTitle')}</h2>{winner===address&&gameId&&<button onClick={()=>handleClaim(false)}disabled={loadingTx}style={{...BtnStyle('#10b981',loadingTx),fontSize:'1.2rem',marginBottom:'1rem'}}>{loadingTx?'⏳...':t('claimBtn')}</button>}<button onClick={()=>{resetGame();setView('profile')}}style={BtnStyle(COLORS.btnBlue)}>{t('newG')}</button></div>}
</div>}

{grok&&<div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.9)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}onClick={()=>setGrok(false)}><div style={{background:COLORS.cardBg,padding:'1.5rem',borderRadius:'16px',maxWidth:'360px'}}onClick={e=>e.stopPropagation()}><h3 style={{color:COLORS.accent}}>{t('gt')}</h3><ol style={{color:COLORS.textSec,margin:'1rem 0',paddingLeft:'1.2rem'}}><li style={{marginBottom:'0.5rem'}}>{t('g1')}<br/><a href={GROK_LINK}target="_blank"rel="noopener"style={{color:'#60a5fa',wordBreak:'break-all'}}>{GROK_LINK}</a></li><li style={{marginBottom:'0.5rem'}}>{t('g2')}</li><li>{t('g3')}<br/><code style={{background:'#00332e',padding:'0.3rem',borderRadius:'4px',display:'block',margin:'0.3rem 0',fontSize:'0.8rem'}}>{GROK_ADDR}</code><button onClick={copyAddr}style={{...BtnStyle(COLORS.btnBlue,loadingTx),marginTop:'0.5rem',padding:'8px'}}>{cop?t('cd'):t('cp')}</button></li></ol><a href={GROK_LINK}target="_blank"style={{display:'block',background:'#f57c00',color:'#000',padding:'0.6rem',borderRadius:'8px',textAlign:'center',textDecoration:'none',marginTop:'0.5rem'}}>🔗 four.meme</a><button onClick={()=>setGrok(false)}style={{...BtnStyle('#334155'),marginTop:'0.5rem'}}>{t('cl')}</button></div></div>}
{msg&&<div style={{position:'fixed',bottom:'1rem',left:'50%',transform:'translateX(-50%)',background:COLORS.btnBlue,color:'#fff',padding:'0.6rem 1rem',borderRadius:'8px',zIndex:1000}}>{msg}</div>}
</div>)
}