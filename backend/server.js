// ============================================================================
// CHESS4CRYPTO BACKEND - Node.js + Socket.IO + Express
// ✅ CORS настроен для chesscrypto.netlify.app
// ============================================================================

import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'

// Загружаем переменные окружения
dotenv.config()

const app = express()
const PORT = process.env.PORT || 10000

// ============================================================================
// ✅ CORS НАСТРОЙКИ — РАЗРЕШАЕМ ВАШ ФРОНТЕНД
// ============================================================================

const allowedOrigins = [
  'https://chesscrypto.netlify.app',  // ← ВАШ ДОМЕН (основной)
  'http://localhost:5173',             // ← локальная разработка
  'https://chess4crypto-*.vercel.app', // ← Vercel preview-деплои
  'https://chess4crypto.pages.dev',    // ← Cloudflare Pages
  'http://localhost:3000',             // ← старый фронтенд (для совместимости)
  'https://chesscrypto.onrender.com'   // ← если фронтенд тоже на Render
]

const corsOptions = {
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (мобильные приложения, curl, Postman)
    if (!origin) return callback(null, true)
    
    // Проверяем домен против списка разрешённых
    const isAllowed = allowedOrigins.some(pattern => {
      // Поддержка wildcard-шаблонов (например, *.vercel.app)
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
        return regex.test(origin)
      }
      // Точное совпадение
      return origin === pattern
    })
    
    if (isAllowed) {
      console.log(`✅ CORS allowed: ${origin}`)
      return callback(null, true)
    }
    
    console.warn(`❌ CORS rejected: ${origin} (not in allowedOrigins)`)
    return callback(new Error('Origin not allowed by CORS'))
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}

// Применяем CORS к Express
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Создаём HTTP сервер + Socket.IO
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowEIO3: true // совместимость со старыми клиентами
})

// ============================================================================
// ✅ MIDDLEWARE: Валидация origin для Socket.IO соединений
// ============================================================================

io.use((socket, next) => {
  const origin = socket.handshake.headers.origin
  
  console.log(`🔗 Socket connection attempt from: ${origin || 'no-origin'}`)
  
  // Разрешаем соединения без origin (тесты, curl)
  if (!origin) return next()
  
  // Проверяем против allowedOrigins
  const isAllowed = allowedOrigins.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
      return regex.test(origin)
    }
    return origin === pattern
  })
  
  if (isAllowed) {
    console.log(`✅ Socket origin allowed: ${origin}`)
    socket.handshake.auth.origin = origin
    return next()
  }
  
  console.error(`❌ Socket origin rejected: ${origin}`)
  return next(new Error('Unauthorized: origin not allowed'))
})

// ============================================================================
// 🎮 SOCKET.IO ОБРАБОТЧИКИ СОБЫТИЙ
// ============================================================================

// Хранилище в памяти (для продакшена используйте Redis/Supabase)
const challenges = new Map()
const games = new Map()
const players = new Map()

