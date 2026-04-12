import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 10000

// 🔧 DEBUG MODE: разрешаем ВСЕ домены (для тестов!)
const corsOptions = { origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'], credentials: true }

app.use(cors(corsOptions))
app.use(express.json())

const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: '*' }, pingTimeout: 60000, pingInterval: 25000, transports: ['websocket','polling'] })

// Логирование подключений
io.use((socket, next) => {
  const origin = socket.handshake.headers.origin
  console.log(`🔗 Socket from: ${origin || 'no-origin'}`)
  console.log(`✅ ALLOWED (debug mode)`)
  return next()
})

// Обработчики
io.on('connection', (socket) => {
  console.log(`🎮 Connected: ${socket.id}`)
  socket.emit('connected', { message: 'Welcome to Chess4Crypto' })
  socket.on('disconnect', () => console.log(`👋 Disconnected: ${socket.id}`))
  
  // Пример: эхо-сообщение
  socket.on('echo', (data) => socket.emit('echo', data))
})

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', mode: 'DEBUG', timestamp: new Date().toISOString() }))
app.get('/debug/origins', (req, res) => res.json({ message: 'Backend accepts ANY origin (debug mode)' }))
app.use('*', (req, res) => res.status(404).json({ error: 'Not found' }))

// Запуск
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend running on port ${PORT}`)
  console.log(`🔓 CORS: ACCEPTING ALL ORIGINS (*)`)
})

process.on('unhandledRejection', err => console.error('❌', err))
process.on('uncaughtException', err => { console.error('❌', err); process.exit(1) })