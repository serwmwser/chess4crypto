import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useAccount, useDisconnect, useWriteContract, useReadContract, useWaitForTransactionReceipt, useConnect } from 'wagmi'
import { parseUnits, formatUnits, keccak256, stringToBytes } from 'viem'
import { supabase, createGameRecord, updateGameStatus, subscribeToGame, getProfile, updateProfile, listAvailableGames, recordMove } from './supabase'

const C4C_ADDR = '0xaac20575371de01b4d10c4e7566d5453d72d56e7'
const CHESS_CONTRACT = '0xCf5E5d01ADd5e2Ba62B2f6747E5CFC43e36D5005'
const PINK_LINK = 'https://www.pink.meme/token/bsc/0xaac20575371de01b4d10c4e7566d5453d72d56e7'

const COLORS = { bg: '#00695c', cardBg: '#004d40', btnBlue: '#1a237e', btnOrange: '#f57c00', text: '#ffffff', textSec: '#b2dfdb', accent: '#ffb74d' }

const LANG = {
  ru: { t: '♟️ Chess4Crypto', s: 'PvP на токене C4C', g: '👤 Гостевой', c: '🦊 Войти', k: '💰 Купить C4C', p: '👤 Профиль', l: '🚪 Выйти', y: '👤 Вы', b: '🤖 Бот', yt: '♟️ Ваш ход!', bt: '🤖 Бот думает (3с)...', w: '🏆 ПОБЕДА!', x: '😔 Поражение', d: '🤝 Ничья', tp: '⏰ Бот выиграл', tb: '⏰ Вы выиграли', cn: '✅ Подключено', cl: 'Закрыть', cp: '📋 Копировать', cd: '✅ Скопировано!', gt: '💰 Как купить C4C', g1: '1. Перейдите на pink.meme и подключите кошелёк в сети BNB.', g2: '2. Обменяйте BNB на токен C4C.', g3: '3. Адрес токена:', ln: '🇷🇺 RU', th: '🎨 Тема', tm: { c: '🏛️ Классика', w: '🪵 Дерево', n: '💜 Неон', o: '🌊 Океан', s: '🌅 Закат', m: '⚪ Минимал' }, tc: 'Время:', st: 'Ставка (C4C):', cr: '➕ Создать матч', jn: '🤝 Присоединиться', mv: 'Ходы:', newG: '🔄 В лобби', botG: '🤖 С ботом', select: 'Время', bal: 'Баланс:', games: 'Игры:', noG: 'Нет игр', myG: 'Мои игры', join: 'Войти', copy: 'Ссылка скопирована!', invite: '🔗 Приглашение', dep: '💰 Внести', claim: '🏆 Забрать', approve: '✅ Разрешить', waiting: '⏳ Ожидание соперника...', playing: '♟️ Игра идёт', sync: '🔄 Синхронизация...', review: '🔍 Просмотр', live: '▶️ В реальном времени', prev: '⏪ Назад', next: '⏩ Вперёд', pot: 'Банк игры:', payout: 'Выплата:', refund: 'Возврат', drawRefund: '🤝 Ничья — ставки возвращены', winnerGets: '🏆 Победитель забирает 98% банка', needDep: 'Нужно внести', toJoin: 'C4C для присоединения', yourStake: 'Ваша ставка:', oppStake: 'Ставка соперника:', totalPot: 'Общий банк:', setTime: 'Выберите время:', approveTx: '1️⃣ Разрешаем контракт тратить C4C...', depositTx: '2️⃣ Переводим ставку в пул игры...', confirmingTx: '⏳ Ожидание подтверждения блокчейна...', successDep: '✅ Депозит подтверждён! Игра создана.', successJoin: '✅ Депозит внесён! Игра начинается.', errTx: '❌ Ошибка: ', errBal: '❌ Недостаточно C4C', claimBtn: '💰 Забрать выигрыш', victoryTitle: '🏆 Победа!', defeatTitle: '😔 Поражение', drawTitle: '🤝 Ничья', noMetaMask: '⚠️ Установите MetaMask/TrustWallet', playerProfile: '👤 Профиль', avatar: '🖼️ Аватар', name: '👤 Имя', bio: '📝 О себе', website: '🌐 Сайт', social: '🔗 Соцсеть', save: '💾 Сохранить', availableGames: '🎮 Доступные игры', guestInfo: '⏱️ Гостевой режим: бесплатно с ботом. Выберите время для игры.', guestInstructions: '📖 Гостевой режим:\n• Выберите время партии выше.\n• Нажмите "🤖 С ботом".\n• Играйте бесплатно без блокчейна.', grokInstructions: `📖 Создание игры на C4C:\n1️⃣ Нажмите "➕ Создать матч".\n2️⃣ Выберите ставку и время.\n3️⃣ Подтвердите в кошельке ДВЕ транзакции:\n   • Approve: разрешить тратить C4C\n   • Create/Deposit: перевести ставку в контракт ${CHESS_CONTRACT.slice(0,10)}...${CHESS_CONTRACT.slice(-4)}\n4️⃣ Дождитесь подтверждения (~15 сек).\n5️⃣ Скопируйте ссылку и отправьте сопернику.\n6️⃣ Когда соперник внесёт депозит — игра начнётся!\n7️⃣ Победитель забирает 98% банка (2% комиссия платформы).`, txCancelled: '⚠️ Транзакция отменена', step1: 'Шаг 1/2: Разрешение', step2: 'Шаг 2/2: Депозит', clickToCopy: '📋 Нажмите для копирования', checkBalance: '🔍 Проверить баланс контракта', profileSaved: '✅ Профиль сохранён!', profileError: '❌ Ошибка сохранения профиля', pvpMode: '👥 PvP режим', botMode: '🤖 Режим с ботом' },
  en: { t: '♟️ Chess4Crypto', s: 'C4C PvP Betting', g: '👤 Guest', c: '🦊 Connect', k: '💰 Buy C4C', p: '👤 Profile', l: '🚪 Logout', y: '👤 You', b: '🤖 Bot', yt: '♟️ Your turn!', bt: '🤖 Bot thinks (3s)...', w: '🏆 YOU WIN!', x: '😔 Lost', d: '🤝 Draw', tp: '⏰ Bot wins', tb: '⏰ You win', cn: '✅ Connected', cl: 'Close', cp: '📋 Copy', cd: '✅ Copied!', gt: '💰 Buy C4C', g1: '1. Go to pink.meme, connect BNB wallet.', g2: '2. Swap BNB for C4C token.', g3: '3. Token address:', ln: '🇬🇧 EN', th: '🎨 Theme', tm: { c: '🏛️ Classic', w: '🪵 Wood', n: '💜 Neon', o: '🌊 Ocean', s: '🌅 Sunset', m: '⚪ Minimal' }, tc: 'Time:', st: 'Stake (C4C):', cr: '➕ Create Match', jn: '🤝 Join', mv: 'Moves:', newG: '🔄 Lobby', botG: '🤖 Vs Bot', select: 'Time', bal: 'Balance:', games: 'Games:', noG: 'No games', myG: 'My Games', join: 'Join', copy: 'Copied!', invite: '🔗 Invite', dep: '💰 Deposit', claim: '🏆 Claim Win', approve: '✅ Approve', waiting: '⏳ Waiting opponent...', playing: '♟️ Game in progress', sync: '🔄 Syncing...', review: '🔍 Review', live: '▶️ Live', prev: '⏪ Prev', next: '⏩ Next', pot: 'Game Pot:', payout: 'Payout:', refund: 'Refund', drawRefund: '🤝 Draw — stakes refunded', winnerGets: '🏆 Winner takes 98% of pot', needDep: 'Need to deposit', toJoin: 'C4C to join', yourStake: 'Your stake:', oppStake: 'Opponent stake:', totalPot: 'Total pot:', setTime: 'Select Time:', approveTx: '1️⃣ Approve C4C...', depositTx: '2️⃣ Deposit to pool...', confirmingTx: '⏳ Waiting for blockchain confirmation...', successDep: '✅ Deposit confirmed! Game created.', successJoin: '✅ Deposit paid! Game started.', errTx: '❌ Error: ', errBal: '❌ Insufficient C4C', claimBtn: '💰 Claim Winnings', victoryTitle: '🏆 Victory!', defeatTitle: '😔 Defeat', drawTitle: '🤝 Draw', noMetaMask: '⚠️ Install MetaMask/TrustWallet', playerProfile: '👤 Profile', avatar: '🖼️ Avatar', name: '👤 Name', bio: '📝 Bio', website: '🌐 Website', social: '🔗 Social', save: '💾 Save', availableGames: '🎮 Available Games', guestInfo: '⏱️ Guest mode: free vs bot. Select game time.', guestInstructions: '📖 Guest Mode:\n• Select time control above.\n• Click "🤖 Vs Bot".\n• Play for free, no blockchain.', grokInstructions: `📖 Create C4C game:\n1️⃣ Click "➕ Create Match".\n2️⃣ Select stake & time.\n3️⃣ Confirm TWO transactions in wallet:\n   • Approve: allow spending C4C\n   • Create/Deposit: send stake to contract ${CHESS_CONTRACT.slice(0,10)}...${CHESS_CONTRACT.slice(-4)}\n4️⃣ Wait for confirmation (~15s).\n5️⃣ Copy link & send to opponent.\n6️⃣ When opponent deposits — game starts!\n7️⃣ Winner takes 98% of pot (2% platform fee).`, txCancelled: '⚠️ Transaction cancelled', step1: 'Step 1/2: Approve', step2: 'Step 2/2: Deposit', clickToCopy: '📋 Tap to copy', checkBalance: '🔍 Check contract balance', profileSaved: '✅ Profile saved!', profileError: '❌ Failed to save profile', pvpMode: '👥 PvP Mode', botMode: '🤖 Bot Mode' },
  de: { t: '♟️ Chess4Crypto', s: 'C4C PvP', g: '👤 Gast', c: '🦊 Verbinden', k: '💰 C4C kaufen', p: '👤 Profil', l: '🚪 Exit', y: '👤 Du', b: '🤖 Bot', yt: '♟️ Dein Zug!', bt: '🤖 Bot denkt (3s)...', w: '🏆 GEWINN!', x: '😔 Verloren', d: '🤝 Remis', tp: '⏰ Bot gewinnt', tb: '⏰ Du gewinnst', cn: '✅ Verbunden', cl: 'Schließen', cp: '📋 Kopieren', cd: '✅ Kopiert', gt: '💰 C4C kaufen', g1: '1. Zu pink.meme gehen, BNB Wallet verbinden.', g2: '2. BNB in C4C tauschen.', g3: '3. Token-Adresse:', ln: '🇩🇪 DE', th: '🎨 Design', tm: { c: '🏛️ Klassisch', w: '🪵 Holz', n: '💜 Neon', o: '🌊 Ozean', s: '🌅 Sonnenuntergang', m: '⚪ Minimal' }, tc: 'Zeit:', st: 'Einsatz (C4C):', cr: '➕ Match', jn: '🤝 Beitreten', mv: 'Züge:', newG: '🔄 Lobby', botG: '🤖 Vs Bot', select: 'Zeit', bal: 'Guthaben:', games: 'Spiele:', noG: 'Keine', myG: 'Meine', join: 'Beitreten', copy: 'Kopiert!', invite: '🔗 Einladen', dep: '💰 Einzahlen', claim: '🏆 Auszahlen', approve: '✅ Genehmigen', waiting: '⏳ Warte...', playing: '♟️ Läuft', sync: '🔄 Sync...', review: '🔍 Verlauf', live: '▶️ Live', prev: '⏪ Zurück', next: '⏩ Vor', pot: 'Spielbank:', payout: 'Auszahlung:', refund: 'Rückerstattung', drawRefund: '🤝 Remis — Einsätze zurück', winnerGets: '🏆 Sieger bekommt 98%', needDep: 'Einzahlen', toJoin: 'zum Beitreten', yourStake: 'Dein Einsatz:', oppStake: 'Einsatz Gegner:', totalPot: 'Gesamtbank:', setTime: 'Zeit wählen:', approveTx: '⏳ Genehmigung...', depositTx: '💸 Einzahlung...', confirmingTx: '⏳ Bestätigung warten...', successDep: '✅ Einzahlung bestätigt!', successJoin: '✅ Einzahlung eingegangen!', errTx: '❌ Fehler: ', errBal: '❌ Guthaben reicht nicht', claimBtn: '💰 Gewinn abheben', victoryTitle: '🏆 Sieg!', defeatTitle: '😔 Niederlage', drawTitle: '🤝 Remis', noMetaMask: '⚠️ MetaMask nicht installiert', playerProfile: '👤 Spielerprofil', avatar: '🖼️ Avatar', name: '👤 Name', bio: '📝 Über mich', website: '🌐 Website', social: '🔗 Social', save: '💾 Speichern', availableGames: '🎮 Verfügbare Spiele', guestInfo: '⏱️ Gastmodus: kostenlos vs Bot. Zeit wählen.', guestInstructions: '📖 Gastmodus:\n• Zeitkontrolle oben wählen.\n• "🤖 Vs Bot" klicken.\n• Kostenlos spielen, keine Blockchain.', grokInstructions: `📖 C4C-Spiel erstellen:\n1️⃣ "➕ Match erstellen" klicken.\n2️⃣ Einsatz & Zeit wählen.\n3️⃣ ZWEI Transaktionen im Wallet bestätigen:\n   • Approve: C4C-Ausgaben erlauben\n   • Create/Deposit: Einsatz an Contract ${CHESS_CONTRACT.slice(0,10)}...${CHESS_CONTRACT.slice(-4)} senden\n4️⃣ Bestätigung warten (~15s).\n5️⃣ Link kopieren & an Gegner senden.\n6️⃣ Wenn Gegner einzahlt — Spiel startet!\n7️⃣ Sieger bekommt 98% (2% Gebühr).`, txCancelled: '⚠️ Transaktion abgebrochen', step1: 'Schritt 1/2: Approve', step2: 'Schritt 2/2: Deposit', clickToCopy: '📋 Zum Kopieren', checkBalance: '🔍 Contract-Guthaben prüfen', profileSaved: '✅ Profil gespeichert!', profileError: '❌ Speichern fehlgeschlagen', pvpMode: '👥 PvP-Modus', botMode: '🤖 Bot-Modus' },
  fr: { t: '♟️ Chess4Crypto', s: 'Paris C4C PvP', g: '👤 Invité', c: '🦊 Connecter', k: '💰 Acheter C4C', p: '👤 Profil', l: '🚪 Quitter', y: '👤 Vous', b: '🤖 Bot', yt: '♟️ À vous!', bt: '🤖 Bot pense (3s)...', w: '🏆 GAGNÉ!', x: '😔 Perdu', d: '🤝 Nulle', tp: '⏰ Bot gagne', tb: '⏰ Vous gagnez', cn: '✅ Connecté', cl: 'Fermer', cp: '📋 Copier', cd: '✅ Copié', gt: '💰 Acheter C4C', g1: '1. Aller sur pink.meme, connecter wallet BNB.', g2: '2. Échanger BNB contre C4C.', g3: '3. Adresse du token:', ln: '🇫🇷 FR', th: '🎨 Thème', tm: { c: '🏛️ Classique', w: '🪵 Bois', n: '💜 Néon', o: '🌊 Océan', s: '🌅 Coucher', m: '⚪ Minimal' }, tc: 'Temps:', st: 'Mise (C4C):', cr: '➕ Match', jn: '🤝 Rejoindre', mv: 'Coups:', newG: '🔄 Lobby', botG: '🤖 Vs Bot', select: 'Temps', bal: 'Solde:', games: 'Parties:', noG: 'Aucune', myG: 'Mes', join: 'Rejoindre', copy: 'Copié!', invite: '🔗 Inviter', dep: '💰 Déposer', claim: '🏆 Réclamer', approve: '✅ Approuver', waiting: '⏳ Attente...', playing: '♟️ En cours', sync: '🔄 Sync...', review: '🔍 Historique', live: '▶️ Live', prev: '⏪ Préc', next: '⏩ Suiv', pot: 'Cagnotte:', payout: 'Gain:', refund: 'Remboursement', drawRefund: '🤝 Nulle — mises remboursées', winnerGets: '🏆 Le gagnant empoche 98%', needDep: 'Déposer', toJoin: 'pour rejoindre', yourStake: 'Votre mise:', oppStake: 'Mise adversaire:', totalPot: 'Cagnotte totale:', setTime: 'Choisir temps:', approveTx: '⏳ Approbation...', depositTx: '💸 Dépôt...', confirmingTx: '⏳ Attente confirmation...', successDep: '✅ Dépôt accepté!', successJoin: '✅ Dépôt versé!', errTx: '❌ Erreur: ', errBal: '❌ Solde insuffisant', claimBtn: '💰 Réclamer les gains', victoryTitle: '🏆 Victoire!', defeatTitle: '😔 Défaite', drawTitle: '🤝 Nulle', noMetaMask: '⚠️ MetaMask non installé', playerProfile: '👤 Profil', avatar: '🖼️ Avatar', name: '👤 Nom', bio: '📝 Bio', website: '🌐 Site', social: '🔗 Social', save: '💾 Enregistrer', availableGames: '🎮 Parties disponibles', guestInfo: '⏱️ Mode invité: gratuit vs bot. Choisir temps.', guestInstructions: '📖 Mode invité:\n• Choisir contrôle du temps ci-dessus.\n• Cliquer "🤖 Vs Bot".\n• Jouer gratuitement, pas de blockchain.', grokInstructions: `📖 Créer partie C4C:\n1️⃣ Cliquer "➕ Créer".\n2️⃣ Choisir mise & temps.\n3️⃣ Confirmer DEUX transactions dans wallet:\n   • Approve: autoriser dépenses C4C\n   • Create/Deposit: envoyer mise au contrat ${CHESS_CONTRACT.slice(0,10)}...${CHESS_CONTRACT.slice(-4)}\n4️⃣ Attendre confirmation (~15s).\n5️⃣ Copier lien & envoyer à adversaire.\n6️⃣ Quand adversaire dépose — partie commence!\n7️⃣ Gagnant empoche 98% (2% frais).`, txCancelled: '⚠️ Transaction annulée', step1: 'Étape 1/2: Approve', step2: 'Étape 2/2: Deposit', clickToCopy: '📋 Appuyer pour copier', checkBalance: '🔍 Vérifier solde contrat', profileSaved: '✅ Profil enregistré!', profileError: "❌ Échec de l'enregistrement", pvpMode: '👥 Mode PvP', botMode: '🤖 Mode Bot' },
  es: { t: '♟️ Chess4Crypto', s: 'Apuestas C4C PvP', g: '👤 Invitado', c: '🦊 Conectar', k: '💰 Comprar C4C', p: '👤 Perfil', l: '🚪 Salir', y: '👤 Tú', b: '🤖 Bot', yt: '♟️ ¡Tu turno!', bt: '🤖 Bot piensa (3s)...', w: '🏆 ¡GANASTE!', x: '😔 Perdiste', d: '🤝 Empate', tp: '⏰ Bot gana', tb: '⏰ Ganas tú', cn: '✅ Conectado', cl: 'Cerrar', cp: '📋 Copiar', cd: '✅ Copiado', gt: '💰 Comprar C4C', g1: '1. Ir a pink.meme, conectar wallet BNB.', g2: '2. Cambiar BNB por C4C.', g3: '3. Dirección del token:', ln: '🇪🇸 ES', th: '🎨 Tema', tm: { c: '🏛️ Clásico', w: '🪵 Madera', n: '💜 Neón', o: '🌊 Océano', s: '🌅 Atardecer', m: '⚪ Minimal' }, tc: 'Tiempo:', st: 'Apuesta (C4C):', cr: '➕ Partida', jn: '🤝 Unirse', mv: 'Movimientos:', newG: '🔄 Lobby', botG: '🤖 Vs Bot', select: 'Tiempo', bal: 'Saldo:', games: 'Partidas:', noG: 'Ninguna', myG: 'Mis', join: 'Unirse', copy: '¡Copiado!', invite: '🔗 Invitar', dep: '💰 Depositar', claim: '🏆 Reclamar', approve: '✅ Aprobar', waiting: '⏳ Espera...', playing: '♟️ En juego', sync: '🔄 Sync...', review: '🔍 Historial', live: '▶️ En vivo', prev: '⏪ Ant', next: '⏩ Sig', pot: 'Bote:', payout: 'Ganancia:', refund: 'Devolución', drawRefund: '🤝 Empate — apuestas devueltas', winnerGets: '🏆 El ganador se lleva 98%', needDep: 'Depositar', toJoin: 'para unirse', yourStake: 'Tu apuesta:', oppStake: 'Apuesta rival:', totalPot: 'Bote total:', setTime: 'Elegir tiempo:', approveTx: '⏳ Aprobando...', depositTx: '💸 Depositando...', confirmingTx: '⏳ Esperando confirmación...', successDep: '✅ Depósito aceptado!', successJoin: '✅ Depósito pagado!', errTx: '❌ Error: ', errBal: '❌ Saldo insuficiente', claimBtn: '💰 Reclamar premio', victoryTitle: '🏆 ¡Victoria!', defeatTitle: '😔 Derrota', drawTitle: '🤝 Empate', noMetaMask: '⚠️ MetaMask no instalado', playerProfile: '👤 Perfil', avatar: '🖼️ Avatar', name: '👤 Nombre', bio: '📝 Bio', website: '🌐 Web', social: '🔗 Social', save: '💾 Guardar', availableGames: '🎮 Partidas disponibles', guestInfo: '⏱️ Modo invitado: gratis vs bot. Elegir tiempo.', guestInstructions: '📖 Modo invitado:\n• Elegir control de tiempo arriba.\n• Click "🤖 Vs Bot".\n• Jugar gratis, sin blockchain.', grokInstructions: `📖 Crear partida C4C:\n1️⃣ Click "➕ Crear".\n2️⃣ Elegir apuesta & tiempo.\n3️⃣ Confirmar DOS transacciones en wallet:\n   • Approve: autorizar gastos C4C\n   • Create/Deposit: enviar apuesta al contrato ${CHESS_CONTRACT.slice(0,10)}...${CHESS_CONTRACT.slice(-4)}\n4️⃣ Esperar confirmación (~15s).\n5️⃣ Copiar enlace & enviar a oponente.\n6️⃣ Cuando oponente deposita — ¡partida comienza!\n7️⃣ Ganador se lleva 98% (2% comisión).`, txCancelled: '⚠️ Transacción cancelada', step1: 'Paso 1/2: Approve', step2: 'Paso 2/2: Deposit', clickToCopy: '📋 Toca para copiar', checkBalance: '🔍 Verificar saldo contrato', profileSaved: '✅ Perfil guardado!', profileError: '❌ Error al guardar', pvpMode: '👥 Modo PvP', botMode: '🤖 Modo Bot' },
  zh: { t: '♟️ Chess4Crypto', s: 'C4C PvP投注', g: '👤 访客', c: '🦊 连接', k: '💰 购买C4C', p: '👤 资料', l: '🚪 退出', y: '👤 你', b: '🤖 机器人', yt: '♟️ 轮到你!', bt: '🤖 机器人思考中 (3秒)...', w: '🏆 你赢了!', x: '😔 你输了', d: '🤝 平局', tp: '⏰ 机器人赢', tb: '⏰ 你赢了', cn: '✅ 已连接', cl: '关闭', cp: '📋 复制', cd: '✅ 已复制', gt: '💰 购买C4C', g1: '1. 访问pink.meme，连接BNB钱包。', g2: '2. 用BNB兑换C4C代币。', g3: '3. 代币地址:', ln: '🇨🇳 中文', th: '🎨 主题', tm: { c: '🏛️ 经典', w: '🪵 木质', n: '💜 霓虹', o: '🌊 海洋', s: '🌅 日落', m: '⚪ 简约' }, tc: '时间:', st: '赌注 (C4C):', cr: '➕ 创建比赛', jn: '🤝 加入', mv: '走法:', newG: '🔄 大厅', botG: '🤖 对战机器人', select: '选择时间', bal: '余额:', games: '游戏:', noG: '无游戏', myG: '我的游戏', join: '加入', copy: '链接已复制!', invite: '🔗 邀请', dep: '💰 存入', claim: '🏆 领取', approve: '✅ 授权', waiting: '⏳ 等待对手...', playing: '♟️ 游戏中', sync: '🔄 同步中...', review: '🔍 回顾', live: '▶️ 实时', prev: '⏪ 上一步', next: '⏩ 下一步', pot: '奖池:', payout: '奖金:', refund: '退款', drawRefund: '🤝 平局 — 赌注退还', winnerGets: '🏆 赢家获得98%', needDep: '需存入', toJoin: '以加入', yourStake: '你的赌注:', oppStake: '对手赌注:', totalPot: '总奖池:', setTime: '选择时间:', approveTx: '⏳ 授权中...', depositTx: '💸 存入中...', confirmingTx: '⏳ 等待确认...', successDep: '✅ 存入成功！', successJoin: '✅ 赌注已支付！', errTx: '❌ 错误: ', errBal: '❌ C4C余额不足', claimBtn: '💰 领取奖金', victoryTitle: '🏆 胜利!', defeatTitle: '😔 失败', drawTitle: '🤝 平局', noMetaMask: '⚠️ 未安装 MetaMask', playerProfile: '👤 资料', avatar: '🖼️ 头像', name: '👤 名字', bio: '📝 简介', website: '🌐 网站', social: '🔗 社交', save: '💾 保存', availableGames: '🎮 可加入的游戏', guestInfo: '⏱️ 访客模式：免费对战机器人。选择游戏时间。', guestInstructions: '📖 访客模式:\n• 在上方选择时间控制。\n• 点击"🤖 对战机器人"。\n• 免费游戏，无区块链。', grokInstructions: `📖 创建C4C对局:\n1️⃣ 点击"➕ 创建比赛"。\n2️⃣ 选择赌注和时间。\n3️⃣ 在钱包确认两笔交易:\n   • Approve: 授权花费 C4C\n   • Create/Deposit: 发送赌注到合约 ${CHESS_CONTRACT.slice(0,10)}...${CHESS_CONTRACT.slice(-4)}\n4️⃣ 等待确认 (~15秒)。\n5️⃣ 复制链接发送给对手。\n6️⃣ 对手存入后 — 游戏开始！\n7️⃣ 胜者赢得98%奖池 (2%手续费)。`, txCancelled: '⚠️ 交易已取消', step1: '步骤 1/2: Approve', step2: '步骤 2/2: Deposit', clickToCopy: '📋 点击复制', checkBalance: '🔍 检查合约余额', profileSaved: '✅ 资料已保存！', profileError: '❌ 保存失败', pvpMode: '👥 PvP 模式', botMode: '🤖 机器人模式' },
  hi: { t: '♟️ Chess4Crypto', s: 'C4C PvP दांव', g: '👤 अतिथि', c: '🦊 कनेक्ट', k: '💰 C4C खरीदें', p: '👤 प्रोफ़ाइल', l: '🚪 बाहर', y: '👤 आप', b: '🤖 बॉट', yt: '♟️ आपकी बारी!', bt: '🤖 बॉट सोच रहा (3से)...', w: '🏆 आप जीते!', x: '😔 आप हारे', d: '🤝 ड्रॉ', tp: '⏰ बॉट जीता', tb: '⏰ आप जीते', cn: '✅ कनेक्ट', cl: 'बंद', cp: '📋 कॉपी', cd: '✅ कॉपी', gt: '💰 C4C खरीदें', g1: '1. pink.meme पर जाएं, BNB वॉलेट कनेक्ट करें।', g2: '2. BNB को C4C में बदलें।', g3: '3. टोकन एड्रेस:', ln: '🇮🇳 हिंदी', th: '🎨 थीम', tm: { c: '🏛️ क्लासिक', w: '🪵 लकड़ी', n: '💜 नियॉन', o: '🌊 महासागर', s: '🌅 सूर्यास्त', m: '⚪ मिनिमल' }, tc: 'समय:', st: 'दांव (C4C):', cr: '➕ मैच बनाएं', jn: '🤝 जुड़ें', mv: 'चाल:', newG: '🔄 लॉबी', botG: '🤖 बॉट से', select: 'समय', bal: 'शेष:', games: 'गेम्स:', noG: 'कोई नहीं', myG: 'मेरे', join: 'जुड़ें', copy: 'कॉपी!', invite: '🔗 आमंत्रण', dep: '💰 जमा', claim: '🏆 क्लेम', approve: '✅ मंजूरी', waiting: '⏳ प्रतीक्षा...', playing: '♟️ खेल चल रहा', sync: '🔄 सिंक...', review: '🔍 इतिहास', live: '▶️ लाइव', prev: '⏪ पीछे', next: '⏩ आगे', pot: 'पॉट:', payout: 'जीत:', refund: 'वापसी', drawRefund: '🤝 ड्रॉ — दांव वापस', winnerGets: '🏆 विजेता 98% ले जाता है', needDep: 'जमा करें', toJoin: 'शामिल होने के लिए', yourStake: 'आपका दांव:', oppStake: 'प्रतिद्वंदी दांव:', totalPot: 'कुल पॉट:', setTime: 'समय चुनें:', approveTx: '⏳ मंजूरी...', depositTx: '💸 जमा...', confirmingTx: '⏳ पुष्टि की प्रतीक्षा...', successDep: '✅ जमा स्वीकार!', successJoin: '✅ दांव जमा!', errTx: '❌ त्रुटि: ', errBal: '❌ अपर्याप्त शेष', claimBtn: '💰 इनाम लें', victoryTitle: '🏆 जीत!', defeatTitle: '😔 हार', drawTitle: '🤝 ड्रॉ', noMetaMask: '⚠️ MetaMask स्थापित नहीं', playerProfile: '👤 प्रोफ़ाइल', avatar: '🖼️ अवतार', name: '👤 नाम', bio: '📝 बारे में', website: '🌐 वेबसाइट', social: '🔗 सोशल', save: '💾 सहेजें', availableGames: '🎮 उपलब्ध गेम्स', guestInfo: '⏱️ अतिथि मोड: बॉट के खिलाफ मुफ्त। समय चुनें।', guestInstructions: '📖 अतिथि मोड:\n• ऊपर समय नियंत्रण चुनें।\n• "🤖 बॉट से" क्लिक करें।\n• मुफ्त खेलें, कोई ब्लॉकचेन नहीं।', grokInstructions: `📖 C4C गेम बनाएं:\n1️⃣ "➕ मैच बनाएं" क्लिक करें।\n2️⃣ दांव और समय चुनें।\n3️⃣ वॉलेट में दो ट्रांजेक्शन पुष्टि करें:\n   • Approve: C4C खर्च करने की अनुमति दें\n   • Create/Deposit: दांव कॉन्ट्रैक्ट ${CHESS_CONTRACT.slice(0,10)}...${CHESS_CONTRACT.slice(-4)} को भेजें\n4️⃣ पुष्टि की प्रतीक्षा करें (~15s)。\n5️⃣ लिंक कॉपी करें और प्रतिद्वंदी को भेजें।\n6️⃣ जब प्रतिद्वंदी जमा करता है — गेम शुरू!\n7️⃣ विजेता 98% पॉट ले जाता है (2% फीस)।`, txCancelled: '⚠️ ट्रांजेक्शन रद्द', step1: 'चरण 1/2: Approve', step2: 'चरण 2/2: Deposit', clickToCopy: '📋 कॉपी करने के लिए टैप करें', checkBalance: '🔍 कॉन्ट्रैक्ट शेष जाँचें', profileSaved: '✅ प्रोफ़ाइल सहेजी गई!', profileError: '❌ सहेजने में त्रुटि', pvpMode: '👥 PvP मोड', botMode: '🤖 बॉट मोड' },
  ja: { t: '♟️ Chess4Crypto', s: 'C4C PvP ベッティング', g: '👤 ゲスト', c: '🦊 接続', k: '💰 C4Cを購入', p: '👤 プロフィール', l: '🚪 ログアウト', y: '👤 あなた', b: '🤖 ボット', yt: '♟️ あなたの番！', bt: '🤖 ボットが考え中 (3秒)...', w: '🏆 勝利！', x: '😔 敗北', d: '🤝 引き分け', tp: '⏰ ボットの勝ち', tb: '⏰ あなたの勝ち', cn: '✅ 接続済み', cl: '閉じる', cp: '📋 コピー', cd: '✅ コピー済み', gt: '💰 C4Cの買い方', g1: '1. pink.meme にアクセスし、BNB ウォレットを接続。', g2: '2. BNB を C4C に交換。', g3: '3. トークンアドレス:', ln: '🇯🇵 日本語', th: '🎨 テーマ', tm: { c: '🏛️ クラシック', w: '🪵 木製', n: '💜 ネオン', o: '🌊 海', s: '🌅 夕日', m: '⚪ 最小限' }, tc: '時間:', st: 'ベット額 (C4C):', cr: '➕ マッチ作成', jn: '🤝 参加', mv: '手:', newG: '🔄 ロビー', botG: '🤖 ボット対戦', select: '時間選択', bal: '残高:', games: 'ゲーム:', noG: 'ゲームなし', myG: 'マイゲーム', join: '参加', copy: 'リンクをコピー！', invite: '🔗 招待', dep: '💰 入金', claim: '🏆 受け取り', approve: '✅ 承認', waiting: '⏳ 対戦相手待ち...', playing: '♟️ ゲーム進行中', sync: '🔄 同期中...', review: '🔍 振り返り', live: '▶️ ライブ', prev: '⏪ 戻る', next: '⏩ 進む', pot: 'ゲームポット:', payout: '支払い:', refund: '返金', drawRefund: '🤝 引き分け — ベット返還', winnerGets: '🏆 勝者が 98% 獲得', needDep: '入金が必要', toJoin: '参加するには', yourStake: 'あなたのベット:', oppStake: '対戦相手のベット:', totalPot: '合計ポット:', setTime: '時間を選択:', approveTx: '1️⃣ C4C の使用を承認...', depositTx: '2️⃣ ポールにベットを送金...', confirmingTx: '⏳ ブロックチェーン確認待ち...', successDep: '✅ 入金確認！ゲーム作成完了。', successJoin: '✅ 入金完了！ゲーム開始。', errTx: '❌ エラー: ', errBal: '❌ C4C 残高不足', claimBtn: '💰 賞金を受け取る', victoryTitle: '🏆 勝利！', defeatTitle: '😔 敗北', drawTitle: '🤝 引き分け', noMetaMask: '⚠️ MetaMask/TrustWallet をインストール', playerProfile: '👤 プロフィール', avatar: '🖼️ アバター', name: '👤 名前', bio: '📝 自己紹介', website: '🌐 ウェブサイト', social: '🔗 SNS', save: '💾 保存', availableGames: '🎮 利用可能なゲーム', guestInfo: '⏱️ ゲストモード：ボットと無料で対戦。ゲーム時間を選択。', guestInstructions: '📖 ゲストモード:\n• 上記で時間制御を選択。\n• "🤖 ボット対戦" をクリック。\n• 無料でプレイ、ブロックチェーン不要。', grokInstructions: `📖 C4C ゲーム作成:\n1️⃣ "➕ マッチ作成" をクリック。\n2️⃣ ベット額と時間を選択。\n3️⃣ ウォレットで 2 つのトランザクションを確認:\n   • Approve: C4C 使用を承認\n   • Create/Deposit: ${CHESS_CONTRACT.slice(0,10)}...${CHESS_CONTRACT.slice(-4)} にベットを送金\n4️⃣ 確認待ち (~15 秒)。\n5️⃣ リンクをコピーして対戦相手に送信。\n6️⃣ 対戦相手が入金 — ゲーム開始！\n7️⃣ 勝者が 98% 獲得 (2% 手数料)。`, txCancelled: '⚠️ トランザクションキャンセル', step1: 'ステップ 1/2: 承認', step2: 'ステップ 2/2: 入金', clickToCopy: '📋 タップしてコピー', checkBalance: '🔍 コントラクト残高を確認', profileSaved: '✅ プロフィール保存完了！', profileError: '❌ 保存エラー', pvpMode: '👥 PvP モード', botMode: '🤖 ボットモード' },
  ko: { t: '♟️ Chess4Crypto', s: 'C4C PvP 베팅', g: '👤 게스트', c: '🦊 연결', k: '💰 C4C 구매', p: '👤 프로필', l: '🚪 로그아웃', y: '👤 당신', b: '🤖 봇', yt: '♟️ 당신의 차례!', bt: '🤖 봇이 생각중 (3 초)...', w: '🏆 승리!', x: '😔 패배', d: '🤝 무승부', tp: '⏰ 봇 승리', tb: '⏰ 당신 승리', cn: '✅ 연결됨', cl: '닫기', cp: '📋 복사', cd: '✅ 복사됨', gt: '💰 C4C 구매방법', g1: '1. pink.meme 접속, BNB 지갑 연결.', g2: '2. BNB 를 C4C 로 교환.', g3: '3. 토큰 주소:', ln: '🇰🇷 한국어', th: '🎨 테마', tm: { c: '🏛️ 클래식', w: '🪵 나무', n: '💜 네온', o: '🌊 바다', s: '🌅 일몰', m: '⚪ 미니멀' }, tc: '시간:', st: '베팅액 (C4C):', cr: '➕ 매치 생성', jn: '🤝 참가', mv: '수:', newG: '🔄 로비', botG: '🤖 봇과 대결', select: '시간선택', bal: '잔고:', games: '게임:', noG: '게임없음', myG: '내게임', join: '참가', copy: '링크복사!', invite: '🔗 초대', dep: '💰 입금', claim: '🏆 청구', approve: '✅ 승인', waiting: '⏳ 상대대기중...', playing: '♟️ 게임진행중', sync: '🔄 동기화중...', review: '🔍 리뷰', live: '▶️ 라이브', prev: '⏪ 이전', next: '⏩ 다음', pot: '게임팟:', payout: '지급:', refund: '환불', drawRefund: '🤝 무승부 — 베팅금 반환', winnerGets: '🏆 승자가 98% 획득', needDep: '입금필요', toJoin: '참가하려면', yourStake: '당신베팅:', oppStake: '상대베팅:', totalPot: '총팟:', setTime: '시간선택:', approveTx: '1️⃣ C4C 사용승인...', depositTx: '2️⃣ 팟으로 베팅송금...', confirmingTx: '⏳ 블록체인확인대기...', successDep: '✅ 입금확인! 게임생성완료.', successJoin: '✅ 입금완료! 게임시작.', errTx: '❌ 오류: ', errBal: '❌ C4C 잔고부족', claimBtn: '💰 상금청구', victoryTitle: '🏆 승리!', defeatTitle: '😔 패배', drawTitle: '🤝 무승부', noMetaMask: '⚠️ MetaMask/TrustWallet 설치', playerProfile: '👤 프로필', avatar: '🖼️ 아바타', name: '👤 이름', bio: '📝 소개', website: '🌐 웹사이트', social: '🔗 SNS', save: '💾 저장', availableGames: '🎮 이용가능게임', guestInfo: '⏱️ 게스트모드: 봇과 무료대결. 게임시간선택.', guestInstructions: '📖 게스트모드:\n• 위에서 시간제어선택.\n• "🤖 봇과대결" 클릭.\n• 무료플레이, 블록체인불필요.', grokInstructions: `📖 C4C 게임생성:\n1️⃣ "➕ 매치생성" 클릭.\n2️⃣ 베팅액과시간선택.\n3️⃣ 지갑에서 2 개트랜잭션확인:\n   • Approve: C4C 사용승인\n   • Create/Deposit: ${CHESS_CONTRACT.slice(0,10)}...${CHESS_CONTRACT.slice(-4)} 로베팅송금\n4️⃣ 확인대기 (~15 초).\n5️⃣ 링크복사하여상대에게전송.\n6️⃣ 상대입금 — 게임시작!\n7️⃣ 승자가 98% 획득 (2% 수수료).`, txCancelled: '⚠️ 트랜잭션취소', step1: '단계 1/2: 승인', step2: '단계 2/2: 입금', clickToCopy: '📋 탭하여복사', checkBalance: '🔍 컨트랙트잔고확인', profileSaved: '✅ 프로필저장완료!', profileError: '❌ 저장오류', pvpMode: '👥 PvP 모드', botMode: '🤖 봇모드' },
  pt: { t: '♟️ Chess4Crypto', s: 'Apostas C4C PvP', g: '👤 Convidado', c: '🦊 Conectar', k: '💰 Comprar C4C', p: '👤 Perfil', l: '🚪 Sair', y: '👤 Você', b: '🤖 Bot', yt: '♟️ Sua vez!', bt: '🤖 Bot pensando (3s)...', w: '🏆 VOCÊ GANHOU!', x: '😔 Perdeu', d: '🤝 Empate', tp: '⏰ Bot ganha', tb: '⏰ Você ganha', cn: '✅ Conectado', cl: 'Fechar', cp: '📋 Copiar', cd: '✅ Copiado', gt: '💰 Comprar C4C', g1: '1. Acesse pink.meme, conecte carteira BNB.', g2: '2. Troque BNB por token C4C.', g3: '3. Endereço do token:', ln: '🇵🇹 PT', th: '🎨 Tema', tm: { c: '🏛️ Clássico', w: '🪵 Madeira', n: '💜 Néon', o: '🌊 Oceano', s: '🌅 Pôr do sol', m: '⚪ Minimal' }, tc: 'Tempo:', st: 'Aposta (C4C):', cr: '➕ Criar Partida', jn: '🤝 Entrar', mv: 'Jogadas:', newG: '🔄 Lobby', botG: '🤖 Vs Bot', select: 'Tempo', bal: 'Saldo:', games: 'Partidas:', noG: 'Sem partidas', myG: 'Minhas', join: 'Entrar', copy: 'Copiado!', invite: '🔗 Convite', dep: '💰 Depositar', claim: '🏆 Resgatar', approve: '✅ Aprovar', waiting: '⏳ Aguardando oponente...', playing: '♟️ Jogo em andamento', sync: '🔄 Sincronizando...', review: '🔍 Revisão', live: '▶️ Ao vivo', prev: '⏪ Ant', next: '⏩ Próx', pot: 'Pote do jogo:', payout: 'Pagamento:', refund: 'Reembolso', drawRefund: '🤝 Empate — apostas devolvidas', winnerGets: '🏆 Vencedor leva 98% do pote', needDep: 'Precisa depositar', toJoin: 'para entrar', yourStake: 'Sua aposta:', oppStake: 'Aposta do oponente:', totalPot: 'Pote total:', setTime: 'Selecionar tempo:', approveTx: '1️⃣ Aprovar C4C...', depositTx: '2️⃣ Depositar no pool...', confirmingTx: '⏳ Aguardando confirmação blockchain...', successDep: '✅ Depósito confirmado! Jogo criado.', successJoin: '✅ Depósito pago! Jogo iniciado.', errTx: '❌ Erro: ', errBal: '❌ Saldo insuficiente de C4C', claimBtn: '💰 Resgatar ganhos', victoryTitle: '🏆 Vitória!', defeatTitle: '😔 Derrota', drawTitle: '🤝 Empate', noMetaMask: '⚠️ Instale MetaMask/TrustWallet', playerProfile: '👤 Perfil', avatar: '🖼️ Avatar', name: '👤 Nome', bio: '📝 Bio', website: '🌐 Site', social: '🔗 Social', save: '💾 Salvar', availableGames: '🎮 Partidas disponíveis', guestInfo: '⏱️ Modo convidado: grátis vs bot. Selecione o tempo do jogo.', guestInstructions: '📖 Modo Convidado:\n• Selecione controle de tempo acima.\n• Clique "🤖 Vs Bot".\n• Jogue grátis, sem blockchain.', grokInstructions: `📖 Criar jogo C4C:\n1️⃣ Clique "➕ Criar Partida".\n2️⃣ Selecione aposta e tempo.\n3️⃣ Confirme DUAS transações na carteira:\n   • Approve: permitir gastar C4C\n   • Create/Deposit: enviar aposta para contrato ${CHESS_CONTRACT.slice(0,10)}...${CHESS_CONTRACT.slice(-4)}\n4️⃣ Aguarde confirmação (~15s).\n5️⃣ Copie link e envie para oponente.\n6️⃣ Quando oponente depositar — jogo começa!\n7️⃣ Vencedor leva 98% do pote (2% taxa).`, txCancelled: '⚠️ Transação cancelada', step1: 'Passo 1/2: Aprovar', step2: 'Passo 2/2: Depositar', clickToCopy: '📋 Toque para copiar', checkBalance: '🔍 Verificar saldo do contrato', profileSaved: '✅ Perfil salvo!', profileError: '❌ Falha ao salvar perfil', pvpMode: '👥 Modo PvP', botMode: '🤖 Modo Bot' }
}

