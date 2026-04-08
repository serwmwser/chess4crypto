import { useState } from 'react';
import { useWatchContractEvent } from 'wagmi';
import { CONTRACT_ADDRESS, chessABI } from '../utils/web3';

/**
 * Хук отслеживает событие DrawResolved из смарт-контракта.
 * При ничьей возвращает объект с данными о возврате токенов.
 */
export function useDrawListener() {
  const [drawInfo, setDrawInfo] = useState(null);

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: chessABI,
    eventName: 'DrawResolved',
    onLogs(logs) {
      if (logs && logs.length > 0) {
        const latestLog = logs[logs.length - 1];
        const { args } = latestLog;
        setDrawInfo({
          gameId: Number(args.gameId),
          refundPlayer1: args.refund1.toString(),
          refundPlayer2: args.refund2.toString(),
          timestamp: Date.now()
        });
      }
    },
    onError(err) {
      console.warn('⚠️ Не удалось отследить событие DrawResolved:', err.message);
    }
  });

  return drawInfo;
}