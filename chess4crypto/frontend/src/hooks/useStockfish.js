// frontend/src/hooks/useStockfish.js
import { Chess } from 'chess.js';
import { useCallback } from 'react';

// Простой ИИ: случайный легальный ход + приоритет взятий
export function useSimpleAI() {
  const getBestMove = useCallback((fen) => {
    const game = new Chess(fen);
    if (game.isGameOver()) return null;

    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;

    // 1. Ищем ходы со взятием
    const captures = moves.filter(m => m.captured);
    if (captures.length > 0) {
      const randomCapture = captures[Math.floor(Math.random() * captures.length)];
      return randomCapture.san;
    }

    // 2. Если нет взятий — случайный легальный ход
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    return randomMove.san;
  }, []);

  return { getBestMove };
}