io.on('connection', (socket) => {
  console.log(`🎮 Player connected: ${socket.id} from ${socket.handshake.auth.origin || 'unknown'}`)

  // 🔹 Игрок присоединился к системе
  socket.on('player:join', (data) => {
    console.log(`👤 Player ${socket.id} joined:`, { username: data?.username, roomId: data?.roomId })
    
    // Сохраняем информацию об игроке
    players.set(socket.id, {
      id: socket.id,
      username: data?.username || 'Anonymous',
      joinedAt: new Date().toISOString(),
      origin: socket.handshake.auth.origin
    })
    
    // Присоединяем к комнате если указана
    if (data?.roomId) {
      socket.join(data.roomId)
      socket.to(data.roomId).emit('player:joined', {
        playerId: socket.id,
        username: data.username,
        timestamp: new Date().toISOString()
      })
    }
    
    // Подтверждаем подключение
    socket.emit('player:connected', {
      playerId: socket.id,
      username: data?.username,
      timestamp: new Date().toISOString()
    })
  })

  // 🔹 Создание вызова на игру (ставками в GROK)
  socket.on('challenge:create', (data) => {
    console.log(`⚔️ Challenge created by ${socket.id}:`, {
      betAmount: data?.betAmount,
      gameMode: data?.gameMode,
      timeControl: data?.timeControl
    })
    
    const challengeId = `challenge_${Date.now()}_${socket.id.slice(0, 6)}`
    
    const challenge = {
      id: challengeId,
      creator: socket.id,
      creatorInfo: players.get(socket.id),
      betAmount: data?.betAmount || 0,
      token: data?.token || 'GROK',
      gameMode: data?.gameMode || 'classic',
      timeControl: data?.timeControl || '10+0',
      boardSetup: data?.boardSetup || 'standard',
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 минут
    }
    
    // Сохраняем вызов
    challenges.set(challengeId, challenge)
    
    // Отправляем подтверждение создателю
    socket.emit('challenge:created', {
      challengeId,
      status: 'pending',
      message: 'Challenge created successfully',
      challenge
    })
    
    // Рассылаем в лобби для листинга
    socket.broadcast.emit('challenge:new', challenge)
  })

  // 🔹 Получение списка активных вызовов
  socket.on('challenges:list', () => {
    const pending = Array.from(challenges.values())
      .filter(c => c.status === 'pending' && new Date(c.expiresAt) > new Date())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
    socket.emit('challenges:list', { challenges: pending, count: pending.length })
  })

  // 🔹 Принятие вызова
  socket.on('challenge:accept', (data) => {
    console.log(`✅ Challenge ${data?.challengeId} accepted by ${socket.id}`)
    
    const challenge = challenges.get(data?.challengeId)
    
    if (!challenge) {
      return socket.emit('challenge:error', {
        challengeId: data?.challengeId,
        message: 'Challenge not found or already taken'
      })
    }
    
    if (challenge.creator === socket.id) {
      return socket.emit('challenge:error', {
        challengeId: data?.challengeId,
        message: 'Cannot accept your own challenge'
      })
    }
    
    // Обновляем статус вызова
    challenge.status = 'accepted'
    challenge.acceptor = socket.id
    challenge.acceptorInfo = players.get(socket.id)
    challenge.acceptedAt = new Date().toISOString()
    
    // Создаём игровую комнату
    const roomId = `game_${challenge.id}`
    socket.join(roomId)
    
    // Присоединяем создателя к комнате (если онлайн)
    const creatorSocket = io.sockets.sockets.get(challenge.creator)
    if (creatorSocket) {
      creatorSocket.join(roomId)
    }
    
    // Определяем цвета (создатель играет белыми по умолчанию)
    const players = [
      { id: challenge.creator, username: challenge.creatorInfo?.username, role: 'white', socketId: challenge.creator },
      { id: socket.id, username: challenge.acceptorInfo?.username, role: 'black', socketId: socket.id }
    ]
    
    // Сохраняем игру
    games.set(roomId, {
      id: roomId,
      challengeId: challenge.id,
      players,
      status: 'active',
      startedAt: new Date().toISOString(),
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      turn: 'white',
      moves: []
    })
    
    // Уведомляем обоих игроков о начале игры
    io.to(roomId).emit('game:start', {
      roomId,
      challenge,
      players,
      fen: games.get(roomId).fen,
      turn: games.get(roomId).turn
    })
    
    // Удаляем вызов из листинга
    challenges.delete(challenge.id)
    socket.broadcast.emit('challenge:removed', { challengeId: challenge.id })
  })

  // 🔹 Отмена вызова
  socket.on('challenge:cancel', (data) => {
    console.log(`❌ Challenge ${data?.challengeId} cancelled by ${socket.id}`)
    
    const challenge = challenges.get(data?.challengeId)
    if (!challenge || challenge.creator !== socket.id) {
      return socket.emit('challenge:error', { message: 'Cannot cancel this challenge' })
    }
    
    challenges.delete(challenge.id)
    socket.emit('challenge:cancelled', { challengeId: challenge.id })
    socket.broadcast.emit('challenge:removed', { challengeId: challenge.id })
  })

  // 🔹 Ход в игре
  socket.on('game:move', (data) => {
    const game = games.get(data?.roomId)
    if (!game) {
      return socket.emit('game:error', { message: 'Game not found' })
    }
    
    // Проверяем, что ход делает правильный игрок
    const player = game.players.find(p => p.id === socket.id)
    if (!player || player.role !== game.turn) {
      return socket.emit('game:error', { message: 'Not your turn' })
    }
    
    console.log(`♟️ Move in ${data.roomId}:`, {
      from: data?.move?.from,
      to: data?.move?.to,
      promotion: data?.move?.promotion,
      player: player.role
    })
    
    // Обновляем состояние игры (упрощённо - в продакшене валидируйте ходы через chess.js)
    game.moves.push({
      ...data.move,
      playerId: socket.id,
      role: player.role,
      timestamp: new Date().toISOString()
    })
    
    // Меняем очередь хода
    game.turn = game.turn === 'white' ? 'black' : 'white'
    
    // Обновляем FEN (упрощённо)
    // В продакшене: используйте chess.js для расчёта нового FEN
    game.fen = data?.newFen || game.fen
    
    // Рассылаем ход второму игроку
    socket.to(data.roomId).emit('game:move', {
      playerId: socket.id,
      role: player.role,
      move: data.move,
      newFen: game.fen,
      turn: game.turn,
      timestamp: new Date().toISOString()
    })
    
    // Проверяем конец игры (упрощённо)
    if (data?.isCheckmate || data?.isDraw || data?.isResignation) {
      handleGameEnd(data.roomId, socket.id, data.result)
    }
  })

  // 🔹 Конец игры
  socket.on('game:end', (data) => {
    console.log(`🏁 Game ${data?.roomId} ended:`, data?.result)
    handleGameEnd(data.roomId, socket.id, data.result)
  })

  // 🔹 Запрос состояния игры
  socket.on('game:state', (data) => {
    const game = games.get(data?.roomId)
    if (!game) {
      return socket.emit('game:error', { message: 'Game not found' })
    }
    
    socket.emit('game:state', {
      roomId: data.roomId,
      fen: game.fen,
      turn: game.turn,
      moves: game.moves,
      players: game.players,
      status: game.status
    })
  })

  // 🔹 Отключение игрока
  socket.on('disconnect', (reason) => {
    console.log(`👋 Player ${socket.id} disconnected: ${reason}`)
    
    const player = players.get(socket.id)
    if (player) {
      players.delete(socket.id)
    }
    
    // Уведомляем оппонента в активной игре
    for (const [roomId, game] of games.entries()) {
      const gamePlayer = game.players.find(p => p.id === socket.id)
      if (gamePlayer && game.status === 'active') {
        game.status = 'interrupted'
        socket.to(roomId).emit('player:disconnected', {
          playerId: socket.id,
          username: player?.username,
          reason,
          timestamp: new Date().toISOString()
        })
        break
      }
    }
    
    // Очищаем просроченные вызовы этого игрока
    for (const [id, challenge] of challenges.entries()) {
      if (challenge.creator === socket.id && challenge.status === 'pending') {
        challenges.delete(id)
        io.emit('challenge:removed', { challengeId: id })
      }
    }
  })
})

