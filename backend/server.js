// ============================================================================
// CHESS4CRYPTO BACKEND - DEBUG MODE: ALLOW ALL ORIGINS
// ⚠️ Используйте ТОЛЬКО для тестов! Затем верните строгий список.
// ============================================================================

import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 10000

// 🔧 DEBUG: Разрешаем ВСЕ домены (для тестов!)
const corsOptions = {
  origin: '*',  // ← ВРЕМЕННО: принимает любой origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}

app.use(cors(corsOptions))
app.use(express.json())

const httpServer = createServer(app)

// 🔧 Socket.IO с разрешением всех источников
const io = new Server(httpServer, {
  cors: { origin: '*' },  // ← ВРЕМЕННО
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
})

// 🔍 Логирование ВСЕХ попыток подключения (для диагностики)
io.use((socket, next) => {
  const origin = socket.handshake.headers.origin
  const userAgent = socket.handshake.headers['user-agent']
  
  console.log('🔗 === SOCKET CONNECTION ATTEMPT ===')
  console.log(`📡 Origin: ${origin || 'NOT SENT'}`)
  console.log(`🤖 User-Agent: ${userAgent}`)
  console.log(`🔑 Headers:`, JSON.stringify(socket.handshake.headers, null, 2))
  console.log('✅ ALLOWED (debug mode)')
  console.log('=====================================\n')
  
  // Всегда пропускаем в режиме отладки
  return next()
})

// ============================================================================
// 🎮 ОБРАБОТЧИКИ (минимальные для теста)
// ============================================================================

io.on('connection', (socket) => {
  console.log(`🎮 CONNECTED: ${socket.id}`)
  
  socket.emit('connected', { message: 'Welcome to Chess4Crypto (debug mode)' })
  
  socket.on('disconnect', () => {
    console.log(`👋 DISCONNECTED: ${socket.id}`)
  })
})

// ============================================================================
// 🌐 REST API
// ============================================================================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mode: 'DEBUG - ALLOW ALL ORIGINS',
    timestamp: new Date().toISOString(),
    connectedClients: io.engine.clientsCount 
  })
})

app.get('/debug/origins', (req, res) => {
  res.json({
    message: 'Backend is in DEBUG mode - accepts any origin',
    hint: 'After testing, replace corsOptions.origin with strict array'
  })
})

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// ============================================================================
// 🚀 ЗАПУСК
// ============================================================================

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Chess4Crypto backend (DEBUG MODE)')
  console.log(`📦 Port: ${PORT}`)
  console.log(`🔓 CORS: ACCEPTING ALL ORIGINS (*)`)
  console.log(`🔗 Test: https://chesscrypto-backend.onrender.com/debug/origins`)
})

process.on('unhandledRejection', (err) => console.error('❌', err))
process.on('uncaughtException', (err) => {
  console.error('❌', err)
  process.exit(1)
})