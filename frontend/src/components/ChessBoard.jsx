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
  gameRef.current = game; // ✅ Всегда актуальное состояние

  const myColor = playerColor === 'black' ? 'b' : 'w';
  const turn = game.turn();
  const isOver = game.isGameOver();
  const fmt = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  // ⏱️ СТРОГИЙ ТАЙМЕР ОБРАТНОГО ОТСЧЁТА
  useEffect(() => {
    clearInterval(timerRef.current);
    if (isOver) return;

    timerRef.current = setInterval(() => {
      const currentTurn = gameRef.current.turn();
      if (currentTurn === 'w') {
        setTimeW(prev => Math.max(0, prev - 1));
      } else {
        setTimeB(prev => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [turn, isOver]); // 🔑 Перезапуск ТОЛЬКО при смене хода

  // ⏰ Проверка проигрыша по времени
  useEffect(() => {
    if (isOver) return;
    if (timeW === 0 && turn === 'w') {
      setStatus('⏰ Время белых вышло! Победа чёрных.');
    }
    if (timeB === 0 && turn === 'b') {
      setStatus('⏰ Время чёрных вышло! Победа белых.');
    }
  }, [timeW, timeB, turn, isOver]);

  // 🤖 ИИ с задержкой 3 СЕКУНДЫ (чтобы вы видели 3 тика таймера)
  const makeBotMove = useCallback(() => {
    if (isOver || turn !== 'b') return;
    
    setIsThinking(true); 
    setStatus('⏳ Бот думает... (03)');
    
    // Отсчёт "думания" бота для наглядности
    let thinkCount = 3;
    const thinkInterval = setInterval(() => {
      thinkCount--;
      if (thinkCount > 0) setStatus(`⏳ Бот думает... (0${thinkCount})`);
    }, 1000);

    setTimeout(() => {
      clearInterval(thinkInterval);
      
      try {
        const t = new Chess(gameRef.current.fen());
        const m = t.moves({ verbose: true });
        if (!m.length) { setIsThinking(false); return; }
        
        // Простая логика: приоритет взятиям, иначе случайно
        let best = m.find(x => x.captured) || m[Math.floor(Math.random() * m.length)];
        
        const next = new Chess(gameRef.current.fen()); 
        next.move(best.san); 
        setGame(next); // setGame → смена turn → таймер переключается на белые
      } catch(e) { 
        console.error('Bot error:', e); 
      }
      setIsThinking(false);
    }, 3000); // 🔥 3000мс = 3 секунды = вы увидите 3 тика часов бота!
    
  }, [isOver, turn]);

  useEffect(() => {
    if (withBot && turn === 'b' && !isThinking && !isOver) {
      makeBotMove();
    } else if (!isOver) {
      setStatus(turn === myColor ? '✅ Ваш ход' : '⏳ Ход соперника...');
    }
  }, [game, withBot, myColor, isThinking, makeBotMove, isOver, turn]);

  const onDrop = (src, dst) => {
    if (isThinking || isOver || turn !== myColor) return false;
    try {
      const next = new Chess(game.fen());
      const move = next.move({ from: src, to: dst, promotion: 'q' });
      if (!move) return false;
      setGame(next);
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
          flex: 1, padding: '0.75rem', 
          background: turn==='w' ? '#3b82f6' : '#1e293b', 
          color: turn==='w' ? '#000' : '#e2e8f0', 
          borderRadius: '8px', textAlign: 'center', fontWeight: 'bold',
          transition: 'all 0.3s', border: turn==='w' ? '2px solid #60a5fa' : '1px solid #334155'
        }}>
          ⚪ Белые: {fmt(timeW)} {turn==='w' && !isOver && '⏳'}
        </div>
        <div style={{ 
          flex: 1, padding: '0.75rem', 
          background: turn==='b' ? '#3b82f6' : '#1e293b', 
          color: turn==='b' ? '#000' : '#e2e8f0', 
          borderRadius: '8px', textAlign: 'center', fontWeight: 'bold',
          transition: 'all 0.3s', border: turn==='b' ? '2px solid #60a5fa' : '1px solid #334155'
        }}>
          ⚫ Чёрные: {fmt(timeB)} {turn==='b' && !isOver && '⏳'}
        </div>
      </div>

      <Chessboard 
        position={game.fen()} 
        onPieceDrop={onDrop} 
        boardOrientation={playerColor==='black' ? 'black' : 'white'} 
        arePiecesDraggable={!isThinking && !isOver && (!withBot || turn===myColor)} 
      />

      <div style={{ textAlign: 'center', marginTop: '0.75rem', padding: '0.5rem', background: '#1e293b', borderRadius: '8px', fontSize: '0.95rem', border: '1px solid #334155' }}>
        🎮 {withBot ? 'vs Бот' : `Комната #${gameId}`} | <span style={{ color: isThinking ? '#f59e0b' : '#4ade80' }}>{status}</span>
      </div>

      {isOver && <button onClick={reset} style={{ marginTop: '1rem', padding: '0.75rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}>🔄 Начать заново</button>}
    </div>
  );
}