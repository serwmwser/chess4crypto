import { useState, useEffect, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useChessSounds } from '../hooks/useChessSounds';

export default function ChessBoard({ gameId, userAddress, withBot = false, playerColor = 'white', initialTime = 300 }) {
  const [game, setGame] = useState(new Chess());
  const [status, setStatus] = useState('✅ Готов к игре');
  const [isThinking, setIsThinking] = useState(false);
  const [timeW, setTimeW] = useState(initialTime);
  const [timeB, setTimeB] = useState(initialTime);
  
  const timerRef = useRef(null);
  const gameRef = useRef(game);
  gameRef.current = game;

  const { playMove, playCapture, playCheck, playGameOver } = useChessSounds();
  const myColor = playerColor === 'black' ? 'b' : 'w';
  const fmt = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  // ⏱️ Строгий шахматный таймер
  useEffect(() => {
    if (game.isGameOver()) { clearInterval(timerRef.current); return; }

    timerRef.current = setInterval(() => {
      const currentGame = gameRef.current;
      if (currentGame.isGameOver()) { clearInterval(timerRef.current); return; }

      if (currentGame.turn() === 'w') {
        setTimeW(prev => {
          if (prev <= 1) { handleTimeout('b'); return 0; }
          return prev - 1;
        });
      } else {
        setTimeB(prev => {
          if (prev <= 1) { handleTimeout('w'); return 0; }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [game.turn(), game.isGameOver()]); // Перезапуск интервала ТОЛЬКО при смене хода или окончании

  const handleTimeout = (winner) => {
    clearInterval(timerRef.current);
    playGameOver();
    setStatus(`⏰ Время вышло! Победили ${winner==='w'?'белые':'чёрные'}`);
  };

  // 🔊 Звуки
  useEffect(() => {
    if (game.history().length === 0) return;
    const last = game.history({ verbose: true }).pop();
    if (last.captured) playCapture(); else playMove();
    if (game.inCheck()) setTimeout(playCheck, 150);
  }, [game.fen(), playMove, playCapture, playCheck]);

  // 🤖 Лёгкий ИИ
  const makeBotMove = useCallback(() => {
    if (game.isGameOver() || game.turn() !== 'b') return;
    setIsThinking(true); setStatus('⏳ Бот думает...');
    setTimeout(() => {
      try {
        const t = new Chess(game.fen());
        const m = t.moves({ verbose: true });
        if (!m.length) { setIsThinking(false); return; }
        let best = m.find(x => x.captured) || m.find(x => { const c=new Chess(game.fen()); c.move(x.san); return !c.inCheck(); }) || m[Math.floor(Math.random()*m.length)];
        const next = new Chess(game.fen()); next.move(best.san); setGame(next);
      } catch(e) { console.error(e); }
      setIsThinking(false);
    }, 600);
  }, [game]);

  useEffect(() => {
    if (withBot && game.turn()==='b' && !game.isGameOver()) makeBotMove();
    else if (!game.isGameOver()) setStatus(game.turn()===myColor ? '✅ Ваш ход' : '⏳ Ход соперника...');
  }, [game, withBot, makeBotMove, myColor]);

  const onDrop = (src, dst) => {
    if (isThinking || game.isGameOver() || game.turn()!==myColor) return false;
    try {
      const next = new Chess(game.fen());
      if (!next.move({ from: src, to: dst, promotion: 'q' })) return false;
      setGame(next);
      if (next.isCheckmate()) { clearInterval(timerRef.current); playGameOver(); setStatus('🏆 Вы поставили мат!'); }
      else if (next.isDraw()) { clearInterval(timerRef.current); playGameOver(); setStatus('🤝 Ничья!'); }
      return true;
    } catch { return false; }
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', gap: '0.5rem' }}>
        <div style={{ flex: 1, padding: '0.75rem', background: game.turn()==='w'?'#3b82f6':'#1e293b', color: game.turn()==='w'?'#000':'#e2e8f0', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', transition: '0.3s' }}>
          ⚪ Белые: {fmt(timeW)}
        </div>
        <div style={{ flex: 1, padding: '0.75rem', background: game.turn()==='b'?'#3b82f6':'#1e293b', color: game.turn()==='b'?'#000':'#e2e8f0', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', transition: '0.3s' }}>
          ⚫ Чёрные: {fmt(timeB)}
        </div>
      </div>

      <Chessboard position={game.fen()} onPieceDrop={onDrop} boardOrientation={playerColor==='black'?'black':'white'} arePiecesDraggable={!isThinking && !game.isGameOver() && (!withBot || game.turn()===myColor)} />

      <div style={{ textAlign: 'center', marginTop: '0.75rem', padding: '0.5rem', background: '#1e293b', borderRadius: '8px', fontSize: '0.95rem' }}>
        🎮 {withBot?'vs Бот':`Комната #${gameId}`} | <span style={{ color: isThinking?'#f59e0b':'#4ade80' }}>{status}</span>
      </div>

      {game.isGameOver() && <button onClick={reset} style={{ marginTop: '1rem', padding: '0.75rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}>🔄 Начать заново</button>}
    </div>
  );
}