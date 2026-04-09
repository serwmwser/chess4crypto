import { useState, useEffect, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

export default function ChessBoard({ gameId, userAddress, withBot = false, playerColor = 'white', initialTime = 300 }) {
  const [game, setGame] = useState(new Chess());
  const [status, setStatus] = useState('✅ Готов к игре');
  const [isThinking, setIsThinking] = useState(false);
  const [timeW, setTimeW] = useState(initialTime);
  const [timeB, setTimeB] = useState(initialTime);
  
  const timerRef = useRef(null);
  const gameRef = useRef(game);
  gameRef.current = game; // ✅ Всегда актуальное состояние доски

  const myColor = playerColor === 'black' ? 'b' : 'w';
  const turn = game.turn(); // 'w' или 'b'
  const isOver = game.isGameOver();
  const fmt = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  // ⏱️ СТРОГИЙ ТАЙМЕР ОБРАТНОГО ОТСЧЁТА
  // Перезапускается ТОЛЬКО при смене хода или окончании игры
  useEffect(() => {
    // Очищаем старый интервал перед созданием нового
    clearInterval(timerRef.current);
    if (isOver) return;

    // Создаём новый интервал: уменьшаем время на 1 секунду
    timerRef.current = setInterval(() => {
      // Читаем ход ИЗ REF, чтобы избежать устаревших замыканий
      const currentTurn = gameRef.current.turn();
      
      if (currentTurn === 'w') {
        // Уменьшаем время белых, но не меньше 0
        setTimeW(prev => Math.max(0, prev - 1));
      } else {
        // Уменьшаем время чёрных, но не меньше 0
        setTimeB(prev => Math.max(0, prev - 1));
      }
    }, 1000);

    // Cleanup при размонтировании или смене зависимостей
    return () => clearInterval(timerRef.current);
    
  }, [turn, isOver]); // 🔑 КРИТИЧЕСКИ ВАЖНО: перезапуск только при смене хода!

  // ⏰ Проверка проигрыша по времени (когда таймер достиг 0)
  useEffect(() => {
    if (isOver) return;
    
    if (timeW === 0 && turn === 'w') {
      setStatus('⏰ Время белых вышло! Победа чёрных.');
    }
    if (timeB === 0 && turn === 'b') {
      setStatus('⏰ Время чёрных вышло! Победа белых.');
    }
  }, [timeW, timeB, turn, isOver]);

  // 🤖 Лёгкий ИИ (с задержкой, чтобы вы видели тиканье часов)
  const makeBotMove = useCallback(() => {
    if (isOver || turn !== 'b') return;
    
    setIsThinking(true); 
    setStatus('⏳ Бот думает...');
    
    setTimeout(() => {
      try {
        const t = new Chess(gameRef.current.fen());
        const m = t.moves({ verbose: true });
        if (!m.length) { setIsThinking(false); return; }
        
        // Простая логика: приоритет взятиям, иначе случайно
        let best = m.find(x => x.captured) || m[Math.floor(Math.random() * m.length)];
        
        const next = new Chess(gameRef.current.fen()); 
        next.move(best.san); 
        setGame(next); // Этот setGame запустит перерисовку и сменит turn
      } catch(e) { 
        console.error('Bot error:', e); 
      }
      setIsThinking(false);
    }, 700); // 700мс задержка = вы увидите ровно 1 тик часов бота перед его ходом
  }, [isOver, turn]);

  // Запуск бота, когда его ход
  useEffect(() => {
    if (withBot && turn === 'b' && !isThinking && !isOver) {
      makeBotMove();
    } else if (!isOver) {
      setStatus(turn === myColor ? '✅ Ваш ход' : '⏳ Ход соперника...');
    }
  }, [game, withBot, myColor, isThinking, makeBotMove, isOver, turn]);

  // Обработка хода игрока
  const onDrop = (src, dst) => {
    if (isThinking || isOver || turn !== myColor) return false;
    
    try {
      const next = new Chess(game.fen());
      const move = next.move({ from: src, to: dst, promotion: 'q' });
      
      if (!move) return false; // Недопустимый ход
      
      setGame(next); // Обновляем доску → срабатывает useEffect с [turn] → таймер переключается
      
      // Проверка конца игры
      if (next.isCheckmate()) {
        clearInterval(timerRef.current);
        setStatus('🏆 Вы поставили мат!');
      } else if (next.isDraw()) {
        clearInterval(timerRef.current);
        setStatus('🤝 Ничья!');
      }
      return true;
    } catch (e) {
      console.error('Move error:', e);
      return false;
    }
  };

  // Сброс игры
  const reset = () => { 
    setGame(new Chess()); 
    setTimeW(initialTime); 
    setTimeB(initialTime); 
    setStatus('✅ Готов к игре'); 
    setIsThinking(false); 
    clearInterval(timerRef.current); 
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      {/* ⏱️ Панель таймеров */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', gap: '0.5rem' }}>
        <div style={{ 
          flex: 1, 
          padding: '0.75rem', 
          background: turn==='w' ? '#3b82f6' : '#1e293b', 
          color: turn==='w' ? '#000' : '#e2e8f0', 
          borderRadius: '8px', 
          textAlign: 'center', 
          fontWeight: 'bold',
          transition: 'all 0.3s',
          border: turn==='w' ? '2px solid #60a5fa' : '1px solid #334155'
        }}>
          ⚪ Белые: {fmt(timeW)} {turn==='w' && !isOver && '⏳'}
        </div>
        <div style={{ 
          flex: 1, 
          padding: '0.75rem', 
          background: turn==='b' ? '#3b82f6' : '#1e293b', 
          color: turn==='b' ? '#000' : '#e2e8f0', 
          borderRadius: '8px', 
          textAlign: 'center', 
          fontWeight: 'bold',
          transition: 'all 0.3s',
          border: turn==='b' ? '2px solid #60a5fa' : '1px solid #334155'
        }}>
          ⚫ Чёрные: {fmt(timeB)} {turn==='b' && !isOver && '⏳'}
        </div>
      </div>

      {/* ♟️ Шахматная доска */}
      <Chessboard 
        position={game.fen()} 
        onPieceDrop={onDrop} 
        boardOrientation={playerColor==='black' ? 'black' : 'white'} 
        arePiecesDraggable={!isThinking && !isOver && (!withBot || turn===myColor)} 
      />

      {/* 📊 Статус */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '0.75rem', 
        padding: '0.5rem', 
        background: '#1e293b', 
        borderRadius: '8px', 
        fontSize: '0.95rem',
        border: '1px solid #334155'
      }}>
        🎮 {withBot ? 'vs Бот' : `Комната #${gameId}`} | <span style={{ color: isThinking ? '#f59e0b' : '#4ade80' }}>{status}</span>
      </div>

      {/* 🔄 Кнопка рестарта */}
      {isOver && (
        <button onClick={reset} style={{ 
          marginTop: '1rem', 
          padding: '0.75rem', 
          background: '#3b82f6', 
          color: '#fff', 
          border: 'none', 
          borderRadius: '8px', 
          cursor: 'pointer', 
          width: '100%', 
          fontWeight: 'bold',
          fontSize: '1rem'
        }}>
          🔄 Начать заново
        </button>
      )}
    </div>
  );
}