// ============================================================================
// 🎮 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

function handleGameEnd(roomId, winnerId, result) {
  const game = games.get(roomId)
  if (!game) return
  
  game.status = 'finished'
  game.endedAt = new Date().toISOString()
  game.result = result
  
  // Обновляем результат в вызове если есть
  const challenge = Array.from(challenges.values()).find(c => `game_${c.id}` === roomId)
  if (challenge) {
    challenge.status = 'completed'
    challenge.result = result
  }
  
  // Уведомляем всех игроков в комнате
  io.to(roomId).emit('game:end', {
    roomId,
    result,
    winner: winnerId,
    players: game.players,
    timestamp: new Date().toISOString()
  })
  
  // TODO: Здесь можно добавить логику распределения ставок в GROK
  // distributeBet(challenge, winnerId)
}

// ============================================================================
// 🌐 REST API ENDPOINTS
// ============================================================================

// ✅ Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    connectedClients: io.engine.clientsCount,
    activeChallenges: Array.from(challenges.values()).filter(c => c.status === 'pending').length,
    activeGames: Array.from(games.values()).filter(g => g.status === 'active').length,
    uptime: process.uptime()
  })
})

// ✅ Список активных вызовов
app.get('/api/challenges', (req, res) => {
  const pending = Array.from(challenges.values())
    .filter(c => c.status === 'pending' && new Date(c.expiresAt) > new Date())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(({ creator, ...rest }) => rest) // Не отправляем сокеты клиентов
  
  res.json({ 
    challenges: pending, 
    count: pending.length,
    timestamp: new Date().toISOString()
  })
})

// ✅ Информация о конкретной игре
app.get('/api/game/:roomId', (req, res) => {
  const game = games.get(req.params.roomId)
  if (!game) {
    return res.status(404).json({ error: 'Game not found' })
  }
  
  res.json({
    roomId: game.id,
    status: game.status,
    fen: game.fen,
    turn: game.turn,
    players: game.players.map(({ socketId, ...p }) => p),
    moves: game.moves,
    startedAt: game.startedAt
  })
})

// ✅ 404 для остальных запросов
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not found', 
    path: req.path,
    hint: 'Use WebSocket for game events, REST for health/challenges'
  })
})

// ============================================================================
// 🚀 ЗАПУСК СЕРВЕРА
// ============================================================================

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Chess4Crypto backend starting...')
  console.log(`📦 Port: ${PORT}`)
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`)
  console.log(`🔗 WebSocket: ws://localhost:${PORT}`)
  console.log(`🏥 Health: http://localhost:${PORT}/health`)
  console.log(`✅ Server ready!`)
})

// ============================================================================
// 🛡️ ОБРАБОТКА ОШИБОК
// ============================================================================

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise rejection:', err)
})

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err)
  // Не завершаем процесс сразу — даём шанс на восстановление
  setTimeout(() => process.exit(1), 1000)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...')
  httpServer.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})