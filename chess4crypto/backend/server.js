import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 10000

// 🔑 РАЗРЕШЁННЫЕ ДОМЕНЫ (включая GitHub Pages)
const allowedOrigins = [
  'https://serwmwser.github.io',
  'https://chesscrypto.netlify.app',
  'http://localhost:5173',
  'https://chess4crypto-*.vercel.app'
]

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    console.warn(`❌ CORS rejected: ${origin}`)
    callback(new Error('Unauthorized: origin not allowed'))
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  credentials: true
}

app.use(cors(corsOptions))
app.use(express.json())

const httpServer = createServer(app)
const io = new Server(httpServer, { cors: corsOptions, pingTimeout: 60000, pingInterval: 25000, transports: ['websocket','polling'] })

io.use((socket, next) => {
  const origin = socket.handshake.headers.origin
  console.log(`🔗 Socket from: ${origin || 'no-origin'}`)
  if (!origin || allowedOrigins.includes(origin)) { console.log(`✅ Allowed`); return next() }
  return next(new Error('Unauthorized: origin not allowed'))
})

io.on('connection', (socket) => {
  console.log(`🎮 Connected: ${socket.id}`)
  socket.emit('connected', { message: 'Welcome' })
  socket.on('disconnect', () => console.log(`👋 Disconnected: ${socket.id}`))
})

app.get('/health', (req, res) => res.json({ status: 'ok', allowedOrigins, timestamp: new Date().toISOString() }))
app.use('*', (req, res) => res.status(404).json({ error: 'Not found' }))

httpServer.listen(PORT, '0.0.0.0', () => { console.log(`🚀 Backend on port ${PORT}`); console.log(`🌐 Allowed: ${allowedOrigins.join(', ')}`) })
process.on('unhandledRejection', err => console.error('❌', err))
process.on('uncaughtException', err => { console.error('❌', err); process.exit(1) })