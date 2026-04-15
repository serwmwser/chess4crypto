import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

export default function ChessBoard({ gameId, userAddress, withBot = false, playerColor = 'white', initialTime = 300 }) {
  const { t } = useTranslation();
  const [moves, setMoves] = useState([]);
  const [viewIndex, setViewIndex] = useState(-1);
  
  const [timeW, setTimeW] = useState(initialTime);
  const [timeB, setTimeB] = useState(initialTime);
  const [status, setStatus] = useState(t('chess.ready'));
  const [isThinking, setIsThinking] = useState(false);
  
  const timerRef = useRef(null);
  const isAnalyzing = viewIndex < moves.length - 1;

  const currentFen = useMemo(() => {
    const temp = new Chess();
    for (let i = 0; i <= viewIndex; i++) temp.move(moves[i].san);
    return temp.fen();
  }, [moves, viewIndex]);

  const actualGame = useMemo(() => {
    const temp = new Chess();
    for (const m of moves) temp.move(m.san);
    return temp;
  }, [moves]);

  const isOver = actualGame.isGameOver();
  const actualTurn = actualGame.turn();
  const myColor = playerColor === 'black' ? 'b' : 'w';
  const fmt = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  useEffect(() => {
    if (isOver || isAnalyzing) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      if (actualTurn === 'w') setTimeW(p => Math.max(0, p - 1));
      else setTimeB(p => Math.max(0, p - 1));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [actualTurn, isOver, isAnalyzing, moves.length]);

  useEffect(() => {
    if (isOver || isAnalyzing) return;
    if (timeW === 0 && actualTurn === 'w') setStatus(t('chess.timeW'));
    if (timeB === 0 && actualTurn === 'b') setStatus(t('chess.timeB'));
  }, [timeW, timeB, actualTurn, isOver, isAnalyzing, t]);

  const makeBotMove = useCallback(() => {
    if (isOver || actualTurn !== 'b' || isAnalyzing) return;
    setIsThinking(true); setStatus(t('chess.think', { count: 3 }));
    
    let thinkCount = 3;
    const thinkInterval = setInterval(() => {
      thinkCount--;
      if (thinkCount > 0) setStatus(t('chess.think', { count: thinkCount }));
    }, 1000);

    setTimeout(() => {
      clearInterval(thinkInterval);
      try {
        const temp = new Chess(actualGame.fen());
        const possible = temp.moves({ verbose: true });
        if (!possible.length) { setIsThinking(false); return; }
        const best = possible.find(m => m.captured) || possible[Math.floor(Math.random() * possible.length)];
        setMoves(prev => [...prev, best]);
        setViewIndex(prev => prev + 1);
        setIsThinking(false);
      } catch(e) { console.error(e); setIsThinking(false); }
    }, 3000);
  }, [isOver, actualTurn, isAnalyzing, actualGame, t]);

  useEffect(() => {
    if (withBot && actualTurn === 'b' && !isThinking && !isOver && !isAnalyzing) makeBotMove();
    else if (!isOver && !isAnalyzing) setStatus(actualTurn === myColor ? t('chess.yourTurn') : t('chess.oppTurn'));
  }, [moves.length, withBot, myColor, isThinking, makeBotMove, isOver, isAnalyzing, actualTurn, t]);

  const onDrop = (src, dst) => {
    if (isThinking || isOver || actualTurn !== myColor || isAnalyzing) return false;
    try {
      const temp = new Chess(actualGame.fen());
      const move = temp.move({ from: src, to: dst, promotion: 'q' });
      if (!move) return false;
      setMoves(prev => [...prev, move]);
      setViewIndex(prev => prev + 1);
      if (temp.isCheckmate()) { clearInterval(timerRef.current); setStatus(t('chess.mate')); }
      else if (temp.isDraw()) { clearInterval(timerRef.current); setStatus(t('chess.draw')); }
      return true;
    } catch { return false; }
  };

  const goBack = () => setViewIndex(i => Math.max(-1, i - 1));
  const goForward = () => setViewIndex(i => Math.min(moves.length - 1, i + 1));
  const goLive = () => setViewIndex(moves.length - 1);

  const reset = () => {
    setMoves([]); setViewIndex(-1); setTimeW(initialTime); setTimeB(initialTime);
    setStatus(t('chess.ready')); setIsThinking(false); clearInterval(timerRef.current);
  };

  const historyPairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    historyPairs.push({ num: Math.floor(i / 2) + 1, white: moves[i].san, black: moves[i + 1]?.san || '' });
  }

  const canBack = viewIndex >= 0;
  const canForward = viewIndex < moves.length - 1;
  const canLive = isAnalyzing;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 500px', minWidth: '300px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', gap: '0.5rem' }}>
          <div style={{ flex: 1, padding: '0.75rem', background: actualTurn==='w' && !isAnalyzing ? '#3b82f6' : '#1e293b', color: actualTurn==='w' && !isAnalyzing ? '#000' : '#e2e8f0', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', transition: '0.3s', border: actualTurn==='w' && !isAnalyzing ? '2px solid #60a5fa' : '1px solid #334155' }}>
            ⚪ {t('chess.back').split(' ')[0]} {fmt(timeW)} {actualTurn==='w' && !isOver && !isAnalyzing && '⏳'}
          </div>
          <div style={{ flex: 1, padding: '0.75rem', background: actualTurn==='b' && !isAnalyzing ? '#3b82f6' : '#1e293b', color: actualTurn==='b' && !isAnalyzing ? '#000' : '#e2e8f0', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', transition: '0.3s', border: actualTurn==='b' && !isAnalyzing ? '2px solid #60a5fa' : '1px solid #334155' }}>
            ⚫ {t('chess.fwd').split(' ')[0]} {fmt(timeB)} {actualTurn==='b' && !isOver && !isAnalyzing && '⏳'}
          </div>
        </div>

        <Chessboard position={currentFen} onPieceDrop={onDrop} boardOrientation={playerColor==='black'?'black':'white'} arePiecesDraggable={!isThinking && !isOver && !isAnalyzing && (!withBot || actualTurn===myColor)} />

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
          <button onClick={goBack} disabled={!canBack} style={navBtn(!canBack)}>{t('chess.back')}</button>
          <button onClick={goForward} disabled={!canForward} style={navBtn(!canForward)}>{t('chess.fwd')}</button>
          <button onClick={goLive} disabled={!canLive} style={navBtn(!canLive, '#10b981')}>{t('chess.live')}</button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '0.5rem', padding: '0.5rem', background: isAnalyzing ? '#7c2d12' : '#1e293b', borderRadius: '8px', fontSize: '0.95rem', border: `1px solid ${isAnalyzing ? '#f97316' : '#334155'}` }}>
          🎮 {withBot ? t('chess.vsBotLabel') : t('chess.room', { id: gameId })} | <span style={{ color: isAnalyzing ? '#f97316' : isThinking ? '#f59e0b' : '#4ade80' }}>{isAnalyzing ? t('chess.analysis') : status}</span>
        </div>

        {isOver && !isAnalyzing && <button onClick={reset} style={{ marginTop: '1rem', padding: '0.75rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}>{t('chess.restart')}</button>}
      </div>

      <div style={{ flex: '1 1 250px', minWidth: '200px', background: '#1e293b', borderRadius: '10px', padding: '1rem', border: '1px solid #334155', maxHeight: '500px', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 0.75rem 0', color: '#f59e0b', fontSize: '1rem', textAlign: 'center' }}>{t('chess.history')}</h3>
        <div style={{ display: 'grid', gap: '0.25rem', fontSize: '0.9rem', fontFamily: 'monospace' }}>
          {historyPairs.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', fontStyle: 'italic' }}>{t('chess.noMoves')}</p>
          ) : (
            historyPairs.map((row, i) => {
              const whiteIdx = i * 2;
              const blackIdx = i * 2 + 1;
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr', gap: '0.25rem', alignItems: 'center', padding: '0.15rem 0.25rem', borderRadius: '4px', background: (whiteIdx <= viewIndex || blackIdx <= viewIndex) ? 'rgba(59, 130, 246, 0.15)' : 'transparent' }}>
                  <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>{row.num}.</span>
                  <span style={{ color: row.white && whiteIdx <= viewIndex ? '#4ade80' : '#64748b', fontWeight: whiteIdx <= viewIndex ? '600' : '400' }}>{row.white || ''}</span>
                  <span style={{ color: row.black && blackIdx <= viewIndex ? '#4ade80' : '#64748b', fontWeight: blackIdx <= viewIndex ? '600' : '400' }}>{row.black || ''}</span>
                </div>
              );
            })
          )}
        </div>
        {isAnalyzing && <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#f97316', textAlign: 'center', fontStyle: 'italic' }}>{t('chess.hint')}</p>}
      </div>
    </div>
  );
}

const navBtn = (disabled, color = '#3b82f6') => ({
  padding: '0.5rem 0.85rem', background: disabled ? '#475569' : color, color: '#fff',
  border: 'none', borderRadius: '6px', cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: '500', fontSize: '0.85rem', opacity: disabled ? 0.6 : 1, transition: 'all 0.2s'
});