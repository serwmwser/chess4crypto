import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

export default function ChessBoard({ gameId, userAddress, withBot = false, playerColor = 'white' }) {
  const [game, setGame] = useState(new Chess());
  const [status, setStatus] = useState('✅ Готов к игре');
  const [isThinking, setIsThinking] = useState(false);

  // 🤖 Встроенный лёгкий ИИ (без внешних зависимостей)
  const makeBotMove = useCallback(() => {
    if (game.isGameOver() || game.turn() !== 'b') return;
    
    setIsThinking(true);
    setStatus('⏳ Бот думает...');
    
    setTimeout(() => {
      try {
        const fen = game.fen();
        const tempGame = new Chess(fen);
        const moves = tempGame.moves({ verbose: true });
        
        if (moves.length === 0) {
          setIsThinking(false);
          return;
        }

        // 1. Приоритет: взятие фигуры
        let bestMove = moves.find(m => m.captured);
        
        // 2. Если шах: ищем ход, убирающий шах
        if (!bestMove && tempGame.inCheck()) {
          bestMove = moves.find(m => {
            const test = new Chess(fen);
            test.move(m.san);
            return !test.inCheck();
          });
        }

        // 3. Иначе: случайный легальный ход
        if (!bestMove) {
          bestMove = moves[Math.floor(Math.random() * moves.length)];
        }

        // Выполняем ход
        const newGame = new Chess(fen);
        newGame.move(bestMove.san);
        setGame(newGame);
        
        if (newGame.isCheckmate()) setStatus('🏆 Бот поставил мат!');
        else if (newGame.isDraw()) setStatus('🤝 Ничья!');
        else setStatus('✅ Ваш ход');
        
      } catch (e) {
        console.error('❌ Ошибка ИИ:', e);
        setStatus('⚠️ Ошибка хода бота');
      }
      setIsThinking(false);
    }, 600);
  }, [game]);

  // Запускаем ход бота, когда его очередь
  useEffect(() => {
    if (withBot && game.turn() === 'b' && !game.isGameOver()) {
      makeBotMove();
    }
  }, [game, withBot, makeBotMove]);

  // 🎯 Обработка хода игрока
  function onDrop(sourceSquare, targetSquare) {
    if (withBot && game.turn() !== playerColor) return false;
    
    try {
      const newGame = new Chess(game.fen());
      const move = newGame.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
      if (!move) return false;
      
      setGame(newGame);
      setStatus('⏳ Бот думает...');
      return true;
    } catch {
      return false;
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ 
        textAlign: 'center', marginBottom: '1rem', padding: '0.5rem', 
        background: '#1e293b', borderRadius: '8px', fontSize: '0.95rem' 
      }}>
        🎮 {withBot ? 'Режим: vs Бот' : `Комната #${gameId || '...'}`} | 
        <span style={{ color: isThinking ? '#f59e0b' : '#4ade80', marginLeft: '4px' }}>{status}</span>
      </div>
      
      <Chessboard
        position={game.fen()}
        onPieceDrop={onDrop}
        boardOrientation={playerColor === 'black' ? 'black' : 'white'}
        arePiecesDraggable={!isThinking && !game.isGameOver()}
      />
      
      {game.isGameOver() && (
        <button 
          onClick={() => { setGame(new Chess()); setStatus('✅ Готов к игре'); }} 
          style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}
        >
          🔄 Начать заново
        </button>
      )}
    </div>
  );
}