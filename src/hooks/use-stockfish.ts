import { useEffect, useRef, useState, useCallback } from 'react';

export interface EngineLevel {
  category: 'beginner' | 'intermediate' | 'expert';
  skill: number;
  depth: number;
}

interface UseStockfishProps {
  level: EngineLevel;
  onBestMove?: (move: string) => void;
  mock?: boolean;
}

export function useStockfish({ level, onBestMove, mock = false }: UseStockfishProps) {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [thinking, setThinking] = useState(false);

  // Mock Engine for "Basic State" testing
  const runMockEngine = useCallback((fen: string) => {
    setThinking(true);
    // Simulate thinking delay
    setTimeout(() => {
      console.log('Mock engine finding move for:', fen);
      onBestMove?.('e2e4'); // Placeholder
      setThinking(false);
    }, 1000);
  }, [onBestMove]);

  useEffect(() => {
    if (mock) {
      setIsReady(true);
      return;
    }

    const worker = new Worker(new URL('../lib/chess/stockfish.worker.ts', import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const msg = e.data;
      if (typeof msg !== 'string') return;

      if (msg === 'ready') {
        setIsReady(true);
        // Initialize engine settings
        worker.postMessage('uci');
        worker.postMessage(`setoption name Skill Level value ${level.skill}`);
        worker.postMessage('isready');
      } else if (msg.startsWith('bestmove')) {
        const move = msg.split(' ')[1];
        onBestMove?.(move);
        setThinking(false);
      } else if (msg.includes('error')) {
        console.error('Stockfish Worker Error:', msg);
      }
    };

    worker.postMessage('init');

    return () => {
      worker.terminate();
    };
  }, [level.skill, onBestMove, mock]);

  const findBestMove = useCallback((fen: string) => {
    if (mock) {
      runMockEngine(fen);
      return;
    }

    if (!workerRef.current || !isReady) return;

    setThinking(true);
    workerRef.current.postMessage(`position fen ${fen}`);
    workerRef.current.postMessage(`go depth ${level.depth}`);
  }, [isReady, level.depth, mock, runMockEngine]);

  const stop = useCallback(() => {
    if (mock) return;
    workerRef.current?.postMessage('stop');
    setThinking(false);
  }, [mock]);

  return {
    isReady,
    thinking,
    findBestMove,
    stop,
  };
}
