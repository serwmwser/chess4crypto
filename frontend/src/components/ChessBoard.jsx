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
  gameRef.current = game; // Всегда свежее состояние

  const myColor = playerColor === 'black' ? 'b' : 'w';
  const turn = game.turn();
  const isOver = game.isGameOver();
  const fmt = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  // ⏱️ ТАЙМЕР (перезапускается ТОЛЬКО при смене хода)
  useEffect(() => {
    clearInterval(timerRef.current);
    if (isOver) return;

    timerRef.current = setInterval(() => {
      const currentTurn = gameRef.current.turn();
      if (currentTurn === 'w') setTimeW(p => Math.max(0, p - 1));
      else setTimeB(p => Math.max(0, p - 1));
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [turn, isOver]); // ⚠️ КРИТИЧЕСКИ ВАЖНО

  // ⏰ Проверка конца по времени
  useEffect(() => {
    if (isOver) return;
    if (timeW === 0) setStatus('⏰ Время белых вышло! Победа чёрных.');
    if (timeB === 0) setStatus('⏰ Время чёрных вышло! Победа белых.');
  }, [timeW, timeB, isOver]);

  // 🤖 Бот
  const makeBotMove = useCallback(() => {
    if (isOver || turn !== 'b') return;
    setIsThinking(true); setStatus('⏳ Бот думает...');
    
    setTimeout(() => {
      try {
        const t = new Chess(gameRef.current.fen());
        const m = t.moves({ verbose: true });
        if (!m.length) { setIsThinking(false); return; }
        const best = m[Math.floor(Math.random() * m.length)];
        const next = new Chess(gameRef.current.fen()); 
        next.move(best.san); 
        setGame(next);
      } catch(e) { console.error(e); }
      setIsThinking(false);
    }, 700); // 700мс = вы увидите 1 тик часов бота
  }, [isOver, turn]);

  useEffect(() => {
    if (withBot && turn === 'b' && !isThinking) makeBotMove();
    else if (!isOver) setStatus(turn === myColor ? '✅ Ваш ход' : '⏳ Ход соперника...');
  }, [game, withBot, myColor, isThinking, makeBotMove, isOver]);

  const onDrop = (src, dst) => {
    if (isThinking || isOver || turn !== myColor) return false;
    try {
      const next = new Chess(game.fen());
      if (!next.move({ from: src, to: dst, promotion: 'q' })) return false;
      setGame(next);
      if (next.isCheckmate() || next.isDraw()) {
        clearInterval(timerRef.current);
        setStatus(next.isCheckmate() ? '🏆 Мат!' : '🤝 Ничья!');
      }
      return true;
    } catch { return false; }
  };

  const reset = () => { 
    setGame(new Chess()); setTimeW(initialTime); setTimeB(initialTime);
    setStatus('✅ Готов к игре'); setIsThinking(false);
    clearInterval(timerRef.current);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', gap: '0.5rem' }}>
        <div style={{ flex: 1, padding: '0.75rem', background: turn==='w'?'#3b82f6':'#1e293b', color: turn==='w'?'#000':'#e2e8f0', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold' }}>⚪ Белые: {fmt(timeW)}</div>
        <div style={{ flex: 1, padding: '0.75rem', background: turn==='b'?'#3b82f6':'#1e293b', color: turn==='b'?'#000':'#e2e8f0', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold' }}>⚫ Чёрные: {fmt(timeB)}</div>
      </div>
      <Chessboard position={game.fen()} onPieceDrop={onDrop} boardOrientation={playerColor==='black'?'black':'white'} arePiecesDraggable={!isThinking && !isOver && (!withBot || turn===myColor)} />
      <div style={{ textAlign: 'center', marginTop: '0.75rem', padding: '0.5rem', background: '#1e293b', borderRadius: '8px' }}>{withBot?'vs Бот':`#${gameId}`} | {status}</div>
      {isOver && <button onClick={reset} style={{ marginTop: '1rem', padding: '0.75rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>🔄 Заново</button>}
    </div>
  );
}