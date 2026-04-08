// backend/server.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { Chess } from 'chess.js';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// ✅ CORS: разрешаем ВСЕМ (для продакшена можно сузить)
const corsOptions = {
  origin: [
    'https://chess4crypto.vercel.app',
    'https://chess4crypto-*.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    '*' // ⚠️ Для теста: разрешаем все домены
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// ✅ Socket.IO с правильной CORS-конфигурацией
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000
});

// 🗄️ Хранилище игр и игроков
const games = new Map();
const onlinePlayers = new Map();
const matchQueue = [];

// 🔌 Обработка подключений
io.on('connection', (socket) => {
  console.log('🔗 Client connected:', socket.id);

  // Регистрация игрока
  socket.on('registerPlayer', ({ address }) => {
    onlinePlayers.set(address, { socketId: socket.id });
    socket.join(`user_${address}`);
    io.emit('onlinePlayersUpdate', Array.from(onlinePlayers.keys()));
    console.log(`👤 Online: ${address}`);
  });

  // Поиск случайного матча
  socket.on('requestMatch', ({ address }) => {
    if (!matchQueue.includes(address)) {
      matchQueue.push(address);
      socket.emit('matchStatus', { status: 'searching' });
    }
    if (matchQueue.length >= 2) {
      const p1 = matchQueue.shift();
      const p2 = matchQueue.shift();
      const gameId = Math.random().toString(36).substring(2, 10).toUpperCase();
      games.set(gameId, { chess: new Chess(), players: [p1, p2] });
      io.to(`user_${p1}`).emit('matchFound', { gameId, role: 'white', opponent: p2 });
      io.to(`user_${p2}`).emit('matchFound', { gameId, role: 'black', opponent: p1 });
      console.log(`🎮 Matched: ${p1} vs ${p2} [${gameId}]`);
    }
  });

  // Отмена поиска
  socket.on('cancelMatch', ({ address }) => {
    const idx = matchQueue.indexOf(address);
    if (idx !== -1) matchQueue.splice(idx, 1);
    socket.emit('matchStatus', { status: 'canceled' });
  });

  // Прямое приглашение
  socket.on('directInvite', ({ from, to, gameId }) => {
    const target = onlinePlayers.get(to);
    if (target) {
      games.set(gameId, { chess: new Chess(), players: [from, to] });
      io.to(target.socketId).emit('inviteReceived', { from, gameId });
      console.log(`📨 Invite: ${from} -> ${to}`);
    } else {
      socket.emit('error', '⛔ Игрок не в сети');
    }
  });

  // Присоединение к игре
  socket.on('joinGame', ({ gameId, address }) => {
    socket.join(`game_${gameId}`);
    const game = games.get(gameId);
    if (game) {
      const isCreator = game.players[0] === address;
      socket.emit('gameState', { 
        fen: game.chess.fen(), 
        turn: game.chess.turn(), 
        gameId, 
        playerColor: isCreator ? 'w' : 'b' 
      });
    }
  });

  // Обработка хода
  socket.on('makeMove', ({ gameId, from, to, promotion, playerAddress }) => {
    const game = games.get(gameId);
    if (!game) return;
    const turn = game.chess.turn();
    const expected = game.players[turn === 'w' ? 0 : 1];
    if (playerAddress !== expected) {
      socket.emit('error', '⛔ Сейчас не ваш ход!');
      return;
    }
    try {
      const move = game.chess.move({ from, to, promotion: promotion || 'q' });
      if (move) {
        const state = {
          fen: game.chess.fen(),
          turn: game.chess.turn(),
          gameOver: game.chess.isGameOver(),
          result: game.chess.isCheckmate() ? 'Мат' : game.chess.isDraw() ? 'Ничья' : null
        };
        socket.to(`game_${gameId}`).emit('opponentMove', state);
        socket.emit('moveConfirmed', state);
      }
    } catch (e) {
      socket.emit('error', '❌ Недопустимый ход');
    }
  });

  // Чат
  socket.on('chatMessage', ({ gameId, user, text, time }) => {
    const safeText = text.replace(/[<>]/g, '');
    const msg = { user, text: safeText, time };
    io.to(`game_${gameId}`).emit('chatMessage', msg);
  });

  // Отключение
  socket.on('disconnect', () => {
    for (const [addr, data] of onlinePlayers.entries()) {
      if (data.socketId === socket.id) {
        onlinePlayers.delete(addr);
        const qIdx = matchQueue.indexOf(addr);
        if (qIdx !== -1) matchQueue.splice(qIdx, 1);
        io.emit('onlinePlayersUpdate', Array.from(onlinePlayers.keys()));
        break;
      }
    }
    console.log('🔌 Disconnected:', socket.id);
  });
});

// 🏥 Health check (обязательно для Render!)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), uptime: process.uptime() });
});

// 🎯 Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Chess4Crypto Backend is running 🚀' });
});

// 🚀 Запуск сервера
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`🔗 Health: https://chess4crypto-backend.onrender.com/health`);
});