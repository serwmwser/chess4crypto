import { useState, useEffect, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

export default function ChessBoard({ gameId, userAddress, withBot = false, playerColor = 'white', initialTime = 300 }) {
  const [game, setGame] = useState(new Chess());
  const [status, setStatus] = useState('✅ Готов к игре');
  const [isThinking, setIsThinking] = useState(false);
  const [timeW, setTimeW] = useState(initialTime);
  const [timeB, setTimeB] = useState(initialTime);
  
  // 📊 История и навигация
  const [moveHistory, setMoveHistory] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [analysisMode, setAnalysisMode] = useState(false);
  
  const timerRef = useRef(null);
  const gameRef = useRef(game);
  gameRef.current = game;

  const myColor = playerColor === 'black' ? 'b' : 'w';
  const turn = game.turn();
  const isOver = game.isGameOver();
  const fmt = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  // ⏱️ Таймер (только в реальной игре, не в анализе)
  useEffect(() => {
    if (isOver || analysisMode) { clearInterval(timerRef.current); return; }
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const currentTurn = gameRef.current.turn();
      if (currentTurn === 'w') setTimeW(p => Math.max(0, p - 1));
      else setTimeB(p => Math.max(0, p - 1));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [turn, isOver, analysisMode]);

  // ⏰ Проверка конца по времени
  useEffect(() => {
    if (isOver || analysisMode) return;
    if (timeW === 0 && turn === 'w') setStatus('⏰ Время белых вышло! Победа чёрных.');
    if (timeB === 0 && turn === 'b') setStatus('⏰ Время чёрных вышло! Победа белых.');
  }, [timeW, timeB, turn, isOver, analysisMode]);

  // 📝 Обновление истории ходов (при каждом новом ходе)
  useEffect(() => {
    const history = game.history({ verbose: true });
    setMoveHistory([...history]);
    // Если мы в анализе и добавился новый ход — обновляем индекс
    if (analysisMode && history.length > 0) {
      setCurrentMoveIndex(history.length - 1);
      setAnalysisMode(false);
    } else {
      setCurrentMoveIndex(history.length - 1);
    }
  }, [game.fen()]);

  // 🤖 Бот с задержкой 3 секунды
  const makeBotMove = useCallback(() => {
    if (isOver || turn !== 'b' || analysisMode) return;
    setIsThinking(true); 
    setStatus('⏳ Бот думает... (03)');
    
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
        let best = m.find(x => x.captured) || m[Math.floor(Math.random() * m.length)];
        const next = new Chess(gameRef.current.fen()); 
        next.move(best.san); 
        setGame(next);
      } catch(e) { console.error('Bot error:', e); }
      setIsThinking(false);
    }, 3000);
  }, [isOver, turn, analysisMode]);

  useEffect(() => {
    if (withBot && turn === 'b' && !isThinking && !isOver && !analysisMode) {
      makeBotMove();
    } else if (!isOver && !analysisMode) {
      setStatus(turn === myColor ? '✅ Ваш ход' : '⏳ Ход соперника...');
    }
  }, [game, withBot, myColor, isThinking, makeBotMove, isOver, analysisMode, turn]);

  // 🎯 Ход игрока
  const onDrop = (src, dst) => {
    if (isThinking || isOver || turn !== myColor || analysisMode) return false;
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
    } catch (e) { console.error('Move error:', e); return false; }
  };

  // 🔙 Навигация по истории
  const goToMove = (index) => {
    if (index < -1 || index >= moveHistory.length) return;
    
    const tempGame = new Chess();
    if (index >= 0) {
      for (let i = 0; i <= index; i++) {
        tempGame.move(moveHistory[i].san);
      }
    }
    setGame(tempGame);
    setCurrentMoveIndex(index);
    // Анализ включается, если мы НЕ на последнем ходе
    setAnalysisMode(index < moveHistory.length - 1);
  };

  const goToPrevious = () => goToMove(currentMoveIndex - 1);
  const goToNext = () => goToMove(currentMoveIndex + 1);
  const goToLive = () => goToMove(moveHistory.length - 1);

  const reset = () => { 
    setGame(new Chess()); 
    setTimeW(initialTime); 
    setTimeB(initialTime); 
    setStatus('✅ Готов к игре'); 
    setIsThinking(false); 
    setAnalysisMode(false);
    clearInterval(timerRef.current); 
  };

  // 📋 Форматирование истории: 1. e4 e5, 2. Nf3 Nc6
  const formattedHistory = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    const moveNum = Math.floor(i / 2) + 1;
    const whiteMove = moveHistory[i]?.san || '';
    const blackMove = moveHistory[i + 1]?.san || '';
    formattedHistory.push({ num: moveNum, white: whiteMove, black: blackMove });
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      
      {/* ♟️ Доска + таймеры */}
      <div style={{ flex: '1 1 500px', minWidth: '300px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', gap: '0.5rem' }}>
          <div style={{ flex: 1, padding: '0.75rem', background: turn==='w' && !analysisMode ? '#3b82f6' : '#1e293b', color: turn==='w' && !analysisMode ? '#000' : '#e2e8f0', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', transition: '0.3s', border: turn==='w' && !analysisMode ? '2px solid #60a5fa' : '1px solid #334155' }}>
            ⚪ Белые: {fmt(timeW)} {turn==='w' && !isOver && !analysisMode && '⏳'}
          </div>
          <div style={{ flex: 1, padding: '0.75rem', background: turn==='b' && !analysisMode ? '#3b82f6' : '#1e293b', color: turn==='b' && !analysisMode ? '#000' : '#e2e8f0', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', transition: '0.3s', border: turn==='b' && !analysisMode ? '2px solid #60a5fa' : '1px solid #334155' }}>
            ⚫ Чёрные: {fmt(timeB)} {turn==='b' && !isOver && !analysisMode && '⏳'}
          </div>
        </div>

        <Chessboard 
          position={game.fen()} 
          onPieceDrop={onDrop} 
          boardOrientation={playerColor==='black' ? 'black' : 'white'} 
          arePiecesDraggable={!isThinking && !isOver && !analysisMode && (!withBot || turn===myColor)} 
        />

        {/* 🔘 Кнопки навигации — ИСПРАВЛЕНА ЛОГИКА */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
          <button 
            onClick={goToPrevious} 
            disabled={currentMoveIndex < 0} 
            style={navBtnStyle(currentMoveIndex < 0)}
          >
            ← Назад
          </button>
          <button 
            onClick={goToNext} 
            disabled={currentMoveIndex >= moveHistory.length - 1} 
            style={navBtnStyle(currentMoveIndex >= moveHistory.length - 1)}
          >
            Вперёд →
          </button>
          <button 
            onClick={goToLive} 
            disabled={!analysisMode} 
            style={navBtnStyle(!analysisMode, '#10b981')}
          >
            ⏮ Текущая
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '0.5rem', padding: '0.5rem', background: analysisMode ? '#7c2d12' : '#1e293b', borderRadius: '8px', fontSize: '0.95rem', border: `1px solid ${analysisMode ? '#f97316' : '#334155'}` }}>
          🎮 {withBot ? 'vs Бот' : `#${gameId}`} | <span dangerouslySetInnerHTML={{__html: analysisMode ? '🔍 Анализ партии' : `<span style="color: ${isThinking ? '#f59e0b' : '#4ade80'}">${status}</span>`}} />
        </div>

        {isOver && !analysisMode && <button onClick={reset} style={{ marginTop: '1rem', padding: '0.75rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}>🔄 Начать заново</button>}
      </div>

      {/* 📋 Панель истории ходов — КЛАССИЧЕСКАЯ НУМЕРАЦИЯ */}
      <div style={{ flex: '1 1 250px', minWidth: '200px', background: '#1e293b', borderRadius: '10px', padding: '1rem', border: '1px solid #334155', maxHeight: '500px', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 0.75rem 0', color: '#f59e0b', fontSize: '1rem', textAlign: 'center' }}>📜 Ходы партии</h3>
        <div style={{ display: 'grid', gap: '0.25rem', fontSize: '0.9rem', fontFamily: 'monospace' }}>
          {formattedHistory.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', fontStyle: 'italic' }}>Ходов пока нет</p>
          ) : (
            formattedHistory.map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr', gap: '0.25rem', alignItems: 'center', padding: '0.15rem 0.25rem', borderRadius: '4px', background: i === Math.floor(currentMoveIndex / 2) ? 'rgba(59, 130, 246, 0.15)' : 'transparent' }}>
                <span style={{ color: '#94a3b8', fontWeight: 'bold', minWidth: '28px' }}>{row.num}.</span>
                <span style={{ 
                  color: row.white && (i * 2) <= currentMoveIndex ? '#4ade80' : '#64748b',
                  fontWeight: row.white && (i * 2) <= currentMoveIndex ? '600' : '400'
                }}>{row.white || ''}</span>
                <span style={{ 
                  color: row.black && (i * 2 + 1) <= currentMoveIndex ? '#4ade80' : '#64748b',
                  fontWeight: row.black && (i * 2 + 1) <= currentMoveIndex ? '600' : '400'
                }}>{row.black || ''}</span>
              </div>
            ))
          )}
        </div>
        {analysisMode && (
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#f97316', textAlign: 'center', fontStyle: 'italic' }}>
            🔍 Вы просматриваете прошлую позицию. Нажмите ⏮ чтобы вернуться к текущей.
          </p>
        )}
      </div>
    </div>
  );
}

// 🎨 Стили кнопок навигации
const navBtnStyle = (disabled, color = '#3b82f6') => ({
  padding: '0.5rem 0.85rem',
  background: disabled ? '#475569' : color,
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: '500',
  fontSize: '0.85rem',
  opacity: disabled ? 0.6 : 1,
  transition: 'all 0.2s'
});