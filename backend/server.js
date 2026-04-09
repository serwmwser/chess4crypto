// backend/server.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { Chess } from 'chess.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ CORS: разрешаем Vercel + localhost + Render
const corsOptions = {
  origin: [
    'https://chess4crypto.vercel.app',
    'http://localhost:5173',
    'https://chess4crypto-backend.onrender.com',
    '*'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// ✅ Socket.IO: конфигурация для Render
const server = createServer(app);
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  path: '/socket.io',
  allowEIO3: true
});

// 🗄️ Хранилище
const games = new Map();
const onlinePlayers = new Map();
const matchQueue = [];

// 🔌 Socket.IO подключения
io.on('connection', (socket) => {
  console.log('🔗 Client connected:', socket.id);

  socket.on('registerPlayer', ({ address }) => {
    onlinePlayers.set(address, { socketId: socket.id });
    socket.join(`user_${address}`);
    io.emit('onlinePlayersUpdate', Array.from(onlinePlayers.keys()));
    console.log(`👤 Registered: ${address}`);
  });

  socket.on('requestMatch', ({ address }) => {
    console.log(`🔍 ${address} requesting match...`);
    if (!matchQueue.includes(address)) {
      matchQueue.push(address);
      socket.emit('matchStatus', { status: 'searching' });
    }
    if (matchQueue.length >= 2) {
      const p1 = matchQueue.shift();
      const p2 = matchQueue.shift();
      const gameId = Math.random().toString(36).substring(2, 10).toUpperCase();
      games.set(gameId, { chess: new Chess(), players: [p1, p2], createdAt: Date.now() });
      io.to(`user_${p1}`).emit('matchFound', { gameId, role: 'white', opponent: p2 });
      io.to(`user_${p2}`).emit('matchFound', { gameId, role: 'black', opponent: p1 });
      console.log(`🎮 Match: ${gameId} | ${p1} vs ${p2}`);
    }
  });

  socket.on('cancelMatch', ({ address }) => {
    const idx = matchQueue.indexOf(address);
    if (idx !== -1) matchQueue.splice(idx, 1);
    socket.emit('matchStatus', { status: 'canceled' });
  });

  socket.on('directInvite', ({ from, to, gameId }) => {
    const target = onlinePlayers.get(to);
    if (target) {
      games.set(gameId, { chess: new Chess(), players: [from, to] });
      io.to(target.socketId).emit('inviteReceived', { from, gameId });
    } else {
      socket.emit('error', '⛔ Player offline');
    }
  });

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

  socket.on('makeMove', ({ gameId, from, to, promotion, playerAddress }) => {
    const game = games.get(gameId);
    if (!game) return;
    const turn = game.chess.turn();
    const expected = game.players[turn === 'w' ? 0 : 1];
    if (playerAddress !== expected) {
      socket.emit('error', '⛔ Not your turn');
      return;
    }
    try {
      const move = game.chess.move({ from, to, promotion: promotion || 'q' });
      if (move) {
        const state = {
          fen: game.chess.fen(),
          turn: game.chess.turn(),
          gameOver: game.chess.isGameOver(),
          result: game.chess.isCheckmate() ? 'checkmate' : game.chess.isDraw() ? 'draw' : null
        };
        socket.to(`game_${gameId}`).emit('opponentMove', state);
        socket.emit('moveConfirmed', state);
      }
    } catch (e) {
      socket.emit('error', '❌ Invalid move');
    }
  });

  socket.on('chatMessage', ({ gameId, user, text, time }) => {
    const safeText = text.replace(/[<>]/g, '');
    io.to(`game_${gameId}`).emit('chatMessage', { user, text: safeText, time });
  });

  socket.on('disconnect', () => {
    for (const [addr, data] of onlinePlayers.entries()) {
      if (data.socketId === socket.id) {
        onlinePlayers.delete(addr);
        const idx = matchQueue.indexOf(addr);
        if (idx !== -1) matchQueue.splice(idx, 1);
        io.emit('onlinePlayersUpdate', Array.from(onlinePlayers.keys()));
        break;
      }
    }
  });
});

// 🏥 Health check - ОБЯЗАТЕЛЬНО для Render!
app.get('/health', (req, res) => {
  console.log('✅ Health check requested');
  res.status(200).json({ 
    status: 'ok', 
    timestamp: Date.now(), 
    uptime: process.uptime(),
    port: PORT,
    io: 'running'
  });
});

// 🏠 Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Chess4Crypto Backend is Running 🚀', 
    endpoints: { 
      health: '/health', 
      socket: '/socket.io' 
    } 
  });
});

// 🚀 Запуск сервера - КРИТИЧНО: 0.0.0.0 для Render!
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server started on port ${PORT}`);
  console.log(`🔗 Health: https://chess4crypto-backend.onrender.com/health`);
  console.log(`🔗 Socket: wss://chess4crypto-backend.onrender.com/socket.io`);
});

// 🛡 Обработка ошибок
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});