const THEMES = {
  c: { l: '#eeeed2', d: '#769656', n: '🏛️ Classic', class: 'chessboard-theme-c' },
  w: { l: '#f0d9b5', d: '#b58863', n: '🪵 Wood', class: 'chessboard-theme-w' },
  n: { l: '#1a1a2e', d: '#16213e', n: '💜 Neon', class: 'chessboard-theme-n' },
  o: { l: '#e0f7fa', d: '#006064', n: '🌊 Ocean', class: 'chessboard-theme-o' },
  s: { l: '#fff3e0', d: '#e65100', n: '🌅 Sunset', class: 'chessboard-theme-s' },
  m: { l: '#e0e0e0', d: '#757575', n: '⚪ Minimal', class: 'chessboard-theme-m' }
}

const TIME_OPTIONS = [5, 15, 30, 60, 1440]
const STAKE_OPTIONS = [500, 1000, 5000, 10000, 25000, 50000, 100000, 250000]
const fmtTime = s => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60; return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}` }

const CHESS_ABI = [
  {"inputs":[{"internalType":"address","name":"_gameToken","type":"address"},{"internalType":"address","name":"_feeRecipient","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"gameId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"creator","type":"address"},{"indexed":false,"internalType":"uint256","name":"stake","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"timeLimit","type":"uint256"}],"name":"GameCreated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"gameId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"challenger","type":"address"}],"name":"GameJoined","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"gameId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"StakeDeposited","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"gameId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"winner","type":"address"},{"indexed":false,"internalType":"bool","name":"isDraw","type":"bool"},{"indexed":false,"internalType":"uint256","name":"payout","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"fee","type":"uint256"}],"name":"GameFinished","type":"event"},
  {"inputs":[],"name":"FEE_BASE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"PLATFORM_FEE_BPS","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"bytes32","name":"gameId","type":"bytes32"}],"name":"createGame","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"bytes32","name":"gameId","type":"bytes32"}],"name":"depositStake","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"gameToken","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"games","outputs":[{"internalType":"address","name":"creator","type":"address"},{"internalType":"address","name":"challenger","type":"address"},{"internalType":"uint256","name":"stake","type":"uint256"},{"internalType":"bool","name":"creatorPaid","type":"bool"},{"internalType":"bool","name":"challengerPaid","type":"bool"},{"internalType":"address","name":"winner","type":"address"},{"internalType":"bool","name":"isDraw","type":"bool"},{"internalType":"bool","name":"finished","type":"bool"},{"internalType":"uint256","name":"createdAt","type":"uint256"},{"internalType":"uint256","name":"timeLimit","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"bytes32","name":"gameId","type":"bytes32"},{"internalType":"address","name":"winner","type":"address"},{"internalType":"bool","name":"isDraw","type":"bool"}],"name":"finishGame","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"bytes32","name":"gameId","type":"bytes32"}],"name":"getGame","outputs":[{"internalType":"address","name":"creator","type":"address"},{"internalType":"address","name":"challenger","type":"address"},{"internalType":"uint256","name":"stake","type":"uint256"},{"internalType":"bool","name":"creatorPaid","type":"bool"},{"internalType":"bool","name":"challengerPaid","type":"bool"},{"internalType":"address","name":"winner","type":"address"},{"internalType":"bool","name":"isDraw","type":"bool"},{"internalType":"bool","name":"finished","type":"bool"},{"internalType":"uint256","name":"createdAt","type":"uint256"},{"internalType":"uint256","name":"timeLimit","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getContractBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getFeeRecipient","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getTokenAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"player","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"checkAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"emergencyWithdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"platformFeeRecipient","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}
]

const ERC20_ABI = [
  {"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"}
]

export default function App() {
  const [lang, setLang] = useState('ru')
  const [view, setView] = useState('menu')
  const [profileTab, setProfileTab] = useState('lobby')
  const [msg, setMsg] = useState('')
  const [grok, setGrok] = useState(false)
  const [cop, setCop] = useState(false)
  const [theme, setTheme] = useState('c')
  const [bs, setBs] = useState(360)
  const [createStake, setCreateStake] = useState(5000)
  const [timeCtrl, setTimeCtrl] = useState(15)
  const [pendingJoin, setPendingJoin] = useState(null)
  const [inviteLink, setInviteLink] = useState('')
  const [selectedSq, setSelectedSq] = useState(null)
  const [possibleMoves, setPossibleMoves] = useState([])
  const [moveHistory, setMoveHistory] = useState([])
  const [gameId, setGameId] = useState('')
  const [isDeposited, setIsDeposited] = useState(false)
  const [gameState, setGameState] = useState('idle')
  const [remoteFen, setRemoteFen] = useState(null)
  const [isRemoteTurn, setIsRemoteTurn] = useState(false)
  const [syncStatus, setSyncStatus] = useState('')
  const [currentMoveIdx, setCurrentMoveIdx] = useState(-1)
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [liveFen, setLiveFen] = useState(null)
  const [userBalance, setUserBalance] = useState(0)
  const [activeGames, setActiveGames] = useState([])
  const [availableGames, setAvailableGames] = useState([])
  const [loadingTx, setLoadingTx] = useState(false)
  const [txHash, setTxHash] = useState(null)
  const [contractBalance, setContractBalance] = useState(null)
  const [profile, setProfile] = useState({ avatar: '', name: '', bio: '', website: '', social: '' })
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [isPvP, setIsPvP] = useState(false)
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  const [hist, setHist] = useState(['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'])
  const [mi, setMi] = useState(0)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [pTime, setPTime] = useState(15 * 60)
  const [bTime, setBTime] = useState(15 * 60)
  const [timerActive, setTimerActive] = useState(null)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  
  // ✅ Ref для мгновенной блокировки повторных подключений
  const connectingRef = useRef(false)

  const gameRef = useRef(new Chess())
  const timerRef = useRef(null)
  const unsubscribeRef = useRef(null)
  const botTimerRef = useRef(null)

  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { connectors, connect, isPending: isConnecting } = useConnect()
  const { writeContractAsync } = useWriteContract()
  const { depositReceipt, isSuccess: depositConfirmed } = useWaitForTransactionReceipt({ hash: txHash })

  // ✅ ЗАПРОС БАЛАНСА — ИСПРАВЛЕННЫЙ
  const {  balanceData, refetch: refetchBalance, isLoading: balanceLoading, isError: balanceError } = useReadContract({
    address: C4C_ADDR,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: { 
      enabled: !!address && isConnected,
      refetchInterval: 5000,
      staleTime: 0,
      retry: 1,
      retryDelay: 1000
    }
  })
  
  const {  contractBalanceData } = useReadContract({
    address: C4C_ADDR,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [CHESS_CONTRACT],
    query: { enabled: true }
  })

  const t = useCallback(k => LANG[lang]?.[k] || LANG['en']?.[k] || k, [lang])

  // ✅ ФУНКЦИИ ОБЪЯВЛЕНЫ ДО useEffect — ИСПРАВЛЕНИЕ ОШИБКИ
  const loadProfile = useCallback(async () => { 
    if (!address) return; try { setProfileLoading(true); const d = await getProfile(address); if (d) setProfile(d) } catch (e) { console.warn('Profile:', e.message) } finally { setProfileLoading(false) } 
  }, [address])
  
  const loadAvailableGames = useCallback(async () => { try { const g = await listAvailableGames(); setAvailableGames(g || []) } catch (e) { console.warn('Games:', e.message) } }, [])
  const loadActiveGames = useCallback(async () => { if (!address) return; try { const { data, error } = await supabase.from('games').select('*').or(`creator.eq.${address},challenger.eq.${address}`).order('created_at', { ascending: false }).limit(10); if (!error) setActiveGames(data || []) } catch (e) { console.warn('Active:', e.message) } }, [address])
  
  const guest = () => { setMsg(t('g')); resetGame(); startGame() }
  const buyC4C = () => setGrok(true)
  const langNext = () => setLang(l => { const langs = Object.keys(LANG); return langs[(langs.indexOf(l) + 1) % langs.length] })
  
  const copyToClipboard = async (text) => { try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); setCop(true); setTimeout(() => setCop(false), 2000); return true } } catch (e) { } setMsg(t('clickToCopy') + ': ' + text.slice(0, 30) + '...'); return false }
  const copyAddr = () => copyToClipboard(C4C_ADDR)
  
  const connectWallet = async () => { 
    if (connectingRef.current || isConnecting) {
      console.log('⏳ Connection already in progress')
      return
    }
    
    try { 
      connectingRef.current = true
      setMsg('🔄 Подключение кошелька...')
      
      const connector = connectors.find(c => c.id === 'metaMask') || connectors[0]
      
      if (connector) {
        await connect({ connector })
        setMsg('⏳ Ожидание подтверждения...')
      } else {
        setMsg(t('noMetaMask'))
        console.warn('⚠️ No wallet connector found')
      }
    } catch (e) { 
      console.error('❌ Connect error:', e)
      if (e.message?.includes('already pending')) {
        setMsg('⏳ Запрос уже в обработке. Пожалуйста, подождите...')
      } else if (e.message?.includes('rejected') || e.message?.includes('denied')) {
        setMsg('❌ Подключение отменено пользователем')
      } else {
        setMsg(t('noMetaMask'))
      }
    } finally { 
      setTimeout(() => { connectingRef.current = false }, 1000)
    } 
  }
  
  const resetGame = () => { gameRef.current.reset(); setFen(gameRef.current.fen()); setHist([gameRef.current.fen()]); setMi(0); setIsPlayerTurn(true); setGameOver(false); setWinner(null); setMoveHistory([]); setSelectedSq(null); setPossibleMoves([]); setIsDeposited(false); setGameState('idle'); setIsPvP(false); setRemoteFen(null); setIsRemoteTurn(false); setCurrentMoveIdx(-1); setIsReviewMode(false); setLiveFen(null); setTxHash(null); if (botTimerRef.current) clearTimeout(botTimerRef.current); if (unsubscribeRef.current) { unsubscribeRef.current(); unsubscribeRef.current = null } }
  const startGame = () => { setPTime(timeCtrl * 60); setBTime(timeCtrl * 60); setTimerActive('player'); setView('game'); setGameState('playing') }
  
  const handleCreateMatch = async () => {
    if (!isConnected || !address) { setMsg('🦊 ' + t('c')); return }
    const currentBalance = balanceData != null ? Number(formatUnits(balanceData, 18)) : userBalance
    if (currentBalance < createStake) { setMsg(t('errBal') + ` (нужно: ${createStake}, есть: ${currentBalance})`); return }
    setLoadingTx(true)
    try {
      setMsg(t('step1'))
      await writeContractAsync({ address: C4C_ADDR, abi: ERC20_ABI, functionName: 'approve', args: [CHESS_CONTRACT, parseUnits(createStake.toString(), 18)] })
      const rawId = 'game_' + Date.now() + '_' + address?.slice(2, 10) + '_' + Math.random().toString(36).slice(2, 10)
      const bytes32Id = keccak256(stringToBytes(rawId))
      setMsg(t('step2') + ' (create)')
      await writeContractAsync({ address: CHESS_CONTRACT, abi: CHESS_ABI, functionName: 'createGame', args: [bytes32Id, parseUnits(createStake.toString(), 18), BigInt(timeCtrl)] })
      setMsg(t('step2') + ' (deposit)')
      const depositTx = await writeContractAsync({ address: CHESS_CONTRACT, abi: CHESS_ABI, functionName: 'depositStake', args: [bytes32Id] })
      setTxHash(depositTx)
      await createGameRecord(rawId, address, createStake, timeCtrl)
      setGameId(rawId); setIsDeposited(true); setIsPvP(false)
      const link = `${window.location.origin}${window.location.pathname}?game=${rawId}&stake=${createStake}&time=${timeCtrl}`
      setInviteLink(link); await copyToClipboard(link); setMsg(t('confirmingTx'))
      setupGameSubscription(rawId); await loadActiveGames(); await loadAvailableGames(); setProfileTab('my')
      setTimeout(() => refetchBalance?.(), 2000)
    } catch (e) {
      if (e.message?.includes('rejected') || e.message?.includes('denied')) setMsg(t('txCancelled'))
      else if (e.message?.includes('reverted')) setMsg('❌ Контракт отклонил: проверьте approve и gameId')
      else setMsg(t('errTx') + (e.shortMessage || e.message))
    } finally { setLoadingTx(false) }
  }

  const handleJoinMatch = async () => {
    if (!isConnected || !pendingJoin || !address) { setMsg('🦊 ' + t('c')); return }
    const currentBalance = balanceData != null ? Number(formatUnits(balanceData, 18)) : userBalance
    if (currentBalance < pendingJoin.stake) { setMsg(t('errBal')); return }
    setLoadingTx(true)
    try {
      setMsg(t('step1'))
      await writeContractAsync({ address: C4C_ADDR, abi: ERC20_ABI, functionName: 'approve', args: [CHESS_CONTRACT, parseUnits(pendingJoin.stake.toString(), 18)] })
      const bytes32Id = keccak256(stringToBytes(pendingJoin.id))
      setMsg(t('step2'))
      const depositTx = await writeContractAsync({ address: CHESS_CONTRACT, abi: CHESS_ABI, functionName: 'depositStake', args: [bytes32Id] })
      setTxHash(depositTx)
      await updateGameStatus(pendingJoin.id, { challenger: address, challengerPaid: true, status: 'playing', updated_at: new Date().toISOString() })
      setGameId(pendingJoin.id); setCreateStake(pendingJoin.stake); setTimeCtrl(pendingJoin.time)
      setGameState('playing'); setIsPvP(true)
      setupGameSubscription(pendingJoin.id); setMsg(t('successJoin')); setPendingJoin(null)
      loadActiveGames(); loadAvailableGames(); setTimeout(() => startGame(), 500)
      setTimeout(() => refetchBalance?.(), 2000)
    } catch (e) { setMsg(e.message?.includes('rejected') ? t('txCancelled') : t('errTx') + (e.shortMessage || e.message)) } finally { setLoadingTx(false) }
  }

  const setupGameSubscription = (id) => { if (unsubscribeRef.current) unsubscribeRef.current(); unsubscribeRef.current = subscribeToGame(id, { onGameUpdate: (g) => { if (g.status === 'playing' && !g.challengerPaid) setMsg(t('waiting')); else if (g.status === 'playing' && g.challengerPaid && !isPvP) setIsPvP(true) }, onMove: (m) => { if (m.player !== address && !isReviewMode) { setSyncStatus('🔄...'); setTimeout(() => { try { gameRef.current.move({ from: m.from_sq, to: m.to_sq, promotion: 'q' }); const nf = gameRef.current.fen(); setFen(nf); setLiveFen(nf); setHist(h => [...h, nf]); setMoveHistory(mh => [...mh, { san: m.san, from: m.from_sq, to: m.to_sq }]); setMi(i => i + 1); setCurrentMoveIdx(i => i + 1); setIsPlayerTurn(true); setTimerActive('player'); setSyncStatus(''); if (gameRef.current.isCheckmate()) { setGameOver(true); setWinner(address); handleClaim(false) } else if (gameRef.current.isDraw()) { setGameOver(true); setWinner(null); handleClaim(true) } else setMsg(t('yt')) } catch (e) { console.warn(e) } }, 300) } } }) }
  const handleClaim = (isDraw) => { if (!gameId) return; if (!isConnected || !address) { setMsg(isDraw ? t('drawRefund') : t('winnerGets')); return } const bytes32Id = keccak256(stringToBytes(gameId)); writeContractAsync({ address: CHESS_CONTRACT, abi: CHESS_ABI, functionName: 'finishGame', args: [bytes32Id, address, isDraw] }).then(() => { setMsg(isDraw ? t('drawRefund') : t('winnerGets')); setGameState('idle') }).catch(e => setMsg(e.message?.includes('rejected') ? t('txCancelled') : t('errTx'))) }

  const botMove = useCallback(() => { if (gameOver || gameRef.current.isGameOver() || gameState !== 'playing' || isRemoteTurn || isReviewMode || isPvP) return; const moves = gameRef.current.moves({ verbose: true }); if (!moves.length) return; let c; const r = Math.random(); if (r < 0.7) c = moves[Math.floor(Math.random() * moves.length)]; else { const caps = moves.filter(m => m.captured); c = caps.length ? caps[Math.floor(Math.random() * caps.length)] : moves[Math.floor(Math.random() * moves.length)] } gameRef.current.move(c); const san = gameRef.current.history({ verbose: true }).pop()?.san || `${c.from}${c.to}`; const nf = gameRef.current.fen(); setFen(nf); setLiveFen(nf); setHist(h => [...h, nf]); setMoveHistory(mh => [...mh, { san, from: c.from, to: c.to }]); setMi(i => i + 1); setCurrentMoveIdx(i => i + 1); setIsPlayerTurn(true); setTimerActive('player'); if (gameRef.current.isCheckmate()) { setGameOver(true); setWinner('bot'); setMsg(t('x')) } else if (gameRef.current.isDraw()) { setGameOver(true); setWinner(null); handleClaim(true) } else setMsg(t('yt')) }, [gameOver, t, gameState, isRemoteTurn, isReviewMode, isPvP])
  const onSqClick = useCallback((sq) => { if (gameOver || gameState !== 'playing' || !isPlayerTurn || isRemoteTurn || isReviewMode) return; const p = gameRef.current.get(sq); if (p && p.color === (isPlayerTurn ? 'w' : 'b')) { setSelectedSq(sq); setPossibleMoves(gameRef.current.moves({ square: sq, verbose: true }).map(m => m.to)); return } if (selectedSq && possibleMoves.includes(sq)) { onDrop(selectedSq, sq); setSelectedSq(null); setPossibleMoves([]); return } setSelectedSq(null); setPossibleMoves([]) }, [gameOver, isPlayerTurn, selectedSq, possibleMoves, gameState, isRemoteTurn, isReviewMode])
  const onDrop = useCallback((src, tgt) => { if (!isPlayerTurn || gameOver || gameState !== 'playing' || isRemoteTurn || isReviewMode) return false; try { const r = gameRef.current.move({ from: src, to: tgt, promotion: 'q' }); if (!r) return false; const san = gameRef.current.history({ verbose: true }).pop()?.san || `${src}${tgt}`; const nf = gameRef.current.fen(); setFen(nf); setLiveFen(nf); setHist(h => [...h, nf]); setMoveHistory(mh => [...mh, { san, from: src, to: tgt }]); setMi(i => i + 1); setCurrentMoveIdx(i => i + 1); setIsPlayerTurn(false); setTimerActive('bot'); setSelectedSq(null); setPossibleMoves([]); if (gameId && address) { setSyncStatus('🔄...'); recordMove(gameId, address, src, tgt, san, nf).then(() => setSyncStatus('')).catch(() => setSyncStatus('')) } if (gameRef.current.isCheckmate()) { setGameOver(true); setWinner(address); handleClaim(false) } else if (gameRef.current.isDraw()) { setGameOver(true); setWinner(null); handleClaim(true) } else { setMsg(t('bt')); if (!isPvP && botTimerRef.current) clearTimeout(botTimerRef.current); if (!isPvP) botTimerRef.current = setTimeout(() => { botMove() }, 3000) } return true } catch { return false } }, [isPlayerTurn, gameOver, gameState, isRemoteTurn, isReviewMode, gameId, address, botMove, t, isPvP])
  const goToMove = (i) => { if (i < 0 || i >= hist.length) return; setCurrentMoveIdx(i); setFen(hist[i]); setIsReviewMode(i < hist.length - 1); setIsPlayerTurn(i % 2 === 0) }
  const prevMove = () => { if (currentMoveIdx > 0) goToMove(currentMoveIdx - 1) }
  const nextMove = () => { if (currentMoveIdx < hist.length - 1) goToMove(currentMoveIdx + 1); else resumeLive() }
  const resumeLive = () => { if (liveFen) { setFen(liveFen); setCurrentMoveIdx(hist.length - 1); setIsReviewMode(false); setIsPlayerTurn(hist.length % 2 === 1); setMsg(t('live')) } }

  const sqStyles = useMemo(() => { const s = {}; if (selectedSq && !isReviewMode) s[selectedSq] = { backgroundColor: 'rgba(255,255,0,0.4)' }; possibleMoves.forEach(q => { if (!isReviewMode) s[q] = { backgroundColor: 'rgba(20,85,30,0.5)', backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.9) 25%,transparent 25%)', backgroundSize: '14px 14px', backgroundPosition: 'center' } }); return s }, [selectedSq, possibleMoves, isReviewMode])
  const BtnStyle = (c, d) => ({ width: '100%', padding: '12px', background: c || COLORS.btnBlue, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: '600', cursor: d ? 'not-allowed' : 'pointer', marginTop: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', opacity: d ? 0.5 : 1 })

  const handleSaveProfile = async () => { if (!address) { setMsg('❌ ' + t('noMetaMask')); return } if (profile.bio?.length > 500) { setMsg('❌ Био макс. 500 символов'); return } setProfileLoading(true); try { const ok = await updateProfile(address, profile); if (ok) { setMsg(t('profileSaved')); setIsEditingProfile(false); loadProfile() } else { setMsg(t('profileError')) } } catch (e) { setMsg(t('profileError') + ': ' + e.message) } finally { setProfileLoading(false) } }

  // ✅ Обновление баланса — с проверкой на валидность данных
  useEffect(() => {
    if (balanceData != null && typeof balanceData === 'bigint') {
      const formatted = Number(formatUnits(balanceData, 18))
      setUserBalance(formatted)
      console.log('💰 Balance updated:', formatted, 'C4C')
    }
  }, [balanceData])

  useEffect(() => {
    if (contractBalanceData != null && typeof contractBalanceData === 'bigint') {
      setContractBalance(Number(formatUnits(contractBalanceData, 18)))
    }
  }, [contractBalanceData])

  // ✅ НОВЫЙ ЭФФЕКТ: Обновляем баланс и профиль, когда address появляется
  useEffect(() => {
    if (isConnected && address) {
      console.log('✅ Address received:', address)
      loadProfile()
      setTimeout(() => {
        refetchBalance?.()
        console.log('🔄 Balance refetched after connect')
      }, 800)
    }
  }, [isConnected, address, loadProfile, refetchBalance])

  useEffect(() => { const r = () => setBs(Math.min(window.innerWidth - 40, 400)); r(); window.addEventListener('resize', r); return () => window.removeEventListener('resize', r) }, [])
  useEffect(() => { if (depositConfirmed && gameId) { setMsg(t('successDep')); setGameState('waiting_funds'); setTxHash(null) } }, [depositConfirmed, gameId, t])
  useEffect(() => { if (timerRef.current) clearInterval(timerRef.current); if (!timerActive || gameOver || gameState !== 'playing' || isReviewMode) return; timerRef.current = setInterval(() => { if (timerActive === 'player') { setPTime(p => { if (p <= 1) { clearInterval(timerRef.current); setGameOver(true); setWinner('bot'); setMsg(t('tp')); return 0 } return p - 1 }) } else { setBTime(p => { if (p <= 1) { clearInterval(timerRef.current); setGameOver(true); setWinner('player'); setMsg(t('tb')); return 0 } return p - 1 }) } }, 1000); return () => clearInterval(timerRef.current) }, [timerActive, gameOver, t, gameState, isReviewMode])
  useEffect(() => { const p = new URLSearchParams(window.location.search); const gid = p.get('game'); if (gid) { setPendingJoin({ id: gid, stake: parseInt(p.get('stake')) || 5000, time: parseInt(p.get('time')) || 15 }); setView('profile'); setProfileTab('lobby'); setMsg(`${t('needDep')} ${parseInt(p.get('stake')) || 5000} C4C ${t('toJoin')}`) } }, [t])
  useEffect(() => { loadActiveGames(); loadAvailableGames(); const i = setInterval(() => { loadActiveGames(); loadAvailableGames() }, 15000); return () => clearInterval(i) }, [address, loadActiveGames, loadAvailableGames])

  return (
    <div className={THEMES[theme]?.class} style={{ minHeight: '100vh', background: COLORS.bg, color: COLORS.text, fontFamily: 'system-ui', padding: '1rem', display: 'flex', justifyContent: 'center', overflowX: 'hidden' }}>
      {view === 'menu' && (
        <div style={{ maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <h1 style={{ color: COLORS.accent, marginBottom: 0 }}>{t('t')}</h1>
          {!pendingJoin && <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', width: '100%', marginBottom: '0.5rem' }}><label style={{ color: COLORS.textSec, display: 'block', marginBottom: '0.3rem' }}>{t('setTime')}</label><select value={timeCtrl} onChange={e => setTimeCtrl(Number(e.target.value))} style={{ width: '100%', padding: '10px', background: COLORS.cardBg, color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', fontSize: '1rem' }}>{TIME_OPTIONS.map(m => (<option key={m} value={m}>{m === 1440 ? '24h' : `${m}m`}</option>))}</select></div>}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', width: '100%', marginBottom: '0.5rem', fontSize: '0.85rem', lineHeight: '1.4', color: COLORS.textSec, whiteSpace: 'pre-line' }}>{t('guestInstructions')}</div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', width: '100%' }}><p style={{ color: COLORS.textSec, fontSize: '0.85rem', margin: 0, lineHeight: '1.4' }}>{t('guestInfo')}</p></div>
          <button onClick={guest} disabled={loadingTx} style={BtnStyle(COLORS.btnBlue, loadingTx)}>{t('g')}</button>
          {isConnected ? (
            <button onClick={() => { disconnect(); setView('menu') }} disabled={loadingTx} style={BtnStyle('#b71c1c', loadingTx)}>{t('l')}</button>
          ) : (
            <button 
              onClick={connectWallet} 
              disabled={loadingTx || isConnecting || connectingRef.current} 
              style={BtnStyle(COLORS.btnOrange, loadingTx || isConnecting || connectingRef.current)}
            >
              {isConnecting || connectingRef.current ? '⏳...' : t('c')}
            </button>
          )}
          <button onClick={buyC4C} disabled={loadingTx} style={BtnStyle(COLORS.btnOrange, loadingTx)}>{t('k')}</button>
          <button onClick={langNext} disabled={loadingTx} style={BtnStyle(COLORS.btnBlue, loadingTx)}>{t('ln')}</button>
          {msg && <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', color: COLORS.accent, textAlign: 'center', width: '100%' }}>{msg}</div>}
        </div>
      )}

      {view === 'profile' && (
        <div style={{ maxWidth: '600px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: COLORS.cardBg, padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>{profile.avatar && <img src={profile.avatar} alt="av" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid ' + COLORS.accent }} />}<div><div style={{ fontWeight: 'bold' }}>{profile.name || address?.slice(0, 6) + '...' + address?.slice(-4)}</div><div style={{ color: COLORS.textSec, fontSize: '0.9rem' }}>{t('bal')} <span style={{ color: COLORS.accent, fontWeight: 'bold' }}>{balanceLoading ? '⏳...' : balanceError ? '❌' : userBalance?.toLocaleString() || '0'} C4C</span></div></div></div>
            <button onClick={() => { disconnect(); setView('menu') }} style={{ ...BtnStyle('#b71c1c'), width: 'auto', padding: '8px 16px', marginTop: 0 }}>{t('l')}</button>
          </div>

          {profileTab === 'playerProfile' && (
            <div style={{ background: COLORS.cardBg, padding: '1rem', borderRadius: '12px' }}>
              <h3 style={{ color: COLORS.accent, margin: '0 0 1rem' }}>{t('playerProfile')}</h3>
              {isEditingProfile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <input value={profile.avatar} onChange={e => setProfile({ ...profile, avatar: e.target.value })} placeholder={t('avatar')} style={{ width: '100%', padding: '8px', background: '#00332e', border: '1px solid #00897b', borderRadius: '6px', color: '#fff' }} />
                  <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} maxLength={30} placeholder={t('name')} style={{ width: '100%', padding: '8px', background: '#00332e', border: '1px solid #00897b', borderRadius: '6px', color: '#fff' }} />
                  <textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} maxLength={500} rows={3} placeholder={t('bio')} style={{ width: '100%', padding: '8px', background: '#00332e', border: '1px solid #00897b', borderRadius: '6px', color: '#fff' }} />
                  <input value={profile.website} onChange={e => setProfile({ ...profile, website: e.target.value })} placeholder={t('website')} style={{ width: '100%', padding: '8px', background: '#00332e', border: '1px solid #00897b', borderRadius: '6px', color: '#fff' }} />
                  <input value={profile.social} onChange={e => setProfile({ ...profile, social: e.target.value })} placeholder={t('social')} style={{ width: '100%', padding: '8px', background: '#00332e', border: '1px solid #00897b', borderRadius: '6px', color: '#fff' }} />
                  <div style={{ display: 'flex', gap: '0.5rem' }}><button onClick={handleSaveProfile} disabled={profileLoading} style={BtnStyle('#10b981', profileLoading)}>{profileLoading ? '⏳...' : t('save')}</button><button onClick={() => { setIsEditingProfile(false); loadProfile() }} style={BtnStyle('#64748b')}>{t('cl')}</button></div>
                </div>
              ) : (
                <div>{profile.avatar && <img src={profile.avatar} alt="av" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 1rem', display: 'block', border: '3px solid ' + COLORS.accent }} />}<p><b>{t('name')}:</b> {profile.name || '—'}</p><p><b>{t('bio')}:</b> {profile.bio || '—'}</p>{profile.website && <p><b>{t('website')}:</b> <a href={profile.website} target="_blank" rel="noopener" style={{ color: '#60a5fa' }}>{profile.website}</a></p>}{profile.social && <p><b>{t('social')}:</b> <a href={profile.social.startsWith('http') ? profile.social : '#'} target="_blank" rel="noopener" style={{ color: '#60a5fa' }}>{profile.social}</a></p>}<button onClick={() => setIsEditingProfile(true)} style={BtnStyle(COLORS.btnBlue)}>{t('playerProfile')}</button></div>
              )}
            </div>
          )}

          {profileTab === 'lobby' && (
            <div style={{ background: COLORS.cardBg, padding: '1rem', borderRadius: '12px' }}>
              <h3 style={{ color: COLORS.accent, margin: '0 0 0.8rem' }}>{t('availableGames')}</h3>
              {availableGames.length > 0 ? availableGames.map(g => { const totalPot = (g.stake || 0) * ((g.creatorPaid ? 1 : 0) + (g.challengerPaid ? 1 : 0)); return (<div key={g.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '8px', marginBottom: '0.8rem' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><b>ID: ...{g.id.slice(-6)}</b><span style={{ color: g.status === 'playing' ? COLORS.accent : COLORS.textSec }}>{g.status}</span></div><div style={{ fontSize: '0.8rem', color: COLORS.textSec, margin: '0.5rem 0' }}>{t('st')}: {g.stake} | ⏱️ {g.time_limit}min | {t('totalPot')}: {totalPot}C4C</div>{!g.challengerPaid && g.creator !== address && <button onClick={() => { setPendingJoin({ id: g.id, stake: g.stake, time: g.time_limit }); handleJoinMatch() }} disabled={loadingTx} style={{ ...BtnStyle('#10b981', loadingTx), marginTop: '0.5rem' }}>{t('jn')} ({g.stake} C4C)</button>}</div>) }) : <p style={{ color: COLORS.textSec }}>{t('noG')}</p>}
            </div>
          )}

          {pendingJoin && <div style={{ background: 'linear-gradient(135deg,#1e293b,#334155)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: `2px solid ${COLORS.accent}` }}><h3 style={{ color: COLORS.accent, margin: '0 0 0.5rem' }}>{t('invite')}</h3><p>{t('needDep')} <b style={{ color: COLORS.accent }}>{pendingJoin.stake.toLocaleString()} C4C</b></p><p style={{ color: COLORS.textSec, fontSize: '0.9rem', marginBottom: '1rem' }}>⏱️ {pendingJoin.time} min</p><button onClick={handleJoinMatch} disabled={loadingTx} style={BtnStyle('#10b981', loadingTx)}>{`🤝 ${t('jn')}`}</button></div>}

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {['lobby', 'my', 'create', 'playerProfile'].map(tab => (<button key={tab} onClick={() => { setProfileTab(tab); if (tab === 'playerProfile') loadProfile() }} style={{ ...BtnStyle(profileTab === tab ? COLORS.btnBlue : '#334155', loadingTx), flex: '1', minWidth: '80px', padding: '10px 0', fontSize: '0.9rem', marginTop: 0 }}>{tab === 'lobby' ? t('availableGames') : tab === 'my' ? t('myG') : tab === 'create' ? t('cr') : t('playerProfile')}</button>))}
            <button onClick={langNext} style={{ ...BtnStyle('#334155'), minWidth: 'auto', flex: '0', width: 'auto', padding: '0 15px', marginTop: 0 }}>{t('ln')}</button>
            <select value={theme} onChange={e => setTheme(e.target.value)} style={{ ...BtnStyle('#334155'), width: 'auto', padding: '10px 15px' }}>{Object.entries(THEMES).map(([key, val]) => <option key={key} value={key}>{val.n}</option>)}</select>
          </div>

          {profileTab === 'create' && (
            <div style={{ background: COLORS.cardBg, padding: '1rem', borderRadius: '12px' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', lineHeight: '1.4', color: COLORS.textSec, whiteSpace: 'pre-line', border: '1px solid ' + COLORS.accent }}>{t('grokInstructions')}</div>
              <div style={{ marginBottom: '0.8rem' }}><label style={{ color: COLORS.textSec }}>{t('setTime')}</label><select value={timeCtrl} onChange={e => setTimeCtrl(Number(e.target.value))} style={{ width: '100%', padding: '10px', background: '#00332e', color: '#fff', border: '1px solid #00897b', borderRadius: '8px', marginTop: '4px' }}>{TIME_OPTIONS.map(m => (<option key={m} value={m}>{m === 1440 ? '24h' : `${m}m`}</option>))}</select></div>
              <div style={{ marginBottom: '0.5rem' }}><label>{t('st')}</label><div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>{STAKE_OPTIONS.map(a => (<button key={a} onClick={() => setCreateStake(a)} style={{ ...BtnStyle(createStake === a ? '#10b981' : '#334155', loadingTx), flex: '1', minWidth: '70px', padding: '10px 0', fontSize: '0.9rem', marginTop: 4 }}>{a.toLocaleString()}</button>))}</div></div>
              <button onClick={handleCreateMatch} disabled={loadingTx} style={BtnStyle('#10b981', loadingTx)}>{loadingTx ? (txHash ? t('confirmingTx') : t('approveTx')) : t('cr')}</button>
              {inviteLink && <div style={{ marginTop: '1rem', padding: '0.8rem', background: '#00332e', border: `1px solid ${COLORS.accent}`, borderRadius: '8px', wordBreak: 'break-all', fontSize: '0.8rem' }}><div style={{ color: COLORS.accent, marginBottom: '4px', fontWeight: 'bold' }}>{t('invite')}:</div><div style={{ color: COLORS.textSec, marginBottom: '8px', cursor: 'pointer' }} onClick={() => copyToClipboard(inviteLink)}>{inviteLink}<br /><small style={{ color: COLORS.textSec }}>{cop ? t('cd') : t('clickToCopy')}</small></div></div>}
            </div>
          )}

          {profileTab === 'my' && (
            <div style={{ background: COLORS.cardBg, padding: '1rem', borderRadius: '12px' }}>
              <p><b>Game ID:</b> {gameId || '-'}</p>
              <p><b>Status:</b> {gameState} {syncStatus && <span style={{ color: COLORS.accent }}>{syncStatus}</span>}</p>
              {txHash && <p style={{ color: COLORS.accent, fontSize: '0.8rem' }}>🔗 TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}</p>}
              {contractBalance !== null && <p style={{ color: COLORS.textSec, fontSize: '0.8rem' }}>🏦 {t('pot')} {contractBalance.toLocaleString()} C4C</p>}
              {gameState === 'playing' && <button onClick={() => setView('game')} disabled={loadingTx} style={BtnStyle('#8b5cf6', loadingTx)}>🎮 Play</button>}
              {gameState === 'waiting_funds' && (
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                  <p style={{ color: '#fbbf24', margin: 0 }}>{t('waiting')} ⏱️ {timeCtrl} min</p>
                  {inviteLink && <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input readOnly value={inviteLink} style={{ flex: 1, background: '#00221a', border: '1px solid #004d40', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }} />
                    <button onClick={() => copyToClipboard(inviteLink)} style={{ padding: '4px 10px', background: COLORS.btnBlue, color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{cop ? t('cd') : t('cp')}</button>
                  </div>}
                </div>
              )}
              {activeGames.length > 0 && <div style={{ marginTop: '1rem' }}>
                <h4 style={{ color: COLORS.accent }}>{t('myG')}</h4>
                {activeGames.map(g => (
                  <div key={g.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '6px', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    <div><b>ID:</b> ...{g.id.slice(-6)}</div>
                    <div><b>{t('st')}:</b> {g.stake} C4C | ⏱️ {g.time_limit}min</div>
                    <div><b>Status:</b> {g.status}</div>
                    {g.status === 'playing' && <button onClick={() => { setGameId(g.id); setGameState('playing'); setView('game') }} style={{ ...BtnStyle('#10b981'), width: 'auto', padding: '4px 12px', marginTop: '0.3rem', fontSize: '0.85rem' }}>{t('join')}</button>}
                  </div>
                ))}
              </div>}
            </div>
          )}
        </div>
      )}

      {view === 'game' && (
        <div style={{ maxWidth: '100%', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', maxWidth: '420px', marginBottom: '0.5rem' }}>
            <div style={{ background: '#004d40', padding: '10px 20px', borderRadius: '10px', color: '#fff', textAlign: 'center', border: '1px solid #00897b', width: '45%' }}><div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{t('y')}</div><div style={{ fontSize: '1.6rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{fmtTime(pTime)}</div></div>
            <div style={{ background: '#004d40', padding: '10px 20px', borderRadius: '10px', color: '#fff', textAlign: 'center', border: '1px solid #00897b', width: '45%' }}><div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{t('b')}</div><div style={{ fontSize: '1.6rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{fmtTime(bTime)}</div></div>
          </div>
          {syncStatus && <div style={{ textAlign: 'center', color: COLORS.accent, fontSize: '0.9rem', marginBottom: '0.3rem' }}>{syncStatus}</div>}
          {msg && <div style={{ color: '#38bdf8', textAlign: 'center', marginBottom: '0.3rem' }}>{msg}</div>}
          <div style={{ background: COLORS.cardBg, padding: '8px', borderRadius: '12px', display: 'flex', justifyContent: 'center', margin: '0 auto' }}><Chessboard position={fen} onPieceDrop={isReviewMode ? null : onDrop} onSquareClick={isReviewMode ? null : onSqClick} boardWidth={bs} customSquareStyles={sqStyles} customDarkSquareStyle={{ backgroundColor: THEMES[theme].d }} customLightSquareStyle={{ backgroundColor: THEMES[theme].l }} /></div>
          {moveHistory.length > 0 && <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'center' }}><button onClick={prevMove} disabled={currentMoveIdx <= 0} style={{ ...BtnStyle('#334155', loadingTx), width: 'auto', padding: '8px 16px' }}>{t('prev')}</button><button onClick={nextMove} disabled={currentMoveIdx >= hist.length - 1} style={{ ...BtnStyle('#334155', loadingTx), width: 'auto', padding: '8px 16px' }}>{t('next')}</button>{isReviewMode && <button onClick={resumeLive} disabled={loadingTx} style={{ ...BtnStyle('#10b981', loadingTx), width: 'auto', padding: '8px 16px' }}>{t('live')}</button>}</div>}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'center' }}><button onClick={() => { resetGame(); setView('profile') }} disabled={loadingTx} style={{ ...BtnStyle(COLORS.btnBlue, loadingTx), width: 'auto', flex: '1' }}>{t('newG')}</button><button onClick={() => { resetGame(); startGame() }} disabled={loadingTx} style={{ ...BtnStyle('#10b981', loadingTx), width: 'auto', flex: '1' }}>{t('botG')}</button></div>
          {moveHistory.length > 0 && <div style={{ marginTop: '0.5rem', background: COLORS.cardBg, padding: '0.5rem', borderRadius: '8px', maxHeight: '100px', overflowY: 'auto', fontSize: '0.8rem' }}>{moveHistory.map((m, i) => (<span key={i} style={{ marginRight: '0.5rem', background: currentMoveIdx === i ? COLORS.btnBlue : 'rgba(0,0,0,0.3)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>{i + 1}.{m.san}</span>))}</div>}
          {gameOver && <div style={{ marginTop: '1.5rem', background: '#1e293b', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: `2px solid ${winner === address ? '#10b981' : '#ef4444'}`, maxWidth: '400px', width: '100%' }}><h2 style={{ color: COLORS.accent, margin: '0 0 1rem' }}>{winner === address ? t('victoryTitle') : winner === 'bot' ? t('defeatTitle') : t('drawTitle')}</h2>{winner === address && gameId && <button onClick={() => handleClaim(false)} disabled={loadingTx} style={{ ...BtnStyle('#10b981', loadingTx), fontSize: '1.2rem', marginBottom: '1rem' }}>{loadingTx ? '⏳...' : t('claimBtn')}</button>}<button onClick={() => { resetGame(); setView('profile') }} style={BtnStyle(COLORS.btnBlue)}>{t('newG')}</button></div>}
        </div>
      )}

      {grok && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setGrok(false)}>
        <div style={{ background: COLORS.cardBg, padding: '1.5rem', borderRadius: '16px', maxWidth: '360px' }} onClick={e => e.stopPropagation()}>
          <h3 style={{ color: COLORS.accent }}>{t('gt')}</h3>
          <ol style={{ color: COLORS.textSec, margin: '1rem 0', paddingLeft: '1.2rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>{t('g1')}<br /><a href={PINK_LINK} target="_blank" rel="noopener" style={{ color: '#60a5fa', wordBreak: 'break-all' }}>{PINK_LINK}</a></li>
            <li style={{ marginBottom: '0.5rem' }}>{t('g2')}</li>
            <li>{t('g3')}<br /><code style={{ background: '#00332e', padding: '0.3rem', borderRadius: '4px', display: 'block', margin: '0.3rem 0', fontSize: '0.8rem' }}>{C4C_ADDR}</code><button onClick={copyAddr} style={{ ...BtnStyle(COLORS.btnBlue, loadingTx), marginTop: '0.5rem', padding: '8px' }}>{cop ? t('cd') : t('cp')}</button></li>
          </ol>
          <a href={PINK_LINK} target="_blank" style={{ display: 'block', background: '#f57c00', color: '#000', padding: '0.6rem', borderRadius: '8px', textAlign: 'center', textDecoration: 'none', marginTop: '0.5rem' }}>🌸 pink.meme</a>
          <button onClick={() => setGrok(false)} style={{ ...BtnStyle('#334155'), marginTop: '0.5rem' }}>{t('cl')}</button>
        </div>
      </div>}
      {msg && <div style={{ position: 'fixed', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', background: COLORS.btnBlue, color: '#fff', padding: '0.6rem 1rem', borderRadius: '8px', zIndex: 1000 }}>{msg}</div>}
    </div>
  )
}