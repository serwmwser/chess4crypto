import { Chessboard } from 'react-chessboard';

export default function ChessBoard() {
  return (
    <div className="chess-container">
      <h3>♟️ Игровая доска</h3>
      <div style={{ width: '400px', height: '400px', margin: '0 auto' }}>
        <Chessboard position="start" />
      </div>
      <p style={{ textAlign: 'center', marginTop: '1rem', color: '#888' }}>
        Игра будет доступна после создания вызова
      </p>
    </div>
  );
}