import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// CORS для Vercel + localhost
const corsOptions = {
  origin: [
    'https://chess4crypto.vercel.app',
    'http://localhost:5173',
    '*'
  ],
  methods: ['GET', 'POST']
};

app.use(cors(corsOptions));
app.use(express.json());

const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000
});

// Хранилище игр в памяти (для демо)
const games = new Map();

io.on('connection', (socket) => {
  console.log('🔗 Client connected:', socket.id);

  // Присоединение к игре
  socket.on('joinGame', ({ gameId, address }) => {
    socket.join(`game_${gameId}`);
    if (!games.has(gameId)) {
      games.set(gameId, { players: [], moves: [] });
    }
    const game = games.get(gameId);
    if (!game.players.includes(address)) {
      game.players.push(address);
    }
    console.log(`🎮 ${address} joined game ${gameId}`);
  });

  // Чат
  socket.on('chatMessage', ({ gameId, user, text, time }) => {
    const safeText = text.replace(/[<>]/g, ''); // XSS защита
    const msg = { user, text: safeText, time };
    io.to(`game_${gameId}`).emit('chatMessage', msg);
    console.log(`💬 Chat: ${user}: ${safeText}`);
  });

  // Ход в шахматах (для синхронизации)
  socket.on('makeMove', ({ gameId, move, fen }) => {
    io.to(`game_${gameId}`).emit('moveMade', { move, fen });
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});