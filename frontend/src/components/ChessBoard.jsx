// Вместо:
// import { useStockfish } from '../hooks/useStockfish';
// const { findBestMove, onBestMove } = useStockfish();

// Используйте:
import { useSimpleAI } from '../hooks/useStockfish';
const { getBestMove } = useSimpleAI();

// ...в useEffect для хода бота:
useEffect(() => {
  if (withBot && game.turn() === 'b' && !game.isGameOver()) {
    const timer = setTimeout(() => {
      const bestMoveSan = getBestMove(game.fen());
      if (bestMoveSan) {
        const gameCopy = new Chess(game.fen());
        gameCopy.move(bestMoveSan);
        setGame(gameCopy);
      }
    }, 500); // Задержка 0.5 сек для естественности
    return () => clearTimeout(timer);
  }
}, [game, withBot, getBestMove]);