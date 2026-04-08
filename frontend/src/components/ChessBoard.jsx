import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

export default function ChessBoard({ gameId, userAddress, withBot = false, playerColor = 'white' }) {
  const [game, setGame] = useState(new Chess());
  const [status, setStatus] = useState('✅ Готов к игре');
  const [isThinking, setIsThinking] = useState(false);

  // 🔑 Нормализуем цвет под формат chess.js: 'w' или 'b'
  const myTurnColor = playerColor === 'black' ? 'b' : 'w';

  const makeBotMove = useCallback(() => {
    if (game.isGameOver() || game.turn() !== 'b') return;
    
    setIsThinking(true);
    setStatus('⏳ Бот думает...');
    
    setTimeout(() => {
      try {
        const temp = new Chess(game.fen());
        const moves = temp.moves({ verbose: true });
        if (moves.length === 0) { setIsThinking(false); return; }

        // 1. Взятие
        let best = moves.find(m => m.captured);
        // 2. Уход от шаха
        if (!best && temp.inCheck()) {
          best = moves.find(m => {
            const t = new Chess(game.fen());
            t.move(m.san);
            return !t.inCheck();
          });
        }
        // 3. Случайный ход
        if (!best) best = moves[Math.floor(Math.random() * moves.length)];

        const next = new Chess(game.fen());
        next.move(best.san);
        setGame(next);

        if (next.isCheckmate()) setStatus('🏆 Бот поставил мат!');
        else if (next.isDraw()) setStatus('🤝 Ничья!');
        else setStatus('✅ Ваш ход');
      } catch (e) {
        console.error('AI Error:', e);
        setStatus('⚠️ Ошибка хода');
      }
      setIsThinking(false);
    }, 600);
  }, [game]);

  useEffect(() => {
    if (withBot && game.turn() === 'b' && !game.isGameOver()) {
      makeBotMove();
    } else if (!game.isGameOver()) {
      setStatus(game.turn() === myTurnColor ? '✅ Ваш ход' : '⏳ Ход соперника...');
    }
  }, [game, withBot, makeBotMove, myTurnColor]);

  function onDrop(sourceSquare, targetSquare) {
    if (isThinking || game.isGameOver()) return false;
    if (withBot && game.turn() !== myTurnColor) return false;

    try {
      const next = new Chess(game.fen());
      const move = next.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
      if (!move) return false; // Недопустимый ход
      setGame(next);
      return true; // Успех
    } catch {
      return false;
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem', padding: '0.5rem', background: '#1e293b', borderRadius: '8px', fontSize: '0.95rem' }}>
        🎮 {withBot ? 'vs Бот' : `Комната #${gameId}`} | <span style={{ color: isThinking ? '#f59e0b' : '#4ade80' }}>{status}</span>
      </div>

      <Chessboard
        position={game.fen()}
        onPieceDrop={onDrop}
        boardOrientation={playerColor === 'black' ? 'black' : 'white'}
        arePiecesDraggable={!isThinking && !game.isGameOver() && (!withBot || game.turn() === myTurnColor)}
      />

      {game.isGameOver() && (
        <button 
          onClick={() => { setGame(new Chess()); setStatus('✅ Готов к игре'); setIsThinking(false); }} 
          style={{ marginTop: '1rem', padding: '0.75rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}
        >
          🔄 Начать заново
        </button>
      )}
    </div>
  );
}