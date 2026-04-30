import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useAccount, useDisconnect, useWriteContract, useReadContract, useWaitForTransactionReceipt, useConnect } from 'wagmi'
import { parseUnits, formatUnits, keccak256, stringToBytes } from 'viem'
import { supabase, createGameRecord, updateGameStatus, subscribeToGame, getProfile, updateProfile, listAvailableGames, recordMove } from './supabase'

// --- КОНСТАНТЫ ---
const C4C_ADDR = '0xAac20575371De01b4d10c4e7566D5453D72D56E7' 
const CHESS_CONTRACT = '0xCf5E5d01ADd5e2Ba62B2f6747E5CFC43e36D5005'
const PINK_LINK = 'https://www.pink.meme/token/bsc/0xaac20575371de01b4d10c4e7566d5453d72d56e7'

const COLORS = { bg: '#00695c', cardBg: '#004d40', btnBlue: '#1a237e', btnOrange: '#f57c00', text: '#ffffff', textSec: '#b2dfdb', accent: '#ffb74d' }

// --- ЯЗЫКИ (Сокращено для примера, но функционально полно) ---
const LANG = {
  ru: { t: '♟️ Chess4Crypto', s: 'PvP на C4C', g: '👤 Гостевой', c: '🦊 Войти', k: '💰 Купить C4C', p: '👤 Профиль', l: '🚪 Выйти', y: '👤 Вы', b: '🤖 Бот', yt: '♟️ Ваш ход!', bt: '🤖 Бот думает...', w: '🏆 ПОБЕДА!', x: '😔 Поражение', d: '🤝 Ничья', cn: '✅ Подключено', cl: 'Закрыть', cp: '📋 Копировать', cd: '✅ Скопировано!', ln: '🇷🇺 RU', th: '🎨 Тема', tm: { c: '🏛️ Классика', w: '🪵 Дерево', n: '💜 Неон', o: '🌊 Океан', s: '🌅 Закат', m: '⚪ Минимал' }, tc: 'Время:', st: 'Ставка (C4C):', cr: '➕ Создать матч', jn: '🤝 Присоединиться', mv: 'Ходы:', newG: '🔄 В лобби', botG: '🤖 С ботом', select: 'Время', bal: 'Баланс:', games: 'Игры:', noG: 'Нет игр', myG: 'Мои игры', join: 'Войти', copy: 'Ссылка скопирована!', invite: '🔗 Приглашение', dep: '💰 Внести', claim: '🏆 Забрать', approve: '✅ Разрешить', waiting: '⏳ Ожидание соперника...', playing: '♟️ Игра идёт', sync: '🔄 Синхронизация...', review: '🔍 Просмотр', live: '▶️ Live', prev: '⏪ Назад', next: '⏩ Вперёд', pot: 'Банк:', payout: 'Выплата:', refund: 'Возврат', drawRefund: '🤝 Ничья — возврат', winnerGets: '🏆 Победитель забирает всё', needDep: 'Нужно внести', toJoin: 'C4C для входа', yourStake: 'Ваша ставка:', oppStake: 'Ставка соперника:', totalPot: 'Общий банк:', setTime: 'Выберите время:', approveTx: '1️⃣ Разрешение...', depositTx: '2️⃣ Депозит...', confirmingTx: '⏳ Подтверждение...', successDep: '✅ Игра создана!', successJoin: '✅ Вход в игру!', errTx: '❌ Ошибка: ', errBal: '❌ Мало C4C', claimBtn: '💰 Забрать', victoryTitle: '🏆 Победа!', defeatTitle: '😔 Поражение', drawTitle: '🤝 Ничья', noMetaMask: '⚠️ Нужен MetaMask', playerProfile: '👤 Профиль', avatar: '🖼️ Аватар', name: '👤 Имя', bio: '📝 О себе', website: '🌐 Сайт', social: '🔗 Соцсеть', save: '💾 Сохранить', availableGames: '🎮 Доступные игры', guestInfo: '⏱️ Гостевой режим: бесплатно.', guestInstructions: '📖 Гостевой режим:\n• Выберите время.\n• Нажмите "🤖 С ботом".', grokInstructions: `📖 Создание игры:\n1️⃣ Нажмите "➕ Создать матч".\n2️⃣ Выберите ставку.\n3️⃣ Подтвердите 2 транзакции в кошельке:\n   • Approve\n   • Deposit\n4️⃣ Ждите подтверждения.\n5️⃣ Отправьте ссылку сопернику.`, txCancelled: '⚠️ Отмена', step1: 'Шаг 1/2', step2: 'Шаг 2/2', clickToCopy: '📋 Копировать', checkBalance: '🔍 Баланс контракта', profileSaved: '✅ Профиль сохранён!', profileError: '❌ Ошибка профиля', pvpMode: '👥 PvP', botMode: '🤖 Бот' },
  en: { t: '♟️ Chess4Crypto', s: 'C4C PvP', g: '👤 Guest', c: '🦊 Connect', k: '💰 Buy C4C', p: '👤 Profile', l: '🚪 Logout', y: '👤 You', b: '🤖 Bot', yt: '♟️ Your turn!', bt: '🤖 Bot thinking...', w: '🏆 WIN!', x: '😔 Lost', d: '🤝 Draw', cn: '✅ Connected', cl: 'Close', cp: '📋 Copy', cd: '✅ Copied!', ln: '🇬🇧 EN', th: '🎨 Theme', tm: { c: '🏛️ Classic', w: '🪵 Wood', n: '💜 Neon', o: '🌊 Ocean', s: '🌅 Sunset', m: '⚪ Minimal' }, tc: 'Time:', st: 'Stake (C4C):', cr: '➕ Create Match', jn: '🤝 Join', mv: 'Moves:', newG: '🔄 Lobby', botG: '🤖 Vs Bot', select: 'Time', bal: 'Balance:', games: 'Games:', noG: 'No games', myG: 'My Games', join: 'Join', copy: 'Copied!', invite: '🔗 Invite', dep: '💰 Deposit', claim: '🏆 Claim', approve: '✅ Approve', waiting: '⏳ Waiting...', playing: '♟️ Playing', sync: '🔄 Syncing...', review: '🔍 Review', live: '▶️ Live', prev: '⏪ Prev', next: '⏩ Next', pot: 'Pot:', payout: 'Payout:', refund: 'Refund', drawRefund: '🤝 Draw - Refund', winnerGets: '🏆 Winner takes all', needDep: 'Need to deposit', toJoin: 'C4C to join', yourStake: 'Your stake:', oppStake: 'Opponent stake:', totalPot: 'Total Pot:', setTime: 'Select Time:', approveTx: '1️⃣ Approve...', depositTx: '2️⃣ Deposit...', confirmingTx: '⏳ Confirming...', successDep: '✅ Game Created!', successJoin: '✅ Joined!', errTx: '❌ Error: ', errBal: '❌ Low C4C', claimBtn: '💰 Claim', victoryTitle: '🏆 Victory!', defeatTitle: '😔 Defeat', drawTitle: '🤝 Draw', noMetaMask: '⚠️ Need MetaMask', playerProfile: '👤 Profile', avatar: '🖼️ Avatar', name: '👤 Name', bio: '📝 Bio', website: '🌐 Website', social: '🔗 Social', save: '💾 Save', availableGames: '🎮 Available Games', guestInfo: '⏱️ Guest mode: free.', guestInstructions: '📖 Guest Mode:\n• Select time.\n• Click "🤖 Vs Bot".', grokInstructions: `📖 Create Game:\n1️⃣ Click "➕ Create Match".\n2️⃣ Select stake.\n3️⃣ Confirm 2 wallet txs:\n   • Approve\n   • Deposit\n4️⃣ Wait for confirmation.\n5️⃣ Send link to opponent.`, txCancelled: '⚠️ Cancelled', step1: 'Step 1/2', step2: 'Step 2/2', clickToCopy: '📋 Copy', checkBalance: '🔍 Contract Balance', profileSaved: '✅ Profile Saved!', profileError: '❌ Profile Error', pvpMode: '👥 PvP', botMode: '🤖 Bot' }
}

