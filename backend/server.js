// ============================================================================
// CHESS4CRYPTO BACKEND - Node.js + Socket.IO
// ✅ CORS разрешён для GitHub Pages, Netlify, Vercel и localhost
// ============================================================================

import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 10000

// 🔑 РАЗРЕШЁННЫЕ ДОМЕНЫ (обновлено для GitHub Pages)
const allowedOrigins = [
  'https://serwmwser.github.io',          // ← ВАШ ДОМЕН (GitHub Pages)
  'https://chesscrypto.netlify.app',      // ← Netlify (старый)
  'http://localhost:5173',                // ← Локальная разработка
  'https://chess4crypto-*.vercel.app',    // ← Vercel
  'https://chess4crypto.pages.dev'        // ← Cloudflare
]

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true)
    const isAllowed = allowedOrigins.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
        return regex.test(origin)
      }
      return origin === pattern
    })
    if (isAllowed) return callback(null, true)
    console.warn(`❌ CORS rejected: ${origin}`)
    return callback(new Error('Unauthorized: origin not allowed'))
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}

app.use(cors(corsOptions))
app.use(express.json())

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
})

// 🔍 Middleware для логирования подключений
io.use((socket, next) => {
  const origin = socket.handshake.headers.origin
  console.log(`🔗 Socket attempt from: ${origin || 'no-origin'}`)
  if (!origin || allowedOrigins.includes(origin)) {
    console.log(`✅ Socket allowed: ${origin}`)
    return next()
  }
  return next(new Error('Unauthorized: origin not allowed'))
})

// 🎮 Обработчики
io.on('connection', (socket) => {
  console.log(`🎮 Connected: ${socket.id} | Origin: ${socket.handshake.headers.origin}`)
  socket.emit('connected', { message: 'Welcome to Chess4Crypto' })
  
  socket.on('echo', (data) => socket.emit('echo', data))
  socket.on('disconnect', () => console.log(`👋 Disconnected: ${socket.id}`))
})

// 🌐 REST Endpoints
app.get('/health', (req, res) => res.json({ 
  status: 'ok', 
  allowedOrigins,
  timestamp: new Date().toISOString()
}))

app.get('/debug/cors', (req, res) => res.json({ 
  message: 'CORS is configured', 
  allowed: allowedOrigins 
}))

app.use('*', (req, res) => res.status(404).json({ error: 'Not found' }))

// 🚀 Запуск
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend running on port ${PORT}`)
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`)
})

process.on('unhandledRejection', err => console.error('❌', err))
process.on('uncaughtException', err => { console.error('❌', err); process.exit(1) })