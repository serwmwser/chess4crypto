import { useState, useEffect, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useAccount, useConnect, useDisconnect, useBalance, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useTranslation } from 'react-i18next'

// 🎯 Адрес контракта GROK в сети BNB (замените на реальный при деплое)
const GROK_TOKEN_ADDRESS = '0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444'
const GROK_DECIMALS = 18

function App() {
  const { t, i18n } = useTranslation()
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const {  balance: walletBalance } = useBalance({ address, token: GROK_TOKEN_ADDRESS })
  
  // Для транзакций (опционально - симуляция для фронтенда)
  const { writeContractAsync } = useWriteContract()
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({})

  // 🎮 Состояние игры
  const gameRef = useRef(new Chess())
  const [view, setView] = useState('menu')
  const [fen, setFen] = useState(gameRef.current.fen())
  const [history, setHistory] = useState([gameRef.current.fen()])
  const [moveIndex, setMoveIndex] = useState(0)
  const [movesList, setMovesList] = useState([]) // [{ san: 'e4', from: 'e2', to: 'e4' }]
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null) // 'player' | 'bot' | 'draw'
  const [message, setMessage] = useState('')

  // ⏱️ Таймер
  const [timeControl, setTimeControl] = useState(5)
  const [playerTime, setPlayerTime] = useState(timeControl * 60)
  const [botTime, setBotTime] = useState(timeControl * 60)
  const [timerActive, setTimerActive] = useState(null)

  // 💰 Баланс и ставки
  const [gameBalance, setGameBalance] = useState(0)
  const [pendingDeposit, setPendingDeposit] = useState(null)
  const [lastTransaction, setLastTransaction] = useState(null)

  // 🤖 Логика бота
  const makeBotMove = useCallback(() => {
    if (gameOver || gameRef.current.isGameOver()) return
    const moves = gameRef.current.moves()
    if (!moves.length) return
    const random = moves[Math.floor(Math.random() * moves.length)]
    gameRef.current.move(random)
    
    const newFen = gameRef.current.fen()
    const san = gameRef.current.history({ verbose: true }).pop()?.san || random
    setHistory(prev => [...prev, newFen])
    setMovesList(prev => [...prev, { san, from: random.from, to: random.to, piece: random.piece }])
    setFen(newFen)
    setMoveIndex(prev => prev + 1)
    setIsPlayerTurn(true)
    setTimerActive('player')
    
    // Проверка на конец игры
    if (gameRef.current.isCheckmate()) {
      endGame('player') // Игрок поставил мат боту
    } else if (gameRef.current.isDraw()) {
      endGame('draw')
    } else {
      setMessage('♟️ Ваш ход!')
    }
  }, [gameOver])

  // 🎯 Ход игрока
  const onDrop = (source, target) => {
    if (!isPlayerTurn || gameOver || moveIndex !== history.length - 1) return false
    try {
      const move = gameRef.current.move({ from: source, to: target, promotion: 'q' })
      if (!move) return false

      const newFen = gameRef.current.fen()
      const san = gameRef.current.history({ verbose: true }).pop()?.san || `${source}${target}`
      setHistory(prev => [...prev, newFen])
      setMovesList(prev => [...prev, { san, from: source, to: target, piece: move.piece }])
      setFen(newFen)
      setMoveIndex(prev => prev + 1)
      setIsPlayerTurn(false)
      setTimerActive('bot')
      setMessage('🤖 Бот думает...')
      
      // Проверка на мат сразу после хода игрока
      if (gameRef.current.isCheckmate()) {
        endGame('player') // Игрок выиграл
      } else if (gameRef.current.isDraw()) {
        endGame('draw')
      } else {
        setTimeout(makeBotMove, 1000)
      }
      return true
    } catch { return false }
  }

  // 🏁 Завершение игры + распределение токенов
  const endGame = (result) => {
    setGameOver(true)
    setTimerActive(null)
    
    if (result === 'player') {
      setWinner('player')
      setMessage('🏁 КОНЕЦ ИГРЫ! Вы победили!')
      // 🎁 Награда победителю
      if (gameBalance > 0 && isConnected) {
        distributePrize(gameBalance, 'player')
      }
    } else if (result === 'bot') {
      setWinner('bot')
      setMessage('🏁 КОНЕЦ ИГРЫ! Бот победил.')
      // Токены остаются в пуле или сгорают (на усмотрение)
    } else {
      setWinner('draw')
      setMessage('🤝 НИЧЬЯ! Токены возвращены.')
      if (gameBalance > 0 && isConnected) {
        distributePrize(gameBalance / 2, 'player') // Возврат половины при ничьей
      }
    }
  }

  // 💸 Распределение приза (симуляция для фронтенда)
  const distributePrize = async (amount, recipient) => {
    if (!isConnected || !address) return
    
    setMessage(`🎁 Начисление ${amount} GROK...`)
    
    try {
      // 🔹 ВАРИАНТ А: Реальная транзакция (раскомментируйте при наличии контракта)
      /*
      await writeContractAsync({
        address: GROK_TOKEN_ADDRESS,
        abi: ['function transfer(address to, uint256 amount) returns (bool)'],
        functionName: 'transfer',
        args: [address, BigInt(amount) * BigInt(10 ** GROK_DECIMALS)],
        chain: { id: 56 } // BNB Chain
      })
      */
      
      // 🔹 ВАРИАНТ Б: Симуляция для демонстрации (фронтенд)
      await new Promise(resolve => setTimeout(resolve, 1500))
      setGameBalance(prev => prev + amount)
      setLastTransaction({ type: 'prize', amount, timestamp: new Date() })
      
      setMessage(`✅ ${amount} GROK зачислено на ваш баланс!`)
    } catch (err) {
      console.error('Prize distribution error:', err)
      setMessage('⚠️ Ошибка начисления приза')
    }
  }

  // 💰 Депозит в игру из кошелька
  const handleDeposit = async (amount) => {
    if (!isConnected || !address) {
      setMessage('⚠️ Сначала подключите кошелёк')
      return
    }
    
    setPendingDeposit(amount)
    setMessage(`🔄 Депозит ${amount} GROK...`)
    
    try {
      // 🔹 ВАРИАНТ А: Реальная транзакция
      /*
      await writeContractAsync({
        address: GROK_TOKEN_ADDRESS,
        abi: ['function transferFrom(address from, address to, uint256 amount) returns (bool)'],
        functionName: 'transferFrom',
        args: [address, '0xGameContractAddress', BigInt(amount) * BigInt(10 ** GROK_DECIMALS)],
        chain: { id: 56 }
      })
      */
      
      // 🔹 ВАРИАНТ Б: Симуляция (фронтенд)
      await new Promise(resolve => setTimeout(resolve, 1200))
      setGameBalance(prev => prev + amount)
      setLastTransaction({ type: 'deposit', amount, timestamp: new Date() })
      
      setMessage(`✅ ${amount} GROK внесено в игру!`)
      setPendingDeposit(null)
    } catch (err) {
      console.error('Deposit error:', err)
      setMessage('⚠️ Ошибка депозита')
      setPendingDeposit(null)
    }
  }

  // ⏪⏩ Навигация по истории
  const handleBack = () => {
    if (moveIndex > 0) {
      const newIndex = moveIndex - 1
      setMoveIndex(newIndex)
      setFen(history[newIndex])
      gameRef.current.load(history[newIndex])
      setIsPlayerTurn(newIndex % 2 === 0)
      setTimerActive(null)
      setMessage('⏪ Просмотр истории')
    }
  }
  const handleForward = () => {
    if (moveIndex < history.length - 1) {
      const newIndex = moveIndex + 1
      setMoveIndex(newIndex)
      setFen(history[newIndex])
      gameRef.current.load(history[newIndex])
      setIsPlayerTurn(newIndex % 2 === 0)
      if (newIndex === history.length - 1 && !gameOver) {
        setTimerActive(isPlayerTurn ? 'player' : 'bot')
        setMessage(isPlayerTurn ? '♟️ Ваш ход!' : '🤖 Бот думает...')
      } else {
        setMessage('⏩ Просмотр истории')
      }
    }
  }

  // 🚀 Начало игры
  const startGame = (mode = 'guest') => {
    gameRef.current.reset()
    const startFen = gameRef.current.fen()
    setFen(startFen)
    setHistory([startFen])
    setMoveIndex(0)
    setMovesList([])
    setIsPlayerTurn(true)
    setGameOver(false)
    setWinner(null)
    setPlayerTime(timeControl * 60)
    setBotTime(timeControl * 60)
    setTimerActive('player')
    if (mode === 'wallet' && gameBalance === 0) setGameBalance(0)
    setMessage('♟️ Ваш ход!')
    setView('game')
  }

  const handleConnect = async () => {
    try {
      const conn = connectors.find(c => c.id === 'injected') || connectors[0]
      if (conn) await connect({ connector })
      startGame('wallet')
    } catch (err) { setMessage('⚠️ Ошибка: ' + err.message) }
  }

  const handleLogout = () => {
    if (isConnected) disconnect()
    setView('menu')
    gameRef.current.reset()
  }

  const goToProfile = () => setView('profile')
  const handleBuyGrok = () => {
    window.open('https://four.meme/token/0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444?code=AHGX96R5GHK9', '_blank')
  }

  // ⏱️ Таймер
  useEffect(() => {
    if (!timerActive || gameOver) return
    const interval = setInterval(() => {
      if (timerActive === 'player') {
        setPlayerTime(prev => {
          if (prev <= 1) { endGame('bot'); return 0 }
          return prev - 1
        })
      } else {
        setBotTime(prev => {
          if (prev <= 1) { endGame('player'); return 0 }
          return prev - 1
        })
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [timerActive, gameOver])

  const fmtTime = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`
  }

  const formatNumber = (n) => n.toLocaleString('ru-RU')

  const timeOptions = [
    { value: 5, label: '5 минут' }, { value: 15, label: '15 минут' },
    { value: 30, label: '30 минут' }, { value: 60, label: '1 час' },
    { value: 1440, label: '24 часа' }
  ]
  const depositOptions = [1000, 5000, 10000, 50000, 100000, 500000]

  // ============================================================================
  // 🎨 МЕНЮ ВХОДА
  // ============================================================================
  if (view === 'menu') {
    return (
      <div style={styles.screen}>
        <h1 style={styles.title}>♟️ {t('app.title')}</h1>
        <p style={styles.sub}>{t('app.subtitle')}</p>
        
        <button onClick={handleBuyGrok} style={styles.btnGrok}>💰 Купить GROK</button>
        <p style={styles.grokHint}>Подключи кошелёк в сети BNB (с BNB для газа) → купи GROK на four.meme</p>

        <div style={styles.controlGroup}>
          <label style={styles.label}>⏱️ Контроль времени:</label>
          <select value={timeControl} onChange={e => setTimeControl(Number(e.target.value))} style={styles.select}>
            {timeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>

        {isConnected && (
          <>
            <div style={styles.balanceRow}>
              <span>💼 Баланс GROK:</span>
              <strong style={{color:'#fbbf24'}}>{walletBalance ? parseFloat(walletBalance.formatted).toFixed(2) : '0.00'}</span>
            </div>
            <div style={styles.depositGroup}>
              <label style={styles.label}>💰 Внести в игру:</label>
              <div style={styles.depositButtons}>
                {depositOptions.map(amt => (
                  <button 
                    key={amt} 
                    onClick={() => handleDeposit(amt)}
                    disabled={pendingDeposit === amt}
                    style={{
                      ...styles.btnDeposit,
                      background: pendingDeposit === amt ? '#64748b' : '#7c3aed',
                      opacity: pendingDeposit === amt ? 0.7 : 1
                    }}
                  >
                    {pendingDeposit === amt ? '⏳' : ''} {formatNumber(amt)}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div style={styles.btnGroup}>
          <button onClick={() => startGame('guest')} style={styles.btnPrimary}>👤 {t('app.guestLogin')}</button>
          <button onClick={handleConnect} style={styles.btnWallet}>🦊 {t('app.connectWallet')}</button>
        </div>

        {gameBalance > 0 && (
          <div style={styles.gameBalanceBadge}>🎮 Баланс игры: <strong>{formatNumber(gameBalance)} GROK</strong></div>
        )}

        <select value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)} style={styles.langSelect}>
          <option value="ru">🇷🇺 Русский</option>
          <option value="en">🇬🇧 English</option>
        </select>
      </div>
    )
  }

  // ============================================================================
  // 👤 ПРОФИЛЬ ИГРОКА
  // ============================================================================
  if (view === 'profile') {
    return (
      <div style={styles.screen}>
        <header style={styles.header}>
          <span style={styles.headerTitle}>👤 Профиль</span>
          <button onClick={() => setView('menu')} style={styles.btnSmall}>← Назад</button>
        </header>

        <div style={styles.balanceCard}>
          <div style={styles.balanceLabel}>🎮 Баланс игры</div>
          <div style={styles.balanceValue}>{formatNumber(gameBalance)} <span style={{fontSize:'1rem'}}>GROK</span></div>
          <p style={styles.balanceHint}>
            {gameBalance > 0 ? 'Сумма для участия в ставках' : 'Внесите депозит, чтобы играть на токены'}
          </p>
          {isConnected && gameBalance === 0 && (
            <div style={styles.depositQuick}>
              {depositOptions.slice(0,3).map(amt => (
                <button key={amt} onClick={() => { handleDeposit(amt); setView('game'); }} style={styles.btnDepositSmall}>
                  +{formatNumber(amt)}
                </button>
              ))}
            </div>
          )}
        </div>

        {lastTransaction && (
          <div style={styles.txCard}>
            <div style={styles.txRow}>
              <span>{lastTransaction.type === 'prize' ? '🎁 Приз' : '💰 Депозит'}</span>
              <strong style={{color: lastTransaction.type === 'prize' ? '#34d399' : '#60a5fa'}}>
                +{formatNumber(lastTransaction.amount)} GROK
              </strong>
            </div>
            <div style={styles.txTime}>{lastTransaction.timestamp.toLocaleTimeString()}</div>
          </div>
        )}

        <div style={styles.statsCard}>
          <h3 style={styles.statsTitle}>📊 Статистика</h3>
          <div style={styles.statRow}><span>Игр:</span><strong>0</strong></div>
          <div style={styles.statRow}><span>Побед:</span><strong>0</strong></div>
          <div style={styles.statRow}><span>Заработано:</span><strong>0 GROK</strong></div>
        </div>

        <button onClick={handleBuyGrok} style={styles.btnGrok}>🛒 Купить GROK на four.meme</button>
        <p style={styles.grokHint}>1. Перейди → 2. Подключи кошелёк в BNB → 3. Купи GROK</p>

        <select value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)} style={styles.langSelect}>
          <option value="ru">🇷🇺 RU</option>
          <option value="en">🇬🇧 EN</option>
        </select>
      </div>
    )
  }

  // ============================================================================
  // 🎮 ИГРОВОЙ ЭКРАН
  // ============================================================================
  return (
    <div style={styles.screen}>
      <header style={styles.header}>
        <span style={styles.headerTitle}>♟️ Chess4Crypto</span>
        <div style={styles.headerRight}>
          {isConnected && address && <span style={styles.walletBadge}>🔗 {address.slice(0,6)}...{address.slice(-4)}</span>}
          <button onClick={goToProfile} style={styles.btnSmall}>👤 Профиль</button>
          <button onClick={handleLogout} style={{...styles.btnSmall, background:'#ef4444'}}>🚪</button>
        </div>
      </header>

      {/* 🏁 БАННЕР КОНЦА ИГРЫ */}
      {gameOver && winner && (
        <div style={styles.gameOverBanner}>
          <div style={styles.gameOverIcon}>{winner === 'player' ? '🏆' : winner === 'bot' ? '🤖' : '🤝'}</div>
          <div style={styles.gameOverText}>
            {winner === 'player' && '🎉 ВЫ ПОБЕДИЛИ!'}
            {winner === 'bot' && '😔 БОТ ПОБЕДИЛ'}
            {winner === 'draw' && '🤝 НИЧЬЯ'}
          </div>
          {winner === 'player' && gameBalance > 0 && (
            <div style={styles.prizeText}>+{formatNumber(gameBalance)} GROK зачислено!</div>
          )}
          <button onClick={() => { setView('menu'); setGameBalance(0); }} style={styles.btnNewGame}>
            🔄 Новая игра
          </button>
        </div>
      )}

      {/* Таймеры */}
      <div style={styles.timers}>
        <div style={{...styles.timerBox, active: timerActive === 'player' && !gameOver}}>
          <span>👤 Вы</span>
          <span style={styles.timerText}>{fmtTime(playerTime)}</span>
        </div>
        <div style={{...styles.timerBox, active: timerActive === 'bot' && !gameOver}}>
          <span>🤖 Бот</span>
          <span style={styles.timerText}>{fmtTime(botTime)}</span>
        </div>
      </div>

      {/* 💰 Баланс в игре */}
      {gameBalance > 0 && !gameOver && (
        <div style={styles.gameBalance}>
          💰 Ставка: <strong>{formatNumber(gameBalance)} GROK</strong>
          {isConnected && <span style={styles.withdrawHint} onClick={() => setGameBalance(0)}>🔙 Вывести</span>}
        </div>
      )}

      {!gameOver && message && <div style={styles.statusMsg}>{message}</div>}

      <div style={styles.boardWrap}>
        <Chessboard position={fen} onPieceDrop={onDrop} boardOrientation="white" />
      </div>

      {/* 📜 Полная история ходов */}
      <div style={styles.historyPanel}>
        <div style={styles.historyHeader}>
          <span>📜 Ходы:</span>
          <span style={styles.historyCount}>{movesList.length} ходов</span>
        </div>
        <div style={styles.historyList}>
          {movesList.map((m, i) => (
            <span 
              key={i} 
              style={{
                ...styles.moveChip, 
                highlight: i === moveIndex - 1,
                playerTurn: i % 2 === 0
              }}
            >
              {Math.floor(i/2)+1}.{i%2===0?'':'..'} {m.san}
            </span>
          ))}
          {movesList.length === 0 && <span style={styles.emptyHist}>Ходов пока нет...</span>}
        </div>
      </div>

      {/* Кнопки управления */}
      <div style={styles.controls}>
        <button onClick={handleBack} disabled={moveIndex === 0 || gameOver} style={styles.btnCtrl}>⏪</button>
        <button onClick={handleForward} disabled={moveIndex === history.length-1 || gameOver} style={styles.btnCtrl}>⏩</button>
        <button onClick={goToProfile} style={styles.btnProfile}>👤</button>
        {isConnected && !gameOver && (
          <button onClick={() => handleDeposit(1000)} style={styles.btnAdd}>+1K</button>
        )}
      </div>

      <p style={styles.modeInfo}>
        {isConnected ? '🦊 Режим кошелька' : '👤 Гостевой режим'} • {timeOptions.find(o=>o.value===timeControl)?.label}
      </p>
    </div>
  )
}

// 🎨 СТИЛИ
const styles = {
  screen: { minHeight: '100vh', background: '#0b1120', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.8rem' },
  title: { fontSize: '1.8rem', margin: '0.3rem 0', textAlign: 'center' },
  sub: { color: '#94a3b8', marginBottom: '0.8rem', textAlign: 'center', maxWidth: '360px', fontSize: '0.95rem' },
  
  btnGrok: { padding: '0.7rem 1.2rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '1rem', marginBottom: '0.4rem', width: '100%', maxWidth: '320px' },
  grokHint: { color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center', marginBottom: '0.8rem', maxWidth: '320px', lineHeight: '1.3' },
  
  controlGroup: { background: '#1e293b', padding: '0.7rem', borderRadius: '10px', marginBottom: '0.6rem', width: '100%', maxWidth: '320px' },
  label: { display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', color: '#cbd5e1' },
  select: { width: '100%', padding: '0.45rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.95rem' },
  
  balanceRow: { display: 'flex', justifyContent: 'space-between', background: '#1e293b', padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '0.6rem', fontSize: '0.9rem', maxWidth: '320px', width: '100%' },
  depositGroup: { background: '#1e293b', padding: '0.7rem', borderRadius: '10px', marginBottom: '0.6rem', width: '100%', maxWidth: '320px' },
  depositButtons: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' },
  btnDeposit: { padding: '0.4rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' },
  
  btnGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: '320px', marginBottom: '0.6rem' },
  btnPrimary: { padding: '0.8rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' },
  btnWallet: { padding: '0.8rem', background: '#f59e0b', color: '#000', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' },
  langSelect: { marginTop: '0.8rem', padding: '0.35rem', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },
  gameBalanceBadge: { background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' },
  
  header: { width: '100%', maxWidth: '480px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '0.5rem 0.8rem', borderRadius: '10px', marginBottom: '0.6rem' },
  headerTitle: { fontWeight: 'bold', fontSize: '1.1rem' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '0.3rem' },
  walletBadge: { fontSize: '0.7rem', background: '#334155', padding: '0.15rem 0.4rem', borderRadius: '12px' },
  btnSmall: { padding: '0.25rem 0.5rem', background: '#475569', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' },
  
  timers: { display: 'flex', gap: '0.8rem', marginBottom: '0.4rem', width: '100%', maxWidth: '360px', justifyContent: 'space-around' },
  timerBox: ({ active }) => ({ background: active ? '#059669' : '#1e293b', padding: '0.4rem 0.8rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: active ? '2px solid #34d399' : '2px solid transparent', transition: 'all 0.2s' }),
  timerText: { fontSize: '1.3rem', fontWeight: 'bold', fontFamily: 'monospace' },
  
  gameBalance: { background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: '#fff', padding: '0.35rem 0.9rem', borderRadius: '18px', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' },
  withdrawHint: { fontSize: '0.75rem', opacity: 0.8, cursor: 'pointer', textDecoration: 'underline' },
  statusMsg: { color: '#38bdf8', textAlign: 'center', marginBottom: '0.25rem', minHeight: '1.1rem', fontSize: '0.95rem' },
  boardWrap: { width: 'min(95vw, 360px)', background: '#1e293b', padding: '0.25rem', borderRadius: '12px', marginBottom: '0.5rem' },
  
  historyPanel: { width: '100%', maxWidth: '360px', background: '#1e293b', borderRadius: '10px', padding: '0.4rem', marginBottom: '0.5rem', maxHeight: '110px', overflow: 'hidden' },
  historyHeader: { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem', paddingBottom: '0.2rem', borderBottom: '1px solid #334155' },
  historyCount: { background: '#334155', padding: '0.1rem 0.4rem', borderRadius: '10px', fontSize: '0.75rem' },
  historyList: { display: 'flex', flexWrap: 'wrap', gap: '0.25rem', overflowY: 'auto', maxHeight: '70px', padding: '0.15rem' },
  moveChip: ({ highlight, playerTurn }) => ({ 
    background: highlight ? '#3b82f6' : playerTurn ? '#475569' : '#334155', 
    padding: '0.15rem 0.4rem', borderRadius: '5px', fontSize: '0.75rem', fontWeight: '500',
    border: playerTurn && !highlight ? '1px solid #64748b' : 'none'
  }),
  emptyHist: { color: '#64748b', fontSize: '0.75rem' },
  
  controls: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '0.4rem' },
  btnCtrl: { padding: '0.4rem 0.7rem', background: '#475569', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' },
  btnProfile: { padding: '0.4rem 0.7rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' },
  btnAdd: { padding: '0.4rem 0.7rem', background: '#f59e0b', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' },
  modeInfo: { color: '#64748b', fontSize: '0.75rem', textAlign: 'center', marginTop: 'auto' },
  
  // 🏁 Баннер конца игры
  gameOverBanner: { background: 'linear-gradient(135deg, #1e293b, #7c3aed)', padding: '1rem', borderRadius: '16px', width: '100%', maxWidth: '400px', textAlign: 'center', marginBottom: '0.6rem', border: '2px solid #a78bfa', animation: 'pulse 0.3s ease-in-out' },
  gameOverIcon: { fontSize: '2.5rem', marginBottom: '0.3rem' },
  gameOverText: { fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '0.3rem', color: '#fbbf24' },
  prizeText: { color: '#34d399', fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.6rem' },
  btnNewGame: { padding: '0.6rem 1.5rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem' },
  
  // 👤 Профиль
  balanceCard: { background: 'linear-gradient(135deg, #1e293b, #334155)', padding: '1rem', borderRadius: '14px', width: '100%', maxWidth: '360px', marginBottom: '0.8rem', textAlign: 'center', border: '2px solid #475569' },
  balanceLabel: { fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.2rem' },
  balanceValue: { fontSize: '1.8rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '0.4rem' },
  balanceHint: { fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.6rem' },
  depositQuick: { display: 'flex', gap: '0.3rem', justifyContent: 'center', marginBottom: '0.4rem' },
  btnDepositSmall: { padding: '0.3rem 0.6rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' },
  
  txCard: { background: '#1e293b', padding: '0.7rem', borderRadius: '10px', width: '100%', maxWidth: '360px', marginBottom: '0.8rem' },
  txRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.2rem' },
  txTime: { fontSize: '0.75rem', color: '#64748b', textAlign: 'right' },
  
  statsCard: { background: '#1e293b', padding: '0.8rem', borderRadius: '12px', width: '100%', maxWidth: '360px', marginBottom: '0.8rem' },
  statsTitle: { margin: '0 0 0.6rem 0', fontSize: '1rem', color: '#cbd5e1' },
  statRow: { display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid #334155', fontSize: '0.85rem' }
}

export default App