const THEMES = {
  c: { l: '#eeeed2', d: '#769656', n: '🏛️ Classic' },
  w: { l: '#f0d9b5', d: '#b58863', n: '🪵 Wood' },
  n: { l: '#1a1a2e', d: '#16213e', n: '💜 Neon' },
  o: { l: '#e0f7fa', d: '#006064', n: '🌊 Ocean' },
  s: { l: '#fff3e0', d: '#e65100', n: '🌅 Sunset' },
  m: { l: '#e0e0e0', d: '#757575', n: '⚪ Minimal' }
}

const TIME_OPTIONS = [5, 15, 30, 60]
const STAKE_OPTIONS = [10, 50, 100, 500] // Уменьшил для теста, можно вернуть большие числа

const fmtTime = s => { const m = Math.floor(s / 60), sec = s % 60; return `${m}:${String(sec).padStart(2, '0')}` }

// --- ABI ---
const CHESS_ABI = [
  {"inputs":[{"internalType":"address","name":"_gameToken","type":"address"},{"internalType":"address","name":"_feeRecipient","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
  {"inputs":[{"internalType":"bytes32","name":"gameId","type":"bytes32"}],"name":"createGame","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"bytes32","name":"gameId","type":"bytes32"}],"name":"depositStake","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"bytes32","name":"gameId","type":"bytes32"},{"internalType":"address","name":"winner","type":"address"},{"internalType":"bool","name":"isDraw","type":"bool"}],"name":"finishGame","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"games","outputs":[{"internalType":"address","name":"creator","type":"address"},{"internalType":"address","name":"challenger","type":"address"},{"internalType":"uint256","name":"stake","type":"uint256"},{"internalType":"bool","name":"creatorPaid","type":"bool"},{"internalType":"bool","name":"challengerPaid","type":"bool"},{"internalType":"address","name":"winner","type":"address"},{"internalType":"bool","name":"done","type":"bool"},{"internalType":"bool","name":"is_draw","type":"bool"},{"internalType":"uint256","name":"createdAt","type":"uint256"}],"stateMutability":"view","type":"function"}
]

const ERC20_ABI = [
  {"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
]

// --- КОМПОНЕНТ APP ---
export default function App() {
  // State
  const [lang, setLang] = useState('ru')
  const [view, setView] = useState('menu')
  const [profileTab, setProfileTab] = useState('lobby')
  const [msg, setMsg] = useState('')
  const [grok, setGrok] = useState(false)
  const [cop, setCop] = useState(false)
  const [theme, setTheme] = useState('c')
  const [bs, setBs] = useState(360)
  const [createStake, setCreateStake] = useState(10)
  const [timeCtrl, setTimeCtrl] = useState(5)
  const [pendingJoin, setPendingJoin] = useState(null)
  const [inviteLink, setInviteLink] = useState('')
  const [selectedSq, setSelectedSq] = useState(null)
  const [possibleMoves, setPossibleMoves] = useState([])
  const [moveHistory, setMoveHistory] = useState([])
  const [gameId, setGameId] = useState('')
  const [isDeposited, setIsDeposited] = useState(false)
  const [gameState, setGameState] = useState('idle')
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
  const [profile, setProfile] = useState({ avatar: '', name: '', bio: '' })
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [isPvP, setIsPvP] = useState(false)
  
  // Chess State
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  const [hist, setHist] = useState(['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'])
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [pTime, setPTime] = useState(5 * 60)
  const [bTime, setBTime] = useState(5 * 60)
  const [timerActive, setTimerActive] = useState(null)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)

  // Refs
  const gameRef = useRef(new Chess())
  const timerRef = useRef(null)
  const unsubscribeRef = useRef(null)
  const botTimerRef = useRef(null)
  const connectingRef = useRef(false)

  // Wagmi Hooks
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { connectors, connect, isPending: isConnecting } = useConnect()
  const { writeContractAsync } = useWriteContract()
  
  // Balance Hook
  const { data: balanceData, refetch: refetchBalance, isLoading: balanceLoading } = useReadContract({
    address: C4C_ADDR,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: !!address && isConnected }
  })

  // Update Balance State
  useEffect(() => {
    if (balanceData != null) {
      setUserBalance(Number(formatUnits(balanceData, 18)))
    }
  }, [balanceData])

  // Translate Helper
  const t = useCallback((k) => LANG[lang]?.[k] || LANG['en']?.[k] || k, [lang])

  // --- ACTIONS ---
  const connectWallet = async () => {
    if (connectingRef.current || isConnecting) return
    try {
      connectingRef.current = true
      setMsg('🔄 Connecting...')
      const connector = connectors.find(c => c.id === 'metaMask') || connectors[0]
      if (connector) {
        await connect({ connector })
        setView('profile')
        setMsg(t('cn'))
      } else {
        setMsg(t('noMetaMask'))
      }
    } catch (e) {
      setMsg(t('noMetaMask'))
    } finally {
      setTimeout(() => { connectingRef.current = false }, 1000)
    }
  }

  const handleCreateMatch = async () => {
    if (!isConnected || !address) { setMsg('🦊 ' + t('c')); return }
    if (userBalance < createStake) { setMsg(t('errBal')); return }

    setLoadingTx(true)
    try {
      // 1. Approve
      setMsg(t('step1'))
      await writeContractAsync({
        address: C4C_ADDR,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CHESS_CONTRACT, parseUnits(createStake.toString(), 18)]
      })

      // 2. Create Game ID
      const rawId = 'game_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
      const bytes32Id = keccak256(stringToBytes(rawId))

      // 3. Create Game on Contract
      setMsg(t('step2') + ' (Create)')
      await writeContractAsync({
        address: CHESS_CONTRACT,
        abi: CHESS_ABI,
        functionName: 'createGame',
        args: [bytes32Id, parseUnits(createStake.toString(), 18), BigInt(timeCtrl)]
      })

      // 4. Deposit Stake
      setMsg(t('step2') + ' (Deposit)')
      const tx = await writeContractAsync({
        address: CHESS_CONTRACT,
        abi: CHESS_ABI,
        functionName: 'depositStake',
        args: [bytes32Id]
      })
      setTxHash(tx)

      // 5. Update UI
      setGameId(rawId)
      setIsDeposited(true)
      setMsg(t('successDep'))
      await createGameRecord(rawId, address, createStake, timeCtrl)
      
      const link = `${window.location.origin}${window.location.pathname}?game=${rawId}`
      setInviteLink(link)
      setProfileTab('my')
      
      // Refresh balance after spend
      setTimeout(() => refetchBalance(), 2000)

    } catch (e) {
      console.error(e)
      setMsg(t('errTx') + (e.shortMessage || e.message))
    } finally {
      setLoadingTx(false)
    }
  }

  const resetGame = () => {
    gameRef.current.reset()
    setFen(gameRef.current.fen())
    setHist([gameRef.current.fen()])
    setIsPlayerTurn(true)
    setGameOver(false)
    setWinner(null)
    setMoveHistory([])
    setSelectedSq(null)
    setPossibleMoves([])
    setGameState('idle')
    setTxHash(null)
  }

  const startGame = () => {
    setPTime(timeCtrl * 60)
    setBTime(timeCtrl * 60)
    setTimerActive('player')
    setView('game')
    setGameState('playing')
  }

  // --- CHESS LOGIC (Simplified for brevity) ---
  const onDrop = (src, tgt) => {
    if (gameOver || !isPlayerTurn) return false
    try {
      const move = gameRef.current.move({ from: src, to: tgt, promotion: 'q' })
      if (!move) return false
      
      setFen(gameRef.current.fen())
      setHist([...hist, gameRef.current.fen()])
      setMoveHistory([...moveHistory, move.san])
      setIsPlayerTurn(false)
      
      // Bot Move Simulation
      setTimeout(() => {
        // Simple random bot for demo
        const moves = gameRef.current.moves()
        if (moves.length > 0) {
           // In real app, implement proper bot logic
        }
        setIsPlayerTurn(true)
      }, 1000)
      
      return true
    } catch { return false }
  }

  // --- RENDER HELPERS ---
  const BtnStyle = (c, d) => ({
    width: '100%', padding: '12px', background: c || COLORS.btnBlue, color: '#fff',
    border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: '600',
    cursor: d ? 'not-allowed' : 'pointer', marginTop: '8px', opacity: d ? 0.5 : 1
  })

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, color: COLORS.text, fontFamily: 'system-ui', padding: '1rem', display: 'flex', justifyContent: 'center' }}>
      
      {/* MENU VIEW */}
      {view === 'menu' && (
        <div style={{ maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ color: COLORS.accent }}>{t('t')}</h1>
          <button onClick={() => { resetGame(); startGame() }} style={BtnStyle(COLORS.btnBlue)}>{t('g')}</button>
          {isConnected ? (
             <button onClick={() => { disconnect(); setView('menu') }} style={BtnStyle('#b71c1c')}>{t('l')}</button>
          ) : (
             <button onClick={connectWallet} disabled={isConnecting} style={BtnStyle(COLORS.btnOrange, isConnecting)}>
               {isConnecting ? '⏳...' : t('c')}
             </button>
          )}
          <button onClick={() => setGrok(true)} style={BtnStyle(COLORS.btnOrange)}>{t('k')}</button>
          <button onClick={() => setLang(l => l === 'ru' ? 'en' : 'ru')} style={BtnStyle(COLORS.btnBlue)}>{t('ln')}</button>
          {msg && <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', textAlign: 'center' }}>{msg}</div>}
        </div>
      )}

      {/* PROFILE VIEW */}
      {view === 'profile' && (
        <div style={{ maxWidth: '600px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: COLORS.cardBg, padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>{address?.slice(0, 6)}...{address?.slice(-4)}</div>
              {/* ✅ BALANCE DISPLAYED HERE */}
              <div style={{ color: COLORS.textSec }}>
                {t('bal')} <span style={{ color: COLORS.accent, fontWeight: 'bold' }}>
                  {balanceLoading ? '⏳...' : userBalance.toLocaleString()} C4C
                </span>
              </div>
            </div>
            <button onClick={() => { disconnect(); setView('menu') }} style={{ ...BtnStyle('#b71c1c'), width: 'auto' }}>{t('l')}</button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['lobby', 'my', 'create'].map(tab => (
              <button key={tab} onClick={() => setProfileTab(tab)} style={{ ...BtnStyle(profileTab === tab ? COLORS.btnBlue : '#334155'), flex: 1 }}>
                {tab === 'lobby' ? t('availableGames') : tab === 'my' ? t('myG') : t('cr')}
              </button>
            ))}
          </div>

          {profileTab === 'create' && (
            <div style={{ background: COLORS.cardBg, padding: '1rem', borderRadius: '12px' }}>
              <p>{t('grokInstructions')}</p>
              <div style={{ marginBottom: '1rem' }}>
                <label>{t('st')}</label>
                <select value={createStake} onChange={e => setCreateStake(Number(e.target.value))} style={{ width: '100%', padding: '10px', marginTop: '5px' }}>
                  {STAKE_OPTIONS.map(s => <option key={s} value={s}>{s} C4C</option>)}
                </select>
              </div>
              <button onClick={handleCreateMatch} disabled={loadingTx} style={BtnStyle('#10b981', loadingTx)}>
                {loadingTx ? '⏳...' : t('cr')}
              </button>
            </div>
          )}
          
          {profileTab === 'my' && (
             <div style={{ background: COLORS.cardBg, padding: '1rem', borderRadius: '12px' }}>
               <p>Game ID: {gameId || '-'}</p>
               {inviteLink && (
                 <div style={{ marginTop: '1rem', wordBreak: 'break-all' }}>
                   <b>{t('invite')}:</b> {inviteLink}
                   <button onClick={() => navigator.clipboard.writeText(inviteLink)} style={{ marginLeft: '10px' }}>{t('cp')}</button>
                 </div>
               )}
             </div>
          )}
        </div>
      )}

      {/* GAME VIEW */}
      {view === 'game' && (
        <div style={{ maxWidth: '500px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
            <div>👤 You: {fmtTime(pTime)}</div>
            <div>🤖 Bot: {fmtTime(bTime)}</div>
          </div>
          <Chessboard position={fen} onPieceDrop={onDrop} boardWidth={bs} />
          <button onClick={() => setView('profile')} style={{ ...BtnStyle(COLORS.btnBlue), marginTop: '1rem' }}>{t('newG')}</button>
        </div>
      )}

      {/* BUY MODAL */}
      {grok && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setGrok(false)}>
          <div style={{ background: COLORS.cardBg, padding: '2rem', borderRadius: '16px' }} onClick={e => e.stopPropagation()}>
            <h3>{t('gt')}</h3>
            <a href={PINK_LINK} target="_blank" rel="noopener noreferrer" style={{ display: 'block', margin: '1rem 0', color: '#60a5fa' }}>{PINK_LINK}</a>
            <button onClick={() => setGrok(false)} style={BtnStyle('#334155')}>{t('cl')}</button>
          </div>
        </div>
      )}
    </div>
  )
}